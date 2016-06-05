function parse(query) {
	// returns [expression, varmap, errors]
	// expression:
	//    [string, id {, operands}]

	var pos = 0;
	var res = [null, null];
	var varmap = [];
	res[1] = varmap;
	
	var scope = {};

	function main() {
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
		if (!(t = comparison())) return back(p);
		if (res.length > 2) return undefined;
		var left = t;
		while (ws() && ((t = l("=>")))) {
			var right = comparison();
			if (res.length > 2) return undefined;
			if (!right) return error("invalid expression");
			left = (new Binary(ops.indexOf(t), left, right));
		}
		return left;
	}

	function comparison() {
		var p = pos;
		var t;
		if (!(t = or())) return back(p);
		if (res.length > 2) return undefined;
		var left = t;
		while (ws() && ((t = l("==")) || (t = l("!=")) ||
				(t = l("<=")) || (t = l("<=u")) || (t = l("<=s")) ||
				(t = l(">=")) || (t = l(">=u")) || (t = l(">=s")) ||
				(t = l("<")) || (t = l("<u")) || (t = l("<s")) ||
				(t = l(">")) || (t = l(">u")) || (t = l(">s")))) {
			var right = or();
			if (res.length > 2) return undefined;
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
		if (res.length > 2) return undefined;
		var left = t;
		while (ws() && ((t = l("|")))) {
			var right = xor();
			if (res.length > 2) return undefined;
			if (!right) return error("invalid expression");
			left = (new Binary(ops.indexOf(t), left, right));
		}
		return left;
	}

	function xor() {
		var p = pos;
		var t;
		if (!(t = and())) return back(p);
		if (res.length > 2) return undefined;
		var left = t;
		while (ws() && ((t = l("^")))) {
			var right = and();
			if (res.length > 2) return undefined;
			if (!right) return error("invalid expression");
			left = (new Binary(ops.indexOf(t), left, right));
		}
		return left;
	}

	function and() {
		var p = pos;
		var t;
		if (!(t = pshift())) return back(p);
		if (res.length > 2) return undefined;
		var left = t;
		while (ws() && ((t = l("&")))) {
			var right = pshift();
			if (res.length > 2) return undefined;
			if (!right) return error("invalid expression");
			left = (new Binary(ops.indexOf(t), left, right));
		}
		return left;
	}

	function pshift() {
		var p = pos;
		var t;
		if (!(t = sum())) return back(p);
		if (res.length > 2) return undefined;
		var left = t;
		while (ws() && ((t = l("<<")) || (t = l(">>")) || (t = l(">>u")) || (t = l(">>s")) || (t = l(">>>")) || (t = l("<<<")))) {
			var right = sum();
			if (res.length > 2) return undefined;
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
		if (res.length > 2) return undefined;
		var left = t;
		while (ws() && ((t = l("+")) || (t = l("-")))) {
			var right = product();
			if (res.length > 2) return undefined;
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
		while (ws() && ((t = l("*")) || (t = l("/u")) || (t = l("/s")) || (t = l("/")) || (t = l("%u")) || (t = l("%s")) || (t = l("%")))) {
			var right = prefix();
			if (res.length > 2) return undefined;
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
			if (res.length > 2) return undefined;
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
			if (res.length > 2) return undefined;
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
			var isSigned = false;
			if (l("_s")) isSigned = true;
			else l("_u");
			ws();
			if (!l("(")) return error("'min' is a function but it is used as a variable");
			var a = expr();
			ws();
			if (!l(",")) return error("expected ',' in 'min'");
			var b = expr();
			ws();
			if (!l(")")) return error("unclosed parenthesis");
			return new Binary(ops.indexOf(isSigned ? "$min_s" : "$min_u"), a, b);
		} else if (l("max")) {
			var isSigned = false;
			if (l("_s")) isSigned = true;
			else l("_u");
			ws();
			if (!l("(")) return error("'max' is a function but it is used as a variable");
			var a = expr();
			ws();
			if (!l(",")) return error("expected ',' in 'max'");
			var b = expr();
			ws();
			if (!l(")")) return error("unclosed parenthesis");
			return new Binary(ops.indexOf(isSigned ? "$max_s" : "$max_u"), a, b);
		} else if (l("popcnt")) {
			return fun1("popcnt");
		} else if (l("nlz")) {
			return fun1("nlz");
		} else if (l("ntz")) {
			return fun1("ntz");
		} else if (l("reverse")) {
			return fun1("reverse");
		} else if (l("min")) {
			
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

	function ident() {
		if (query.charAt(pos) >= 'a' && query.charAt(pos) <= 'z' || query.charAt(pos) >= 'A' && query.charAt(pos) <= 'Z') {
			var variable = query.substr(pos++, 1);
			while (query.charAt(pos) >= 'a' && query.charAt(pos) <= 'z' || query.charAt(pos) >= 'A' && query.charAt(pos) <= 'Z') {
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
		if (query.substr(pos, s.length) == s) {
			pos += s.length;
			return s;
		} else return undefined;
	}

	function error(s) {
		res.push(s + " at position " + pos);
		return undefined;
	}

	main();
	return res;
}