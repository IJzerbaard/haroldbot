function BDDFunction(bits, de) {
	this._bits = new Int32Array(bits);
	this._divideError = de;
}

BDDFunction.argument = function(argindex) {
	var bits = new Int32Array(32);
	for (var i = 0; i < bits.length; i++) {
		bits[i] = bdd.mk(((i ^ 31) << 6) | argindex, 0, -1);
	}
	return new BDDFunction(bits, 0);
}

BDDFunction.constant = function(value) {
	var bits = new Int32Array(32);
	for (var i = 0; i < bits.length; i++) {
		bits[i] = (value << (i ^ 31)) >> 31;
	}
	return new BDDFunction(bits, 0);
}

BDDFunction.to_constant = function(x) {
	var res = 0;
	for (var i = 0; i < 32; i++)
		res |= (1 << i) & x._bits[i];
	return res;
};

BDDFunction.not = function(x) {
	var bits = new Int32Array(32);
	for (var i = 0; i < bits.length; i++) {
		bits[i] = ~x._bits[i];
	}
	return new BDDFunction(bits, x._divideError);
}

BDDFunction.and = function(x, y) {
	var bits = new Int32Array(32);
	for (var i = 0; i < bits.length; i++) {
		bits[i] = bdd.and(x._bits[i], y._bits[i]);
	}
	return new BDDFunction(bits, bdd.or(x._divideError, y._divideError));
}

BDDFunction.or = function(x, y) {
	var bits = new Int32Array(32);
	for (var i = 0; i < bits.length; i++) {
		bits[i] = bdd.or(x._bits[i], y._bits[i]);
	}
	return new BDDFunction(bits, bdd.or(x._divideError, y._divideError));
}

BDDFunction.xor = function(x, y) {
	var bits = new Int32Array(32);
	for (var i = 0; i < bits.length; i++) {
		bits[i] = bdd.xor(x._bits[i], y._bits[i]);
	}
	return new BDDFunction(bits, bdd.or(x._divideError, y._divideError));
}

BDDFunction.mux = function(x, y, z) {
	var bits = new Int32Array(32);
	for (var i = 0; i < bits.length; i++) {
		bits[i] = bdd.mux(x._bits[i], y._bits[i], z._bits[i]);
	}
	return new BDDFunction(bits, bdd.or(bdd.or(x._divideError, y._divideError), z._divideError));
}

BDDFunction.add = function(x, y) {
	var timelimit = getmilitime() + 1000;
	var bits = new Int32Array(32);
	var carry = 0;
	for (var i = 0; i < bits.length; i++) {
		bits[i] = bdd.xorxor(x._bits[i], y._bits[i], carry, timelimit);
		if (i < 31) {
			carry = bdd.carry(carry, x._bits[i], y._bits[i], timelimit);
		}
	}
	return new BDDFunction(bits, bdd.or(x._divideError, y._divideError));
}

BDDFunction.add2 = function(x, y) {
	var bits = new Int32Array(32);
	var carry = 0;
	for (var i = 0; i < bits.length; i++) {
		var xy = bdd.xor(x._bits[i], y._bits[i]);
		bits[i] = bdd.xor(xy, carry);
		if (i < 31) {
			carry = bdd.carry(carry, x._bits[i], y._bits[i]);
		}
	}
	return new BDDFunction(bits, bdd.or(x._divideError, y._divideError));
}

BDDFunction.sub = function(x, y) {
	return BDDFunction.not(BDDFunction.add(BDDFunction.not(x), y));
}

BDDFunction.abs = function(x) {
	var m = BDDFunction.nthbit(x, 31);
	return BDDFunction.xor(BDDFunction.add(x, m), m);
}

BDDFunction.bzhi = function(x, y) {
	y = BDDFunction.and(y, BDDFunction.constant(255));
	var bits = new Int32Array(32);
	for (var i = 0; i < 32; i++) {
		var t = BDDFunction.le(y, BDDFunction.constant(i), false);
		bits[i] = bdd.and(~t._bits[0], x._bits[i]);
	}
	return new BDDFunction(bits, bdd.or(x._divideError, y._divideError));
}

BDDFunction.hor = function(x) {
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
	var bits = new Int32Array(x._bits);
	insertionSort(bits, function(a, b) {
		var va = bdd._v[a ^ (a >> 31)];
		var vb = bdd._v[b ^ (b >> 31)];
		return vb - va;
	});
	var or = 0;
	for (var i = 0; i < bits.length; i++) {
		if (i > 0 && bits[i] == bits[i - 1])
			continue;
		or = bdd.or(or, bits[i]);
	}
	for (var i = 0; i < bits.length; i++)
		bits[i] = or;
	return new BDDFunction(bits, x._divideError);
}

BDDFunction.eqz = function (x) {
	var t = BDDFunction.hor(x);
	return ~t._bits[0];
}

BDDFunction.eq = function(x, y) {
	return BDDFunction.not(BDDFunction.hor(BDDFunction.xor(x, y)));
}

