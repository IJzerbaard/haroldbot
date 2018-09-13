function Node() {
	this.hash = 0;
	this.hash2 = 0;
	this.weight = 0;
	this.type = 'Node';
	this.id = id++;
}

// structural equality with commutivity
Node.prototype.equals = function(node) {
	alert("This object should not exist");
	return false;
};

// structural equality without commutivity
Node.prototype.equals2 = function(node) {
	alert("This object should not exist");
	return false;
};

Node.prototype.print = function(varmap) {
	alert("This object should not exist");
	return "this should never exist";
};

Node.prototype.toBddFunc = function() {
	alert("This object should not exist");
	return null;
};

Node.prototype.toCircuitFunc = function() {
	alert("This object should not exist");
	return null;
};

Node.prototype.toSSECircuitFunc = function() {
	alert("This object should not exist");
	return null;
};

Node.prototype.removeDummy = function() {
	return this;
};

Node.prototype.constantFold = function() {
	return this;
};

Node.prototype.containsDoubleUnary = function() {
	return 0;
};

Node.prototype.copy = function() {
	alert("This object should not exist");
	return null;
};

Node.prototype.eval = function(vars) {
	alert("This object should not exist");
	return null;
};

Node.prototype.sseeval = function(vars) {
	alert("This object should not exist");
	return null;
};

function Constant(val) {
	Node.call(this);
	this.hash = val | 0;
	this.hash2 = (val & 15) | ((val >>> 31) << 4);
	this.value = val | 0;
	this.type = 'const';
}

Constant.prototype = Object.create(Node.prototype);
Constant.prototype.constructor = Constant;

Constant.prototype.equals = function(node) {
	return node.type == 'const' && node.value == this.value;
};

Constant.prototype.equals2 = function(node) {
	return node.type == 'const' && node.value == this.value;
};

Constant.prototype.print = function(varmap) {
	return formatConstant(this.value);
};

Constant.prototype.toBddFunc = function() {
	return BDDFunction.constant(this.value);
};

Constant.prototype.toCircuitFunc = function() {
	return CFunction.constant(this.value);
};

Constant.prototype.toSSECircuitFunc = function() {
	return this.value;
};

Constant.prototype.copy = function() {
	return new Constant(this.value);
};

Constant.prototype.eval = function(vars) {
	return this.value;
};

Constant.prototype.sseeval = function(vars) {
	return this.value;
};


function Variable(index) {
	Node.call(this);
	this.hash = index * 31;
	this.hash2 = 0;
	this.index = index;
	this.type = 'var';
}

Variable.prototype = Object.create(Node.prototype);
Variable.prototype.constructor = Variable;

Variable.prototype.equals = function(node) {
	return node.type == 'var' && node.index == this.index;
};

Variable.prototype.equals2 = function(node) {
	return node.type == 'var' && node.index == this.index;
};

Variable.prototype.print = function(varmap) {
	return varmap[this.index];
};

Variable.prototype.toBddFunc = function() {
	return BDDFunction.argument(this.index);
};

Variable.prototype.toCircuitFunc = function() {
	return CFunction.argument(this.index);
};

Variable.prototype.toSSECircuitFunc = function() {
	return SSECFunction.argument(this.index);
};

Variable.prototype.copy = function() {
	return new Variable(this.index);
};

Variable.prototype.eval = function(vars) {
	return vars[this.index];
};

Variable.prototype.sseeval = function(vars) {
	return vars[this.index];
};


function Unary(op, val) {
	Node.call(this);
	//if (op < 0 || val == null || val == undefined) debugger;
	this.hash = (val.hash << 17) - val.hash + op + 1 | 0;
	this.hash2 = (op + 1 & 31) | ((val.hash2 & 31) << 5);
	this.op = op;
	this.value = val;
	this.weight = val.weight;
	if (op == 0)
		this.weight += 1.0;
	else if (op == 1)
		this.weight += 1.1;
	else
		this.weight += 2.0;
	this.type = 'un';
}

Unary.prototype = Object.create(Node.prototype);
Unary.prototype.constructor = Unary;

Unary.prototype.equals = function(node) {
	return node.type == 'un' && node.op == this.op && node.value.equals(this.value);
};

Unary.prototype.equals2 = function(node) {
	return node.type == 'un' && node.op == this.op && node.value.equals2(this.value);
};

Unary.prototype.print = function(varmap) {
	if (this.op > 1)
		return unops[this.op].substr(1) + "(" + this.value.print(varmap) + ")";
	var o = unops[this.op];
	if (((this.value.type == 'bin' || this.value.type == 'assoc') && this.value.op < 55) || this.value.type == 'ter')
		return o + "(" + this.value.print(varmap) + ")";
	else
		return o + this.value.print(varmap);
};

Unary.prototype.toBddFunc = function() {
	var bddf = unaryToBddFunction(this.op, this.value.toBddFunc());
	this.bddf = bddf;
	return bddf;
};

