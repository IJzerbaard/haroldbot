function SAT() {
	this.clauses = [];
	this.highestvar = 0;
	this.propagateStack = [];
	this.ok = true;
	this.inputUsed = new Uint8Array(2048);
	this.watches = new Array();
	this.reason = new Array();
	this.assignstack = new Array();
	this.stat = "UNKNOWN";

	if (!Array.isArray) {
		Array.isArray = function(arg) {
			return Object.prototype.toString.call(arg) === '[object Array]';
		};
	}

	if (!Array.prototype.includes) {
		Array.prototype.includes = function(searchElement /*, fromIndex*/ ) {
			'use strict';
			var O = Object(this);
			var len = parseInt(O.length, 10) || 0;
			if (len === 0) {
				return false;
			}
			var n = parseInt(arguments[1], 10) || 0;
			var k;
			if (n >= 0) {
				k = n;
			} else {
				k = len + n;
				if (k < 0) {k = 0;}
			}
			var currentElement;
			while (k < len) {
				currentElement = O[k];
				if (searchElement === currentElement) { // NaN !== NaN
					return true;
				}
				k++;
			}
			return false;
		};
	}
}

function litv(l) {
	return l >>> 1;
}

function lits(l) {
	return l & 1;
}

SAT.prototype.addClause = function(clause) {

	function push_or_create(array, index, item) {
		if (array[index] === undefined)
			array[index] = [];
		array[index].push(item);
	}

	clause = Array.from(clause);

	for (var i = 0; i < clause.length; i++) {
		clause[i] = ((clause[i] ^ (clause[i] >> 31)) << 1) | (clause[i] >>> 31);
		if ((clause[i] >>> 1) > this.highestvar)
			this.highestvar = clause[i] >>> 1;
		if ((clause[i] >>> 1) < 2048)
			this.inputUsed[clause[i] >>> 1] = 1
	}

	for (var i = 0; i < clause.length; i++) {
		if (this.propagateStack.includes(clause[i])) {
			// already known to be true, clause useless
			return;
		}
		else if (this.propagateStack.includes(clause[i] ^ 1)) {
			// already known to be false
			clause[i] = clause[clause.length - 1];
			clause.pop();
			i--;
		}
	}

	if (clause.length == 0) {
		this.stat = "UNSAT";
	}
	else if (clause.length == 1) {
		this.propagateStack.push(clause[0])
	}
	else if (clause.length == 2) {
		push_or_create(this.watches, clause[0] ^ 1, clause[1]);
		push_or_create(this.watches, clause[1] ^ 1, clause[0]);
	}
	else {
		push_or_create(this.watches, clause[0] ^ 1, clause);
		push_or_create(this.watches, clause[1] ^ 1, clause);
		this.clauses.push(clause);
	}
};

SAT.prototype.addDIMACS = function(clause) {
	var parts = clause.split(" ");
	var cl = [];
	for (var i = 0; i < parts.length; i++) {
		var x = parseInt(parts[i]);
		if (x == 0)
			break;
		if (x < 0)
			x = ~(-x - 1);
		else
			x = x - 1;
		cl.push(x);
	}
	this.addClause(cl);
};

SAT.prototype.BCP = function() {
	"use strict";

	function istrue(lit) {
		return this.assignment[litv(lit)] == 2 - lits(lit);
	}

	function isfalse(lit) {
		return this.assignment[litv(lit)] == 1 + lits(lit);
	}

	function enqueue(lit, from) {
		if (this.assignment[litv(lit)] != 0)
			return istrue(lit);
		this.assignstack.push(lit);
		this.assignment[litv(lit)] = 2 - lits(lit);
		this.propagateStack.push(lit);
		this.reason[lit] = from;
		return true;
	}

	var prop = this.propagateStack;
	while (prop.length > 0) {
		var p = prop.pop();
		// p has been made TRUE
		var ws = this.watches[p]; // clauses where we've set a literal to false
		var q = p ^ 1;
		if (ws === undefined)
			continue;
			// note: the watched literals are always the first two in the clause
		// reorder the clause when changing watches
		for (var i = ws.length - 1; i >= 0; i--) {
			if (Array.isArray(ws[i])) {
				var cl = ws[i];
				// if this watch was first, make it second
				if (cl[0] == q) {
					cl[0] = cl[1];
					cl[1] = q;
				}
				else {
					if (cl[1] != q)
						debugger;
				}
				if (istrue(cl[0])) {
					// first watch is true
				}
				else {
					// first watch is either false or unassigned
					// if it was true, then no need to change second watch
					var found = false;
					for (var k = 2; k < cl.length; k++) {
						// look for literal that is not false (may be true or unassigned)
						if (!isfalse(cl[k])) {
							// swap second watch (q) with this literal
							cl[1] = cl[k];
							cl[k] = q;
							// watch it, remove old watch
							if (this.watches[cl[1] ^ 1] === undefined)
								this.watches[cl[1] ^ 1] = [];
							this.watches[cl[1] ^ 1].push(cl);
							ws[i] = ws[ws.length - 1];
							ws.pop();
							found = true;
							break;
						}
					}
					if (!found) {
						// clause became unit
						if (!enqueue(cl[0], cl)) {
							// conflict
							debugger;
							return false;
						}
					}
				}
			}
			else {
				// binary clause
				if (!enqueue(ws[i], p)) {
					// conflict
					debugger;
					return false;
				}
			}
		}
	}
	return true;
};

