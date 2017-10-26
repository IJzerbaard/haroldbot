function SSECFunction(bits) {
    this._bits = new Int32Array(bits);
}

SSECFunction.argument = function(argindex) {
    var bits = circuit.argument256(argindex);
    return new SSECFunction(bits);
};

SSECFunction.eq = function(x, y) {
    var bits = new Int32Array(256);
    for (var i = 0; i < 256; i++) {
        bits[i] = circuit.xor(x._bits[i], y._bits[i]);
    }
    var r = new SSECFunction(0);
    r.bool = ~circuit.or_big(bits);
    return r;
};

SSECFunction._mm256_set1_epi32 = function(value) {
    var bits = new Int32Array(256);
    for (var i = 0; i < 32; i++) {
        var bit = (value << (i ^ 31)) >> 31;
        for (var j = i; j < 256; j += 32)
            bits[j] = bit;
    }
    return new SSECFunction(bits);
};

SSECFunction._mm_set1_epi32 = function(value) {
    var bits = new Int32Array(256);
    for (var i = 0; i < 32; i++) {
        var bit = (value << (i ^ 31)) >> 31;
        for (var j = i; j < 128; j += 32)
            bits[j] = bit;
    }
    return new SSECFunction(bits);
};

SSECFunction._mm_set_epi32 = function(v3, v2, v1, v0) {
    var bits = new Int32Array(256);
    var v = [v0, v1, v2, v3];
    for (var j = 0; j < v.length; j++) {
        for (var i = 0; i < 32; i++) {
            var bit = (v[j] << (i ^ 31)) >> 31;
            bits[i + 32 * j] = bit;
        }
    }
    return new SSECFunction(bits);
};

SSECFunction._mm_setr_epi32 = function(v3, v2, v1, v0) {
    return SSECFunction._mm_set_epi32(v0, v1, v2, v3);
};

SSECFunction._mm256_set_epi32 = function(v7, v6, v5, v4, v3, v2, v1, v0) {
    var bits = new Int32Array(256);
    var v = [v0, v1, v2, v3, v4, v5, v6, v7];
    for (var j = 0; j < v.length; j++) {
        for (var i = 0; i < 32; i++) {
            var bit = (v[j] << (i ^ 31)) >> 31;
            bits[i + 32 * j] = bit;
        }
    }
    return new SSECFunction(bits);
};

SSECFunction._mm256_setr_epi32 = function(v7, v6, v5, v4, v3, v2, v1, v0) {
    return SSECFunction._mm256_set_epi32(v0, v1, v2, v3, v4, v5, v6, v7);
};

SSECFunction._mm256_set1_epi8 = function(value) {
    var bits = new Int32Array(256);
    for (var i = 0; i < 8; i++) {
        var bit = (value << (i ^ 31)) >> 31;
        for (var j = i; j < 256; j += 8)
            bits[j] = bit;
    }
    return new SSECFunction(bits);
};

SSECFunction._mm_set1_epi8 = function(value) {
    var bits = new Int32Array(256);
    for (var i = 0; i < 8; i++) {
        var bit = (value << (i ^ 31)) >> 31;
        for (var j = i; j < 128; j += 8)
            bits[j] = bit;
    }
    return new SSECFunction(bits);
};

SSECFunction._mm256_set1_epi16 = function(value) {
    var bits = new Int32Array(256);
    for (var i = 0; i < 16; i++) {
        var bit = (value << (i ^ 31)) >> 31;
        for (var j = i; j < 256; j += 8)
            bits[j] = bit;
    }
    return new SSECFunction(bits);
};

SSECFunction._mm_set1_epi16 = function(value) {
    var bits = new Int32Array(256);
    for (var i = 0; i < 8; i++) {
        var bit = (value << (i ^ 31)) >> 31;
        for (var j = i; j < 128; j += 16)
            bits[j] = bit;
    }
    return new SSECFunction(bits);
};

SSECFunction._mm_set_epi16 = function(v7, v6, v5, v4, v3, v2, v1, v0) {
    var bits = new Int32Array(256);
    var v = [v0, v1, v2, v3, v4, v5, v6, v7];
    for (var j = 0; j < v.length; j++) {
        for (var i = 0; i < 16; i++) {
            var bit = (v[j] << (i ^ 31)) >> 31;
            bits[i + 16 * j] = bit;
        }
    }
    return new SSECFunction(bits);
};

SSECFunction._mm_setr_epi16 = function(v7, v6, v5, v4, v3, v2, v1, v0) {
    return SSECFunction._mm_set_epi16(v0, v1, v2, v3, v4, v5, v6, v7);
};

SSECFunction._mm256_set_epi16 = function(v15, v14, v13, v12, v11, v10, v9, v8, v7, v6, v5, v4, v3, v2, v1, v0) {
    var bits = new Int32Array(256);
    var v = [v0, v1, v2, v3, v4, v5, v6, v7, v8, v9, v10, v11, v12, v13, v14, v15];
    for (var j = 0; j < v.length; j++) {
        for (var i = 0; i < 16; i++) {
            var bit = (v[j] << (i ^ 31)) >> 31;
            bits[i + 16 * j] = bit;
        }
    }
    return new SSECFunction(bits);
};

