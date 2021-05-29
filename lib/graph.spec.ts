import 'mocha';
import { expect } from 'chai';
import Graph from './graph';

describe('Graph', function() {
  describe('initial state', function() {
    it('has no nodes', function() {
      const g = new Graph();
      expect(g.nodeCount()).to.equal(0);
    });

    it('has no edges', function() {
      const g = new Graph();
      expect(g.edgeCount()).to.equal(0);
    });

    it('has no attributes', function() {
      const g = new Graph();
      expect(g.graph()).to.be.undefined;
    });

    it('defaults to a simple directed graph', function() {
      const g = new Graph();
      expect(g.isDirected()).to.be.true;
      expect(g.isCompound()).to.be.false;
      expect(g.isMultigraph()).to.be.false;
    });

    it('can be set to undirected', function() {
      const g = new Graph({ directed: false });
      expect(g.isDirected()).to.be.false;
      expect(g.isCompound()).to.be.false;
      expect(g.isMultigraph()).to.be.false;
    });

    it('can be set to a compound graph', function() {
      const g = new Graph({ compound: true });
      expect(g.isDirected()).to.be.true;
      expect(g.isCompound()).to.be.true;
      expect(g.isMultigraph()).to.be.false;
    });

    it('can be set to a mulitgraph', function() {
      const g = new Graph({ multigraph: true });
      expect(g.isDirected()).to.be.true;
      expect(g.isCompound()).to.be.false;
      expect(g.isMultigraph()).to.be.true;
    });
  });

  describe('setGraph', function() {
    it('can be used to get and set properties for the graph', function() {
      const g = new Graph();
      g.setGraph('foo');
      expect(g.graph()).to.equal('foo');
    });

    it('is chainable', function() {
      const g = new Graph();
      expect(g.setGraph('foo')).to.equal(g);
    });
  });

  describe('nodes', function() {
    it('is empty if there are no nodes in the graph', function() {
      const g = new Graph();
      expect(g.nodes()).to.have.members([]);
    });

    it('returns the ids of nodes in the graph', function() {
      const g = new Graph();
      g.setNode('a');
      g.setNode('b');
      expect(g.nodes()).to.have.members(['a', 'b']);
    });
  });

  describe('sources', function() {
    it('returns nodes in the graph that have no in-edges', function() {
      const g = new Graph();
      g.setPath(['a', 'b', 'c']);
      g.setNode('d');
      expect(g.sources()).to.have.members(['a', 'd']);
    });
  });

  describe('sinks', function() {
    it('returns nodes in the graph that have no out-edges', function() {
      const g = new Graph();
      g.setPath(['a', 'b', 'c']);
      g.setNode('d');
      expect(g.sinks()).to.have.members(['c', 'd']);
    });
  });

  describe('filterNodes', function() {
    it('returns an identical graph when the filter selects everything', function() {
      const g = new Graph<string, number, number>();
      g.setGraph('graph label');
      g.setNode('a', 123);
      g.setPath(['a', 'b', 'c']);
      g.setEdge('a', 'c', 456);
      const g2 = g.filterNodes(() => true);
      expect(g2.nodes()).to.have.members(['a', 'b', 'c']);
      expect(g2.successors('a')).to.have.members(['b', 'c']);
      expect(g2.successors('b')).to.have.members(['c']);
      expect(g2.node('a')).eqls(123);
      expect(g2.edge('a', 'c')).eqls(456);
      expect(g2.graph()).eqls('graph label');
    });

    it('returns an empty graph when the filter selects nothing', function() {
      const g = new Graph();
      g.setPath(['a', 'b', 'c']);
      const g2 = g.filterNodes(function() {
        return false;
      });
      expect(g2.nodes()).to.have.members([]);
      expect(g2.edges()).to.have.members([]);
    });

    it('only includes nodes for which the filter returns true', function() {
      const g = new Graph();
      g.setNodes(['a', 'b']);
      const g2 = g.filterNodes(v => v === 'a');
      expect(g2.nodes()).to.have.members(['a']);
    });

    it('removes edges that are connected to removed nodes', function() {
      const g = new Graph();
      g.setEdge('a', 'b');
      const g2 = g.filterNodes(v => v === 'a');
      expect(g2.nodes()).to.have.members(['a']);
      expect(g2.edges()).to.have.members([]);
    });

    it('preserves the directed option', function() {
      let g = new Graph({ directed: true });
      expect(g.filterNodes(() => true).isDirected()).to.be.true;

      g = new Graph({ directed: false });
      expect(g.filterNodes(() => true).isDirected()).to.be.false;
    });

    it('preserves the multigraph option', function() {
      let g = new Graph({ multigraph: true });
      expect(g.filterNodes(() => true).isMultigraph()).to.be.true;

      g = new Graph({ multigraph: false });
      expect(g.filterNodes(() => true).isMultigraph()).to.be.false;
    });

    it('preserves the compound option', function() {
      let g = new Graph({ compound: true });
      expect(g.filterNodes(() => true).isCompound()).to.be.true;

      g = new Graph({ compound: false });
      expect(g.filterNodes(() => true).isCompound()).to.be.false;
    });

    it('includes subgraphs', function() {
      const g = new Graph({ compound: true });
      g.setParent('a', 'parent');

      const g2 = g.filterNodes(() => true);
      expect(g2.parent('a')).eqls('parent');
    });

    it('includes multi-level subgraphs', function() {
      const g = new Graph({ compound: true });
      g.setParent('a', 'parent');
      g.setParent('parent', 'root');

      const g2 = g.filterNodes(function() {
        return true;
      });
      expect(g2.parent('a')).eqls('parent');
      expect(g2.parent('parent')).eqls('root');
    });

    it('promotes a node to a higher subgraph if its parent is not included', function() {
      const g = new Graph({ compound: true });
      g.setParent('a', 'parent');
      g.setParent('parent', 'root');

      const g2 = g.filterNodes(v => v !== 'parent');
      expect(g2.parent('a')).eqls('root');
    });
  });

  describe('setNodes', function() {
    it('creates multiple nodes', function() {
      const g = new Graph();
      g.setNodes(['a', 'b', 'c']);
      expect(g.hasNode('a')).to.be.true;
      expect(g.hasNode('b')).to.be.true;
      expect(g.hasNode('c')).to.be.true;
    });

    it('can set a value for all of the nodes', function() {
      const g = new Graph();
      g.setNodes(['a', 'b', 'c'], 'foo');
      expect(g.node('a')).to.equal('foo');
      expect(g.node('b')).to.equal('foo');
      expect(g.node('c')).to.equal('foo');
    });

    it('is chainable', function() {
      const g = new Graph();
      expect(g.setNodes(['a', 'b', 'c'])).to.equal(g);
    });
  });

  describe('setNode', function() {
    it("creates the node if it isn't part of the graph", function() {
      const g = new Graph();
      g.setNode('a');
      expect(g.hasNode('a')).to.be.true;
      expect(g.node('a')).to.be.undefined;
      expect(g.nodeCount()).to.equal(1);
    });

    it('can set a value for the node', function() {
      const g = new Graph();
      g.setNode('a', 'foo');
      expect(g.node('a')).to.equal('foo');
    });

    it("does not change the node's value with a 1-arg invocation", function() {
      const g = new Graph();
      g.setNode('a', 'foo');
      g.setNode('a');
      expect(g.node('a')).to.equal('foo');
    });

    it("can remove the node's value by passing undefined", function() {
      const g = new Graph();
      g.setNode('a', undefined);
      expect(g.node('a')).to.be.undefined;
    });

    it('is idempotent', function() {
      const g = new Graph();
      g.setNode('a', 'foo');
      g.setNode('a', 'foo');
      expect(g.node('a')).to.equal('foo');
      expect(g.nodeCount()).to.equal(1);
    });

    it('is chainable', function() {
      const g = new Graph();
      expect(g.setNode('a')).to.equal(g);
    });
  });

  describe('setNodeDefaults', function() {
    it('sets a default label for new nodes', function() {
      const g = new Graph();
      g.setDefaultNodeLabel('foo');
      g.setNode('a');
      expect(g.node('a')).to.equal('foo');
    });

    it('does not change existing nodes', function() {
      const g = new Graph();
      g.setNode('a');
      g.setDefaultNodeLabel('foo');
      expect(g.node('a')).to.be.undefined;
    });

    it('is not used if an explicit value is set', function() {
      const g = new Graph();
      g.setDefaultNodeLabel('foo');
      g.setNode('a', 'bar');
      expect(g.node('a')).to.equal('bar');
    });

    it('can take a function', function() {
      const g = new Graph();
      g.setDefaultNodeLabel(() => 'foo');
      g.setNode('a');
      expect(g.node('a')).to.equal('foo');
    });

    it("can take a function that takes the node's name", function() {
      const g = new Graph();
      g.setDefaultNodeLabel(v => v + '-foo');
      g.setNode('a');
      expect(g.node('a')).to.equal('a-foo');
    });

    it('is chainable', function() {
      const g = new Graph();
      expect(g.setDefaultNodeLabel('foo')).to.equal(g);
    });
  });

  describe('node', function() {
    it("returns undefined if the node isn't part of the graph", function() {
      const g = new Graph();
      expect(g.node('a')).to.be.undefined;
    });

    it('returns the value of the node if it is part of the graph', function() {
      const g = new Graph();
      g.setNode('a', 'foo');
      expect(g.node('a')).to.equal('foo');
    });
  });

  describe('removeNode', function() {
    it('does nothing if the node is not in the graph', function() {
      const g = new Graph();
      expect(g.nodeCount()).to.equal(0);
      g.removeNode('a');
      expect(g.hasNode('a')).to.be.false;
      expect(g.nodeCount()).to.equal(0);
    });

    it('removes the node if it is in the graph', function() {
      const g = new Graph();
      g.setNode('a');
      g.removeNode('a');
      expect(g.hasNode('a')).to.be.false;
      expect(g.nodeCount()).to.equal(0);
    });

    it('is idempotent', function() {
      const g = new Graph();
      g.setNode('a');
      g.removeNode('a');
      g.removeNode('a');
      expect(g.hasNode('a')).to.be.false;
      expect(g.nodeCount()).to.equal(0);
    });

    it('removes edges incident on the node', function() {
      const g = new Graph();
      g.setEdge('a', 'b');
      g.setEdge('b', 'c');
      g.removeNode('b');
      expect(g.edgeCount()).to.equal(0);
    });

    it('removes parent / child relationships for the node', function() {
      const g = new Graph({ compound: true });
      g.setParent('c', 'b');
      g.setParent('b', 'a');
      g.removeNode('b');
      expect(g.parent('b')).to.be.undefined;
      expect(g.children('b')).to.be.undefined;
      expect(g.children('a')).to.not.include('b');
      expect(g.parent('c')).to.be.undefined;
    });

    it('is chainable', function() {
      const g = new Graph();
      expect(g.removeNode('a')).to.equal(g);
    });
  });

  describe('setParent', function() {
    it('throws if the graph is not compound', function() {
      expect(function() {
        new Graph().setParent('a', 'parent');
      }).to.throw();
    });

    it('creates the parent if it does not exist', function() {
      const g = new Graph({ compound: true });
      g.setNode('a');
      g.setParent('a', 'parent');
      expect(g.hasNode('parent')).to.be.true;
      expect(g.parent('a')).to.equal('parent');
    });

    it('creates the child if it does not exist', function() {
      const g = new Graph({ compound: true });
      g.setNode('parent');
      g.setParent('a', 'parent');
      expect(g.hasNode('a')).to.be.true;
      expect(g.parent('a')).to.equal('parent');
    });

    it('has the parent as undefined if it has never been invoked', function() {
      const g = new Graph({ compound: true });
      g.setNode('a');
      expect(g.parent('a')).to.be.undefined;
    });

    it('moves the node from the previous parent', function() {
      const g = new Graph({ compound: true });
      g.setParent('a', 'parent');
      g.setParent('a', 'parent2');
      expect(g.parent('a')).to.equal('parent2');
      expect(g.children('parent')).to.eql([]);
      expect(g.children('parent2')).to.eql(['a']);
    });

    it('removes the parent if the parent is undefined', function() {
      const g = new Graph({ compound: true });
      g.setParent('a', 'parent');
      g.setParent('a', undefined);
      expect(g.parent('a')).to.be.undefined;
      expect(g.children()).to.have.members(['a', 'parent']);
    });

    it('removes the parent if no parent was specified', function() {
      const g = new Graph({ compound: true });
      g.setParent('a', 'parent');
      g.setParent('a');
      expect(g.parent('a')).to.be.undefined;
      expect(g.children()).to.have.members(['a', 'parent']);
    });

    it('is idempotent to remove a parent', function() {
      const g = new Graph({ compound: true });
      g.setParent('a', 'parent');
      g.setParent('a');
      g.setParent('a');
      expect(g.parent('a')).to.be.undefined;
      expect(g.children()).to.have.members(['a', 'parent']);
    });

    it('allows using numbers', function() {
      const g = new Graph<string | number>({ compound: true });
      g.setParent(2, 1);
      g.setParent(3, 2);
      expect(g.parent(2)).equals(1);
      expect(g.parent('2')).is.undefined;
      expect(g.parent(3)).equals(2);
    });

    it('preserves the tree invariant', function() {
      const g = new Graph({ compound: true });
      g.setParent('c', 'b');
      g.setParent('b', 'a');
      expect(() => g.setParent('a', 'c')).to.throw();
    });

    it('is chainable', function() {
      const g = new Graph({ compound: true });
      expect(g.setParent('a', 'parent')).to.equal(g);
    });
  });

  describe('parent', function() {
    it('returns undefined if the graph is not compound', function() {
      expect(new Graph({ compound: false }).parent('a')).to.be.undefined;
    });

    it('returns undefined if the node is not in the graph', function() {
      const g = new Graph({ compound: true });
      expect(g.parent('a')).to.be.undefined;
    });

    it('defaults to undefined for new nodes', function() {
      const g = new Graph({ compound: true });
      g.setNode('a');
      expect(g.parent('a')).to.be.undefined;
    });

    it('returns the current parent assignment', function() {
      const g = new Graph({ compound: true });
      g.setNode('a');
      g.setNode('parent');
      g.setParent('a', 'parent');
      expect(g.parent('a')).to.equal('parent');
    });
  });

  describe('children', function() {
    it('returns undefined if the node is not in the graph', function() {
      const g = new Graph({ compound: true });
      expect(g.children('a')).to.be.undefined;
    });

    it('defaults to en empty list for new nodes', function() {
      const g = new Graph({ compound: true });
      g.setNode('a');
      expect(g.children('a')).to.eql([]);
    });

    it('returns undefined for a non-compound graph without the node', function() {
      const g = new Graph();
      expect(g.children('a')).to.be.undefined;
    });

    it('returns an empty list for a non-compound graph with the node', function() {
      const g = new Graph();
      g.setNode('a');
      expect(g.children('a')).to.have.members([]);
    });

    it ('returns all nodes for the root of a non-compound graph', function() {
      const g = new Graph();
      g.setNode('a');
      g.setNode('b');
      expect(g.children()).to.have.members(['a', 'b']);
    });

    it('returns children for the node', function() {
      const g = new Graph({ compound: true });
      g.setParent('a', 'parent');
      g.setParent('b', 'parent');
      expect(g.children('parent')).to.have.members(['a', 'b']);
    });

    it('returns all nodes without a parent when the parent is not set', function() {
      const g = new Graph({ compound: true });
      g.setNode('a');
      g.setNode('b');
      g.setNode('c');
      g.setNode('parent');
      g.setParent('a', 'parent');
      expect(g.children()).to.have.members(['b', 'c', 'parent']);
      expect(g.children(undefined)).to.have.members(['b', 'c', 'parent']);
    });
  });

  describe('predecessors', function() {
    it('returns undefined for a node that is not in the graph', function() {
      const g = new Graph();
      expect(g.predecessors('a')).to.be.undefined;
    });

    it('returns the predecessors of a node', function() {
      const g = new Graph();
      g.setEdge('a', 'b');
      g.setEdge('b', 'c');
      g.setEdge('a', 'a');
      expect(g.predecessors('a')).to.have.members(['a']);
      expect(g.predecessors('b')).to.have.members(['a']);
      expect(g.predecessors('c')).to.have.members(['b']);
    });
  });

  describe('successors', function() {
    it('returns undefined for a node that is not in the graph', function() {
      const g = new Graph();
      expect(g.successors('a')).to.be.undefined;
    });

    it('returns the successors of a node', function() {
      const g = new Graph();
      g.setEdge('a', 'b');
      g.setEdge('b', 'c');
      g.setEdge('a', 'a');
      expect(g.successors('a')).to.have.members(['a', 'b']);
      expect(g.successors('b')).to.have.members(['c']);
      expect(g.successors('c')).to.have.members([]);
    });
  });

  describe('neighbors', function() {
    it('returns undefined for a node that is not in the graph', function() {
      const g = new Graph();
      expect(g.neighbors('a')).to.be.undefined;
    });

    it('returns the neighbors of a node', function() {
      const g = new Graph();
      g.setEdge('a', 'b');
      g.setEdge('b', 'c');
      g.setEdge('a', 'a');
      expect(g.neighbors('a')).to.have.members(['a', 'b']);
      expect(g.neighbors('b')).to.have.members(['a', 'c']);
      expect(g.neighbors('c')).to.have.members(['b']);
    });
  });

  describe('isLeaf', function() {
    it('returns false for connected node in undirected graph', function() {
      const g = new Graph({directed: false});
      g.setNode('a');
      g.setNode('b');
      g.setEdge('a', 'b');
      expect(g.isLeaf('b')).to.be.false;
    });
    it('returns true for an unconnected node in undirected graph', function() {
      const g = new Graph({directed: false});
      g.setNode('a');
      expect(g.isLeaf('a')).to.be.true;
    });
    it('returns true for unconnected node in directed graph', function() {
      const g = new Graph();
      g.setNode('a');
      expect(g.isLeaf('a')).to.be.true;
    });
    it('returns false for predecessor node in directed graph', function() {
      const g = new Graph();
      g.setNode('a');
      g.setNode('b');
      g.setEdge('a', 'b');
      expect(g.isLeaf('a')).to.be.false;
    });
    it('returns true for successor node in directed graph', function() {
      const g = new Graph();
      g.setNode('a');
      g.setNode('b');
      g.setEdge('a', 'b');
      expect(g.isLeaf('b')).to.be.true;
    });
  });

  describe('edges', function() {
    it('is empty if there are no edges in the graph', function() {
      const g = new Graph();
      expect(g.edges()).to.eql([]);
    });

    it('returns the keys for edges in the graph', function() {
      const g = new Graph();
      g.setEdge('a', 'b');
      g.setEdge('b', 'c');
      expect(g.edges()).to.have.deep.members([
        { v: 'a', w: 'b' },
        { v: 'b', w: 'c' },
      ]);
    });
  });

  describe('setPath', function() {
    it('creates a path of mutiple edges', function() {
      const g = new Graph();
      g.setPath(['a', 'b', 'c']);
      expect(g.hasEdge('a', 'b')).to.be.true;
      expect(g.hasEdge('b', 'c')).to.be.true;
    });

    it('can set a value for all of the edges', function() {
      const g = new Graph();
      g.setPath(['a', 'b', 'c'], 'foo');
      expect(g.edge('a', 'b')).to.equal('foo');
      expect(g.edge('b', 'c')).to.equal('foo');
    });

    it('is chainable', function() {
      const g = new Graph();
      expect(g.setPath(['a', 'b', 'c'])).to.equal(g);
    });
  });

  describe('setEdge', function() {
    it("creates the edge if it isn't part of the graph", function() {
      const g = new Graph();
      g.setNode('a');
      g.setNode('b');
      g.setEdge('a', 'b');
      expect(g.edge('a', 'b')).to.be.undefined;
      expect(g.hasEdge('a', 'b')).to.be.true;
      expect(g.hasEdge({ v: 'a', w: 'b' })).to.be.true;
      expect(g.edgeCount()).to.equal(1);
    });

    it('creates the nodes for the edge if they are not part of the graph', function() {
      const g = new Graph();
      g.setEdge('a', 'b');
      expect(g.hasNode('a')).to.be.true;
      expect(g.hasNode('b')).to.be.true;
      expect(g.nodeCount()).to.equal(2);
    });

    it("creates a multi-edge if if it isn't part of the graph", function() {
      const g = new Graph({ multigraph: true });
      g.setEdge('a', 'b', undefined, 'name');
      expect(g.hasEdge('a', 'b')).to.be.false;
      expect(g.hasEdge('a', 'b', 'name')).to.be.true;
    });

    it('throws if a multi-edge is used with a non-multigraph', function() {
      const g = new Graph();
      expect(function() {
        g.setEdge('a', 'b', undefined, 'name');
      }).to.throw();
    });

    it('changes the value for an edge if it is already in the graph', function() {
      const g = new Graph();
      g.setEdge('a', 'b', 'foo');
      g.setEdge('a', 'b', 'bar');
      expect(g.edge('a', 'b')).to.equal('bar');
    });

    it ('deletes the value for the edge if the value arg is undefined', function() {
      const g = new Graph();
      g.setEdge('a', 'b', 'foo');
      g.setEdge('a', 'b', undefined);
      expect(g.edge('a', 'b')).to.be.undefined;
      expect(g.hasEdge('a', 'b')).to.be.true;
    });

    it('changes the value for a multi-edge if it is already in the graph', function() {
      const g = new Graph({ multigraph: true });
      g.setEdge('a', 'b', 'value', 'name');
      g.setEdge('a', 'b', undefined, 'name');
      expect(g.edge('a', 'b', 'name')).to.be.undefined;
      expect(g.hasEdge('a', 'b', 'name')).to.be.true;
    });

    it('can take an edge object as the first parameter', function() {
      const g = new Graph();
      g.setEdge({ v: 'a', w: 'b' }, 'value');
      expect(g.edge('a', 'b')).to.equal('value');
    });

    it('can take an multi-edge object as the first parameter', function() {
      const g = new Graph({ multigraph: true });
      g.setEdge({ v: 'a', w: 'b', name: 'name' }, 'value');
      expect(g.edge('a', 'b', 'name')).to.equal('value');
    });

    it('accepts numeric IDs #1', function() {
      const g = new Graph<string | number>();
      g.setEdge(1, 2, 'foo');
      expect(g.edges()).eqls([{ v: 1, w: 2 }]);
      expect(g.edge('1', '2')).to.be.undefined;
      expect(g.edge(1, 2)).to.equal('foo');
    });

    it('accepts numeric IDs #2', function() {
      const g = new Graph<string | number>({ multigraph: true });
      g.setEdge(1, 2, 'foo', undefined);
      expect(g.edges()).eqls([{ v: 1, w: 2 }]);
      expect(g.edge('1', '2')).to.be.undefined;
      expect(g.edge(1, 2)).to.equal('foo');
    });

    it('accepts numeric IDs with a name', function() {
      const g = new Graph<string | number>({ multigraph: true });
      g.setEdge(1, 2, 'foo', '3');
      expect(g.edge('1', '2', '3')).to.be.undefined;
      expect(g.edge(1, 2, '3')).to.equal('foo');
      expect(g.edges()).eqls([{ v: 1, w: 2, name: '3' }]);
    });

    it('treats edges in opposite directions as distinct in a digraph', function() {
      const g = new Graph();
      g.setEdge('a', 'b');
      expect(g.hasEdge('a', 'b')).to.be.true;
      expect(g.hasEdge('b', 'a')).to.be.false;
    });

    it('handles undirected graph edges', function() {
      const g = new Graph({ directed: false });
      g.setEdge('a', 'b', 'foo');
      expect(g.edge('a', 'b')).to.equal('foo');
      expect(g.edge('b', 'a')).to.equal('foo');
    });

    it('handles undirected numeric edged', function() {
      const g = new Graph<string | number>({ directed: false });
      g.setEdge(9, 10, 'foo');
      expect(g.hasEdge('9', '10')).to.be.false;
      expect(g.hasEdge(9, 10)).to.be.true;
      expect(g.hasEdge('10', '9')).to.be.false;
      expect(g.hasEdge(10, 9)).to.be.true;
      expect(g.edge('9', '10')).to.be.undefined;
      expect(g.edge(9, 10)).eqls('foo');
    });

    it('is chainable', function() {
      const g = new Graph();
      expect(g.setEdge('a', 'b')).to.equal(g);
    });
  });

  describe('setDefaultEdgeLabel', function() {
    it('sets a default label for new edges', function() {
      const g = new Graph();
      g.setDefaultEdgeLabel('foo');
      g.setEdge('a', 'b');
      expect(g.edge('a', 'b')).to.equal('foo');
    });

    it('does not change existing edges', function() {
      const g = new Graph();
      g.setEdge('a', 'b');
      g.setDefaultEdgeLabel('foo');
      expect(g.edge('a', 'b')).to.be.undefined;
    });

    it('is not used if an explicit value is set', function() {
      const g = new Graph();
      g.setDefaultEdgeLabel('foo');
      g.setEdge('a', 'b', 'bar');
      expect(g.edge('a', 'b')).to.equal('bar');
    });

    it('can take a function', function() {
      const g = new Graph();
      g.setDefaultEdgeLabel(function() {
        return 'foo';
      });
      g.setEdge('a', 'b');
      expect(g.edge('a', 'b')).to.equal('foo');
    });

    it("can take a function that takes the edge's endpoints and name", function() {
      const g = new Graph({ multigraph: true });
      g.setDefaultEdgeLabel(function(v, w, name) {
        return `${v}-${w}-${name ?? 'undefined'}-foo`;
      });
      g.setEdge({ v: 'a', w: 'b', name: 'name'});
      expect(g.edge('a', 'b', 'name')).to.equal('a-b-name-foo');
    });

    it('does not set a default value for a multi-edge that already exists', function() {
      const g = new Graph({ multigraph: true });
      g.setEdge('a', 'b', 'old', 'name');
      g.setDefaultEdgeLabel(function() {
        return 'should not set this';
      });
      g.setEdge({ v: 'a', w: 'b', name: 'name'});
      expect(g.edge('a', 'b', 'name')).to.equal('old');
    });

    it('is chainable', function() {
      const g = new Graph();
      expect(g.setDefaultEdgeLabel('foo')).to.equal(g);
    });
  });

  describe('edge', function() {
    it("returns undefined if the edge isn't part of the graph", function() {
      const g = new Graph();
      expect(g.edge('a', 'b')).to.be.undefined;
      expect(g.edge({ v: 'a', w: 'b' })).to.be.undefined;
      expect(g.edge('a', 'b', 'foo')).to.be.undefined;
    });

    it('returns the value of the edge if it is part of the graph', function() {
      const g = new Graph<string, string, { foo: string }>();
      g.setEdge('a', 'b', { foo: 'bar' });
      expect(g.edge('a', 'b')).to.eql({ foo: 'bar' });
      expect(g.edge({ v: 'a', w: 'b' })).to.eql({ foo: 'bar' });
      expect(g.edge('b', 'a')).to.be.undefined;
    });

    it('returns the value of a multi-edge if it is part of the graph', function() {
      const g = new Graph<string, string, { bar: string }>({ multigraph: true });
      g.setEdge('a', 'b', { bar: 'baz' }, 'foo');
      expect(g.edge('a', 'b', 'foo')).to.eql({ bar: 'baz' });
      expect(g.edge('a', 'b')).to.be.undefined;
    });

    it('returns an edge in either direction in an undirected graph', function() {
      const g = new Graph<string, string, { foo: string }>({ directed: false });
      g.setEdge('a', 'b', { foo: 'bar' });
      expect(g.edge('a', 'b')).to.eql({ foo: 'bar' });
      expect(g.edge('b', 'a')).to.eql({ foo: 'bar' });
    });
  });

  describe('removeEdge', function() {
    it('has no effect if the edge is not in the graph', function() {
      const g = new Graph();
      g.removeEdge('a', 'b');
      expect(g.hasEdge('a', 'b')).to.be.false;
      expect(g.edgeCount()).to.equal(0);
    });

    it('can remove an edge by edgeObj', function() {
      const g = new Graph({ multigraph: true });
      g.setEdge({ v: 'a', w: 'b', name: 'foo' });
      g.removeEdge({ v: 'a', w: 'b', name: 'foo' });
      expect(g.hasEdge('a', 'b', 'foo')).to.be.false;
      expect(g.edgeCount()).to.equal(0);
    });

    it('can remove an edge by separate ids', function() {
      const g = new Graph({ multigraph: true });
      g.setEdge({ v: 'a', w: 'b', name: 'foo' });
      g.removeEdge('a', 'b', 'foo');
      expect(g.hasEdge('a', 'b', 'foo')).to.be.false;
      expect(g.edgeCount()).to.equal(0);
    });

    it('correctly removes neighbors', function() {
      const g = new Graph();
      g.setEdge('a', 'b');
      g.removeEdge('a', 'b');
      expect(g.successors('a')).to.eql([]);
      expect(g.neighbors('a')).to.eql([]);
      expect(g.predecessors('b')).to.eql([]);
      expect(g.neighbors('b')).to.eql([]);
    });

    it('correctly decrements neighbor counts', function() {
      const g = new Graph({ multigraph: true });
      g.setEdge('a', 'b');
      g.setEdge({ v: 'a', w: 'b', name: 'foo' });
      g.removeEdge('a', 'b');
      expect(g.hasEdge('a', 'b', 'foo'));
      expect(g.successors('a')).to.eql(['b']);
      expect(g.neighbors('a')).to.eql(['b']);
      expect(g.predecessors('b')).to.eql(['a']);
      expect(g.neighbors('b')).to.eql(['a']);
    });

    it('works with undirected graphs', function() {
      const g = new Graph({ directed: false });
      g.setEdge('h', 'g');
      g.removeEdge('g', 'h');
      expect(g.neighbors('g')).to.eql([]);
      expect(g.neighbors('h')).to.eql([]);
    });

    it('is chainable', function() {
      const g = new Graph();
      g.setEdge('a', 'b');
      expect(g.removeEdge('a', 'b')).to.equal(g);
    });
  });

  describe('inEdges', function() {
    it('returns undefined for a node that is not in the graph', function() {
      const g = new Graph();
      expect(g.inEdges('a')).to.be.undefined;
    });

    it('returns the edges that point at the specified node', function() {
      const g = new Graph();
      g.setEdge('a', 'b');
      g.setEdge('b', 'c');
      expect(g.inEdges('a')).to.have.deep.members([]);
      expect(g.inEdges('b')).to.have.deep.members([{ v: 'a', w: 'b' }]);
      expect(g.inEdges('c')).to.have.deep.members([{ v: 'b', w: 'c' }]);
    });

    it('works for multigraphs', function() {
      const g = new Graph({ multigraph: true });
      g.setEdge('a', 'b');
      g.setEdge('a', 'b', undefined, 'bar');
      g.setEdge('a', 'b', undefined, 'foo');
      expect(g.inEdges('a')).to.have.deep.members([]);
      expect(g.inEdges('b')).to.have.deep.members([
        { v: 'a', w: 'b', name: 'bar' },
        { v: 'a', w: 'b', name: 'foo' },
        { v: 'a', w: 'b' },
      ]);
    });

    it('can return only edges from a specified node', function() {
      const g = new Graph({ multigraph: true });
      g.setEdge('a', 'b');
      g.setEdge('a', 'b', undefined, 'foo');
      g.setEdge('a', 'c');
      g.setEdge('b', 'c');
      g.setEdge('z', 'a');
      g.setEdge('z', 'b');
      expect(g.inEdges('a', 'b')).to.have.deep.members([]);
      expect(g.inEdges('b', 'a')).to.have.deep.members([
        { v: 'a', w: 'b', name: 'foo' },
        { v: 'a', w: 'b' },
      ]);
    });
  });

  describe('outEdges', function() {
    it('returns undefined for a node that is not in the graph', function() {
      const g = new Graph();
      expect(g.outEdges('a')).to.be.undefined;
    });

    it('returns all edges that this node points at', function() {
      const g = new Graph();
      g.setEdge('a', 'b');
      g.setEdge('b', 'c');
      expect(g.outEdges('a')).to.have.deep.members([{ v: 'a', w: 'b' }]);
      expect(g.outEdges('b')).to.have.deep.members([{ v: 'b', w: 'c' }]);
      expect(g.outEdges('c')).to.have.deep.members([]);
    });

    it('works for multigraphs', function() {
      const g = new Graph({ multigraph: true });
      g.setEdge('a', 'b');
      g.setEdge('a', 'b', undefined, 'bar');
      g.setEdge('a', 'b', undefined, 'foo');
      expect(g.outEdges('a')).to.have.deep.members([
        { v: 'a', w: 'b', name: 'bar' },
        { v: 'a', w: 'b', name: 'foo' },
        { v: 'a', w: 'b' },
      ]);
      expect(g.outEdges('b')).to.have.deep.members([]);
    });

    it('can return only edges to a specified node', function() {
      const g = new Graph({ multigraph: true });
      g.setEdge('a', 'b');
      g.setEdge('a', 'b', undefined, 'foo');
      g.setEdge('a', 'c');
      g.setEdge('b', 'c');
      g.setEdge('z', 'a');
      g.setEdge('z', 'b');
      expect(g.outEdges('a', 'b')).to.have.deep.members([
        { v: 'a', w: 'b', name: 'foo' },
        { v: 'a', w: 'b' },
      ]);
      expect(g.outEdges('b', 'a')).to.have.deep.members([]);
    });
  });

  describe('nodeEdges', function() {
    it('returns undefined for a node that is not in the graph', function() {
      const g = new Graph();
      expect(g.nodeEdges('a')).to.be.undefined;
    });

    it('returns all edges that this node points at', function() {
      const g = new Graph();
      g.setEdge('a', 'b');
      g.setEdge('b', 'c');
      expect(g.nodeEdges('a')).to.have.deep.members([{ v: 'a', w: 'b' }]);
      expect(g.nodeEdges('b')).to.have.deep.members([{ v: 'a', w: 'b' }, { v: 'b', w: 'c' }]);
      expect(g.nodeEdges('c')).to.have.deep.members([{ v: 'b', w: 'c' }]);
    });

    it('works for multigraphs', function() {
      const g = new Graph({ multigraph: true });
      g.setEdge('a', 'b');
      g.setEdge({ v: 'a', w: 'b', name: 'bar' });
      g.setEdge({ v: 'a', w: 'b', name: 'foo' });
      expect(g.nodeEdges('a')).to.have.deep.members([
        { v: 'a', w: 'b', name: 'bar' },
        { v: 'a', w: 'b', name: 'foo' },
        { v: 'a', w: 'b' },
      ]);
      expect(g.nodeEdges('b')).to.have.deep.members([
        { v: 'a', w: 'b', name: 'bar' },
        { v: 'a', w: 'b', name: 'foo' },
        { v: 'a', w: 'b' },
      ]);
    });

    it('can return only edges between specific nodes', function() {
      const g = new Graph({ multigraph: true });
      g.setEdge('a', 'b');
      g.setEdge({ v: 'a', w: 'b', name: 'foo' });
      g.setEdge('a', 'c');
      g.setEdge('b', 'c');
      g.setEdge('z', 'a');
      g.setEdge('z', 'b');
      expect(g.nodeEdges('a', 'b')).to.have.deep.members([
        { v: 'a', w: 'b', name: 'foo' },
        { v: 'a', w: 'b' },
      ]);
      expect(g.nodeEdges('b', 'a')).to.have.deep.members([
        { v: 'a', w: 'b', name: 'foo' },
        { v: 'a', w: 'b' },
      ]);
    });
  });
});
