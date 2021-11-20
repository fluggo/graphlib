export type GrammarSource = unknown;

interface SourceMap {
  source: GrammarSource;
  text: string;
}

export class SyntaxError extends Error {
  private constructor();

  format(sources: SourceMap[]): string;
}

export type Attributes = Partial<Record<string, string>>;

export interface AttrStatement {
  type: 'attr';
  attrType: 'graph' | 'node' | 'edge';
  attrs: Attributes;
}

export interface NodeStatement {
  type: 'node';
  id: string;
  attrs: Attributes;
}

export interface InlineAttrStatement {
  type: 'inlineAttr';
  attrs: Attributes;
}

export interface EdgeStatement {
  type: 'edge';
  elems: (NodeStatement | SubgraphStatement)[];
  attrs: Attributes;
}

export interface SubgraphStatement {
  type: 'subgraph';
  id: string | null;
  stmts: Statement[];
}

export type Statement = AttrStatement | NodeStatement | EdgeStatement | SubgraphStatement | InlineAttrStatement;

export interface Graph {
  type: 'graph' | 'digraph';
  id: string | null;
  strict: boolean;
  stmts: Statement[];
}

interface ParseOptions {
  grammarSource?: GrammarSource;
}

export function parse(input: string, options?: ParseOptions & { startRule: 'start' }): Graph[];
export function parse(input: string, options?: ParseOptions & { startRule: 'graphStmt' }): Graph;
