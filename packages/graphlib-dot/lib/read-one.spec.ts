import { expect } from 'chai';
import { read } from './read-one';

describe('read', function() {
  describe('graph', function() {
    it('can read an empty digraph', function() {
      const g = read('digraph {}');
      expect(g.nodeCount()).to.equal(0);
      expect(g.edgeCount()).to.equal(0);
      expect(g.graph()).to.deep.equal({});
      expect(g.isDirected()).to.be.true;
      expect(g.isMultigraph()).to.be.true;
    });

    it('can read an empty graph', function() {
      const g = read('graph {}');
      expect(g.nodeCount()).to.equal(0);
      expect(g.edgeCount()).to.equal(0);
      expect(g.graph()).to.deep.equal({});
      expect(g.isDirected()).to.be.false;
      expect(g.isMultigraph()).to.be.true;
    });

    it('can read a strict graph', function() {
      const g = read('strict digraph {}');
      expect(g.isMultigraph()).to.be.false;
    });

    it('can handle leading and trailing whitespace', function() {
      const g = read(' digraph {} ');
      expect(g.nodeCount()).to.equal(0);
      expect(g.edgeCount()).to.equal(0);
      expect(g.graph()).to.deep.equal({});
      expect(g.isDirected()).to.be.true;
    });

    it('safely incorporates the id for the graph', function() {
      const g = read('digraph foobar {}');
      expect(g.nodeCount()).to.equal(0);
      expect(g.edgeCount()).to.equal(0);
      expect(g.graph()).to.deep.equal({id: 'foobar'});
      expect(g.isDirected()).to.be.true;
    });

    it('can read graph attributes', function() {
      const g = read('digraph { foo = bar; }');
      expect(g.graph()).deep.equal({ foo: 'bar' });
    });

    it('can handle various forms of whitespace', function() {
      const g = read('digraph {\tfoo\r=bar\n; }');
      expect(g.graph()).to.deep.equal({ foo: 'bar' });
    });
  });

  describe('comments', function() {
    it('ignores single-line comments', function() {
      const g = read('digraph { a //comment\n }');
      expect(g.hasNode('a')).to.be.true;
    });

    it('ignores multi-line comments', function() {
      const g = read('digraph { a /*comment*/\n }');
      expect(g.hasNode('a')).to.be.true;
    });
  });

  describe('nodes', function() {
    it('can read a single node graph', function() {
      const g = read('digraph { a }');
      expect(g.nodeCount()).to.equal(1);
      expect(g.hasNode('a')).to.be.true;
      expect(g.edgeCount()).to.equal(0);
    });

    it('can read a node with an attribute', function() {
      const g = read('digraph { a [label=foo]; }');
      expect(g.node('a')).to.deep.equal({ label: 'foo' });
    });

    it('can read a node with a quoted attribute', function() {
      const g = read('digraph { a [label="foo and bar"]; }');
      expect(g.node('a')).to.deep.equal({ label: 'foo and bar' });
    });

    it('can read a node with comma-separated attributes', function() {
      const g = read('digraph { a [label=l, foo=f, bar=b]; }');
      expect(g.node('a')).to.deep.equal({ label: 'l', foo: 'f', bar: 'b' });
    });

    it('can read a node with space-separated attributes', function() {
      const g = read('digraph { a [label=l foo=f bar=b]; }');
      expect(g.node('a')).to.deep.equal({ label: 'l', foo: 'f', bar: 'b' });
    });

    it('can read a node with multiple attr defs', function() {
      const g = read('digraph { a [label=l] [foo=1] [foo=2]; }');
      expect(g.node('a')).to.deep.equal({ label: 'l', foo: '2' });
    });

    it('can read nodes with numeric ids', function() {
      const list = ['12', '-12', '12.34', '-12.34', '.34', '-.34', '12.', '-12.'];
      const g = read('digraph { ' + list.join(';') + ' }');
      expect(g.nodes()).to.have.members(list);
    });

    it('can read escaped quotes', function() {
      expect(read('digraph { "\\"a\\"" }').nodes()).to.have.members(['"a"']);
    });

    it('preserves non-quote escapes', function() {
      expect(read('digraph { "foo\\-bar" }').nodes()).to.have.members(['foo\\-bar']);
    });

    it('can read quoted unicode', function() {
      const g = read('digraph { "♖♘♗♕♔♗♘♖" }');
      expect(g.nodes()).to.have.members(['♖♘♗♕♔♗♘♖']);
    });

    it('fails to read unquoted unicode', function() {
      expect(function() {
        read('digraph { ♖♘♗♕♔♗♘♖ }');
      }).to.throw();
    });

    it('treats a number id followed by a letter as two nodes', function() {
      // Yes this is what the language specifies!
      const g = read('digraph { 123a }');
      expect(g.nodes()).to.have.members(['123', 'a']);
    });

    it('ignores node ports', function() {
      const g = read('digraph { a:port }');
      expect(g.node('a')).to.deep.equal({});
    });

    const compass = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw', 'c', '_'];
    it('ignores node compass', function() {
      for(const c of compass) {
        expect(read('digraph { a:' + c + ' }').node('a')).to.deep.equal({});
        expect(read('digraph { a : ' + c + ' }').node('a')).to.deep.equal({});
      }
    });

    it('ignores node port compass', function() {
      for(const c of compass) {
        expect(read('digraph { a:port:' + c + ' }').node('a')).to.deep.equal({});
        expect(read('digraph { a : port : ' + c + ' }').node('a')).to.deep.equal({});
      }
    });
  });

  describe('edges', function() {
    it('can read an unlabelled undirected edge', function() {
      const g = read('strict graph { a -- b }');
      expect(g.edgeCount()).to.equal(1);
      expect(g.edge('a', 'b')).to.deep.equal({});
    });

    it('fails if reading an undirected edge in a directed graph', function() {
      expect(function() {
        read('graph { a -> b }');
      }).to.throw();
    });

    it('can read an unlabelled directed edge', function() {
      const g = read('strict digraph { a -> b }');
      expect(g.edgeCount()).to.equal(1);
      expect(g.edge('a', 'b')).to.deep.equal({});
    });

    it('fails if reading a directed edge in an undirected graph', function() {
      expect(function() {
        read('digraph { a -- b }');
      }).to.throw();
    });

    it('can read an edge with attributes', function() {
      const g = read('strict digraph { a -> b [label=foo]; }');
      expect(g.edge('a', 'b')).to.deep.equal({ label: 'foo' });
    });

    it('can assign attributes to a path of nodes', function() {
      const g = read('strict digraph { a -> b -> c [label=foo]; }');
      expect(g.edge('a', 'b')).to.deep.equal({ label: 'foo' });
      expect(g.edge('b', 'c')).to.deep.equal({ label: 'foo' });
      expect(g.edgeCount()).to.equal(2);
    });

    it('assigns multiple labels if an edge is defined multiple times', function() {
      const g = read('digraph { a -> b [x=1 z=3]; a -> b [y=2 z=4] }');
      const results = g.nodeEdges('a', 'b')!.map(edge => g.edge(edge));
      expect(results).to.have.deep.members([
        { x: '1', z: '3' },
        { y: '2', z: '4' },
      ]);
      expect(g.edgeCount()).to.equal(2);
    });

    it('updates an edge if it is defined multiple times in strict mode', function() {
      const g = read('strict digraph { a -> b [x=1 z=3]; a -> b [y=2 z=4] }');
      expect(g.edge('a', 'b')).to.deep.equal({ x: '1', y: '2', z: '4' });
      expect(g.edgeCount()).to.equal(1);
    });
  });

  describe('subgraphs', function() {
    it('ignores empty subgraphs', function() {
      expect(read('digraph { subgraph X {} }').nodes()).to.be.empty;
      expect(read('digraph { subgraph {} }').nodes()).to.be.empty;
      expect(read('digraph { {} }').nodes()).to.be.empty;
    });

    it('reads nodes in a subgraph', function() {
      const g = read('digraph { subgraph X { a; b }; c }');
      expect(g.nodes()).to.have.members(['X', 'a', 'b', 'c']);
      expect(g.children()).to.have.members(['X', 'c']);
      expect(g.children('X')).to.have.members(['a', 'b']);
    });

    it('assigns a node to the first subgraph in which it appears', function() {
      const g = read('digraph { subgraph X { a }; subgraph Y { a; b } }');
      expect(g.parent('a')).to.equal('X');
      expect(g.parent('b')).to.equal('Y');
    });

    it('reads edges in a subgraph', function() {
      const g = read('strict digraph { subgraph X { a; b; a -> b } }');
      expect(g.nodes()).to.have.members(['X', 'a', 'b']);
      expect(g.children('X')!).to.have.members(['a', 'b']);
      expect(g.edge('a', 'b')).to.deep.equal({});
      expect(g.edgeCount()).to.equal(1);
    });

    it('assigns graph attributes to the subgraph in which they appear', function() {
      const g = read('strict digraph { subgraph X { foo=bar; a } }');
      expect(g.graph()).to.deep.equal({});
      expect(g.node('X')).to.deep.equal({ foo: 'bar' });
    });

    it('reads anonymous subgraphs #1', function() {
      const g = read('digraph { subgraph { a } }');
      expect(g.parent('a')).to.not.be.undefined;
      expect(g.parent(g.parent('a')!)).to.be.undefined;
    });

    it('reads anonymous subgraphs #2', function() {
      const g = read('digraph { { a } }');
      expect(g.parent('a')).to.not.be.undefined;
      expect(g.parent(g.parent('a')!)).to.be.undefined;
    });

    it('reads subgraphs as the LHS of an edge statement', function() {
      const g = read('digraph { {a; b} -> c }');
      expect(g.hasEdge('a', 'c')).to.be.true;
      expect(g.hasEdge('b', 'c')).to.be.true;
      expect(g.edgeCount()).to.equal(2);
    });

    it('reads subgraphs as the RHS of an edge statement', function() {
      const g = read('digraph { a -> { b; c } }');
      expect(g.hasEdge('a', 'b')).to.be.true;
      expect(g.hasEdge('a', 'c')).to.be.true;
      expect(g.edgeCount()).to.equal(2);
    });

    it('handles subgraphs with edges as an LHS of another edge statment', function() {
      const g = read('digraph { {a -> b} -> c }');
      expect(g.hasEdge('a', 'b')).to.be.true;
      expect(g.hasEdge('a', 'c')).to.be.true;
      expect(g.hasEdge('b', 'c')).to.be.true;
      expect(g.edgeCount()).to.equal(3);
    });

    it('reads subgraphs as both the LHS and RHS side of an edge statement', function() {
      const g = read('digraph { { a; b } -> { c; d } }');
      expect(g.hasEdge('a', 'c')).to.be.true;
      expect(g.hasEdge('a', 'd')).to.be.true;
      expect(g.hasEdge('b', 'c')).to.be.true;
      expect(g.hasEdge('b', 'd')).to.be.true;
      expect(g.edgeCount()).to.equal(4);
    });

    it('applies edges attributes when using subgraphs as LHS or RHS', function() {
      const g = read('strict digraph { { a; b } -> { c; d } [foo=bar] }');
      expect(g.edge('a', 'c')).to.deep.equal({ foo: 'bar' });
      expect(g.edge('a', 'd')).to.deep.equal({ foo: 'bar' });
      expect(g.edge('b', 'c')).to.deep.equal({ foo: 'bar' });
      expect(g.edge('b', 'd')).to.deep.equal({ foo: 'bar' });
      expect(g.edgeCount()).to.equal(4);
    });
  });

  describe('defaults', function() {
    it('adds default attributes to nodes', function() {
      const g = read('digraph { node [color=black]; a [label=foo]; b [label=bar] }');
      expect(g.node('a')).to.deep.equal({ color: 'black', label: 'foo' });
      expect(g.node('b')).to.deep.equal({ color: 'black', label: 'bar' });
    });

    it('can apply multiple node defaults', function() {
      const g = read('digraph { node[color=black]; node[shape=box]; a [label=foo] }');
      expect(g.node('a')).to.deep.equal({ color: 'black', shape: 'box', label: 'foo' });
    });

    it('only applies defaults already visited', function() {
      const g = read('digraph { node[color=black]; a; node[shape=box]; b; }');
      expect(g.node('a')).to.deep.equal({ color: 'black' });
      expect(g.node('b')).to.deep.equal({ color: 'black', shape: 'box' });
    });

    it('only applies defaults to nodes created in the subgraph', function() {
      const g = read('digraph { a; { node[color=black]; a; b; } }');
      expect(g.node('a')).to.deep.equal({});
      expect(g.node('b')).to.deep.equal({ color: 'black' });
    });

    it('allows defaults to redefined', function() {
      const g = read('digraph { node[color=black]; a; node[color=green]; b; }');
      expect(g.node('a')).to.deep.equal({ color: 'black' });
      expect(g.node('b')).to.deep.equal({ color: 'green' });
    });

    it('applies defaults to nodes created through an edge statement', function() {
      const g = read('digraph { node[color=black]; a -> b; }');
      expect(g.node('a')).to.deep.equal({ color: 'black' });
      expect(g.node('b')).to.deep.equal({ color: 'black' });
    });

    it('applies defaults to subgraphs', function() {
      const g = read('digraph { node[color=black]; { a; { b; c[color=green]; } } }');
      expect(g.node('a')).to.deep.equal({ color: 'black' });
      expect(g.node('b')).to.deep.equal({ color: 'black' });
      expect(g.node('c')).to.deep.equal({ color: 'green' });
    });

    it('applies defaults to edges', function() {
      const g = read('strict digraph { edge[color=black]; a -> b }');
      expect(g.node('a')).to.deep.equal({});
      expect(g.node('b')).to.deep.equal({});
      expect(g.edge('a', 'b')).to.deep.equal({ color: 'black' });
    });
  });

  describe('failure cases', function() {
    it('fails if the graph block is not closed', function() {
      expect(function() {
        read('digraph {');
      }).to.throw();
    });

    it('fails if an attribute block is not closed', function() {
      expect(function() {
        read('digraph { a [k=v}');
      }).to.throw();
    });

    it('fails if an attribute is missing a key', function() {
      expect(function() {
        read('digraph { a [=v] }');
      }).to.throw();
    });

    it('fails if an attribute is missing a value', function() {
      expect(function() {
        read('digraph { a [k=] }');
      }).to.throw();
    });

    it('fails if an edge is missing an LHS', function() {
      expect(function() {
        read('digraph { -> b }');
      }).to.throw();
    });

    it('fails if an edge is missing an RHS', function() {
      expect(function() {
        read('digraph { a -> }');
      }).to.throw();
    });

    it('fails if a subgraph is left unclosed', function() {
      expect(function() {
        read('digraph { { a ');
      }).to.throw();
    });

    it('fails if a new subgraph is opened after a previous one', function() {
      expect(function() {
        read('digraph {} digraph {}');
      }).to.throw();
    });
  });

  it('applies the correct defaults to a node or a subgraph');
});
