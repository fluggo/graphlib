import type Graph from '../graph';
import type { NodeKey } from '../graph';

export default function topsort<K extends NodeKey,N,E,G>(g: Graph<K,N,E,G>): K[] {
  const visited = new Set<K>();
  const stack = new Set<K>();
  const results: K[] = [];

  function visit(node: K) {
    if(stack.has(node)) {
      throw new CycleException();
    }

    if(!visited.has(node)) {
      stack.add(node);
      visited.add(node);
      g.predecessors(node)?.forEach(visit);
      stack.delete(node);
      results.push(node);
    }
  }

  g.sinks().forEach(visit);

  if(visited.size !== g.nodeCount()) {
    throw new CycleException();
  }

  return results;
}

export class CycleException extends Error {
  constructor() {
    super('Cycle error');
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = this.constructor.name;
  }
}

topsort.CycleException = CycleException;