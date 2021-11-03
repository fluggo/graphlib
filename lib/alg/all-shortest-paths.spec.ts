import { expect } from 'chai';
import Graph from '../graph';
import { DistanceMap, WeightFunc, EdgeFunc } from './types';

export function tests(sp: (g: Graph<string>, w?: WeightFunc<string>, e?: EdgeFunc<string>) => Map<string, DistanceMap<string>>): void {
  describe('allShortestPaths', function() {
    it('returns 0 for the node itself', function() {
      const g = new Graph();
      g.setNode('a');
      expect(sp(g)).to.eql(new Map([['a', new Map([['a', { distance: 0 }]])]]));
    });

    it('returns the distance and path from all nodes to other nodes', function() {
      const g = new Graph();
      g.setEdge('a', 'b');
      g.setEdge('b', 'c');
      expect(sp(g)).to.eql(new Map([
        ['a', new Map([
          ['a', { distance: 0 }],
          ['b', { distance: 1, predecessor: 'a' }],
          ['c', { distance: 2, predecessor: 'b' }],
        ])],
        ['b', new Map([
          ['a', { distance: Infinity }],
          ['b', { distance: 0 }],
          ['c', { distance: 1, predecessor: 'b' }],
        ])],
        ['c', new Map([
          ['a', { distance: Infinity }],
          ['b', { distance: Infinity }],
          ['c', { distance: 0 }],
        ])],
      ]));
    });

    it('uses an optionally supplied weight function', function() {
      const g = new Graph<string, string, number>();
      g.setEdge('a', 'b', 2);
      g.setEdge('b', 'c', 3);

      expect(sp(g, e => g.edge(e))).to.eql(new Map([
        ['a', new Map([
          ['a', { distance: 0 }],
          ['b', { distance: 2, predecessor: 'a' }],
          ['c', { distance: 5, predecessor: 'b' }],
        ])],
        ['b', new Map([
          ['a', { distance: Infinity }],
          ['b', { distance: 0 }],
          ['c', { distance: 3, predecessor: 'b' }],
        ])],
        ['c', new Map([
          ['a', { distance: Infinity }],
          ['b', { distance: Infinity }],
          ['c', { distance: 0 }],
        ])],
      ]));
    });

    it('uses an optionally supplied incident function', function() {
      const g = new Graph();
      g.setEdge('a', 'b');
      g.setEdge('b', 'c');

      expect(sp(g, undefined, v => g.inEdges(v)!)).to.eql(new Map([
        ['a', new Map([
          ['a', { distance: 0 }],
          ['b', { distance: Infinity }],
          ['c', { distance: Infinity }],
        ])],
        ['b', new Map([
          ['a', { distance: 1, predecessor: 'b' }],
          ['b', { distance: 0 }],
          ['c', { distance: Infinity }],
        ])],
        ['c', new Map([
          ['a', { distance: 2, predecessor: 'b' }],
          ['b', { distance: 1, predecessor: 'c' }],
          ['c', { distance: 0 }],
        ])],
      ]));
    });

    it('works with undirected graphs', function() {
      const g = new Graph<string, string, number>({ directed: false });
      g.setEdge('a', 'b', 1);
      g.setEdge('b', 'c', 2);
      g.setEdge('c', 'a', 4);
      g.setEdge('b', 'd', 6);

      expect(sp(g, e => g.edge(e), v => g.nodeEdges(v)!)).to.eql(new Map([
        ['a', new Map([
          ['a', { distance: 0 }],
          ['b', { distance: 1, predecessor: 'a' }],
          ['c', { distance: 3, predecessor: 'b' }],
          ['d', { distance: 7, predecessor: 'b' }],
        ])],
        ['b', new Map([
          ['a', { distance: 1, predecessor: 'b' }],
          ['b', { distance: 0 }],
          ['c', { distance: 2, predecessor: 'b' }],
          ['d', { distance: 6, predecessor: 'b' }],
        ])],
        ['c', new Map([
          ['a', { distance: 3, predecessor: 'b' }],
          ['b', { distance: 2, predecessor: 'c' }],
          ['c', { distance: 0 }],
          ['d', { distance: 8, predecessor: 'b' }],
        ])],
        ['d', new Map([
          ['a', { distance: 7, predecessor: 'b' }],
          ['b', { distance: 6, predecessor: 'd' }],
          ['c', { distance: 8, predecessor: 'b' }],
          ['d', { distance: 0 }],
        ])],
      ]));
    });
  });
}
