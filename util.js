var unops = ["~", "-", "$popcnt", "$ntz", "$nlz", "$reverse", "$abs", "$ez80mlt", "$blsi", "$blsr", "$blsmsk", "$tzmsk"];
//            1    2    3    4    5    6     7     8      9      10   11   12    13    14               20    21    22    23   24    25   26    27    28      30     31     32    33    34    35            40     41     42    43    44     45     46    47    48       49        50       51       52           55        56        57        58        59         60         61        62        63
var ops = [, "&", "|", "^", "+", "-", "<<", ">>", "<<<", ">>>", "/", "*", "/e", "%e", "/p" , , , , , , "==", "!=", "<=", "<", ">=", ">", "=>", "&&", "||", , ">>s", ">>u", "/s", "/u", "%s", "%u", , , , , "<=s", "<=u", "<s", "<u", ">=s", ">=u", ">s", ">u", "$bzhi", "$subus", "$pdep", "$pext", "$avg_up",,, "$min_u", "$min_s", "$max_u", "$max_s", "$hmul_u", "$hmul_s", "$clmul", "$clpow", "$ormul"];
var associative = [, true, true, true, true, false, false, false, false, false, false, true, false, false, false, , , , , , false, false, false, false, false, false, false, true, true, , false, false, false, false, false, false, , , , , false, false, false, false, false, false, false, false, false, false, true, false, false,,, true, true, true, true, false, false, true, false, true];
var commutative = [, true, true, true, true, false, false, false, false, false, false, true, false, false, false, , , , , , true, true, false, false, false, false, false, true, true, , false, false, false, false, false, false, , , , , false, false, false, false, false, false, false, false, false, false, false, false, true,,, true, true, true, true, true, true, true, false, true];

function precedence(index) {
    var pre = [ 0, 16, 14, 15, 18, 18, 17, 17, 17, 17, 19, 19, 20, 20, 20, 20, 0, 0, 0, 0, 13, 13, 13, 13, 13, 13, 11, 12, 12, 0, 17, 17, 19, 19, 19, 19, 20, 20, 20, 20, 13, 13, 13, 13, 13, 13, 13, 13];
    if (index < 0 || index > pre.length)
        return 20;
    return pre[index];
}

function isbinfunc(index) {
    return index >= 48;
}

function mayThrow(index) {
    return index == 10 || (index >= 12 && index <= 14) || (index >= 32 && index <= 35);
}

function binOpResultsInBool(index) {
    return (index >= 20 && index <= 28) || (index >= 40 && index <= 47);
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

var clz = (function () {
    function clz(x) {
        x |= x >>> 1;
        x |= x >>> 2;
        x |= x >>> 4;
        x |= x >>> 8;
        x |= x >>> 16;
        return popcnt(~x);
    }

    if (Math.clz32)
        return Math.clz32;
    else
        return clz;
})();

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

function clmul_u32_old(a, b) {
    var prod = 0;
    while (a != 0) {
        if ((a & 1) != 0)
            prod ^= b;
        a >>>= 1;
        b <<= 1;
    }
    return prod;
}

function clmul_u32(a, b) {
    var prod = 0;
    while (a != 0) {
        prod ^= Math.imul(b, (a & -a));
        a &= a - 1;
        prod ^= Math.imul(b, (a & -a));
        a &= a - 1;
        prod ^= Math.imul(b, (a & -a));
        a &= a - 1;
        prod ^= Math.imul(b, (a & -a));
        a &= a - 1;
    }
    return prod;
}

function clpow_u32(a, b) {
    var r = 1;
    while (b != 0) {
        if ((b & 1) != 0)
            r = clmul_u32(r, a);
        a &= 0xffff;
        a = (a | (a << 8)) & 0x00FF00FF;
        a = (a | (a << 4)) & 0x0F0F0F0F;
        a = (a | (a << 2)) & 0x33333333;
        a = (a | (a << 1)) & 0x55555555;
        b = b >>> 1;
    }
    return r;
}

function ormul_u32(a, b) {
    var prod = 0;
    while (a != 0) {
        prod |= Math.imul(b, (a & -a));
        a &= a - 1;
        prod |= Math.imul(b, (a & -a));
        a &= a - 1;
        prod |= Math.imul(b, (a & -a));
        a &= a - 1;
        prod |= Math.imul(b, (a & -a));
        a &= a - 1;
    }
    return prod;
}

function hmul_i32(a, b) {
    var h = hmul_u32(a, b);
    var t1 = (a >> 31) & b;
    var t2 = (b >> 31) & a;
    return h - t1 - t2 | 0;
}

function mulinv(d) {
    var x = Math.imul(d, d) + d - 1 | 0;
    x = Math.imul(x, 2 - Math.imul(d, x) | 0);
    x = Math.imul(x, 2 - Math.imul(d, x) | 0);
    x = Math.imul(x, 2 - Math.imul(d, x) | 0);
    return x;
}

function clinv(d) {
    var rem = d & -2;
    var x = 1;
    while (rem != 0) {
        var b = rem & -rem;
        x |= b;
        rem ^= Math.imul(d, b) & -2;
    }
    return x;
}

function clfactor(x) {
    var res = [x|0];
    do {
        x = res[res.length - 1];
        var w1 = popcnt(x) - 1;
        var w2 = 10000;
        var f2 = 0;
        for (var i = 1; i < 32; i++) {
            var xdiv = x;
            for (var j = i; j < 32; j += i)
                xdiv ^= x << j;
            var weight = popcnt(xdiv);
            if (weight < w2) {
                w2 = weight;
                f2 = 1 | (1 << i);
            }
        }
        var w3 = 10000;
        var f3 = null;
        if (x != Math.imul(x & 15, 0x11111111)) {
            for (var i = 1; i < 31; i++) {
                for (var j = i + 1; j < 32; j++) {
                    var f = 1 | (1 << i) | (1 << j);
                    var weight = popcnt(clmul_u32(x, clinv(f))) + 1;
                    if (weight < w3) {
                        w3 = weight;
                        f3 = f;
                    }
                }
            }
        }

        var minw = Math.min(w1, w2, w3);
        if (minw == w1)
            return res;
        else {
            var f = f2;
            if (minw == w3)
                f = f3;
            res[res.length - 1] = f;
            res.push(clmul_u32(x, clinv(f)));
        }
    } while (true);
}

function getmilitime() {
    return new Date().getTime();
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

if (!Int8Array.prototype.fill) {
  Int8Array.prototype.fill = Array.prototype.fill;
}