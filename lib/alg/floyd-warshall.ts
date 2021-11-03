import type { NodeKey } from '../graph';
import type { Graph } from '../graph';
import type { DistanceMap, WeightFunc, EdgeFunc } from './types';

function defaultWeightFunc() {
  return 1;
}

/**
 * Computes the distances between nodes using the [Floyd–Warshall algorithm](https://en.wikipedia.org/wiki/Floyd%E2%80%93Warshall_algorithm).
 *
 * Performance is O(v³), where **v** is the number of nodes in the graph.
 *
 * @param g Graph to analyze.
 * @param weightFn Optional function to determine the "distance" or "cost" of an edge. By default, all edges have a weight (distance) of one.
 * @param edgeFn Optional function to produce valid edges from the given node. By default, all outbound edges are considered.
 * @returns A two-level map of nodes to other nodes and their distances. You can obtain the shortest path between any two nodes
 *   by querying the source node followed by the target node and following the **predecessor** properties back to the source node.
 */
export function floydWarshall<K extends NodeKey>(g: Graph<K>, weightFn?: WeightFunc<K>, edgeFn?: EdgeFunc<K>): Map<K, DistanceMap<K>> {
  return runFloydWarshall(g,
    weightFn ?? defaultWeightFunc,
    edgeFn ?? (v => g.outEdges(v)!));
}

function runFloydWarshall<K extends NodeKey>(g: Graph<K>, weightFn: WeightFunc<K>, edgeFn: EdgeFunc<K>): Map<K, DistanceMap<K>> {
  const results = new Map<K, DistanceMap<K>>();
  const nodes = g.nodes();

  for(const v of nodes) {
    const distMap: DistanceMap<K> = new Map(nodes.map(w => [w, { distance: v === w ? 0 : Infinity }]));
    results.set(v, distMap);

    for(const edge of edgeFn(v)) {
      const w = edge.v === v ? edge.w : edge.v;
      distMap.set(w, { distance: weightFn(edge), predecessor: v });
    }
  }

  for(const k of nodes) {
    const rowK = results.get(k)!;

    for(const i of nodes) {
      const rowI = results.get(i)!;

      for(const j of nodes) {
        const ik = rowI.get(k)!;
        const kj = rowK.get(j)!;
        const ij = rowI.get(j)!;
        const altDistance = ik.distance + kj.distance;
        if(altDistance < ij.distance) {
          ij.distance = altDistance;
          ij.predecessor = kj.predecessor;
        }
      }
    }
  }

  return results;
}