function unaryToBddFunction(op, inner) {
	if (op == "dummy")
		return inner;
	switch (op) {
		case 0:	return BDDFunction.not(inner);
		case 1:	return BDDFunction.sub(BDDFunction.constant(0), inner);
		case 2:	return BDDFunction.popcnt(inner);
		case 3:	return BDDFunction.ctz(inner);
		case 4:	return BDDFunction.clz(inner);
		case 5:	return BDDFunction.rbit(inner);
		case 6:	return BDDFunction.abs(inner);
		case 7: return BDDFunction.ez80mlt(inner);
		case 8: return BDDFunction.and(inner, BDDFunction.sub(BDDFunction.constant(0), inner));
		case 9: return BDDFunction.and(inner, BDDFunction.sub(inner, BDDFunction.constant(1)));
		case 10: return BDDFunction.xor(inner, BDDFunction.sub(inner, BDDFunction.constant(1)));
		case 11: return BDDFunction.and(BDDFunction.not(inner), BDDFunction.sub(inner, BDDFunction.constant(1)));
	}
	alert("Severe bug in Unary.toBddFunc");
}

Unary.prototype.toCircuitFunc = function() {
	var inner = this.value.toCircuitFunc();
	if (this.op == "dummy")
		return inner;
	switch (this.op) {
		case 0:	return CFunction.not(inner);
		case 1:	return CFunction.sub(CFunction.constant(0), inner);
		case 2:	return CFunction.popcnt(inner);
		case 3:	return CFunction.ctz(inner);
		case 4:	return CFunction.clz(inner);
		case 5:	return CFunction.rbit(inner);
		case 6:	return CFunction.abs(inner);
		case 7: return CFunction.ez80mlt(inner);
		case 8: return CFunction.and(inner, CFunction.sub(CFunction.constant(0), inner));
		case 9: return CFunction.and(inner, CFunction.sub(inner, CFunction.constant(1)));
		case 10: return CFunction.xor(inner, CFunction.sub(inner, CFunction.constant(1)));
		case 11: return CFunction.and(CFunction.not(inner), CFunction.sub(inner, CFunction.constant(1)));
	}
	//debugger;
	alert("Severe bug in Unary.toCircuitFunc");
};

Unary.prototype.removeDummy = function() {
	var inner = this.value.removeDummy();
	if (this.op == 'dummy')
		return inner;
	if (this.value.id != inner.id)
		return new Unary(this.op, inner);
	return this;
};

Unary.prototype.constantFold = function(nrec) {
	var inner = nrec ? this.value : this.value.constantFold(false);
	if (inner.type == 'const') {
		switch (this.op) {
			case "dummy": return this;
			default: throw "invalid unary"; // debugger;
			case 0:	return new Constant(~inner.value);
			case 1:	return new Constant(-inner.value | 0);
			case 2:	return new Constant(popcnt(inner.value));
			case 3:	return new Constant(ctz(inner.value));
			case 4:	return new Constant(clz(inner.value));
			case 5:	return new Constant(rbit(inner.value));
			case 6:
				var t = inner.value | 0;
				var m = t >> 31;
				return new Constant((t ^ m) - m | 0);
			case 7:	return new Constant((inner.value & 0xFF) * ((inner.value >> 8) & 0xFF));
			case 8: return new Constant(inner.value & -inner.value);
			case 9: return new Constant(inner.value & inner.value - 1);
			case 10: return new Constant(inner.value ^ inner.value - 1);
			case 11: return new Constant(~inner.value & inner.value - 1);
		}
	}
	if (inner.id != this.value.id)
		return new Unary(this.op, inner);
	return this;
};

Unary.prototype.containsDoubleUnary = function() {
	return (this.value.type == 'un' ? 1 : 0) + this.value.containsDoubleUnary();
};

Unary.prototype.copy = function() {
	return new Unary(this.op, this.value.copy());
};

Unary.prototype.eval = function(vars) {
	var inner = this.value.eval(vars);
	switch (this.op) {
		default: throw "invalid unary"; // debugger;
		case 0: return ~inner;
		case 1: return -inner | 0;
		case 2: return popcnt(inner);
		case 3: return ctz(inner);
		case 4: return clz(inner);
		case 5: return rbit(inner);
		case 6:
			var t = (inner|0) >> 31;
			return ((inner ^ t) - t) | 0;
		case 7: return (inner & 0xFF) * ((inner >> 8) & 0xFF);
		case 8: return inner & -inner;
		case 9: return inner & inner - 1;
		case 10: return inner ^ inner - 1;
		case 11: return ~inner & inner - 1;
	}
};

Unary.prototype.toSSECircuitFunc = function(vars) {
	return this.eval(vars);
};


