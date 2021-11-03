import { expect } from 'chai';
import Graph from '../graph';
import floydWarshall from './floyd-warshall';
import * as allShortestPathsTest from './all-shortest-paths.spec';

describe('alg.floydWarshall', function() {
  allShortestPathsTest.tests(floydWarshall);

  it('handles negative weights', function() {
    const g = new Graph<string, string, number>();
    g.setEdge('a', 'b',  1);
    g.setEdge('a', 'c', -2);
    g.setEdge('b', 'd',  3);
    g.setEdge('c', 'd',  3);

    expect(floydWarshall(g, e => g.edge(e))).to.eql(new Map([
      ['a', new Map([
        ['a', { distance:  0 }],
        ['b', { distance:  1, predecessor: 'a' }],
        ['c', { distance: -2, predecessor: 'a' }],
        ['d', { distance:  1, predecessor: 'c' }],
      ])],
      ['b', new Map([
        ['a', { distance: Infinity }],
        ['b', { distance: 0 }],
        ['c', { distance: Infinity }],
        ['d', { distance: 3, predecessor: 'b' }],
      ])],
      ['c', new Map([
        ['a', { distance: Infinity }],
        ['b', { distance: Infinity }],
        ['c', { distance: 0 }],
        ['d', { distance: 3, predecessor: 'c' }],
      ])],
      ['d', new Map([
        ['a', { distance: Infinity }],
        ['b', { distance: Infinity }],
        ['c', { distance: Infinity }],
        ['d', { distance: 0 }],
      ])],
    ]));
  });

  it('does include negative weight self edges', function() {
    const g = new Graph<string, string, number>();
    g.setEdge('a', 'a', -1);

    // In the case of a negative cycle the distance is not well-defined beyond
    // having a negative value along the diagonal.
    expect(floydWarshall(g, e => g.edge(e))).to.eql(new Map([
      ['a', new Map([
        ['a', { distance: -2, predecessor: 'a' }],
      ])],
    ]));
  });
});
