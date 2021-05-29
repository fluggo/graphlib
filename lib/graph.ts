import tuple from '@wry/tuple';

const GRAPH_NODE = Symbol.for('GRAPH_NODE');

type GraphNodeKey = typeof GRAPH_NODE;

// Implementation notes:
//
//  * Node id query functions should return string ids for the nodes
//  * Edge id query functions should return an "edgeObj", edge object, that is
//    composed of enough information to uniquely identify an edge: {v, w, name}.
//  * Internally we use an "edgeId", a stringified form of the edgeObj, to
//    reference edges. This is because we need a performant way to look these
//    edges up and, object properties, which have string keys, are the closest
//    we're going to get to a performant hashtable in JavaScript.

interface GraphOptions {
  directed?: boolean;
  multigraph?: boolean;
  compound?: boolean;
}

/**
 * Valid types for a node key.
 *
 * A node key can be most anything, but it does need to be comparable,
 * which means it either needs to be a string, a number, or a type implementing
 * Symbol.toPrimitive.
 */
export type NodeKey = string | number | { [Symbol.toPrimitive](hint?: string): string | number };

type NodeLabelFunction<K extends NodeKey, NodeLabel> = (v: K) => NodeLabel | undefined;

type EdgeKey = unknown & { _fake?: number };
interface Edge<K extends NodeKey> {
  v: K;
  w: K;
  name?: string;
}
type EdgeLabelFunction<K extends NodeKey, EdgeLabel> = (v: K, w: K, name: string | undefined) => EdgeLabel | undefined;

function isEdge<K extends NodeKey>(obj: unknown): obj is Edge<K> {
  return typeof(obj) === 'object' && obj !== null &&
    'v' in obj && 'w' in obj;
}

export default class Graph<K extends NodeKey = string, NodeLabel = string, EdgeLabel = string, GraphLabel = string> {
  private readonly _isDirected: boolean;
  private readonly _isMultigraph: boolean;
  private readonly _isCompound: boolean;
  private _label: GraphLabel | undefined;
  private _defaultNodeLabelFn: NodeLabelFunction<K, NodeLabel>;
  private _defaultEdgeLabelFn: EdgeLabelFunction<K, EdgeLabel>;
  private readonly _nodes: Map<K, NodeLabel | undefined>;
  private readonly _parent: Map<K, K | GraphNodeKey> | undefined;
  private readonly _children: Map<K | GraphNodeKey, Set<K>> | undefined;
  private readonly _in: Map<K, Map<EdgeKey, Edge<K>>>;      // Probably should be Map<NodeKey, Set<EdgeKey>>
  private readonly _preds: Map<K, Map<K, number>>;
  private readonly _out: Map<K, Map<EdgeKey, Edge<K>>>;     // Probably should be Map<NodeKey, Set<EdgeKey>>
  private readonly _sucs: Map<K, Map<K, number>>;
  private readonly _edgeObjs: Map<EdgeKey, Edge<K>>;
  private readonly _edgeLabels: Map<EdgeKey, EdgeLabel | undefined>;

  /** Number of nodes in the graph. Should only be changed by the implementation. */
  private _nodeCount = 0;

  /** Number of edges in the graph. Should only be changed by the implementation. */
  private _edgeCount = 0;

  constructor(opts: GraphOptions = {}) {
    this._isDirected = opts.directed ?? true;
    this._isMultigraph = opts.multigraph ?? false;
    this._isCompound = opts.compound ?? false;

    // Label for the graph itself
    this._label = undefined;

    // Defaults to be set when creating a new node
    this._defaultNodeLabelFn = () => undefined;

    // Defaults to be set when creating a new edge
    this._defaultEdgeLabelFn = () => undefined;

    // v -> label
    this._nodes = new Map();

    if(this._isCompound) {
      // v -> parent
      this._parent = new Map();

      // v -> children
      this._children = new Map();
      this._children.set(GRAPH_NODE, new Set());
    }

    // v -> edgeObj
    this._in = new Map();

    // u -> v -> Number
    this._preds = new Map();

    // v -> edgeObj
    this._out = new Map();

    // v -> w -> Number
    this._sucs = new Map();

    // e -> edgeObj
    this._edgeObjs = new Map();

    // e -> label
    this._edgeLabels = new Map();
  }

  /* === Graph functions ========= */

  isDirected(): boolean {
    return this._isDirected;
  }

  isMultigraph(): boolean {
    return this._isMultigraph;
  }

  isCompound(): boolean {
    return this._isCompound;
  }