function Binary(op, l, r) {
	Node.call(this);
	//if (op < 0 || l == null || r == null) debugger;
	var lhash = l.hash;
	var rhash = r.hash;
	// if commutative operation, use commutative hash
	if (commutative[op]) {
		var x = lhash ^ rhash;
		lhash = Math.min(lhash, rhash);
		rhash = x ^ lhash;
	}
	this.hash = (((lhash * 31 | 0) + rhash) * 31 | 0) + op * 1009 | 0;
	this.hash2 = (op + 5 & 31) | ((l.hash2 & 31) << 5) | ((r.hash2 & 31) << 10);
	this.op = op;
	this.r = r;
	this.l = l;
	this.type = 'bin';

	var opweight = 1.0;
	if (op >= 4)
		opweight = 1.1;
	if ((op >= 10 && op <= 14) || (op >= 32 && op <= 35))
		opweight = 4.0;
	this.weight = opweight + l.weight + r.weight;
}

Binary.prototype = Object.create(Node.prototype);
Binary.prototype.constructor = Binary;

Binary.prototype.equals = function(node) {
	if (node.hash != this.hash || node.type != 'bin' || node.op != this.op)
		return false;
	if (!commutative[this.op])
		return node.l.equals(this.l) && node.r.equals(this.r);
	else
		return node.l.equals(this.l) && node.r.equals(this.r) ||
	           node.l.equals(this.r) && node.r.equals(this.l);
};

Binary.prototype.equals2 = function(node) {
	return node.hash == this.hash && node.type == 'bin' && node.op == this.op && node.l.equals2(this.l) && node.r.equals2(this.r);
};

Binary.prototype.print = function(varmap) {
	if (isbinfunc(this.op))
		return ops[this.op].substr(1) + "(" + this.l.print(varmap) + ", " + this.r.print(varmap) + ")";
	var res = "";
	if (this.l.type == 'bin' || this.l.type == 'ter' || this.l.type == 'assoc')
		res += "(" + this.l.print(varmap) + ")";
	else
		res += this.l.print(varmap);
	res += " " + ops[this.op] + " ";
	if (this.r.type == 'bin' || this.r.type == 'ter' || this.r.type == 'assoc')
		res += "(" + this.r.print(varmap) + ")";
	else
		res += this.r.print(varmap);
	return res;
};

Binary.prototype.toBddFunc = function() {
	var op = this.op;
	if (((op >= 11 && op <= 14) || (op >= 32 && op <= 35) || (op >= 59)) && this.l.type != 'const' && this.r.type != 'const') throw "BDD timeout";
	var bddf = binaryToBddFunc(op, this.l.toBddFunc(), this.r.toBddFunc());
	this.bddf = bddf;
	return bddf;
};

function binaryToBddFunc(op, l, r) {
	switch (op) {
		case 1: return BDDFunction.and(l, r);
		case 2: return BDDFunction.or(l, r);
		case 3: return BDDFunction.xor(l, r);
		case 4: return BDDFunction.add(l, r);
		case 5: return BDDFunction.sub(l, r);
		case 6: return BDDFunction.shl(l, r);
		case 11: return BDDFunction.mul(l, r);
		case 12: return BDDFunction.dive(l, r);
		case 13: return BDDFunction.reme(l, r);
		case 14: return BDDFunction.divupony(l, r);
		case 20: return BDDFunction.eq(l, r);
		case 21: return BDDFunction.not(BDDFunction.eq(l, r));
		case 26: return BDDFunction.or(BDDFunction.not(BDDFunction.hor(l)), BDDFunction.hor(r));
		case 27: return BDDFunction.and(BDDFunction.hor(l), BDDFunction.hor(r));
		case 28: return BDDFunction.or(BDDFunction.hor(l), BDDFunction.hor(r));
		case 30: return BDDFunction.shrs(l, r);
		case 31: return BDDFunction.shru(l, r);
		case 22:
		case 41: return BDDFunction.le(l, r, false);
		case 40: return BDDFunction.le(l, r, true);
		case 23:
		case 43: return BDDFunction.lt(l, r, false);
		case 42: return BDDFunction.lt(l, r, true);
		case 24:
		case 45: return BDDFunction.ge(l, r, false);
		case 44: return BDDFunction.ge(l, r, true);
		case 25:
		case 47: return BDDFunction.gt(l, r, false);
		case 46: return BDDFunction.gt(l, r, true);
		case 48: return BDDFunction.bzhi(l, r);
		case 49: return BDDFunction.subus(l, r);
		case 55: return BDDFunction.mux(BDDFunction.gt(l, r, false), l, r);
		case 56: return BDDFunction.mux(BDDFunction.gt(l, r, true), l, r);
		case 57: return BDDFunction.mux(BDDFunction.lt(l, r, false), l, r);
		case 58: return BDDFunction.mux(BDDFunction.lt(l, r, true), l, r);
		case 32: return BDDFunction.divs(l, r);
		case 33: return BDDFunction.divu(l, r);
		case 34: return BDDFunction.rems(l, r);
		case 35: return BDDFunction.remu(l, r);
		case 59: return BDDFunction.hmul(l, r, false);
		case 60: return BDDFunction.hmul(l, r, true);
		case 61: return BDDFunction.clmul(l, r);
		case 62: return BDDFunction.clpow(l, r);
		case 63: return BDDFunction.ormul(l, r);
		default: alert("Unimplemented operation in binaryToBddFunc");
	}
}