BDDFunction.lt = function(x, y, signed) {
	var borrow = new Int32Array(32);
	borrow[0] = bdd.and(~x._bits[0], y._bits[0]);
	for (var i = 1; i < 31; i++) {
		var xy = bdd.xor(~x._bits[i], y._bits[i]);
		borrow[i] = bdd.or(bdd.and(borrow[i - 1], xy), bdd.and(~x._bits[i], y._bits[i]));
	}
	if (signed) {
		var xy = bdd.xor(x._bits[31], ~y._bits[31]);
		borrow[31] = bdd.or(bdd.and(borrow[30], xy), bdd.and(x._bits[31], ~y._bits[31]));
	}
	else {
		var xy = bdd.xor(~x._bits[31], y._bits[31]);
		borrow[31] = bdd.or(bdd.and(borrow[30], xy), bdd.and(~x._bits[31], y._bits[31]));
	}
	var b = borrow[31];
	for (var i = 0; i < 32; i++)
		borrow[i] = b;
	return new BDDFunction(borrow, bdd.or(x._divideError, y._divideError));
}

BDDFunction.gt = function(x, y, signed) {
	return BDDFunction.lt(y, x, signed);
}

BDDFunction.ge = function(x, y, signed) {
	return BDDFunction.not(BDDFunction.lt(x, y, signed));
}

BDDFunction.le = function(x, y, signed) {
	return BDDFunction.not(BDDFunction.lt(y, x, signed));
}

BDDFunction.nthbit = function(x, n) {
	var bits = new Int32Array(32);
	for (var i = 0; i < 32; i++)
		bits[i] = x._bits[n];
	return new BDDFunction(bits, x._divideError);
}

BDDFunction.shlc = function(x, n) {
	var bits = new Int32Array(32);
	for (var i = n; i < 32; i++)
		bits[i] = x._bits[i - n];
	return new BDDFunction(bits, x._divideError);
}

BDDFunction.shl = function(x, y) {
	for (var i = 0; i < 5; i++) {
		var mask = BDDFunction.nthbit(y, i);
		var s = BDDFunction.shlc(x, 1 << i);
		x = BDDFunction.mux(mask, x, s);
	}
	return x;
}

BDDFunction.shruc = function(x, n) {
	var bits = new Int32Array(32);
	for (var i = 0; i < 32 - n; i++)
		bits[i] = x._bits[i + n];
	return new BDDFunction(bits, x._divideError);
}

BDDFunction.shru = function(x, y) {
	for (var i = 0; i < 5; i++) {
		var mask = BDDFunction.nthbit(y, i);
		var s = BDDFunction.shruc(x, 1 << i);
		x = BDDFunction.mux(mask, x, s);
	}
	return x;
}

BDDFunction.shrsc = function(x, n) {
	var bits = new Int32Array(32);
	for (var i = 0; i < 32; i++)
		bits[i] = i + n < 32 ? x._bits[i + n] : x._bits[31];
	return new BDDFunction(bits, x._divideError);
}

BDDFunction.shrs = function(x, y) {
	for (var i = 0; i < 5; i++) {
		var mask = BDDFunction.nthbit(y, i);
		var s = BDDFunction.shrsc(x, 1 << i);
		x = BDDFunction.mux(mask, x, s);
	}
	return x;
}

BDDFunction.mul = function(x, y) {
	function countNonconstant(bits) {
		var count = 0;
		for (var i = 0; i < 32; i++) {
			if (bits[i] != 0 && bits[i] != -1)
				count++;
		}
		return count;
	}
	if (countNonconstant(x._bits) * countNonconstant(y._bits) > 256)
		throw "multiplication seems hard";
	var r = BDDFunction.constant(0);
	for (var i = 0; i < 32; i++) {
		r = BDDFunction.add(r, BDDFunction.and(x, BDDFunction.nthbit(y, i)));
		x = BDDFunction.shlc(x, 1);
	}
	return r;
}

BDDFunction.clmul = function(x, y) {
	function countNonconstant(bits) {
		var count = 0;
		for (var i = 0; i < 32; i++) {
			if (bits[i] != 0 && bits[i] != -1)
				count++;
		}
		return count;
	}
	if (countNonconstant(x._bits) * countNonconstant(y._bits) > 256)
		throw "multiplication seems hard";
	var r = BDDFunction.constant(0);
	for (var i = 0; i < 32; i++) {
		r = BDDFunction.xor(r, BDDFunction.and(x, BDDFunction.nthbit(y, i)));
		x = BDDFunction.shlc(x, 1);
	}
	return r;
}

BDDFunction.clpow = function(x, y) {
	var r = BDDFunction.constant(1);
	var one = BDDFunction.constant(1);
	for (var i = 0; i < 32; i++) {
		var ith = BDDFunction.nthbit(y, i);
		var p = BDDFunction.or(BDDFunction.and(x, ith), BDDFunction.and(one, BDDFunction.not(ith)));
		r = BDDFunction.clmul(r, p);
		x = BDDFunction.spread(x);
	}
	return r;
};

BDDFunction.ormul = function(x, y) {
	function countNonconstant(bits) {
		var count = 0;
		for (var i = 0; i < 32; i++) {
			if (bits[i] != 0 && bits[i] != -1)
				count++;
		}
		return count;
	}
	if (countNonconstant(x._bits) * countNonconstant(y._bits) > 256)
		throw "multiplication seems hard";
	var r = BDDFunction.constant(0);
	for (var i = 0; i < 32; i++) {
		r = BDDFunction.or(r, BDDFunction.and(x, BDDFunction.nthbit(y, i)));
		x = BDDFunction.shlc(x, 1);
	}
	return r;
}

BDDFunction.ez80mlt = function(x) {
	var a = BDDFunction.and(x, BDDFunction.constant(0xFF));
	var b = BDDFunction.and(BDDFunction.shruc(x, 8), BDDFunction.constant(0xFF));
	return BDDFunction.mul(a, b);
};