  setGraph(label: GraphLabel | undefined): this {
    this._label = label;
    return this;
  }

  graph(): GraphLabel | undefined {
    return this._label;
  }

  /* === Node functions ========== */

  setDefaultNodeLabel(newDefault: NodeLabelFunction<K, NodeLabel> | NodeLabel): this {
    const newFunc = typeof newDefault === 'function' ? (newDefault as NodeLabelFunction<K, NodeLabel>) : () => newDefault;
    this._defaultNodeLabelFn = newFunc;
    return this;
  }

  nodeCount(): number {
    return this._nodeCount;
  }

  nodes(): K[] {
    return [...this._nodes.keys()];
  }

  sources(): K[] {
    return this.nodes().filter(v => this._in.get(v)!.size === 0);
  }

  sinks(): K[] {
    return this.nodes().filter(v => this._out.get(v)!.size === 0);
  }

  setNodes(vs: K[], value?: NodeLabel): this {
    for(const v of vs) {
      if(arguments.length > 1) {
        this.setNode(v, value);
      }
      else {
        this.setNode(v);
      }
    }
    return this;
  }

  setNode(v: K, value?: NodeLabel): this {
    if(this._nodes.has(v)) {
      if(arguments.length > 1) {
        this._nodes.set(v, value);
      }
      return this;
    }

    this._nodes.set(v, arguments.length > 1 ? value : this._defaultNodeLabelFn(v));
    if(this._isCompound) {
      this._parent?.set(v, GRAPH_NODE);
      this._children?.set(v, new Set());
      this._children?.get(GRAPH_NODE)?.add(v);
    }
    this._in.set(v, new Map());
    this._preds.set(v, new Map());
    this._out.set(v, new Map());
    this._sucs.set(v, new Map());
    ++this._nodeCount;
    return this;
  }

  /**
   * Fetches the label for a node.
   * @param v Key of the node to fetch.
   * @returns The label, if the node exists and it has a label.
   */
  node(v: K): NodeLabel | undefined {
    return this._nodes.get(v);
  }

  hasNode(v: K): boolean {
    return this._nodes.has(v);
  }

  removeNode(v: K): this {
    if(this._nodes.has(v)) {
      this._nodes.delete(v);
      if(this._isCompound) {
        this._removeFromParentsChildList(v);
        this._parent?.delete(v);
        for(const child of this.children(v)!) {
          this.setParent(child);
        }
        this._children?.delete(v);
      }
      for(const e of this._in.get(v)!.keys())
        this.removeEdge(this._edgeObjs.get(e)!);
      this._in.delete(v);
      this._preds.delete(v);
      for(const e of this._out.get(v)!.keys())
        this.removeEdge(this._edgeObjs.get(e)!);
      this._out.delete(v);
      this._sucs.delete(v);
      --this._nodeCount;
    }
    return this;
  }

  setParent(v: K, parent?: K): this {
    if(!this._isCompound) {
      throw new Error('Cannot set parent in a non-compound graph');
    }

    let trueParent: K | GraphNodeKey;

    if(parent === undefined) {
      trueParent = GRAPH_NODE;
    }
    else {
      for(let ancestor: K | undefined = parent;
        ancestor !== undefined;
        ancestor = this.parent(ancestor)) {
        if(ancestor === v) {
          throw new Error(`Setting ${String(parent)} as parent of ${String(v)} would create a cycle`);
        }
      }

      trueParent = parent;
      this.setNode(trueParent);
    }

    this.setNode(v);
    this._removeFromParentsChildList(v);
    this._parent?.set(v, trueParent);
    this._children?.get(trueParent)!.add(v);
    return this;
  }

  private _removeFromParentsChildList(v: K): void {
    const parent = this._parent?.get(v);

    if(parent)
      this._children?.get(parent)?.delete(v);
  }

  parent(v: K): K | undefined {
    if(this._isCompound) {
      const parent = this._parent?.get(v);
      if(parent !== GRAPH_NODE) {
        return parent;
      }
    }
  }

  children(v?: K): K[] | undefined {
    const rv = v ?? GRAPH_NODE;

    if(this._isCompound) {
      const children = this._children?.get(rv);
      if(children) {
        return [...children.keys()];
      }
    }
    else if(rv === GRAPH_NODE) {
      return this.nodes();
    }
    else if(this.hasNode(rv)) {
      return [];
    }
  }

  predecessors(v: K): K[] | undefined {
    const predsV = this._preds.get(v);
    if(predsV) {
      return [...predsV.keys()];
    }
  }

