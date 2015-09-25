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
	var bits = new Int32Array(32);
	var carry = 0;
	for (var i = 0; i < bits.length; i++) {
		var xy = bdd.xor(x._bits[i], y._bits[i]);
		bits[i] = bdd.xor(xy, carry);
		if (i < 31)
			carry = bdd.or(bdd.and(xy, carry), bdd.and(x._bits[i], y._bits[i]));
	}
	return new BDDFunction(bits, bdd.or(x._divideError, y._divideError));
}

BDDFunction.sub = function(x, y) {
	return BDDFunction.not(BDDFunction.add(BDDFunction.not(x), y));
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
	var r = BDDFunction.constant(0);
	for (var i = 0; i < 32; i++) {
		r = BDDFunction.add(r, BDDFunction.and(x, BDDFunction.nthbit(y, i)));
		x = BDDFunction.shlc(x, 1);
	}
	return r;
}

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
	var one = BDDFunction.constant(1);
	var r = BDDFunction.shruc(x, 31);
	for (var i = 30; i >= 0; i--) {
		r = BDDFunction.add(r, BDDFunction.and(BDDFunction.shruc(x, i), one));
	}
	return r;
}

BDDFunction.reverse = function (x) {
	var bits = new Int32Array(32);
	for (var i = 0; i < 32; i++)
		bits[i] = x._bits[i ^ 31];
	return new BDDFunction(bits, x._divideError);
}

BDDFunction.prototype.AnalyzeTruth = function(root, vars, callback, debugcallback) {
	var res = new Object();
	res.varmap = vars;

	if (this._divideError == 0) {
		if (this._bits[0] == 0) {
			res["false"] = "always";
		} else if (this._bits[0] == -1) {
			var resobj = {
				count: "always",
				proof: undefined
			};
			if (root.type == 'bin') {
				var pf = new ProofFinder(root.op);
				pf.Search(root.l, root.r, function (flatproof) {
					resobj.proof = flatproof;
					callback();
				}, debugcallback);
			}
			res["true"] = resobj;
		} else {
			var remap = new Array(2048);
			var index = 0;
			for (var i = 0; i < 32; i++) {
				for (var j = 0; j < vars.length; j++)
					remap[(i << 6) + j] = index++;
			}
			var bit0 = this._bits[0];
			res["true"] = {
				count: bdd.satCount(bit0, index, remap).toString(),
				examples: function(ix) {
					return bdd.indexedSat(bit0, ix, index, remap);
				}
			};
			res["false"] = {
				count: bdd.satCount(~bit0, index, remap).toString(),
				examples: function(ix) {
					return bdd.indexedSat(~bit0, ix, index, remap);
				}
			};
		}
	}
	return res;
}

BDDFunction.prototype.Identify = function(vars) {

	function isNicerConstant(x, y) {
		if (x == y) return false;
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
					debugger;
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

	var r_constant = is_constant(this._bits);
	if (r_constant != null) {
		return new Constant(r_constant);
	}

	var r_or = is_or(this._bits);
	if (false && r_or) {
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
		// if the number of complemented vars is bigger than uncomplemented vars, format as ~and(stuff)
		if (complemented_vars > used_vars - complemented_vars) {
			var res = null;
			for (var i = 0; i < a.length; i++) {
				if (a[i] == 0) continue;
				var v = new Variable(i);
				debugger;
			}
		}
		else {
			var res = null;
			for (var i = 0; i < a.length; i++) {
				if (a[i] == 0) continue;
				var v = new Variable(i);
				if ((x[i] | ignored) == -1)
					v = new Unary(v, 0);
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

};