SAT.prototype.findvar = function() {
	var score = 0.0;
	var best = -1;
	for (var i = 0; i < 10; i++) {
		var x = Math.random() * this.activity.length | 0;
		if (this.assignment[litv(x)] == 0 && this.activity[x] > score) {
			score = this.activity[x];
			best = x;
		}
	}
	if (best < 0) {
		for (var i = 0; i < this.assignment.length; i++) {
			if (this.assignment[i] == 0 && (i >= 2048 || inputUsed[i] == 1)) {
				best = i;
				break;
			}
		}
	}
	return best;
};

SAT.prototype.backtrack = function(level) {
	while (this.assignstack.length > level) {
		var p = this.assignstack.pop();
		this.assignment[litv(p)] = 0;
	}
};

SAT.prototype.solveSimple = function(callback) {
	
	function istrue(lit) {
		return this.assignment[litv(lit)] == 2 - lits(lit);
	}

	function isfalse(lit) {
		return this.assignment[litv(lit)] == 1 + lits(lit);
	}

	function check(clauses) {
		for (var i = 0; i < clauses.length; i++) {
			var cl = clauses[i];
			if (isfalse(cl[0]) &&
				isfalse(cl[1]))
				debugger;
		}
	}

	function solverec(clauses, inputUsed, callback) {
		this.BCP();
		check(clauses);

		// find variable to assign
		var v = -1;
		if (v == -1) {
			for (var i = 0; i < this.assignment.length; i++) {
				if (this.assignment[i] == 0 && (i >= 2048 || inputUsed[i] == 1)) {
					v = i;
					break;
				}
			}
		}
		if (v == -1) {
			// everything assigned, no conflicts found
			for (var i = 0; i < clauses.length; i++) {
				var cval = false;
				for (var j = 0; j < clauses[i].length; j++) {
					if (lits(clauses[i][j]) == 0)
						cval |= this.assignment[litv(clauses[i][j])] == 2;
					else
						cval |= this.assignment[litv(clauses[i][j])] == 1;
				}
				if (!cval)
					debugger;
			}
			callback(this.assignment);
			return true;
		}

		var oldassign = this.assignment;
		var assignment_c = new Uint8Array(this.assignment);
		assignment_c[v] = 1;
		this.assignment = assignment_c;
		if (solverec(assignment_c, clauses, [(v << 1) | 1], watches, inputUsed, callback))
			return true;
		assignment_c = new Uint8Array(assignment);
		assignment_c[v] = 2;
		this.assignment = assignment_c;
		if (solverec(assignment_c, clauses, [(v << 1) | 0], watches, inputUsed, callback))
			return true;
		this.assignment = oldassign;
		return false;
	}

	if (this.stat == "UNSAT") {
		debugger;
		return null;
	}

	
	this.assignment = new Uint8Array(this.highestvar + 1);
	if (!this.BCP()) {
		debugger;
		return null;
	}

	this.activity = new Float32Array((this.highestvar + 1) * 2);
	for (var i = 0; i < this.clauses.length; i++) {
		var cl = this.clauses[i];
		for (var j = 0; j < cl.length; j++) {
			this.activity[j] += 1;
		}
	}

	this.dl = 0;

	do {
		var v = this.findvar();
		this.dl++;
		var at = this.assignstack.length;
		this.propagateStack.push(v);
		if (!this.BCP()) {
			this.backtrack(at);
		}


	} while(true);

	return solverec(this.clauses, this.inputUsed, callback);
};