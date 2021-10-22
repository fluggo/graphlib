import type { NodeKey } from '../graph';
import Graph from '../graph';
import topsort from './topsort';

export default function isAcyclic<K extends NodeKey>(g: Graph<K>): boolean {
  try {
    topsort(g);
  }
  catch (e) {
    if(e instanceof topsort.CycleException) {
      return false;
    }
    throw e;
  }
  return true;
}