SSECFunction._mm256_setr_epi16 = function(v15, v14, v13, v12, v11, v10, v9, v8, v7, v6, v5, v4, v3, v2, v1, v0) {
    return SSECFunction._mm256_set_epi16(v0, v1, v2, v3, v4, v5, v6, v7, v8, v9, v10, v11, v12, v13, v14, v15);
};

SSECFunction.not = function(x, l) {
    var bits = new Int32Array(256);
    for (var i = 0; i < l; i++) {
        bits[i] = ~x._bits[i];
    }
    return new SSECFunction(bits);
};

SSECFunction._mm_and_si128 = function(x, y) {
    var bits = new Int32Array(256);
    for (var i = 0; i < 128; i++) {
        bits[i] = circuit.and(x._bits[i], y._bits[i]);
    }
    return new SSECFunction(bits);
};

SSECFunction._mm_andnot_si128 = function(x, y) {
    var bits = new Int32Array(256);
    for (var i = 0; i < 128; i++) {
        bits[i] = circuit.and(~x._bits[i], y._bits[i]);
    }
    return new SSECFunction(bits);
};

SSECFunction._mm_or_si128 = function(x, y) {
    var bits = new Int32Array(256);
    for (var i = 0; i < 128; i++) {
        bits[i] = circuit.or(x._bits[i], y._bits[i]);
    }
    return new SSECFunction(bits);
};

SSECFunction._mm_xor_si128 = function(x, y) {
    var bits = new Int32Array(256);
    for (var i = 0; i < 128; i++) {
        bits[i] = circuit.xor(x._bits[i], y._bits[i]);
    }
    return new SSECFunction(bits);
};

