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
		[
			["|", ["&", [a(0)], [a(1)]], ["&", [a(0)], ["~", [a(1)]]]],
			[a(0)],
			false, "union of complementary subsets", ,
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
		[
			["^", ["&", [a(0)], [a(1)]], ["&", [a(0)], ["~", [a(1)]]]],
			[a(0)],
			false, "xor of complementary subsets", ,
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
		[
			["+", ["&", [a(0)], [a(1)]], ["&", [a(0)], ["~", [a(1)]]]],
			[a(0)],
			false, "addition of complementary subsets", ,
		],
		[
			["+", ["<<", ["&", [a(0)], [a(1)]], [1]], ["^", [a(0)], [a(1)]]],
			["+", [a(0)], [a(1)]],
			false, "combine single-bit sums with carries", "split into single-bit sums and carries",
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
			["?", [a(0)], [a(0)], ["~", [a(0)]]],
			[-1],
			false, "mux between something and its complement", ,
		],
		[
			["?", [a(0)], ["~", [a(0)]], [a(0)]],
			[0],
			false, "mux between something and its complement", ,
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
		[
			["$min_u", [a(0)], [a(1)]],
			["?", [">u", [a(0)], [a(1)]], [a(1)], [a(0)]],
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
		[
			["$min_s", [a(0)], [a(1)]],
			["?", [">s", [a(0)], [a(1)]], [a(1)], [a(0)]],
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
		[
			["$max_u", [a(0)], [a(1)]],
			["?", ["<u", [a(0)], [a(1)]], [a(1)], [a(0)]],
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
		[
			["$max_s", [a(0)], [a(1)]],
			["?", ["<s", [a(0)], [a(1)]], [a(1)], [a(0)]],
			true, "definition of maximum", ,
		],
		// properties of left shift
		[
			["<<", [a(0)], [0]],
			[a(0)],
			false, "shift by zero", ,
		],
		[
			["<<", [0], [a(0)]],
			[0],
			false, "shifting zero", ,
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
		// properties of right shift
		[
			[">>u", [a(0)], [0]],
			[a(0)],
			false, "shift by zero", ,
		],
		[
			[">>u", [0], [a(0)]],
			[0],
			false, "shifting zero", ,
		],
		// properties of arithmetic right shift
		[
			[">>s", [a(0)], [0]],
			[a(0)],
			false, "shift by zero", ,
		],
		[
			[">>s", [0], [a(0)]],
			[0],
			false, "shifting zero", ,
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
			["+", ["*", [a(0)], [a(1)]], [a(0)]],
			["*", [a(0)], ["+", [a(1)], [1]]],
			false, "special case of distributivity", ,
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
		// properties of subus
		[
			["$subus", [a(0)], [a(1)]],
			["&", ["-", [a(0)], [a(1)]], [">u", [a(0)], [a(1)]]],
			true, "definition of subtraction with unsigned saturation", ,
		],
		[
			["$subus", [a(0)], [a(1)]],
			["?", [">u", [a(0)], [a(1)]], ["-", [a(0)], [a(1)]], [0]],
			true, "definition of subtraction with unsigned saturation", ,
		],
		[
			["$subus", [a(0)], [a(1)]],
			["-", ["+", ["$subus", [a(1)], [a(0)]], [a(0)]], [a(1)]],
			false, "compensated commutativity of saturating subtraction", ,
		],
		[
			["-", ["+", ["$subus", [a(0)], [a(1)]], [a(1)]], [a(0)]],
			["$subus", [a(1)], [a(0)]],
			false, "compensated commutativity of saturating subtraction", ,
		],
		// properties of addus
		[
			["$addus", [a(0)], [0]],
			[a(0)],
			false, "additive identity", ,
		],
		[
			["$addus", [a(0)], [a(1)]],
			["$addus", [a(1)], [a(0)]],
			false, "commutativity of addition with unsigned saturation", ,
		],
		[
			["$addus", ["$addus", [a(0)], [a(1)]], [a(2)]],
			["$addus", [a(0)], ["$addus", [a(1)], [a(2)]]],
			true, "associativity of addition with unsigned saturation", ,
		],
		[
			["$addus", [a(0)], [a(1)]],
			["|", ["+", [a(0)], [a(1)]], ["<u", ["+", [a(0)], [a(1)]], [a(0)]]],
			true, "definition of addition with unsigned saturation", ,
		],
		[
			["$addus", [a(0)], [a(1)]],
			["|", ["+", [a(0)], [a(1)]], ["<u", ["+", [a(0)], [a(1)]], [a(1)]]],
			true, "definition of addition with unsigned saturation", ,
		],
		[
			["$subus", [a(0)], [a(1)]],
			["~", ["$addus", ["~", [a(0)]], [a(1)]]],
			true, "unsigned-saturating version of a - b == ~(~a + b)", ,
		],
		// properties of BMI stuff
		[
			["$blsi", [a(0)]],
			["&", [a(0)], ["-", [a(0)]]],
			true, "definition of blsi", ,
		],
		[
			["$blsr", [a(0)]],
			["&", [a(0)], ["-", [a(0)], [1]]],
			true, "definition of blsr", ,
		],
		[
			["$blsmsk", [a(0)]],
			["^", [a(0)], ["-", [a(0)], [1]]],
			true, "definition of blsmsk", ,
		],
		[
			["$tzmsk", [a(0)]],
			["&", ["~", [a(0)]], ["-", [a(0)], [1]]],
			true, "definition of tzmsk #1", ,
		],
		[
			["$tzmsk", [a(0)]],
			["-", ["&", [a(0)], ["-", [a(0)]]], [1]],
			true, "definition of tzmsk #2", ,
		],
		[
			["$tzmsk", [a(0)]],
			["-", ["&", ["-", [a(0)]], [a(0)]], [1]],
			true, "definition of tzmsk #2", ,
		],
		[
			["$blsi", ["$blsi", [a(0)]]],
			["$blsi", [a(0)]],
			false, "blsi is idempotent", ,
		],
		[
			["$blsr", ["$blsi", [a(0)]]],
			[0],
			false, "blsi leaves at most a single bit set", ,
		],
		[
			["&", ["$popcnt", ["$blsi", [a(0)]]], [1]],
			["$popcnt", ["$blsi", [a(0)]]],
			false, "blsi leaves at most a single bit set", ,
		],
		[
			["$blsmsk", ["$blsmsk", [a(0)]]],
			[1],
			false, "blsmsk always has an odd result", ,
		],
		[
			["&", ["$blsmsk", [a(0)]], [1]],
			[1],
			false, "blsmsk always has an odd result", ,
		],
		[
			["|", ["$blsmsk", [a(0)]], [1]],
			["$blsmsk", [a(0)]],
			false, "blsmsk always has an odd result", ,
		],
		[
			["&", ["$blsr", [a(0)]], [1]],
			[0],
			false, "blsr always has an even result", ,
		],
		[
			["&", ["$blsr", [a(0)]], [-2]],
			["$blsr", [a(0)]],
			false, "blsr always has an even result", ,
		],
		[
			["$popcnt", ["$tzmsk", [a(0)]]],
			["$ntz", [a(0)]],
			false, "counting the trailing zeroes", ,
		],
		[
			["&", [a(0)], ["~", ["$blsi", [a(0)]]]],
			["$blsr", [a(0)]],
			false, "resetting lowest set bit", ,
		],
		[
			["&", [a(0)], ["~", ["$blsi", [a(0)]]]],
			["$blsr", [a(0)]],
			false, "resetting lowest set bit", ,
		],
		[
			["^", [a(0)], ["$blsi", [a(0)]]],
			["$blsr", [a(0)]],
			false, "resetting lowest set bit", ,
		],
		[
			["-", [a(0)], ["$blsi", [a(0)]]],
			["$blsr", [a(0)]],
			false, "resetting lowest set bit", ,
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
		// properties of pdep
		[
			["$pdep", [a(0)], [0]],
			[0],
			false, "empty mask", ,
		],
		[
			["$pdep", [a(0)], [-1]],
			[a(0)],
			false, "pdep with full mask", ,
		],
		[
			["$pdep", [-1], [a(0)]],
			[a(0)],
			false, "pdep left-identity", ,
		],
		[
			["$pdep", [a(0)], [aex(1, except_non_mersenne)]],
			["&", [a(0)], [a(1)]],
			false, "contiguous mask", ,
		],
		[
			["$pdep", [a(0)], ["$pdep", [a(1)], [a(2)]]],
			["$pdep", ["$pdep", [a(0)], [a(1)]], [a(2)]],
			true, "associativity of pdep", ,
		],
		[
			["$pdep", [a(0)], ["<<", [a(1)], [a(2)]]],
			["<<", ["$pdep", [a(0)], [a(1)]], [a(2)]],
			true, "move shift out of pdep", "move shift into pdep",
		],
		// properties of pext
		[
			["$pext", [a(0)], [0]],
			[0],
			false, "empty mask", ,
		],
		[
			["$pext", [a(0)], [aex(1, except_non_mersenne)]],
			["&", [a(0)], [a(1)]],
			false, "contiguous mask", ,
		],
		// division stuff
		[
			["/u", [a(0)], [1]],
			[a(0)],
			false, "division by 1", ,
		],
		[
			["/s", [a(0)], [1]],
			[a(0)],
			false, "division by 1", ,
		],
		[
			["/e", [a(0)], [1]],
			[a(0)],
			false, "division by 1", ,
		],
		[
			["%e", [a(0)], ["-", [a(1)]]],
			["%e", [a(0)], [a(1)]],
			false, "Euclidean remainder ignores sign of divisor", ,
		],
		[
			["%e", [a(0)], ["$abs", [a(1)]]],
			["%e", [a(0)], [a(1)]],
			false, "Euclidean remainder ignores sign of divisor", ,
		],
		[
			["/e", [a(0)], ["-", [a(1)]]],
			["-", ["/e", [a(0)], [a(1)]]],
			true, "move negation out of division", "move negation into division",
		],
		[
			["/e", [a(0)], [a(1, except_unknown_or_zero)]],
			["-", ["/e", [a(0)], ["-", [a(1)]]]],
			false, "move negation out of division", ,
		],
		[
			["+", ["*", [a(0, except_unknown_or_zero)], ["/u", [a(1)], [a(0, except_unknown_or_zero)]]], ["%u", [a(1)], [a(0, except_unknown_or_zero)]]],
			[a(1)],
			false, "division rule", ,
		],
		[
			["+", ["*", [a(0, except_unknown_or_zero)], ["/s", [a(1)], [a(0, except_unknown_or_zero)]]], ["%s", [a(1)], [a(0, except_unknown_or_zero)]]],
			[a(1)],
			false, "division rule", ,
		],
		[
			["+", ["*", [a(0, except_unknown_or_zero)], ["/e", [a(1)], [a(0, except_unknown_or_zero)]]], ["%e", [a(1)], [a(0, except_unknown_or_zero)]]],
			[a(1)],
			false, "division rule", ,
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
			false, "double complement", ,
		],
		[
			["-", ["-", [a(0)]]],
			[aex(0, except_neg)],
			false, "double negation", ,
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
		[
			["$pdep", ["&", [a(0)], [a(1)]], [a(2)]],
			["&", ["$pdep", [a(0)], [a(2)]], ["$pdep", [a(1)], [a(2)]]],
			false, "pdep distributes over and"
		],
		[
			["&", ["$pdep", [a(0)], [a(1)]], ["$pdep", [a(2)], [a(1)]]],
			["$pdep", ["&", [a(0)], [a(2)]], [a(1)]],
			false, "pdep distributes over and"
		],
		[
			["$pdep", ["|", [a(0)], [a(1)]], [a(2)]],
			["|", ["$pdep", [a(0)], [a(2)]], ["$pdep", [a(1)], [a(2)]]],
			false, "pdep distributes over or"
		],
		[
			["|", ["$pdep", [a(0)], [a(1)]], ["$pdep", [a(2)], [a(1)]]],
			["$pdep", ["|", [a(0)], [a(2)]], [a(1)]],
			false, "pdep distributes over or"
		],
		[
			["$pdep", ["^", [a(0)], [a(1)]], [a(2)]],
			["^", ["$pdep", [a(0)], [a(2)]], ["$pdep", [a(1)], [a(2)]]],
			false, "pdep distributes over xor"
		],
		[
			["^", ["$pdep", [a(0)], [a(1)]], ["$pdep", [a(2)], [a(1)]]],
			["$pdep", ["^", [a(0)], [a(2)]], [a(1)]],
			false, "pdep distributes over xor"
		],
		[
			["$pdep", ["+", [a(0)], [a(1)]], [a(2)]],
			["&", ["+", ["|", ["$pdep", [a(0)], [a(2)]], ["~", [a(2)]]], ["$pdep", [a(1)], [a(2)]]], [a(2)]],
			false, "move addition out of pdep"
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
			true, "bzhi right-distributes over or", ,
		],
		[
			["|", ["$bzhi", [a(0)], [a(1)]], ["$bzhi", [a(2)], [a(1)]]],
			["$bzhi", ["|", [a(0)], [a(2)]], [a(1)]],
			true, "bzhi right-distributes over or", ,
		],
		[
			["$bzhi", ["^", [a(0)], [a(1)]], [a(2)]],
			["^", ["$bzhi", [a(0)], [a(2)]], ["$bzhi", [a(1)], [a(2)]]],
			true, "bzhi right-distributes over xor", ,
		],
		[
			["^", ["$bzhi", [a(0)], [a(1)]], ["$bzhi", [a(2)], [a(1)]]],
			["$bzhi", ["^", [a(0)], [a(2)]], [a(1)]],
			true, "bzhi right-distributes over xor", ,
		],
		[
			["$bzhi", ["&", [a(0)], [a(1)]], [a(2)]],
			["&", ["$bzhi", [a(0)], [a(2)]], ["$bzhi", [a(1)], [a(2)]]],
			true, "bzhi right-distributes over and", ,
		],
		[
			["&", ["$bzhi", [a(0)], [a(1)]], ["$bzhi", [a(2)], [a(1)]]],
			["$bzhi", ["&", [a(0)], [a(2)]], [a(1)]],
			true, "bzhi right-distributes over or", ,
		],
		// other bzhi properties
		[
			["&", ["$bzhi", [a(0)], [a(1)]], ["$bzhi", [a(0)], [a(2)]]],
			["$bzhi", ["$bzhi", [a(0)], [a(1)]], [a(2)]],
			true, "combine bzhi", "split bzhi",
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
		// rotates
		[
			[">>>", [a(0)], [0]],
			[a(0)],
			false, "rotate by zero", ,
		],
		[
			["<<<", [a(0)], [0]],
			[a(0)],
			false, "rotate by zero", ,
		],
		[
			[">>>", [a(0)], [a(1)]],
			["|", [">>u", [a(0)], [a(1)]], ["<<", [a(0)], ["-", [a(1)]]]],
			true, "split ror into shifts", "combine shifts into ror",
		],
		[
			["<<<", [a(0)], [a(1)]],
			["|", ["<<", [a(0)], [a(1)]], [">>u", [a(0)], ["-", [a(1)]]]],
			true, "split rol into shifts", "combine shifts into rol",
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
		[
			["-", ["+", [a(0)], [a(1)]], ["|", [a(0)], [a(1)]]],
			["&", [a(0)], [a(1)]],
			false, "bit-level commutativity of addition", , "extra steps", [["-", ["+", ["&", [a(0)], [a(1)]], ["|", [a(0)], [a(1)]]], ["|", [a(0)], [a(1)]]]]
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
			true, "adding a negative", ,
		],
		[
			["+", ["-", [a(0)], [a(1)]], [a(1)]],
			[a(0)],
			false, "adding and subtracting the same thing cancels", ,
		],
		[
			["+", [a(0)], ["-", [a(1)], [a(2)]]],
			["-", ["+", [a(0)], [a(1)]], [a(2)]],
			true, "associativity of addition", ,
		],
		[
			["+", ["-", [a(0)], [a(1)]], [a(2)]],
			["-", ["+", [a(0)], [a(2)]], [a(1)]],
			false, "commutativity of addition", ,
		],
		[
			["-", ["+", [a(0)], [a(1)]], [a(1)]],
			[a(0)],
			false, "adding and subtracting the same thing cancels", ,
		],
		[
			["-", [a(0)], ["-", [a(0)], [a(1)]]],
			[a(1)],
			false, "adding and subtracting the same thing cancels", ,
		],
		[
			["~", ["+", ["~", [a(0)]], [a(1)]]],
			["-", [a(0)], [a(1)]],
			false, "definition of subtraction", ,
		],
		// pext/pdep
		[
			["$pdep", ["$pext", [a(0)], [a(1)]], [a(1)]],
			["&", [a(0)], [a(1)]],
			false, "selected bits are put back in their original positions", ,
		],
		[
			["$pext", ["$pext", [a(0)], [a(1)]], [a(2)]],
			["$pext", [a(0)], ["$pdep", [a(2)], [a(1)]]],
			false, "merge extracts by composing the masks", ,
		],
		[
			["$pext", [a(0)], ["$pdep", [a(1)], [a(2)]]],
			["$pext", ["$pext", [a(0)], [a(2)]], [a(1)]],
			false, "split extraction into two steps", ,
		],
		[
			["$pext", ["$pdep", [a(0)], [a(1)]], [a(1)]],
			["&", [a(0)], ["$pext", [a(1)], [a(1)]]],
			false, "pseudoinverse of pdep", ,
		],
		// special
		[
			["&", [a(0)], ["~", [a(1)]]],
			["^", ["&", [a(0)], [a(1)]], [a(0)]],
			false, "and with -1", , "extra steps", [["&", [a(0)], ["^", [a(1)], [-1]]], ["^", ["&", [a(0)], [a(1)]], ["&", [a(0)], [-1]]]]
		],
		[
			["-", ["+", [a(0)], [a(1)]], ["^", [a(0)], [a(1)]]],
			["<<", ["&", [a(0)], [a(1)]], [1]],
			false, "", , "extra steps", [["-", ["+", ["<<", ["&", [a(0)], [a(1)]], [1]], ["^", [a(0)], [a(1)]]], ["^", [a(0)], [a(1)]]]]
		],
		[
			["-", ["+", [a(0)], [a(1)]], ["<<", ["&", [a(0)], [a(1)]], [1]]],
			["^", [a(0)], [a(1)]],
			false, "", , "extra steps", [["-", ["+", ["<<", ["&", [a(0)], [a(1)]], [1]], ["^", [a(0)], [a(1)]]], ["<<", ["&", [a(0)], [a(1)]], [1]]], ["-", ["+", ["^", [a(0)], [a(1)]], ["<<", ["&", [a(0)], [a(1)]], [1]]], ["<<", ["&", [a(0)], [a(1)]], [1]]]]
		],
		[
			["+", ["$subus", [a(0)], [a(1)]], [a(1)]],
			["$max_u", [a(0)], [a(1)]],
			false, "", , "extra steps", [["+", ["?", [">u", [a(0)], [a(1)]], ["-", [a(0)], [a(1)]], [0]], [a(1)]],
										["?", [">u", [a(0)], [a(1)]], ["+", ["-", [a(0)], [a(1)]], [a(1)]], ["+", [0], [a(1)]]],
										["?", [">u", [a(0)], [a(1)]], ["+", ["-", [a(0)], [a(1)]], [a(1)]], [a(1)]],
										["?", [">u", [a(0)], [a(1)]], [a(0)], [a(1)]]]
		],
		[
			["-", [a(0)], ["$subus", [a(0)], [a(1)]]],
			["$min_u", [a(0)], [a(1)]],
			false, "", , "extra steps", [["-", [a(0)], ["?", [">u", [a(0)], [a(1)]], ["-", [a(0)], [a(1)]], [0]]],
										["?", [">u", [a(0)], [a(1)]], ["-", [a(0)], ["-", [a(0)], [a(1)]]], ["-", [a(0)], [0]]],
										["?", [">u", [a(0)], [a(1)]], ["-", [a(0)], ["-", [a(0)], [a(1)]]], [a(0)]],
										["?", [">u", [a(0)], [a(1)]], [a(1)], [a(0)]]]
		]
	];

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

	function isTopLevelMatch(pattern, expr, wildcards, res_pattern) {
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
			var op = pattern[0];
			if (expr.type == 'const' && op < 2 && pattern[1].any != undefined && pattern[1].except == undefined) {
				debugger;
				var any_index = pattern[1].any;
				var fake_expr = new Unary(op, new Constant(op == 0 ? ~expr.value : ~~-expr.value));
				fake_expr.id = expr.id;
				wildcards[any_index] = fake_expr;
				if (res_pattern) {
					res_pattern[0] = new Variable(~any_index);
					res_pattern[0].id = expr.id;
				}
				return true;
			}
			if (expr.type != 'un' || op != expr.op)
				return false;
			if (isTopLevelMatch(pattern[1], expr.value, wildcards, res_pattern)) {
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
			if (isTopLevelMatch(pattern[1], expr.l, wildcards, res_pattern) &&
				isTopLevelMatch(pattern[2], expr.r, wildcards, r_res_pattern)) {
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
				if (isTopLevelMatch(pattern[1], expr.cond, wildcards, res_pattern) &&
					isTopLevelMatch(pattern[2], expr.t, wildcards, t_res_pattern) &&
					isTopLevelMatch(pattern[3], expr.f, wildcards, f_res_pattern)) {
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
		if (isTopLevelMatch(rule[0], expr, wildcards, res_pattern)) {
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
	opstr[3] = "xor";
	opstr[4] = "add";
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

		function checkMatches(root, rules, results, parent, backwards, getPattern, matchonly) {
			"use strict";
			for (var i = 0; i < rules.length; i++) {
				var mres = match(rules[i], root, patternNode);
				if (mres != null) {
					if (matchonly) return true;
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
						if (getPattern)
							results.push([patternNode[0], n, rules[i]]);
						else
							results.push([parent, n, rules[i], backwards, parent[4] + 1, null]);
					}
				}
			}
			return false;
		}

		checkMatches(root, allrules[root.hash2], results, parent, backwards, getPattern, false);

		function mkvar(idx, id) {
			var v = new Variable(~idx);
			v.id = id;
			return v;
		}

		if (root.type == 'bin') {
		if (associative[root.op] &&
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
			function rebuildTreeLike(root, argcb, op1, op2, idx) {
				if (!idx) idx = { argindex: 1 };
				var l = null, r = null;
				if (root.l.type == 'bin' && (root.l.op == op1 || root.l.op == op2))
					l = rebuildTreeLike(root.l, argcb, op1, op2, idx);
				else {
					l = argcb(root.l, idx);
					l.id = root.l.id;
				}
				if (root.r.type == 'bin' && (root.r.op == op1 || root.r.op == op2))
					r = rebuildTreeLike(root.r, argcb, op1, op2, idx);
				else {
					r = argcb(root.r, idx);
					r.id = root.r.id;
				}
				var res = new Binary(root.op, l, r);
				res.id = root.id;
				return res;
			}

			gatherArgs(root, args, op);

			// TODO: look-ahead for matches on re-associated expr
			if (args.length > 2) {
				for (var j = 1; j < args.length; j++) {
					for (var i = 0; i < j; i++) {
						//var vroot = new Binary(op, args[i], args[j]);
						//var hasMatch = checkMatches(vroot, allrules[vroot.hash2], [], null, backwards, getPattern, true);
					}
				}
			}

			if (op == 2 || op == 3 || op == 4) {
				// |, ^, +
				// look for non-intersecting bits
				function noIntersect(l, r) {
					if (l.type == 'bin' && l.op == 1 /* & */ &&
						r.type == 'bin' && r.op == 1 /* & */) {
						var ll = l.l;
						var lr = l.r;
						var rl = r.l;
						var rr = r.r;

						function test(node, l, r) {
	                        if (node.type == 'const' && l.type == 'const' && (l.value & node.value) == 0)
	                        	return true;
	                        if (node.type == 'const' && r.type == 'const' && (r.value & node.value) == 0)
	                        	return true;
							if (node.type == 'un' && node.op == 0)
								return node.value.equals(l) || node.value.equals(r);
							return false;
						}

						var r = test(ll, rl, rr) ||
							   test(lr, rl, rr) ||
							   test(rl, ll, lr) ||
							   test(rr, ll, lr);
						return r;
					}
				}
				var L = root.l;
				var R = root.r;
				if (noIntersect(L, R)) {
					var ops = [2, 3, 4];
					ops.splice(ops.indexOf(op), 1);
					for (var i = 0; i < ops.length; i++) {
						var newOp = ops[i];
						var res = new Binary(newOp, L, R);
						if (getPattern) {
							var pp = new Binary(op, mkvar(0, L.id), mkvar(1, R.id));
							pp.id = root.id;
							var rp = new Binary(newOp, mkvar(0, L.id), mkvar(1, R.id));
							rp.id = res.is;
							var p = new Binary(20, pp, rp);
							var descF = opstr[op] + " is " + opstr[newOp] + " when bits <a class='replace'>don't intersect</a>";
							var descR = opstr[newOp] + " is " + opstr[op] + " when bits <a class='replace'>don't intersect</a>";
							results.push([p, res, [,,,descF, descR], new Binary(20, new Binary(1, root.l, root.r), new Constant(0))]);
						}
						else
							results.push([parent, res, null, backwards, parent[4] + 2, null]);
					}
				}
			}

			switch (op) {
			default: break;
			case 3:
				// xor
				// try to turn xors of shifted values into clmul
				var unshifted = args.find(function (a) { return a.type != "bin" || a.op != 6; });
				if (unshifted && args.every(function (a) {
					return (a.id == unshifted.id && a.equals2(unshifted)) ||
						(a.type == "bin" && a.op == 6 &&
						a.r.type == "const" && a.l.equals2(unshifted)); 
				})) {
					var M = 0;
					for (var i = 0; i < args.length; i++) {
						var a = args[i];
						if (a.id == unshifted.id) M = M + 1 | 0;
						else M = M + (1 << a.r.value) | 0;
					}
					var res = new Binary(61, unshifted, new Constant(M));
					if (getPattern) {
						var rp = new Binary(61, mkvar(0, unshifted.id), res.r);
						rp.id = res.id;
						var pp = rebuildTreeLike(root, function (e,a){
							if (e.equals2(unshifted)) return mkvar(0, 0);
							else return new Binary(6, mkvar(0, e.l.id), e.r);
						}, op, -1);
						var p = new Binary(20, pp, rp);
						results.push([p, res, [,,,"combine xors into clmul", "split clmul into xors"]]);
					}
					else
						results.push([parent, res, null, backwards, parent[4] + 1, null]);
				}
				break;
			case 4:
				// addition
				// try to turn additions of shifted values into multiply
				var unshifted = args.find(function (a) { return a.type != "bin" || a.op != 6; });
				if (unshifted && args.every(function (a) {
					return (a.id == unshifted.id && a.equals2(unshifted)) ||
						(a.type == "bin" && a.op == 6 &&
						a.r.type == "const" && a.l.equals2(unshifted)); 
				})) {
					var M = 0;
					for (var i = 0; i < args.length; i++) {
						var a = args[i];
						if (a.id == unshifted.id && a.equals2(unshifted)) M = M + 1 | 0;
						else M = M + (1 << a.r.value) | 0;
					}
					var res = new Binary(11, unshifted, new Constant(M));
					if (getPattern) {
						var rp = new Binary(11, mkvar(0, unshifted.id), res.r);
						rp.id = res.id;
						var pp = rebuildTreeLike(root, function (e,a){
							if (e.equals2(unshifted)) return mkvar(0, 0);
							else return new Binary(6, mkvar(0, e.l.id), e.r);
						}, op, -1);
						var p = new Binary(20, pp, rp);
						results.push([p, res, [,,,"combine additions into multiplication", "split multiplication into additions"]]);
					}
					else
						results.push([parent, res, null, backwards, parent[4] + 1, null]);
				}
				// check complementary subsets
				if (args.some(function (e){ return e.type != 'bin' || e.op != 1 || (e.l.type != 'const' && e.r.type != 'const'); })) break;
				var values = args.map(function (e){ return e.l.type == 'const' ? e.l.value : e.r.value; });
				var isgood = true;
				for (var i = 1; i < values.length; i++)
					for (var j = 0; j < i; j++)
						if ((values[i] & values[j]) != 0)
							isgood = false;
				if (!isgood) break;
				if (values.reduce(function (a, b){ return a|b; }, 0) != -1) break;
				var res = args[0].l.type == 'const' ? args[0].r : args[0].l;
				if (args.some(function (e){ return !res.equals2(e.l) && !res.equals2(e.r); })) break;
				if (getPattern) {
					var pp = rebuildTreeLike(root, function (e,a){ return e.equals2(res) ? mkvar(0, 0) : mkvar(a.argindex++, 0); }, op, 1);
					var p = new Binary(20, pp, mkvar(0, res.id));
					var desc = "addition of complementary subsets (condition: masks exactly cover -1)";
					results.push([p, res, [,,,desc, desc]]);
				}
				else
					results.push([parent, res, null, backwards, parent[4] + 1, null]);
			}
		}
		else if (root.op == 6 || root.op == 30 || root.op == 31) {
			var op = root.op;
			var args = [];

			function gatherArgs(root, args, op) {
				if (root.type == 'bin' && root.op == op) {
					gatherArgs(root.l, args, op);
					args.push(root.r);
				}
				else
					args.push(root);
			}

			gatherArgs(root, args, op);
			if (args.length > 2) {
				// chained shifts
				var base = args[0];
				args = args.slice(1);
				if (args.every(function(a) { return a.type == 'const'; })) {
					var total = args.reduce(function(a, b) { return a + (b.value & 31) | 0; }, 0);
					if ((total >>> 0) >= 32 && op == 30) {
						var res = new Binary(30, base, new Constant(31));
						if (getPattern) {
							var p = new Binary(20, root, res);
							var desc = "shifting (arithmetic) by 32 or more in total";
							results.push([p, res, [,,,desc, desc]]);
						}
						else
							results.push([parent, res, null, backwards, parent[4] + 1, null]);
					}
					else if ((total >>> 0) >= 32 && op != 30) {
						var res = new Constant(0);
						if (getPattern) {
							var p = new Binary(20, root, res);
							var desc = "shifting (logical) by 32 or more in total";
							results.push([p, res, [,,,desc, desc]]);
						}
						else
							results.push([parent, res, null, backwards, parent[4] + 1, null]);
					}
					else {
						var res = new Binary(op, base, new Constant(total));
						if (getPattern) {
							var p = new Binary(20, root, res);
							var fdesc = "chained shifts can be combined if total shift amount is &lt;u 32";
							var rdesc = "shift can be decomposed into several steps";
							results.push([p, res, [,,,fdesc, rdesc]]);
						}
						else
							results.push([parent, res, null, backwards, parent[4] + 1, null]);
					}
				}
			}
		}
		else if (root.op == 33) {
			// /u
			if (root.r.type == 'const' && popcnt(root.r.value) == 1) {
				var res = new Binary(31, root.l, new Constant(ctz(root.r.value)));
				if (getPattern) {
					var sh = new Unary(3, mkvar(1, root.r.id));
					sh.id = res.r.id;
					var p = new Binary(20, new Binary(33, mkvar(0, root.l.id), mkvar(1, root.r.id)), new Binary(31, mkvar(0, root.l.id), sh));
					p.l.id = root.id;
					p.r.id = res.id;
					var desc = "division by power of two (condition: y is a power of two)";
					results.push([p, res, [,,,desc, desc]]);
				}
				else
					results.push([parent, res, null, backwards, parent[4] + 1, null])
			}
		}
		else if (root.op == 35) {
			// %u
			if (root.r.type == 'const' && popcnt(root.r.value) == 1) {
				var res = new Binary(1, root.l, new Constant(~~(root.r.value - 1)));
				if (getPattern) {
					var msk = new Binary(5, mkvar(1, root.r.id), new Constant(1));
					msk.id = res.r.id;
					var p = new Binary(20, new Binary(35, mkvar(0, root.l.id), mkvar(1, root.r.id)), new Binary(1, mkvar(0, root.l.id), msk));
					p.l.id = root.id;
					p.r.id = res.id;
					var desc = "remainder by power of two (condition: y is a power of two)";
					results.push([p, res, [,,,desc, desc]]);
				}
				else
					results.push([parent, res, null, backwards, parent[4] + 1, null])
			}
		}
		else if (root.op == 12) {
			// /e
			if (root.r.type == 'const' && popcnt(root.r.value) == 1) {
				var res = new Binary(30, root.l, new Constant(ctz(root.r.value)));
				if (getPattern) {
					var sh = new Unary(3, mkvar(1, root.r.id));
					sh.id = res.r.id;
					var p = new Binary(20, new Binary(12, mkvar(0, root.l.id), mkvar(1, root.r.id)), new Binary(30, mkvar(0, root.l.id), sh));
					p.l.id = root.id;
					p.r.id = res.id;
					var desc = "division by power of two (condition: y is a power of two)";
					results.push([p, res, [,,,desc, desc]]);
				}
				else
					results.push([parent, res, null, backwards, parent[4] + 1, null])
			}
		}
		else if (root.op == 13) {
			// %e
			if (root.r.type == 'const' && popcnt(root.r.value) == 1) {
				var res = new Binary(1, root.l, new Constant(~~(root.r.value - 1)));
				if (getPattern) {
					var msk = new Binary(5, mkvar(1, root.r.id), new Constant(1));
					msk.id = res.r.id;
					var p = new Binary(20, new Binary(13, mkvar(0, root.l.id), mkvar(1, root.r.id)), new Binary(1, mkvar(0, root.l.id), msk));
					p.l.id = root.id;
					p.r.id = res.id;
					var desc = "remainder by power of two (condition: y is a power of two)";
					results.push([p, res, [,,,desc, desc]]);
				}
				else
					results.push([parent, res, null, backwards, parent[4] + 1, null])
			}
		}
		else if (root.op == 50) {
			// pdep
			
		}
		}

		if (root.type == 'bin' && !mayThrow(root.op) && root.l.type == 'ter' &&
			root.l.cond.type == 'bin' && binOpResultsInBool(root.l.cond.op)) {
			var res = new Ternary(root.l.cond, new Binary(root.op, root.l.t, root.r), new Binary(root.op, root.l.f, root.r));
			if (getPattern) {
				// (C ? X : Y) + Z
				var C = mkvar(0, root.l.cond.id), X = mkvar(1, root.l.t.id), Y = mkvar(2, root.l.f.id), Z = mkvar(3, root.r.id);
				var p = new Binary(20,
					new Binary(root.op, new Ternary(C, X, Y), Z),
					new Ternary(C, new Binary(root.op, X, Z), new Binary(root.op, Y, Z)));
				p.l.id = root.id;
				p.r.id = res.id;
				p.l.l.id = root.l.id;
				p.r.t.id = res.t.id;
				p.r.f.id = res.f.id;
				var desc = "anything distributes over conditional-select (condition: x is a boolean)";
				results.push([p, res, [,,,desc, desc]]);
			}
			else
				results.push([parent, res, null, backwards, parent[4] + 1, null]);
		}
		if (root.type == 'bin' && !mayThrow(root.op) && root.r.type == 'ter' &&
			root.r.cond.type == 'bin' && binOpResultsInBool(root.r.cond.op)) {
			var res = new Ternary(root.r.cond, new Binary(root.op, root.l, root.r.t), new Binary(root.op, root.l, root.r.f));
			if (getPattern) {
				// X + (C ? Y : Z)
				var X = mkvar(1, root.l.id), C = mkvar(0, root.r.cond.id), Y = mkvar(2, root.r.t.id), Z = mkvar(3, root.r.f.id);
				var p = new Binary(20,
					new Binary(root.op, X, new Ternary(C, Y, Z)),
					new Ternary(C, new Binary(root.op, X, Y), new Binary(root.op, X, Z)));
				p.l.id = root.id;
				p.r.id = res.id;
				p.l.r.id = root.r.id;
				p.r.t.id = res.t.id;
				p.r.f.id = res.f.id;
				var desc = "anything distributes over conditional-select (condition: x is a boolean)";
				results.push([p, res, [,,,desc, desc]]);
			}
			else
				results.push([parent, res, null, backwards, parent[4] + 1, null]);
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
			/*if (proofnode[0]) {
				var unc0 = proofnode[0][1].containsDoubleUnary();
				var unc1 = proofnode[1].containsDoubleUnary();
				if (unc1 > unc0) {
					var unc2 = p[1].containsDoubleUnary();
					if (unc2 >= unc1)
						continue;
				}
			}*/
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
					if (explanation[2][5])
						debugger;
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
						if (explanation[2][5])
							debugger;
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
			if (explanation == null)
				proofsteps.push([]);
			else
				proofsteps.push([explanation[2][explindex], explanation[0], explanation[3]]);
		}
		proofsteps.push(steps[steps.length - 1]);
		return proofsteps;
	}

	if (to) {
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
	}
	else {
		from = from.constantFold();
		complexity_weight = 5;
		steps_weight = 1;
	}

	// priority queues
	q1 = [];
	q2 = [];
	// hash maps
	h1 = [];
	h2 = [];

	q1.push([null, from, null, false, 0, null]);
	if (to) {
		q2.push([null, to, null, true, 0, null]);
		hash_update(h2, to, q2[0]);
	}
	hash_update(h1, from, q1[0]);

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
			if (time.getTime() - starttime.getTime() > Math.min(timelimit, 2000) && mode !== 'slow') {
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

	function loop_async_simp(index, best, q1, h1, from, rules, cb) {
		var maxForwardWeight = from.weight + 5;
		for (var counter = 0; counter < 10; counter++) {
			var time = new Date();
			if (q1.length == 0 || index > 100 || time.getTime() - starttime.getTime() > Math.min(timelimit, 2000)) {
				if (best.n[1].equals(from)) {
					cb(null, null);
				}
				else {
					var node = best.n;
					proofsteps = makesteps(false, node, [null, node[1]], rules);
					cb(proofsteps, node[1]);
				}
				return;
			}
			// forward step only
			var pn = removeMin(q1);
			if (pn[1].weight < best.w) {
				best.w = pn[1].weight;
				best.n = pn;
			}
			// ignore result, no match can be found
			processNode(pn, false, h1, q1, [], maxForwardWeight, rules);
		}
		setTimeout(function() {
			loop_async_simp(index + 1, best, q1, h1, from, rules, cb);
		}, 0);
	}

	if (to)
		loop_async(0, q1, q2, h1, h2, from, to, this.Rules, callback);
	else
		loop_async_simp(0, {w:from.weight,n:q1[0]}, q1, h1, from, this.Rules, callback);

	return;
};

ProofFinder.proveAsync = function(from, to, cb) {
  if (window.Worker && window.location.protocol != 'file:') {
    var pfw = new Worker('pfworker.js');
    pfw.onmessage = function(e) {
      cb(e.data.steps, e.data.res);
    };
    pfw.postMessage({id: id, from: from, to: to, tl: 2000});
  }
  else {
  	console.log('Running ProofFinder on main thread');
    var pf = new ProofFinder(20);
    pf.Search(from, to, function (steps, res) {
      cb(steps, res);
    }, null, 2000);
  }
};
