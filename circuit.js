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

	mk: function (op, a, b) {
		a = a | 0; b = b | 0;
		// sort for canonical order
		if (b < a) {
			var temp = a;
			a = b;
			b = temp;
		}
		/*
		if (a >= this.gates.length ||
			~a >= this.gates.length ||
			b >= this.gates.length ||
			~b >= this.gates.length)
			debugger;*/
		// make new gate, use only very simple merging of equal gates
		var key = ((op * 991 | 0) + a * 997 | 0) + b * 1009 | 0;
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

	mk_big: function (op, args) {
		/*
		for (var i = 0; i < args.length; i++) {
			var a = args[i];
			if (a >= this.gates.length ||
				~a >= this.gates.length)
				debugger;
		}*/
		// check if its exists
		var key = op * 19 | 0;
		for (var i = 0; i < args.length; i++)
			key = key * 31 + args[i] | 0;
		var hash = (key & 0x7fffffff) % 50021;
		if (this.h[hash << 1] == key) {
			// check match
			var index = this.h[(hash << 1) | 1]
			var gate = this.gates[index];
			if (gate.length == args.length + 1 && gate[0] == op) {
				var equal = true;
				for (var i = 0; i < args.length && equal; i++) {
					equal = equal && args[i] == gate[i + 1];
				}
				if (equal)
					return index;
			}
		}
		// not found, make new gate
		var gate = new Int32Array(args.length + 1);
		gate[0] = op;
		for (var i = 0; i < args.length; i++) gate[i + 1] = args[i];
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

	fa_sum: function (a, b, c) {
		// make arguments positive
		var ainv = a >> 31;
		var binv = b >> 31;
		var cinv = c >> 31;
		var rinv = ainv ^ binv ^ cinv;
		a ^= ainv;
		b ^= binv;
		c ^= cinv;
		// optimize special cases
		if (a == 0)
			return rinv ^ this.xor(b, c);
		if (b == 0)
			return rinv ^ this.xor(a, c);
		if (c == 0)
			return rinv ^ this.xor(a, b);
		// reorder for canonicity
		if (a > b) {
			var t = a;
			a = b;
			b = t;
		}
		if (b > c) {
			var t = b;
			b = c;
			c = t;
		}
		if (a > b) {
			var t = a;
			a = b;
			b = t;
		}
		return rinv ^ this.mk_big(3, a, b, c);
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
					return 0;
			}
			res[j++] = args[i];
		}
		if (j == 0)
			return 0;
		else if (j == 1)
			return res[0];
		else if (j == 2)
			return this.or(res[0], res[1]);

		return this.mk_big(1, res.subarray(0, j));
	},

	and_big: function () {
		var args = Array.from(arguments);
		if (args[0].length)
			args = args[0];
		for (var i = 0; i < args.length; i++)
			args[i] = ~args[i];
		return ~this.or_big(args);
	},

	to_cnf: function (index, sat) {
		sat.addClause(new Int32Array([index]));
		if (index == 0) {
			sat.addClause(new Int32Array([~index]));
			return;
		}
		var stack = [];
		stack.push(index ^ (index >> 31));

		var had = new Int32Array((this.gates.length + 31) >> 5);
		do {
			index = stack.pop();
			if (index == 0 || index == -1)
				continue;
			if ((had[index >> 5] & (1 << (index & 31))) != 0)
				continue;
			had[index >> 5] |= 1 << (index & 31);

			var gate = this.gates[index];
			if (index < 1 + 32 * 64) {
				// input variable, no clause
			}
			else if (gate[0] == 1) {
				// or
				var mainclause = new Int32Array(gate);
				mainclause[0] = ~index;
				sat.addClause(mainclause);
				for (var i = gate.length - 1; i > 0; i--) {
					// also make clauses for dependencies
					var d = gate[i];
					d ^= d >> 31;
					if (d >= this.gates.length)
						debugger;
					stack.push(d);
					// make 2-element clauses
					var cl = new Int32Array(2);
					cl[0] = index;
					cl[1] = ~gate[i];
					sat.addClause(cl);
				}
			}
			else if (gate[0] == 2) {
				// xor
				stack.push(gate[1]);
				stack.push(gate[2]);
				var cl = new Int32Array(gate);
				cl[0] = ~index;
				sat.addClause(cl);
				cl = new Int32Array(gate);
				cl[0] = index;
				cl[1] ^= -1;
				sat.addClause(cl);
				cl = new Int32Array(gate);
				cl[0] = index;
				cl[2] ^= -1;
				sat.addClause(cl);
				cl = new Int32Array(gate);
				cl[0] = ~index;
				cl[1] ^= -1;
				cl[2] ^= -1;
				sat.addClause(cl);
			}
			else if (gate[0] == 3) {
				// 3-xor
				// enqueue dependencies
				stack.push(gate[1]);
				stack.push(gate[2]);
				stack.push(gate[3]);
				var cl = new Int32Array(gate);
				cl[0] = ~index;
			}
			else {
				debugger;
			}
		} while (stack.length != 0);

		return;
	}
};