(function() {

function bvadd (x, y) {
    var bits = new Int32Array(x.length);
    var carry = 0, i = 0;
    for (i = 0; i < x.length - 1; i++) {
        bits[i] = circuit.xor(carry, circuit.xor(x[i], y[i]));
        carry = circuit.carry(carry, x[i], y[i]);
    }
    bits[i] = circuit.xor(carry, circuit.xor(x[i], y[i]));
    return bits;
}

function bvaddus (x, y) {
    var bits = new Int32Array(x.length);
    var carry = 0, i = 0;
    for (i = 0; i < x.length - 1; i++) {
        bits[i] = circuit.xor(carry, circuit.xor(x[i], y[i]));
        carry = circuit.carry(carry, x[i], y[i]);
    }
    bits[i] = circuit.or(carry, circuit.or(x[i], y[i]));
    carry = circuit.carry(carry, x[i], y[i]);
    for (var i = 0; i < bits.length - 1; i++)
        bits[i] = circuit.or(bits[i], carry);
    return bits;
}

function bvaddss (x, y) {
    var bits = new Int32Array(x.length);
    var carry = 0, c = 0;
    for (var i = 0; i < x.length; i++) {
        bits[i] = circuit.xor(carry, circuit.xor(x[i], y[i]));
        c = carry;
        carry = circuit.carry(carry, x[i], y[i]);
    }
    var ovf = circuit.xor(c, carry);
    var j = x.length - 1;
    var sat = ~x[j];
    for (var i = 0; i < bits.length - 1; i++)
        bits[i] = circuit.mux(bits[i], sat, ovf);
    bits[j] = circuit.mux(bits[j], ~sat, ovf);
    return bits;
}

function nthBit(x, n, sw, l) {
    var bits = new Int32Array(256);
    for (var i = 0; i < l; i++) {
        bits[i] = x._bits[n + (i / sw | 0) * sw];
    }
    return new SSECFunction(bits);
}

function add(x, y, sw, l) {
    var bits = new Int32Array(256);
    for (var i = 0; i < l; i += sw)
        bits.set(bvadd(x._bits.subarray(i, i + sw), y._bits.subarray(i, i + sw)), i);
    return new SSECFunction(bits);
}

function addus(x, y, sw, l) {
    var bits = new Int32Array(256);
    for (var i = 0; i < l; i += sw)
        bits.set(bvaddus(x._bits.subarray(i, i + sw), y._bits.subarray(i, i + sw)), i);
    return new SSECFunction(bits);
}

function addss(x, y, sw, l) {
    var bits = new Int32Array(256);
    for (var i = 0; i < l; i += sw)
        bits.set(bvaddss(x._bits.subarray(i, i + sw), y._bits.subarray(i, i + sw)), i);
    return new SSECFunction(bits);
}

function cmpeq(x, y, sw, l) {
    var bits = new Int32Array(256);
    for (var i = 0; i < l; i += sw) {
        var t = new Int32Array(sw);
        for (var j = 0; j < sw; j++)
            t[j] = circuit.xor(x._bits[i + j], y._bits[i + j]);
        var eq = ~circuit.or_big(t);
        bits.fill(eq, i, i + sw);
    }
    return new SSECFunction(bits);
}

function cmpgts(x, y, sw, l) {
    var bits = new Int32Array(256);
    var carry = 0;
    for (var i = 0; i < l; i++) {
        var j = i + 1;
        if (j % sw == 0) {
            carry = circuit.carry(carry, ~x._bits[i], y._bits[i]);
            bits.fill(carry, j - sw, j);
            carry = 0;
        }
        else
            carry = circuit.carry(carry, x._bits[i], ~y._bits[i]);
    }
    return new SSECFunction(bits);
}

function avg(x, y, sw, l) {
    var bits = new Int32Array(256);
    var carry = -1;
    for (var i = 0; i < l; i++) {
        if ((i % sw) != 0)
            bits[i - 1] = circuit.xor(carry, circuit.xor(x._bits[i], y._bits[i]));
        carry = circuit.carry(carry, x._bits[i], y._bits[i]);
        if ((i + 1) % sw == 0) {
            bits[i] = carry;
            carry = -1;
        }
    }
    return new SSECFunction(bits);
}

function maxu (x, y, sw, l) {
    var bits = new Int32Array(256);
    var carry = 0;
    for (var i = 0; i < l; i++) {
        carry = circuit.carry(carry, ~x._bits[i], y._bits[i]);
        var j = i + 1;
        if (j % sw == 0) {
            for (var k = j - sw; k < j; k++)
                bits[k] = circuit.mux(x._bits[k], y._bits[k], carry);
            carry = 0;
        }
    }
    return new SSECFunction(bits);
}


// create variants
function invsign(x, sw, l) {
    var bits = new Int32Array(x._bits);
    for (var i = sw - 1; i < l; i += sw)
        bits[i] = ~bits[i];
    bits.fill(0, l);
    return new SSECFunction(bits);
}
function inv(x, l) {
    var bits = new Int32Array(256);
    for (var i = 0; i < l; i++)
        bits[i] = ~x._bits[i];
    bits.fill(0, l);
    return new SSECFunction(bits);
}
var _sw = [8, 16, 32, 64];
var _l = [128, 256];
_l.forEach(function(l) {
    _sw.forEach(function(sw) {
        var len = l == 256 ? l : "";
        var _add = "_mm" + len + "_add_epi" + sw;
        var _sub = "_mm" + len + "_sub_epi" + sw;
        var _cmpeq = "_mm" + len + "_cmpeq_epi" + sw;
        var _cmpgt = "_mm" + len + "_cmpgt_epi" + sw;
        var _cmplt = "_mm" + len + "_cmplt_epi" + sw;
        SSECFunction[_add] = function (x, y) {
            return add(x, y, sw, l);
        };
        SSECFunction[_sub] = function (x, y) {
            return inv(add(inv(x, l), y, sw, l), l);
        };
        SSECFunction[_cmpeq] = function (x, y) {
            return cmpeq(x, y, sw, l);
        };
        SSECFunction[_cmpgt] = function (x, y) {
            return cmpgts(x, y, sw, l);
        };
        SSECFunction[_cmplt] = function (x, y) {
            return cmpgts(y, x, sw, l);
        };
        if (sw != 64) {
            var _abs = "_mm" + len + "_abs_epi" + sw;
            var _addus = "_mm" + len + "_adds_epu" + sw;
            var _subus = "_mm" + len + "_subs_epu" + sw;
            var _addss = "_mm" + len + "_adds_epi" + sw;
            var _subss = "_mm" + len + "_subs_epi" + sw;
            var _maxu = "_mm" + len + "_max_epu" + sw;
            var _minu = "_mm" + len + "_min_epu" + sw;
            var _maxs = "_mm" + len + "_max_epi" + sw;
            var _mins = "_mm" + len + "_min_epi" + sw;
            SSECFunction[_addus] = function (x, y) {
                return addus(x, y, sw, l);
            };
            SSECFunction[_subus] = function (x, y) {
                return inv(addus(inv(x, l), y, sw, l), l);
            };
            SSECFunction[_abs] = function (x) {
                var msk = nthBit(x, sw - 1, sw, l);
                return SSECFunction._mm256_xor_si256(add(x, msk, sw, l), msk);
            };
            SSECFunction[_addss] = function (x, y) {
                return addss(x, y, sw, l);
            };
            SSECFunction[_subss] = function (x, y) {
                return inv(addss(inv(x, l), y, sw, l), l);
            };
            SSECFunction[_maxu] = function (x, y) {
                return maxu(x, y, sw, l);
            };
            SSECFunction[_minu] = function (x, y) {
                return inv(maxu(inv(x, l), inv(y, l), sw, l), l);
            };
            SSECFunction[_maxs] = function (x, y) {
                return invsign(maxu(invsign(x, sw, l), invsign(y, sw, l), sw, l), sw, l);
            };
            SSECFunction[_mins] = function (x, y) {
                return inv(invsign(maxu(inv(invsign(x, sw, l), l), inv(invsign(y, sw, l), l), sw, l), sw, l), l);
            };
        }
        if (sw <= 16) {
            var _avg = "_mm" + len + "_avg_epu" + sw;
            SSECFunction[_avg] = function (x, y) {
                return avg(x, y, sw, l);
            };
        }
    });
});


SSECFunction._mm_slli_si128 = function (a, imm8) {
    var r = new Int32Array(256);
    imm8 = Math.min(16, imm8);
    r.set(a.subarray(0, 128 - imm8 * 8), imm8 * 8);
};

SSECFunction._mm_bslli_si128 = SSECFunction._mm_slli_si128;

SSECFunction._mm_srli_si128 = function (a, imm8) {
    var r = new Int32Array(256);
    imm8 = Math.min(16, imm8);
    r.set(a.subarray(imm8 * 8), 0);
};

SSECFunction._mm_bsrli_si128 = SSECFunction._mm_srli_si128;

SSECFunction._mm_shuffle_epi32 = function (x, shuf) {
    var bits = new Int32Array(256);
    for (var i = 0; i < 4; i++) {
        var start = ((shuf >> (2 * i)) & 3) * 32;
        bits.set(x.subarray(start, start + 32), i * 32);
    }
    return new SSECFunction(bits);
};

SSECFunction._mm_shuffle_epi8 = function (x, shuf) {
    function mux(f, t, sel) {
        var r = new Int32Array(t);
        for (var i = 0; i < r.length; i++)
            r[i] = circuit.or(circuit.and(sel, t[i]), circuit.and(~sel, f[i]));
        return r;
    }
    var bits = new Int32Array(256);
    var spl = [];
    for (var i = 0; i < 16; i++)
        spl.push(x._bits.subarray(i * 8, i * 8 + 8));
    for (var i = 0; i < 16; i++) {
        var idx = shuf._bits.subarray(i * 8, i * 8 + 8);
        var q = spl;
        for (var b = 0; b < 4; b++) {
            var p = [];
            for (var j = 0; j < q.length; j += 2) {
                var a = q[j];
                var b = q[j + 1];
                p.push(mux(a, b, idx[b]));
            }
            q = p;
        }
        var r = mux(q[0], new Int32Array(8), idx[7]);
        bits.set(r, i * 8);
    }
    return new SSECFunction(bits);
};

SSECFunction._mm_alignr_epi8 = function (x, y, imm8) {
    var t = new Int32Array(256);
    t.set(y._bits.subarray(0, 128));
    t.set(x._bits.subarray(0, 128), 128);
    var bits = new Int32Array(256);
    bits.set(t.subarray(imm8 * 8, imm8 * 8 + 128));
    return new SSECFunction(bits);
};

SSECFunction._mm_sad_epu8 = function (x, y) {
    function add(acc, v) {
        var r = new Int32Array(acc.length);
        var carry = 0;
        for (var i = 0; i < r.length; i++) {
            var vv = i < v.length ? v[i] : 0;
            r[i] = circuit.xor(carry, circuit.xor(vv, acc[i]));
            carry = circuit.carry(carry, vv, acc[i]);
        }
        return r;
    }

    function absdiffu(x, y, sw, l) {
        var temp = new Int32Array(256);
        var temp2 = new Int32Array(256);
        var cout = new Int32Array(l / sw);
        var carry = 0, carry2 = 0;
        for (var i = 0; i < l; i++) {
            var xy = circuit.xor(x._bits[i], y._bits[i]);
            temp[i] = ~circuit.xor(carry, xy);
            temp2[i] = ~circuit.xor(carry2, xy);
            carry = circuit.carry(carry, ~x._bits[i], y._bits[i]);
            carry2 = circuit.carry(carry2, x._bits[i], ~y._bits[i]);
            if ((i + 1) % sw == 0) {
                cout[i / sw | 0] = carry;
                carry = 0;
                carry2 = 0;
            }
        }
        var bits = new Int32Array(256);
        for (var i = 0; i < cout.length; i++) {
            for (var j = 0; j < sw; j++) {
                var idx = i * sw + j;
                bits[idx] = circuit.mux(~temp[idx], ~temp2[idx], cout[i]);
            }
        }
        return new SSECFunction(bits);
    };

    var res = new Int32Array(256);
    var absd = absdiffu(x, y, 8, 128);
    for (var half = 0; half < 2; half++) {
        var sum = new Int32Array(11);
        for (var i = 0; i < 8; i++) {
            var idx = i * 8 + half * 64;
            sum = add(sum, absd._bits.subarray(idx, idx + 8));
        }
        res.set(sum, 64 * half);
    }
    return res;
};

SSECFunction._mm_hadd_epi16 = function (x, y) {
    var bits = new Int32Array(256);
    for (var i = 0; i < 128; i += 32) {
        bits.set(bvadd(x._bits.subarray(i, i + 16), x._bits.subarray(i + 16, i + 32)), i / 2);
        bits.set(bvadd(y._bits.subarray(i, i + 16), y._bits.subarray(i + 16, i + 32)), i / 2 + 64);
    }
    return new SSECFunction(bits);
};

SSECFunction._mm_hsub_epi16 = function (x, y) {
    return SSECFunction.not(SSECFunction._mm_hadd_epi16(SSECFunction.not(x, 128), y), 128);
};

SSECFunction._mm_hadd_epi32 = function (x, y) {
    var bits = new Int32Array(256);
    for (var i = 0; i < 128; i += 64) {
        bits.set(bvadd(x._bits.subarray(i, i + 32), x._bits.subarray(i + 32, i + 64)), i / 2);
        bits.set(bvadd(y._bits.subarray(i, i + 32), y._bits.subarray(i + 32, i + 64)), i / 2 + 64);
    }
    return new SSECFunction(bits);
};

SSECFunction._mm_hsub_epi32 = function (x, y) {
    return SSECFunction.not(SSECFunction._mm_hadd_epi32(SSECFunction.not(x, 128), y), 128);
};

SSECFunction._mm_hadds_epi16 = function (x, y) {
    var bits = new Int32Array(256);
    for (var i = 0; i < 128; i += 32) {
        bits.set(bvaddss(x._bits.subarray(i, i + 16), x._bits.subarray(i + 16, i + 32)), i / 2);
        bits.set(bvaddss(y._bits.subarray(i, i + 16), y._bits.subarray(i + 16, i + 32)), i / 2 + 64);
    }
    return new SSECFunction(bits);
};

SSECFunction._mm_hsubs_epi16 = function (x, y) {
    return SSECFunction.not(SSECFunction._mm_hadds_epi16(SSECFunction.not(x, 128), y), 128);
};

SSECFunction._mm_blendv_epi8 = function (x, y, mask) {
    var bits = new Int32Array(256);
    for (var i = 0; i < 128; i++)
        bits[i] = circuit.mux(x._bits[i], y._bits[i], mask._bits[i | 7]);
    return new SSECFunction(bits);
};

SSECFunction._mm_blend_epi16 = function (x, y, mask) {
    var bits = new Int32Array(256);
    for (var i = 0; i < 128; i += 16) {
        if ((mask & (1 << i)) == 0)
            bits.set(x._bits.subarray(i, i + 16), i);
        else
            bits.set(y._bits.subarray(i, i + 16), i);
    }
    return new SSECFunction(bits);
};

function unsignedSaturate(x, len) {
    var bits = new Int32Array(len);
    var ovf = circuit.or_big(x.subarray(len));
    for (var i = 0; i < len; i++)
        bits[i] = circuit.or(x[i], ovf);
    return bits;
}

SSECFunction._mm_packus_epi16 = function (a, b) {
    var bits = new Int32Array(128);
    for (var i = 0; i < 128; i += 16) {
        bits.set(unsignedSaturate(a._bits.subarray(i, i + 16), 8), i >> 1);
        bits.set(unsignedSaturate(b._bits.subarray(i, i + 16), 8), (i >> 1) + 64);
    }
    return new SSECFunction(bits);
};

function signedSaturate(x, len) {
    function inv(x) {
        return ~x;
    }
    var bits = new Int32Array(len);
    var h = circuit.and(circuit.or_big(x.subarray(len, -1)), ~x.subarray(-1)[0]);
    var l = circuit.and(circuit.or_big(x.subarray(len, -1).map(inv)), x.subarray(-1)[0]);
    var len1 = len - 1;
    for (var i = 0; i < len1; i++)
        bits[i] = circuit.and(circuit.or(x[i], h), ~l);
    bits[len1] = circuit.or(circuit.and(x[len1], ~h), l);
    return bits;
}

SSECFunction._mm_packs_epi16 = function (a, b) {
    var bits = new Int32Array(128);
    for (var i = 0; i < 128; i += 16) {
        bits.set(signedSaturate(a._bits.subarray(i, i + 16), 8), i >> 1);
        bits.set(signedSaturate(b._bits.subarray(i, i + 16), 8), (i >> 1) + 64);
    }
    return new SSECFunction(bits);
};


function mullo (x, y) {
    var r = new Int32Array(x.length);
    var shifted = y.slice(0);
    for (var i = 0; i < x.length; i++) {
        var masked = new Int32Array(shifted.length);
        for (var j = 0; j < masked.length; j++)
            masked[j] = circuit.and(shifted[j], x[i]);
        var carry = 0;
        for (var j = 0; j < r.length; j++) {
            var oldr = r[j];
            r[j] = circuit.xor(carry, circuit.xor(r[j], masked[j]));
            carry = circuit.carry(carry, oldr, masked[j]);
        }
        shifted.copyWithin(1, 0);
        shifted[0] = 0;
    }
    return r;
}

function mulfulls (x, y) {
    var j = x.length - 1;
    var xx = new Int32Array(x.length * 2);
    xx.set(x);
    xx.fill(x[j], j);
    var yy = new Int32Array(y.length * 2);
    yy.set(y);
    yy.fill(y[j], j);
    return mullo(xx, yy);
}

function mulfullu (x, y) {
    var xx = new Int32Array(x.length * 2);
    xx.set(x);
    var yy = new Int32Array(y.length * 2);
    yy.set(y);
    return mullo(xx, yy);
}

function mulhiu (x, y) {
    return mulfullu(x, y).subarray(x.length);
}

function mulhis (x, y) {
    return mulfulls(x, y).subarray(x.length);
}

function mapsw (f, sw, l) {
    var res = function (x, y) {
        var bits = new Int32Array(256);
        for (var i = 0; i < l; i += sw)
            bits.set(f(x._bits.subarray(i, i + sw), y._bits.subarray(i, i + sw)), i);
        return new SSECFunction(bits);
    };
    return res;
}

// mullo
[128, 256].forEach(function (l) {
    [16, 32].forEach( function (sw) {
        var name = "_mm" + (l == 256 ? l : "") + "_mullo_epi" + sw;
        SSECFunction[name] = function (x, y) {
            var bits = new Int32Array(256);
            for (var i = 0; i < l; i += sw)
                bits.set(mullo(x._bits.subarray(i, i + sw), y._bits.subarray(i, i + sw)), i);
            return new SSECFunction(bits);
        };
    });
});

SSECFunction._mm_mul_epu32 = function (x, y) {
    var bits = new Int32Array(256);
    for (var i = 0; i < 128; i += 64)
        bits.set(mulfullu(x._bits.subarray(i, i + 32), y._bits.subarray(i, i + 32)), i);
    return new SSECFunction(bits);
};

SSECFunction._mm256_mul_epu32 = function (x, y) {
    var bits = new Int32Array(256);
    for (var i = 0; i < 256; i += 64)
        bits.set(mulfullu(x._bits.subarray(i, i + 32), y._bits.subarray(i, i + 32)), i);
    return new SSECFunction(bits);
};

SSECFunction._mm_mul_epi32 = function (x, y) {
    var bits = new Int32Array(256);
    for (var i = 0; i < 128; i += 64)
        bits.set(mulfulls(x._bits.subarray(i, i + 32), y._bits.subarray(i, i + 32)), i);
    return new SSECFunction(bits);
};

SSECFunction._mm256_mul_epi32 = function (x, y) {
    var bits = new Int32Array(256);
    for (var i = 0; i < 256; i += 64)
        bits.set(mulfulls(x._bits.subarray(i, i + 32), y._bits.subarray(i, i + 32)), i);
    return new SSECFunction(bits);
};

SSECFunction._mm_mulhi_epi16 = mapsw(mulhis, 16, 128);
SSECFunction._mm256_mulhi_epi16 = mapsw(mulhis, 16, 256);
SSECFunction._mm_mulhi_epu16 = mapsw(mulhiu, 16, 128);
SSECFunction._mm256_mulhi_epu16 = mapsw(mulhiu, 16, 256);

function mulhrs (x, y) {
    var full = mulfulls(x, y);
    var temp = new Int32Array(32);
    var carry = -1;
    for (var i = 14; i < temp.length; i++) {
        temp[i] = circuit.xor(carry, full[i]);
        carry = circuit.and(carry, full[i]);
    }
    return temp.subarray(15, 31);
}

SSECFunction._mm_mulhrs_epi16 = mapsw(mulhrs, 16, 128);
SSECFunction._mm256_mulhrs_epi16 = mapsw(mulhrs, 16, 256);

SSECFunction._mm_madd_epi16 = function (x, y) {
    var bits = new Int32Array(256);
    for (var i = 0; i < 128; i += 32) {
        var p1 = mulfulls(x._bits.subarray(i, i + 16),
                          y._bits.subarray(i, i + 16));
        var p2 = mulfulls(x._bits.subarray(i + 16, i + 32),
                          y._bits.subarray(i + 16, i + 32));
        var sum = bvadd(p1, p2);
        bits.set(sum, i);
    }
    return new SSECFunction(bits);
};

SSECFunction._mm_maddubs_epi16 = function (x, y) {
    var bits = new Int32Array(256);
    var u = new Int32Array(16);
    var s = new Int32Array(16);
    for (var i = 0; i < 128; i += 16) {
        // first arg is z-ext, second is s-ext
        u.set(x._bits.subarray(i, i + 8));
        s.set(y._bits.subarray(i, i + 8));
        s.fill(s[7], 8);
        var p1 = mullo(u, s);
        u.set(x._bits.subarray(i + 8, i + 16));
        s.set(y._bits.subarray(i + 8, i + 16));
        s.fill(s[7], 8);
        var p2 = mullo(u, s);
        bits.set(bvaddss(p1, p2), i);
    }
    return new SSECFunction(bits);
};

function sgn(x, y) {
    var bits = new Int32Array(x.length);
    var notzero = circuit.or_big(y);
    var negate = y[y.length - 1];

    var carry = negate;
    for (var i = 0; i < bits.length; i++) {
        bits[i] = circuit.xor(carry, ~x[i]);
        carry = circuit.and(carry, ~x[i]);
    }

    for (var i = 0; i < bits.length; i++)
        bits[i] = circuit.and(bits[i], notzero);
    
    return bits;
}

for (var l = 128; l <= 256; l += 128) {
    for (var sw = 8; sw <= 32; sw *= 2) {
        var name = "_mm" + (l == 256 ? l : "") + "_sign_epi" + sw;
        SSECFunction[name] = mapsw(sgn, sw, l);
    }
}

function slli(x, imm) {
    if (imm == 0) return x;
    var bits = new Int32Array(x.length);
    if (imm >= bits.length)
        return bits;
    bits.set(x.subarray(0, bits.length - imm), imm);
    return bits;
}

function srli(x, imm) {
    if (imm == 0) return x;
    var bits = new Int32Array(x.length);
    if (imm >= bits.length)
        return bits;
    bits.set(x.subarray(imm));
    return bits;
}

function srai(x, imm) {
    if (imm == 0) return x;
    var bits = new Int32Array(x.length);
    bits.fill(x[x.length - 1], -imm);
    if (imm >= x.length) return bits;
    bits.set(x.subarray(imm));
    return bits;
}

function mux(x, y, m) {
    var bits = new Int32Array(x.length);
    for (var i = 0; i < bits.length; i++)
        bits[i] = circuit.mux(x[i], y[i], m);
    return bits;
}

function sll(x, y) {
    var shiftCountSize = ctz(x.length);
    var makeZero = circuit.or_big(y.subarray(shiftCountSize));
    var bits = new Int32Array(x);
    for (var sh = 1, k = 0; sh < x.length; sh *= 2, k++)
        bits = mux(bits, slli(bits, sh), y[k]);
    for (var i = 0; i < bits.length; i++)
        bits[i] = circuit.and(bits[i], ~makeZero);
    return bits;
}

function srl(x, y) {
    var shiftCountSize = ctz(x.length);
    var makeZero = circuit.or_big(y.subarray(shiftCountSize));
    var bits = new Int32Array(x);
    for (var sh = 1, k = 0; sh < x.length; sh *= 2, k++)
        bits = mux(bits, srli(bits, sh), y[k]);
    for (var i = 0; i < bits.length; i++)
        bits[i] = circuit.and(bits[i], ~makeZero);
    return bits;
}

function sra(x, y) {
    var shiftCountSize = ctz(x.length);
    var makeZero = circuit.or_big(y.subarray(shiftCountSize));
    var bits = new Int32Array(x);
    for (var sh = 1, k = 0; sh < x.length; sh *= 2, k++)
        bits = mux(bits, srai(bits, sh), y[k]);
    for (var i = 0; i < bits.length; i++)
        bits[i] = circuit.and(bits[i], ~makeZero);
    return bits;
}

for (var lt = 128; lt <= 256; lt += 128) {
    for (var swt = 16; swt <= 64; swt *= 2) {
        var l = lt;
        var sw = swt;
        var _slli = "_mm" + (l == 256 ? l : "") + "_slli_epi" + sw;
        var _sll = "_mm" + (l == 256 ? l : "") + "_sll_epi" + sw;
        var _srli = "_mm" + (l == 256 ? l : "") + "_srli_epi" + sw;
        var _srl = "_mm" + (l == 256 ? l : "") + "_srl_epi" + sw;
        var _srai = "_mm" + (l == 256 ? l : "") + "_srai_epi" + sw;
        var _sra = "_mm" + (l == 256 ? l : "") + "_sra_epi" + sw;
        SSECFunction[_slli] = mapsw(slli, sw, l);
        SSECFunction[_srli] = mapsw(srli, sw, l);
        if (sw != 64)
            SSECFunction[_srai] = mapsw(srai, sw, l);

        SSECFunction[_sll] = function (x, y) {
            var bits = new Int32Array(256);
            for (var i = 0; i < l; i += sw)
                bits.set(sll(x._bits.subarray(i, i + sw), y._bits.subarray(0, sw)), i);
            return new SSECFunction(bits);
        };

        SSECFunction[_srl] = function (x, y) {
            var bits = new Int32Array(256);
            for (var i = 0; i < l; i += sw)
                bits.set(srl(x._bits.subarray(i, i + sw), y._bits.subarray(0, sw)), i);
            return new SSECFunction(bits);
        };

        if (sw != 64) {
            SSECFunction[_sll] = function (x, y) {
                var bits = new Int32Array(256);
                for (var i = 0; i < l; i += sw)
                    bits.set(sra(x._bits.subarray(i, i + sw), y._bits.subarray(0, sw)), i);
                return new SSECFunction(bits);
            };
        }
    }
}

function fadd32 (a, b, mode) {
    var signa = a[31], signb = b[31];
    var rawExpA = a.subarray(23, 31);
    var rawExpB = b.subarray(23, 31);
    var sigA = a.slice(0, 24);
    var sigB = b.slice(0, 24);
    // leading 1 if not denormal
    sigA[23] = circuit.or_big(rawExpA);
    sigB[23] = circuit.or_big(rawExpB);

}

function avxOf1 (f) {
    var res = function (x) {
        var low = f(x._bits.subarray(0, 128));
        var high = f(x._bits.subarray(128, 256));
        var bits = new Int32Array(256);
        bits.set(low);
        bits.set(high, 128);
        return new SSECFunction(bits);
    };
    return res;
}

function avxOf2 (f) {
    var res = function (x, y) {
        var low = f(x._bits.subarray(0, 128), y._bits.subarray(0, 128));
        var high = f(x._bits.subarray(128, 256), y._bits.subarray(128, 256));
        var bits = new Int32Array(256);
        bits.set(low);
        bits.set(high, 128);
        return new SSECFunction(bits);
    };
    return res;
}

function avxOf2i (f) {
    var res = function (x, y) {
        var low = f(x._bits.subarray(0, 128), y);
        var high = f(x._bits.subarray(128, 256), y);
        var bits = new Int32Array(256);
        bits.set(low);
        bits.set(high, 128);
        return new SSECFunction(bits);
    };
    return res;
}

SSECFunction._mm256_and_si256 = avxOf2(SSECFunction._mm_and_si128);
SSECFunction._mm256_andnot_si256 = avxOf2(SSECFunction._mm_andnot_si128);
SSECFunction._mm256_xor_si256 = avxOf2(SSECFunction._mm_xor_si128);
SSECFunction._mm256_or_si256 = avxOf2(SSECFunction._mm_or_si128);
SSECFunction._mm256_shuffle_epi32 = avxOf2i(SSECFunction._mm_shuffle_epi32);
SSECFunction._mm256_shuffle_epi8 = avxOf2(SSECFunction._mm_shuffle_epi8);
SSECFunction._mm256_sad_epu8 = avxOf1(SSECFunction._mm_sad_epu8);
SSECFunction._mm256_hadd_epi16 = avxOf2(SSECFunction._mm_hadd_epi16);
SSECFunction._mm256_hadds_epi16 = avxOf2(SSECFunction._mm_hadds_epi16);
SSECFunction._mm256_hadd_epi32 = avxOf2(SSECFunction._mm_hadd_epi32);
SSECFunction._mm256_hsub_epi16 = avxOf2(SSECFunction._mm_hsub_epi16);
SSECFunction._mm256_hsubs_epi16 = avxOf2(SSECFunction._mm_hsubs_epi16);
SSECFunction._mm256_hsub_epi32 = avxOf2(SSECFunction._mm_hsub_epi32);
SSECFunction._mm256_madd_epi16 = avxOf2(SSECFunction._mm_madd_epi16);
SSECFunction._mm256_maddubs_epi16 = avxOf2(SSECFunction._mm_maddubs_epi16);
SSECFunction._mm256_slli_si128 = avxOf2i(SSECFunction._mm_slli_si128);
SSECFunction._mm256_srli_si128 = avxOf2i(SSECFunction._mm_srli_si128);
SSECFunction._mm256_packs_epi16 = avxOf2(SSECFunction._mm_packs_epi16);
SSECFunction._mm256_packs_epi32 = avxOf2(SSECFunction._mm_packs_epi32);
SSECFunction._mm256_packus_epi16 = avxOf2(SSECFunction._mm_packus_epi16);
SSECFunction._mm256_packus_epi32 = avxOf2(SSECFunction._mm_packus_epi32);

})();

