dagre.layout.acyclic = function() {
  // External configuration
  var debugLevel = 0,
      timer = createTimer();

  var self = {};

  self.debugLevel = function(x) {
    if (!arguments.length) return debugLevel;
    debugLevel = x;
    timer.enabled(debugLevel);
    return self;
  }

  self.run = timer.wrap("Acyclic Phase", run);

  self.undo = function(g) {
    g.eachEdge(function(e, s, t, a) {
      if (a.reversed) {
        delete a.reversed;
        g.delEdge(e);
        g.addEdge(e, t, s, a);
      }
    });
  }

  return self;

  function run(g) {
    var onStack = {},
        visited = {},
        reverseCount = 0;

    function dfs(u) {
      if (u in visited) return;

      visited[u] = onStack[u] = true;
      g.outEdges(u).forEach(function(e) {
        var t = g.target(e),
            a;

        if (t in onStack) {
          a = g.edge(e);
          g.delEdge(e);
          a.reversed = true;
          ++reverseCount;
          g.addEdge(e, t, u, a);
        } else {
          dfs(t);
        }
      });

      delete onStack[u];
    }

    g.eachNode(function(u) { dfs(u); });

    if (debugLevel >= 2) console.log("Acyclic Phase: reversed " + reverseCount + " edge(s)");
  }
};
