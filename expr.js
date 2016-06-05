function Node() {
	this.hash = 0;
	this.hash2 = 0;
	this.weight = 0;
	this.type = 'Node';
	this.id = id++;
}

Node.prototype.equals = function(node) {
	alert("This object should not exist");
	return false;
};

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


function Constant(val) {
	Node.call(this);
	this.hash = val | 0;
	this.hash2 = (val & 7) | ((val >>> 31) << 3);
	this.value = val;
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
	return "" + this.value;
};

Constant.prototype.toBddFunc = function() {
	return BDDFunction.constant(this.value);
};

Constant.prototype.toCircuitFunc = function() {
	return CFunction.constant(this.value);
};

Constant.prototype.copy = function() {
	return new Constant(this.value);
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

Variable.prototype.copy = function() {
	return new Variable(this.index);
};


function Unary(op, val) {
	Node.call(this);
	if (op < 0 || val == null || val == undefined) debugger;
	this.hash = (val.hash << 17) - val.hash + op + 1 | 0;
	this.hash2 = (op + 1 & 15) | ((val.hash2 & 15) << 4);
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
	return unops[this.op] + "(" + this.value.print(varmap) + ")";
};

Unary.prototype.toBddFunc = function() {
	var inner = this.value.toBddFunc();
	if (this.op == "dummy")
		return inner;
	switch (this.op) {
		case 0:
			return BDDFunction.not(inner);
		case 1:
			return BDDFunction.sub(BDDFunction.constant(0), inner);
		case 2:
			return BDDFunction.popcnt(inner);
		case 3:
			return BDDFunction.ctz(inner);
		case 4:
			return BDDFunction.clz(inner);
		case 5:
			return BDDFunction.rbit(inner);
	}
	debugger;
	alert("Severe bug in Unary.toBddFunc");
};

Unary.prototype.toCircuitFunc = function() {
	var inner = this.value.toCircuitFunc();
	if (this.op == "dummy")
		return inner;
	switch (this.op) {
		case 0:
			return CFunction.not(inner);
		case 1:
			return CFunction.sub(CFunction.constant(0), inner);
		case 2:
			return CFunction.popcnt(inner);
		case 3:
			return CFunction.ctz(inner);
		case 4:
			return CFunction.clz(inner);
		case 5:
			return CFunction.rbit(inner);
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

Unary.prototype.constantFold = function() {
	var inner = this.value.constantFold();
	if (inner.type == 'const') {
		switch (this.op) {
			default:
				debugger;
				return;
			case 0:
				return new Constant(~inner.value);
			case 1:
				return new Constant(-inner.value | 0);
			case 2:
				return new Constant(popcnt(inner.value));
			case 3:
				return new Constant(ctz(inner.value));
			case 4:
				return new Constant(clz(inner.value));
			case 5:
				return new Constant(rbit(inner.value))
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


function Binary(op, l, r) {
	Node.call(this);
	if (op < 0 || l == null || r == null) debugger;
	this.hash = (((l.hash * 31 | 0) + r.hash) * 31 | 0) + op * 1009 | 0;
	this.hash2 = (op + 5 & 15) | ((l.hash2 & 15) << 4) | ((r.hash2 & 15) << 8);
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
	return node.type == 'bin' && node.op == this.op && ((node.l.equals(this.l) && node.r.equals(this.r)) || (commutative[this.op] && node.l.equals(this.r) && node.r.equals(this.l)));
};

Binary.prototype.equals2 = function(node) {
	return node.type == 'bin' && node.op == this.op && node.l.equals2(this.l) && node.r.equals2(this.r);
};

Binary.prototype.print = function(varmap) {
	if (this.op >= 55)
		return ops[this.op] + "(" + this.l.print(varmap) + ", " + this.r.print(varmap) + ")";
	return "(" + this.l.print(varmap) + ")" + ops[this.op] + "(" + this.r.print(varmap) + ")";
};

Binary.prototype.toBddFunc = function() {
	var l = this.l.toBddFunc();
	var r = this.r.toBddFunc();
	switch (this.op) {
		case 1:
			return BDDFunction.and(l, r);
		case 2:
			return BDDFunction.or(l, r);
		case 3:
			return BDDFunction.xor(l, r);
		case 4:
			return BDDFunction.add(l, r);
		case 5:
			return BDDFunction.sub(l, r);
		case 6:
			return BDDFunction.shl(l, r);
		case 11:
			return BDDFunction.mul(l, r);
		case 20:
			return BDDFunction.eq(l, r);
		case 21:
			return BDDFunction.not(BDDFunction.eq(l, r));
		case 30:
			return BDDFunction.shrs(l, r);
		case 31:
			return BDDFunction.shru(l, r);
		case 22:
		case 41:
			return BDDFunction.le(l, r, false);
		case 40:
			return BDDFunction.le(l, r, true);
		case 23:
		case 43:
			return BDDFunction.lt(l, r, false);
		case 42:
			return BDDFunction.lt(l, r, true);
		case 24:
		case 45:
			return BDDFunction.ge(l, r, false);
		case 44:
			return BDDFunction.ge(l, r, true);
		case 25:
		case 47:
			return BDDFunction.gt(l, r, false);
		case 46:
			return BDDFunction.gt(l, r, true);
		case 55:
			return BDDFunction.mux(BDDFunction.gt(l, r, false), l, r);
		case 56:
			return BDDFunction.mux(BDDFunction.gt(l, r, true), l, r);
		case 57:
			return BDDFunction.mux(BDDFunction.lt(l, r, false), l, r);
		case 58:
			return BDDFunction.mux(BDDFunction.lt(l, r, true), l, r);
		case 32:
			return BDDFunction.divs(l, r);
		case 33:
			return BDDFunction.divu(l, r);
	}
	debugger;
	alert("Severe bug in Binary.toBddFunc");
};

Binary.prototype.toCircuitFunc = function() {
	var l = this.l.toCircuitFunc();
	var r = this.r.toCircuitFunc();
	switch (this.op) {
		case 1:
			return CFunction.and(l, r);
		case 2:
			return CFunction.or(l, r);
		case 3:
			return CFunction.xor(l, r);
		case 4:
			return CFunction.add(l, r);
		case 5:
			return CFunction.sub(l, r);
		case 6:
			return CFunction.shl(l, r);
		case 11:
			return CFunction.mul(l, r);
		case 20:
			return CFunction.eq(l, r);
		case 21:
			return CFunction.not(CFunction.eq(l, r));
		case 30:
			return CFunction.shrs(l, r);
		case 31:
			return CFunction.shru(l, r);
		case 22:
		case 41:
			return CFunction.le(l, r, false);
		case 40:
			return CFunction.le(l, r, true);
		case 23:
		case 43:
			return CFunction.lt(l, r, false);
		case 42:
			return CFunction.lt(l, r, true);
		case 24:
		case 45:
			return CFunction.ge(l, r, false);
		case 44:
			return CFunction.ge(l, r, true);
		case 25:
		case 47:
			return CFunction.gt(l, r, false);
		case 46:
			return CFunction.gt(l, r, true);
		case 55:
			return CFunction.mux(CFunction.gt(l, r, false), l, r);
		case 56:
			return CFunction.mux(CFunction.gt(l, r, true), l, r);
		case 57:
			return CFunction.mux(CFunction.lt(l, r, false), l, r);
		case 58:
			return CFunction.mux(CFunction.lt(l, r, true), l, r);
	}
	debugger;
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

Binary.prototype.constantFold = function() {
	var l = this.l.constantFold();
	var r = this.r.constantFold();
	if (l.type == 'const' && r.type == 'const') {
		switch (this.op) {
			default:
				debugger;
				return;
			case 1: // &
				return new Constant(l.value & r.value);
			case 2: // |
				return new Constant(l.value | r.value);
			case 3: // ^
				return new Constant(l.value ^ r.value);
			case 4: // +
				return new Constant(l.value + r.value | 0);
			case 5: // -
				return new Constant(l.value - r.value | 0);
			case 6: // <<
				return new Constant(l.value << (r.value & 31));
			case 7: // >> (unsigned)
				return new Constant(l.value >>> (r.value & 31));
		}
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



function Ternary(cond, t, f) {
	Node.call(this);
	if (cond == null || t == null || f == null) debugger;
	this.hash = (t.hash * 31) ^ (f.hash * 1009) ^ (cond.hash * 65521) ^ 0xdeadbeef;
	this.hash2 = (cond.hash2 & 15) | ((t.hash2 & 15) << 4) | ((f.hash2 & 15) << 8);
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

Ternary.prototype.constantFold = function() {
	var cond = this.cond.constantFold();
	var t = this.t.constantFold();
	var f = this.f.constantFold();
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

Ternary.prototype.containsDoubleUnary = function() {
	return this.cond.containsDoubleUnary() + this.t.containsDoubleUnary() + this.f.containsDoubleUnary();
};

Ternary.prototype.copy = function() {
	return new Ternary(this.cond.copy(), this.t.copy(), this.f.copy());
};