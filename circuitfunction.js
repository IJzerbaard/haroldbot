function CFunction(bits, de) {
	this._bits = new Int32Array(bits);
	this._divideError = de;
}

CFunction.argument = function(argindex) {
	var bits = circuit.argument(argindex);
	return new CFunction(bits, 0);
}

CFunction.constant = function(value) {
	var bits = new Int32Array(32);
	for (var i = 0; i < bits.length; i++) {
		bits[i] = (value << (i ^ 31)) >> 31;
	}
	return new CFunction(bits, 0);
}

CFunction.not = function(x) {
	var bits = new Int32Array(32);
	for (var i = 0; i < bits.length; i++) {
		bits[i] = ~x._bits[i];
	}
	return new CFunction(bits, x._divideError);
}

CFunction.rbit = function(x) {
	var bits = new Int32Array(32);
	for (var i = 0; i < bits.length; i++) {
		bits[i] = x._bits[bits.length - i - 1];
	}
	return new CFunction(bits, x._divideError);
}

CFunction.and = function(x, y) {
	var bits = new Int32Array(32);
	for (var i = 0; i < bits.length; i++) {
		bits[i] = circuit.and(x._bits[i], y._bits[i]);
	}
	return new CFunction(bits, circuit.or(x._divideError, y._divideError));
}

CFunction.or = function(x, y) {
	var bits = new Int32Array(32);
	for (var i = 0; i < bits.length; i++) {
		bits[i] = circuit.or(x._bits[i], y._bits[i]);
	}
	return new CFunction(bits, circuit.or(x._divideError, y._divideError));
}

CFunction.xor = function(x, y) {
	var bits = new Int32Array(32);
	for (var i = 0; i < bits.length; i++) {
		bits[i] = circuit.xor(x._bits[i], y._bits[i]);
	}
	return new CFunction(bits, circuit.or(x._divideError, y._divideError));
}

CFunction.mux = function(x, y, z) {
	var bits = new Int32Array(32);
	for (var i = 0; i < bits.length; i++) {
		bits[i] = circuit.mux(y._bits[i], z._bits[i], x._bits[i]);
	}
	return new CFunction(bits, circuit.or_big(x._divideError, y._divideError, z._divideError));
}

CFunction.add2 = function(x, y) {
	var bits = new Int32Array(32);
	var carry = 0;
	for (var i = 0; i < 32; i++) {
		var a = x._bits[i];
		var b = y._bits[i];
		var ab = circuit.and(a, b);
		var aob = circuit.or(a, b);
		var abc = circuit.and(ab, carry);
		var nabc = circuit.and(~aob, ~carry);
		carry = circuit.or(circuit.and(carry, aob), ab);
		bits[i] = circuit.and(circuit.or(~carry, abc), ~nabc);
	}
	return new CFunction(bits, circuit.or(x._divideError, y._divideError));
}

CFunction.add = function(x, y) {
	var bits = new Int32Array(32);
	var carry = 0;
	for (var i = 0; i < 32; i++) {
		var a = x._bits[i];
		var b = y._bits[i];
		var axb = circuit.xor(a, b);
		bits[i] = circuit.xor(axb, carry);
		carry = circuit.carry(a, b, carry);
	}
	return new CFunction(bits, circuit.or(x._divideError, y._divideError));
}

CFunction.sub = function(x, y) {
	return CFunction.not(CFunction.add(CFunction.not(x), y));
}

CFunction.bzhi = function(x, y) {
	y = CFunction.and(y, CFunction.constant(255));
	var bits = new Int32Array(32);
	for (var i = 0; i < 32; i++) {
		var t = CFunction.le(y, CFunction.constant(i), false);
		bits[i] = circuit.and(~t._bits[0], x._bits[i]);
	}
	return new CFunction(bits, circuit.or(x._divideError, y._divideError));
}

CFunction.hor = function(x) {
	var or = circuit.or_big(x._bits.slice());
	var bits = new Int32Array(32);
	for (var i = 0; i < bits.length; i++)
		bits[i] = or;
	return new CFunction(bits, x._divideError);
}

