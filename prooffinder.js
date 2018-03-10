function ProofFinder(op, assocmode) {
	var except_not = 1;
	var except_neg = 2;
	var except_zero = 3;
	var except_unknown_or_zero = 4;
	var except_non_mersenne = 5;

	this.dead = op != 20;
	this.assocmode = assocmode;

	function a(x) {
		return {
			any: x
		};
	}

	function aex(x, ex) {
		return {
			any: x,
			except: ex
		};
	}

	var rules = [
		/*
			rules, format
			[expr from, expr to, mirror, description1, description2?]
			expressions here are arrays [op, args..] or [var/const]
		*/
		// properties of and
		[
			["&", [a(0)], [0]],
			[0],
			false, "and with 0", , 
		],
		[
			["&", [0], [a(0)]],
			[0],
			false, "and with 0", , 
		],
		[
			["&", [a(0)], [-1]],
			[a(0)],
			false, "and with -1", ,
		],
		[
			["&", [-1], [a(0)]],
			[a(0)],
			false, "and with -1", ,
		],
		[
			["&", [a(0)], [a(0)]],
			[a(0)],
			false, "and with self", ,
		],
		[
			["&", [a(0)], ["~", [a(0)]]],
			[0],
			false, "and with complement of self", ,
		],
		[
			["&", ["~", [a(0)]], [a(0)]],
			[0],
			false, "and with complement of self", ,
		],
		[
			["&", ["&", [a(0)], [a(1)]], [a(2)]],
			["&", [a(0)], ["&", [a(1)], [a(2)]]],
			true, "associativity of and", ,
		],
		[
			["&", [a(0)], [a(1)]],
			["&", [a(1)], [a(0)]],
			false, "commutativity of and", ,
		],
		// properties of or
		[
			["|", [a(0)], [0]],
			[a(0)],
			false, "or with 0", ,
		],
		[
			["|", [0], [a(0)]],
			[a(0)],
			false, "or with 0", ,
		],
		[
			["|", [a(0)], [-1]],
			[-1],
			false, "or with -1", ,
		],
		[
			["|", [-1], [a(0)]],
			[-1],
			false, "or with -1", ,
		],
		[
			["|", [a(0)], [a(0)]],
			[a(0)],
			false, "or with self", ,
		],
		[
			["|", [a(0)], ["~", [a(0)]]],
			[-1],
			false, "or with complement of self", ,
		],
		[
			["|", ["~", [a(0)]], [a(0)]],
			[-1],
			false, "or with complement of self", ,
		],
		[
			["|", ["|", [a(0)], [a(1)]], [a(2)]],
			["|", [a(0)], ["|", [a(1)], [a(2)]]],
			true, "associativity of or", ,
		],
		[
			["|", [a(0)], [a(1)]],
			["|", [a(1)], [a(0)]],
			false, "commutativity of or", ,
		],
		[
			["|", ["^", [a(0)], [a(1)]], [a(1)]],
			["|", [a(0)], [a(1)]],
			false, "changed bits are masked", ,
		],
		// properties of xor
		[
			["^", [a(0)], [0]],
			[a(0)],
			false, "xor with 0", ,
		],
		[
			["^", [0], [a(0)]],
			[a(0)],
			false, "xor with 0", ,
		],
		[
			["^", [a(0)], [-1]],
			["~", [a(0)]],
			false, "xor with -1", ,
		],
		[
			["^", [-1], [a(0)]],
			["~", [a(0)]],
			false, "xor with -1", ,
		],
		[
			["^", [a(0)], [a(0)]],
			[0],
			false, "xor with self", ,
		],
		[
			["^", [a(0)], ["~", [a(0)]]],
			[-1],
			false, "xor with complement of self", ,
		],
		[
			["^", ["~", [a(0)]], [a(0)]],
			[-1],
			false, "xor with complement of self", ,
		],
		[
			["^", [a(0)], [a(1)]],
			["|", ["&", [a(0)], ["~", [a(1)]]], ["&", ["~", [a(0)]], [a(1)]]],
			true, "definition #1 of xor", ,
		],
		[
			["|", ["&", ["~", [a(0)]], [a(1)]], ["&", [a(0)], ["~", [a(1)]]]],
			["^", [a(0)], [a(1)]],
			false, "definition #1 of xor", ,
		],
		[
			["^", [a(0)], [a(1)]],
			["&", ["|", [a(0)], [a(1)]], ["|", ["~", [a(0)]], ["~", [a(1)]]]],
			true, "definition #2 of xor", ,
		],
		[
			["&", ["|", ["~", [a(0)]], ["~", [a(1)]]], ["|", [a(0)], [a(1)]]],
			["^", [a(0)], [a(1)]],
			false, "definition #2 of xor", ,
		],
		[
			["^", [a(0)], [a(1)]],
			["&", ["|", [a(0)], [a(1)]], ["~", ["&", [a(0)], [a(1)]]]],
			true, "definition #3 of xor", ,
		],
		[
			["&", ["~", ["&", [a(0)], [a(1)]]], ["|", [a(0)], [a(1)]]],
			["^", [a(0)], [a(1)]],
			false, "definition #3 of xor", ,
		],
		[
			["^", ["^", [a(0)], [a(1)]], [a(2)]],
			["^", [a(0)], ["^", [a(1)], [a(2)]]],
			true, "associativity of xor", ,
		],
		[
			["^", [a(0)], [a(1)]],
			["^", [a(1)], [a(0)]],
			false, "commutativity of xor", ,
		],
		[
			["^", ["~", [a(0)]], [a(1)]],
			["~", ["^", [a(0)], [a(1)]]],
			true, "move complement out of xor", "move complement into xor",
		],
		[
			["^", [a(0)], ["~", [a(1)]]],
			["~", ["^", [a(0)], [a(1)]]],
			true, "move complement out of xor", "move complement into xor",
		],
		[
			["^", ["~", [a(0)]], ["~", [a(1)]]],
			["^", [aex(0, except_not)], [aex(1, except_not)]],
			true, "double complement in xor", ,
		],
		[
			["^", ["~", [a(0)]], [a(1)]],
			["^", [a(0)], ["~", [a(1)]]],
			true, "move complement", ,
		],
		// properties of addition
		[
			["+", [a(0)], [0]],
			[a(0)],
			false, "additive identity", ,
		],
		[
			["+", [0], [a(0)]],
			[a(0)],
			false, "additive identity", ,
		],
		[
			["+", [a(0)], ["~", [a(0)]]],
			[-1],
			false, "add to complement of self", ,
		],
		[
			["+", ["~", [a(0)]], [a(0)]],
			[-1],
			false, "add to complement of self", ,
		],
		[
			["+", [a(0)], ["-", [a(0)]]],
			[0],
			false, "add to negation of self", ,
		],
		[
			["+", ["-", [a(0)]], [a(0)]],
			[0],
			false, "add to negation of self", ,
		],
		[
			["&", ["+", [a(0)], [a(1)]], [aex(2, except_non_mersenne)]],
			["&", ["+", ["&", [a(0)], [aex(2, except_non_mersenne)]], ["&", [a(1)], [aex(2, except_non_mersenne)]]], [aex(2, except_non_mersenne)]],
			false, "low bits of the result depend only on low bits of the inputs (condition: z is a power of two minus one)", ,
		],
		[
			["&", ["+", ["&", [a(0)], [aex(1, except_non_mersenne)]], ["&", [a(2)], [aex(1, except_non_mersenne)]]], [aex(1, except_non_mersenne)]],
			["&", ["+", [a(0)], [a(2)]], [aex(1, except_non_mersenne)]],
			false, "low bits of the result depend only on low bits of the inputs (condition: y is a power of two minus one)", ,
		],
		[
			["+", ["+", [a(0)], [a(1)]], [a(2)]],
			["+", [a(0)], ["+", [a(1)], [a(2)]]],
			true, "associativity of addition", ,
		],
		[
			["+", [a(0)], [a(1)]],
			["+", [a(1)], [a(0)]],
			false, "commutativity of addition", ,
		],
		
		// properties of subtraction
		[
			["-", [a(0)], [0]],
			[a(0)],
			false, "subtract zero", ,
		],
		[
			["-", [-1], [a(0)]],
			["~", [a(0)]],
			false, "subtract from -1 is complement", ,
		],
		[
			["-", [a(0)], [a(0)]],
			[0],
			false, "subtract from self", ,
		],
		[
			["-", [a(0)]],
			["-", [0], [a(0)]],
			true, "definition of negation", ,
		],
		[
			["-", [aex(0, except_zero)], [a(1)]],
			["-", ["-", [a(1)], [a(0)]]],
			true, "anticommutativity of subtraction", ,
		],
		[
			["&", ["-", [a(0)], [a(1)]], [aex(2, except_non_mersenne)]],
			["&", ["-", ["&", [a(0)], [aex(2, except_non_mersenne)]], ["&", [a(1)], [aex(2, except_non_mersenne)]]], [aex(2, except_non_mersenne)]],
			false, "low bits of the result depend only on low bits of the inputs (condition: z is a power of two minus one)", ,
		],
		[
			["&", ["-", ["&", [a(0)], [aex(1, except_non_mersenne)]], ["&", [a(2)], [aex(1, except_non_mersenne)]]], [aex(1, except_non_mersenne)]],
			["&", ["-", [a(0)], [a(2)]], [aex(1, except_non_mersenne)]],
			false, "low bits of the result depend only on low bits of the inputs (condition: y is a power of two minus one)", ,
		],
		// properties of rbit
		[
			["$reverse", ["$reverse", [a(0)]]],
			[a(0)],
			false, "double reverse", ,
		],
		// properties of mux
		[
			["?", [0], [a(0)], [a(1)]],
			[a(1)],
			false, "mux with 0", ,
		],
		[
			["?", [-1], [a(0)], [a(1)]],
			[a(0)],
			false, "mux with -1", ,
		],
		[
			["?", ["~", [a(0)]], [a(1)], [a(2)]],
			["?", [a(0)], [a(2)], [a(1)]],
			false, "swap arguments of mux", ,
		],
		[
			["?", [a(0)], [a(1)], ["?", [a(0)], [a(2)], [a(3)]]],
			["?", [a(0)], [a(1)], [a(3)]],
			false, "the same condition must have the same value in both uses", ,
		],
		[
			["?", [a(0)], ["?", [a(0)], [a(1)], [a(2)]], [a(3)]],
			["?", [a(0)], [a(1)], [a(3)]],
			false, "the same condition must have the same value in both uses", ,
		],
		[
			["?", [a(0)], [a(1)], [a(2)]],
			["|", ["&", [a(0)], [a(1)]], ["&", ["~", [a(0)]], [a(2)]]],
			true, "definition of mux", ,
		],
		[
			["?", [a(0)], [a(1)], [a(2)]],
			["|", ["&", [a(0)], [a(1)]], ["&", [a(2)], ["~", [a(0)]]]],
			true, "definition of mux", ,
		],
		[
			["|", ["&", ["~", [a(0)]], [a(1)]], ["&", [a(0)], [a(2)]]],
			["?", [a(0)], [a(2)], [a(1)]],
			false, "definition of mux", ,
		],
		// properties of min_u
		[
			["$min_u", [a(0)], [0]],
			[0],
			false, "zero is the smallest unsigned number", ,
		],
		[
			["$min_u", [a(0)], [-1]],
			[a(0)],
			false, "-1 is the highest unsigned number", ,
		],
		[
			["$min_u", [a(0)], [a(0)]],
			[a(0)],
			false, "minimum with self", ,
		],
		[
			["$min_u", [a(0)], ["$min_u", [a(1)], [a(2)]]],
			["$min_u", ["$min_u", [a(0)], [a(1)]], [a(2)]],
			true, "associativity of minimum", ,
		],
		[
			["$min_u", [a(0)], [a(1)]],
			["$min_u", [a(1)], [a(0)]],
			false, "commutativity of minimum", ,
		],
		[
			["$min_u", [a(0)], [a(1)]],
			["?", ["<u", [a(0)], [a(1)]], [a(0)], [a(1)]],
			true, "definition of minimum", ,
		],
		// properties of min_s
		[
			["$min_s", [a(0)], [0x80000000]],
			[0x80000000],
			false, "min_s with the smallest signed number", ,
		],
		[
			["$min_s", [a(0)], [0x7fffffff]],
			[a(0)],
			false, "min_s with the highest signed number", ,
		],
		[
			["$min_s", [a(0)], [a(0)]],
			[a(0)],
			false, "minimum with self", ,
		],
		[
			["$min_s", [a(0)], ["$min_s", [a(1)], [a(2)]]],
			["$min_s", ["$min_s", [a(0)], [a(1)]], [a(2)]],
			true, "associativity of minimum", ,
		],
		[
			["$min_s", [a(0)], [a(1)]],
			["$min_s", [a(1)], [a(0)]],
			false, "commutativity of minimum", ,
		],
		[
			["$min_s", [a(0)], [a(1)]],
			["?", ["<s", [a(0)], [a(1)]], [a(0)], [a(1)]],
			true, "definition of minimum", ,
		],
		// properties of max_u
		[
			["$max_u", [a(0)], [0]],
			[a(0)],
			false, "zero is the smallest unsigned number", ,
		],
		[
			["$max_u", [a(0)], [-1]],
			[-1],
			false, "-1 is the highest unsigned number", ,
		],
		[
			["$max_u", [a(0)], [a(0)]],
			[a(0)],
			false, "maximum with self", ,
		],
		[
			["$max_u", [a(0)], ["$max_u", [a(1)], [a(2)]]],
			["$max_u", ["$max_u", [a(0)], [a(1)]], [a(2)]],
			true, "associativity of maximum", ,
		],
		[
			["$max_u", [a(0)], [a(1)]],
			["$max_u", [a(1)], [a(0)]],
			false, "commutativity of maximum", ,
		],
		[
			["$max_u", [a(0)], [a(1)]],
			["?", [">u", [a(0)], [a(1)]], [a(0)], [a(1)]],
			true, "definition of maximum", ,
		],
		// properties of max_s
		[
			["$max_s", [a(0)], [0x80000000]],
			[a(0)],
			false, "max_s with the smallest signed number", ,
		],
		[
			["$max_s", [a(0)], [0x7fffffff]],
			[0x7fffffff],
			false, "max_s with the highest signed number", ,
		],
		[
			["$max_s", [a(0)], [a(0)]],
			[a(0)],
			false, "maximum with self", ,
		],
		[
			["$max_s", [a(0)], ["$max_s", [a(1)], [a(2)]]],
			["$max_s", ["$max_s", [a(0)], [a(1)]], [a(2)]],
			true, "associativity of maximum", ,
		],
		[
			["$max_s", [a(0)], [a(1)]],
			["$max_s", [a(1)], [a(0)]],
			false, "commutativity of maximum", ,
		],
		[
			["$max_s", [a(0)], [a(1)]],
			["?", [">s", [a(0)], [a(1)]], [a(0)], [a(1)]],
			true, "definition of maximum", ,
		],
		// properties of left shift
		[
			["<<", [a(0)], [0]],
			[a(0)],
			false, "shift by zero", ,
		],
		[
			["<<", [a(0)], [1]],
			["+", [a(0)], [a(0)]],
			false, "shift by one is *2", ,
		],
		[
			["<<", [a(0)], [1]],
			["*", [a(0)], [2]],
			false, "shift by one is *2", ,
		],
		// properties of multiplication
		[
			["*", ["*", [a(0)], [a(1)]], [a(2)]],
			["*", [a(0)], ["*", [a(1)], [a(2)]]],
			true, "associativity of multiplication", ,
		],
		[
			["*", [a(0)], [a(1)]],
			["*", [a(1)], [a(0)]],
			false, "commutativity of multiplication", ,
		],
		[
			["*", [a(0)], [1]],
			[a(0)],
			false, "multiplicative identity", ,
		],
		[
			["*", [1], [a(0)]],
			[a(0)],
			false, "multiplicative identity", ,
		],
		[
			["*", [a(0)], [-1]],
			["-", [a(0)]],
			false, "multiplication by minus one", ,
		],
		[
			["&", ["*", [a(0)], [a(1)]], [aex(2, except_non_mersenne)]],
			["&", ["*", ["&", [a(0)], [aex(2, except_non_mersenne)]], ["&", [a(1)], [aex(2, except_non_mersenne)]]], [aex(2, except_non_mersenne)]],
			false, "low bits of the result depend only on low bits of the inputs (condition: z is a power of two minus one)", ,
		],
		[
			["&", ["*", ["&", [a(0)], [aex(1, except_non_mersenne)]], ["&", [a(2)], [aex(1, except_non_mersenne)]]], [aex(1, except_non_mersenne)]],
			["&", ["*", [a(0)], [a(2)]], [aex(1, except_non_mersenne)]],
			false, "low bits of the result depend only on low bits of the inputs (condition: y is a power of two minus one)", ,
		],
		// properties of clmul
		[
			["$clmul", ["$clmul", [a(0)], [a(1)]], [a(2)]],
			["$clmul", [a(0)], ["$clmul", [a(1)], [a(2)]]],
			true, "associativity of carryless multiplication", ,
		],
		[
			["$clmul", [a(0)], [a(1)]],
			["$clmul", [a(1)], [a(0)]],
			false, "commutativity of carryless multiplication", ,
		],
		[
			["$clmul", [a(0)], [1]],
			[a(0)],
			false, "multiplicative identity", ,
		],
		[
			["$clmul", [1], [a(0)]],
			[a(0)],
			false, "multiplicative identity", ,
		],
		// properties of reverse
		[
			["$reverse", ["$reverse", [a(0)]]],
			[a(0)],
			false, "double reverse cancels", ,
		],
		// properties of nlz
		[
			["$nlz", [a(0)]],
			["&", ["$nlz", [a(0)]], [0x3F]],
			true, "nlz only goes up to 32, so the top bits are always zero", ,
		],
		// properties of ntz
		[
			["$ntz", [a(0)]],
			["&", ["$ntz", [a(0)]], [0x3F]],
			true, "ntz only goes up to 32, so the top bits are always zero", ,
		],
		// properties of popcnt
		[
			["$popcnt", [a(0)]],
			["&", ["$popcnt", [a(0)]], [0x3F]],
			true, "popcnt only goes up to 32, so the top bits are always zero", ,
		],
		[
			["$popcnt", ["~", [a(0)]]],
			["-", [32], ["$popcnt", [a(0)]]],
			true, "count the bits that are zero", ,
		],
		[
			["+", ["$popcnt", [a(0)]], ["$popcnt", ["~", [a(0)]]]],
			[32],
			false, "the number of ones plus the number of zeroes is all bits", ,
		],
		// properties of ==
		[
			["==", [a(0)], [a(0)]],
			[-1],
			false, "equality is reflexive", ,
		],
		[
			["==", [a(0)], ["~", [a(0)]]],
			[0],
			false, "nothing is equal to its complement", ,
		],
		[
			["==", ["~", [a(0)]], [a(0)]],
			[0],
			false, "nothing is equal to its complement", ,
		],
		[
			["==", [a(0)], ["^", [a(0)], [aex(1, except_unknown_or_zero)]]],
			[0],
			false, "some bits changed, so unequal", ,
		],
		[
			["==", ["^", [a(0)], [aex(1, except_unknown_or_zero)]], [a(0)]],
			[0],
			false, "some bits changed, so unequal", ,
		],
		[
			["==", [a(0)], ["+", [a(0)], [aex(1, except_unknown_or_zero)]]],
			[0],
			false, "adding a non-zero amount changes the value", ,
		],
		[
			["==", ["+", [a(0)], [aex(1, except_unknown_or_zero)]], [a(0)]],
			[0],
			false, "adding a non-zero amount changes the value", ,
		],
		[
			["==", ["^", [a(0)], [a(1)]], [a(2)]],
			["==", [a(1)], ["^", [a(2)], [a(0)]]],
			false, "xor with x on both sides", ,
		],
		[
			["==", ["^", [a(0)], [a(1)]], [a(2)]],
			["==", [a(0)], ["^", [a(2)], [a(1)]]],
			false, "xor with y on both sides", ,
		],
		[
			["==", [a(0)], ["^", [a(1)], [a(2)]]],
			["==", ["^", [a(0)], [a(1)]], [a(2)]],
			false, "xor with y on both sides", ,
		],
		[
			["==", [a(0)], ["^", [a(1)], [a(2)]]],
			["==", ["^", [a(0)], [a(2)]], [a(1)]],
			false, "xor with z on both sides", ,
		],
		[
			["==", ["$popcnt", [a(0)]], [0]],
			["==", [a(0)], [0]],
			false, "only 0 has no bits set", ,
		],
		[
			["==", ["$popcnt", [a(0)]], [32]],
			["==", [a(0)], [-1]],
			false, "only -1 has all bits set", ,
		],
		[
			["==", ["$nlz", [a(0)]], [32]],
			["==", [a(0)], [0]],
			false, "only 0 has 32 leading zeroes", ,
		],
		[
			["==", ["$ntz", [a(0)]], [32]],
			["==", [a(0)], [0]],
			false, "only 0 has 32 trailing zeroes", ,
		],
		[
			["==", [a(0)], [a(1)]],
			["==", [a(1)], [a(0)]],
			false, "commutativity of equality", ,
		],
		// properties of <s
		[
			["<s", [a(0)], [0]],
			[">>s", [a(0)], [31]],
			true, "numbers are negative iff the top bit is set", ,
		],
		// properties of bzhi
		[
			["$bzhi", [a(0)], [0]],
			[0],
			false, "zero all bits", ,
		],
		[
			["$bzhi", [a(0)], [32]],
			[a(0)],
			false, "zero no bits", ,
		],
		[
			["$bzhi", ["$bzhi", [a(0)], [a(1)]], [a(1)]],
			["$bzhi", [a(0)], [a(1)]],
			false, "multiple bzhi with the same index", ,
		],

		// interrelations between operations

		// absorption
		[
			["&", [a(0)], ["|", [a(0)], [a(1)]]],
			[a(0)],
			false, "and cancels or (absorption law)", ,
		],
		[
			["|", [a(0)], ["&", [a(0)], [a(1)]]],
			[a(0)],
			false, "or cancels and (absorption law)", ,
		],
		// De Morgan
		[
			["~", ["&", [a(0)], [a(1)]]],
			["|", ["~", [a(0)]], ["~", [a(1)]]],
			true, "De Morgan's law", ,
		],
		[
			["~", ["|", [a(0)], [a(1)]]],
			["&", ["~", [a(0)]], ["~", [a(1)]]],
			true, "De Morgan's law", ,
		],
		// double operation
		[
			["~", ["~", [a(0)]]],
			[aex(0, except_not)],
			true, "double complement", ,
		],
		[
			["-", ["-", [a(0)]]],
			[aex(0, except_neg)],
			true, "double negation", ,
		],
		[
			["$abs", ["$abs", [a(0)]]],
			["$abs", [a(0)]],
			false, "abs is idempotent", ,
		],
		// carryless square move
		[
			["^", ["$clmul", [a(0)], [a(0)]], ["$clmul", [a(1)], [a(1)]]],
			["$clmul", ["^", [a(0)], [a(1)]], ["^", [a(0)], [a(1)]]],
			true, "move XOR into carryless square", "move XOR out of carryless square" ,
		],
		[
			["&", ["$clmul", [a(0)], [a(0)]], ["$clmul", [a(1)], [a(1)]]],
			["$clmul", ["&", [a(0)], [a(1)]], ["&", [a(0)], [a(1)]]],
			true, "move AND into carryless square", "move AND out of carryless square" ,
		],
		[
			["|", ["$clmul", [a(0)], [a(0)]], ["$clmul", [a(1)], [a(1)]]],
			["$clmul", ["|", [a(0)], [a(1)]], ["|", [a(0)], [a(1)]]],
			true, "move OR into carryless square", "move OR out of carryless square" ,
		],
		[
			["^", ["$clmul", [a(0)], [a(0)]], ["$clmul", [a(1)], [a(1)]]],
			["$clmul", ["^", [a(0)], [a(1)]], ["^", [a(0)], [a(1)]]],
			true, "move XOR into carryless square", "move XOR out of carryless square" ,
		],
		[
			["$reverse", ["$clmul", [a(0)], [a(0)]]],
			["$clmul", ["$reverse", [a(0)]], ["$reverse", [a(0)]]],
			true, "move reverse into carryless square", "move reverse out of carryless square" ,
		],
		// double shift
		[
			["<<", [">>u", [a(0)], [a(1)]], [a(1)]],
			["&", [a(0)], ["-", ["<<", [1], [a(1)]]]],
			true, "truncate rightmost bits", ,
		],
		[
			["<<", [">>s", [a(0)], [a(1)]], [a(1)]],
			["&", [a(0)], ["-", ["<<", [1], [a(1)]]]],
			true, "truncate rightmost bits", ,
		],
		// distributivity pairs
		[
			["-", ["+", [a(0)], [a(1)]]],
			["-", ["-", [a(0)]], [a(1)]],
			true, "negation distributes over addition", ,
		],
		[
			["&", [a(0)], ["|", [a(1)], [a(2)]]],
			["|", ["&", [a(0)], [a(1)]], ["&", [a(0)], [a(2)]]],
			true, "and distributes over or", ,
		],
		[
			["|", ["&", [a(0)], [a(1)]], ["&", [a(2)], [a(1)]]],
			["&", ["|", [a(0)], [a(2)]], [a(1)]],
			true, "and distributes over or", ,
		],
		[
			["&", [a(0)], ["^", [a(1)], [a(2)]]],
			["^", ["&", [a(0)], [a(1)]], ["&", [a(0)], [a(2)]]],
			true, "and distributes over xor", ,
		],
		[
			["^", ["&", [a(0)], [a(1)]], ["&", [a(2)], [a(1)]]],
			["&", ["^", [a(0)], [a(2)]], [a(1)]],
			true, "and distributes over xor", ,
		],
		[
			["|", [a(0)], ["&", [a(1)], [a(2)]]],
			["&", ["|", [a(0)], [a(1)]], ["|", [a(0)], [a(2)]]],
			true, "or distributes over and", ,
		],
		[
			["&", ["|", [a(0)], [a(1)]], ["|", [a(2)], [a(1)]]],
			["|", ["&", [a(0)], [a(2)]], [a(1)]],
			true, "or distributes over and", ,
		],
		[
			["*", [a(0)], ["+", [a(1)], [a(2)]]],
			["+", ["*", [a(0)], [a(1)]], ["*", [a(0)], [a(2)]]],
			true, "multiplication distributes over addition", ,
		],
		[
			["+", ["*", [a(0)], [a(1)]], ["*", [a(2)], [a(1)]]],
			["*", ["+", [a(0)], [a(2)]], [a(1)]],
			true, "multiplication distributes over addition", ,
		],
		[
			["*", [a(0)], ["-", [a(1)], [a(2)]]],
			["-", ["*", [a(0)], [a(1)]], ["*", [a(0)], [a(2)]]],
			true, "multiplication distributes over subtraction", ,
		],
		[
			["-", ["*", [a(0)], [a(1)]], ["*", [a(2)], [a(1)]]],
			["*", ["-", [a(0)], [a(2)]], [a(1)]],
			true, "multiplication distributes over subtraction", ,
		],
		[
			["$max_u", [a(0)], ["$min_u", [a(1)], [a(2)]]],
			["$min_u", ["$max_u", [a(0)], [a(1)]], ["$max_u", [a(0)], [a(2)]]],
			true, "maximum distributes over minimum", ,
		],
		[
			["$min_u", ["$max_u", [a(0)], [a(1)]], ["$max_u", [a(2)], [a(1)]]],
			["$max_u", ["$min_u", [a(0)], [a(2)]], [a(1)]],
			true, "maximum distributes over minimum", ,
		],
		[
			["$max_s", [a(0)], ["$min_s", [a(1)], [a(2)]]],
			["$min_s", ["$max_s", [a(0)], [a(1)]], ["$max_s", [a(0)], [a(2)]]],
			true, "maximum distributes over minimum", ,
		],
		[
			["$min_s", ["$max_s", [a(0)], [a(1)]], ["$max_s", [a(2)], [a(1)]]],
			["$max_s", ["$min_s", [a(0)], [a(2)]], [a(1)]],
			true, "maximum distributes over minimum", ,
		],
		[
			["&", ["$reverse", [a(0)]], ["$reverse", [a(1)]]],
			["$reverse", ["&", [a(0)], [a(1)]]],
			true, "reverse distributes over and"
		],
		[
			["^", ["$reverse", [a(0)]], ["$reverse", [a(1)]]],
			["$reverse", ["^", [a(0)], [a(1)]]],
			true, "reverse distributes over xor"
		],
		[
			["|", ["$reverse", [a(0)]], ["$reverse", [a(1)]]],
			["$reverse", ["|", [a(0)], [a(1)]]],
			true, "reverse distributes over or"
		],
		// shifts over or
		[
			["<<", ["|", [a(0)], [a(1)]], [a(2)]],
			["|", ["<<", [a(0)], [a(2)]], ["<<", [a(1)], [a(2)]]],
			false, "left shift distributes over or", ,
		],
		[
			["|", ["<<", [a(0)], [a(1)]], ["<<", [a(2)], [a(1)]]],
			["<<", ["|", [a(0)], [a(2)]], [a(1)]],
			false, "left shift distributes over or", ,
		],
		[
			[">>u", ["|", [a(0)], [a(1)]], [a(2)]],
			["|", [">>u", [a(0)], [a(2)]], [">>u", [a(1)], [a(2)]]],
			false, "right shift distributes over or", ,
		],
		[
			["|", [">>u", [a(0)], [a(1)]], [">>u", [a(2)], [a(1)]]],
			[">>u", ["|", [a(0)], [a(2)]], [a(1)]],
			false, "right shift distributes over or", ,
		],
		[
			[">>s", ["|", [a(0)], [a(1)]], [a(2)]],
			["|", [">>s", [a(0)], [a(2)]], [">>s", [a(1)], [a(2)]]],
			false, "right shift distributes over or", ,
		],
		[
			["|", [">>s", [a(0)], [a(1)]], [">>s", [a(2)], [a(1)]]],
			[">>s", ["|", [a(0)], [a(2)]], [a(1)]],
			false, "right shift distributes over or", ,
		],
		// shifts over and
		[
			["<<", ["&", [a(0)], [a(1)]], [a(2)]],
			["&", ["<<", [a(0)], [a(2)]], ["<<", [a(1)], [a(2)]]],
			false, "left shift distributes over and", ,
		],
		[
			["&", ["<<", [a(0)], [a(1)]], ["<<", [a(2)], [a(1)]]],
			["<<", ["&", [a(0)], [a(2)]], [a(1)]],
			false, "left shift distributes over and", ,
		],
		[
			[">>u", ["&", [a(0)], [a(1)]], [a(2)]],
			["&", [">>u", [a(0)], [a(2)]], [">>u", [a(1)], [a(2)]]],
			false, "right shift distributes over and", ,
		],
		[
			["&", [">>u", [a(0)], [a(1)]], [">>u", [a(2)], [a(1)]]],
			[">>u", ["&", [a(0)], [a(2)]], [a(1)]],
			false, "right shift distributes over and", ,
		],
		[
			[">>s", ["&", [a(0)], [a(1)]], [a(2)]],
			["&", [">>s", [a(0)], [a(2)]], [">>s", [a(1)], [a(2)]]],
			false, "right shift distributes over and", ,
		],
		[
			["&", [">>s", [a(0)], [a(1)]], [">>s", [a(2)], [a(1)]]],
			[">>s", ["&", [a(0)], [a(2)]], [a(1)]],
			false, "right shift distributes over and", ,
		],
		// shifts over xor
		[
			["<<", ["^", [a(0)], [a(1)]], [a(2)]],
			["^", ["<<", [a(0)], [a(2)]], ["<<", [a(1)], [a(2)]]],
			false, "left shift distributes over xor", ,
		],
		[
			["^", ["<<", [a(0)], [a(1)]], ["<<", [a(2)], [a(1)]]],
			["<<", ["^", [a(0)], [a(2)]], [a(1)]],
			false, "left shift distributes over xor", ,
		],
		[
			[">>u", ["^", [a(0)], [a(1)]], [a(2)]],
			["^", [">>u", [a(0)], [a(2)]], [">>u", [a(1)], [a(2)]]],
			false, "right shift distributes over xor", ,
		],
		[
			["^", [">>u", [a(0)], [a(1)]], [">>u", [a(2)], [a(1)]]],
			[">>u", ["^", [a(0)], [a(2)]], [a(1)]],
			false, "right shift distributes over xor", ,
		],
		[
			[">>s", ["^", [a(0)], [a(1)]], [a(2)]],
			["^", [">>s", [a(0)], [a(2)]], [">>s", [a(1)], [a(2)]]],
			false, "right shift distributes over xor", ,
		],
		[
			["^", [">>s", [a(0)], [a(1)]], [">>s", [a(2)], [a(1)]]],
			[">>s", ["^", [a(0)], [a(2)]], [a(1)]],
			false, "right shift distributes over xor", ,
		],
		// bitwise operations distribute over mux
		[
			["~", ["?", [a(0)], [a(1)], [a(2)]]],
			["?", [a(0)], ["~", [a(1)]], ["~", [a(2)]]],
			true, "complement distributes over mux", ,
		],
		[
			["&", ["?", [a(0)], [a(1)], [a(2)]], [a(3)]],
			["?", [a(0)], ["&", [a(1)], [a(3)]], ["&", [a(2)], [a(3)]]],
			true, "and distributes over mux", ,
		],
		[
			["|", ["?", [a(0)], [a(1)], [a(2)]], [a(3)]],
			["?", [a(0)], ["|", [a(1)], [a(3)]], ["|", [a(2)], [a(3)]]],
			true, "or distributes over mux", ,
		],
		[
			["^", ["?", [a(0)], [a(1)], [a(2)]], [a(3)]],
			["?", [a(0)], ["^", [a(1)], [a(3)]], ["^", [a(2)], [a(3)]]],
			true, "xor distributes over mux", ,
		],
		[
			["$reverse", ["?", [a(0)], [a(1)], [a(2)]]],
			["?", ["$reverse", [a(0)]], ["$reverse", [a(1)]], ["$reverse", [a(2)]]],
			true, "reverse distributes over mux", ,
		],
		// reverse distributes over all bitwise operations
		[
			["$reverse", ["&", [a(0)], [a(1)]]],
			["&", ["$reverse", [a(0)]], ["$reverse", [a(1)]]],
			true, "reverse distributes over and", ,
		],
		[
			["$reverse", ["|", [a(0)], [a(1)]]],
			["|", ["$reverse", [a(0)]], ["$reverse", [a(1)]]],
			true, "reverse distributes over or", ,
		],
		[
			["$reverse", ["^", [a(0)], [a(1)]]],
			["^", ["$reverse", [a(0)]], ["$reverse", [a(1)]]],
			true, "reverse distributes over xor", ,
		],
		// bzhi distributes over some stuff
		[
			["$bzhi", ["|", [a(0)], [a(1)]], [a(2)]],
			["|", ["$bzhi", [a(0)], [a(2)]], ["$bzhi", [a(1)], [a(2)]]],
			true, "bzhi distributes over or", ,
		],
		[
			["|", ["$bzhi", [a(0)], [a(1)]], ["$bzhi", [a(2)], [a(1)]]],
			["$bzhi", ["|", [a(0)], [a(2)]], [a(1)]],
			true, "bzhi distributes over or", ,
		],
		[
			["$bzhi", ["^", [a(0)], [a(1)]], [a(2)]],
			["^", ["$bzhi", [a(0)], [a(2)]], ["$bzhi", [a(1)], [a(2)]]],
			true, "bzhi distributes over xor", ,
		],
		[
			["^", ["$bzhi", [a(0)], [a(1)]], ["$bzhi", [a(2)], [a(1)]]],
			["$bzhi", ["^", [a(0)], [a(2)]], [a(1)]],
			true, "bzhi distributes over xor", ,
		],
		[
			["$bzhi", ["&", [a(0)], [a(1)]], [a(2)]],
			["&", ["$bzhi", [a(0)], [a(2)]], ["$bzhi", [a(1)], [a(2)]]],
			true, "bzhi distributes over and", ,
		],
		[
			["&", ["$bzhi", [a(0)], [a(1)]], ["$bzhi", [a(2)], [a(1)]]],
			["$bzhi", ["&", [a(0)], [a(2)]], [a(1)]],
			true, "bzhi distributes over or", ,
		],
		// reversing a boolean has no effect
		[
			["$reverse", ["==", [a(0)], [a(1)]]],
			["==", [a(0)], [a(1)]],
			false, "reversing a boolean has no effect", ,
		],
		[
			["$reverse", ["!=", [a(0)], [a(1)]]],
			["!=", [a(0)], [a(1)]],
			false, "reversing a boolean has no effect", ,
		],
		[
			["$reverse", ["<u", [a(0)], [a(1)]]],
			["<u", [a(0)], [a(1)]],
			false, "reversing a boolean has no effect", ,
		],
		[
			["$reverse", ["<s", [a(0)], [a(1)]]],
			["<s", [a(0)], [a(1)]],
			false, "reversing a boolean has no effect", ,
		],
		[
			["$reverse", ["<=u", [a(0)], [a(1)]]],
			["<=u", [a(0)], [a(1)]],
			false, "reversing a boolean has no effect", ,
		],
		[
			["$reverse", ["<=s", [a(0)], [a(1)]]],
			["<=s", [a(0)], [a(1)]],
			false, "reversing a boolean has no effect", ,
		],
		// binomials
		[
			["*", ["+", [a(0)], [a(1)]], ["+", [a(2)], [a(3)]]],
			["+", ["*", [a(0)], [a(2)]], ["+", ["*", [a(0)], [a(3)]], ["+", ["*", [a(1)], [a(2)]], ["&", [a(1)], [a(3)]]]]],
			true, "work out product of binomials", "factor into binomials",
		],
		[
			["&", ["^", [a(0)], [a(1)]], ["^", [a(2)], [a(3)]]],
			["^", ["&", [a(0)], [a(2)]], ["^", ["&", [a(0)], [a(3)]], ["^", ["&", [a(1)], [a(2)]], ["&", [a(1)], [a(3)]]]]],
			true, "work out product of binomials (GF(2))", "factor into binomials (GF(2))",
		],
		[
			["&", ["^", [a(0)], [a(1)]], ["^", [a(2)], [a(3)]]],
			["^", ["^", ["^", ["&", [a(0)], [a(2)]], ["&", [a(0)], [a(3)]]], ["&", [a(1)], [a(2)]]], ["&", [a(1)], [a(3)]]],
			true, "work out product of binomials (GF(2))", "factor into binomials (GF(2))",
		],
		// top bit addition
		[
			["+", [a(0)], [0x80000000|0]],
			["^", [a(0)], [0x80000000|0]],
			true, "carry out of the top bit is irrelevant", ,
		],
		[
			["-", [a(0)], [0x80000000|0]],
			["^", [a(0)], [0x80000000|0]],
			true, "borrow out of the top bit is irrelevant", ,
		],
		// hmul/division
		[
			[">>u", ["$hmul_u", [a(0)], [0xaaaaaaab|0]], [1]],
			["/u", [a(0)], [3]],
			false, "divide by hmul", ,
		],
		[
			[">>u", ["$hmul_u", [a(0)], [0xcccccccd|0]], [2]],
			["/u", [a(0)], [5]],
			false, "divide by hmul", ,
		],
		// (a & b) op (a | b)
		[
			["+", ["&", [a(0)], [a(1)]], ["|", [a(0)], [a(1)]]],
			["+", [a(0)], [a(1)]],
			false, "bit-level commutativity of addition", ,
		],
		[
			["^", ["&", [a(0)], [a(1)]], ["|", [a(0)], [a(1)]]],
			["^", [a(0)], [a(1)]],
			false, "bit-level commutativity of xor", ,
		],
		[
			["|", ["&", [a(0)], [a(1)]], ["|", [a(0)], [a(1)]]],
			["|", [a(0)], [a(1)]],
			false, "bit-level commutativity of or", ,
		],
		[
			["&", ["&", [a(0)], [a(1)]], ["|", [a(0)], [a(1)]]],
			["&", [a(0)], [a(1)]],
			false, "bit-level commutativity of and", ,
		],


		
		// two's complement relations
		[
			["-", [a(0)]],
			["+", ["~", [a(0)]], [1]],
			true, "definition of two's complement", ,
		],
		[
			["-", [a(0)]],
			["~", ["-", [a(0)], [1]]],
			true, "definition of two's complement", ,
		],
		// relate signed and unsigned comparison
		[
			["<u", [a(0)], [a(1)]],
			["<s", ["^", [a(0)], [0x80000000]], ["^", [a(1)], [0x80000000]]],
			true, "unsigned/signed comparison conversion", ,
		],
		[
			["<s", [a(0)], [a(1)]],
			["<u", ["^", [a(0)], [0x80000000]], ["^", [a(1)], [0x80000000]]],
			true, "unsigned/signed comparison conversion", ,
		],
		[
			["<=u", [a(0)], [a(1)]],
			["<=s", ["^", [a(0)], [0x80000000]], ["^", [a(1)], [0x80000000]]],
			true, "unsigned/signed comparison conversion", ,
		],
		[
			["<=s", [a(0)], [a(1)]],
			["<=u", ["^", [a(0)], [0x80000000]], ["^", [a(1)], [0x80000000]]],
			true, "unsigned/signed comparison conversion", ,
		],
		[
			[">u", [a(0)], [a(1)]],
			[">s", ["^", [a(0)], [0x80000000]], ["^", [a(1)], [0x80000000]]],
			true, "unsigned/signed comparison conversion", ,
		],
		[
			[">s", [a(0)], [a(1)]],
			[">u", ["^", [a(0)], [0x80000000]], ["^", [a(1)], [0x80000000]]],
			true, "unsigned/signed comparison conversion", ,
		],
		[
			[">=u", [a(0)], [a(1)]],
			[">=s", ["^", [a(0)], [0x80000000]], ["^", [a(1)], [0x80000000]]],
			true, "unsigned/signed comparison conversion", ,
		],
		[
			[">=s", [a(0)], [a(1)]],
			[">=u", ["^", [a(0)], [0x80000000]], ["^", [a(1)], [0x80000000]]],
			true, "unsigned/signed comparison conversion", ,
		],
		// relate signed and unsigned max and min
		[
			["^", ["$min_u", ["^", [a(0)], [0x80000000]], ["^", [a(1)], [0x80000000]]], [0x80000000]],
			["$min_s", [a(0)], [a(1)]],
			false, "convert unsigned/signed ordering", ,
		],
		[
			["^", ["$max_u", ["^", [a(0)], [0x80000000]], ["^", [a(1)], [0x80000000]]], [0x80000000]],
			["$max_s", [a(0)], [a(1)]],
			false, "convert unsigned/signed ordering", ,
		],
		[
			["^", ["$min_s", ["^", [a(0)], [0x80000000]], ["^", [a(1)], [0x80000000]]], [0x80000000]],
			["$min_u", [a(0)], [a(1)]],
			false, "convert unsigned/signed ordering", ,
		],
		[
			["^", ["$max_s", ["^", [a(0)], [0x80000000]], ["^", [a(1)], [0x80000000]]], [0x80000000]],
			["$max_u", [a(0)], [a(1)]],
			false, "convert unsigned/signed ordering", ,
		],
		[
			["~", ["$min_u", [a(0)], [a(1)]]],
			["$max_u", ["~", [a(0)]], ["~", [a(1)]]],
			true, "complemented minimum is maximum of complements", "maximum of complements is complemented minimum",
		],
		[
			["~", ["$min_s", [a(0)], [a(1)]]],
			["$max_s", ["~", [a(0)]], ["~", [a(1)]]],
			true, "complemented minimum is maximum of complements", "maximum of complements is complemented minimum",
		],
		[
			["~", ["$max_u", [a(0)], [a(1)]]],
			["$min_u", ["~", [a(0)]], ["~", [a(1)]]],
			true, "complemented maximum is minimum of complements", "minimum of complements is complemented maximum",
		],
		[
			["~", ["$max_s", [a(0)], [a(1)]]],
			["$min_s", ["~", [a(0)]], ["~", [a(1)]]],
			true, "complemented maximum is minimum of complements", "minimum of complements is complemented maximum",
		],
		// add/sub
		[
			["+", [a(0)], ["-", [a(1)]]],
			["-", [a(0)], [a(1)]],
			false, "adding a negative", ,
		],
		[
			["+", ["-", [a(0)], [a(1)]], [a(1)]],
			[a(0)],
			false, "adding and subtracting the same thing cancels", ,
		],
		// conditional rules
		[
			["^", [a(0)], [a(1)]],
			["|", [a(0)], [a(1)]],
			true, "xor is or when bits <a class='replace'>don't intersect</a>", , "no intersect"
		],
		[
			["+", [a(0)], [a(1)]],
			["|", [a(0)], [a(1)]],
			true, "addition is or when bits <a class='replace'>don't intersect</a>", , "no intersect"
		],
		[
			["^", [a(0)], [a(1)]],
			["+", [a(0)], [a(1)]],
			true, "xor is addition when bits <a class='replace'>don't intersect</a>", , "no intersect"
		],
		[
			["$abs", [a(0)]],
			[a(0)],
			false, "abs does nothing when the input is <a class='replace'>non-negative</a>", , "non negative"
		],
		// special
		[
			["&", [a(0)], ["~", [a(1)]]],
			["^", ["&", [a(0)], [a(1)]], [a(0)]],
			false, "and with -1", , "extra steps", [["&", [a(0)], ["^", [a(1)], [-1]]], ["^", ["&", [a(0)], [a(1)]], ["&", [a(0)], [-1]]]]
		]
	];

	var rules_neq = [
		[
			["^", [a(0)], [aex(1, except_unknown_or_zero)]],
			[a(0)],
			true, "xor with a nonzero number changes at least one bit", ,
		],
		[
			["+", [a(0)], [aex(1, except_unknown_or_zero)]],
			[a(0)],
			true, "adding a nonzero number means the difference is nonzero", ,
		],
		[
			["-", [a(0)], [aex(1, except_unknown_or_zero)]],
			[a(0)],
			true, "subtracting a nonzero number means the difference is nonzero", ,
		],
	];

	var rules_lteu = [
		[
			["&", [a(0)], [a(1)]],
			[a(0)],
			false, "and with something can only reset bits", , , "<u"
		],
		[
			["&", [a(0)], [a(1)]],
			["$min_u", [a(0)], [a(1)]],
			false, "and with something can only reset bits", , , "<u"
		],
		[
			["$max_u", [a(0)], [a(1)]],
			["|", [a(0)], [a(1)]],
			false, "or with something can only set bits", , , "<u"
		],
		[
			["^", [a(0)], [a(1)]],
			["|", [a(0)], [a(1)]],
			false, "if xor sets a bit then or sets it as well", , , "<u"
		],
		[
			["$min_u", [a(0)], [a(1)]],
			["$max_u", [a(0)], [a(1)]],
			false, "the minimum is no more than the maximum", , , "<u"
		],
		[
			["$min_u", [a(0)], [a(1)]],
			[a(0)],
			false, "the minimum is no more than its inputs", , , "<u"
		],
		[
			["?", [a(0)], [a(1)], [a(2)]],
			["|", [a(1)], [a(2)]],
			false, "mux can't set more bits than or", , , "<u"
		]
	];

	var rules_gteu = [
		[			
			["|", [a(0)], [a(1)]],
			[a(0)],
			false, "or with something can only set bits", ,
		],
		[
			["$max_u", [a(0)], [a(1)]],
			[a(0)],
			false, "the maximum is at least as big as its inputs", ,
		],
	];

	// <=u
	if (op == 41) {
		rules = rules.concat(rules_lteu);
	}

	function convOps(root) {
		if (root.length == 1)
			return root;
		if (root.length == 2) {
			root[0] = unops.indexOf(root[0]);
			root[1] = convOps(root[1]);
			return root;
		}
		if (root[0] == "?")
			root[0] = 666;
		else
			root[0] = ops.indexOf(root[0]);
		for (var i = 1; i < root.length; i++)
			root[i] = convOps(root[i]);
		return root;
	}

	for (var i = 0; i < rules.length; i++) {
		rules[i][0] = convOps(rules[i][0]);
		rules[i][1] = convOps(rules[i][1]);
		if (!rules[i][4])
			rules[i][4] = rules[i][3];
		if (rules[i][5] == undefined)
			rules[i][5] = null;
		if (rules[i][6] == undefined)
			rules[i][6] = null;
		else {
			for (var j = 0; j < rules[i][6].length; j++)
				rules[i][6][j] = convOps(rules[i][6][j]);
		}
	}

	function rev_rule(rule) {
		return [rule[1], rule[0], false, rule[4], rule[3], rule[5], rule[6], rule[7]];
	}

	function commute_rule(rule) {
		var c0 = rule[0];
		if (c0.length == 3)
			c0 = [c0[0], c0[2], c0[1]];
		var c1 = rule[1];
		if (c1.length == 3)
			c1 = [c1[0], c1[2], c1[1]];
		var s = rule.slice();
		s[0] = c0;
		s[1] = c1;
		return s;
	}

	var numrules = rules.length;
	for (var i = 0; i < numrules; i++) {
		if (rules[i][2]) {
			rules.push(rev_rule(rules[i]));
		}
	}

	this.oldrules = rules;

	this.Rules = new Array(0x8000);
	for (var i = 0; i < 0x8000; i++)
		this.Rules[i] = [];

	for (var i = 0; i < rules.length; i++) {
		var rule = rules[i];
		var from = rule[0];
		if (from.length == 1) {
			if (from[0].any != undefined) {
				for (var p = 0; p < 0x8000; p++)
					this.Rules[p].push(rule);
			}
			else {
				// constant
				debugger;
				alert("rewrite rule starting with a constant");
			}
		}
		else if (from.length == 2) {
			// unary
			if (from[1][0].any != undefined) {
				var bottom = (from[0] + 1) & 31;
				for (var p = bottom; p < 0x8000; p += 32)
					this.Rules[p].push(rule);
			}
			else if (from[1].length == 1)
			{
				// unary of constant
				debugger;
				alert("rule has Unary(constant)");
			}
			else if (from[1].length == 2) {
				// nested unary
				this.Rules[(from[0] + 1 & 31) + ((from[1][0] + 1 & 31) << 5)].push(rule);
			}
			else if (from[1].length == 3) {
				// unary with binary as operand
				this.Rules[(from[0] + 1 & 31) + ((from[1][0] + 5 & 31) << 5)].push(rule);
			}
			else if (from[1].length == 4) {
				// ternary as operand
				var bottom = (from[0] + 1) & 31;
				for (var p = bottom; p < 0x8000; p += 32)
					this.Rules[p].push(rule);
			}
			else {
				debugger;
				alert("rule is badly formatted");
			}
		}
		else if (from.length == 3) {
			var bits = from[0] + 5 & 31;
			var mask = 0x01F;
			for (var j = 0; j < 2; j++) {
				switch (from[j + 1].length) {
					case 1:
						if (from[j + 1][0].any == undefined) {
							bits |= ((from[j + 1] & 15) | ((from[j + 1] >>> 31) << 4)) << (5 + 5 * j);
							mask |= 0x3E0 << (5 * j);
						}
						break;
					case 2:
						bits |= (from[j + 1][0] + 1 & 31) << (5 + 5 * j);
						mask |= 0x3E0 << (5 * j);
						break;
					case 3:
						bits |= (from[j + 1][0] + 5 & 31) << (5 + 5 * j);
						mask |= 0x3E0 << (5 * j);
						break;
					case 4:
						break;
					default:
						debugger;
						alert("rule is badly formatted");
						break;
				}
			}
			var had = new Int32Array(0x8000 >> 5);
			for (var p = 0; p < 0x8000; p = (p | mask) + 1 & ~mask) {
				var idx = p | bits;
				this.Rules[idx].push(rule);
				had[idx >> 5] |= 1 << idx;
			}
			if (commutative[from[0]]) {
				var mask2 = (mask & 0x1F) | ((mask & 0x3E0) << 5) | ((mask >> 5) & 0x3E0);
				var bits2 = (bits & 0x1F) | ((bits & 0x3E0) << 5) | ((bits >> 5) & 0x3E0);
				var commrule = commute_rule(rule);
				for (var p = 0; p < 0x8000; p = (p | mask2) + 1 & ~mask2) {
					var idx = p | bits2;
					if ((had[idx >> 5] & (1 << idx)) == 0 && false)
						this.Rules[idx].push(commrule);
				}
			}
		}
		else if (from.length == 4) {
			var bits = 0x7000;
			var mask = 0x7000;
			for (var j = 0; j < 3; j++) {
				switch (from[j + 1].length) {
					case 1:
						if (from[j + 1][0].any == undefined) {
							bits |= (((from[j + 1] & 15) | ((from[j + 1] >>> 31) << 4)) << (4 * j)) & 0x15;
							mask |= 0x00F << (4 * j);
						}
						break;
					case 2:
						bits |= (from[j + 1][0] + 1 & 15) << (4 * j);
						mask |= 0x00F << (4 * j);
						break;
					case 3:
						bits |= (from[j + 1][0] + 5 & 15) << (4 * j);
						mask |= 0x00F << (4 * j);
						break;
					case 4:
						break;
					default:
						debugger;
						alert("rule is badly formatted");
						break;
				}
			}
			for (var p = 0; p < 0x8000; p = (p | mask) + 1 & ~mask) {
				this.Rules[p | bits].push(rule);
			}
		}
	}

	var rulecount_hist = new Int32Array(64);
	for (var i = 0; i < this.Rules.length; i++)
		rulecount_hist[this.Rules[i].length]++;
	this.RulecountHist = rulecount_hist;
	return;
}

