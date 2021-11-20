import * as grammar from './dot-grammar';
import { buildGraph, DotGraph } from './build-graph';

export function read(str: string): DotGraph {
  const parseTree = grammar.parse(str, {startRule: 'graphStmt'});
  return buildGraph(parseTree);
}
