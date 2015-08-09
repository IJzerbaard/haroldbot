/*
	2D relational domain, based on Miné graph based abstract domains
	but instead of having every element be a constraint on a difference,
	it's a set of "allowed combinations" per bit.

	So per bit there are four possibilities,

	relation for (x,y) =
				  0 0	a
				  0 1   b
				  1 0   c
				  1 1   d

    in the element, a,b,c and d will be 32bit integers as a tuple in that
    order, indicating whether that combination is possible for that bit.
    A bit being one means a combination is not allowed.
    For example, [-1, 0, 0, -1] indicates that the variables it refers to
    must be different in every bit.
	
	The data is a 2D matrix where entry[i][j] holds a relation between
	variable i and j in that order (order matters for the b and c parts).
	The matrix is lower-triangular, in that entries i,j with j>i are not
	stored.

*/

function BRD() {
	this.a = [];
	this.b = [];
	this.c = [];
	this.d = [];
	this.rename = [];
	this.nextindex = 0;
}

BRD.prototype.rn = function(x) {
	var r = this.rename[x];
	if (r == undefined) {
		r = this.nextindex++;
		this.rename[x] = r;
	}
	return r;
};

BRD.prototype.check = function(x, y, z) {
	var max = Math.max(x, y, z);
	for (var i = this.a.length; i <= max; i++) {
		this.a.push(new Int32Array(i + 1));
		this.b.push(new Int32Array(i + 1));
		this.c.push(new Int32Array(i + 1));
		this.d.push(new Int32Array(i + 1));
		this.b[i][i] = -1;
		this.c[i][i] = -1;
	}
};

BRD.prototype.closure = function() {
	// use Floyd–Warshall, optimized for symmetry
	for (var k = 0; k < this.a.length; k++) {
		for (var i = 0; i <= k; i++) {
			for (var j = 0; j <= i; j++) {
				// j <= i <= k
				// find path from i to j via k
				//                       0 -> 0 -> 0                     0 -> 1 -> 0
				this.a[i][j] |= (this.a[k][i] | this.a[k][j]) & (this.c[k][i] | this.c[k][j]);
				//                       0 -> 0 -> 1                     0 -> 1 -> 1
				this.b[i][j] |= (this.a[k][i] | this.b[k][j]) & (this.c[k][i] | this.d[k][j]);
				//                       1 -> 1 -> 0                     1 -> 0 -> 0
				this.c[i][j] |= (this.d[k][i] | this.c[k][j]) & (this.b[k][i] | this.a[k][j]);
				//                       1 -> 1 -> 1                     1 -> 0 -> 1
				this.d[i][j] |= (this.d[k][i] | this.d[k][j]) & (this.b[k][i] | this.b[k][j]);
			}
		}
	}
};


// z = x & y
BRD.prototype.and = function(x, y, z) {
	x = this.rn(x);
	y = this.rn(y);
	z = this.rn(z);
	if (x > y) {
		var t = x; x = y; y = t;
	}
	this.check(x, y, z);
	// z cannot be one if an operand is zero
	this.c[z][x] = -1;
	this.c[z][y] = -1;
	// z cannot be zero if neither operand can be zero
	this.a[z][z] |= this.a[x][x] & this.a[y][y];
	// z cannot be one if the operands cannot be one simultaneously
	this.d[z][z] |= this.d[y][x];
};

// z = x | y
BRD.prototype.or = function(x, y, z) {
	x = this.rn(x);
	y = this.rn(y);
	z = this.rn(z);
	if (x > y) {
		var t = x; x = y; y = t;
	}
	this.check(x, y, z);
	// z cannot be zero if an operand is one
	this.b[z][x] = -1;
	this.b[z][y] = -1;
	// z cannot be one if neither operand can be one
	this.d[z][z] |= this.d[x][x] & this.d[y][y];
	// z cannot be zero if the operands cannot be zero simultaneously
	this.a[z][z] |= this.a[y][x];
};

// z = x ^ y
BRD.prototype.xor = function(x, y, z) {
	x = this.rn(x);
	y = this.rn(y);
	z = this.rn(z);
	if (x > y) {
		var t = x; x = y; y = t;
	}
	this.check(x, y, z);
	// z cannot be zero if the operands cannot be equal
	this.a[z][z] |= this.a[y][x] & this.d[y][x];
	// z cannot be one if the operands cannot differ
	this.d[z][z] |= this.b[y][x] & this.c[y][x];
	// z and x cannot be the same if y cannot be zero
	this.a[z][x] |= this.a[y][y] | this.a[x][x];
	this.d[z][x] |= this.a[y][y] | this.d[x][x];
	// z and x cannot differ if y cannot be one
	this.b[z][x] |= this.d[y][y] | this.d[x][x];
	this.c[z][x] |= this.d[y][y] | this.a[x][x];
	// x and y cannot be the same if x cannot be zero
	this.a[z][y] |= this.a[x][x] | this.a[y][y];
	this.d[z][y] |= this.a[x][x] | this.d[y][y];
	// z and y cannot differ if x cannot be one
	this.b[z][y] |= this.d[x][x] | this.d[y][y];
	this.c[z][y] |= this.d[x][x] | this.a[y][y];
};