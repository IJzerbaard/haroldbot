function parse(query) {
	// returns [expression, varmap, errors]
	// expression:
	//    [string, id {, operands}]

	var pos = 0;
	var res = [null, null, null];
	var varmap = [];
	res[1] = varmap;
	
	var scope = {};


	function main() {
		var p = pos;
		ws();
		if (l("forall")) {
			var quantified = [];
			res[2] = quantified;
			do {
				ws();
				var v = ident();
				ws();
				quantified.push(v);
				if (!l(",")) break;
			} while (true);
			ws();
			if (!l(":")) {
				res.push("expected ':' to close list of quantified variables");
				return;
			}
			ws();
		}
		ws();
		res[0] = expr();
	}

	function expr() {
		return ternary();
	}

	function ternary() {
		var p = pos;
		var cond = imply();
		if (!cond) return back(p);
		ws();
		if (l("?")) {
			var t = imply();
			ws();
			if (!l(":")) return back(p);
			var f = imply();
			return new Ternary(cond, t, f);
		}
		return cond;
	}

	function imply() {
		var p = pos;
		var t;
		if (!(t = boolor())) return back(p);
		if (res.length > 3) return undefined;
		var left = t;
		while (ws() && ((t = l("=>")))) {
			var right = boolor();
			if (res.length > 3) return undefined;
			if (!right) return error("invalid expression");
			left = (new Binary(ops.indexOf(t), left, right));
		}
		return left;
	}

	function boolor() {
		var p = pos;
		var t;
		if (!(t = booland())) return back(p);
		if (res.length > 3) return undefined;
		var left = t;
		while (ws() && ((t = l("||")))) {
			var right = booland();
			if (res.length > 3) return undefined;
			if (!right) return error("invalid expression");
			left = (new Binary(ops.indexOf(t), left, right));
		}
		return left;
	}

	function booland() {
		var p = pos;
		var t;
		if (!(t = comparison())) return back(p);
		if (res.length > 3) return undefined;
		var left = t;
		while (ws() && ((t = l("&&")))) {
			var right = comparison();
			if (res.length > 3) return undefined;
			if (!right) return error("invalid expression");
			left = (new Binary(ops.indexOf(t), left, right));
		}
		return left;
	}

	function comparison() {
		var p = pos;
		var t;
		if (!(t = or())) return back(p);
		if (res.length > 3) return undefined;
		var left = t;
		while (ws() && ((t = l("==")) || (t = l("!=")) ||
				(t = l("<=s")) || (t = l("<=u")) || (t = l("<=")) ||
				(t = l(">=s")) || (t = l(">=u")) || (t = l(">=")) ||
				(t = l("<s")) || (t = l("<u")) || (t = l("<")) ||
				(t = l(">s")) || (t = l(">u")) || (t = l(">")))) {
			var right = or();
			if (res.length > 3) return undefined;
			if (!right) return error("invalid expression");
			if (t == "<") t = "<u";
			if (t == ">") t = ">u";
			if (t == "<=") t = "<=u";
			if (t == ">=") t = ">=u";
			left = (new Binary(ops.indexOf(t), left, right));
		}
		return left;
	}

	function or() {
		var p = pos;
		var t;
		if (!(t = xor())) return back(p);
		if (res.length > 3) return undefined;
		var left = t;
		while (ws() && ((t = ll("|", "|")))) {
			var right = xor();
			if (res.length > 3) return undefined;
			if (!right) return error("invalid expression");
			left = (new Binary(ops.indexOf(t), left, right));
		}
		return left;
	}

	function xor() {
		var p = pos;
		var t;
		if (!(t = and())) return back(p);
		if (res.length > 3) return undefined;
		var left = t;
		while (ws() && ((t = l("^")))) {
			var right = and();
			if (res.length > 3) return undefined;
			if (!right) return error("invalid expression");
			left = (new Binary(ops.indexOf(t), left, right));
		}
		return left;
	}

	function and() {
		var p = pos;
		var t;
		if (!(t = pshift())) return back(p);
		if (res.length > 3) return undefined;
		var left = t;
		while (ws() && ((t = ll("&", "&")))) {
			var right = pshift();
			if (res.length > 3) return undefined;
			if (!right) return error("invalid expression");
			left = (new Binary(ops.indexOf(t), left, right));
		}
		return left;
	}

	function pshift() {
		var p = pos;
		var t;
		if (!(t = sum())) return back(p);
		if (res.length > 3) return undefined;
		var left = t;
		while (ws() && ((t = l("<<")) || (t = l(">>u")) || (t = l(">>s")) ||  (t = l(">>")) || (t = l(">>>")) || (t = l("<<<")))) {
			var right = sum();
			if (res.length > 3) return undefined;
			if (!right) return error("invalid expression");
			if (t == ">>") t = ">>u";
			left = (new Binary(ops.indexOf(t), left, right));
		}
		return left;
	}

	function sum() {
		var p = pos;
		var t;
		if (!(t = product())) return back(p);
		if (res.length > 3) return undefined;
		var left = t;
		while (ws() && ((t = l("+")) || (t = l("-")))) {
			var right = product();
			if (res.length > 3) return undefined;
			if (!right) return error("invalid expression");
			left = new Binary(ops.indexOf(t), left, right);
		}
		return left;
	}

	function product() {
		var p = pos;
		var t;
		if (!(t = prefix())) return back(p);
		var left = t;
		while (ws() && ((t = l("*")) || (t = l("/u")) || (t = l("/s")) || (t = l("/e")) || (t = l("/p")) || (t = l("/")) || (t = l("%u")) || (t = l("%s")) || (t = l("%e")) || (t = l("%")))) {
			var right = prefix();
			if (res.length > 3) return undefined;
			if (!right) return error("invalid expression");
			if (t == "/") t = "/u";
			if (t == "%") t = "%u";
			left = new Binary(ops.indexOf(t), left, right);
		}
		return left;
	}

	function prefix() {
		var t;
		if (ws() && ((t = l("~")) || (t = l("-")))) {
			var right = prefix();
			if (res.length > 3) return undefined;
			if (!right) return error("invalid expression");
			return new Unary(t == "-" ? 1 : 0, right);
		} else {
			return primary();
		}
	}

	function letsub() {
		var id = ident();
		if (id === undefined) return error("expected identifier");
		ws();
		if (!l("=")) return error("expected '='");
		ws();
		var value = expr();
		scope[id] = value;
	}

	function primary() {
		var p = pos;
		var t;
		ws();
		if (l("(")) {
			var inner = expr();
			if (res.length > 3) return undefined;
			if (!inner) return error("invalid expression");
			if (!l(")")) return error("unclosed parenthesis");
			return new Unary("dummy", inner);
		} else if (l("let")) {
			ws();
			letsub();
			ws();
			while (l(",")) {
				ws();
				letsub();
				ws();
			}
			if (!l("in")) return error("expected 'in' to close 'let'");
			ws();
			return expr();
		} else if (l("min")) {
			return fun2("min", true);
		} else if (l("max")) {
			return fun2("max", true);
		} else if (l("clmul")) {
			return fun2("clmul", false);
		} else if (l("clpow")) {
			return fun2("clpow", false);
		} else if (ll("abs", "d")) {
			return fun1("abs");
		} else if (l("ez80mlt")) {
			return fun1("ez80mlt");
		} else if (l("popcnt")) {
			return fun1("popcnt");
		} else if (l("nlz")) {
			return fun1("nlz");
		} else if (l("ntz")) {
			return fun1("ntz");
		} else if (l("blsi")) {
			return fun1("blsi");
		} else if (l("blsr")) {
			return fun1("blsr");
		} else if (l("blsmsk")) {
			return fun1("blsmsk");
		} else if (l("tzmsk")) {
			return fun1("tzmsk");
		} else if (l("reverse")) {
			return fun1("reverse");
		} else if (l("bzhi")) {
			return fun2("bzhi", false);
		} else if (l("hmul")) {
			return fun2("hmul", true);
		} else if (l("ormul")) {
			return fun2("ormul", false);
		} else if (l("subus")) {
			return fun2("subus", false);
		} else if (l("fixmul")) {
			return fun3("fixmul", true);
		} else if (l("fixscale")) {
			return fun3("fixscale", false);
		} else if (isfun()) {
			return fun();
		} else if (query.charAt(pos) >= '0' && query.charAt(pos) <= '9') {
			if (query.charAt(pos) == '0' && query.charAt(pos + 1) == 'x') {
				pos += 2;
				var num = "";
				while (pos < query.length && (query.charAt(pos) >= '0' && query.charAt(pos) <= '9' || query.charAt(pos) >= 'a' && query.charAt(pos) <= 'f' || query.charAt(pos) >= 'A' && query.charAt(pos) <= 'F')) {
					num = num.concat(query.substr(pos++, 1));
				}
				return new Constant(parseInt(num, 16));
			} else {
				var num = query.substr(pos++, 1);
				while (pos < query.length && query.charAt(pos) >= '0' && query.charAt(pos) <= '9') {
					num = num.concat(query.substr(pos++, 1));
				}
				return new Constant(parseInt(num, 10));
			}
		} else if (query.charAt(pos) >= 'a' && query.charAt(pos) <= 'z' || query.charAt(pos) >= 'A' && query.charAt(pos) <= 'Z') {
			var variable = ident();
			if (scope[variable] === undefined) {
				if (varmap.indexOf(variable) < 0)
					varmap.push(variable);
				return new Variable(varmap.indexOf(variable));
			}
			else {
				return scope[variable];
			}
		} else return error("invalid expression");
	}

	function fun1(name) {
		ws();
		if (!l("(")) return error("'" + name + "' is a function but it is used as a variable");
		var a = expr();
		ws();
		if (!l(")")) return error("unclosed parenthesis");
		return new Unary(unops.indexOf("$" + name), a);
	}

	function fun2(name, canBeSigned) {
		var signed = false;
		if (canBeSigned) {
			if (l("_s")) signed = true;
			else l("_u");
		}
		ws();
		if (!l("(")) return error("'" + name + "' is a function but it is used as a variable");
		var a = expr();
		ws();
		if (!l(",")) return error("expected ',' in '" + name + "'");
		var b = expr();
		ws();
		if (!l(")")) return error("unclosed parenthesis");
		name = "$" + name;
		if (canBeSigned)
			name = name + (signed ? "_s" : "_u");
		return new Binary(ops.indexOf(name), a, b);
	}

	function fun3(name, canBeSigned) {
		var signed = false;
		if (canBeSigned) {
			if (l("_s")) signed = true;
			else l("_u");
		}
		ws();
		if (!l("(")) return error("'" + name + "' is a function but it is used as a variable");
		var a = expr();
		ws();
		if (!l(",")) return error("expected ',' in '" + name + "'");
		var b = expr();
		ws();
		if (!l(",")) return error("expected ',' in '" + name + "'");
		var c = expr();
		ws();
		if (!l(")")) return error("unclosed parenthesis");
		name = "$" + name;
		if (canBeSigned)
			name = name + (signed ? "_s" : "_u");
		return new Fun(name, [a, b, c]);
	}

	function isfun() {
		var p = pos;
		if (ident() && ws() && l("(")) {
			pos = p;
			return true;
		}
		pos = p;
		return undefined;
	}

	function fun() {
		var name = ident();
		ws(); 
		var lpar = l("(");
		ws();
		var args = [];
		do {
			var a = expr();
			if (a)
				args.push(a);
			else
				return error("expected expression");
			ws();
			if (!l(",")) {
				if (l(")"))
					break;
				else
					return error("expected ')'");
			}
			ws();
		} while (true);
		return new Fun(name, args);
	}

	function ident() {
		if (query.charAt(pos) >= 'a' && query.charAt(pos) <= 'z' || query.charAt(pos) >= 'A' && query.charAt(pos) <= 'Z' || query.charAt(pos) == '_') {
			var variable = query.substr(pos++, 1);
			while (query.charAt(pos) >= 'a' && query.charAt(pos) <= 'z' || 
				   query.charAt(pos) >= 'A' && query.charAt(pos) <= 'Z' ||
				   query.charAt(pos) >= '0' && query.charAt(pos) <= '9' ||
				   query.charAt(pos) == '_') {
				variable = variable.concat(query.substr(pos++, 1));
			}
			return variable;
		}
		else
			return undefined;
	}

	function back(p) {
		pos = p;
		return undefined;
	}

	function ws() {
		while (pos < query.length && query.charAt(pos) == ' ')
			pos++;
		return true;
	}

	function l(s) {
		var x = query.substr(pos, s.length);
		if (x == s) {
			pos += s.length;
			return s;
		} else return undefined;
	}

	function ll(s, notnext) {
		var x = query.substr(pos, s.length);
		var y = query.substr(pos + s.length, notnext.length);
		if (x == s && y != notnext) {
			pos += s.length;
			return s;
		} else return undefined
	}

	function error(s) {
		res.push(s + " at position " + pos);
		return undefined;
	}

	main();
	return res;
}
