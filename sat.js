function SAT() {
    this.clauses = 0;
    this.highestvar = 0;
    this.dimacs = "";
}

SAT.prototype.addClause = function(clause) {

    var str = "";
    for (var i = 0; i < clause.length; i++) {
        var v = clause[i];
        if (v >= 0)
            v = v + 1;
        this.highestvar = Math.max(this.highestvar, Math.max(v, -v));
        str += v.toString() + " ";
    }

    this.dimacs += str + "0\n";
    this.clauses++;
};

SAT.prototype.addDIMACS = function(clause) {
    this.dimacs += clause + " 0\n";
    this.clauses++;
    var parts = clause.split(" ");

    for (var i = 0; i < parts.length; i++) {
        var x = parseInt(parts[i]);
        this.highestvar = Math.max(this.highestvar, x);
    }
};

SAT.prototype.solve = function (cb) {
    var solve_string = Module.cwrap('solve_string', 'string', ['string', 'int']);
    var str = "p cnf " + (this.highestvar + 1) + " " + this.clauses + "\n" + this.dimacs;
    var res = solve_string(str, str.length);
    var parts = res.split(" ");
    if (parts[0] != "SAT")
        return null;
    var r = new Int8Array(this.highestvar);
    for (var i = 1; i < parts.length; i++) {
        var v = parseInt(parts[i]);
        if (v > 0)
            r[v - 1] = 1;
    }
    if (cb) cb(r);
    return r;
};