Binary.prototype.toCircuitFunc = function() {
	return binaryToCircuitFunc(this.op, this.l.toCircuitFunc(), this.r.toCircuitFunc());
};

function binaryToCircuitFunc(op, l, r) {
	switch (op) {
		case 1: return CFunction.and(l, r);
		case 2: return CFunction.or(l, r);
		case 3: return CFunction.xor(l, r);
		case 4: return CFunction.add(l, r);
		case 5: return CFunction.sub(l, r);
		case 6: return CFunction.shl(l, r);
		case 11: return CFunction.mul(l, r);
		case 12: return CFunction.dive(l, r);
		case 13: return CFunction.reme(l, r);
		case 14: return CFunction.divupony(l, r);
		case 20: return CFunction.eq(l, r);
		case 21: return CFunction.not(CFunction.eq(l, r));
		case 26: return CFunction.or(CFunction.not(CFunction.hor(l)), CFunction.hor(r));
		case 27: return CFunction.and(CFunction.hor(l), CFunction.hor(r));
		case 28: return CFunction.or(CFunction.hor(l), CFunction.hor(r));
		case 30: return CFunction.shrs(l, r);
		case 31: return CFunction.shru(l, r);
		case 22:
		case 41: return CFunction.le(l, r, false);
		case 40: return CFunction.le(l, r, true);
		case 23:
		case 43: return CFunction.lt(l, r, false);
		case 42: return CFunction.lt(l, r, true);
		case 24:
		case 45: return CFunction.ge(l, r, false);
		case 44: return CFunction.ge(l, r, true);
		case 25:
		case 47: return CFunction.gt(l, r, false);
		case 46: return CFunction.gt(l, r, true);
		case 48: return CFunction.bzhi(l, r);
		case 49: return CFunction.subus(l, r);
		case 55: return CFunction.mux(CFunction.gt(l, r, false), l, r);
		case 56: return CFunction.mux(CFunction.gt(l, r, true), l, r);
		case 57: return CFunction.mux(CFunction.lt(l, r, false), l, r);
		case 58: return CFunction.mux(CFunction.lt(l, r, true), l, r);
		case 32: return CFunction.divs(l, r);
		case 33: return CFunction.divu(l, r);
		case 34: return CFunction.rems(l, r);
		case 35: return CFunction.remu(l, r);
		case 59: return CFunction.hmul(l, r, false);
		case 60: return CFunction.hmul(l, r, true);
		case 61: return CFunction.clmul(l, r);
		case 62: return CFunction.clpow(l, r);
		case 63: return CFunction.ormul(l, r);
	}
	alert("Unimplemented operation in binaryToCircuitFunc");
}

Binary.prototype.removeDummy = function() {
	var l = this.l.removeDummy();
	var r = this.r.removeDummy();
	if (this.l.id != l.id ||
		this.r.id != r.id)
		return new Binary(this.op, l, r);
	return this;
};

Binary.prototype.constantFold = function(nrec) {
	var l = nrec ? this.l : this.l.constantFold(false);
	var r = nrec ? this.r : this.r.constantFold(false);
	if (l.type == 'const' && r.type == 'const' && !mayThrow(this.op)) {
		return new Constant(this.eval(null));
	}
	if (l.id != this.l.id ||
		r.id != this.r.id)
		return new Binary(this.op, l, r);
	return this;
};

Binary.prototype.containsDoubleUnary = function() {
	return this.l.containsDoubleUnary() + this.r.containsDoubleUnary();
};

Binary.prototype.copy = function() {
	return new Binary(this.op, this.l.copy(), this.r.copy());
};

