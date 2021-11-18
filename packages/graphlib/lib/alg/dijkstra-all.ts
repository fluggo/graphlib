import type { Graph, NodeKey } from '../graph';
import type { DistanceMap, WeightFunc, EdgeFunc } from './types';
import { dijkstra } from './dijkstra';

export function dijkstraAll<K extends NodeKey>(g: Graph<K>, weightFunc?: WeightFunc<K>, edgeFunc?: EdgeFunc<K>): Map<K, DistanceMap<K>> {
  return new Map(g.nodes().map(v => [v, dijkstra(g, v, weightFunc, edgeFunc)]));
}
