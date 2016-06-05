function SAT() {
	this.clauses = [];
	this.highestvar = 0;
	this.propagateStack = [];
	this.ok = true;
	this.inputUsed = new Uint8Array(2048);
}

SAT.prototype.addClause = function(clause) {
	for (var i = 0; i < clause.length; i++) {
		clause[i] = ((clause[i] ^ (clause[i] >> 31)) << 1) | (clause[i] >>> 31);
		if ((clause[i] >>> 1) > this.highestvar)
			this.highestvar = clause[i] >>> 1;
		if ((clause[i] >>> 1) < 2048)
			this.inputUsed[clause[i] >>> 1] = 1
	}
	if (clause.length == 1)
		this.propagateStack.push(clause[0])
	else
		this.clauses.push(clause);
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

SAT.prototype.solveSimple1 = function(callback) {

	function litv(l) {
		return l >>> 1;
	}

	function lits(l) {
		return l & 1;
	}

	var assignment = new Uint8Array(this.highestvar + 1);
	var propagate = this.propagateStack.slice();
	while (propagate.length > 0) {
		var lit = propagate.pop();
		if (assignment[litv(lit)] == lits(lit) + 1) {
			// already assigned the opposite
			return false;
		}
		assignment[litv(lit)] = 2 - lits(lit);
	}

	if (!Int32Array.prototype.every) {
		Int32Array.prototype.every = function(cb) {
			for (var i = 0; i < this.length; i++)
				if (!cb(this[i], i, this))
					return false;
			return true;
		};
	}
	if (!Int32Array.prototype.some) {
		Int32Array.prototype.some = function(cb) {
			for (var i = 0; i < this.length; i++)
				if (cb(this[i], i, this))
					return true;
			return false;
		};
	}

	function solverec(assignment, clauses, callback) {
		// check sat/unsat
		if (clauses.every(function (cl, ii, ar) {
			return cl.some(function (v, iii, arr) {
				return assignment[litv(v)] == 2 - lits(v);
			});
		})) {
			callback(assignment);
			return true;
		}
		if (clauses.some(function (cl, ii, ar) {
			return cl.every(function (v, iii, arr) {
				return assignment[litv(v)] == lits(v) + 1;
			})
		})) {
			return false;
		}

		// pick a literal
		var lit = -1;
		for (var i = 0; i < assignment.length; i++) {
			if (assignment[i] == 0) {
				lit = i;
				break;
			}
		}
		if (lit == -1) {
			// all assigned but not SAT or unSAT
			debugger;
			alert();
		}
		lit = lit << 1;

		function put(array, index, value) {
			array[index] = value;
			return array;
		}

		if (solverec(put(assignment, litv(lit), 1), clauses, callback) ||
		    solverec(put(assignment, litv(lit), 2), clauses, callback))
		    return true;
		else {
			assignment[litv(lit)] = 0;
			return false;
		}
	}

	return solverec(assignment, this.clauses, callback);
};

SAT.prototype.solve = function(callback) {
	function litv(l) {
		return l >>> 1;
	}

	function lits(l) {
		return l & 1;
	}

	function branch(state) {
		// branch and return true
		// return false if no more unassigned variables
		return true;
	}

	function deduce(state) {
		// do bcp, return true on conflict
		return false;
	}

	function analyze_conflict(state) {
		// find conflict clause, return decision level to backtrack to
		return 0;
	}

	function backtrack(state, level) {
		// backtrack to level
	}

	var assignment = new Uint8Array(this.highestvar + 1);
	var activity = new Float32Array(assignment.length);
	var watches = new Array(assignment.length * 2);

	var state = {
		assignment: assignment,
		activity: activity,
		watches: watches,
		tail: [],
	};

	do {
		if (branch()) {

		}
		else
			return callback(assignment);
	} while (true);
};

SAT.prototype.solveSimple = function(callback) {
	function litv(l) {
		return l >>> 1;
	}

	function lits(l) {
		return l & 1;
	}

	function enqueue(lit, assignment, propagate) {
		if (assignment[litv(lit)] != 0)
			return assignment[litv(lit)] != lits(lit) + 1;
		assignment[litv(lit)] = 2 - lits(lit);
		propagate.push(lit);
		return true;
	}

	function check(assignment, clauses) {
		for (var i = 0; i < clauses.length; i++) {
			var cl = clauses[i];
			if (assignment[litv(cl[0])] == lits(cl[0]) + 1 &&
				assignment[litv(cl[1])] == lits(cl[1]) + 1)
				debugger;
		}
	}

	var watchcount = 0;

	function check2(clauses, watches) {
		var c = 0;
		var counts = new Uint8Array(clauses.length);
		for (var i = 0; i < watches.length; i++) {
			c += watches[i].length;
			for (var j = 0; j < watches[i].length; j++)
				counts[watches[i][j]]++;
		}
		if (watchcount != c)
			debugger;

		for (var i = 0; i < counts.length; i++)
			if (counts[i] != 2)
				debugger;
	}

	function solverec(assignment, clauses, propagate, watches, inputUsed, callback) {
		while (propagate.length > 0) {
			var p = propagate.pop();
			var ws = watches[p]; // clauses where we've set a literal to false

			var q = p ^ 1;

			// note: the watched literals are always the first two in the clause
			// reorder the clause when changing watches
			for (var i = ws.length - 1; i >= 0; i--) {
				var clauseindex = ws[i];
				var cl = clauses[clauseindex];
				if (cl[0] == q) {
					cl[0] = cl[1];
					cl[1] = q;
				}
				if (assignment[litv(cl[0])] == 2 - lits(cl[0])) {
					// first watch is true
				}
				else {
					// first watch is either false or unassigned
					// if it was true, then no need to change second watch
					var found = false;
					for (var k = 2; k < cl.length; k++) {
						// look for literal that is not false (may be true or unassigned)
						if (assignment[litv(cl[k])] != lits(cl[k]) + 1) {
							// swap second watch (q) with this literal
							cl[1] = cl[k];
							cl[k] = q;
							// watch it, remove old watch
							watches[cl[1] ^ 1].push(clauseindex);
							ws[i] = ws[ws.length - 1];
							ws.pop();
							found = true;
							break;
						}
					}
					if (!found) {
						// clause became unit
						if (!enqueue(cl[0], assignment, propagate)) {
							// conflict
							return false;
						}
					}
				}
				check2(clauses, watches);
			}
		}
		check(assignment, clauses);

		// find variable to assign
		var v = -1;
		if (v == -1) {
			for (var i = 0; i < assignment.length; i++) {
				if (assignment[i] == 0 && (i >= 2048 || inputUsed[i] == 1)) {
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
						cval |= assignment[litv(clauses[i][j])] == 2;
					else
						cval |= assignment[litv(clauses[i][j])] == 1;
				}
				if (!cval)
					debugger;
			}
			callback(assignment);
			return true;
		}

		var assignment_c = new Uint8Array(assignment);
		assignment_c[v] = 1;
		if (solverec(assignment_c, clauses, [(v << 1) | 1], watches, inputUsed, callback))
			return true;
		assignment_c = new Uint8Array(assignment);
		assignment_c[v] = 2;
		if (solverec(assignment_c, clauses, [v << 1], watches, inputUsed, callback))
			return true;
		return false;
	}

	var assignment = new Uint8Array(this.highestvar + 1);
	var watches = new Array(assignment.length * 2);
	for (var i = 0; i < watches.length; i++)
		watches[i] = [];
	for (var i = 0; i < this.clauses.length; i++) {
		var cl = this.clauses[i];
		watches[cl[0] ^ 1].push(i);
		watches[cl[1] ^ 1].push(i);
		watchcount += 2;
	}
	var propagate = [];
	for (var i = 0; i < this.propagateStack.length; i++) {
		if (!enqueue(this.propagateStack[i], assignment, propagate))
			return false;
	}

	//debugger;

	return solverec(assignment, this.clauses, propagate, watches, this.inputUsed, callback);
};