function ks() {
    this.x = [];
    this.varmap = [];
    this.nextvar = 1;
}

function ks(copy) {
    this.x = [];
    for (var i = 0; i < copy.x.length; i++)
        this.x[i] = new Int32Array(copy.x[i]);
    this.varmap = copy.nextvar.slice(0);
    this.nextvar = copy.nextvar;
}

ks.prototype.addvar = function (id) {
    if (this.varmap[id])
        return this.varmap[id];
    this.varmap[id] = this.nextvar++;
    for (var i = 0; i < this.x.length; i++)
        this.x[i].push(0);
};

ks.prototype.howellize = function() {
    function rank(x) {
        var m = (x - 1) & ~x;
        m = (m & 0x55555555) + ((m >>> 1) & 0x55555555);
        m = (m & 0x33333333) + ((m >>> 2) & 0x33333333);
        m = (m & 0x0f0f0f0f) + ((m >>> 4) & 0x0f0f0f0f);
        m = (m & 0x00ff00ff) + ((m >>> 8) & 0x00ff00ff);
        return (m & 0xff) + (m >>> 16);
    }

    function minrank(rows, i) {
        var smallestRank = 33;
        var index = -1;
        for (var j = 0; j < rows.length; j++) {
            var r = rank(rows[j][i]);
            if (r < smallestRank) {
                smallestRank = r;
                index = j;
            }
        }
        return rows[index];
    }

    function mul(x, y) {
        var a = (x & 0xffff) * (y & 0xffff);
        var b = (x >>> 16) * (y & 0xffff);
        var c = (x & 0xffff) * (y >>> 16);
        return a + ((b + c) << 16) | 0;
    }

    function inv(d) {
        var x = mul(d, d) + d - 1 | 0;
        var t = mul(d, x);
        x = mul(x, 2 - t);
        t = mul(d, x);
        x = mul(x, 2 - t);
        t = mul(d, x);
        x = mul(x, 2 - t);
        return x;
    }

    var j = 0;
    for (var i = 0; i < this.nextvar; i++) {
        // get rows with leading index i
        var R = this.x.filter(function (row, ign0, ign1) {
            if (row[i] == 0) return false;
            for (var k = 0; k < i; k++)
                if (row[i] != 0) return false;
            return true;
        });
        if (R.length == 0) continue;
        var r = minrank(R, i);
        var p = rank(r[i]);
        var u = r[i] >>> p;
        
    }
};

// make constraint that a = b + c
// 1 | a   b   c
// 0 | 1  -1  -1
ks.prototype.add = function (a, b, c) {
    var constraint = new Int32Array(this.nextvar);
    a = this.varmap[a];
    b = this.varmap[b];
    c = this.varmap[c];
    constraint[a] = 1;
    constraint[b] = -1;
    constraint[c] = -1;
    this.x.push(constraint);
};

// a = b + c where c is a constant
// 1 | a   b
//-c | 1  -1
ks.prototype.addc = function(a, b, c) {
    var constraint = new Int32Array(this.nextvar);
    a = this.varmap[a];
    b = this.varmap[b];
    constraint[a] = 1;
    constraint[b] = -1;
    constraint[0] = -c | 0;
    this.x.push(constraint);
};

// a = b * c where c is a constant
// 1 | a   b
// 0 | 1  -c
ks.prototype.mulc = function(a, b, c) {
    var constraint = new Int32Array(this.nextvar);
    a = this.varmap[a];
    b = this.varmap[b];
    constraint[a] = 1;
    constraint[b] = -c | 0;
    this.x.push(constraint);
};
