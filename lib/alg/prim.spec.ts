import { expect } from 'chai';
import { Graph, NodeKey, Edge } from '../graph';
import { prim } from './prim';

describe('alg.prim', function() {
  it('returns an empty graph for an empty input', function() {
    const source = new Graph<string, string, number>();

    const g = prim(source, weightFn(source));
    expect(g.nodeCount()).to.equal(0);
    expect(g.edgeCount()).to.equal(0);
  });

  it('returns a single node graph for a graph with a single node', function() {
    const source = new Graph<string, string, number>();
    source.setNode('a');

    const g = prim(source, weightFn(source));
    expect(g.nodes()).to.eql(['a']);
    expect(g.edgeCount()).to.equal(0);
  });

  it('returns a deterministic result given an optimal solution', function() {
    const source = new Graph<string, string, number>();
    source.setEdge('a', 'b',  1);
    source.setEdge('b', 'c',  2);
    source.setEdge('b', 'd',  3);
    // This edge should not be in the min spanning tree
    source.setEdge('c', 'd', 20);
    // This edge should not be in the min spanning tree
    source.setEdge('c', 'e', 60);
    source.setEdge('d', 'e',  1);

    const g = prim(source, weightFn(source));
    expect(g.neighbors('a')).to.have.members(['b']);
    expect(g.neighbors('b')).to.have.members(['a', 'c', 'd']);
    expect(g.neighbors('c')).to.have.members(['b']);
    expect(g.neighbors('d')).to.have.members(['b', 'e']);
    expect(g.neighbors('e')).to.have.members(['d']);
  });

  it('throws an Error for unconnected graphs', function() {
    const source = new Graph<string, string, number>();
    source.setNode('a');
    source.setNode('b');

    expect(() => prim(source, weightFn(source))).to.throw();
  });
});

function weightFn<K extends NodeKey,N>(g: Graph<K,N,number>): (edge: Edge<K>) => number {
  return edge => g.edge(edge);
}
