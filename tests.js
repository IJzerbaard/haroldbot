QUnit.test("bdd test", function(assert) {
	bdd.reset();
	var a = bdd.mk(0, 0, -1);
	var b = bdd.mk(0, -1, 0);
	assert.equal(a, ~b, "inversion OK");
	assert.equal(bdd.and(a, b), 0, "and a&~a OK");
	assert.equal(bdd.or(a, b), -1, "or a&~a OK");
	assert.equal(bdd.xor(a, b), -1, "xor a&~a OK");
});

QUnit.test("bddfunction structural test", function(assert) {
	bdd.reset();
	var a = BDDFunction.argument(0);
	var b = BDDFunction.argument(1);
	var c = BDDFunction.constant(3);
	var x = BDDFunction.shl(a, c);
	var y = BDDFunction.add(a, a);
	y = BDDFunction.add(y, y);
	y = BDDFunction.add(y, y);
	var diff = BDDFunction.hor(BDDFunction.sub(x, y));
	var xor = BDDFunction.hor(BDDFunction.xor(x, y));
	assert.equal(diff._bits[0], 0, "");
	assert.equal(xor._bits[0], 0, "");
});

QUnit.test("sat tests", function(assert) {
	var s = new SAT();
	// x2 = x0 xor x1
	// x2 = true
	s.addClause(new Int32Array([2]));
	s.addClause(new Int32Array([~0, ~1, ~2]));
	s.addClause(new Int32Array([0, 1, ~2]));
	s.addClause(new Int32Array([0, ~1, 2]));
	s.addClause(new Int32Array([~0, 1, 2]));
	var res = s.solveSimple();
	assert.ok(res[2] == 1 && (res[0] ^ res[1]) == 1, "xor test ");
	var res = null;
	s.solveSimple(function (assignment) {
		res = assignment;
	});
	assert.ok(res[2] == 1 && (res[0] ^ res[1]) == 1, "xor test ");

	s = new SAT();
	s.addClause(new Int32Array([~0, 1, 2]));
	s.addClause(new Int32Array([0, 2, 3]));
	s.addClause(new Int32Array([0, 2, ~3]));
	s.addClause(new Int32Array([0, ~2, 3]));
	s.addClause(new Int32Array([0, ~2, ~3]));
	s.addClause(new Int32Array([~1, ~2, 3]));
	s.addClause(new Int32Array([~0, 1, ~2]));
	s.addClause(new Int32Array([~0, ~1, 2]));
	var res = null;
	s.solveSimple(function (assignment) {
		res = assignment;
	});
	assert.ok(res[0] == 1 && res[1] == 1, "test ");
});

QUnit.test("Circuit SAT tests", function(assert) {
	circuit.reset();
	var x = CFunction.argument(0);
	var y = CFunction.argument(1);
	var c = CFunction.constant(3);
	var f = CFunction.eq(CFunction.or(CFunction.and(x, CFunction.constant(0xFFFF)), CFunction.and(y, CFunction.constant(0xFFFF0000))), CFunction.constant(-1));
	var res = f.sat();
	assert.ok(res != null && (res[0] | res[1]) == -1, "x | y == -1 -> x=" + res[0] + " y=" + res[1]);
	f = CFunction.not(CFunction.eq(CFunction.or(x, CFunction.constant(-1)), CFunction.constant(-1)));
	assert.equal(f.sat(), null, "x | -1 == -1");
	f = CFunction.eq(CFunction.add(x, CFunction.constant(1009)), CFunction.constant(1337));
	assert.deepEqual(f.sat(), new Int32Array([328, 0, 0, 0]), "x + 1009 == 1337 -> x = 328");
	f = CFunction.eq(CFunction.add(x, c), y);
	res = f.sat();
	assert.ok(res != null, "x + 3 == y has solutions, x=" + res[0] + " y=" + res[1]);
	f = CFunction.eq(CFunction.mul(x, c), CFunction.constant(1));
	res = f.sat();
	assert.ok(res != null && (res[0] * 3 | 0) == 1, "x * 3 == 1 has solutions, x=" + res[0]);
	f = CFunction.not(CFunction.eq(CFunction.sub(CFunction.add(x, CFunction.constant(1009)), CFunction.constant(1009)), x));
	assert.equal(f.sat(), null, "x + 1009 - 1009 == x");	
	var f1 = CFunction.not(CFunction.eq(c, c));
	assert.equal(f1.sat(), null, "c != c is false");
	var f2 = CFunction.not(CFunction.eq(CFunction.add(x, y), CFunction.add(y, x)));
	assert.equal(f2.sat(), null, "x + y == y + x");
	
	f = CFunction.eq(CFunction.mul(x, x), CFunction.constant(1));
	res = f.sat();
	assert.ok(res != null, "x * x == 1 has solutions, x=" + res[0]);
});