import _ from 'lodash';
import Graph, { NodeKey } from './graph';

interface JsonNode<K extends NodeKey, NodeLabel> {
  v: K;
  value?: NodeLabel;
  parent?: K;
}

interface JsonEdge<K extends NodeKey, EdgeLabel> {
  v: K;
  w: K;
  name?: string;
  value?: EdgeLabel;
}

interface JsonGraph<K extends NodeKey,N,E,G> {
  options: {
    directed: boolean;
    multigraph: boolean;
    compound: boolean;
  };
  nodes: JsonNode<K,N>[];
  edges: JsonEdge<K,E>[];
  value?: G;
}

export function write<K extends NodeKey,N,E,G>(g: Graph<K,N,E,G>): JsonGraph<K,N,E,G> {
  const json: JsonGraph<K,N,E,G> = {
    options: {
      directed: g.isDirected(),
      multigraph: g.isMultigraph(),
      compound: g.isCompound(),
    },
    nodes: writeNodes(g),
    edges: writeEdges(g),
  };
  if(g.graph() !== undefined) {
    json.value = _.clone(g.graph());
  }
  return json;
}

function writeNodes<K extends NodeKey,N,E,G>(g: Graph<K,N,E,G>): JsonNode<K,N>[] {
  return _.map(g.nodes(), function(v) {
    const nodeValue = g.node(v);
    const parent = g.parent(v);
    const node: JsonNode<K,N> = { v: v };
    if(nodeValue !== undefined) {
      node.value = nodeValue;
    }
    if(parent !== undefined) {
      node.parent = parent;
    }
    return node;
  });
}

function writeEdges<K extends NodeKey,N,E,G>(g: Graph<K,N,E,G>): JsonEdge<K,E>[] {
  return _.map(g.edges(), function(e) {
    const edgeValue = g.edge(e);
    const edge: JsonEdge<K,E> = { v: e.v, w: e.w };
    if(!_.isUndefined(e.name)) {
      edge.name = e.name;
    }
    if(!_.isUndefined(edgeValue)) {
      edge.value = edgeValue;
    }
    return edge;
  });
}

export function read<K extends NodeKey,N,E,G>(json: JsonGraph<K,N,E,G>): Graph<K,N,E,G> {
  const g = new Graph<K,N,E,G>(json.options).setGraph(json.value);
  for(const entry of json.nodes) {
    g.setNode(entry.v, entry.value);
    if(entry.parent) {
      g.setParent(entry.v, entry.parent);
    }
  }
  for(const entry of json.edges) {
    g.setEdge({ v: entry.v, w: entry.w, name: entry.name }, entry.value);
  }
  return g;
}