BDDFunction.spread = function(x) {
	var bits = new Int32Array(32);
	for (var i = 0; i < bits.length; i += 2)
		bits[i] = x._bits[i >> 1];
	return new BDDFunction(bits, x._divideError);
};

BDDFunction.ctz = function (x) {
	x = BDDFunction.and(BDDFunction.not(x), BDDFunction.add(x, BDDFunction.constant(-1)));
	return BDDFunction.popcnt(x);
}

BDDFunction.clz = function (x) {
	x = BDDFunction.or(x, BDDFunction.shruc(x, 1));
	x = BDDFunction.or(x, BDDFunction.shruc(x, 2));
	x = BDDFunction.or(x, BDDFunction.shruc(x, 4));
	x = BDDFunction.or(x, BDDFunction.shruc(x, 8));
	x = BDDFunction.or(x, BDDFunction.shruc(x, 16));
	return BDDFunction.popcnt(BDDFunction.not(x));
}

BDDFunction.popcnt = function (x) {
	var timelimit = getmilitime() + 1000;
	var one = BDDFunction.constant(1);
	var r = BDDFunction.shruc(x, 31);
	for (var i = 30; i >= 0; i--) {
		r = BDDFunction.add(r, BDDFunction.and(BDDFunction.shruc(x, i), one));
		if (getmilitime() > timelimit)
			throw "BDD timeout";
	}
	return r;
}

BDDFunction.rbit = function (x) {
	var bits = new Int32Array(32);
	for (var i = 0; i < 32; i++)
		bits[i] = x._bits[i ^ 31];
	return new BDDFunction(bits, x._divideError);
}

BDDFunction.divu = function (a, b) {
	var diverror = bdd.or(BDDFunction.eqz(b), bdd.or(a._divideError, b._divideError));
	var P = new Int32Array(64);
	for (var i = 0; i < 32; i++)
		P[i] = a._bits[i];
	var D = new Int32Array(64);
	for (var i = 0; i < 32; i++)
		D[i + 32] = b._bits[i];
	var bits = new Int32Array(32);

	for (var i = 31; i >= 0; i--) {
		for (var j = P.length - 1; j > 0; j--)
			P[j] = P[j - 1];
		P[0] = 0;
		var borrow = new Int32Array(64);
		var newP = new Int32Array(64);
		for (var j = 0; j < P.length; j++) {
			var ab = bdd.xor(P[j], D[j]);
			newP[j] = ab;
			if (j > 0) {
				newP[j] = bdd.xor(newP[j], borrow[j - 1]);
				borrow[j] = bdd.or(bdd.and(~ab, borrow[j - 1]), bdd.and(~P[j], D[j]));
			}
			else
				borrow[j] = bdd.and(~P[j], D[j]);
		}
		bits[i] = ~borrow[63];
		if (i != 0) {
			for (var j = 63; j > 0; j--)
				P[j] = bdd.or(bdd.and(newP[j], ~borrow[63]), bdd.and(P[j], borrow[63]));
		}
	}
	return new BDDFunction(bits, diverror);
}

BDDFunction.divs = function (a, b) {
	var sign = BDDFunction.xor(BDDFunction.nthbit(a, 31), BDDFunction.nthbit(b, 31));
	var div = BDDFunction.divu(BDDFunction.abs(a), BDDFunction.abs(b));
	return BDDFunction.xor(sign, BDDFunction.add(sign, div));
}

BDDFunction.dive = function (a, b) {
	var sa = BDDFunction.nthbit(a, 31);
	var sb = BDDFunction.nthbit(b, 31);
	var div = BDDFunction.divu(BDDFunction.xor(a, sa), BDDFunction.abs(b));
	return BDDFunction.xor(sb, BDDFunction.add(sb, BDDFunction.xor(sa, div)));
}

BDDFunction.remu = function (a, b) {
	var diverror = bdd.or(BDDFunction.eqz(b), bdd.or(a._divideError, b._divideError));
	var P = new Int32Array(64);
	for (var i = 0; i < 32; i++)
		P[i] = a._bits[i];
	var D = new Int32Array(64);
	for (var i = 0; i < 32; i++)
		D[i + 32] = b._bits[i];
	var bits = new Int32Array(32);

	for (var i = 31; i >= 0; i--) {
		for (var j = P.length - 1; j > 0; j--)
			P[j] = P[j - 1];
		P[0] = 0;
		var borrow = new Int32Array(64);
		var newP = new Int32Array(64);
		for (var j = 0; j < P.length; j++) {
			var ab = bdd.xor(P[j], D[j]);
			newP[j] = ab;
			if (j > 0) {
				newP[j] = bdd.xor(newP[j], borrow[j - 1]);
				borrow[j] = bdd.or(bdd.and(~ab, borrow[j - 1]), bdd.and(~P[j], D[j]));
			}
			else
				borrow[j] = bdd.and(~P[j], D[j]);
		}
		for (var j = 63; j > 0; j--)
			P[j] = bdd.or(bdd.and(newP[j], ~borrow[63]), bdd.and(P[j], borrow[63]));
	}

	for (var i = 0; i < 32; i++)
		bits[i] = P[i + 32];
	return new BDDFunction(bits, diverror);
}

BDDFunction.rems = function (a, b) {
	var sign = BDDFunction.xor(BDDFunction.nthbit(a, 31), BDDFunction.nthbit(b, 31));
	var div = BDDFunction.remu(BDDFunction.abs(a), BDDFunction.abs(b));
	return BDDFunction.xor(sign, BDDFunction.add(sign, div));
}

