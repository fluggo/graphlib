import { expect } from 'chai';
import { Graph } from '@fluggo/graphlib';
import { read } from './read-one';
import { write } from './write-one';

describe('write', function() {
  it('can write an empty digraph', function() {
    const str = write(new Graph());
    const g = read(str);
    expect(g.nodeCount()).to.equal(0);
    expect(g.edgeCount()).to.equal(0);
    expect(g.graph()).to.deep.equal({});
    expect(g.isDirected()).to.be.true;
  });

  it('can write an empty undirected graph', function() {
    const str = write(new Graph({ directed: false }));
    const g = read(str);
    expect(g.nodeCount()).to.equal(0);
    expect(g.edgeCount()).to.equal(0);
    expect(g.graph()).to.deep.equal({});
    expect(g.isDirected()).to.be.false;
  });

  it('can write a graph label with an object', function() {
    const g = new Graph();
    g.setGraph({ foo: 'bar' });
    const str = write(g);
    const g2 = read(str);
    expect(g2.graph()).to.deep.equal({ foo: 'bar' });
  });

  it('can write a node', function() {
    const g = new Graph();
    g.setNode('n1');
    const str = write(g);
    const g2 = read(str);
    expect(g2.hasNode('n1')).to.be.true;
    expect(g2.node('n1')).to.deep.equal({});
    expect(g2.nodeCount()).to.equal(1);
    expect(g2.edgeCount()).to.equal(0);
  });

  it('can write a node with attributes', function() {
    const g = new Graph();
    g.setNode('n1', { foo: 'bar' });
    const str = write(g);
    const g2 = read(str);
    expect(g2.hasNode('n1'));
    expect(g2.node('n1')).to.deep.equal({ foo: 'bar' });
    expect(g2.nodeCount()).to.equal(1);
    expect(g2.edgeCount()).to.equal(0);
  });

  it('can write an edge', function() {
    const g = new Graph();
    g.setEdge('n1', 'n2');
    const str = write(g);
    const g2 = read(str);
    expect(g2.edge('n1', 'n2')).to.deep.equal({});
    expect(g2.nodeCount()).to.equal(2);
    expect(g2.edgeCount()).to.equal(1);
  });

  it('can write an edge with attributes', function() {
    const g = new Graph();
    g.setEdge('n1', 'n2', { foo: 'bar' });
    const str = write(g);
    const g2 = read(str);
    expect(g2.edge('n1', 'n2')).to.deep.equal({ foo: 'bar' });
    expect(g2.nodeCount()).to.equal(2);
    expect(g2.edgeCount()).to.equal(1);
  });

  it('can write multi-edges', function() {
    const g = new Graph({ multigraph: true });
    g.setEdge('n1', 'n2', { foo: 'bar' });
    g.setEdge('n1', 'n2', { foo: 'baz' }, 'another');
    const str = write(g);
    const g2 = read(str);
    expect(g2.nodeEdges('n1', 'n2')).to.have.length(2);
    const edgeAttrs = (g2.nodeEdges('n1', 'n2') ?? []).map(edge => g2.edge(edge));
    expect(edgeAttrs).to.have.deep.members([
      { foo: 'bar' },
      { foo: 'baz' },
    ]);
    expect(g2.nodeCount()).to.equal(2);
    expect(g2.edgeCount()).to.equal(2);
  });

  it('preserves the strict (non-multigraph) state', function() {
    const g = new Graph();
    const str = write(g);
    const g2 = read(str);
    expect(g2.isMultigraph()).to.be.false;
  });

  it('can write ids that must be escaped', function() {
    const g = new Graph();
    g.setNode('"n1"');
    const str = write(g);
    const g2 = read(str);
    expect(g2.hasNode('"n1"')).to.be.true;
    expect(g2.node('"n1"')).to.deep.equal({});
    expect(g2.nodeCount()).to.equal(1);
    expect(g2.edgeCount()).to.equal(0);
  });

  it('can write subgraphs', function() {
    const g = new Graph({ compound: true });
    g.setParent('n1', 'root');
    const str = write(g);
    const g2 = read(str);
    expect(g2.hasNode('n1')).to.be.true;
    expect(g2.hasNode('root')).to.be.true;
    expect(g2.parent('n1')).to.equal('root');
    expect(g2.nodeCount()).to.equal(2);
    expect(g2.edgeCount()).to.equal(0);
  });

  it('can write subgraphs with attributes', function() {
    const g = new Graph({ compound: true });
    g.setParent('n1', 'root');
    g.setNode('root', { foo: 'bar' });
    const str = write(g);
    const g2 = read(str);
    expect(g2.hasNode('n1')).to.be.true;
    expect(g2.hasNode('root')).to.be.true;
    expect(g2.node('root')).to.deep.equal({ foo: 'bar' });
    expect(g2.parent('n1')).to.equal('root');
    expect(g2.nodeCount()).to.equal(2);
    expect(g2.edgeCount()).to.equal(0);
  });
});