  successors(v: K): K[] | undefined {
    const sucsV = this._sucs.get(v);
    if(sucsV) {
      return [...sucsV.keys()];
    }
  }

  neighbors(v: K): K[] | undefined {
    const preds = this.predecessors(v);
    const sucs = this.successors(v);

    if(preds && sucs) {
      return Array.from(new Set([...preds, ...sucs]));
    }
  }

  isLeaf(v: K): boolean {
    let neighbors: K[] | undefined;
    if(this.isDirected()) {
      neighbors = this.successors(v);
    }
    else {
      neighbors = this.neighbors(v);
    }
    return neighbors ? neighbors.length === 0 : false;
  }

  filterNodes(filter: (v: K) => boolean): Graph<K, NodeLabel, EdgeLabel, GraphLabel> {
    const copy = new (this.constructor as new (graph: GraphOptions) => Graph<K, NodeLabel, EdgeLabel, GraphLabel>)({
      directed: this._isDirected,
      multigraph: this._isMultigraph,
      compound: this._isCompound,
    });

    copy.setGraph(this.graph());

    for(const [v, value] of this._nodes.entries()) {
      if(filter(v)) {
        copy.setNode(v, value);
      }
    }

    for(const e of this._edgeObjs.values()) {
      if(copy.hasNode(e.v) && copy.hasNode(e.w)) {
        copy.setEdge(e, this.edge(e));
      }
    }

    const parents = new Map<K, K | undefined>();
    const findParent = (v: K): K | undefined => {
      const parent = this.parent(v);
      if(parent === undefined || copy.hasNode(parent)) {
        parents.set(v, parent);
        return parent;
      }
      else if(parents.has(parent)) {
        return parents.get(parent);
      }
      else {
        return findParent(parent);
      }
    };

    if(this._isCompound) {
      for(const v of copy.nodes()) {
        copy.setParent(v, findParent(v));
      }
    }

    return copy;
  }


  /* === Edge functions ========== */

  setDefaultEdgeLabel(newDefault: EdgeLabel | EdgeLabelFunction<K, EdgeLabel>): this {
    const newFunc = typeof newDefault === 'function' ? (newDefault as EdgeLabelFunction<K, EdgeLabel>) : () => newDefault;
    this._defaultEdgeLabelFn = newFunc;
    return this;
  }

  edgeCount(): number {
    return this._edgeCount;
  }

  edges(): Edge<K>[] {
    return [...this._edgeObjs.values()];
  }

  setPath(vs: readonly K[], value?: EdgeLabel): this {
    vs.reduce((v, w) => {
      if(arguments.length > 1) {
        this.setEdge(v, w, value);
      }
      else {
        this.setEdge(v, w);
      }
      return w;
    });

    return this;
  }

  /**
   * Creates an edge between `v` and `k`.
   * @param v Source of the edge (if the graph is directed).
   * @param w Target of the edge (if the graph is directed).
   * @param value Optional label for the edge. If this parameter is omitted, the default edge label is used instead.
   * @param name Optional name for the edge to distinguish it from other edges between `v` and `k`.
   */
  setEdge(v: K, w: K, value?: EdgeLabel | undefined, name?: string): this;

  /**
   * Adds an edge.
   * @param edge Edge to add.
   * @param value Optional label for the edge. If this parameter is omitted, the default edge label is used instead.
   */
  setEdge(edge: Edge<K>, value?: EdgeLabel | undefined): this;

  setEdge(...args: readonly unknown[]): this {
    let v: K, w: K, name: string | undefined, value: EdgeLabel | undefined;
    let valueSpecified = false;
    const arg0 = args[0];

    if(isEdge<K>(arg0)) {
      v = arg0.v;
      w = arg0.w;
      name = arg0.name;
      if(args.length === 2) {
        value = args[1] as EdgeLabel | undefined;
        valueSpecified = true;
      }
    }
    else {
      v = arg0 as K;
      w = args[1] as K;
      name = args[3] as string | undefined;
      if(args.length > 2) {
        value = args[2] as EdgeLabel | undefined;
        valueSpecified = true;
      }
    }

    const e = edgeArgsToId(this._isDirected, v, w, name);
    if(this._edgeLabels.has(e)) {
      if(valueSpecified) {
        this._edgeLabels.set(e, value);
      }
      return this;
    }

    if(name !== undefined && !this._isMultigraph) {
      throw new Error('Cannot set a named edge when isMultigraph = false');
    }

    // It didn't exist, so we need to create it.
    // First ensure the nodes exist.
    this.setNode(v);
    this.setNode(w);

    this._edgeLabels.set(e, valueSpecified ? value : this._defaultEdgeLabelFn(v, w, name));

    const edgeObj = edgeArgsToObj(this._isDirected, v, w, name);
    // Ensure we add undirected edges in a consistent way.
    v = edgeObj.v;
    w = edgeObj.w;

    Object.freeze(edgeObj);
    this._edgeObjs.set(e, edgeObj);
    incrementOrInitEntry(this._preds.get(w)!, v);
    incrementOrInitEntry(this._sucs.get(v)!, w);
    this._in.get(w)!.set(e, edgeObj);
    this._out.get(v)!.set(e, edgeObj);
    this._edgeCount++;
    return this;
  }