BDDFunction.reme = function (a, b) {
	var sa = BDDFunction.nthbit(a, 31);
	b = BDDFunction.abs(b);
	var div = BDDFunction.remu(BDDFunction.xor(a, sa), b);
	return BDDFunction.add(BDDFunction.and(sa, b), BDDFunction.xor(sa, div));
}

function bdd_mul64(a, b, signed) {
	function countNonconstant(bits) {
		var count = 0;
		for (var i = 0; i < bits.length; i++) {
			if (bits[i] != 0 && bits[i] != -1)
				count++;
		}
		return count;
	}
	if (countNonconstant(a) * countNonconstant(b) > 256)
		throw "multiplication seems hard";
	var c = new Int32Array(64);
	var a_sh = new Int32Array(64);
	for (var i = 0; i < 32; i++)
		a_sh[i] = a[i];
	for (var j = 0; j < 32; j++) {
		var m = b[j];
		if (m != 0) {
			var carry = 0;
			for (var i = 0; i < 64; i++) {
				var am = bdd.and(m, a_sh[i]);
				var nc = bdd.carry(am, c[i], carry);
				c[i] = bdd.xorxor(am, c[i], carry);
				carry = nc;
			}
		}
		for (var i = 63; i > 0; i--)
			a_sh[i] = a_sh[i - 1];
		a_sh[0] = 0;
	}
	if (signed) {
		var bfa = new BDDFunction(a, 0);
		var bfb = new BDDFunction(b, 0);
		var t1 = BDDFunction.and(bfa, BDDFunction.nthbit(bfb, 31));
		var t2 = BDDFunction.and(bfb, BDDFunction.nthbit(bfa, 31));
		var tophalf = new Int32Array(32);
		for (var i = 0; i < 32; i++)
			tophalf[i] = c[i + 32];
		var x = new BDDFunction(tophalf, 0);
		x = BDDFunction.sub(x, BDDFunction.add(t1, t2));
		for (var i = 0; i < 32; i++)
			c[i + 32] = x._bits[i];
	}
	return c;
};

BDDFunction.hmul = function (a, b, signed) {
	var prod = bdd_mul64(a._bits, b._bits, signed);
	var bits = new Int32Array(32);
	for (var i = 0; i < 32; i++)
		bits[i] = prod[i + 32];
	return new BDDFunction(bits, bdd.or(a._divideError, b._divideError));
};

BDDFunction.fixmul = function (a, b, q, signed) {
	// (64 bit)a * b >> q
	var prod = bdd_mul64(a._bits, b._bits, signed);
	var sh = 0;
	for (var i = 0; i < 5; i++) {
		if (q._bits[i] != 0 && q._bits[i] != -1)
			throw "fixed point math must have a fixed point";
		sh |= (1 << i) & q._bits[i];
	}
	var bits = new Int32Array(32);
	for (var i = 0; i < 32; i++)
		bits[i] = prod[i + sh];
	return new BDDFunction(bits, bdd.or(bdd.or(a._divideError, b._divideError), q._divideError));
};

BDDFunction.fixscale = function (a, x, y) {
	// (64 bit)a * x / y

	function div64_32(a, b) {
		var P = new Int32Array(128);
		for (var i = 0; i < 64; i++)
			P[i] = a[i];
		var D = new Int32Array(128);
		for (var i = 0; i < 32; i++)
			D[i + 64] = b[i];
		var bits = new Int32Array(64);

		for (var i = 63; i >= 0; i--) {
			for (var j = P.length - 1; j > 0; j--)
				P[j] = P[j - 1];
			P[0] = 0;
			var borrow = new Int32Array(128);
			var newP = new Int32Array(128);
			for (var j = 0; j < P.length; j++) {
				var ab = bdd.xor(P[j], D[j]);
				newP[j] = ab;
				if (j > 0) {
					newP[j] = bdd.xor(newP[j], borrow[j - 1]);
					borrow[j] = bdd.or(bdd.and(~ab, borrow[j - 1]), bdd.and(~P[j], D[j]));
				}
				else
					borrow[j] = bdd.and(~P[j], D[j]);
			}
			bits[i] = ~borrow[127];
			if (i != 0) {
				for (var j = 127; j > 0; j--)
					P[j] = bdd.or(bdd.and(newP[j], ~borrow[127]), bdd.and(P[j], borrow[127]));
			}
		}

		var res = new Int32Array(32);
		for (var i = 0; i < 32; i++)
			res[i] = bits[i];
		return res;
	}

	var diverror = bdd.or(BDDFunction.eqz(y), bdd.or(a._divideError, bdd.or(x._divideError, y._divideError)));
	return new BDDFunction(div64_32(bdd_mul64(a._bits, x._bits, false), y._bits), diverror);
}

BDDFunction.fixlerp = function (a, b, x, y) {
	// (a * x + b * y) / (x + y)
	// c = a * x
	// d = b * y
	// e = x + y

	function fullmul(a, b) {
		var prod = new Int32Array(64);
		var c = new Int32Array(64);
		var a_sh = new Int32Array(64);
		for (var i = 0; i < 32; i++)
			a_sh[i] = a[i];
		for (var j = 0; j < 32; j++) {
			var m = b[j];
			if (m != 0) {
				var carry = 0;
				for (var i = 0; i < 64; i++) {
					var am = bdd.and(m, a_sh[i]);
					var nc = bdd.carry(am, c[i], carry);
					c[i] = bdd.xorxor(am, c[i], carry);
					carry = nc;
				}
			}
			for (var i = 63; i > 0; i--)
				a_sh[i] = a_sh[i - 1];
			a_sh[0] = 0;
		}
		return prod;
	}

	var c = fullmul(a._bits, x._bits);
	var d = fullmul(b._bits, y._bits);
	var e = new Int32Array(64);
	
}

