importScripts('util.js', 'expr.js', 'prooffinder.js');

var id = -1;

onmessage = function(e) {
  //console.log(e.data);
  console.log('Running ProofFinder in a Web Worker');
  var from = Node.fromBareObject(e.data.from);
  var to = Node.fromBareObject(e.data.to);
  var id = e.data.id;
  var tl = e.data.tl;
  var pf = new ProofFinder(20);
  pf.Search(from, to, function (steps, res) {
    postMessage({steps: steps, res: res});
  }, null, null, tl);
}