CFunction.eq = function(x, y) {
	return CFunction.not(CFunction.hor(CFunction.xor(x, y)));
}

CFunction.lt = function(x, y, signed) {
	var borrow = new Int32Array(32);
	borrow[0] = circuit.and(~x._bits[0], y._bits[0]);
	for (var i = 1; i < 31; i++) {
		var xy = circuit.xor(~x._bits[i], y._bits[i]);
		borrow[i] = circuit.or(circuit.and(borrow[i - 1], xy), circuit.and(~x._bits[i], y._bits[i]));
	}
	if (signed) {
		var xy = circuit.xor(x._bits[31], ~y._bits[31]);
		borrow[31] = circuit.or(circuit.and(borrow[30], xy), circuit.and(x._bits[31], ~y._bits[31]));
	}
	else {
		var xy = circuit.xor(~x._bits[31], y._bits[31]);
		borrow[31] = circuit.or(circuit.and(borrow[30], xy), circuit.and(~x._bits[31], y._bits[31]));
	}
	var b = borrow[31];
	for (var i = 0; i < 32; i++)
		borrow[i] = b;
	return new CFunction(borrow, circuit.or(x._divideError, y._divideError));
}

CFunction.gt = function(x, y, signed) {
	return CFunction.lt(y, x, signed);
}

CFunction.ge = function(x, y, signed) {
	return CFunction.not(CFunction.lt(x, y, signed));
}

CFunction.le = function(x, y, signed) {
	return CFunction.not(CFunction.lt(y, x, signed));
}

CFunction.nthbit = function(x, n) {
	var bits = new Int32Array(32);
	for (var i = 0; i < 32; i++)
		bits[i] = x._bits[n];
	return new CFunction(bits, x._divideError);
}

CFunction.shlc = function(x, n) {
	var bits = new Int32Array(32);
	for (var i = n; i < 32; i++)
		bits[i] = x._bits[i - n];
	return new CFunction(bits, x._divideError);
}

CFunction.shl = function(x, y) {
	for (var i = 0; i < 5; i++) {
		var mask = CFunction.nthbit(y, i);
		var s = CFunction.shlc(x, 1 << i);
		x = CFunction.mux(mask, x, s);
	}
	return x;
}

CFunction.shruc = function(x, n) {
	var bits = new Int32Array(32);
	for (var i = 0; i < 32 - n; i++)
		bits[i] = x._bits[i + n];
	return new CFunction(bits, x._divideError);
}

CFunction.shru = function(x, y) {
	for (var i = 0; i < 5; i++) {
		var mask = CFunction.nthbit(y, i);
		var s = CFunction.shruc(x, 1 << i);
		x = CFunction.mux(mask, x, s);
	}
	return x;
}

CFunction.shrsc = function(x, n) {
	var bits = new Int32Array(32);
	for (var i = 0; i < 32; i++)
		bits[i] = i + n < 32 ? x._bits[i + n] : x._bits[31];
	return new CFunction(bits, x._divideError);
}

CFunction.shrs = function(x, y) {
	for (var i = 0; i < 5; i++) {
		var mask = CFunction.nthbit(y, i);
		var s = CFunction.shrsc(x, 1 << i);
		x = CFunction.mux(mask, x, s);
	}
	return x;
}

CFunction.spread = function(x) {
	var bits = new Int32Array(32);
	for (var i = 0; i < 32; i += 2)
		bits[i] = x._bits[i >> 1];
	return new CFunction(bits, x._divideError);
}

CFunction.mul = function(x, y) {
	var r = CFunction.constant(0);
	for (var i = 0; i < 32; i++) {
		r = CFunction.add(r, CFunction.and(x, CFunction.nthbit(y, i)));
		x = CFunction.shlc(x, 1);
	}
	return r;
}

CFunction.clmul = function(x, y) {
	var r = CFunction.constant(0);
	for (var i = 0; i < 32; i++) {
		r = CFunction.xor(r, CFunction.and(x, CFunction.nthbit(y, i)));
		x = CFunction.shlc(x, 1);
	}
	return r;
}