BDDFunction.quantU = function (f, q, varmap) {
	var bits = f._bits.slice();
	var de = f._divideError;
	for (var j = 0; j < q.length; j++) {
		var ql = varmap.indexOf(q[j]);
		var qh = ql;
		if (ql < 0)
			continue;
		while (j + 1 < q.length && varmap.indexOf(q[j + 1]) == qh + 1) {
			j++; qh++;
		}
		for (var i = 0; i < 32; i++)
			bits[i] = bdd.quantU(bits[i], ql, qh);
		de = bdd.quantU(de, ql, qh);
	}
	return new BDDFunction(bits, de);
};

BDDFunction.IdentifyPredicate = function(bit, negated) {
	// is of form (var & m) == c
	function isAndEqConst(x) {
		var m = 0, c = 0, vindex = -1;
		while (x != 0 && x != -1) {
			var inv = x >> 31;
			var v = bdd._v[x ^ inv];
			var lo = bdd._lo[x ^ inv] ^ inv;
			var hi = bdd._hi[x ^ inv] ^ inv;
			var vind = v & 63;
			if (vindex == -1) vindex = vind;
			else if (vindex != vind) return null;
			if (hi != 0 && lo != 0) return null;
			var vbit = (v >> 6) ^ 31;
			m |= 1 << vbit;
			if (lo == 0) {
				c |= 1 << vbit;
				x = hi;
			}
			else x = lo;
		}
		return [vindex, m, c];
	}

	var t = isAndEqConst(bit);
	if (t) {
		var x = new Variable(t[0]);
		if (t[1] != -1)
			x = new Binary(1, x, new Constant(t[1]));
		return new Binary(negated ? 21 : 20, x, new Constant(t[2]));
	}

	return null;
};

BDDFunction.prototype.AnalyzeTruth = function(data, root, vars, callback, debugcallback) {
	var res = data;

	var remap = new Array(2048);
	var index = 0;
	for (var i = 0; i < 32; i++) {
		for (var j = 0; j < vars.length; j++)
			if (data.quantified.indexOf(vars[j]) < 0)
				remap[(i << 6) + j] = index++;
	}

	if (this._divideError == 0) {
		if (this._bits[0] == 0) {
			res.false = {
				count: "#always"
			};
			if (root.type == 'bin' && root.op == 20 && vars.length > 0 && data.quantified.length == 0) {
				res.false.ext_examples = true;
				res.false.examples = function(ix) {
					var len = vars.length;
					var var_values = new Int32Array(len + 2);
					for (var i = 0; i < 32; i++)
						var_values[i % len] |= ((ix >>> i) & 1) << ~~(i / len);
					var_values[len] = root.l.eval(var_values);
					var_values[len + 1] = root.r.eval(var_values);
					return var_values;
				};
			}
		} else if (this._bits[0] == -1) {
			var resobj = {
				count: "#always",
				proof: undefined
			};
			if (root.type == 'bin' && data.quantified.length == 0) {
				var pf = new ProofFinder(root.op);
				pf.Search(root.l, root.r, function (flatproof) {
					resobj.proof = flatproof;
					callback();
				}, debugcallback);
			}
			res.true = resobj;
		} else {
			var bit0 = this._bits[0];
			res.true = {
				count: bdd.satCount(bit0, index, remap).toString(),
				examples: function(ix) {
					return bdd.indexedSat(bit0, ix, index, remap);
				}
			};
			var makeExamples = root.type == 'bin' && root.op == 20 && vars.length > 0 && data.quantified.length == 0;
			res.false = {
				count: bdd.satCount(~bit0, index, remap).toString(),
				ext_examples: makeExamples,
				examples: function(ix) {
					var values = bdd.indexedSat(~bit0, ix, index, remap);
					if (!makeExamples) return values;
					var len = vars.length;
					var res = new Int32Array(len + 2);
					for (var i = 0; i < len; i++)
						res[i] = values[i];
					res[len] = root.l.eval(res);
					res[len + 1] = root.r.eval(res);
					return res;
				}
			};

			if (this._bits.every(function (elem) { return elem == bit0; })) {
				var p = BDDFunction.IdentifyPredicate(bit0, false) || BDDFunction.IdentifyPredicate(~bit0, true);
				if (p) res.true.pred = p;
				var q = BDDFunction.IdentifyPredicate(~bit0, false) || BDDFunction.IdentifyPredicate(bit0, true);
				if (q) res.false.pred = q;
			}
		}
	}
	else if (this._divideError == -1) {
		res.diverror = {
			count: "#always"
		};
	}
	else {
		var de = this._divideError;
		res.diverror = {
			count: bdd.satCount(de, index, remap).toString(),
			examples: function(ix) {
				return bdd.indexedSat(de, ix, index, remap);
			}
		}
		var trueNotError = bdd.and(this._bits[0], ~de);
		var falseNotError = bdd.and(~this._bits[0], ~de);
		if (trueNotError != 0) {
			res.true = {
				count: bdd.satCount(trueNotError, index, remap).toString(),
				examples: function(ix) {
					return bdd.indexedSat(trueNotError, ix, index, remap);
				}
			};
		}
		if (falseNotError != 0) {
			res.false = {
				count: bdd.satCount(falseNotError, index, remap).toString(),
				examples: function(ix) {
					return bdd.indexedSat(falseNotError, ix, index, remap);
				}
			};
		}
	}
	return res;
}

