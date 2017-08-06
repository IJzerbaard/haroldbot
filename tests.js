QUnit.test("bdd test", function(assert) {
	bdd.reset();
	var a = bdd.mk(0, 0, -1);
	var b = bdd.mk(0, -1, 0);
	assert.equal(a, ~b, "inversion OK");
	assert.equal(bdd.and(a, b), 0, "and a&~a OK");
	assert.equal(bdd.or(a, b), -1, "or a&~a OK");
	assert.equal(bdd.xor(a, b), -1, "xor a&~a OK");
});

QUnit.test("bddfunction tests", function(assert) {
	bdd.reset();
	var x = BDDFunction.argument(0);
	var y = BDDFunction.argument(1);

	f = BDDFunction.add(x, y);
	g = BDDFunction.add2(x, y);
	h = BDDFunction.xor(f, g);
	assert.deepEqual(f._bits, g._bits, "add == add2");

	var h = BDDFunction.to_constant(BDDFunction.divu(BDDFunction.constant(0xff704000), BDDFunction.constant(3)));
	assert.equal(h, 0x55256aaa, "divu test");
	h = BDDFunction.to_constant(BDDFunction.shruc(BDDFunction.hmul(BDDFunction.constant(0xff704000), BDDFunction.constant(0xAAAAAAAAB), false), 1));
	assert.equal(h, 0x55256aaa, "hmul test");

	var f = BDDFunction.divu(x, BDDFunction.constant(3));
	var g = BDDFunction.shruc(BDDFunction.hmul(x, BDDFunction.constant(0xAAAAAAAAB), false), 1);
	h = BDDFunction.xor(f, g);
	assert.equal(f._bits[0], g._bits[0], "x / 3 == hmul(x, 0xAAAAAAAAB) >> 1");

	f = BDDFunction.add(g, y);
	g = BDDFunction.add2(g, y);
	h = BDDFunction.xor(f, g);
	assert.deepEqual(f._bits, g._bits, "add == add2");
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

QUnit.test("Circuit SAT tests", function(assert) {
	circuit.reset();
	var x = CFunction.argument(0);
	var y = CFunction.argument(1);
	var c = CFunction.constant(3);
	var f = CFunction.eq(CFunction.or(CFunction.and(x, CFunction.constant(0xFFFF)), CFunction.and(y, CFunction.constant(0xFFFF0000))), CFunction.constant(-1));
	var g;
	var res = f.sat();
	assert.ok(res != null && (res[0] | res[1]) == -1, "x | y == -1 -> x=" + res[0] + " y=" + res[1]);
	f = CFunction.not(CFunction.eq(CFunction.or(x, CFunction.constant(-1)), CFunction.constant(-1)));
	assert.equal(f.sat(), null, "x | -1 == -1");
	f = CFunction.eq(CFunction.add(x, CFunction.constant(1009)), CFunction.constant(1337));
	assert.deepEqual(f.sat(), new Int32Array([328, 0, 0, 0]), "x + 1009 == 1337 -> x = 328");
	f = CFunction.eq(CFunction.add(x, c), y);
	res = f.sat();
	assert.ok(res != null, "x + 3 == y has solutions, x=" + (res ? res : ["null"])[0] + " y=" + (res ? res : ["null"])[1]);
	f = CFunction.eq(CFunction.mul(x, c), CFunction.constant(1));
	res = f.sat();
	assert.ok(res != null && Math.imul(res[0], 3) == 1, "x * 3 == 1 has solutions, x=" + (res ? res : ["null"])[0]);
	f = CFunction.not(CFunction.eq(CFunction.sub(CFunction.add(x, CFunction.constant(1009)), CFunction.constant(1009)), x));
	assert.equal(f.sat(), null, "x + 1009 - 1009 == x");	
	var f1 = CFunction.not(CFunction.eq(c, c));
	assert.equal(f1.sat(), null, "c != c is false");
	var f2 = CFunction.not(CFunction.eq(CFunction.add(x, y), CFunction.add(y, x)));
	assert.equal(f2.sat(), null, "x + y == y + x");
	
	f = CFunction.eq(CFunction.mul(x, x), CFunction.constant(1));
	res = f.sat();
	assert.ok(res != null && Math.imul(res[0], res[0]) == 1, "x * x == 1 has solutions, x=" + res[0]);

	f = CFunction.not(CFunction.eq(CFunction.add(x, y), CFunction.add2(x, y)));
	var bits = new Int32Array(32);
	bits[0] = circuit.xor(CFunction.add(x, y)._bits[1], CFunction.add2(x, y)._bits[1]);
	f = new CFunction(bits, 0);
	res = f.sat();
	assert.equal(res, null, "add == add2");

	var bits = new Int32Array(32);
	bits[0] = circuit.xor(circuit.carry(x._bits[0], x._bits[1], x._bits[2]),
		circuit.or(circuit.or(circuit.and(x._bits[0], x._bits[1]),
			                  circuit.and(x._bits[0], x._bits[2])),
		                      circuit.and(x._bits[1], x._bits[2])));
	f = new CFunction(bits, 0);
	res = f.sat();
	assert.equal(res, null, "carry == a&b | a&c | b&c");

	bits[0] = circuit.xor(circuit.mux(x._bits[0], x._bits[1], x._bits[2]),
		circuit.or(circuit.and(x._bits[0], ~x._bits[2]),
			       circuit.and(x._bits[1], x._bits[2])));
	f = new CFunction(bits, 0);
	res = f.sat();
	assert.equal(res, null, "mux == a&~s | b&s");

	bits[0] = circuit.xor(circuit.xor(x._bits[0], x._bits[1]),
		circuit.mux(x._bits[0], ~x._bits[0], x._bits[1]));
	f = new CFunction(bits, 0);
	res = f.sat();
	assert.equal(res, null, "x^y == y?~x:x");

	
	//f = CFunction.not(CFunction.eq(CFunction.shruc(CFunction.hmul(x, CFunction.constant(0xAAAAAAAAB), false), 1), CFunction.divu(x, CFunction.constant(3))));
	//res = f.sat();
	//assert.equal(res, null, "hmul(x, 0xAAAAAAAAB) >> 1 == x / 3");


	//f = CFunction.not(CFunction.eq(CFunction.popcnt2(x), CFunction.popcnt3(x)));
	//res = f.sat();
	//assert.ok(res == null, "popcnt =? popcnt3, " + (res || ["yes"])[0]);
});