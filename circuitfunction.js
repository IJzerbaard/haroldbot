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
		bits[i] = circuit.or(circuit.and(~x._bits[i], y._bits[i]), circuit.and(x._bits[i], z._bits[i]));
	}
	return new CFunction(bits, circuit.or_big(x._divideError, y._divideError, z._divideError));
}

CFunction.add = function(x, y) {
	var bits = new Int32Array(32);
	var carry = 0;
	for (var i = 0; i < 32; i++) {
		var xy = circuit.xor(x._bits[i], y._bits[i]);
		bits[i] = circuit.xor(xy, carry);
		if (i < 31)
			carry = circuit.or(circuit.and(xy, carry), circuit.and(x._bits[i], y._bits[i]));
	}
	return new CFunction(bits, circuit.or(x._divideError, y._divideError));
}

CFunction.sub = function(x, y) {
	return CFunction.not(CFunction.add(CFunction.not(x), y));
}

CFunction.hor = function(x) {
	var or = circuit.or_big(x._bits);
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

CFunction.mul = function(x, y) {
	var r = CFunction.constant(0);
	for (var i = 0; i < 32; i++) {
		r = CFunction.add(r, CFunction.and(x, CFunction.nthbit(y, i)));
		x = CFunction.shlc(x, 1);
	}
	return r;
}

CFunction.prototype.sat = function() {
	var sat = new SAT();
	circuit.to_cnf(this._bits[0], sat);
	var temp;
	var res = sat.solveSimple(function (assignment) { temp = assignment; });
	if (res) {		
		var values = new Int32Array(4);
		for (var i = 0; i < 4 * 32; i++) {
			if (temp[i + 1] == 2)
				values[i >> 5] |= 1 << (i & 31);
		}
		return res;
	}
	return res;
};

CFunction.prototype.AnalyzeTruth = function(root, vars, callback, debugcallback) {
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
			if (root.type == 'bin' && ops[root.op] == '==') {
				var pf = new ProofFinder();
				pf.Search(root.l, root.r, function (flatproof) {
					resobj.proof = flatproof;
					callback();
				}, debugcallback);
			}
			res["true"] = resobj;
		} else {
			var sat = new SAT();
			circuit.to_cnf(~this._bits[0], sat);
			var fmodel_raw = null;
			var can_be_false = sat.solveSimple(function (assignment) { fmodel_raw = assignment; });
			sat = new SAT();
			circuit.to_cnf(this._bits[0], sat);
			var tmodel_raw = null;
			var can_be_true = sat.solveSimple(function (assignment) { tmodel_raw = assignment; });

			var fmodel = new Int32Array(64);
			for (var i = 1; i <= 32 * 64; i++) {
				if (fmodel_raw[i] == 2)
					fmodel[(i - 1) >> 5] |= 1 << ((i - 1) & 31);
			}
			var tmodel = new Int32Array(64);
			for (var i = 1; i <= 32 * 64; i++) {
				if (tmodel_raw[i] == 2)
					tmodel[(i - 1) >> 5] |= 1 << ((i - 1) & 31);
			}

			if (can_be_true) {
				if (!can_be_false) {
					var resobj = {
						count: "always",
						proof: undefined
					};
					if (root.type == 'bin' && ops[root.op] == '==') {
						var pf = new ProofFinder();
						pf.Search(root.l, root.r, function (flatproof) {
							resobj.proof = flatproof;
							callback();
						}, debugcallback);
					}
					res["true"] = resobj;
				}
				else {
					var trueobj = {
						count: "at least one",
						examples: function (ix) {
							if (ix == 0)
								return tmodel;
							else
								return undefined;
						}
					};
					res["true"] = trueobj;
				}
			}
			if (can_be_false) {
				if (!can_be_true) {
					res["false"] = "always";
				}
				else {
					var falseobj = {
						count: "at least one",
						examples: function (ix) {
							if (ix == 0)
								return fmodel;
							else
								return undefined;
						}
					};
					res["false"] = falseobj;
				}
			}
		}
	}
	return res;
}