BDDFunction.prototype.Identify = function(vars) {

	function isNicerConstant(x, y) {
		if (x == y) return false;
		if ((x & -x) == x || ((x + 1) & -(x + 1)) == (x + 1))
			return true;
		if (y >= -2 && y <= 15)
			return false;
		if (x >= -2 && x <= 15)
			return true;
		
		if (y < 0 && (-y & ~y) == 0 && -y <= 256)
			return false;
		if (x < 0 && (-x & ~x) == 0 && -x <= 256)
			return true;
		
		if (y <= 256 && y > 0 && ((y & y - 1) == 0 || (y + 1 & y) == 0))
			return false;
		if (x <= 256 && x > 0 && ((x & x - 1) == 0 || (x + 1 & x) == 0))
			return true;

		function numberOfLeadingZeros(a) {
			var i = 0;
			while (a != 0) {
				i++;
				a >>>= 1;
			}
			return 32 - i;
		}

		var x_leading = x < 0 ? numberOfLeadingZeros(-x) : numberOfLeadingZeros(x);
		var y_leading = y < 0 ? numberOfLeadingZeros(-y) : numberOfLeadingZeros(y);
		if (x_leading != y_leading)
			return x_leading > y_leading;
			
		var absx = x >> 31;
		absx = (x ^ absx) - absx;
		var absy = y >> 31;
		absy = (y ^ absy) - absy;
		
		return absx < absy;
	}

	function nicestConstant(v, and, or) {

		function bitCount(a) {
			a = a - ((a >>> 1) & 0x55555555);
			a = (a & 0x33333333) + ((a >>> 2) & 0x33333333);
			a = (a & 0x0f0f0f0f) + ((a >>> 4) & 0x0f0f0f0f);
			a = (a & 0x00ff00ff) + ((a >>> 8) & 0x00ff00ff);
			return (a & 0xff) + (a >>> 16);
		}

		function highestOneBit(a) {
			do {
				var b = a & (a - 1);
				if (b == 0) return a;
				a = b;
			} while (true);
		}

		var c = ~and | or;
		if (bitCount(c) < 10) {
			var best = v;
			for (var i = c & -c; i != 0; i = (i | ~c) + 1 & c) {
				if (isNicerConstant(v ^ i, best))
					best = v ^ i;
			}
			return best;
		}
		else {
			// try to make tiny constant
			var leastSet = v & ~c;
			if (leastSet >= 0 && leastSet <= 15)
				return leastSet;
			var mostSet = v | c;
			if (mostSet >= -2 && mostSet <= 15)
				return mostSet;
			// try to make small power of two
			if ((leastSet & leastSet - 1) == 0 && leastSet <= 256)
				return leastSet;
			// try to make negative power of two
			var highestUnsettableZero = highestOneBit(~mostSet);
			var unsetMask = highestUnsettableZero - 1;
			var unset = unsetMask & (c | ~v); // must be unsettable and is either unsettable or already zero or both
			if (unsetMask == unset) {
				var res = mostSet & ~unsetMask;
				if ((res | c) != (v | c)) {
					//debugger;
					alert("something broke");
				}
				return res;
			}
			return leastSet;
		}
	}

	function is_constant(bits) {
		var value = 0;
		for (var i = 0; i < bits.length; i++) {
			if (bits[i] != 0 && bits[i] != -1)
				return null;
			value |= (bits[i] & 1) << i;
		}
		return value;
	}

	// identify a function of the form
	// (OR[i = 0..n] (v[i] & a[i] ^ x[i])) & b | d
	function is_or(bits) {
		var a = new Int32Array(vars.length);
		var x = new Int32Array(vars.length);
		var b = 0;
		var d = 0;

		for (var i = 0; i < bits.length; i++) {
			var c = bits[i];
			if (c == 0) continue;
			if (c == -1) { d |= 1 << i; continue; }
			// not a constant, so don't kill the bit
			b |= 1 << i;
			// walk the chain
			do {
				var inv = c >> 31;
				var v = bdd._v[c ^ inv];
				var lo = bdd._lo[c ^ inv] ^ inv;
				var hi = bdd._hi[c ^ inv] ^ inv;
				// if the checked bit is not from the current bit index, it's not a nice bitwise function
				if (((v >> 6) ^ 31) != i)
					return null;
				// otherwise, unkill the bit from this var
				a[v & 63] |= 1 << i;

				/* hi == -1: or with v[i]
				   lo == -1: or with ~v[i]
				 * lo ==  0: and with v[i]  // don't use this
				 * hi ==  0: and with ~v[i] // don't use this
				*/

				if (hi == -1)
					c = lo;
				else if (lo == -1) {
					x[v & 63] |= 1 << i;
					c = hi;
				}
				else return null;
			} while (c != 0 && c != -1);
		}

		return [a, x, b, d];
	}

	// identify a function of the form
	// (XOR[i] v[i] & a[i]) ^ x & b | d
	function is_xor(bits) {
		var a = new Int32Array(vars.length);
		var x = 0, b = 0, d = 0;

		for (var i = 0; i < bits.length; i++) {
			var c = bits[i];
			if (c == 0) continue;
			if (c == -1) { d |= 1 << i; continue; }
			b |= 1 << i;
			do {
				var inv = c >> 31;
				var v = bdd._v[c ^ inv];
				var lo = bdd._lo[c ^ inv] ^ inv;
				var hi = bdd._hi[c ^ inv] ^ inv;
				// if the checked bit is not from the current bit index, it's not a nice bitwise function
				if (((v >> 6) ^ 31) != i)
					return null;
				a[v & 63] |= 1 << i;

				/* hi == ~lo, xor with v[i]
				   otherwise: not an xor
				*/
				if (hi == ~lo) {
					x ^= 1 << i;
					c = lo;
					if (hi != 0)
						x ^= 1 << i;
				}
				else return null;
			} while (c != 0 && c != -1);
		}

		return [a, x, b, d];
	}

	function format_or(r_or) {
		var a = r_or[0];
		var x = r_or[1];
		var b = r_or[2];
		var d = r_or[3];

		var ignored = ~b | d;

		var used_vars = 0;
		var complemented_vars = 0;
		for (var i = 0; i < a.length; i++) {
			if (a[i] != 0)
				used_vars++;
			if ((x[i] | ignored) == -1)
				complemented_vars++;
		}
		// TODO: if the number of complemented vars is bigger than uncomplemented vars, format as ~and(stuff)
		//if (complemented_vars > used_vars - complemented_vars) {
		{
			var res = null;
			for (var i = 0; i < a.length; i++) {
				if (a[i] == 0) continue;
				var v = new Variable(i);
				if ((x[i] | ignored) == -1)
					v = new Unary(0, v);
				else if (x[i] != 0)
					v = new Binary(ops.indexOf('^'), v, new Constant(nicestConstant(x[i], b, d)));

				res = res ? new Binary(ops.indexOf('|'), res, v) : v;
			}

			if ((b | d) != -1)
				res = new Binary(ops.indexOf('&'), res, new Constant(nicestConstant(b, -1, d)));

			if (d != 0)
				res = new Binary(ops.indexOf('|'), res, new Constant(d));
			return res;
		}
	}

	function format_invor(r_or) {
		var a = r_or[0];
		var x = r_or[1];
		var b = r_or[2];
		var d = r_or[3];

		var ignored = ~b | d;

		// TODO: if the number of complemented vars is bigger than uncomplemented vars, format as ~and(stuff)
		//if (complemented_vars > used_vars - complemented_vars) {
		{
			var res = null;
			for (var i = 0; i < a.length; i++) {
				if (a[i] == 0) continue;
				var v = new Variable(i);
				if ((x[i] | ignored) == -1)
					v = v; // no inversion
				else if ((x[i] & ~ignored) == 0)
					v = new Unary(0, v);
				else
					v = new Binary(ops.indexOf('^'), v, new Constant(nicestConstant(~x[i], b, d)));

				res = res ? new Binary(ops.indexOf('&'), res, v) : v;
			}

			if (~d != -1)
				res = new Binary(ops.indexOf('&'), res, new Constant(~d));

			if ((~b & ~d) != 0)
				res = new Binary(ops.indexOf('|'), res, new Constant(~b & ~d));
			return res;
		}
	}

	function format_xor(r_xor) {
		var a = r_xor[0];
		var x = r_xor[1];
		var b = r_xor[2];
		var d = r_xor[3];

		var ignored = ~b | d;

		var res = null;
		for (var i = 0; i < a.length; i++) {
			if (a[i] == 0) continue;
			var v = new Variable(i);
			if ((a[i] | ignored) != -1)
				v = new Binary(ops.indexOf('&'), v, new Constant(nicestConstant(a[i], b, d)));

			res = res ? new Binary(ops.indexOf('^'), res, v) : v;
		}

		if ((x & ~ignored) != 0)
			res = new Binary(ops.indexOf('^'), res, new Constant(nicestConstant(x, b, d)));

		if ((b | d) != -1)
			res = new Binary(ops.indexOf('&'), res, new Constant(nicestConstant(b, -1, d)));

		if (d != 0)
			res = new Binary(ops.indexOf('|'), res, new Constant(d));
		return res;
	}

	// identify a function of the form
	// v == c
	// returns: [v, c]
	function is_eqc(bits) {
		for (var i = 1; i < bits.length; i++)
			if (bits[0] != bits[i])
				return null;
		var v = bdd._v[bits[0] ^ (bits[0] >> 31)] & 63;
		var c = 0;
		var x = bits[0];
		for (var i = 0; i < 32; i++) {
			var inv = x >> 31;
			x ^= inv;
			var vv = bdd._v[x];
			if ((vv & 63) != v ||
				(vv >> 6) != i)
				return null;
			var lo = bdd._lo[x] ^ inv;
			var hi = bdd._hi[x] ^ inv;
			if (i == 31) {
				if (lo == 0)
					c |= 1;
				else if (lo != -1)
					return null;
				return [v, c];
			}
			if (lo == -1 || hi == -1 || (lo | hi) == 0)
				return null;
			if (lo == 0) {
				x = hi;
				c |= 1 << (i ^ 31);
			}
			else
				x = lo;
		}
		// unreachable
	}

	if (this._divideError != 0)
		return null;

	var r_constant = is_constant(this._bits);
	if (r_constant != null) {
		return new Constant(r_constant);
	}

	var r_or = is_or(this._bits);
	if (r_or)
		return format_or(r_or);

	var r_xor = is_xor(this._bits);
	if (r_xor)
		return format_xor(r_xor);

	var r_eqc = is_eqc(this._bits);
	if (r_eqc) {
		return new Binary(ops.indexOf('=='), new Variable(r_eqc[0]), new Constant(r_eqc[1]));
	}

	var invbits = new Int32Array(32);
	for (var i = 0; i < 32; i++)
		invbits[i] = ~this._bits[i];

	r_or = is_or(invbits);
	if (r_or)
		return format_invor(r_or);
};

