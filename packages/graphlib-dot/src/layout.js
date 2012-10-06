dagre.layout = (function() {
  function acyclic(g) {
    var onStack = {};
    var visited = {};

    function dfs(u) {
      if (u in visited)
        return;

      visited[u.id()] = true;
      onStack[u.id()] = true;
      u.outEdges().forEach(function(e) {
        var v = e.head();
        if (v.id() in onStack) {
          g.removeEdge(e);
          e.attrs.reverse = true;

          // If this is not a self-loop add the reverse edge to the graph
          if (u.id() !== v.id()) {
            u.addPredecessor(v, e.attrs);
          }
        } else {
          dfs(v);
        }
      });

      delete onStack[u.id()];
    }

    g.nodes().forEach(function(u) {
      dfs(u);
    });
  }

  function reverseAcyclic(g) {
    g.edges().forEach(function(e) {
      if (e.attrs.reverse) {
        g.removeEdge(e);
        g.addEdge(e.head(), e.tail(), e.attrs);
        delete e.attrs.reverse;
      }
    });
  }

  function removeSelfLoops(g) {
    var selfLoops = [];
    g.nodes().forEach(function(u) {
      var es = u.outEdges(u);
      es.forEach(function(e) {
        selfLoops.push(e);
        g.removeEdge(e);
      });
    });
    return selfLoops;
  }

  function addSelfLoops(g, selfLoops) {
    selfLoops.forEach(function(e) {
      g.addEdge(e.head(), e.tail(), e.attrs);
    });
  }

  // Assumes input graph has no self-loops and is otherwise acyclic.
  function addDummyNodes(g) {
    g.edges().forEach(function(e) {
      var prefix = "_dummy-" + e.id() + "-";
      var u = e.tail();
      var sinkRank = e.head().attrs.rank;
      if (u.attrs.rank + 1 < sinkRank) {
        g.removeEdge(e);
        for (var rank = u.attrs.rank + 1; rank < sinkRank; ++rank) {
          var vId = prefix + rank;
          var v = g.addNode(vId, { rank: rank, dummy: true, height: 1, width: 1 });
          g.addEdge(u, v);
          u = v;
        }
        g.addEdge(u, e.head(), e.attrs);
      }
    });
  }

  function rankToLayering(g) {
    var layering = [];
    g.nodes().forEach(function(u) {
      var rank = u.attrs.rank;
      layering[rank] = layering[rank] || [];
      layering[rank].push(u);
      delete u.attrs.rank;
    });
    return layering;
  }

  function pseudoPositioning(g, layering) {
    var posY = 0;
    for (var i = 0; i < layering.length; ++i) {
      var layer = layering[i];
      var height = max(layer.map(function(u) { return u.attrs.height; })) + g.attrs.rankSep;
      var posX = 0;
      for (var j = 0; j < layer.length; ++j) {
        var uAttrs = layer[j].attrs;
        var sep = uAttrs.dummy ? g.attrs.edgeSep : g.attrs.nodeSep / 2;
        if (j != 0) {
          posX += sep;
        }
        uAttrs.x = posX;
        uAttrs.y = posY;
        if (j + 1 < layer.length) {
          posX += uAttrs.width + sep;
        }
      }
      posY += height;
    }
  }

  return function(g) {
    var selfLoops = removeSelfLoops(g);
    acyclic(g);

    dagre.layout.rank(g);

    addDummyNodes(g);
    var layering = rankToLayering(g);

    pseudoPositioning(g, layering);

    reverseAcyclic(g);
    addSelfLoops(g, selfLoops);

    dagre.layout.edges(g);
  };
})();