function evalBinary(op, l, r) {
	var m = 0x80000000;
	switch (op) {
		default: throw "Unimplemented operation in evalBinary";
		case 1: return l & r;
		case 2: return l | r;
		case 3: return l ^ r;
		case 4: return l + r | 0;
		case 5: return l - r | 0;
		case 6: return l << (r & 31);
		case 7:
		case 31: return (l >>> (r & 31)) | 0;
		case 30: return l >> (r & 31);
		case 8: return (l << (r & 31)) | (l >>> (-r & 31));
		case 9: return (l >>> (r & 31)) | (l << (-r & 31));
		case 12: return BDDFunction.to_constant(BDDFunction.dive(BDDFunction.constant(l), BDDFunction.constant(r)));
		case 13: return BDDFunction.to_constant(BDDFunction.reme(BDDFunction.constant(l), BDDFunction.constant(r)));
		case 14: return BDDFunction.to_constant(BDDFunction.divupony(BDDFunction.constant(l), BDDFunction.constant(r)));
		case 10:
		case 33: return BDDFunction.to_constant(BDDFunction.divu(BDDFunction.constant(l), BDDFunction.constant(r)));
		case 32: return BDDFunction.to_constant(BDDFunction.divs(BDDFunction.constant(l), BDDFunction.constant(r)));
		case 34: return BDDFunction.to_constant(BDDFunction.rems(BDDFunction.constant(l), BDDFunction.constant(r)));
		case 35: return BDDFunction.to_constant(BDDFunction.remu(BDDFunction.constant(l), BDDFunction.constant(r)));
		case 11: return Math.imul(l, r);
		case 20: return l == r ? -1 : 0;
		case 21: return l != r ? -1 : 0;
		case 41:
		case 22: return (l ^ m) <= (r ^ m) ? -1 : 0;
		case 43:
		case 23: return (l ^ m) < (r ^ m) ? -1 : 0;
		case 45:
		case 24: return (l ^ m) >= (r ^ m) ? -1 : 0;
		case 47:
		case 25: return (l ^ m) > (r ^ m) ? -1 : 0;
		case 26: return (l == 0 || r != 0) ? -1 : 0;
		case 27: return (l != 0 && r != 0) ? -1 : 0;
		case 28: return (l != 0 || r != 0) ? -1 : 0;
		case 40: return l <= r ? -1 : 0;
		case 42: return l < r ? -1 : 0;
		case 44: return l >= r ? -1 : 0;
		case 46: return l > r ? -1 : 0;
		case 48: return ((r & 0xFF) >= 31 ? l : l & (1 << r) - 1)|0;
		case 49: return (l >>> 0) < (r >>> 0) ? 0 : (l - r)|0;
		case 55: return Math.min(l ^ m, r ^ m) ^ m;
		case 56: return Math.min(l, r) | 0;
		case 57: return Math.max(l ^ m, r ^ m) ^ m;
		case 58: return Math.max(l, r) | 0;
		case 59: return hmul_u32(l, r) | 0;
		case 60: return hmul_i32(l, r);
		case 61: return clmul_u32(l, r);
		case 62: return clpow_u32(l, r);
		case 63: return ormul_u32(l, r);
	}
}

Binary.prototype.eval = function(vars) {
	var l = this.l.eval(vars) | 0;
	var r = this.r.eval(vars) | 0;
	return evalBinary(this.op, l, r);
};

function Assoc(op, operands) {
	Node.call(this);
	// inline nested assocs with the same op
	operands = operands.reduce(function (list, x) {
		if (x.type == 'assoc' && x.op == op)
			return list.concat(x.originalOperands);
		else return list.concat([x]);
	}, []);
	this.originalOperands = operands;
	var orderedoperands = operands;
	if (commutative[op]) {
		orderedoperands = operands.slice(0);
		orderedoperands.sort(function (a, b) { return a.hash - b.hash; });
	}
	this.hash = orderedoperands.reduce(function (a, b) { return  31 * a + b.hash | 0; }, op * 1009);
	this.hash2 = 0;
	this.op = op;
	this.operands = orderedoperands;
	this.type = 'assoc';

	var opweight = 1.0;
	if (op >= 4)
		opweight = 1.1;
	if (op == 10 || op == 11 || op == 32 || op == 33 || op == 34 || op == 35)
		opweight = 4.0;
	this.weight = operands.reduce(function (a, b) { return a + b.weight; }, opweight * (this.operands.length - 1));
}

Assoc.prototype = Object.create(Node.prototype);
Assoc.prototype.constructor = Assoc;

Assoc.prototype.equals = function(node) {
	if (node.hash != this.hash || node.type != 'assoc' || node.op != this.op || node.operands.length != this.operands.length)
		return false;
	for (var i = 0; i < this.operands.length; i++)
		if (!this.operands[i].equals(node.operands[i]))
			return false;
	return true;
};

Assoc.prototype.equals2 = function(node) {
	if (node.hash != this.hash || node.type != 'assoc' || node.op != this.op || node.originalOperands.length != this.originalOperands.length)
		return false;
	for (var i = 0; i < this.originalOperands.length; i++)
		if (!this.originalOperands[i].equals2(node.originalOperands[i]))
			return false;
	return true;
};

Assoc.prototype.removeDummy = function() {
	var newoperands = [];
	for (var i = 0; i < this.originalOperands.length; i++)
		newoperands[i] = this.originalOperands[i].removeDummy();
	for (var i = 0; i < this.originalOperands.length; i++)
		if (newoperands[i].id != this.originalOperands[i].id)
			return new Assoc(this.op, newoperands);
	return this;
};

