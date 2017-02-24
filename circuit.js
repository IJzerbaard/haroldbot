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

		var had = new Int32Array((this.gates.length + 31) >> 5);
		do {
			index = stack.pop();
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
			else {
				debugger;
			}
		} while (stack.length != 0);

		return;
	}
};