BDDFunction.prototype.AnalyzeProperties = function(data, vars, callback) {

	function getLowestUnsigned(res, bits, mustBeZero, maxvar, remap) {
		try {
			var bitsCombined = -1;
			var val = 0;
			for (var i = 31; i >= 0; i--) {
				var tryZero = bdd.and(bitsCombined, ~bits[i]);
				if (tryZero != 0) {
					bitsCombined = tryZero;
					continue;
				}
				var tryOne = bdd.and(bitsCombined, bits[i]);
				if (tryOne != 0) {
					bitsCombined = tryOne;
					val |= 1 << i;
					continue;
				}
				// unreachable
				//debugger;
			}
			// only use it if not trivial
			if (val != 0 && val -1 && val != ~mustBeZero) {
				res.lowestUnsigned = {
					value: val,
					count: bdd.satCount(bitsCombined, maxvar, remap).toString(),
					examples: function(ix) {
						return bdd.indexedSat(bitsCombined, ix, maxvar, remap)
					}
				};
				return true;
			}
			return false;
		}
		catch (ex) {
			//debugger;
		}
	}

	function getHighestUnsigned(res, bits, mustBeOne, maxvar, remap) {
		try {
			var bitsCombined = -1;
			var val = 0;
			for (var i = 31; i >= 0; i--) {
				var tryOne = bdd.and(bitsCombined, bits[i]);
				if (tryOne != 0) {
					bitsCombined = tryOne;
					val |= 1 << i;
					continue;
				}
				var tryZero = bdd.and(bitsCombined, ~bits[i]);
				if (tryZero != 0) {
					bitsCombined = tryZero;
					continue;
				}
				// unreachable
				//debugger;
			}
			// only use it if not trivial
			if (val != -1 && val != 0 && val != mustBeOne) {
				res.highestUnsigned = {
					value: val,
					count: bdd.satCount(bitsCombined, maxvar, remap).toString(),
					examples: function(ix) {
						return bdd.indexedSat(bitsCombined, ix, maxvar, remap)
					}
				};
				return true;
			}
			return false;
		}
		catch (ex) {
			//debugger;
		}
	}

	function isBijection(bits) {
		try {
			var v0 = BDDFunction.argument(0);
			var v1 = BDDFunction.argument(1);
			var eq01 = BDDFunction.eq(v0, v1);
			var t = getmilitime() + 200;
			var xorself = bits.map(function (x) {
				return bdd.xor(x, bdd.incv(x), t);
			});
			var iseq = BDDFunction.eq(new BDDFunction(xorself, 0), BDDFunction.constant(0));
			return bdd.andIsZero(iseq._bits[0], ~eq01._bits[0]);
		}
		catch (err) { return null; }
	}

	if (!data.properties)
		data.properties = {};
	var res = data.properties;

	// "constant bit" masks
	var mustBeZero = 0;
	var mustBeOne = 0;
	for (var i = 0; i < 32; i++) {
		if (this._bits[i] == -1)
			mustBeOne |= 1 << i;
		else if (this._bits[i] == 0)
			mustBeZero |= 1 << i;
	}

	// if it's completely constant, properties will be uninteresting
	if ((mustBeOne | mustBeZero) == -1)
		return null;

	// try to find nibble mask
	if ((mustBeOne | mustBeZero) != 0) {
		var nibmask = "0x";
		for (var i = 28; i >= 0; i -= 4) {
			var isconst = mustBeZero | mustBeOne;
			if (((isconst >> i) & 15) == 15)
				nibmask += ((mustBeOne >> i) & 15).toString(16);
			else if (((isconst >> i) & 15) == 0)
				nibmask += '*';
			else {
				nibmask = null;
				break;
			}
		}
		// if no nibmask is possible or if it's all wildcards anyway, don't use it
		if (nibmask != null && nibmask != "0x********") {
			res.nibmask = nibmask;
		}
	}

	if (nibmask == null && (mustBeOne | mustBeZero) != 0) {
		// find bitmask
		var bitmask = "";
		for (var i = 31; i >= 0; i--) {
			if ((mustBeZero & (1 << i)) != 0)
				bitmask += '0';
			else if ((mustBeOne & (1 << i)) != 0)
				bitmask += '1';
			else
				bitmask += '*';
		}
		res.bitmask = bitmask;
	}
	
	var remap = new Array(2048);
	var index = 0;
	for (var i = 0; i < 32; i++) {
		for (var j = 0; j < vars.length; j++)
			remap[(i << 6) + j] = index++;
	}

	getLowestUnsigned(res, this._bits, mustBeZero, index, remap);

	getHighestUnsigned(res, this._bits, mustBeOne, index, remap);

	if (callback)
		callback(res);

	if (vars.length == 1 && !res.inverse && (mustBeOne | mustBeZero) == 0) {
		var bij = isBijection(this._bits);
		if (bij != null) {
			res.invertible = bij;
		}
	}

	return res;
};
