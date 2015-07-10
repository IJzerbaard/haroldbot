/*
	3d relational domain
	relation for (x,y,z) =
				  0 0 0		a
				  0 0 1		b
				  0 1 0		c
				  0 1 1		d
				  1 0 0		e
				  1 0 1		f
				  1 1 0		g
				  1 1 1		h

	

*/

function BRD() {
	this.w = [];

	if (!Int32Array.of) {
		Int32Array.of = function () { return new Int32Array(arguments); };
	}
}


// z = x & y
BRD.prototype.and = function(x, y, z) {
	var v = new Int32Array(8);
	var vxy = this.get(x, x, y);
	v[0] = vxy[0];
	v[2] = vxy[1];
	v[4] = vxy[6];
	v[7] = vxy[7];
	this.set(x, y, z, v);
};

// y = x & c, c is constant
BRD.prototype.andc = function(x, c, y) {
	var v = new Int32Array(8);
	var vx = this.get(x, x, x);
	v[0] = vx[0] & ~c;
	v[6] = vx[7] & ~c;
	v[7] = vx[7] & c;
	this.set(x, x, y);
};

// z = x | y
BRD.prototype.or = function(x, y, z) {
	var v = new Int32Array(8);
	var vxy = this.get(x, x, y);
	v[0] = vxy[0];
	v[3] = vxy[1];
	v[5] = vxy[6];
	v[7] = vxy[7];
	this.set(x, y, z, v);
};

// z = x ^ y
BRD.prototype.xor = function(x, y, z) {
	var v = new Int32Array(8);
	var vxy = this.get(x, x, y);
	v[0] = vxy[0];
	v[3] = vxy[1];
	v[5] = vxy[6];
	v[6] = vxy[7];
	this.set(x, y, z, v);
};

BRD.prototype.closure = function() {

	function cmp(a, b) {
		return a - b;
	}

	function union(a, b) {
		a.sort(cmp);
		b.sort(cmp);
		var i = 0;
		var j = 0;
		var res = [];
		while (i < a.length && j < b.length) {
			if (a[i] < b[j])
				res.push(a[i++]);
			else if (a[i] > b[j])
				res.push(b[j++]);
			else {
				res.push(a[i++]);
				j++;
			}
		}
		while (i < a.length)
			res.push(a[i++]);
		while (j < b.length)
			res.push(b[j++]);
		return res;
	}

	var changed = false;
	for (var x1 = 0; x1 < this.w.length; x1++) {
		if (!this.w[x1]) continue;
		for (var y1 = x1; y1 < this.w[x1].length; y1++) {
			if (!this.w[x1][y1]) continue;
			for (var z1 = y1; z1 < this.w[x1][y1].length; z1++) {
				if (!this.w[x1][y1][z1]) continue;

			}
		}
	}
};

// get relation for (x,y,z)
BRD.prototype.get = function(x, y, z) {
	function swp(array, i, j) {
		var t = array[i];
		array[i] = array[j];
		array[j] = t;
	}
	if (x <= y && y <= z) {
		var r = null;
		if (this.w[x] && this.w[x][y] && this.w[x][y][z])
		    r = this.w[x][y][z];
		if (!r) {
			// implicit relation
			if (x == z) {
				r = Int32Array.of(-1, 0, 0, 0,
								   0, 0, 0,-1);
			} else if (y == z) {
				r = new Int32Array(8);
				var vx = this.get(x, x, x);
				var vy = this.get(y, y, y);
				r[0] = vx[0] & vy[0];
				r[3] = vx[0] & vy[7];
				r[4] = vx[7] & vy[0];
				r[7] = vx[7] & vy[7];
			} else if (x == y) {
				r = new Int32Array(8);
				var vx = this.get(x, x, x);
				var vz = this.get(z, z, z);
				r[0] = vx[0] & vz[0];
				r[1] = vx[0] & vz[7];
				r[6] = vx[7] & vz[0];
				r[7] = vx[7] & vz[7];
			} else {
				r = new Int32Array(8);
				var vx = this.get(x, x, x);
				var vy = this.get(y, y, y);
				var vz = this.get(z, z, z);
				for (var i = 0; i < 8; i++) {
					r[i] = vx[(i << 29 >> 31) & 7] &
						   vy[(i << 30 >> 31) & 7] &
						   vz[(i << 31 >> 31) & 7];
				}
			}
		} else {
			r = new Int32Array(r);
		}
		return r;
	} else if (x > y) {
		var v = this.get(y, x, z);
		swp(v, 2, 4);
		swp(v, 3, 5);
		return v;
	} else if (y > z) {
		var v = this.get(x, z, y);
		swp(v, 1, 2);
		swp(v, 5, 6);
		return v;
	}
};

BRD.prototype.set = function(x, y, z, v) {
	function is_different(a, b) {
		for (var i = 0; i < 8; i++) {
			if (a[i] != b[i])
				return true;
		}
		return false;
	}
	function swp(array, i, j) {
		var t = array[i];
		array[i] = array[j];
		array[j] = t;
	}

	do {
		if (x <= y && y <= z) {
			// only add unknown information
			var vxyz = this.get(x, y, z);
			for (var i = 0; i < 8; i++)
				v[i] &= vxyz[i];
			if (is_different(v, vxyz)) {
				if (!this.w[x])
					this.w[x] = [];
				if (!this.w[x][y])
					this.w[x][y] = [];
				this.w[x][y][z] = v;
				return true;
			}
			return false;
		} else if (x > y) {
			swp(v, 2, 4);
			swp(v, 3, 5);
			var t = x;
			x = y;
			y = t;
		} else if (y > z) {
			swp(v, 1, 2);
			swp(v, 5, 6);
			var t = z;
			z = y;
			y = t;
		}
	} while (true);
};