import type { Edge, NodeKey } from '../graph';

export type WeightFunc<K extends NodeKey> = (edge: Edge<K>) => number;
export type EdgeFunc<K extends NodeKey> = (v: K) => Edge<K>[];

export interface NodeDistance<K extends NodeKey> {
  /** The distance from the source to this node. Will be **Infinity** if the node was unreachable. */
  distance: number;

  /** The previous node on this path. Will not be defined if the node was unreachable. */
  predecessor?: K;
}

export type DistanceMap<K extends NodeKey> = Map<K, NodeDistance<K>>;
