import { Graph } from '@fluggo/graphlib';
import * as grammar from './dot-grammar';
import { customAlphabet } from 'nanoid/non-secure';
const nanoid = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyz', 6);

export type DotGraph = Graph<string, grammar.Attributes, grammar.Attributes, grammar.Attributes>;

interface StackEntry {
  node: grammar.Attributes;
  edge: grammar.Attributes;
  graph: grammar.Attributes;
  sg: string | undefined;
}

export function buildGraph(parseTree: grammar.Graph): DotGraph {
  const isDirected = parseTree.type !== 'graph';
  const isMultigraph = !parseTree.strict;

  const defaultStack: StackEntry[] = [{ node: {}, edge: {}, graph: {}, sg: undefined }];
  let defaults = defaultStack[0];
  let sg: string | undefined;

  const g = new Graph({ directed: isDirected, multigraph: isMultigraph, compound: true }) as DotGraph;

  g.setGraph(parseTree.id === null ? {} : {id: parseTree.id});

  function handleStmt(stmt: grammar.Statement) {
    switch (stmt.type) {
      case 'node': handleNodeStmt(stmt); break;
      case 'edge': handleEdgeStmt(stmt); break;
      case 'subgraph': handleSubgraphStmt(stmt); break;
      case 'attr': handleAttrStmt(stmt); break;
      case 'inlineAttr': handleInlineAttrsStmt(stmt); break;
    }
  }

  function handleNodeStmt(stmt: grammar.NodeStatement) {
    const v = stmt.id,
      attrs = stmt.attrs;
    maybeCreateNode(v, defaults.node);
    Object.assign(g.node(v), attrs);
  }

  function handleEdgeStmt(stmt: grammar.EdgeStatement) {
    let prev: string[] = [];

    for(const elem of stmt.elems) {
      handleStmt(elem);

      let curr: string[];

      switch (elem.type) {
        case 'node': curr = [elem.id]; break;
        case 'subgraph': curr = collectNodeIds(elem); break;
      }

      for(const v of prev) {
        for(const w of curr) {
          let name;
          if(g.hasEdge(v, w) && g.isMultigraph()) {
            name = 'edge_' + nanoid();
          }
          if(!g.hasEdge(v, w, name)) {
            g.setEdge(v, w, Object.assign({}, defaults.edge), name);
          }
          Object.assign(g.edge(v, w, name), stmt.attrs);
        }
      }

      prev = curr;
    }
  }

  function handleSubgraphStmt(stmt: grammar.SubgraphStatement) {
    let id = stmt.id;
    if(id === null) {
      id = generateSubgraphId();
    }

    defaults = {
      node: Object.assign({}, defaults.node),
      edge: Object.assign({}, defaults.edge),
      graph: Object.assign({}, defaults.graph),
      sg,
    };
    defaultStack.push(defaults);

    maybeCreateNode(id, defaults.graph);
    sg = id;

    for(const statement of stmt.stmts) {
      handleStmt(statement);
    }

    // If there are no statements remove the subgraph
    if(!g.children(id)!.length) {
      g.removeNode(id);
    }

    const oldDefaults = defaultStack.pop();

    if(!oldDefaults)
      throw new Error('Popped when stack was empty');

    defaults = oldDefaults;
    sg = oldDefaults.sg;
  }

  function handleAttrStmt(stmt: grammar.AttrStatement) {
    Object.assign(defaults[stmt.attrType], stmt.attrs);
  }

  function handleInlineAttrsStmt(stmt: grammar.InlineAttrStatement) {
    Object.assign(sg ? g.node(sg) : g.graph(), stmt.attrs);
  }

  function generateSubgraphId(): string {
    let id;
    do {
      id = 'sg_' + nanoid();
    } while(g.hasNode(id));
    return id;
  }

  function maybeCreateNode(v: string, defaultAttrs: grammar.Attributes) {
    if(!g.hasNode(v)) {
      g.setNode(v, Object.assign({}, defaultAttrs));
      g.setParent(v, sg);
    }
  }

  for(const stmt of parseTree.stmts) {
    handleStmt(stmt);
  }

  return g;
}

// Collect all nodes involved in a subgraph statement
function collectNodeIds(stmt: grammar.Statement): string[] {
  const stack: grammar.Statement[] = [];
  const ids = new Set<string>();

  stack.push(stmt);
  for(;;) {
    const curr = stack.pop();

    if(!curr)
      break;

    switch (curr.type) {
      case 'node': ids.add(curr.id); break;
      case 'edge': stack.push(...curr.elems); break;
      case 'subgraph': stack.push(...curr.stmts); break;
    }
  }

  return [...ids];
}

