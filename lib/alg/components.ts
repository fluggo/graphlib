import type { NodeKey } from '../graph';
import type Graph from '../graph';

export default function components<K extends NodeKey>(g: Graph<K>): K[][] {
  const visited = new Set<K>();
  const cmpts: K[][] = [];

  function dfs(v: K, cmpt: K[]) {
    if(visited.has(v))
      return;

    visited.add(v);
    cmpt.push(v);

    for(const w of g.successors(v)!)
      dfs(w, cmpt);

    for(const w of g.predecessors(v)!)
      dfs(w, cmpt);
  }

  for(const v of g.nodes()) {
    const cmpt: K[] = [];

    dfs(v, cmpt);

    if(cmpt.length) {
      cmpts.push(cmpt);
    }
  }

  return cmpts;
}
