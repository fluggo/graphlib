dagre.dot = {};

dagre.dot.toGraph = function(str) {
  var parseTree = dot_parser.parse(str);
  var g = dagre.graph();
  var undir = parseTree.type === "graph";

  function createNode(id, attrs) {
    if (!(g.hasNode(id))) {
      g.addNode(id, { id: id, label: id });
    }
    if (attrs) {
      mergeAttributes(attrs, g.node(id));
    }
  }

  var edgeCount = {};
  function createEdge(source, target, attrs) {
    var edgeKey = source + "-" + target;
    var count = edgeCount[edgeKey];
    if (!count) {
      count = edgeCount[edgeKey] = 0;
    }
    edgeCount[edgeKey]++;

    var id = attrs.id || edgeKey + "-" + count;
    var edge = {};
    mergeAttributes(attrs, edge);
    mergeAttributes({ id: id }, edge);
    g.addEdge(id, source, target, edge);
  }

  var defaultAttrs = {
    _default: {},

    get: function get(type, attrs) {
      if (typeof this._default[type] !== "undefined") {
        var mergedAttrs = this._default[type];
        mergeAttributes(attrs, mergedAttrs);
        return mergedAttrs;
      } else {
        return attrs;
      }
    },

    set: function set(type, attrs) {
      this._default[type] = this.get(type, attrs);
    }
  };

  function handleStmt(stmt) {
    var attrs = defaultAttrs.get(stmt.type, stmt.attrs);

    switch (stmt.type) {
      case "node":
        createNode(stmt.id, attrs);
        break;
      case "edge":
        var prev;
        stmt.elems.forEach(function(elem) {
          handleStmt(elem);

          switch(elem.type) {
            case "node":
              var curr = elem.id;

              if (prev) {
                createEdge(prev, curr, attrs);
                if (undir) {
                  createEdge(curr, prev, attrs);
                }
              }
              prev = curr;
              break;
            default:
              // We don't currently support subgraphs incident on an edge
              throw new Error("Unsupported type incident on edge: " + elem.type);
          }
        });
        break;
      case "attr":
        // attr will extend existing default attributes, new definitions take precedence
        defaultAttrs.set(stmt.attrType, stmt.attrs);
        break;
      default:
        throw new Error("Unsupported statement type: " + stmt.type);
    }
  }

  if (parseTree.stmts) {
    parseTree.stmts.forEach(function(stmt) {
      handleStmt(stmt);
    });
  }

  return g;
};

dagre.dot.toObjects = function(str) {
  var g = dagre.dot.toGraph(str);
  var nodes = g.nodes().map(function(u) { return g.node(u); });
  var edges = g.edges().map(function(e) {
    var edge = g.edge(e);
    edge.source = g.node(g.source(e));
    edge.target = g.node(g.target(e));
    return edge;
  });
  return { nodes: nodes, edges: edges };
};
