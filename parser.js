function parse(query) {
	// returns [expression, varmap, errors]
	// expression:
	//    [string, id {, operands}]

	var pos = 0;
	var res = [null, null];
	var varmap = [];
	res[1] = varmap;
	
	var scope = {};

	function tokenize() {
		var tokens = [];
		var p = 0;
		var b = 0;
		var state = 0;
		while (p <= query.length) {
			var c = p == query.length ? '$' : query.charAt(p);
			p++;
			switch (state) {
				case 0:
					// normal state, beginning of tokens
					b = p - 1;
					if (c == ' ')
						break;
					else if (c >= '0' && c <= '9')
						state = 1;
					else if ((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z'))
						state = 2;
					else if (c == '(' || c == ')' || c == '+' ||
					         c == '*' || c == '^' || c == '-' ||
					         c == '~' || c == '?' || c == ':')
						tokens.push([c, c, b]);
					else if (c == '!')
						state = 3;
					else if (c == '&')
						state = 4;
					else if (c == '|')
						state = 5;
					else if (c == '>')
						state = 6;
					else if (c == '<')
						state = 7;
					else if (c == '=')
						state = 8;
					else if (c == '/' || c == '%')
						state = 10;
					else if (c == '$')
						return tokens;
					else {
						tokens.push([null, -1, b]);
						debugger;
					}
					break;
				case 1:
					// parsing a number
					if (c == 'x')
						state = 20;
					else if (c >= '0' && c <= '9')
						state = 1;
					else {
						// end of number apparently
						p--;
						tokens.push([query.substr(b, p - b), 'num', b]);
						state = 0;
					}
					break;
				case 2:
					// parsing an id
					if ((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z'))
						state = 2;
					else {
						p--;
						var tok = query.substr(b, p - b);
						// cheats (non-statemachine lexing)
						var type = 'id';
						if (tok == 'let' || tok == 'in')
							type = tok;
						tokens.push([tok, type, b]);
						state = 0;
					}
					break;
				case 3:
					// maybe =
					if (c != '=')
						p--;
					var tok = query.substr(b, p - b);
					tokens.push([tok, tok, b]);
					state = 0;
					break;
				case 4:
					// maybe &
					if (c != '&')
						p--;
					var tok = query.substr(b, p - b);
					tokens.push([tok, tok, b]);
					state = 0;
					break;
				case 5:
					// maybe |
					if (c != '|')
						p--;
					var tok = query.substr(b, p - b);
					tokens.push([tok, tok, b]);
					state = 0;
					break;
				case 6:
					// might be =, >, s or u
					// if =, goto 10
					if (c == '=')
						state = 10;
					else {
						if (c != '>' && c != 's' && c != 'u')
							p--;
						var tok = query.substr(b, p - b);
						tokens.push([tok, tok, b]);
						state = 0;
					}
					break;
				case 7:
					// either = or < (or end of tok)
					if (c != '=' && c != '<')
						p--;
					var tok = query.substr(b, p - b);
					tokens.push([tok, tok, b]);
					state = 0;
					break;
				case 8:
					// either = or > (or end of tok)
					if (c != '=' && c != '>')
						p--;
					var tok = query.substr(b, p - b);
					tokens.push([tok, tok, b]);
					state = 0;
					break;
				case 10:
					// suffix s/u/nothing
					if (c != 's' && c != 'u')
						p--;
					var tok = query.substr(b, p - b);
					tokens.push([tok, tok, b]);
					state = 0;
					break;
				case 20:
					// parsing hex number
					if ((c >= 0 && c <= '9') || (c >= 'a' && c <= 'f') || (c >= 'A' && c <= 'F'))
						state = 20;
					else {
						tokens.push([query.substr(b, p - b), 'num', b]);
						state = 0;
						p--;
					}
					break;
				default:
					debugger;
			}
		}
		return tokens;
	}

	var tokens = tokenize();
	var debugstr = "";
	for (var i = 0; i < tokens.length; i++) {
		debugstr += "{" + tokens[i][0] + "}";
	}
	debugger;

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
		if (!(t = boolor())) return back(p);
		if (res.length > 2) return undefined;
		var left = t;
		while (ws() && ((t = l("=>")))) {
			var right = boolor();
			if (res.length > 2) return undefined;
			if (!right) return error("invalid expression");
			left = (new Binary(ops.indexOf(t), left, right));
		}
		return left;
	}

	function boolor() {
		var p = pos;
		var t;
		if (!(t = booland())) return back(p);
		if (res.length > 2) return undefined;
		var left = t;
		while (ws() && ((t = l("||")))) {
			var right = booland();
			if (res.length > 2) return undefined;
			if (!right) return error("invalid expression");
			left = (new Binary(ops.indexOf(t), left, right));
		}
		return left;
	}

	function booland() {
		var p = pos;
		var t;
		if (!(t = comparison())) return back(p);
		if (res.length > 2) return undefined;
		var left = t;
		while (ws() && ((t = l("&&")))) {
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
		while (ws() && ((t = ll("|", "|")))) {
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
		while (ws() && ((t = ll("&", "&")))) {
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
		while (ws() && ((t = l("<<")) || (t = l(">>u")) || (t = l(">>s")) ||  (t = l(">>")) || (t = l(">>>")) || (t = l("<<<")))) {
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