SSECFunction.prototype.AnalyzeTruth = function(data, root, vars, cb) {
    function getModelWithBan(bit, bannedModel) {
        var sat = new SAT();
        circuit.to_cnf(bit, sat);
        if (bannedModel) {
            var clause = [];
            for (var i = 0; i < 32 * vars.length; i++) {
                if ((bannedModel[i >> 5] & (1 << (i & 31))) == 0)
                    clause.push(i + 1);
                else
                    clause.push(~(i + 1));
            }
            sat.addClause(clause);
        }
        var model_raw = sat.solve();
        if (model_raw != null) {
            var model = new Int32Array(64);
            for (var i = 1; i <= 32 * 64; i++) {
                if (model_raw[i] == 1)
                    model[(i - 1) >> 5] |= 1 << ((i - 1) & 31);
            }
            return model;
        }
        return void(0);
    }

    function packbits(bits) {
        var r = new Int32Array((bits.length + 31) >> 5);
        for (var i = 0; i < bits.length; i++)
            r[i >> 5] |= (bits[i] & 1) << (i & 31);
        return r;
    }

    function unpackbits(values, idx) {
        var r = new Int32Array(256);
        for (var i = 0; i < r.length; i++) {
            var j = idx * 256 + i;
            r[i] = -((values[j >> 5] >> (j & 31)) & 1);
        }
        return r;
    }

    var res = data;

    var sat = new SAT();
    circuit.to_cnf(~this.bool, sat);
    var fmodel_raw = sat.solve();
    sat = new SAT();
    circuit.to_cnf(this.bool, sat);
    var tmodel_raw = sat.solve();

    var can_be_true = tmodel_raw != null;
    var can_be_false = fmodel_raw != null;

    var fmodel = new Int32Array(64);
    if (can_be_false) {
        for (var i = 1; i <= 32 * 64; i++) {
            if (fmodel_raw[i] == 1)
                fmodel[(i - 1) >> 5] |= 1 << ((i - 1) & 31);
        }
    }
    var tmodel = new Int32Array(64);
    if (can_be_true) {
        for (var i = 1; i <= 32 * 64; i++) {
            if (tmodel_raw[i] == 1)
                tmodel[(i - 1) >> 5] |= 1 << ((i - 1) & 31);
        }
    }

    if (can_be_true) {
        if (!can_be_false) {
            var resobj = {
                count: "#always"
            };
            res.true = resobj;
        }
        else {
            var trueobj1 = {
                count: "#at least once",
                examples: function (ix) {
                    return [tmodel][ix];
                }
            };
            res.true = trueobj1;
            cb();

            var bits = this.bool;

            setTimeout(function() {
                var second = getModelWithBan(bits, tmodel);
                var trueobj = {
                    count: second ? "#at least twice" : "1",
                    examples: function (ix) {
                        return [tmodel, second][ix];
                    }
                };
                res.true = trueobj;
                cb();
            }, 0);
        }
    }
    if (can_be_false) {
        if (!can_be_true) {
            res.false = {
                count: "#always"
            };
        }
        else {
            var falseobj1 = {
                count: "#at least once",
                examples: function (ix) {
                    return [fmodel][ix];
                }
            };
            res.false = falseobj1;
            cb();
            var bits = this.bool;

            setTimeout(function() {
                var second = getModelWithBan(~bits, fmodel);
                var makeExamples = vars.length > 0;
                var falseobj = {
                    count: second ? "#at least twice" : "1",
                    ext_examples: makeExamples,
                    examples: function (ix) {
                        var values = [fmodel, second][ix];
                        if (!makeExamples || !values) return values;
                        var len = vars.length;
                        var res = [];
                        for (var i = 0; i < len; i++)
                            res[i] = new SSECFunction(unpackbits(values, i));
                        res[len] = root.l.sseeval(res);
                        res[len + 1] = root.r.sseeval(res);
                        var r = new Int32Array(res.length * 8);
                        for (var i = 0; i < res.length; i++)
                            r.set(packbits(res[i]._bits), i * 8);
                        return r;
                    }
                };
                res.false = falseobj;
                cb();
            }, 0);
        }
    }
    if (!can_be_true && !can_be_false) {
        alert("This should be impossible.");
    }
};