  edge(e: Edge<K>): EdgeLabel;
  edge(v: K, w: K, name?: string): EdgeLabel;

  edge(...args: readonly unknown[]): EdgeLabel | undefined {
    const e = (args.length === 1
      ? edgeObjToId(this._isDirected, args[0] as Edge<K>)
      : edgeArgsToId(this._isDirected, args[0] as K, args[1] as K, args[2] as string | undefined));
    return this._edgeLabels.get(e);
  }

  hasEdge(e: Edge<K>): boolean;
  hasEdge(v: K, w: K, name?: string): boolean;

  hasEdge(...args: readonly unknown[]): boolean {
    const e = (args.length === 1
      ? edgeObjToId(this._isDirected, args[0] as Edge<K>)
      : edgeArgsToId(this._isDirected, args[0] as K, args[1] as K, args[2] as string | undefined));
    return this._edgeLabels.has(e);
  }

  removeEdge(e: Edge<K>): this;
  removeEdge(v: K, w: K, name?: string): this;

  removeEdge(...args: readonly unknown[]): this {
    const e = (args.length === 1
      ? edgeObjToId(this._isDirected, args[0] as Edge<K>)
      : edgeArgsToId(this._isDirected, args[0] as K, args[1] as K, args[2] as string | undefined));
    const edge = this._edgeObjs.get(e);
    if(edge) {
      const v = edge.v;
      const w = edge.w;
      this._edgeLabels.delete(e);
      this._edgeObjs.delete(e);
      decrementOrRemoveEntry(this._preds.get(w)!, v);
      decrementOrRemoveEntry(this._sucs.get(v)!, w);
      this._in.get(w)!.delete(e);
      this._out.get(v)!.delete(e);
      this._edgeCount--;
    }
    return this;
  }

  inEdges(v: K, u?: K): Edge<K>[] | undefined {
    const inV = this._in.get(v);
    if(inV) {
      const edges = [...inV.values()];
      if(u === undefined) {
        return edges;
      }
      return edges.filter(edge => edge.v === u);
    }
  }

  outEdges(v: K, w?: K): Edge<K>[] | undefined {
    const outV = this._out.get(v);
    if(outV) {
      const edges = [...outV.values()];
      if(w === undefined) {
        return edges;
      }
      return edges.filter(edge => edge.w === w);
    }
  }

  nodeEdges(v: K, w?: K): Edge<K>[] | undefined {
    const inEdges = this.inEdges(v, w);
    if(inEdges) {
      return inEdges.concat(this.outEdges(v, w)!);
    }
  }
}

function incrementOrInitEntry<K>(map: Map<K, number>, k: K) {
  const v = map.get(k);

  if(v !== undefined) {
    map.set(k, v + 1);
  }
  else {
    map.set(k, 1);
  }
}

function decrementOrRemoveEntry<K>(map: Map<K, number>, k: K) {
  const v = map.get(k);

  if(v === 1)
    map.delete(k);
  else if(v !== undefined)
    map.set(k, v - 1);
}

function edgeArgsToId<K extends NodeKey>(isDirected: boolean, v: K, w: K, name: string | undefined): EdgeKey {
  if(!isDirected && v > w)
    [v, w] = [w, v];

  return tuple(v, w, name) as EdgeKey;
}

function edgeArgsToObj<K extends NodeKey>(isDirected: boolean, v: K, w: K, name: string | undefined): Edge<K> {
  if(!isDirected && v > w)
    [v, w] = [w, v];

  const edgeObj: Edge<K> = { v: v, w: w };

  if(name !== undefined)
    edgeObj.name = name;

  return edgeObj;
}

function edgeObjToId<K extends NodeKey>(isDirected: boolean, edgeObj: Edge<K>): EdgeKey {
  return edgeArgsToId(isDirected, edgeObj.v, edgeObj.w, edgeObj.name);
}
