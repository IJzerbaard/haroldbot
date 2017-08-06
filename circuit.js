var circuit = {
	reset: function () {
		this.gates = new Array(1 + 32 * 64);
		this.lowlimit = this.gates.length;
		this.h = new Int32Array(50021 * 2);
		this.xor_elim = 0;
		this.gate_absorbtion = 0;
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

	argument256: function (index) {
		var res = new Int32Array(256);
		for (var i = 0; i < 256; i++)
			res[i] = (index << 8) + (i + 1);
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

	mkbig: function (op, bits) {
		var gate = new Int32Array(1 + bits.length);
		for (var i = 0; i < bits.length; i++)
			gate[i + 1] = bits[i];
		gate[0] = op;

		var index = this.gates.length;
		this.gates[index] = gate;
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
		// sort for extra gate sharing
		var l = Math.min(a, b, c);
		var h = Math.max(a, b, c);
		var m = (a ^ b ^ c) ^ (l ^ h);
		return this.mk3(3, l, m, h,);
	},

	mux: function (x, y, s) {
		// optimize constants
		if (s == 0 || s == -1 || x == y)
			return (s & y) | (~s & x);
		if (x == 0 || x == -1 || y == 0 || y == -1) return this.or(this.and(s, y), this.and(~s, x));
		// always make s positive
		if (s < 0) {
			s = ~s;
			var t = x;
			x = y;
			y = t;
		}
		// always make x positive
		var inv = x >> 31;
		return this.mk3(4, x ^ inv, y ^ inv, s) ^ inv;
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
		res = res.slice(0, j);

		// prevent useless big-gates and small big-gates
		// small gates should use the normal mechanism so they participate in gate-deduplication
		switch (res.length) {
		case 0:
			return 0;
		case 1:
			return res[0];
		case 2:
			return this.or(res[0], res[1]);
		case 3:
			return this.or(this.or(res[0], res[1]), res[2]);
		default:
			return this.mkbig(10, res);
		}
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
				//if (gate.length != 3) debugger;
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
				//if (gate.length != 3) debugger;
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
			else if (gate[0] == 4) {
				// mux
				stack.push(gate[1]);
				stack.push(gate[2]);
				stack.push(gate[3]);
				cl3[0] = ~index;
				cl3[1] = gate[1];
				cl3[2] = gate[3];
				sat.addClause(cl3);
				cl3[0] = index;
				cl3[1] = ~gate[1];
				sat.addClause(cl3);
				cl3[1] = ~gate[2];
				cl3[2] = ~gate[3];
				sat.addClause(cl3);
				cl3[0] = ~index;
				cl3[1] = gate[2];
				sat.addClause(cl3);
			}
			else if (gate[0] == 10) {
				// or_big
				var cl = new Int32Array(gate);
				cl[0] = ~index;
				sat.addClause(cl);
				cl2[1] = index;
				for (var i = 1; i < gate.length; i++) {
					cl2[0] = ~gate[i];
					sat.addClause(cl2);
					stack.push(gate[i]);
				}
			}
			else {
				//debugger;
			}
		} while (stack.length != 0);

		return;
	}
};