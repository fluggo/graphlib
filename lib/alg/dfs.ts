import type Graph from '../graph';
import type { NodeKey } from '../graph';

/*
 * A helper that preforms a pre- or post-order traversal on the input graph
 * and returns the nodes in the order they were visited. If the graph is
 * undirected then this algorithm will navigate using neighbors. If the graph
 * is directed then this algorithm will navigate using successors.
 *
 * Order must be one of "pre" or "post".
 */
export default function dfs<K extends NodeKey>(g: Graph<K, unknown, unknown, unknown>, vs: K | K[], order: 'pre' | 'post'): K[] {
  const vsarr = Array.isArray(vs) ? vs : [vs];
  const navigation = g.isDirected() ? g.successors.bind(g) : g.neighbors.bind(g);

  const acc: K[] = [];
  const visited = new Set<K>();
  for(const v of vsarr) {
    if(!g.hasNode(v)) {
      throw new Error(`Graph does not have node: ${String(v)}`);
    }

    doDfs(g, v, order === 'post', visited, navigation, acc);
  }
  return acc;
}

function doDfs<K extends NodeKey>(g: Graph<K, unknown, unknown, unknown>, v: K, postorder: boolean, visited: Set<K>, navigation: (v: K) => K[] | undefined, acc: K[]) {
  if(!visited.has(v)) {
    visited.add(v);

    if(!postorder) {
      acc.push(v);
    }
    for(const w of navigation(v)!) {
      doDfs(g, w, postorder, visited, navigation, acc);
    }
    if(postorder) {
      acc.push(v);
    }
  }
}
