import type { NodeKey } from '../graph';
import type Graph from '../graph';
import tarjan from './tarjan';

export default function findCycles<K extends NodeKey>(g: Graph<K>): K[][] {
  return tarjan(g).filter(cmpt => {
    return cmpt.length > 1 || (cmpt.length === 1 && g.hasEdge(cmpt[0], cmpt[0]));
  });
}