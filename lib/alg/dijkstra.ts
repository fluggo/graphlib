import type { NodeKey } from '../graph';
import type { DistanceMap, NodeDistance, WeightFunc, EdgeFunc } from './types';
import { PriorityQueue } from '../data/priority-queue';
import type { Graph } from '../graph';

function defaultWeightFunc() {
  return 1;
}

/**
 * Uses [Dijkstra's algorithm](https://en.wikipedia.org/wiki/Dijkstra%27s_algorithm) to find the distance from the given **source** node
 * to all the other nodes in the graph.
 * @param g The graph to inspect.
 * @param source The source node.
 * @param weightFn Optional function to determine the "distance" or "cost" of an edge. By default, all edges have a weight (distance) of one.
 * @param edgeFn Optional function to produce valid edges from the given node. By default, all outbound edges are considered.
 * @returns A map of nodes to their distances. You can obtain the shortest path between the **source** node and node in the map
 *   by finding the target node and following the **predecessor** properties back to the **source** node.
 */
export function dijkstra<K extends NodeKey>(g: Graph<K>, source: K, weightFn?: WeightFunc<K>, edgeFn?: EdgeFunc<K>): DistanceMap<K> {
  return runDijkstra(g, source,
    weightFn ?? defaultWeightFunc,
    edgeFn ?? (v => g.outEdges(v)!));
}

function runDijkstra<K extends NodeKey>(g: Graph<K>, source: K, weightFn: WeightFunc<K>, edgeFn: EdgeFunc<K>): DistanceMap<K> {
  const results = new Map<K, NodeDistance<K>>(g.nodes().map(v => [v, { distance: v === source ? 0 : Infinity }]));
  const pq = new PriorityQueue<K>();
  let vEntry;

  for(const v of g.nodes()) {
    const distance = v === source ? 0 : Infinity;
    results.set(v, { distance: distance });
    pq.add(v, distance);
  }

  while(pq.size() > 0) {
    const v = pq.removeMin();
    vEntry = results.get(v)!;
    if(vEntry.distance === Infinity) {
      break;
    }

    for(const edge of edgeFn(v)) {
      const w = edge.v !== v ? edge.v : edge.w;
      const wEntry = results.get(w)!;
      const weight = weightFn(edge);
      const distance = vEntry.distance + weight;

      if(weight < 0) {
        throw new Error(`dijkstra does not allow negative edge weights. Bad edge: ${JSON.stringify(edge)} Weight: ${weight}`);
      }

      if(distance < wEntry.distance) {
        wEntry.distance = distance;
        wEntry.predecessor = v;
        pq.decrease(w, distance);
      }
    }
  }

  return results;
}
