// functions that manipulate abstract values from the bitfield domain,
// values are characterized by 'z' and 'o',
// z is a mask of bits that are allowed to be 0
// o is a mask of bits that are allowed to be 1
// a concrete value x is contained in an abstract value (z,o) iff x & o == x && ~x & z == ~z
Bitfield = {
    union : function(a, b) {
        return { z: a.z | b.z, o: a.o | b.o };
    },

    invert: function(a) {
        return { z: a.o, o: a.z };
    },

    negate: function(a) {
        return this.add(this.invert(a), { z: ~1, o: 1 });
    },

    and: function(a, b) {
        return { z: a.z | b.z, o: a.o & b.o };
    },

    or: function(a, b) {
        return { z: a.z & b.z, o: a.o | b.o };
    },

    xor: function(a, b) {
        return { z: (a.z & b.z) | (a.o & b.o), o: (a.z & b.o) | (a.o & b.z) };
    },

    shl: function(a, b) {
        var z = 0;
        var o = 0;
        for (var i = 0; i < 32; i++) {
            var j = i ^ 31;
            if ((i & b.o) == i &&
                (j & b.z) == j) {
                // i is in (b)
                z |= ~(~a.z << i); // shift in ones
                o |= a.o << i;
            }
        }
        return { z: ~~z, o: ~~o };
    },

    shli: function(a, i) {
        return { z: ~(~a.z << i), o: a.o << i };
    },

    shru: function(a, b) {
        var z = 0;
        var o = 0;
        for (var i = 0; i < 32; i++) {
            var j = i ^ 31;
            if ((i & b.o) == i &&
                (j & b.z) == j) {
                // i is in (b)
                z |= ~(~a.z >>> i); // shift in ones
                o |= a.o >>> i;
            }
        }
        return { z: z, o: o };
    },

    shrs: function(a, b) {
        var n = { z: 0, o: 0 };
        var p = n;
        if ((a.z >> 31) == -1)
            p = this.shru(a, b);
        if ((a.o >> 31) == -1)
            n = this.invert(this.shru(this.invert(a), b));
        return { z: n.z | p.z, o: n.o | p.o };
    },

    roli: function(a, i) {
        return { z: (a.z << i) | (a.z >>> (i ^ 31)), o: (a.o << i) | (a.o >>> (i ^ 31)) };
    },

    rol: function(a, b) {
        var r = { z: 0, o: 0 };
        for (var i = 0; i < 32; i++) {
            var j = i ^ 31;
            if ((i & b.o) == i &&
                (j & b.z) == j) {
                // i is in (b)
                r = this.union(r, this.roli(a, i));
            }
        }
        return r;
    },

    ror: function(a, b) {
        var r = { z: 0, o: 0 };
        for (var i = 0; i < 32; i++) {
            var j = i ^ 31;
            if ((i & b.o) == i &&
                (j & b.z) == j) {
                // i is in (b)
                r = this.union(r, this.roli(a, i ^ 31));
            }
        }
        return r;
    },

    add: function(a, b) {
        var p = this.xor(a, b);
        var axb = p;
        var g = this.and(a, b);

        g = this.or(g, this.and(p, this.shli(g, 1)));
        p = this.and(p, this.shli(p, 1));

        g = this.or(g, this.and(p, this.shli(g, 2)));
        p = this.and(p, this.shli(p, 2));

        g = this.or(g, this.and(p, this.shli(g, 4)));
        p = this.and(p, this.shli(p, 4));

        g = this.or(g, this.and(p, this.shli(g, 8)));
        p = this.and(p, this.shli(p, 8));

        g = this.or(g, this.and(p, this.shli(g, 16)));
        p = this.and(p, this.shli(p, 16));

        return this.xor(axb, this.shli(g, 1));
    },

    sub: function(a, b) {
        return this.invert(this.add(this.invert(a), b));
    },

    mul: function(a, b) {
        var r = { z: -1, o: 0 };
        for (var i = 0; i < 32; i++) {
            var p = { z: 0, o: 0 };
            var n = p;
            if ((b.o & (1 << i)) != 0)
                p = this.add(r, a);
            if ((b.z & (1 << i)) != 0)
                n = r;
            r = this.union(n, p);
            a = this.shli(a, 1);
        }
        return r;
    },

    eq: function(a, b) {
        var a_fz = a.z & ~a.o;
        var a_fo = a.o & ~a.z;
        var b_fz = b.z & ~b.o;
        var b_fo = b.o & ~b.z;
        // if a has a forced zero where b has a forced one or vv, false
        var neq = ((a_fz & b_fo) | (a_fo & b_fz)) != 0;
        if (neq)
            return { z: -1, o: 0 };
        else if ((a.z ^ a.o) == -1 && (b.z ^ b.o) == -1 && a.o == b.o)
            // both constant and the same
            return { z: 0, o: -1 };
        else
            return { z: -1, o: -1 };
    },

    neq: function(a, b) {
        return this.invert(this.eq(a, b));
    },

    rangeToZO: function(l, u) {
        if ((l >>> 0) > (u >>> 0))
            throw "invalid interval";
        var d = l ^ u;
        d |= d >>> 1;
        d |= d >>> 2;
        d |= d >>> 4;
        d |= d >>> 8;
        d |= d >>> 16;
        return { z: ~l | d, o: u | d };
    },

    popcnt: function(a) {
        return this.rangeToZO(popcnt(~a.z), popcnt(a.o));
    },

    ntz: function(a) {
        return this.rangeToZO(ctz(a.o), ctz(~a.z));
    },

    nlz: function(a) {
        return this.rangeToZO(clz(a.o), clz(~a.z));
    },

    rbit: function(a) {
        return { z: rbit(a.z), o: rbit(a.o) };
    },

    mux: function(c, t, f) {
        return { z: (c.o & t.z) | (c.z & f.z), o: (c.o & t.o) | (c.z & f.o) };
    }
};