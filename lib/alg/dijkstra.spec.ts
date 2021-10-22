import 'mocha';
import { expect } from 'chai';
import Graph from '../graph';
import dijkstra from './dijkstra';

describe('alg.dijkstra', function() {
  it('assigns distance 0 for the source node', function() {
    const g = new Graph();
    g.setNode('source');
    expect(dijkstra(g, 'source')).to.eql(new Map([['source', { distance: 0 }]]));
  });

  it('returns Infinity for unconnected nodes', function() {
    const g = new Graph();
    g.setNode('a');
    g.setNode('b');
    expect(dijkstra(g, 'a')).to.eql(new Map([
      ['a', { distance: 0 }],
      ['b', { distance: Infinity }],
    ]));
  });

  it('returns the distance and path from the source node to other nodes', function() {
    const g = new Graph();
    g.setPath(['a', 'b', 'c']);
    g.setEdge('b', 'd');
    expect(dijkstra(g, 'a')).to.eql(new Map([
      ['a', { distance: 0 }],
      ['b', { distance: 1, predecessor: 'a' }],
      ['c', { distance: 2, predecessor: 'b' }],
      ['d', { distance: 2, predecessor: 'b' }],
    ]));
  });

  it('works for undirected graphs', function() {
    const g = new Graph({ directed: false });
    g.setPath(['a', 'b', 'c']);
    g.setEdge('b', 'd');
    expect(dijkstra(g, 'a')).to.eql(new Map([
      ['a', { distance: 0 }],
      ['b', { distance: 1, predecessor: 'a' }],
      ['c', { distance: 2, predecessor: 'b' }],
      ['d', { distance: 2, predecessor: 'b' }],
    ]));
  });

  it('uses an optionally supplied weight function', function() {
    const g = new Graph<string, string, number>();
    g.setEdge('a', 'b', 1);
    g.setEdge('a', 'c', 2);
    g.setEdge('b', 'd', 3);
    g.setEdge('c', 'd', 3);

    expect(dijkstra(g, 'a', e => g.edge(e))).to.eql(new Map([
      ['a', { distance: 0 }],
      ['b', { distance: 1, predecessor: 'a' }],
      ['c', { distance: 2, predecessor: 'a' }],
      ['d', { distance: 4, predecessor: 'b' }],
    ]));
  });

  it('uses an optionally supplied edge function', function() {
    const g = new Graph();
    g.setPath(['a', 'c', 'd']);
    g.setEdge('b', 'c');

    expect(dijkstra(g, 'd', undefined, e => g.inEdges(e)!)).to.eql(new Map([
      ['a', { distance: 2, predecessor: 'c' }],
      ['b', { distance: 2, predecessor: 'c' }],
      ['c', { distance: 1, predecessor: 'd' }],
      ['d', { distance: 0 }],
    ]));
  });

  it('throws an Error if it encounters a negative edge weight', function() {
    const g = new Graph<string, string, number>();
    g.setEdge('a', 'b',  1);
    g.setEdge('a', 'c', -2);
    g.setEdge('b', 'd',  3);
    g.setEdge('c', 'd',  3);

    expect(() => dijkstra(g, 'a', e => g.edge(e))).to.throw();
  });
});
