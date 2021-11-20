import * as grammar from './dot-grammar';
import { DotGraph, buildGraph } from './build-graph';

export function readMany(str: string): DotGraph[] {
  const parseTree = grammar.parse(str, { startRule: 'start' });
  return parseTree.map(buildGraph);
}