CFunction.clpow = function(x, y) {
	var r = CFunction.constant(1);
	var one = CFunction.constant(1);
	for (var i = 0; i < 32; i++) {
		var ith = CFunction.nthbit(y, i);
		var p = CFunction.mux(ith, one, x);
		r = CFunction.clmul(r, p);
		x = CFunction.spread(x);
	}
	return r;
}

CFunction.ormul = function(x, y) {
	var r = CFunction.constant(0);
	for (var i = 0; i < 32; i++) {
		r = CFunction.or(r, CFunction.and(x, CFunction.nthbit(y, i)));
		x = CFunction.shlc(x, 1);
	}
	return r;
}

CFunction.ez80mlt = function(x) {
	var a = CFunction.and(x, CFunction.constant(0xFF));
	var b = CFunction.and(CFunction.shruc(x, 8), CFunction.constant(0xFF));
	return CFunction.mul(a, b);
}

CFunction.abs = function(x) {
	var m = CFunction.nthbit(x, 31);
	return CFunction.xor(CFunction.add(x, m), m);
}

CFunction.eqz = function (x) {
	var t = CFunction.hor(x);
	return ~t._bits[0];
}

CFunction.divu = function (a, b) {
	var diverror = circuit.or(CFunction.eqz(b), circuit.or(a._divideError, b._divideError));
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
			var ab = circuit.xor(P[j], D[j]);
			newP[j] = ab;
			if (j > 0) {
				newP[j] = circuit.xor(newP[j], borrow[j - 1]);
				borrow[j] = circuit.or(circuit.and(~ab, borrow[j - 1]), circuit.and(~P[j], D[j]));
			}
			else
				borrow[j] = circuit.and(~P[j], D[j]);
		}
		bits[i] = ~borrow[63];
		if (i != 0) {
			for (var j = 63; j > 0; j--)
				P[j] = circuit.or(circuit.and(newP[j], ~borrow[63]), circuit.and(P[j], borrow[63]));
		}
	}
	return new CFunction(bits, diverror);
}

CFunction.divs = function (a, b) {
	var sign = CFunction.xor(CFunction.nthbit(a, 31), CFunction.nthbit(b, 31));
	var div = CFunction.divu(CFunction.abs(a), CFunction.abs(b));
	return CFunction.xor(sign, CFunction.add(sign, div));
}

CFunction.dive = function (a, b) {
	var sa = CFunction.nthbit(a, 31);
	var sb = CFunction.nthbit(b, 31);
	var div = CFunction.divu(CFunction.xor(a, sa), CFunction.abs(b));
	return CFunction.xor(sb, CFunction.add(sb, CFunction.xor(sa, div)));
}

CFunction.divupony = function (a, b) {
	var bnz = CFunction.hor(b);
	var az = CFunction.and(a, bnz);
	return new CFunction(CFunction.divu(az, CFunction.or(b, CFunction.not(bnz)))._bits, 0);
}

CFunction.remu = function (a, b) {
	var diverror = circuit.or(CFunction.eqz(b), circuit.or(a._divideError, b._divideError));
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
			var ab = circuit.xor(P[j], D[j]);
			newP[j] = ab;
			if (j > 0) {
				newP[j] = circuit.xor(newP[j], borrow[j - 1]);
				borrow[j] = circuit.or(circuit.and(~ab, borrow[j - 1]), circuit.and(~P[j], D[j]));
			}
			else
				borrow[j] = circuit.and(~P[j], D[j]);
		}
		for (var j = 63; j > 0; j--)
			P[j] = circuit.or(circuit.and(newP[j], ~borrow[63]), circuit.and(P[j], borrow[63]));
	}

	for (var i = 0; i < 32; i++)
		bits[i] = P[i + 32];
	return new CFunction(bits, diverror);
}

CFunction.rems = function (a, b) {
	var sign = CFunction.xor(CFunction.nthbit(a, 31), CFunction.nthbit(b, 31));
	var div = CFunction.remu(CFunction.abs(a), CFunction.abs(b));
	return CFunction.xor(sign, CFunction.add(sign, div));
}

