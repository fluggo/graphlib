import type Graph from '../graph';
import type { NodeKey } from '../graph';

interface VisitedEntry {
  onStack: boolean;
  lowlink: number;
  index: number;
}

export default function tarjan<K extends NodeKey,N,E,G>(g: Graph<K,N,E,G>): K[][] {
  let index = 0;
  const stack: K[] = [];
  const visited = new Map<K, VisitedEntry>();
  const results: K[][] = [];

  function dfs(v: K) {
    const entry = {
      onStack: true,
      lowlink: index,
      index: index++,
    };
    visited.set(v, entry);
    stack.push(v);

    for(const w of g.successors(v)!) {
      const subEntry = visited.get(w);

      if(!subEntry) {
        dfs(w);
        entry.lowlink = Math.min(entry.lowlink, visited.get(w)!.lowlink);
        continue;
      }

      if(subEntry.onStack) {
        entry.lowlink = Math.min(entry.lowlink, visited.get(w)!.index);
      }
    }

    if(entry.lowlink === entry.index) {
      const cmpt: K[] = [];
      let w: K;
      do {
        w = stack.pop()!;
        visited.get(w)!.onStack = false;
        cmpt.push(w);
      } while(v !== w);
      results.push(cmpt);
    }
  }

  for(const v of g.nodes()) {
    if(!visited.has(v)) {
      dfs(v);
    }
  }

  return results;
}
