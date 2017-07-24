function BigInt(x) {
	if (x < 0)
		throw "BigInt must be non-negative";
	this.data = [x | 0];
}

BigInt.prototype.shl = function(n) {
	var newdata = this.data.slice(0);
	while (n >= 32) {
		n -= 32;
		newdata.unshift(0);
	}
	if (n != 0) {
		var leftover = 0;
		for (var i = 0; i < newdata.length; i++) {
			var carry = newdata[i] >>> (32 - n);
			newdata[i] = (newdata[i] << n) | leftover;
			leftover = carry;
		}
		if (leftover != 0)
			newdata.push(leftover);
	}
	var res = new BigInt(0);
	res.data = newdata;
	return res;
};

BigInt.prototype.add = function(a) {
	var newdata = [];
	var carry = 0;
	for (var i = 0; i < Math.max(this.data.length, a.data.length); i++) {
		var x = i < this.data.length ? this.data[i] : 0;
		var y = i < a.data.length ? a.data[i] : 0;
		var z = x + y + carry | 0;
		if ((z >>> 0) < (x >>> 0))
			carry = 1;
		else
			carry = 0;
		newdata[i] = z;
	}
	if (carry != 0)
		newdata.push(1);
	var res = new BigInt(0);
	res.data = newdata;
	return res;
};

BigInt.prototype.toString = function() {
	if (this.data.length == 1 && this.data[0] >= 0 && this.data[0] <= 65536) {
		return this.data[0] + "";
	}
	var parts = this.data.slice(0);
	parts.reverse();
	return "0x" + parts.map(toHexUnsignednopf).join('_');
};