CFunction.reme = function (a, b) {
	var sa = CFunction.nthbit(a, 31);
	b = CFunction.abs(b);
	var div = CFunction.remu(CFunction.xor(a, sa), b);
	return CFunction.add(CFunction.and(sa, b), CFunction.xor(sa, div));
}

function cf_mul64(a, b, signed) {
	var c = new Int32Array(64);
	var a_sh = new Int32Array(64);
	for (var i = 0; i < 32; i++)
		a_sh[i] = a[i];
	for (var j = 0; j < 32; j++) {
		var m = b[j];
		if (m != 0) {
			var carry = 0;
			for (var i = 0; i < 64; i++) {
				var am = circuit.and(m, a_sh[i]);
				var ac = circuit.and(am, c[i]);
				var aoc = circuit.or(am, c[i]);
				var acc = circuit.and(ac, carry);
				var nacc = circuit.and(~aoc, ~carry);
				carry = circuit.or(circuit.and(carry, aoc), ac);
				c[i] = circuit.and(circuit.or(~carry, acc), ~nacc);
			}
		}
		for (var i = 63; i > 0; i--)
			a_sh[i] = a_sh[i - 1];
		a_sh[0] = 0;
	}
	if (signed) {
		var bfa = new CFunction(a, 0);
		var bfb = new CFunction(b, 0);
		var t1 = CFunction.and(bfa, CFunction.nthbit(bfb, 31));
		var t2 = CFunction.and(bfb, CFunction.nthbit(bfa, 31));
		var tophalf = new Int32Array(32);
		for (var i = 0; i < 32; i++)
			tophalf[i] = c[i + 32];
		var x = new CFunction(tophalf, 0);
		x = CFunction.sub(x, CFunction.add(t1, t2));
		for (var i = 0; i < 32; i++)
			c[i + 32] = x._bits[i];
	}
	return c;
};

CFunction.hmul = function(x, y, signed) {
	var prod = cf_mul64(x._bits, y._bits, signed);
	var bits = new Int32Array(32);
	for (var i = 0; i < 32; i++)
		bits[i] = prod[i + 32];
	return new CFunction(bits, circuit.or(x._divideError, y._divideError));
};

CFunction.ctz = function (x) {
	x = CFunction.and(CFunction.not(x), CFunction.add(x, CFunction.constant(-1)));
	return CFunction.popcnt(x);
};

CFunction.clz = function (x) {
	x = CFunction.or(x, CFunction.shruc(x, 1));
	x = CFunction.or(x, CFunction.shruc(x, 2));
	x = CFunction.or(x, CFunction.shruc(x, 4));
	x = CFunction.or(x, CFunction.shruc(x, 8));
	x = CFunction.or(x, CFunction.shruc(x, 16));
	return CFunction.popcnt(CFunction.not(x));
};

CFunction.popcnt = function(x) {
	var bits = [[]];
	for (var i = 0; i < 32; i++)
		bits[0].push(x._bits[i]);
	while (!bits[5]) {
		var i = 0;
		while (i < 5 && bits[i].length < 3) i++;
		if (i < 5) {
			var b1 = bits[i].pop();
			var b2 = bits[i].pop();
			var b3 = bits[i].pop();
			bits[i].unshift(circuit.xor(circuit.xor(b1, b2), b3));
			if (!bits[i + 1]) bits[i + 1] = [];
			bits[i + 1].unshift(circuit.carry(b1, b2, b3));
		}
		else {
			i = 0;
			while (i < 5 && bits[i].length < 2) i++;
			var b1 = bits[i].pop();
			var b2 = bits[i].pop();
			bits[i].unshift(circuit.xor(b1, b2));
			if (!bits[i + 1]) bits[i + 1] = [];
			bits[i + 1].unshift(circuit.and(b1, b2));
		}
	}
	var r = new Int32Array(32);
	r[0] = bits[0][0];
	r[1] = bits[1][0];
	r[2] = bits[2][0];
	r[3] = bits[3][0];
	r[4] = bits[4][0];
	r[5] = circuit.and_big(x._bits.slice());
	return new CFunction(r, x._divideError);
};

