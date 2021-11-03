import type { NodeKey } from '../graph';
import type { Graph } from '../graph';
import { dfs } from './dfs';

export function preorder<K extends NodeKey>(g: Graph<K>, vs: K | K[]): K[] {
  return dfs(g, vs, 'pre');
}