ProofFinder.prototype.Search = function(from, to, callback, debugcallback, mode, timelimit) {

	/* proof node format:
       [parent, expr, explanation, backwards, depth, pattern]
           0     1         2           3        4       5
	 */

	if (this.dead)
		return;

	if (timelimit == undefined)
		timelimit = 99999999;
	var starttime = new Date();

	function hash_update(htable, key, val) {
		var h = (key.hash & 0x7fffffff) % 65521;
		if (htable[h] == undefined)
			htable[h] = [];
		var subtable = htable[h];
		for (var i = 0; i < subtable.length; i += 2) {
			if (key.equals2(subtable[i])) {
				if (subtable[i + 1][4] > val[4]) {
					subtable[i + 1] = val;
					return true;
				}
				return false;
			}
		}
		subtable.push(key);
		subtable.push(val);
		return true;
	}

	function hash_get(htable, key) {
		var h = (key.hash & 0x7fffffff) % 65521;
		var subtable = htable[h];
		if (subtable == undefined)
			return null;
		for (var i = 0; i < subtable.length; i += 2) {
			if (key.equals2(subtable[i]))
				return subtable[i + 1];
		}
		return null;
	}

	var complexity_weight = 2;
	var steps_weight = 3;

	function cmp(a, b) {
		var wa = a[1].weight * complexity_weight + a[4] * steps_weight;
		var wb = b[1].weight * complexity_weight + b[4] * steps_weight;
		if (wa < wb)
			return -1;
		if (wa > wb)
			return 1;
		return 0;
	}

	function heap_siftdown(heap, index) {
		"use strict";
		var child = (index << 1) + 1;
		while (child < heap.length) {
			var lowestChild = child;
			if (child + 1 < heap.length &&
				cmp(heap[child], heap[child + 1]) > 0)
				lowestChild = child + 1;
			if (cmp(heap[index], heap[lowestChild]) > 0) {
				var temp = heap[lowestChild];
				heap[lowestChild] = heap[index];
				heap[index] = temp;
				index = lowestChild;
				child = (index << 1) + 1;
			} else
				break;
		}
	}

	function heap_add(heap, item) {
		"use strict";
		var index = heap.length;
		heap.push(item);
		var parent = (index - 1) >>> 1;
		while (index != 0 && cmp(item, heap[parent]) < 0) {
			heap[index] = heap[parent];
			heap[parent] = item;
			index = parent;
			parent = (index - 1) >>> 1;
		}
	}

	function removeMin(heap) {
		"use strict";
		if (heap.length == 1) {
			return heap.pop();
		}
		var min = heap[0];
		heap[0] = heap.pop();
		var index = 0;
		heap_siftdown(heap, 0);
		return min;
	}

	function isTopLevelMatch(pattern, expr, wildcards, rev, res_pattern) {
		var except_not = 1;
		var except_neg = 2;
		var except_zero = 3;
		var except_unknown_or_zero = 4;
		var except_non_mersenne = 5;
		if (pattern.length == 1) {
			if (pattern[0].any == undefined) {
				// constant
				if (expr.value == pattern[0]) {
					if (res_pattern)
						res_pattern[0] = expr;
					return true;
				}
				return false;
			} else {
				// any
				var any_index = pattern[0].any;
				if (wildcards[any_index] != undefined) {
					if (expr.equals2(wildcards[any_index])) {
						if (res_pattern) {
							res_pattern[0] = new Variable(~any_index);
							res_pattern[0].id = expr.id;
						}
						return true;
					} else return false;
				} else {
					if (pattern[0].except != undefined) {
						switch (pattern[0].except) {
							default: debugger;
							case except_not:
								if (expr.type == 'un' && expr.op == 0)
									return false;
								break;
							case except_neg:
								if (expr.type == 'un' && expr.op == 1)
									return false;
								break;
							case except_zero:
								if (expr.type == 'const' && expr.value == 0)
									return false;
								break;
							case except_unknown_or_zero:
								if (expr.type != 'const' || expr.value == 0)
									return false;
								break;
							case except_non_mersenne:
								if (expr.type != 'const' || (expr.value & (expr.value + 1)) != 0 || expr.value == 0)
									return false;
								break;
						}
					}
					wildcards[any_index] = expr;
					if (res_pattern) {
						res_pattern[0] = new Variable(~any_index);
						res_pattern[0].id = expr.id;
					}
					return true;
				}
			}
		} else if (pattern.length == 2) {
			if (expr.type != 'un' || pattern[0] != expr.op)
				return false;
			if (isTopLevelMatch(pattern[1], expr.value, wildcards, rev, res_pattern)) {
				if (res_pattern) {
					res_pattern[0] = new Unary(expr.op, res_pattern[0]);
					res_pattern[0].id = expr.id;
				}
				return true;
			} else return false;
		} else if (pattern.length == 3) {
			if (expr.type != 'bin' || pattern[0] != expr.op)
				return false;
			var r_res_pattern = res_pattern ? [null] : null;
			var backup = wildcards.slice();
			if (isTopLevelMatch(pattern[1], expr.l, wildcards, rev, res_pattern) &&
				isTopLevelMatch(pattern[2], expr.r, wildcards, rev, r_res_pattern)) {
				if (res_pattern) {
					res_pattern[0] = new Binary(expr.op, res_pattern[0], r_res_pattern[0]);
					res_pattern[0].id = expr.id;
				}
				return true;
			} else {
				return false;
			}
		} else if (pattern.length == 4) {
			if (expr.type == 'ter') {
				var t_res_pattern = res_pattern ? [null] : null;
				var f_res_pattern = res_pattern ? [null] : null;
				if (isTopLevelMatch(pattern[1], expr.cond, wildcards, rev, res_pattern) &&
					isTopLevelMatch(pattern[2], expr.t, wildcards, rev, t_res_pattern) &&
					isTopLevelMatch(pattern[3], expr.f, wildcards, rev, f_res_pattern)) {
					if (res_pattern) {
						res_pattern[0] = new Ternary(res_pattern[0], t_res_pattern[0], f_res_pattern[0]);
						res_pattern[0].id = expr.id;
					}
					return true;
				} else return false;
			}
			else if (expr.type == 'fun') {
				if (pattern[0] != expr.fun)
					return false;
				return false;
			}
			else return false;
		}
	}

	function rewrite(to, wildcards, rev, res_pattern) {
		if (to.length == 1) {
			if (to[0].any == undefined) {
				// constant
				var res = new Constant(to[0]);
				if (res_pattern)
					res_pattern[0] = res;
				return res;
			} else {
				// any
				var any_index = to[0].any;
				var cpy = wildcards[any_index].copy();
				if (res_pattern) {
					res_pattern[0] = new Variable(~any_index);
					res_pattern[0].id = cpy.id;
				}
				return cpy;
			}
		} else if (to.length == 2) {
			var vr = rewrite(to[1], wildcards, rev, res_pattern);
			if (vr == null || (
				vr.type == 'un' && vr.op == to[0] &&
				vr.value.type == 'un' && vr.value.op == to[0]))
				return null;
			var res = new Unary(to[0], vr).constantFold(true);
			if (res_pattern) {
				res_pattern[0] = new Unary(to[0], res_pattern[0]);
				res_pattern[0].id = res.id;
			}
			return res;
		} else if (to.length == 3) {
			var lr = rewrite(to[1], wildcards, rev, res_pattern);
			if (lr == null) return null;
			var r_res_pattern = res_pattern ? [null] : null;
			var rr = rewrite(to[2], wildcards, rev, r_res_pattern);
			if (rr == null) return null;
			var res = new Binary(to[0], lr, rr).constantFold(true);
			if (res_pattern) {
				res_pattern[0] = new Binary(to[0], res_pattern[0], r_res_pattern[0]);
				res_pattern[0].id = res.id;
			}
			return res;
		} else if (to.length == 4) {
			var cr = rewrite(to[1], wildcards, rev, res_pattern);
			if (cr == null) return null;
			var t_res_pattern = res_pattern ? [null] : null;
			var tr = rewrite(to[2], wildcards, rev, t_res_pattern);
			if (tr == null) return null;
			var f_res_pattern = res_pattern ? [null] : null;
			var fr = rewrite(to[3], wildcards, rev, f_res_pattern);
			if (fr == null) return null;
			var res = new Ternary(cr, tr, fr).constantFold(true);
			if (res_pattern) {
				res_pattern[0] = new Ternary(res_pattern[0], t_res_pattern[0], f_res_pattern[0]);
				res_pattern[0].id = res.id;
			}
			return res;
		} else debugger;
	}

	function match(rule, expr, res_pattern) {
		var wildcards = [];
		var rev = [];
		if (isTopLevelMatch(rule[0], expr, wildcards, rev, res_pattern)) {
			var lhs = res_pattern ? res_pattern[0] : null;
			var res = rewrite(rule[1], wildcards, rev, res_pattern);
			if (res == null)
				return null;
			res = res.constantFold();
			if (res_pattern)
				res_pattern[0] = new Binary(20 /*ops.indexOf('==')*/, lhs, res_pattern[0]);
			return [res, wildcards, rev];
		}
		return null;
	}

	var opstr = [];
	opstr[1] = "and";
	opstr[2] = "or";
	opstr[55] = "min";
	opstr[56] = "min";
	opstr[57] = "max";
	opstr[58] = "max";

	function applyRules(root, results, parent, backwards, allrules, getPattern) {
		"use strict";

		var patternNode = getPattern ? [null] : null;
		switch (root.type) {
			case 'const':
				return;
			case 'var':
				break;
			case 'un':
				{
					var startindex = results.length;
					applyRules(root.value, results, parent, backwards, allrules, getPattern);
					for (var i = startindex; i < results.length; i++) {
						if (results[i] == null)
							continue;
						if (results[i][1].id != root.value.id &&
							results[i][1].type == 'un' && results[i][1].op == root.op &&
							results[i][1].value.type == 'un' && results[i][1].value.op == root.op)
							results[i] = null;
						else
							results[i][1] = new Unary(root.op, results[i][1]);
					}
					break;
				}
			case 'bin':
				{
					var startindex = results.length;
					applyRules(root.l, results, parent, backwards, allrules, getPattern);
					for (var i = startindex; i < results.length; i++) {
						if (results[i])
							results[i][1] = new Binary(root.op, results[i][1], root.r);
					}
					startindex = results.length;
					applyRules(root.r, results, parent, backwards, allrules, getPattern);
					for (var i = startindex; i < results.length; i++) {
						if (results[i])
							results[i][1] = new Binary(root.op, root.l, results[i][1]);
					}
					break;
				}
			case 'ter':
				{
					var startindex = results.length;
					applyRules(root.cond, results, parent, backwards, allrules, getPattern);
					for (var i = startindex; i < results.length; i++) {
						if (results[i])
							results[i][1] = new Ternary(results[i][1], root.t, root.f);
					}
					startindex = results.length;
					applyRules(root.t, results, parent, backwards, allrules, getPattern);
					for (var i = startindex; i < results.length; i++) {
						if (results[i])
							results[i][1] = new Ternary(root.cond, results[i][1], root.f);
					}
					startindex = results.length;
					applyRules(root.f, results, parent, backwards, allrules, getPattern);
					for (var i = startindex; i < results.length; i++) {
						if (results[i])
							results[i][1] = new Ternary(root.cond, root.t, results[i][1]);
					}
				}
				break;
		}

		var rules = allrules[root.hash2];
		for (var i = 0; i < rules.length; i++) {
			var mres = match(rules[i], root, patternNode);
			if (mres != null) {
				var n = mres[0];
				if (rules[i][5] == "extra steps") {
					if (getPattern) {
						// don't generate pattern in 1 step
						continue;
					}
					else {
						var prev = parent;
						for (var j = 0; j < rules[i][6].length; j++) {
							var expr = rewrite(rules[i][6][j], mres[1], mres[2], null);
							var node = [prev, expr, null, backwards, parent[4] + 6 + j, null];
							prev = node;
							results.push(node);
						}
						results.push([prev, n, rules[i], backwards, parent[4] + 1, null]);
					}
				}
				else {
					if (getPattern) {
						if (rules[i][5] == "no intersect")
							results.push([patternNode[0], n, rules[i], new Binary(20, new Binary(1, root.l, root.r), new Constant(0))]);
						else if (rules[i][5] == "non negative")
							results.push([patternNode[0], n, rules[i], new Binary(20, new Binary(1, root.value, new Constant(0x80000000)), new Constant(0))]);
						else
							results.push([patternNode[0], n, rules[i]]);
					}
					else {
						if (rules[i][5] == "no intersect" ||
							rules[i][5] == "non negative")
							results.push([parent, n, rules[i], backwards, parent[4] + 3, root]);
						else
							results.push([parent, n, rules[i], backwards, parent[4] + 1, null]);
					}
				}
			}
		}

		if (root.type == 'bin' &&
			associative[root.op] &&
			commutative[root.op]) {
			var op = root.op;
			var args = [];

			function gatherArgs(root, args, op) {
				if (root.type == 'bin' && root.op == op) {
					gatherArgs(root.l, args, op);
					gatherArgs(root.r, args, op);
				}
				else
					args.push(root);
			}
			function rebuildWithout(root, args, op, x, out, idx) {
				if (!idx) idx = { argindex: 0 };
				if (root.type == 'bin' && root.op == op) {
					var l = rebuildWithout(root.l, args, op, x, out, idx);
					var r = rebuildWithout(root.r, args, op, x, out, idx);
					if (l == null) return r;
					if (r == null) return l;
					return new Binary(op, l, r);
				}
				else {
					var a = args[idx.argindex++];
					var r = a == null ? a : a.copy();
					if (a != null && a.id == x)
						out[0] = r.id;
					return r;
				}
			}

			gatherArgs(root, args, op);

			switch (op) {
			default:
				break;
			case 3: // try to cancel an xor
				if (args.length < 3) break;
				var found = false;
				for (var i = 1; i < args.length && !found; i++) {
					for (var j = 0; j < i; j++) {
						if (args[j].equals2(args[i])) {
							found = true;
							var nargs = args.slice();
							nargs[i] = null;
							nargs[j] = null;
							var res = rebuildWithout(root, nargs, op, -1, null);
							if (getPattern) {
								var p = new Binary(op, args[j], args[i]);
								results.push([p, res, [,,,"cancel xor with self", "create xor with self"]]);
							}
							else
								results.push([parent, res, null, backwards, parent[4] + 1, null]);
							break;
						}
					}
				}
				break;
			case 1:
			case 2:
			case 55:
			case 56:
			case 57:
			case 58:
				// remove duplicate from and/or/min/max
				if (args.length < 2) break;
				var found = false;
				for (var i = 1; i < args.length && !found; i++) {
					for (var j = 0; j < i; j++) {
						if (args[j].equals2(args[i])) {
							found = true;
							var nargs = args.slice();
							nargs[i] = null;
							var newid = [];
							var res = rebuildWithout(root, nargs, op, args[j].id, newid);
							if (getPattern) {
								var a = args[j].copy();
								a.id = newid[0];
								var p = new Binary(20, new Binary(op, args[j], args[i]), a);
								var desc = "redundant " + opstr[op] + " with self";
								results.push([p, res, [,,,desc, desc]]);
							}
							else
								results.push([parent, res, null, backwards, parent[4] + 1, null]);
							break;
						}
					}
				}
				if (op == 1 || op == 2) {
					// and/or
					// find something and its complement
					found = false;
					for (var i = 0; i < args.length && !found; i++) {
						for (var j = 0; j < args.length; j++) {
							if (i == j) continue;
							if (args[j].type == 'un' &&
							    args[j].op == 0 &&
							    args[j].value.equals2(args[i]))
							{
								found = true;
								var nargs = args.slice();
								nargs[i] = null;
								nargs[j] = new Constant(1 - op);
								var newid = [];
								var res = rebuildWithout(root, nargs, op, nargs[j].id, newid);
								if (getPattern) {
									var a = nargs[j].copy();
									a.id = newid[0];
									var p = new Binary(20, new Binary(op, args[i], args[j]), a);
									var desc = opstr[op] + " with complement of self";
									results.push([p, res, [,,,desc, desc]]);
								}
								else
									results.push([parent, res, null, backwards, parent[4] + 1, null]);
								break;
							}
						}
					}
				}
				break;
			}
		}

		if (root.type != 'const') {
			if (getPattern)
				results.push([, root, [,,,"constant folding", "constant folding"]]);
			else
				results.push([parent, root, null, backwards, parent[4] + 1, null]);
		}
	}

	function fixup_ids_search(a, b, pattern) {
		// some sub-expression of 'a' matches the pattern,
		// change the ids in the pattern to the corresponding ids in 'b'
		switch (a.type) {
			case 'const':
			case 'var':
				if (a.id != pattern.id)
					return false;
				fixup_ids(a, b, pattern);
				return true;
			case 'un':
				if (a.id == pattern.id) {
					fixup_ids(a, b, pattern);
					return true;
				}
				else if (b.type == 'un' && b.op == a.op)
					return fixup_ids_search(a.value, b.value, pattern);
				else return false;
			case 'bin':
				if (a.id == pattern.id) {
					fixup_ids(a, b, pattern);
					return true;
				}
				else if (b.type == 'bin' && b.op == a.op)
					return fixup_ids_search(a.l, b.l, pattern) ||
						   fixup_ids_search(a.r, b.r, pattern);
				else return false;
			case 'ter':
				if (a.id == pattern.id) {
					fixup_ids(a, b, pattern);
					return true;
				}
				else if (b.type == 'ter')
					return fixup_ids_search(a.cond, b.cond, pattern) ||
				           fixup_ids_search(a.t, b.t, pattern) ||
				           fixup_ids_search(a.f, b.f, pattern);
				else return false;
			case 'fun':
				return false;
			default: debugger;
		}
	}

	function fixup_ids(a, b, pattern) {
		// a has the same ids as pattern
		// returns: nothing
		// modifies the pattern, with ids changed to match b
		// a and b must be the same expression
		switch (a.type) {
			case 'const':
			case 'var':
				if (pattern.id == a.id)
					pattern.id = b.id;
				break;
			case 'un':
				if (pattern.id == a.id) {
					if (pattern.type == 'un')
						fixup_ids(a.value, b.value, pattern.value)
					else if (pattern.type != 'var') debugger;
					pattern.id = b.id;
				}
				else
					fixup_ids(a.value, b.value, pattern);
				break;
			case 'bin':
				if (pattern.id == a.id) {
					if (pattern.type == 'bin') {
						fixup_ids(a.l, b.l, pattern.l);
						fixup_ids(a.r, b.r, pattern.r);
					}
					else if (pattern.type != 'var') debugger;
					pattern.id = b.id;
				}
				else {
					fixup_ids(a.l, b.l, pattern);
					fixup_ids(a.r, b.r, pattern);
				}
				break;
			case 'ter':
				if (pattern.id == a.id) {
					if (pattern.type == 'ter') {
						fixup_ids(a.cond, b.cond, pattern.cond);
						fixup_ids(a.t, b.t, pattern.t);
						fixup_ids(a.f, b.f, pattern.f);
					}
					else if (pattern.type != 'var') debugger;
					pattern.id = b.id;
				}
				else {
					fixup_ids(a.cond, b.cond, pattern);
					fixup_ids(a.t, b.t, pattern);
					fixup_ids(a.f, b.f, pattern);
				}
				break;
			case 'fun':
				break;
			default: debugger;
		}
	}

	function processNode(proofnode, backwards, htable, q, otherside, maxweight, rules) {
		var results = [];
		applyRules(proofnode[1], results, proofnode, backwards, rules, false);
		for (var i = 0; i < results.length; i++) {
			var p = results[i];
			if (p == null)
				continue;
			if (proofnode[0]) {
				var unc0 = proofnode[0][1].containsDoubleUnary();
				var unc1 = proofnode[1].containsDoubleUnary();
				if (unc1 > unc0) {
					var unc2 = p[1].containsDoubleUnary();
					if (unc2 >= unc1)
						continue;
				}
			}
			if (p[2] && p[2][5]) {
				if (!special_handle(p[2][5], p[5], p[2][6]))
					continue;
			}
			if (p[1].weight < maxweight && hash_update(htable, p[1], p)) {
				heap_add(q, p);
			}
			var connection = hash_get(otherside, p[1]);
			if (connection != null) {
				return [p[4] + connection[4], p, connection, backwards];
			}
		}
		return null;
	}

	function makesteps(backwards, p, connection, rules) {
		"use strict";

		var c = p;
		var steps = [];
		var proofsteps = [];
		if (!backwards) {
			while (c != null) {
				if (c[3]) debugger;
				steps.unshift(c[1]);
				c = c[0];
			}
			steps[steps.length - 1] = connection[1];
			c = connection;
			while (c != null && c[0] != null) {
				if (!c[3]) debugger;
				steps.push(c[0][1]);
				c = c[0];
			}
		} else {
			while (c != null && c[0] != null) {
				if (!c[3]) debugger;
				steps.push(c[0][1]);
				c = c[0];
			}
			c = connection;
			while (c != null) {
				if (c[3]) debugger;
				steps.unshift(c[1]);
				c = c[0];
			}
		}

		// find explanations
		for (var j = 0; j < steps.length - 1; j++) {
			var f = steps[j];
			var t = steps[j + 1];
			var explanation = null;
			var explbackwards = false;
			// try forwards
			var forwardSet = [];
			applyRules(f, forwardSet, [,,,,0], false, rules, true);
			var possibleExplanations = [];
			for (var k = 0; k < forwardSet.length; k++) {
				if (forwardSet[k] && t.equals2(forwardSet[k][1])) {
					explanation = forwardSet[k];
					switch (explanation[2][5]) {
						case null:
						case undefined:
							break;
						case "no intersect":
							if (!special_handle(explanation[2][5], explanation[3].l)) { explanation = null; continue; }
							break;
						case "non negative":
							if (!special_handle(explanation[2][5], new Unary(6, explanation[3].l.l))) { explanation = null; continue; }
							break;
						default: debugger;
					}
					if (explanation[0]) fixup_ids_search(explanation[1], t, explanation[0].r)
					possibleExplanations.push(explanation);
				}
			}
			//explanation = null;
			for (var k = 0; k < possibleExplanations.length; k++) {
				explanation = possibleExplanations[k];
				if (explanation[2][3] == "constant folding")
					break;
			}
			// try backwards
			if (!explanation) {
				var backwardSet = [];
				applyRules(t, backwardSet, [,,,,0], false, rules, true);
				for (var k = 0; k < backwardSet.length; k++) {
					if (backwardSet[k] && f.equals2(backwardSet[k][1])) {
						explanation = backwardSet[k];
						switch (explanation[2][5]) {
							case null:
							case undefined:
								break;
							case "no intersect":
								if (!special_handle(explanation[2][5], explanation[3].l)) { explanation = null; continue; }
								break;
							case "non negative":
								if (!special_handle(explanation[2][5], new Unary(6, explanation[3].l.l))) { explanation = null; continue; }
								break;
							default: debugger;
						}
						explbackwards = true;
						if (explanation[0]) {
							var patl = explanation[0].l;
							var patr = explanation[0].r;
							fixup_ids_search(explanation[1], f, patr);
							explanation[0].l = patr;
							explanation[0].r = patl;
						}
						break;
					}
				}
			}
			// output proof
			proofsteps.push(steps[j]);
			var explindex = explbackwards ? 4 : 3;
			proofsteps.push([explanation[2][explindex], explanation[0], explanation[3]]);
		}
		proofsteps.push(steps[steps.length - 1]);
		return proofsteps;
	}

	function special_handle(cond, node, extra) {
		switch (cond) {
			default:
				debugger;
				return false;
			case null:
				return true;
			case "no intersect":
				var l = node.l;
				var r = node.r;
				if (l.type == 'bin' && l.op == 1 /* & */ &&
					r.type == 'bin' && r.op == 1 /* & */) {
					var ll = l.l;
					var lr = l.r;
					var rl = r.l;
					var rr = r.r;

					function test(node, l, r) {
                        if (node.type == 'const')
                            return (l.value & node.value) == 0 ||
                                   (r.value & node.value) == 0;
						if (node.type != 'un' || node.op != 0)
							return false;
						return node.value.equals(l) || node.value.equals(r);
					}

					return test(ll, rl, rr) ||
						   test(lr, rl, rr) ||
						   test(rl, ll, lr) ||
						   test(rr, ll, lr);
				}
				return false;
			case "non negative":
				if (node.type != 'un')
					return false;
				var v = node.value;
				if (v.type == 'bin' &&
					v.op == 31 &&
					v.r.type == 'const' &&
					(v.r.value & 31) > 0)
					return true;
				if (v.type == 'bin' &&
					v.op == 1 &&
					((v.r.type == 'const' && (v.r.value|0) >= 0) || (v.l.type == 'const' && (v.l.value|0) >= 0)))
					return true;
				if (v.type == 'un' && v.op >= 2 && v.op <= 4)
					return true;
				return false;
			case "extra steps":
				// handled elsewhere
				return true;
		}
	}

	if (from.equals2(to)) {
		var v1 = new Variable(-1);
		v1.id = from.id;
		var v2 = new Variable(-1);
		v2.id = to.id;
		callback([from, ["structurally equal", new Binary(20, v1, v2)], to]);
		return;
	}

	var fromc = from.copy().constantFold();
	var toc = to.copy().constantFold();

	if (from.equals2(toc)) {
		var v1 = new Variable(-1);
		v1.id = from.id;
		var v2 = new Variable(-1);
		v2.id = toc.id;
		callback([from, ["constant folding", new Binary(20, v1, v2)], toc]);
		return;
	}

	if (fromc.equals2(to)) {
		var v1 = new Variable(-1);
		v1.id = from.id;
		var v2 = new Variable(-1);
		v2.id = to.id;
		callback([from, ["constant folding", new Binary(20, v1, v2)], to]);
		return;
	}

	from = fromc;
	to = toc;
	from.start = true;
	to.end = true;

	if (from.equals(to)) {
		var v1 = new Variable(-1);
		v1.id = from.id;
		var v2 = new Variable(-1);
		v2.id = to.id;
		callback([from, ["structurally equal after normalization", new Binary(20, v1, v2)], to]);
		return;
	}

	// priority queues
	q1 = [];
	q2 = [];
	// hash maps
	h1 = [];
	h2 = [];

	q1.push([null, from, null, false, 0, null]);
	q2.push([null, to, null, true, 0, null]);
	hash_update(h1, from, q1[0]);
	hash_update(h2, to, q2[0]);


	var w = [];
	var maxstep = 999999;

	function loop_async(index, q1, q2, h1, h2, from, to, rules, cb) {
		var maxForwardWeight = from.weight + 6;
		var maxBackwardWeight = to.weight + 6;
		var counter = 0;
		var found = false;
		var proofsteps = [];

		while (q1.length + q2.length > 0 && counter < 10 && (counter == 0 || mode !== 'slow')) {
			var time = new Date();
			if (time.getTime() - starttime.getTime() > timelimit) {
				cb(null);
				return;
			}
			counter++;
			// forward step
			var doReset = false;
			if (q1.length > 0) {
				var pn = removeMin(q1);
				if (debugcallback) debugcallback(pn[1], false, pn[0]);
				var found = processNode(pn, false, h1, q1, h2, maxForwardWeight, rules);
				if (found != null && found[0] < maxstep) {
					doReset = w.length == 0;
					w.push(found);
					maxstep = found[0];
				}
			}
			// backward step
			if (q2.length > 0 && !doReset) {
				var pn = removeMin(q2);
				if (debugcallback) debugcallback(pn[1], true, pn[0]);
				var found = processNode(pn, true, h2, q2, h1, maxBackwardWeight, rules);
				if (found != null && found[0] < maxstep) {
					doReset = w.length == 0;
					w.push(found);
					maxstep = found[0];
				}
			}
			//
			if (doReset && mode !== 'slow') {
				// used after the first proof is found
				// search again from scratch with more focus on short proofs
				complexity_weight = 0;
				q1 = [];
				q2 = [];
				h1 = [];
				h2 = [];

				q1.push([null, from, null, false, 0, null]);
				q2.push([null, to, null, true, 0, null]);
				hash_update(h1, from, q1[0]);
				hash_update(h2, to, q2[0]);
			}
		}
		if (w.length > 0 && (index > 10 || mode === 'slow')) {
			var witness = w.pop();
			proofsteps = makesteps(witness[3], witness[1], witness[2], rules);
			cb(proofsteps);
		}
		else if (index > 100 && mode !== 'slow' || index > 1000) {
			cb(null);
		}
		else if (mode === 'synchronous')
			loop_async(index + 1, q1, q2, h1, h2, from, to, rules, cb);
		else {
			setTimeout(function() {
				loop_async(index + 1, q1, q2, h1, h2, from, to, rules, cb);
			}, mode === 'slow' ? 200 : 0);
		}
	}

	loop_async(0, q1, q2, h1, h2, from, to, this.Rules, callback);

	return;
};
