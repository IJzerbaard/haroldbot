function ProofFinder(op) {

	var except_not = 1;
	var except_neg = 2;
	var except_zero = 3;
	var except_unknown_or_zero = 4;

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
			["&", [a(0)], [-1]],
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
			["&", ["&", [a(0)], [a(1)]], [a(2)]],
			["&", [a(0)], ["&", [a(1)], [a(2)]]],
			true, "associativity of and", ,
		],
		// properties of or
		[
			["|", [a(0)], [0]],
			[a(0)],
			false, "or with 0", ,
		],
		[
			["|", [a(0)], [-1]],
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
			["|", ["|", [a(0)], [a(1)]], [a(2)]],
			["|", [a(0)], ["|", [a(1)], [a(2)]]],
			true, "associativity of or", ,
		],
		// properties of xor
		[
			["^", [a(0)], [0]],
			[a(0)],
			false, "xor with 0", ,
		],
		[
			["^", [a(0)], [-1]],
			["~", [a(0)]],
			false, "xor with -1", ,
		],
		[
			["^", [a(0)], [a(0)]],
			[0],
			false, "xor with self", ,
		],
		[
			["^", [a(0)], ["^", [a(1)], [a(0)]]],
			[a(1)],
			false, "xor with self", ,
		],
		[
			["^", [a(0)], ["~", [a(0)]]],
			[-1],
			false, "xor with complement of self", ,
		],
		[
			["^", [a(0)], [a(1)]],
			["|", ["&", [a(0)], ["~", [a(1)]]], ["&", ["~", [a(0)]], [a(1)]]],
			true, "definition #1 of xor", ,
		],
		[
			["^", [a(0)], [a(1)]],
			["&", ["|", [a(0)], [a(1)]], ["|", ["~", [a(0)]], ["~", [a(1)]]]],
			true, "definition #2 of xor", ,
		],
		[
			["^", [a(0)], [a(1)]],
			["&", ["|", [a(0)], [a(1)]], ["~", ["&", [a(0)], [a(1)]]]],
			true, "definition #3 of xor", ,
		],
		[
			["^", ["^", [a(0)], [a(1)]], [a(2)]],
			["^", [a(0)], ["^", [a(1)], [a(2)]]],
			true, "associativity of xor", ,
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
			false, "move complement", ,
		],
		// properties of addition
		[
			["+", [a(0)], [0]],
			[a(0)],
			false, "additive identity", ,
		],
		[
			["+", [a(0)], ["~", [a(0)]]],
			[-1],
			false, "add to complement of self", ,
		],
		[
			["+", ["+", [a(0)], [a(1)]], [a(2)]],
			["+", [a(0)], ["+", [a(1)], [a(2)]]],
			true, "associativity of addition", ,
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
		// properties of multiplication
		[
			["*", ["*", [a(0)], [a(1)]], [a(2)]],
			["*", [a(0)], ["*", [a(1)], [a(2)]]],
			true, "associativity of multiplication", ,
		],

		// interrelations between operations

		// absorption
		[
			["&", [a(0)], ["|", [a(0)], [a(1)]]],
			[a(0)],
			false, "and cancels or", ,
		],
		[
			["|", [a(0)], ["&", [a(0)], [a(1)]]],
			[a(0)],
			false, "or cancels and", ,
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
		// distributivity pairs
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
		// shifts over or
		[
			["<<" ["|", [a(0)], [a(1)]], [a(2)]],
			["|", ["<<", [a(0)], [a(2)]], ["<<", [a(1)], [a(2)]]],
			true, "left shift distributes over or", ,
		],
		[
			["|", ["<<", [a(0)], [a(1)]], ["<<", [a(2)], [a(1)]]],
			["<<" ["|", [a(0)], [a(2)]], [a(1)]],
			true, "left shift distributes over or", ,
		],
		[
			[">>u" ["|", [a(0)], [a(1)]], [a(2)]],
			["|", [">>u", [a(0)], [a(2)]], [">>u", [a(1)], [a(2)]]],
			true, "right shift distributes over or", ,
		],
		[
			["|", [">>u", [a(0)], [a(1)]], [">>u", [a(2)], [a(1)]]],
			[">>u" ["|", [a(0)], [a(2)]], [a(1)]],
			true, "right shift distributes over or", ,
		],
		[
			[">>s" ["|", [a(0)], [a(1)]], [a(2)]],
			["|", [">>s", [a(0)], [a(2)]], [">>s", [a(1)], [a(2)]]],
			true, "right shift distributes over or", ,
		],
		[
			["|", [">>s", [a(0)], [a(1)]], [">>s", [a(2)], [a(1)]]],
			[">>s" ["|", [a(0)], [a(2)]], [a(1)]],
			true, "right shift distributes over or", ,
		],
		// shifts over and
		[
			["<<" ["&", [a(0)], [a(1)]], [a(2)]],
			["&", ["<<", [a(0)], [a(2)]], ["<<", [a(1)], [a(2)]]],
			true, "left shift distributes over and", ,
		],
		[
			["&", ["<<", [a(0)], [a(1)]], ["<<", [a(2)], [a(1)]]],
			["<<" ["&", [a(0)], [a(2)]], [a(1)]],
			true, "left shift distributes over and", ,
		],
		[
			[">>u" ["&", [a(0)], [a(1)]], [a(2)]],
			["&", [">>u", [a(0)], [a(2)]], [">>u", [a(1)], [a(2)]]],
			true, "right shift distributes over and", ,
		],
		[
			["&", [">>u", [a(0)], [a(1)]], [">>u", [a(2)], [a(1)]]],
			[">>u" ["&", [a(0)], [a(2)]], [a(1)]],
			true, "right shift distributes over and", ,
		],
		[
			[">>s" ["&", [a(0)], [a(1)]], [a(2)]],
			["&", [">>s", [a(0)], [a(2)]], [">>s", [a(1)], [a(2)]]],
			true, "right shift distributes over and", ,
		],
		[
			["&", [">>s", [a(0)], [a(1)]], [">>s", [a(2)], [a(1)]]],
			[">>s" ["&", [a(0)], [a(2)]], [a(1)]],
			true, "right shift distributes over and", ,
		],
		// shifts over xor
		[
			["<<" ["^", [a(0)], [a(1)]], [a(2)]],
			["^", ["<<", [a(0)], [a(2)]], ["<<", [a(1)], [a(2)]]],
			true, "left shift distributes over xor", ,
		],
		[
			["^", ["<<", [a(0)], [a(1)]], ["<<", [a(2)], [a(1)]]],
			["<<" ["^", [a(0)], [a(2)]], [a(1)]],
			true, "left shift distributes over xor", ,
		],
		[
			[">>u" ["^", [a(0)], [a(1)]], [a(2)]],
			["^", [">>u", [a(0)], [a(2)]], [">>u", [a(1)], [a(2)]]],
			true, "right shift distributes over xor", ,
		],
		[
			["^", [">>u", [a(0)], [a(1)]], [">>u", [a(2)], [a(1)]]],
			[">>u" ["^", [a(0)], [a(2)]], [a(1)]],
			true, "right shift distributes over xor", ,
		],
		[
			[">>s" ["^", [a(0)], [a(1)]], [a(2)]],
			["^", [">>s", [a(0)], [a(2)]], [">>s", [a(1)], [a(2)]]],
			true, "right shift distributes over xor", ,
		],
		[
			["^", [">>s", [a(0)], [a(1)]], [">>s", [a(2)], [a(1)]]],
			[">>s" ["^", [a(0)], [a(2)]], [a(1)]],
			true, "right shift distributes over xor", ,
		],
		// everything distributes over mux
		[
			["~", ["?", [a(0)], [a(1)], [a(2)]]],
			["?", [a(0)], ["~", [a(1)]], ["~", [a(2)]]],
			true, "everything distributes over mux", ,
		],
		[
			["-", ["?", [a(0)], [a(1)], [a(2)]]],
			["?", [a(0)], ["-", [a(1)]], ["-", [a(2)]]],
			true, "everything distributes over mux", ,
		],
		[
			["&", ["?", [a(0)], [a(1)], [a(2)]], [a(3)]],
			["?", [a(0)], ["&", [a(1)], [a(3)]], ["&", [a(2)], [a(3)]]],
			true, "everything distributes over mux", ,
		],
		[
			["|", ["?", [a(0)], [a(1)], [a(2)]], [a(3)]],
			["?", [a(0)], ["|", [a(1)], [a(3)]], ["|", [a(2)], [a(3)]]],
			true, "everything distributes over mux", ,
		],
		[
			["^", ["?", [a(0)], [a(1)], [a(2)]], [a(3)]],
			["?", [a(0)], ["^", [a(1)], [a(3)]], ["^", [a(2)], [a(3)]]],
			true, "everything distributes over mux", ,
		],
		[
			["+", ["?", [a(0)], [a(1)], [a(2)]], [a(3)]],
			["?", [a(0)], ["+", [a(1)], [a(3)]], ["+", [a(2)], [a(3)]]],
			true, "everything distributes over mux", ,
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
		// conditional rules
		[
			["^", [a(0)], [a(1)]],
			["|", [a(0)], [a(1)]],
			true, "xor is or when bits don't intersect", , "no intersect"
		],
		[
			["+", [a(0)], [a(1)]],
			["|", [a(0)], [a(1)]],
			true, "addition is or when bits don't intersect", , "no intersect"
		],
		[
			["^", [a(0)], [a(1)]],
			["+", [a(0)], [a(1)]],
			true, "xor is addition when bits don't intersect", , "no intersect"
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
			false, "and with something can only reset bits", ,
		],
		[
			["&", [a(0)], [a(1)]],
			["min_u", [a(0)], [a(1)]],
			false, "and with something can only reset bits", ,
		],
		[
			["max_u", [a(0)], [a(1)]],
			["|", [a(0)], [a(1)]],
			false, "or with something can only set bits", ,
		],
		[
			["^", [a(0)], [a(1)]],
			["|", [a(0)], [a(1)]],
			false, "if xor sets a bit then or sets it as well", ,
		],
		[
			["min_u", [a(0)], [a(1)]],
			["max_u", [a(0)], [a(1)]],
			false, "the minimum is no more than the maximum", ,
		],
		[
			["min_u", [a(0)], [a(1)]],
			[a(0)],
			false, "the minimum is no more than its inputs", ,
		],
		[
			["?", [a(0)], [a(1)], [a(2)]],
			["|", [a(1)], [a(2)]],
			false, "mux can't set more bits than or", ,
		]
	];

	var rules_gteu = [
		[			
			["|", [a(0)], [a(1)]],
			[a(0)],
			false, "or with something can only set bits", ,
		],
		[
			["max_u", [a(0)], [a(1)]],
			[a(0)],
			false, "the maximum is at least as big as its inputs", ,
		],
	];


	function convOps(root) {
		if (root.length == 1)
			return root;
		if (root.length == 2) {
			root[0] = root[0] == '~' ? 0 : 1;
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
		return [rule[1], rule[0], false, rule[4], rule[3], rule[5], rule[6]];
	}

	var numrules = rules.length;
	for (var i = 0; i < numrules; i++) {
		if (rules[i][2]) {
			rules.push(rev_rule(rules[i]));
		}
	}

	this.oldrules = rules;

	this.Rules = new Array(0x1000);
	for (var i = 0; i < 0x1000; i++)
		this.Rules[i] = [];

	for (var i = 0; i < rules.length; i++) {
		var rule = rules[i];
		var from = rule[0];
		if (from.length == 1) {
			if (from[0].any != undefined) {
				for (var p = 0; p < 0x1000; p++)
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
				var bottom = (from[0] + 1) & 15;
				for (var p = bottom; p < 0x1000; p += 16)
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
				this.Rules[(from[0] + 1 & 15) + ((from[1][0] + 1 & 15) << 4)].push(rule);
			}
			else if (from[1].length == 3) {
				// unary with binary as operand
				this.Rules[(from[0] + 1 & 15) + ((from[1][0] + 5 & 15) << 4)].push(rule);
			}
			else if (from[1].length == 4) {
				// ternary as operand
				var bottom = (from[0] + 1) & 15;
				for (var p = bottom; p < 0x1000; p += 16)
					this.Rules[p].push(rule);
			}
			else {
				debugger;
				alert("rule is badly formatted");
			}
		}
		else if (from.length == 3) {
			var bits = from[0] + 5 & 15;
			var mask = 0x00F;
			for (var j = 0; j < 2; j++) {
				switch (from[j + 1].length) {
					case 1:
						if (from[j + 1][0].any == undefined) {
							bits |= ((from[j + 1] & 7) | ((from[j + 1] >>> 31) << 3)) << (4 + 4 * j);
							mask |= 0x0F0 << (4 * j);
						}
						break;
					case 2:
						bits |= (from[j + 1][0] + 1 & 15) << (4 + 4 * j);
						mask |= 0x0F0 << (4 * j);
						break;
					case 3:
						bits |= (from[j + 1][0] + 5 & 15) << (4 + 4 * j);
						mask |= 0x0F0 << (4 * j);
						break;
					case 4:
						break;
					default:
						debugger;
						alert("rule is badly formatted");
						break;
				}
			}
			for (var p = 0; p < 0x1000; p = (p | mask) + 1 & ~mask) {
				this.Rules[p | bits].push(rule);
			}
		}
		else if (from.length == 4) {
			var bits = 0;
			var mask = 0;
			for (var j = 0; j < 3; j++) {
				switch (from[j + 1].length) {
					case 1:
						if (from[j + 1][0].any == undefined) {
							bits |= ((from[j + 1] & 7) | ((from[j + 1] >>> 31) << 3)) << (4 * j);
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
			for (var p = 0; p < 0x1000; p = (p | mask) + 1 & ~mask) {
				this.Rules[p | bits].push(rule);
			}
		}
	}
	return;
}

ProofFinder.prototype.Search = function(from, to, callback, debugcallback) {

	/* proof node format:
       [parent, expr, explanation, backwards, depth, pattern]
           0     1         2           3        4       5
	 */

	function hash_update(htable, key, val) {
		var h = (key.hash & 0x7fffffff) % 65521;
		if (htable[h] == undefined)
			htable[h] = [];
		var subtable = htable[h];
		for (var i = 0; i < subtable.length; i += 2) {
			if (key.equals(subtable[i])) {
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
			if (key.equals(subtable[i]))
				return subtable[i + 1];
		}
		return null;
	}

	function cmp(a, b) {
		var wa = a[1].weight * 2 + a[4] * 3;
		var wb = b[1].weight * 2 + b[4] * 3;
		if (wa < wb)
			return -1;
		if (wa > wb)
			return 1;
		return 0;
	}

	function heap_add(heap, item) {
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
		if (heap.length == 1) {
			return heap.pop();
		}
		var min = heap[0];
		heap[0] = heap.pop();
		var index = 0;
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
		return min;
	}

	function isTopLevelMatch(pattern, expr, wildcards, rev, res_pattern) {
		var except_not = 1;
		var except_neg = 2;
		var except_zero = 3;
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
					if (expr.equals(wildcards[any_index])) {
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
				wildcards.length = backup.length;
				for (var i = 0; i < backup.length; i++)
					wildcards[i] = backup[i];
				if (commutative[expr.op] &&
					// if both sides are Any, no point in trying to swap them
					!(pattern[1].any != undefined && pattern[2].any != undefined) &&
					// if both sides are Unary(op, Any) for equal op, no point in swapping
					!(pattern[1].length == 2 && pattern[2].length == 2 && pattern[1][0] == pattern[2][0] && pattern[1][1].any != undefined && pattern[2][1].any != undefined)) {
					if (isTopLevelMatch(pattern[2], expr.l, wildcards, rev, res_pattern) &&
						isTopLevelMatch(pattern[1], expr.r, wildcards, rev, r_res_pattern)) {
						rev.push(expr.id);
						if (res_pattern) {
							res_pattern[0] = new Binary(expr.op, res_pattern[0], r_res_pattern[0]);
							res_pattern[0].id = expr.id;
						}
						return true;
					}
				} else return false;
			}
		} else if (pattern.length == 4) {
			if (expr.type != 'ter')
				return false;
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
			var res = new Unary(to[0], vr).constantFold();
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
			var res = new Binary(to[0], lr, rr).constantFold();
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
			var res = new Ternary(cr, tr, fr).constantFold();
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

	function applyRules(root, results, parent, backwards, allrules, getPattern) {
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
						results.push([patternNode[0], n, rules[i]]);
					}
					else {
						if (rules[i][5] == "no intersect")
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

			gatherArgs(root, args, op);
			// put all constants last
			insertionSort(args, function(a, b) {
				if (a.type == 'const' && b.type != 'const') return 1;
				else return -1;
			});
			// construct normalized trees
			var trees = [];
			var res = new Binary(op, args[0], args[1]);
			for (var i = 2; i < args.length; i++)
				res = new Binary(op, res, args[i]);
			trees.push(res);

			res = new Binary(op, args[args.length - 2], args[args.length - 1]);
			for (var i = args.length - 3; i >= 0; i--)
				res = new Binary(op, args[i], res);
			trees.push(res);

			for (var i = 0; i < trees.length; i++) {
				if (getPattern)
					results.push([, res, [,,,"rearrange associative/commutative operation", "rearrange associative/commutative operation"]]);
				else
					results.push([parent, res, null, backwards, parent[4] + 1, null]);
			}
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
			default: debugger;
		}
	}

	function processNode(proofnode, backwards, htable, q, otherside, maxweight, rules, proofsteps) {
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

				var c = p;
				var steps = [];
				if (!backwards) {
					while (c != null) {
						if (c[3]) debugger;
						steps.unshift(c[1]);
						c = c[0];
					}
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
				for (var j = 0; j < steps.length - 1; j++) {
					var f = steps[j];
					var t = steps[j + 1];
					var explanation = null;
					var explbackwards = false;
					// try forwards
					var forwardSet = [];
					applyRules(f, forwardSet, [,,,,0], false, rules, true);
					for (var k = 0; k < forwardSet.length; k++) {
						if (forwardSet[k] && t.equals(forwardSet[k][1])) {
							explanation = forwardSet[k];
							if (explanation[0]) fixup_ids(explanation[1], t, explanation[0].r)
								break;
						}
					}
					// try backwards
					if (!explanation) {
						var backwardSet = [];
						applyRules(t, backwardSet, [,,,,0], false, rules, true);
						for (var k = 0; k < backwardSet.length; k++) {
							if (backwardSet[k] && f.equals(backwardSet[k][1])) {
								explanation = backwardSet[k];
								explbackwards = true;
								if (explanation[0]) {
									var patl = explanation[0].l;
									var patr = explanation[0].r;
									fixup_ids(explanation[1], f, patr);
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
					if (explanation[0])
						proofsteps.push([explanation[2][explindex], explanation[0]]);
					else
						proofsteps.push([explanation[2][explindex]]);
				}
				proofsteps.push(steps[steps.length - 1]);
				return true;
			}
		}
		return false;
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
			case "extra steps":
				// handled elsewhere
				return true;
		}
	}

	from = from.constantFold();
	to = to.constantFold();

	var maxForwardWeight = from.weight + 4;
	var maxBackwardWeight = to.weight + 4;

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

	function loop_async(index, q1, q2, h1, h2, from, to, rules, cb) {
		var maxForwardWeight = from.weight + 4;
		var maxBackwardWeight = to.weight + 4;
		var counter = 0;
		var found = false;
		var proofsteps = [];

		while (q1.length + q2.length > 0 && counter < 10) {
			counter++;
			// forward step
			if (q1.length > 0) {
				var pn = removeMin(q1);
				if (debugcallback) debugcallback(pn[1], false);
				if (processNode(pn, false, h1, q1, h2, maxForwardWeight, rules, proofsteps)) {
					found = true;
					break;
				}
			}
			// backward step
			if (q2.length > 0) {
				var pn = removeMin(q2);
				if (debugcallback) debugcallback(pn[1], true);
				if (processNode(pn, true, h2, q2, h1, maxBackwardWeight, rules, proofsteps)) {
					found = true;
					break;
				}
			}
		}
		if (found) {
			cb(proofsteps);
		}
		else if (index > 200) {
			cb(null);
		}
		else {
			setTimeout(function() {
				loop_async(index + 1, q1, q2, h1, h2, from, to, rules, cb);
			}, 0);
		}
	}

	loop_async(0, q1, q2, h1, h2, from, to, this.Rules, callback);

	return;
};
