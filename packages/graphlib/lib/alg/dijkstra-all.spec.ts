import { expect } from 'chai';
import { Graph } from '../graph';
import { dijkstraAll } from './dijkstra-all';
import * as allShortestPathsTest from './all-shortest-paths.spec';

describe('alg.dijkstraAll', function() {
  allShortestPathsTest.tests(dijkstraAll);

  it('throws an Error if it encounters a negative edge weight', function() {
    const g = new Graph<string, string, number>();
    g.setEdge('a', 'b',  1);
    g.setEdge('a', 'c', -2);
    g.setEdge('b', 'd',  3);
    g.setEdge('c', 'd',  3);

    expect(() => dijkstraAll(g, e => g.edge(e))).to.throw();
  });
});