Assoc.prototype.constantFold = function(nrec) {
	if (commutative[this.op]) {
		var operands = null;
		// if non-recursive, use operands directly
		if (nrec) operands = this.operands;
		// otherwise, fold them first
		else operands = this.operands.map(function (x) { return x.constantFold(false); });
		// take all the constants,
		var constants = operands.filter(function (x) { return x.type == 'const'; });
		if (constants.length < 2) return this;
		// fold them together
		var op = this.op;
		var c = constants.map(function (x) { return x.value; })
		                 .reduce(function (l, r) { return evalBinary(op, l, r); });
		// replace all the constants by the folded value
		var nc = operands.filter(function (x) { return x.type != 'const'; });
		nc.push(new Constant(c));
		if (nc.length == 1) return nc[0];
		return new Assoc(this.op, nc);
	}
	else {
		// if not commutative, only fold from left to right
		var newoperands = this.operands.slice(0);
		var r = false;
		for (var i = 1; i < newoperands.length; i++) {
			if (newoperands[i - 1].type == 'const' && newoperands[i].type == 'const') {
				var c = new Constant(evalBinary(this.op, newoperands[i - 1].value, newoperands[i].value));
				newoperands[i - 1] = null;
				newoperands[i] = c;
				r = true;
			}
		}
		if (r) {
			newoperands = newoperands.filter(function (x) { return x != null; });
			if (newoperands.length == 1) return newoperands[0];
			return new Assoc(this.op, newoperands);
		}
	}
	return this;
};

Assoc.prototype.containsDoubleUnary = function() {
	return this.operands.reduce(function (sum, x) { return sum + x.containsDoubleUnary(); }, 0);
};

Assoc.prototype.copy = function() {
	return new Assoc(this.op, this.originalOperands.map(function (x) { return x.copy(); }));
};

Assoc.prototype.print = function(varmap) {
	if (this.op >= 55)
		return ops[this.op].substr(1) + "(" + this.originalOperands.join(", ") + ")";
	var m = this.originalOperands.map(function (x) {
		var inner = x.print(varmap);
		if (x.type == 'bin' || x.type == 'ter' || x.type == 'assoc')
			return "(" + inner + ")";
		else
			return inner;
	});
	return m.join(" " + ops[this.op] + " ");
};

Assoc.prototype.eval = function (vars) {
	var op = this.op;
	return this.originalOperands.reduce(function (l, r) {
		var lv;
		if (l instanceof Node)
			lv = l.eval(vars);
		else
			lv = l;
		return evalBinary(op, lv, r.eval(vars));
	});
};

Assoc.prototype.toBddFunc = function() {
	var op = this.op;
	return this.originalOperands.reduce(function (l, r) {
		if (l instanceof BDDFunction)
			return binaryToBddFunc(op, l, r.toBddFunc());
		else
			return binaryToBddFunc(op, l.toBddFunc(), r.toBddFunc());
	});
};

Assoc.prototype.toCircuitFunc = function() {
	var op = this.op;
	return this.originalOperands.reduce(function (l, r) {
		if (l instanceof CFunction)
			return binaryToCircuitFunc(op, l, r.toCircuitFunc());
		else
			return binaryToCircuitFunc(op, l.toCircuitFunc(), r.toCircuitFunc());
	});
};


function Ternary(cond, t, f) {
	Node.call(this);
	//if (cond == null || t == null || f == null) debugger;
	this.hash = (t.hash * 31) ^ (f.hash * 1009) ^ (cond.hash * 65521) ^ 0xdeadbeef;
	this.hash2 = (cond.hash2 & 15) | ((t.hash2 & 15) << 4) | ((f.hash2 & 15) << 8) | 0x7000;
	this.cond = cond;
	this.t = t;
	this.f = f;
	this.type = 'ter';

	this.weight = 1.0 + cond.weight + t.weight + f.weight;
}

Ternary.prototype = Object.create(Node.prototype);
Ternary.prototype.constructor = Ternary;

Ternary.prototype.equals = function(node) {
	return node.type == 'ter' && this.cond.equals(node.cond) && this.t.equals(node.t) && this.f.equals(node.f);
};

Ternary.prototype.equals2 = function(node) {
	return node.type == 'ter' && this.cond.equals2(node.cond) && this.t.equals2(node.t) && this.f.equals2(node.f);
};

Ternary.prototype.print = function(varmap) {
	return "(" + this.cond.print(varmap) + ") ? (" + this.t.print(varmap) + ") : (" + this.f.print(varmap) + ")";
};

Ternary.prototype.toBddFunc = function() {
	return BDDFunction.mux(this.cond.toBddFunc(), this.f.toBddFunc(), this.t.toBddFunc());
};

Ternary.prototype.toCircuitFunc = function() {
	return CFunction.mux(this.cond.toCircuitFunc(), this.f.toCircuitFunc(), this.t.toCircuitFunc());
};

Ternary.prototype.removeDummy = function() {
	var cond = this.cond.removeDummy();
	var t = this.t.removeDummy();
	var f = this.f.removeDummy();
	if (this.cond.id != cond.id ||
		this.t.id != t.id ||
		this.f.id != f.id)
		return new Ternary(cond, t, f);
	return this;
};