CFunction.popcnt2 = function(x) {
	var one = CFunction.constant(1);
	var r = CFunction.shruc(x, 31);
	for (var i = 30; i >= 0; i--) {
		r = CFunction.add(r, CFunction.and(CFunction.shruc(x, i), one));
	}
	return r;
};

CFunction.prototype.sat = function(varcount) {
	if (!varcount)
		varcount = 4;
	if (this._bits[0] == 0)
		return null;
	var sat = new SAT();
	circuit.to_cnf(this._bits[0], sat);
	var res = sat.solve();
	if (res) {		
		var values = new Int32Array(varcount);
		for (var i = 0; i < varcount * 32; i++) {
			if (res[i + 1] == 1)
				values[i >> 5] |= 1 << (i & 31);
		}
		return values;
	}
	return null;
};

CFunction.prototype.AnalyzeTruth = function(data, root, vars, callback, debugcallback) {
	var res = data;
	res.msg = "Using SAT fallback";

	function getModelWithBan(bit, bannedModel) {
		var sat = new SAT();
		circuit.to_cnf(bit, sat);
		if (bannedModel) {
			var clause = [];
			for (var i = 0; i < 32 * vars.length; i++) {
				if ((bannedModel[i >> 5] & (1 << (i & 31))) == 0)
					clause.push(i + 1);
				else
					clause.push(~(i + 1));
			}
			sat.addClause(clause);
		}
		var model_raw = sat.solve();
		if (model_raw != null) {
			var model = new Int32Array(64);
			for (var i = 1; i <= 32 * 64; i++) {
				if (model_raw[i] == 1)
					model[(i - 1) >> 5] |= 1 << ((i - 1) & 31);
			}
			return model;
		}
		return void(0);
	}

	if (this._divideError == 0) {
		var sat = new SAT();
		circuit.to_cnf(~this._bits[0], sat);
		var fmodel_raw = sat.solve();
		sat = new SAT();
		circuit.to_cnf(this._bits[0], sat);
		var tmodel_raw = sat.solve();

		var can_be_true = tmodel_raw != null;
		var can_be_false = fmodel_raw != null;

		var fmodel = new Int32Array(64);
		if (can_be_false) {
			for (var i = 1; i <= 32 * 64; i++) {
				if (fmodel_raw[i] == 1)
					fmodel[(i - 1) >> 5] |= 1 << ((i - 1) & 31);
			}
		}
		var tmodel = new Int32Array(64);
		if (can_be_true) {
			for (var i = 1; i <= 32 * 64; i++) {
				if (tmodel_raw[i] == 1)
					tmodel[(i - 1) >> 5] |= 1 << ((i - 1) & 31);
			}
		}

		if (can_be_true) {
			if (!can_be_false) {
				var resobj = {
					count: "#always"
				};
				if (root.type == 'bin' && ops[root.op] == '==') {
					var pf = new ProofFinder();
					pf.Search(root.l, root.r, function (flatproof) {
						resobj.proof = flatproof;
						callback();
					}, debugcallback);
				}
				res.true = resobj;
			}
			else {
				var trueobj1 = {
					count: "#at least once",
					examples: function (ix) {
						return [tmodel][ix];
					}
				};
				res.true = trueobj1;
				callback();

				var bits = this._bits;

				setTimeout(function() {
					var second = getModelWithBan(bits[0], tmodel);
					var trueobj = {
						count: second ? "#at least twice" : "1",
						examples: function (ix) {
							return [tmodel, second][ix];
						}
					};
					res.true = trueobj;
					callback();
				}, 0);
			}
		}
		if (can_be_false) {
			if (!can_be_true) {
				res.false = {
					count: "#always"
				};
				if (root.type == 'bin' && root.op == 20 && vars.length > 0) {
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
			}
			else {
				var falseobj1 = {
					count: "#at least once",
					examples: function (ix) {
						return [fmodel][ix];
					}
				};
				res.false = falseobj1;
				callback();
				var bits = this._bits;

				setTimeout(function() {
					var second = getModelWithBan(~bits[0], fmodel);
					var makeExamples = root.type == 'bin' && root.op == 20 && vars.length > 0;
					var falseobj = {
						count: second ? "#at least twice" : "1",
						ext_examples: makeExamples,
						examples: function (ix) {
							var values = [fmodel, second][ix];
							if (!makeExamples || !values) return values;
							var len = vars.length;
							var res = new Int32Array(len + 2);
							for (var i = 0; i < len; i++)
								res[i] = values[i];
							res[len] = root.l.eval(res);
							res[len + 1] = root.r.eval(res);
							return res;
						}
					};
					res.false = falseobj;
					callback();
				}, 0);
			}
		}
	}
	else if (this._divideError == -1) {
		res.diverror = {
			count: "#always"
		};
	}
	else {
		var sat = new SAT();
		circuit.to_cnf(this._divideError, sat);
		var de = sat.solve();

		var true_without_de = circuit.and(~this._divideError, this._bits[0]);
		var false_without_de = circuit.and(~this._divideError, ~this._bits[0]);

		sat = new SAT();
		circuit.to_cnf(false_without_de, sat);
		var fmodel_raw = sat.solve();
		sat = new SAT();
		circuit.to_cnf(true_without_de, sat);
		var tmodel_raw = sat.solve();

		var fmodel = new Int32Array(66);
			if (fmodel_raw) {
			for (var i = 1; i <= 32 * 64; i++) {
				if (fmodel_raw[i] == 1)
					fmodel[(i - 1) >> 5] |= 1 << ((i - 1) & 31);
			}
		}
		var tmodel = new Int32Array(64);
		if (tmodel_raw) {
			for (var i = 1; i <= 32 * 64; i++) {
				if (tmodel_raw[i] == 1)
					tmodel[(i - 1) >> 5] |= 1 << ((i - 1) & 31);
			}
		}
		var demodel = new Int32Array(64);
		if (de) {
			for (var i = 1; i <= 32 * 64; i++) {
				if (de[i] == 1)
					demodel[(i - 1) >> 5] |= 1 << ((i - 1) & 31);
			}
		}

		var can_be_true = tmodel_raw != null;
		var can_be_false = fmodel_raw != null;

		if (de == null) {
			if (can_be_true) {
				if (!can_be_false) {
					var resobj = {
						count: "#always",
						proof: undefined
					};
					if (root.type == 'bin' && ops[root.op] == '==') {
						var pf = new ProofFinder();
						pf.Search(root.l, root.r, function (flatproof) {
							resobj.proof = flatproof;
							callback();
						}, debugcallback);
					}
					res.true = resobj;
				}
				else {
					var trueobj = {
						count: "#at least once",
						examples: function (ix) {
							if (ix == 0)
								return tmodel;
						}
					};
					res.true = trueobj;
				}
			}
			if (can_be_false) {
				if (!can_be_true) {
					res.false = {
						count: "#always"
					};
				}
				else {
					var falseobj = {
						count: "#at least once",
						examples: function (ix) {
							if (ix == 0)
								return fmodel;
						}
					};
					res.false = falseobj;
				}
			}
		}
		else {
			sat = new SAT();
			circuit.to_cnf(~this._divideError, sat);
			var always_de = sat.solve() == null;
			if (always_de) {
				res.diverror = {
					count: "#always"
				};
			}
			else {
				res.diverror = {
					count: "#at least once",
					examples: function(ix) {
						if (ix == 0)
							return demodel;
					}
				};
				if (can_be_true) {
					res.true = {
						count: "#at least once",
						examples: function(ix) {
							if (ix == 0)
								return tmodel;
						}
					};
				}
				if (can_be_false) {
					var ext_examples = root.type == 'bin' && root.op == 20;
					if (ext_examples) {
						fmodel[vars.length] = root.l.eval(fmodel);
						fmodel[vars.length + 1] = root.r.eval(fmodel);
					}
					res.false = {
						count: "#at least once",
						ext_examples: ext_examples,
						examples: function(ix) {
							if (ix == 0)
								return fmodel;
						}
					};
				}
			}
		}
	}
	return res;
}