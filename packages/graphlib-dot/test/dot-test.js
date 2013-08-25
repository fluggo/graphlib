var common = require("./common"),
    path = require("path"),
    fs = common.fs,
    assert = require("chai").assert,
    dot = require("../lib/dot");

describe("lib/dot", function() {
  describe("toGraph", function() {
    it("allows an empty label", function() {
      var g = dot.toGraph("digraph { a [label=\"\"]; }");
      assert.equal(g.node("a").label, "");
    });

    it("adds default attributes to nodes", function() {
      var d = "digraph { node [color=black shape=box]; n1 [label=\"n1\"]; n2 [label=\"n2\"]; n1 -> n2; }";
      var g = dot.toGraph(d);
      assert.equal(g.node("n1").color, "black");
      assert.equal(g.node("n1").shape, "box");
      assert.equal(g.node("n1").label, "n1");

      assert.equal(g.node("n2").color, "black");
      assert.equal(g.node("n2").shape, "box");
      assert.equal(g.node("n2").label, "n2");    
    });

    it("combines multiple default attribute statements", function() {
      var d = "digraph { node [color=black]; node [shape=box]; n1 [label=\"n1\"]; }";
      var g = dot.toGraph(d);
      assert.equal(g.node("n1").color, "black");
      assert.equal(g.node("n1").shape, "box");
    });

    it("takes statement order into account when applying default attributes", function() {
      var d = "digraph { node [color=black]; n1 [label=\"n1\"]; node [shape=box]; n2 [label=\"n2\"]; }";
      var g = dot.toGraph(d);
      assert.equal(g.node("n1").color, "black");
      assert.isUndefined(g.node("n1").shape);

      assert.equal(g.node("n2").color, "black");
      assert.equal(g.node("n2").shape, "box");
    });

    it("overrides redefined default attributes", function() {
      var d = "digraph { node [color=black]; n1 [label=\"n1\"]; node [color=green]; n2 [label=\"n2\"]; n1 -> n2; }";
      var g = dot.toGraph(d);
      assert.equal(g.node("n1").color, "black");
      assert.equal(g.node("n2").color, "green");

      // Implementation detail:
      // toGraph::handleStmt wants to assure that nodes used in an edge definition
      // are defined by calling createNode for those nodes. If these nested createNode
      // calls don't skip merging the default attributes, the attributes of already
      // defined nodes could be overwritten, causing both nodes in this test case to
      // have "color" set to green. 
    });

    it("does not carry attributes from one node over to the next", function() {
      var d = "digraph { node [color=black]; n1 [label=\"n1\" fontsize=12]; n2 [label=\"n2\"]; n1 -> n2; }";
      var g = dot.toGraph(d);
      assert.equal(g.node("n1").fontsize, 12);
      assert.isUndefined(g.node("n2").fontsize, "n2.fontsize should not be defined");
    });

    it("applies default attributes to nodes created in an edge statement", function() {
      var d = "digraph { node [color=blue]; n1 -> n2; }";
      var g = dot.toGraph(d);
      assert.equal(g.node("n1").color, "blue");
      assert.equal(g.node("n2").color, "blue");
    });

    it("applies default label if an explicit label is not set", function() {
      var d = "digraph { node [label=xyz]; n2 [label=123]; n1 -> n2; }";
      var g = dot.toGraph(d);
      assert.equal(g.node("n1").label, "xyz");
      assert.equal(g.node("n2").label, "123");
    });

    it("supports an implicit subgraph statement", function() {
      var d = "digraph { x; {y; z} }";
      var g = dot.toGraph(d);
      assert.isTrue(g.hasNode("x"));
      assert.isTrue(g.hasNode("y"));
      assert.isTrue(g.hasNode("z"));
    });

    it("supports an explicit subgraph statement", function() {
      var d = "digraph { x; subgraph {y; z} }";
      var g = dot.toGraph(d);
      assert.isTrue(g.hasNode("x"));
      assert.isTrue(g.hasNode("y"));
      assert.isTrue(g.hasNode("z"));
    });

    it("supports a subgraph as the RHS of an edge statement", function() {
      var d = "digraph { x -> {y; z} }";
      var g = dot.toGraph(d);
      assert.deepEqual(g.predecessors("y"), ["x"]);
      assert.deepEqual(g.predecessors("z"), ["x"]);
    });

    it("supports a subgraph as the LHS of an edge statement", function() {
      var d = "digraph { {x; y} -> {z} }";
      var g = dot.toGraph(d);
      assert.deepEqual(g.successors("x"), ["z"]);
      assert.deepEqual(g.successors("y"), ["z"]);
    });

    it("applies edge attributes to all nodes in a subgraph", function() {
      var d = "digraph { x -> {y; z} [prop=123] }";
      var g = dot.toGraph(d);
      assert.equal(g.edge(g.edges("x", "y")[0]).prop, 123);
      assert.equal(g.edge(g.edges("x", "z")[0]).prop, 123);
    });

    it("only applies attributes in a subgraph to nodes created in that subgraph", function() {
      var d = "digraph { x; subgraph { node [prop=123]; y; z; } }";
      var g = dot.toGraph(d);
      assert.isUndefined(g.node("x").prop);
      assert.equal(g.node("y").prop, 123);
      assert.equal(g.node("z").prop, 123);
    });

    it("applies parent defaults to subgraph nodes when appropriate", function() {
      var d = "digraph { node [prop=123]; subgraph { x; subgraph { y; z [prop=456]; } } }";
      var g = dot.toGraph(d);
      assert.equal(g.node("x").prop, 123);
      assert.equal(g.node("y").prop, 123);
      assert.equal(g.node("z").prop, 456);
    });

    describe("it can parse all files in test-data", function() {
      var testDataDir = path.resolve(__dirname, "test-data");
      fs.readdirSync(testDataDir).forEach(function(file) {
        it(file, function() {
          var f = fs.readFileSync(path.resolve(testDataDir, file), "UTF-8");
          dot.toGraph(f);
        });
      });
    });
  });

  describe("it can write and parse without loss", function() {
    var testDataDir = path.resolve(__dirname, "test-data");
    fs.readdirSync(testDataDir).forEach(function(file) {
      it(file, function() {
        var f = fs.readFileSync(path.resolve(testDataDir, file), "UTF-8");
        var g = dot.toGraph(f);
        assert.deepEqual(dot.decode(dot.encode(g)), g);
      });
    });
  });

  describe("toGraphArray", function() {
    it("fails for an empty string", function() {
      assert.throws(function() { dot.toGraph(""); });
    });

    it("parses a single graph", function() {
      var gs = dot.toGraphArray("digraph { A; B; C; A -> B }");
      assert.equal(gs.length, 1);

      var g = gs[0];
      assert.deepEqual(g.nodes().sort(), ["A", "B", "C"]);
      assert.equal(g.edges("A", "B").length, 1);
    });

    it("parses multiple graphs", function() {
      var gs = dot.toGraphArray("digraph { A } digraph { B }");
      assert.equal(gs.length, 2);
      assert.deepEqual(gs[0].nodes().sort(), ["A"]);
      assert.deepEqual(gs[1].nodes().sort(), ["B"]);
    });
  });
});