Ternary.prototype.constantFold = function(nrec) {
	var cond = nrec ? this.cond : this.cond.constantFold(false);
	var t = nrec ? this.t : this.t.constantFold(false);
	var f = nrec ? this.f : this.f.constantFold(false);
	if (cond.type == 'const' &&
		t.type == 'const' &&
		f.type == 'const') {
		return new Constant((cond.value & t.value) | (~cond.value & f.value));
	}
	if (cond.id != this.cond.id ||
		t.id != this.t.id ||
		f.id != this.f.id)
		return new Ternary(cond, t, f);
	return this;
};

Ternary.prototype.eval = function(vars) {
	var c = this.cond.eval(vars) | 0;
	var t = this.t.eval(vars) | 0;
	var f = this.f.eval(vars) | 0;
	return (c & t) | (~c & f);
};

Ternary.prototype.containsDoubleUnary = function() {
	return this.cond.containsDoubleUnary() + this.t.containsDoubleUnary() + this.f.containsDoubleUnary();
};

Ternary.prototype.copy = function() {
	return new Ternary(this.cond.copy(), this.t.copy(), this.f.copy());
};


function Fun(name, args) {
	Node.call(this);
	this.hash = args.reduce(function(a, b) {
		return  31 * a + b.hash | 0;
	}, 0xcafebabe);
	this.hash2 = 0;
	this.fun = name;
	this.args = args;
	this.type = 'fun';

	this.weight = args.reduce(function(a, b) {
		return a + b.weight;
	}, 1.0);
}

// structural equality with commutivity
Fun.prototype.equals = function(node) {
	if (node.type != 'fun' ||
		node.fun != this.fun ||
		node.args.length != this.args.length)
		return false;
	for (var i = 0; i < this.args.length; i++)
		if (!this.args[i].equals(node.args[i]))
			return false;
	return true;
};

// structural equality without commutivity
Fun.prototype.equals2 = function(node) {
	if (node.type != 'fun' ||
		node.fun != this.fun ||
		node.args.length != this.args.length)
		return false;
	for (var i = 0; i < this.args.length; i++)
		if (!this.args[i].equals2(node.args[i]))
			return false;
	return true;
};

Fun.prototype.print = function(varmap) {
	return this.fun + "(" + this.args.join(", ") + ")";
};

Fun.prototype.toBddFunc = function() {
	var a = this.args.map(function(x) { return x.toBddFunc(); });
	switch (this.fun) {
		case "$fixscale":
			return BDDFunction.fixscale(a[0], a[1], a[2]);
		case "$fixmul_u":
			return BDDFunction.fixmul(a[0], a[1], a[2], false);
		default:
			throw "unimplemented function";
	}
	return null;
};

Fun.prototype.toCircuitFunc = function() {
	var a = this.args.map(function(x) { return x.toCircuitFunc(); });
	switch (this.fun) {
		case "$fixscale":
			return CFunction.fixscale(a[0], a[1], a[2]);
		case "$fixmul_u":
			return CFunction.fixmul(a[0], a[1], a[2], false);
		default:
			throw "unimplemented function";
	}
	return null;
};

Fun.prototype.toSSECircuitFunc = function() {
	var a = this.args.map(function(x) { return x.toSSECircuitFunc(); });
	if (this.fun.startsWith("_mm") && SSECFunction[this.fun])
		return SSECFunction[this.fun]( ... a);
};

Fun.prototype.removeDummy = function() {
	var args = this.args.map(function(x) { return x.removeDummy(); });
	for (var i = 0; i < args.length; i++) {
		if (args[i].id != this.args[i].id)
			return new Fun(this.fun, args);
	}
	return this;
};

Fun.prototype.constantFold = function(nrec) {
	var args = this.args.map(function (x) { return nrec ? x : x.constantFold(false); });
	if (args.every(function (x){return x.type=='const';})) {
		return new Constant(BDDFunction.to_constant(new Fun(this.fun, args).toBddFunc()));
	}
	for (var i = 0; i < args.length; i++) {
		if (args[i].id != this.args[i].id)
			return new Fun(this.fun, args);
	}
	return this;
};

Fun.prototype.containsDoubleUnary = function() {
	return this.args.reduce(function(a, b) {
		return a + b.containsDoubleUnary();
	}, 0);
};

Fun.prototype.copy = function() {
	return new Fun(this.fun, this.args);
};

Fun.prototype.eval = function(vars) {
	var a = this.args.map(function (a){return BDDFunction.constant(a.eval(vars));});
	switch (this.fun) {
		case "$fixscale":
			return BDDFunction.to_constant(BDDFunction.fixscale(a[0], a[1], a[2]));
		case "$fixmul_u":
			return BDDFunction.to_constant(BDDFunction.fixmul(a[0], a[1], a[2]));
		default:
			throw "unimplemented function";
	}
};

