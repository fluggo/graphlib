import Graph, { Edge, NodeKey } from '../graph';
import PriorityQueue from '../data/priority-queue';

export default function prim<K extends NodeKey>(g: Graph<K>, weightFunc: (edge: Edge<K>) => number): Graph<K> {
  const result = new Graph<K>();
  const parents = new Map<K, K>();
  const pq = new PriorityQueue<K>();

  if(g.nodeCount() === 0) {
    return result;
  }

  for(const v of g.nodes()) {
    pq.add(v, Number.POSITIVE_INFINITY);
    result.setNode(v);
  }

  // Start from an arbitrary node
  pq.decrease(g.nodes()[0], 0);

  let init = false;
  while(pq.size() > 0) {
    const v = pq.removeMin();
    const parent = parents.get(v);
    if(parent !== undefined) {
      result.setEdge(v, parent);
    }
    else if(init) {
      throw new Error('Input graph is not connected');
    }
    else {
      init = true;
    }

    for(const edge of g.nodeEdges(v)!) {
      const w = edge.v === v ? edge.w : edge.v;
      const pri = pq.priority(w);
      if(pri !== undefined) {
        const edgeWeight = weightFunc(edge);
        if(edgeWeight < pri) {
          parents.set(w, v);
          pq.decrease(w, edgeWeight);
        }
      }
    }
  }

  return result;
}
