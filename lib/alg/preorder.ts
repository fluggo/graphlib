import type Graph from '../graph';
import type { NodeKey } from '../graph';
import dfs from './dfs';

export default function preorder<K extends NodeKey>(g: Graph<K, unknown, unknown, unknown>, vs: K | K[]): K[] {
  return dfs(g, vs, 'pre');
}