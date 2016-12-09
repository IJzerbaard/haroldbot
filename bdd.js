var bdd = {
	reset: function() {
		if (!this._v) {
			this._v = new Int32Array(8388593);
			this._lo = new Int32Array(8388593);
			this._hi = new Int32Array(8388593);
			this._memo = new Int32Array(1048573);
			this._memokey1 = new Int32Array(1048573);
			this._memokey2 = new Int32Array(1048573);
			this._memokey3 = new Int32Array(1048573);
			this._memoop = new Int32Array(1048573);
		}
		else {
			if (!Int32Array.prototype.fill) {
				Int32Array.prototype.fill = function (value) {
					for (var i = 0; i < this.length; i++)
						this[i] = value;
				};
			}
			this._lo.fill(0);
			this._hi.fill(0);
			this._memoop.fill(0);
		}
	},

	mk: function(v, lo, hi) {
		var invert = hi >> 31;
		hi ^= invert;
		lo ^= invert;
		if (lo == hi)
			return lo ^ invert;

		var hash1 = ((((v << 17) - v) ^ ((lo << 13) - lo) ^ ((hi << 7) - hi)) & 0x7fffffff) % 8388593;
		var hash2 = ((((v << 16) + v) ^ ((lo << 8) + lo) ^ ((hi << 4) + hi)) & 0x7fffffff) % 8388593;
		var upper = (hash2 + 100000) % 8388593;

		if (this._lo[hash1] == lo && this._hi[hash1] == hi && this._v[hash1] == v)
			return hash1 ^ invert;
		if (this._lo[hash2] == lo && this._hi[hash2] == hi && this._v[hash2] == v)
			return hash2 ^ invert;
		for (var i = hash2; this._lo[i] != 0 && this._hi[i] != 0 && i != upper; i = (i + 1) % 8388593) {
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
		for (var i = hash2; i != upper; i = (i + 1) % 8388593) {
			if (this._lo[i] == 0 && this._hi[i] == 0 && i != 0) {
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
		var minv = Math.min(Math.min(fv, gv), hv);
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
				if (r == undefined)
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
			var res;
			if (D[x] == undefined) {
				var lo = sat(_lo[x ^ invx] ^ invx, remap[v]);
				var hi = sat(_hi[x ^ invx] ^ invx, remap[v]);
				res = lo.add(hi);
				D[x] = res;
			} else res = D[x];
			return res.shl(remap[v] - prevvar - 1);
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
					while (nextvar < 2048 && remap[nextvar] == undefined)
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
			while (nextvar < 2048 && remap[nextvar] == undefined)
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
			if (D[f] == undefined) {
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