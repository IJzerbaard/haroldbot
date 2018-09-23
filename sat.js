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
    var highestvar = this.highestvar;
    function processRes(res) {
        var parts = res.split(" ");
        if (parts[0] != "SAT")
            return null;
        var r = new Int8Array(highestvar);
        for (var i = 1; i < parts.length; i++) {
            var v = parseInt(parts[i]);
            if (v > 0)
                r[v - 1] = 1;
        }
        return r;
    }

    var str = "p cnf " + (highestvar + 1) + " " + this.clauses + "\n" + this.dimacs;
    if (cb && window.Worker && window.location.protocol != 'file:') {
        var sw = new Worker('satworker.js');
        sw.onmessage = function (res) {
            cb(processRes(res.data));
        };
        sw.postMessage(str);
        window.setTimeout(function(){sw.terminate();}, 5000);
        return null;
    }
    else {
        console.log('Running MiniSAT on main thread');
        var solve_string = Module.cwrap('solve_string', 'string', ['string', 'int']);
        var res = solve_string(str, str.length);
        var r = processRes(res);
        if (cb) cb(r);
        return r;
    }
};
