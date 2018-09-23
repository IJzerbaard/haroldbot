// hack to get Module in scope
var oldw = window;
var window = {};
importScripts('minisat.js');
window = oldw;

onmessage = function(e) {
  console.log('Running MiniSAT in Web Worker');
  var solve_string = Module.cwrap('solve_string', 'string', ['string', 'int']);
  var res = solve_string(e.data, e.data.length);
  postMessage(res);
}
