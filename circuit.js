var circuit = {
	reset: function () {
		this.gates = new Array(1 + 32 * 64);
		this.h = new Int32Array(50021 * 2);
	},

	argument: function (index) {
		var res = new Int32Array(32);
		for (var i = 0; i < 32; i++)
			res[i] = (index << 5) + (i + 1);
		return res;
	},

	argument8: function (index) {
		var res = new Int32Array(8);
		for (var i = 0; i < 8; i++)
			res[i] = (index << 3) + (i + 1);
		return res;
	},

	mk: function (op, a, b) {
		a = a | 0; b = b | 0;
		// sort for canonical order
		if (b < a) {
			var temp = a;
			a = b;
			b = temp;
		}
		// make new gate, use only very simple merging of equal gates
		var key = ((op * 991 | 0) + a * 65537 | 0) + b * 131071 | 0;
		if (key == 0)
			key = 1;
		var hash = (key & 0x7fffffff) % 50021;
		if (this.h[hash << 1] == key) {
			// check match
			var index = this.h[(hash << 1) | 1]
			var gate = this.gates[index];
			if (gate.length == 3 && gate[0] == op && gate[1] == a && gate[2] == b)
				return index;
		}
		// not found, make new gate
		var gate = new Int32Array(3);
		gate[0] = op; gate[1] = a; gate[2] = b;
		var index = this.gates.length;
		this.gates[index] = gate;
		this.h[hash << 1] = key;
		this.h[(hash << 1) | 1] = index;
		return index;
	},

	mk3: function (op, a, b, c) {
		var at = a | 0, bt = b | 0, ct = c | 0;
		// sort for canonical order
		a = Math.min(at, bt, ct);
		b = Math.max(at, bt, ct);
		c = (at ^ bt ^ ct) ^ (a ^ b);
		
		// make new gate, use only very simple merging of equal gates
		var key = (((op * 991 | 0) + a * 65537 | 0) + b * 131071 | 0) + c * 524287 | 0;
		if (key == 0)
			key = 1;
		var hash = (key & 0x7fffffff) % 50021;
		if (this.h[hash << 1] == key) {
			// check match
			var index = this.h[(hash << 1) | 1]
			var gate = this.gates[index];
			if (gate.length == 4 && gate[0] == op && gate[1] == a && gate[2] == b && gate[3] == c)
				return index;
		}
		// not found, make new gate
		var gate = new Int32Array(4);
		gate[0] = op; gate[1] = a; gate[2] = b; gate[3] = c;
		var index = this.gates.length;
		this.gates[index] = gate;
		this.h[hash << 1] = key;
		this.h[(hash << 1) | 1] = index;
		return index;
	},

	or: function (x, y) {
		// propagate constants and x|x and x|~x
		if (x == 0 || y == 0 || x == -1 || y == -1 || x == y || x == ~y)
			return x | y;
		return this.mk(1, x, y);
	},

	and: function (x, y) {
		return ~this.or(~x, ~y);
	},
	
	xor: function (x, y) {
		// optimize constants
		if (x == 0 || y == 0 || x == -1 || y == -1 || x == y || x == ~y)
			return x ^ y;
		// always make both arguments positive
		var xinv = x >> 31;
		var yinv = y >> 31;
		var rinv = xinv ^ yinv;
		return this.mk(2, x ^ xinv, y ^ yinv) ^ rinv;
	},

	carry: function(a, b, c) {
		// optimize constants
		
		if (a == ~b) return c;
		if (a == ~c) return b;
		if (b == ~c) return a;
		if (a == 0 || b == 0) return this.and(a | b, c);
		if (c == 0) 
			return this.and(a, b);
		if (a == -1) return this.or(b, c);
		if (b == -1) return this.or(a, c);
		if (c == -1) return this.or(a, b);
		return this.mk3(3, a, b, c);
		
		return this.or(this.and(a, b), this.and(this.xor(a, b), c));
	},

	or_big: function () {
		var args = Array.from(arguments);
		if (args[0].length)
			args = args[0];
		// insertion sort
		for (var i = 1; i < args.length; i++) {
			var j = i;
			var x = args[i];
			while (j > 0 && args[j - 1] > x) {
				args[j] = args[j - 1];
				j--;
			}
			args[j] = x;
		}
		// remove duplicates, detect constants
		var i = 0;
		var j = 0;
		var res = new Int32Array(args.length);
		for (; i < args.length; i++) {
			if (args[i] == -1)
				return -1;
			if (args[i] == 0)
				continue;
			if (i > 0) {
				if (args[i] == args[i - 1])
					continue;
				else if (args[i] == ~args[i - 1])
					return -1;
			}
			res[j++] = args[i];
		}

		var bits = [0];
		for (var i = j; i >= 0; i--)
			bits.push(res[i]);
		while (bits.length > 1)
			bits.unshift(this.or(bits.pop(), bits.pop()));
		return bits.pop();
	},

	and_big: function () {
		var args = Array.from(arguments);
		if (args[0].length)
			args = args[0];
		for (var i = 0; i < args.length; i++)
			args[i] = ~args[i];
		return ~this.or_big(args);
	},

	to_cnf: function (index, sat, inputs) {
		sat.addClause(new Int32Array([index]));
		if (index == 0) {
			sat.addClause(new Int32Array([~index]));
			return;
		}
		var stack = [];
		stack.push(index ^ (index >> 31));

		if (!inputs)
			inputs = 32 * 64;

		var cl2 = new Int32Array(2);
		var cl3 = new Int32Array(3);
		var cl4 = new Int32Array(4);

		var had = new Int32Array((this.gates.length + 31) >> 5);
		do {
			index = stack.pop();
			index ^= index >> 31;
			if (index == 0 || index == -1)
				continue;
			if ((had[index >> 5] & (1 << (index & 31))) != 0)
				continue;
			had[index >> 5] |= 1 << (index & 31);

			var gate = this.gates[index];
			if (index < 1 + inputs) {
				// input variable, no clause
			}
			else if (gate[0] == 1) {
				if (gate.length != 3) debugger;
				// or
				stack.push(gate[1]);
				stack.push(gate[2]);
				cl3[0] = ~index;
				cl3[1] = gate[1];
				cl3[2] = gate[2];
				sat.addClause(cl3);
				cl2[0] = index;
				cl2[1] = ~gate[1];
				sat.addClause(cl2);
				cl2[1] = ~gate[2];
				sat.addClause(cl2);
			}
			else if (gate[0] == 2) {
				if (gate.length != 3) debugger;
				// xor
				stack.push(gate[1]);
				stack.push(gate[2]);
				cl3[0] = ~index;
				cl3[1] = gate[1];
				cl3[2] = gate[2];
				sat.addClause(cl3);
				cl3[1] = ~gate[1];
				cl3[2] = ~gate[2];
				sat.addClause(cl3);
				cl3[0] = index;
				cl3[1] = ~gate[1];
				cl3[2] = gate[2];
				sat.addClause(cl3);
				cl3[1] = gate[1];
				cl3[2] = ~gate[2];
				sat.addClause(cl3);
			}
			else if (gate[0] == 3) {
				// carry
				stack.push(gate[1]);
				stack.push(gate[2]);
				stack.push(gate[3]);
				cl3[0] = index;
				cl3[1] = ~gate[1];
				cl3[2] = ~gate[2];
				sat.addClause(cl3);
				cl3[2] = ~gate[3];
				sat.addClause(cl3);
				cl3[1] = ~gate[2];
				sat.addClause(cl3);
				cl3[0] = ~index;
				cl3[1] = gate[1];
				cl3[2] = gate[2];
				sat.addClause(cl3);
				cl3[2] = gate[3];
				sat.addClause(cl3);
				cl3[1] = gate[2];
				sat.addClause(cl3);
			}
			else {
				//debugger;
			}
		} while (stack.length != 0);

		return;
	}
};