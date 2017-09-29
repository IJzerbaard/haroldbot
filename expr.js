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

Node.prototype.analyze = function(env) {
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

Constant.prototype.analyze = function(env) {
	var v = this.value;
	var r = { z: ~v, o: v };
	env.nr[this.id] = r;
	return r;
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

Variable.prototype.analyze = function(env) {
	var r = { z: -1, o: -1 };
	env.nr[this.id] = r;
	return r;
};

Variable.prototype.eval = function(vars) {
	return vars[this.index];
};

Variable.prototype.sseeval = function(vars) {
	return vars[this.index];
};


function Unary(op, val) {
	Node.call(this);
	if (op < 0 || val == null || val == undefined) debugger;
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
	if ((this.value.type == 'bin' && this.value.op < 55) || this.value.type == 'ter')
		return o + "(" + this.value.print(varmap) + ")";
	else
		return o + this.value.print(varmap);
};

Unary.prototype.toBddFunc = function() {
	var inner = this.value.toBddFunc();
	if (this.op == "dummy")
		return inner;
	switch (this.op) {
		case 0:	return BDDFunction.not(inner);
		case 1:	return BDDFunction.sub(BDDFunction.constant(0), inner);
		case 2:	return BDDFunction.popcnt(inner);
		case 3:	return BDDFunction.ctz(inner);
		case 4:	return BDDFunction.clz(inner);
		case 5:	return BDDFunction.rbit(inner);
		case 6:	return BDDFunction.abs(inner);
		case 7: return BDDFunction.ez80mlt(inner);
	}
	debugger;
	alert("Severe bug in Unary.toBddFunc");
};

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
	}
	debugger;
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
			default: debugger;
			case 0:	return new Constant(~inner.value);
			case 1:	return new Constant(-inner.value | 0);
			case 2:	return new Constant(popcnt(inner.value));
			case 3:	return new Constant(ctz(inner.value));
			case 4:	return new Constant(clz(inner.value));
			case 5:	return new Constant(rbit(inner.value))
			case 6:
				var t = inner.value | 0;
				var m = t >> 31;
				return new Constant((t ^ m) - m | 0);
			case 7:	return new Constant((inner.value & 0xFF) * ((inner.value >> 8) & 0xFF));
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

Unary.prototype.analyze = function(env) {
	var v = this.value.analyze(env);
	var r = null;
	switch (this.op) {
		case 0:	r = Bitfield.invert(v); break;
		case 1:	r = Bitfield.negate(v); break;
		case 2:	r = Bitfield.popcnt(v); break;
		case 3:	r = Bitfield.ntz(v); break;
		case 4:	r = Bitfield.nlz(v); break;
		case 5:	r = Bitfield.rbit(v); break;
		case 7: r = { z: -1, o: 0xFFFF }; break;
		default:	r = { z: -1, o: -1 }; break;
	}
	env.nr[this.id] = r;
	return r;
};

Unary.prototype.eval = function(vars) {
	var inner = this.value.eval(vars);
	switch (this.op) {
		default: debugger;
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
	}
};

Unary.prototype.toSSECircuitFunc = function(vars) {
	return this.eval(vars);
};


function Binary(op, l, r) {
	Node.call(this);
	if (op < 0 || l == null || r == null) debugger;
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
	if (op == 10 || op == 11 || op == 32 || op == 33 || op == 34 || op == 35)
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
	if (this.op >= 55)
		return ops[this.op].substr(1) + "(" + this.l.print(varmap) + ", " + this.r.print(varmap) + ")";
	var res = "";
	if (this.l.type == 'bin' || this.l.type == 'ter')
		res += "(" + this.l.print(varmap) + ")";
	else
		res += this.l.print(varmap);
	res += " " + ops[this.op] + " ";
	if (this.r.type == 'bin' || this.r.type == 'ter')
		res += "(" + this.r.print(varmap) + ")";
	else
		res += this.r.print(varmap);
	return res;
};

Binary.prototype.toBddFunc = function() {
	var l = this.l.toBddFunc();
	var r = this.r.toBddFunc();
	switch (this.op) {
		case 1: return BDDFunction.and(l, r);
		case 2: return BDDFunction.or(l, r);
		case 3: return BDDFunction.xor(l, r);
		case 4: return BDDFunction.add(l, r);
		case 5: return BDDFunction.sub(l, r);
		case 6: return BDDFunction.shl(l, r);
		case 11: return BDDFunction.mul(l, r);
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
	}
	alert("Severe bug in Binary.toBddFunc");
};

Binary.prototype.toCircuitFunc = function() {
	var l = this.l.toCircuitFunc();
	var r = this.r.toCircuitFunc();
	switch (this.op) {
		case 1: return CFunction.and(l, r);
		case 2: return CFunction.or(l, r);
		case 3: return CFunction.xor(l, r);
		case 4: return CFunction.add(l, r);
		case 5: return CFunction.sub(l, r);
		case 6: return CFunction.shl(l, r);
		case 11: return CFunction.mul(l, r);
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
	}
	alert("Severe bug in Binary.toCircuitFunc");
};

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
	if (l.type == 'const' && r.type == 'const') {
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

Binary.prototype.analyze = function(env) {
	var l = this.l.analyze(env);
	var r = this.r.analyze(env);
	var res = { z: -1, o: -1 };
	switch (this.op) {
		case 1:	res = Bitfield.and(l, r); break;
		case 2:	res = Bitfield.or(l, r); break;
		case 3:	res = Bitfield.xor(l, r); break;
		case 4:	res = Bitfield.add(l, r); break;
		case 5:	res = Bitfield.sub(l, r); break;
		case 6:	res = Bitfield.shl(l, r); break;
		case 7:
		case 31:	res = Bitfield.shru(l, r); break;
		case 30:	res = Bitfield.shrs(l, r); break;
		case 8:	res = Bitfield.rol(l, r); break;
		case 9:	res = Bitfield.ror(l, r); break;
		case 11:	res = Bitfield.mul(l, r); break;
		case 20:	res = Bitfield.eq(l, r); break;
		case 21:	res = Bitfield.neq(l, r); break;
		default:
			break;
	}
	env.nr[this.id] = res;
	return res;
};

Binary.prototype.eval = function(vars) {
	var l = this.l.eval(vars) | 0;
	var r = this.r.eval(vars) | 0;
	var m = 0x80000000;
	switch (this.op) {
		default: throw "not implemented";
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
		case 55: return Math.min(l ^ m, r ^ m) ^ m;
		case 56: return Math.min(l, r) | 0;
		case 57: return Math.max(l ^ m, r ^ m) ^ m;
		case 58: return Math.max(l, r) | 0;
		case 59: return hmul_u32(l, r) | 0;
		case 60: return hmul_i32(l, r);
		case 61: return clmul_u32(l, r);
	}
};


function Ternary(cond, t, f) {
	Node.call(this);
	if (cond == null || t == null || f == null) debugger;
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
	return "(" + this.cond.print(varmap) + " ? " + this.t.print(varmap) + " : " + this.f.print(varmap) + ")";
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
	var c = this.c.eval(vars) | 0;
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

Ternary.prototype.analyze = function(env) {
	var cond = this.cond.analyze(env);
	var t = this.t.analyze(env);
	var f = this.f.analyze(env);
	var res = Bitfield.mux(cond, t, f);
	env.nr[this.id] = res;
	return res;
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
	return this.args.reduce(function(a, b, i) {
		return a + (i != 0 ? ", " : "") + b.print(varmap);
	}, this.fun + "(") + ")";
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
	var args = this.args.map(function(x) { return nrec ? x : x.constantFold(false); });
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

Fun.prototype.analyze = function(env) {
	var res = { z: -1, o: -1 };
	env.nr[this.id] = res;
	return res;
};

Fun.prototype.eval = function(vars) {
	debugger;
	throw "not implemented";
};

Fun.prototype.sseeval = function(vars) {
	if (this.fun.startsWith("_mm_") ||
		this.fun.startsWith("_mm256_")) {
		var a = this.args.map(function(x) { return x.sseeval(vars); });
		return SSECFunction[this.fun]( ... a);
	}
};

Node.AnalyzeProperties = function(data, vars, expr, callback) {
	if (!data.properties)
		data.properties = {};

	switch (vars.length) {
		default: return;
		case 1:
			// test invertible
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
								var d = theConst.value;
								var x = Math.imul(d, d) + d - 1 | 0;
								x = Math.imul(x, 2 - Math.imul(d, x) | 0);
								x = Math.imul(x, 2 - Math.imul(d, x) | 0);
								x = Math.imul(x, 2 - Math.imul(d, x) | 0);
								// sanity check
								if (Math.imul(x, d) != 1)
									throw "incorrect multiplicative inverse";
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
								var d = theConst.value;
								var x = 1;
								x = clmul_u32(x, clmul_u32(d, x));
								x = clmul_u32(x, clmul_u32(d, x));
								x = clmul_u32(x, clmul_u32(d, x));
								x = clmul_u32(x, clmul_u32(d, x));
								x = clmul_u32(x, clmul_u32(d, x));
								// sanity check
								if (clmul_u32(x, d) != 1)
									throw "incorrect multiplicative inverse";
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
