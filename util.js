var unops = ["~", "-", "$popcnt", "$ntz", "$nlz", "$reverse", "$abs", "$ez80mlt"];
//            1    2    3    4    5    6     7     8      9      10   11                   20    21    22    23   24    25   26    27    28      30     31     32    33    34    35            40     41     42    43    44     45     46    47            55        56        57        58        59         60
var ops = [, "&", "|", "^", "+", "-", "<<", ">>", "<<<", ">>>", "/", "*", , , , , , , , , "==", "!=", "<=", "<", ">=", ">", "=>", "&&", "||", , ">>s", ">>u", "/s", "/u", "%s", "%u", , , , , "<=s", "<=u", "<s", "<u", ">=s", ">=u", ">s", ">u", ,,,,,,, "$min_u", "$min_s", "$max_u", "$max_s", "$hmul_u", "$hmul_s"];
var associative = [, true, true, true, true, false, false, false, false, false, false, true, , , , , , , , , false, false, false, false, false, false, false, true, true, , false, false, false, false, false, false, , , , , false, false, false, false, false, false, false, false, ,,,,,,, true, true, true, true, false, false];
var commutative = [, true, true, true, true, false, false, false, false, false, false, true, , , , , , , , , true, true, false, false, false, false, false, true, true, , false, false, false, false, false, false, , , , , false, false, false, false, false, false, false, false, ,,,,,,, true, true, true, true, true, true];

function precedence(index) {
    var pre = [ 0, 16, 14, 15, 18, 18, 17, 17, 17, 17, 19, 19, 20, 20, 0, 0, 0, 0, 0, 0, 13, 13, 13, 13, 13, 13, 11, 12, 12, 0, 17, 17, 19, 19, 19, 19, 20, 20, 20, 20, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13];
    if (index < 0 || index > pre.length)
        return 20;
    return pre[index];
}
function toHexUnsigned(x) {
    x = (x|0) + 0xFFFFFFFF + 1;
    var s = x.toString(16);
    return "0x" + ("00000000" + s).substr(-8);
}
function toHexUnsignednopf(x) {
    x = (x|0) + 0xFFFFFFFF + 1;
    var s = x.toString(16);
    return ("00000000" + s).substr(-8);
}
function toDecUnsigned(x) {
    x = (x|0) + 0xFFFFFFFF + 1;
    return x.toString(10);
}
function toDecSigned(x) {
   return (x|0).toString(10);
}
function formatConstant(x) {
    x |= 0;
    if (x >= -2 && x <= 16)
        return toDecSigned(x);
    if ((x & (x - 1)) == 0 && x > 0 && x <= 256)
        return toDecSigned(x);
    var nx = -x;
    if ((nx & (nx - 1)) == 0 && nx > 0 && nx <= 256)
        return toDecSigned(x);
    if (x < 0)
        return toHexUnsigned(x);
    var s = (x | 0).toString(16);
    if (s.length == 2 || s.length == 4 || s.length == 8) return "0x" + s;
    if (s.length == 3) return "0x0" + s;
    return "0x" + ("00000000" + s).substr(-8);
}

function popcnt(x) {
    x = x - ((x >>> 1) & 0x55555555);
    x = (x & 0x33333333) + ((x >>> 2) & 0x33333333);
    x = ((x + (x >>> 4)) & 0x0F0F0F0F) * 0x01010101;
    return x >>> 24;
}

function ctz(x) {
    return popcnt(x - 1 & ~x);
}

function clz(x) {
    x |= x >>> 1;
    x |= x >>> 2;
    x |= x >>> 4;
    x |= x >>> 8;
    x |= x >>> 16;
    return popcnt(~x);
}

function rbit(x) {
    x = ((x & 0x55555555) << 1) | ((x >>> 1) & 0x55555555);
    x = ((x & 0x33333333) << 2) | ((x >>> 2) & 0x33333333);
    x = ((x & 0x0F0F0F0F) << 4) | ((x >>> 4) & 0x0F0F0F0F);
    x = ((x & 0x00FF00FF) << 8) | ((x >>> 8) & 0x00FF00FF);
    return (x << 16) | (x >>> 16);
}

function hmul_u32(a, b) {
    var ah = (a >> 16) & 0xffff, al = a & 0xffff;
    var bh = (b >> 16) & 0xffff, bl = b & 0xffff;
    var l = al * bl;
    var m = ah * bl + al * bh;
    var h = ah * bh;
    m += l >>> 16;
    h += m >>> 16;
    return h >>> 0;
}

function hmul_i32(a, b) {
    var h = hmul_u32(a, b);
    var t1 = (a >> 31) & b;
    var t2 = (b >> 31) & a;
    return h - t1 - t2 | 0;
}

function insertionSort(array, cmp) {
    for (var i = 1; i < array.length; i++) {
        var j = i;
        while (j > 0 && cmp(array[j - 1], array[j]) > 0) {
            var temp = array[j];
            array[j] = array[j - 1];
            array[j - 1] = temp;
            j = j - 1;
        }
    }
}

var randh = Math.random();
function randomColor() {
    do {
        randh += 0.618033988749895;
        randh %= 1;
    } while (randh > 0.75 && randh < 0.945);
    return hsvToRgb(randh, 0.5, 0.95);
}
function hsvToRgb(h, s, v) {
    var r, g, b, i, f, p, q, t;
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }
    r = Math.floor(r * 255);
    g = Math.floor(g * 255);
    b = Math.floor(b * 255);
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}
function urlParam(name) {
    var results = new RegExp('[\\?&]' + name + '=([^&#]*)').exec(window.location.href);
    if (results == null) {
        return null;
    }
    else {
        return results[1] || 0;
    }
}
var entityMap = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': '&quot;',
    "'": '&#39;',
    "/": '&#x2F;'
};
function escapeHtml(string) {
    return String(string).replace(/[&<>"'\/]/g, function (s) {
        return entityMap[s];
    });
}
ls = {
    getCookie:function(c_name){
        var i,x,y,ARRcookies=document.cookie.split(";");
        for (i=0;i<ARRcookies.length;i++) {
            x=ARRcookies[i].substr(0,ARRcookies[i].indexOf("="));
            y=ARRcookies[i].substr(ARRcookies[i].indexOf("=")+1);
            x=x.replace(/^\s+|\s+$/g,"");
            if (x==c_name)
                return unescape(y);
        }
    },
    setCookie:function(c_name,value,exdays) {
        var exdate=new Date();
        exdate.setDate(exdate.getDate() + exdays);
        var c_value=escape(value) + ((exdays==null) ? "" : "; expires="+exdate.toUTCString());
        document.cookie=c_name + "=" + c_value;
    },
    support:function(){
        try{
           return 'localStorage' in window && window['localStorage'] !== null;
        }catch(e){
           return false;
        }
    },
    get:function(name){
        if(this.support()){
           return localStorage.getItem(name);
        }
        return this.getCookie(name);
    },
    set:function(name,value){
        if(this.support()){
            localStorage.setItem(name,value);
        }else{
            this.setCookie(name,value,30);
        }
    }
}

// some polyfill stuff

Math.imul = Math.imul || function(a, b) {
  var ah = (a >>> 16) & 0xffff;
  var al = a & 0xffff;
  var bh = (b >>> 16) & 0xffff;
  var bl = b & 0xffff;
  // the shift by 0 fixes the sign on the high part
  // the final |0 converts the unsigned value into a signed value
  return ((al * bl) + (((ah * bl + al * bh) << 16) >>> 0)|0);
};