import type { Graph, NodeKey } from '../graph';
import { dfs } from './dfs';

export function postorder<K extends NodeKey>(g: Graph<K>, vs: K | K[]): K[] {
  return dfs(g, vs, 'post');
}