Fun.prototype.sseeval = function(vars) {
	if (this.fun.startsWith("_mm_") ||
		this.fun.startsWith("_mm256_")) {
		var a = this.args.map(function(x) { return x.sseeval(vars); });
		return SSECFunction[this.fun]( ... a);
	}
};


function Let(pairs, expr) {
	Node.call(this);
	// the hashes don't matter because Let is only used in output
	this.type = 'let';
	this.pairs = pairs;
	this.expr = expr;
}

Let.prototype.print = function (varmap) {
	var str = "let ";
	varmap = varmap.slice();
	for (var i = 0; i < this.pairs.length; i++) {
		var p = this.pairs[i];		
		str += p.name + " = " + p.expr.print(varmap);
		varmap.push(p.name);
	}
	return str + " in " + expr.print(varmap);
};

Node.normalize = function (expr) {
	switch (expr.type) {
		default: return expr;
		case 'un':
			var inner = Node.normalize(expr.value);
			return inner.id == expr.value.id ? expr : new Unary(expr.op, inner);
		case 'bin':
			var l = Node.normalize(expr.l);
			var r = Node.normalize(expr.r);
			if (associative[expr.op]) return new Assoc(expr.op, [l, r]);
			if (l.id != expr.l.id || r.id != expr.r.id) return new Binary(expr.op, l, r);
			return expr;
		case 'assoc':
			var args = expr.originalOperands.map(Node.normalize);
			for (var i = 0; i < args.length; i++)
				if (args[i].id != expr.originalOperands[i].id)
					return new Assoc(expr.op, args);
			return expr;
		case 'ter':
			var c = Node.normalize(expr.cond);
			var t = Node.normalize(expr.t);
			var f = Node.normalize(expr.f);
			if (c.id != expr.cond.id || t.id != expr.t.id || f.id != expr.f.id)
				return new Ternary(c, t, f);
			return expr;
		case 'fun':
			var args = expr.args.map(Node.normalize);
			for (var i = 0; i < args.length; i++)
				if (args[i].id != expr.args[i].id)
					return new Fun(expr.fun, args);
			return expr;
	}
};

Node.AnalyzeProperties = function(data, vars, expr, callback) {
	if (!data.properties)
		data.properties = {};

	switch (vars.length) {
		default: return;
		case 1:
			function invert(expr, inv) {
				switch (expr.type) {
					default: return null;
					case "var": return inv;
					case "un":
						// ~, -, reverse
						if (expr.op == 0 || expr.op == 1 || expr.op == 5)
							return invert(expr.value, new Unary(expr.op, inv));
						return null;
					case "bin":
						var lcf = null, rcf = null;
						// ^, +, - of an invertible expr with a constant
						if (expr.op == 3 || expr.op == 4 || expr.op == 5) {
							var undoop = [0, 0, 0, 3, 5, 4];
							lcf = expr.l.constantFold();
							if (lcf.type == "const") {
								if (expr.op != 5)
									return invert(expr.r, lcf.value == 0 ? inv : new Binary(undoop[expr.op], inv, lcf));
								else
									return invert(expr.r, new Binary(5, lcf, inv));
							}
							rcf = expr.r.constantFold();
							if (rcf.type == "const")
								return invert(expr.l, rcf.value == 0 ? inv : new Binary(undoop[expr.op], inv, rcf));
						}
						// mul by odd
						if (expr.op == 11) {
							lcf = lcf || expr.l.constantFold();
							var theConst = lcf;
							var theRest = expr.r;
							if (theConst.type != "const") {
								rcf = rcf || expr.r.constantFold();
								theConst = rcf;
								theRest = expr.l;
							}
							if (theConst.type == "const") {
								if ((theConst.value & 1) == 0) return null;
								var x = mulinv(theConst.value);
								return invert(theRest, new Binary(11, inv, new Constant(x)));
							}
							return null;
						}
						// clmul by odd
						if (expr.op == 61) {
							lcf = lcf || expr.l.constantFold();
							var theConst = lcf;
							var theRest = expr.r;
							if (theConst.type != "const") {
								rcf = rcf || expr.r.constantFold();
								theConst = rcf;
								theRest = expr.l;
							}
							if (theConst.type == "const") {
								if ((theConst.value & 1) == 0) return null;
								var x = clinv(theConst.value);
								return invert(theRest, new Binary(61, inv, new Constant(x)));
							}
							return null;
						}
						return null;
				}
			}

			var inv = invert(expr, new Variable(1));
			if (inv) {
				inv = inv.constantFold();
				if (inv.type != "var") {
					var newvar = data.varmap[0] == "r" ? "x" : "r";
					data.varmap[1] = newvar;
					data.properties.inverse = inv;
					data.properties.inverseproof = "let " + newvar + " = " + expr.print(data.varmap) + " in (" + inv.print(data.varmap) + ") == " + data.varmap[0];
				}
				else delete data.properties.inverse;
				if (callback)
					callback(data);
			}
			break;
	}
};
