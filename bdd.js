var bdd = {
	reset: function() {
		if (!Int32Array.prototype.fill) {
			Int32Array.prototype.fill = function (value) {
				for (var i = 0; i < this.length; i++)
					this[i] = value;
			};
		}
		if (!Uint8Array.prototype.fill) {
			Uint8Array.prototype.fill = function (value) {
				for (var i = 0; i < this.length; i++)
					this[i] = value;
			};
		}
		if (!this._v) {
			this._v = new Int16Array(8388593);
			this._lo = new Int32Array(8388593);
			this._hi = new Int32Array(8388593);
			this._memo = new Int32Array(1048573);
			this._memokey1 = new Int32Array(1048573);
			this._memokey2 = new Int32Array(1048573);
			this._memokey3 = new Int32Array(1048573);
			this._memoop = new Uint8Array(1048573);
		}
		else {
			this._lo.fill(0);
			this._hi.fill(0);
			this._memoop.fill(0);
		}
	},

	viz: function () {
		var img = new Uint8ClampedArray(1920 * 4370 * 4);
		var streak = 0;
		for (var i = 0; i < this._hi.length; i++) {
			if (this._lo[i] != 0 ||
				this._hi[i] != 0) {
				if (streak > 1000) {
					img[i * 4 + 2] = 255;
				}
				else {
					img[i * 4] = 0xFF;
					img[i * 4 + 1] = streak * 16;
					img[i * 4 + 2] = (streak - 16) * 16;
				}
				img[i * 4 + 3] = 0xFF;
				streak++;
			}
			else {
				img[i * 4 + 3] = 0xFF;
				streak = 0;
			}
		}
		return new ImageData(img, 1920, 4370);
	},

	mk: function(v, lo, hi) {
		var invert = hi >> 31;
		hi ^= invert;
		lo ^= invert;
		if (lo == hi)
			return lo ^ invert;

		var hash2 = ((((v << 17) - v) ^ ((lo << 13) - lo) ^ ((hi << 16) + hi)) & 0x7fffffff) % 8388593;
		hash1 = hash2 & -8;
		var upper = (hash1 + 1000) % 8388593;

		if (hash1 == 0)
			hash1 = 1;
		if (hash2 == 0)
			hash2 = 1;

		if (this._lo[hash1] == lo && this._hi[hash1] == hi && this._v[hash1] == v)
			return hash1 ^ invert;
		if (this._lo[hash2] == lo && this._hi[hash2] == hi && this._v[hash2] == v)
			return hash2 ^ invert;
		for (var i = hash1; i != upper; i = (i + 1) % 8388593) {
			if (i == 0) continue;
			if ((this._lo[i] | this._hi[i]) == 0) break;
			if (this._lo[i] == lo && this._hi[i] == hi && this._v[i] == v)
				return i ^ invert;
		}


		if (this._lo[hash1] == 0 && this._hi[hash1] == 0) {
			this._lo[hash1] = lo;
			this._hi[hash1] = hi;
			this._v[hash1] = v;
			return hash1 ^ invert;
		}
		if (this._lo[hash2] == 0 && this._hi[hash2] == 0) {
			this._lo[hash2] = lo;
			this._hi[hash2] = hi;
			this._v[hash2] = v;
			return hash2 ^ invert;
		}
		for (var i = hash1; i != upper; i = (i + 1) % 8388593) {
			if (i == 0) continue;
			if ((this._lo[i] | this._hi[i]) == 0) {
				this._lo[i] = lo;
				this._hi[i] = hi;
				this._v[i] = v;
				return i ^ invert;
			}
		}

		throw "BDD full";
	},

	or: function(f, g) {
		return ~this.and(~f, ~g);
	},

	and: function(f, g) {
		if (f == -1 || g == -1 || f == 0 || g == 0 || f == ~g || f == g)
			return f & g;

		var key1 = Math.min(f, g);
		var key2 = Math.max(f, g);
		var hash = ((((key1 << 17) - key1) ^ ((key2 << 16) + key2)) & 0x7fffffff) % 1048573;
		if (this._memoop[hash] == 1 && this._memokey1[hash] == key1 && this._memokey2[hash] == key2)
			return this._memo[hash];

		var invf = f >> 31;
		var invg = g >> 31;
		var fv = this._v[f ^ invf];
		var gv = this._v[g ^ invg];
		var flo = this._lo[f ^ invf] ^ invf;
		var glo = this._lo[g ^ invg] ^ invg;
		var fhi = this._hi[f ^ invf] ^ invf;
		var ghi = this._hi[g ^ invg] ^ invg;

		var value = 0;
		if (fv == gv)
			value = this.mk(fv, this.and(flo, glo), this.and(fhi, ghi));
		else if (fv < gv)
			value = this.mk(fv, this.and(flo, g), this.and(fhi, g));
		else
			value = this.mk(gv, this.and(f, glo), this.and(f, ghi));

		this._memoop[hash] = 1;
		this._memokey1[hash] = key1;
		this._memokey2[hash] = key2;
		this._memo[hash] = value;

		return value;
	},

	xor: function(f, g) {
		if (f == 0 || g == 0 || f == -1 || g == -1 || f == g || f == ~g)
			return f ^ g;

		var invert = (f ^ g) >> 31;
		f ^= f >> 31;
		g ^= g >> 31;

		var key1 = Math.min(f, g);
		var key2 = Math.max(f, g);
		var hash = ((((key1 << 17) - key1) ^ ((key2 << 16) + key2) ^ 0xdeadbeef) & 0x7fffffff) % 1048573;
		if (this._memoop[hash] == 2 && this._memokey1[hash] == key1 && this._memokey2[hash] == key2)
			return this._memo[hash] ^ invert;

		var fv = this._v[f];
		var gv = this._v[g];
		var flo = this._lo[f];
		var glo = this._lo[g];
		var fhi = this._hi[f];
		var ghi = this._hi[g];

		var value = 0;
		if (fv == gv)
			value = this.mk(fv, this.xor(flo, glo), this.xor(fhi, ghi));
		else if (fv < gv)
			value = this.mk(fv, this.xor(flo, g), this.xor(fhi, g));
		else
			value = this.mk(gv, this.xor(f, glo), this.xor(f, ghi));

		this._memoop[hash] = 2;
		this._memokey1[hash] = key1;
		this._memokey2[hash] = key2;
		this._memo[hash] = value;

		return value ^ invert;
	},

	xorxor: function(f, g, h, timelimit) {
		function issink(x) {
			return (x == 0 || x == -1) ? 1 : 0;
		}

		if (f == ~g || f == ~h || g == ~h)
			return f ^ g ^ h;
		if ((f ^ (f >> 31)) == 0 ||
			(g ^ (g >> 31)) == 0) return this.xor(f ^ g, h);
		if ((h ^ (h >> 31)) == 0) return this.xor(f, g ^ h);
		if (issink(f) + issink(g) + issink(h) >= 2)
			return f ^ g ^ h;

		var invert = (f ^ g ^ h) >> 31;
		f ^= f >> 31;
		g ^= g >> 31;
		h ^= h >> 31;

		var key1 = Math.min(f, g, h);
		var key2 = Math.max(f, g, h);
		var key3 = (f ^ g ^ h) ^ (key1 ^ key2);
		var hash = ((((key1 << 17) - key1) ^ ((key2 << 16) + key2) ^ ((key3 << 19) - key3)) & 0x7fffffff) % 1048573;
		if (this._memoop[hash] == 4 && this._memokey1[hash] == key1 && this._memokey2[hash] == key2 && this._memokey3[hash] == key3)
			return this._memo[hash] ^ invert;

		if (timelimit && getmilitime() >= timelimit)
			throw "BDD timeout";

		var fv = this._v[f];
		var gv = this._v[g];
		var hv = this._v[h];
		var minv = Math.min(fv, gv, hv);
		var fl = f,
			fh = f,
			gl = g,
			gh = g,
			hl = h,
			hh = h;
		if (fv == minv) {
			fl = this._lo[f];
			fh = this._hi[f];
		}
		if (gv == minv) {
			gl = this._lo[g];
			gh = this._hi[g];
		}
		if (hv == minv) {
			hl = this._lo[h];
			hh = this._hi[h];
		}

		var res = this.mk(minv,
			this.xorxor(fl, gl, hl, timelimit),
			this.xorxor(fh, gh, hh, timelimit));
		this._memoop[hash] = 4;
		this._memokey1[hash] = f;
		this._memokey2[hash] = g;
		this._memokey3[hash] = h;
		this._memo[hash] = res;
		return res ^ invert;
	},

	carry: function(f, g, h, timelimit) {
		function isone(x) {
			return (x == -1) ? 1 : 0;
		}

		if (isone(f) + isone(g) + isone(h) >= 2 ||
			f == ~g && h == -1 ||
			f == ~h && g == -1 ||
			g == ~h && f == -1)
			return -1;
		if (f == ~g) return h;
		if (f == ~h) return g;
		if (g == ~h) return f;
		if (f == 0 || g == 0) return this.and(f | g, h);
		if (h == 0) return this.and(f, g);
		if (f == -1) return this.or(g, h);
		if (g == -1) return this.or(f, h);
		if (h == -1) return this.or(f, g);


		var key1 = Math.min(f, g, h);
		var key2 = Math.max(f, g, h);
		var key3 = (f ^ g ^ h) ^ (key1 ^ key2);
		var hash = ((((key1 << 17) - key1) ^ ((key2 << 16) + key2) ^ ((key3 << 19) - key3)) & 0x7fffffff) % 1048573;
		if (this._memoop[hash] == 5 && this._memokey1[hash] == key1 && this._memokey2[hash] == key2 && this._memokey3[hash] == key3)
			return this._memo[hash];

		if (timelimit && getmilitime() >= timelimit)
			throw "BDD timeout";

		var finv = f >> 31;
		var ginv = g >> 31;
		var hinv = h >> 31;
		var fv = this._v[f ^ finv];
		var gv = this._v[g ^ ginv];
		var hv = this._v[h ^ hinv];
		var minv = Math.min(fv, gv, hv);
		var fl = f,
			fh = f,
			gl = g,
			gh = g,
			hl = h,
			hh = h;
		if (fv == minv) {
			fl = this._lo[f ^ finv] ^ finv;
			fh = this._hi[f ^ finv] ^ finv;
		}
		if (gv == minv) {
			gl = this._lo[g ^ ginv] ^ ginv;
			gh = this._hi[g ^ ginv] ^ ginv;
		}
		if (hv == minv) {
			hl = this._lo[h ^ hinv] ^ hinv;
			hh = this._hi[h ^ hinv] ^ hinv;
		}

		var res = this.mk(minv,
			this.carry(fl, gl, hl, timelimit),
			this.carry(fh, gh, hh, timelimit));
		this._memoop[hash] = 5;
		this._memokey1[hash] = key1;
		this._memokey2[hash] = key2;
		this._memokey3[hash] = key3;
		this._memo[hash] = res;
		return res;
	},

	mux: function(f, g, h) {
		if (f == 0 || g == h)
			return g;
		else if (f == -1)
			return h;
		else if (g == ~h)
			return this.xor(f, g);
		else if (g == 0 || f == g)
			return this.and(f, h);
		else if (h == -1 || f == h)
			return ~this.and(~f, ~g);
		else if (g == -1)
			return ~this.and(f, ~h);
		else if (h == 0)
			return this.and(g, ~f);
		else if (f < 0)
			return this.mux(~f, h, g);

		var hash = ((((f << 17) - f) ^ ((g << 16) + g) ^ ((h << 19) - h)) & 0x7fffffff) % 1048573;
		if (this._memoop[hash] == 3 && this._memokey1[hash] == f && this._memokey2[hash] == g && this._memokey3[hash] == h)
			return this._memo[hash];

		var invg = g >> 31;
		var invh = h >> 31;
		var fv = this._v[f];
		var gv = this._v[g ^ invg];
		var hv = this._v[h ^ invh];
		var minv = Math.min(fv, gv, hv);
		var fl = f,
			fh = f,
			gl = g,
			gh = g,
			hl = h,
			hh = h;
		if (fv == minv) {
			fl = this._lo[f];
			fh = this._hi[f];
		}
		if (gv == minv) {
			gl = this._lo[g ^ invg] ^ invg;
			gh = this._hi[g ^ invg] ^ invg;
		}
		if (hv == minv) {
			hl = this._lo[h ^ invh] ^ invh;
			hh = this._hi[h ^ invh] ^ invh;
		}

		var rl = this.mux(fl, gl, hl),
			rh = this.mux(fh, gh, hh);
		var value = this.mk(minv, rl, rh);

		this._memoop[hash] = 3;
		this._memokey1[hash] = f;
		this._memokey2[hash] = g;
		this._memokey3[hash] = h;
		this._memo[hash] = value;

		return value;
	},

	compose: function(f, replace) {

		var compmemo = new Int32Array(1048573);
		var compmemokey = new Int32Array(1048573);

		for (var i = 0; i < 1048573; i++)
			compmemokey[i] = -2147483648;

		function comp(f, replace) {
			if (f == 0 || f == -1)
				return f;

			var hash = (f & 0x7fffffff) % 1048573;
			if (compmemokey[hash] == f)
				return compmemo[hash];

			var invf = f >> 31;
			var fv = this._v[f ^ invf];
			var fl = this._lo[f ^ invf] ^ invf;
			var fh = this._hi[f ^ invf] ^ invf;

			var r = replace[fv];
			if (r == 0)
				return comp(fl, replace);
			else if (r == 1)
				return comp(fh, replace);
			else {
				var l = comp(fl, replace);
				var h = comp(fh, replace);
				var res;
				if (r === void(0))
					res = this.mk(fv, l, h);
				else
					res = this.mux(f, l, h);

				compmemokey[hash] = f;
				compmemo[hash] = res;
				return res;
			}
		}

		return comp(f, replace);
	},

	satCount: function(f, maxvar, remap) {
		var D = [];
		var _v = this._v;
		var _lo = this._lo;
		var _hi = this._hi;

		function sat(x, prevvar) {
			if (x == 0)
				return new BigInt(0);
			else if (x == -1)
				return new BigInt(1).shl(maxvar - prevvar - 1);

			var invx = x >> 31;
			var v = _v[x ^ invx];
			var rv = remap[v];
			var res;
			if (D[x] === void(0)) {
				var lo = sat(_lo[x ^ invx] ^ invx, rv);
				var hi = sat(_hi[x ^ invx] ^ invx, rv);
				res = lo.add(hi);
				D[x] = res;
			} else res = D[x];
			return res.shl(rv - prevvar - 1);
		}

		return sat(f, -1);
	},

	indexedSat: function(f, index, maxvar, remap) {
		var _v = this._v;
		var _lo = this._lo;
		var _hi = this._hi;

		var havehad = 0;
		var res = new Int32Array(64);

		function findsat(cv, x, prevvar) {
			if (x == 0)
				return false;
			if (x == -1) {
				if (cv == 2048)
					return havehad++ == index;
				else {
					var nextvar = cv + 1;
					while (nextvar < 2048 && remap[nextvar] === void(0))
						nextvar++;
					if (findsat(nextvar, x, prevvar))
						return true;
					else if (findsat(nextvar, x, prevvar)) {
						res[cv & 63] |= 1 << ((cv >> 6) ^ 31);
						return true;
					} else return false;
				}
			}

			var invx = x >> 31;
			var v = _v[x ^ invx];

			var nextvar = cv + 1;
			while (nextvar < 2048 && remap[nextvar] === void(0))
				nextvar++;

			if (v == cv) {
				if (findsat(nextvar, _lo[x ^ invx] ^ invx, remap[v]))
					return true;
				else if (findsat(nextvar, _hi[x ^ invx] ^ invx, remap[v])) {
					res[v & 63] |= 1 << ((v >> 6) ^ 31);
					return true;
				} else return false;
			} else {
				if (findsat(nextvar, x, prevvar))
					return true;
				else if (findsat(nextvar, x, prevvar)) {
					res[cv & 63] |= 1 << ((cv >> 6) ^ 31);
					return true;
				} else return false;
			}
		}

		if (findsat(0, f, -1))
			return res;
		else
			return undefined;
	},

	lowestSat: function(f) {
		if (f == 0)
			return null;

		var res = new Int32Array(64);
		for (var i = 0; i < res.length; i++) {
			res[i] = 0;
		}
		if (f == -1)
			return res;

		while (f != -1) {
			var invf = f >> 31;
			var v = this._v[f ^ invf];
			var lo = this._lo[f ^ invf] ^ invf;
			var hi = this._hi[f ^ invf] ^ invf;
			if (lo == 0) {
				res[v & 63] |= 1 << ((v >> 6) ^ 31);
				f = hi;
			} else f = lo;
		}

		return res;
	},

	dump: function(f) {
		var D = [];
		var _v = this._v;
		var _lo = this._lo;
		var _hi = this._hi;

		function pdump(f) {
			if (D[f] === void(0)) {
				D[f] = true;
				if (f == 0 || f == -1)
					return "";
				var invf = f >> 31;
				var fv = _v[f ^ invf];
				var lo = _lo[f ^ invf] ^ invf;
				var hi = _hi[f ^ invf] ^ invf;
				var nodestring = f + " [label=\"x" + (fv & 63) + "_" + (fv >> 6 ^ 31) + "\"]";
				var lostring = f + " -> ";
				if (lo == 0)
					lostring += "0 [style=\"dashed\"];";
				else if (lo == -1)
					lostring += "1 [style=\"dashed\"];";
				else
					lostring += lo + " [style=\"dashed\"];";
				var histring = f + " -> ";
				if (hi == 0)
					histring += "0;";
				else if (hi == -1)
					histring += "1;";
				else
					histring += hi + ";";
				return pdump(lo) + pdump(hi) + nodestring + lostring + histring;
			} else return "";
		}

		return pdump(f);
	}
};