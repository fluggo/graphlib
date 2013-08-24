var util = require("./util"),
    Graph = require("graphlib").Graph;

var dot_parser = require("./dot-grammar");

exports.toGraphArray = function(str) {
  var parseTree = dot_parser.parse(str);
  console.log(parseTree)
  return parseTree.map(function(subtree) {
    return parseOne(subtree);
  });
};

exports.parse =
exports.decode =
exports.toGraph = function(str) {
  return exports.toGraphArray(str)[0];
};

exports.encode =
exports.stringify = require('./encode')

//this makes graphlib-dot a valid levelup encoding.
exports.type = 'dot'
exports.buffer = false

function parseOne(parseTree) {
  var g = new Graph();
  var undir = parseTree.type === "graph";
  g.type = parseTree.type

  function createNode(id, attrs) {
    if (!(g.hasNode(id))) {
      // We only apply default attributes to a node when it is first defined.
      // If the node is subsequently used in edges, we skip apply default
      // attributes.
      g.addNode(id, defaultAttrs.get("node", { id: id }));

      // The "label" attribute is given special treatment: if it is not
      // defined we set it to the id of the node.
      if (g.node(id).label === undefined) {
        g.node(id).label = id;
      }
    }
    if (attrs) {
      util.mergeAttributes(attrs, g.node(id));
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
    util.mergeAttributes(defaultAttrs.get("edge", attrs), edge);
    util.mergeAttributes({ id: id }, edge);
    g.addEdge(id, source, target, edge);
  }

  function collectNodeIds(stmt) {
    var ids = {},
        stack = [],
        curr;
    function pushStack(e) { stack.push(e); }

    pushStack(stmt);
    while (stack.length !== 0) {
      curr = stack.pop();
      switch (curr.type) {
        case "node": ids[curr.id] = true; break;
        case "edge":
          curr.elems.forEach(pushStack);
          break;
        case "subgraph":
          curr.stmts.forEach(pushStack);
          break;
      }
    }
    return Object.keys(ids);
  }

  /*
   * We use a chain of prototypes to maintain properties as we descend into
   * subgraphs. This allows us to simply get the value for a property and have
   * the VM do appropriate resolution. When we leave a subgraph we simply set
   * the current context to the prototype of the current defaults object.
   * Alternatively, this could have been written using a stack.
   */
  var defaultAttrs = {
    _default: {},

    get: function get(type, attrs) {
      if (typeof this._default[type] !== "undefined") {
        var mergedAttrs = {};
        // clone default attributes so they won't get overwritten in the next step
        util.mergeAttributes(this._default[type], mergedAttrs);
        // merge statement attributes with default attributes, precedence give to stmt attributes
        util.mergeAttributes(attrs, mergedAttrs);
        return mergedAttrs;
      } else {
        return attrs;
      }
    },

    set: function set(type, attrs) {
      this._default[type] = this.get(type, attrs);
    },

    enterSubGraph: function() {
      function SubGraph() {}
      SubGraph.prototype = this._default;
      var subgraph = new SubGraph();
      this._default = subgraph;
    },

    exitSubGraph: function() {
      this._default = Object.getPrototypeOf(this._default);
    }
  };

  function handleStmt(stmt) {
    var attrs = stmt.attrs;
    switch (stmt.type) {
      case "node":
        createNode(stmt.id, attrs);
        break;
      case "edge":
        var prev,
            curr;
        stmt.elems.forEach(function(elem) {
          handleStmt(elem);

          switch(elem.type) {
            case "node": curr = [elem.id]; break;
            case "subgraph": curr = collectNodeIds(elem); break;
            default:
              // We don't currently support subgraphs incident on an edge
              throw new Error("Unsupported type incident on edge: " + elem.type);
          }

          if (prev) {
            prev.forEach(function(p) {
              curr.forEach(function(c) {
                createEdge(p, c, attrs);
                if (undir) {
                  createEdge(c, p, attrs);
                }
              });
            });
          }
          prev = curr;
        });
        break;
      case "subgraph":
        defaultAttrs.enterSubGraph();
        stmt.stmts.forEach(function(s) { handleStmt(s); });
        defaultAttrs.exitSubGraph();
        break;
      case "attr":
        defaultAttrs.set(stmt.attrType, attrs);
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
}

// TODO: move this and the object reading stuff in layout.js to their own file.
exports.toObjects = function(str) {
  var g = exports.toGraph(str);
  var nodes = g.nodes().map(function(u) { return g.node(u); });
  var edges = g.edges().map(function(e) {
    var edge = g.edge(e);
    edge.source = g.node(g.source(e));
    edge.target = g.node(g.target(e));
    return edge;
  });
  return { nodes: nodes, edges: edges };
};
