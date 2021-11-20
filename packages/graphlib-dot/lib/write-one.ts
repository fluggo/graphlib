import { Edge, Graph } from '@fluggo/graphlib';

// BJC: This is poorly defined; the ranges given include the C1 control codes,
// but that's what the Graphviz spec says.
const UNESCAPED_ID_PATTERN = /^[a-zA-Z\200-\377_][a-zA-Z\200-\377_0-9]*$/;

export function write(g: Graph): string {
  const ec = g.isDirected() ? '->' : '--';
  const writer = new Writer();

  if(!g.isMultigraph()) {
    writer.write('strict ');
  }

  writer.writeLine((g.isDirected() ? 'digraph' : 'graph') + ' {');
  writer.indent();

  const graphAttrs = g.graph();
  if(typeof graphAttrs === 'object' && graphAttrs !== null) {
    for(const [k, v] of Object.entries(graphAttrs)) {
      writer.writeLine(id(k) + '=' + id(v) + ';');
    }
  }

  writeSubgraph(g, undefined, writer);

  g.edges().forEach(edge => {
    writeEdge(g, edge, ec, writer);
  });

  writer.unindent();
  writer.writeLine('}');

  return writer.toString();
}

function writeSubgraph(g: Graph, v: string | undefined, writer: Writer) {
  const children = g.isCompound() ? g.children(v) : g.nodes();
  for(const w of children ?? []) {
    if(!g.isCompound() || !(g.children(w) ?? []).length) {
      writeNode(g, w, writer);
    }
    else {
      writer.writeLine('subgraph ' + id(w) + ' {');
      writer.indent();

      const label = g.node(w);

      if(typeof label === 'object' && label !== null) {
        for(const [key, val] of Object.entries(label)) {
          writer.writeLine(id(key) + '=' + id(val) + ';');
        }
      }

      writeSubgraph(g, w, writer);
      writer.unindent();
      writer.writeLine('}');
    }
  }
}

function writeNode(g: Graph, v: string, writer: Writer): void {
  writer.write(id(v));
  writeAttrs(g.node(v), writer);
  writer.writeLine();
}

function writeEdge(g: Graph, edge: Edge<string>, ec: string, writer: Writer) {
  const v = edge.v;
  const w = edge.w;
  const attrs = g.edge(edge);

  writer.write(id(v) + ' ' + ec + ' ' + id(w));
  writeAttrs(attrs, writer);
  writer.writeLine();
}

function writeAttrs(attrs: unknown, writer: Writer): void {
  if(typeof attrs === 'object' && attrs !== null) {
    const attrStrs = Object.entries(attrs).map(([key, val]) => {
      return id(key) + '=' + id(val);
    });
    if(attrStrs.length) {
      writer.write(' [' + attrStrs.join(',') + ']');
    }
  }
}

function id(obj: unknown): string {
  if(obj === undefined)
    return 'undefined';

  if(obj === null)
    return 'null';

  if(typeof obj === 'number' && isFinite(obj))
    return obj.toString();

  const str = String(obj);

  if(UNESCAPED_ID_PATTERN.test(str))
    return str;

  return '"' + str.replace(/"/g, '\\"') + '"';
}

const INDENT = '  ';

// Helper object for making a pretty printer
class Writer {
  _indent = '';
  _content = '';
  _shouldIndent = true;

  indent() {
    this._indent += INDENT;
  }

  unindent() {
    this._indent = this._indent.slice(INDENT.length);
  }

  writeLine(line?: string) {
    this.write((line ?? '') + '\n');
    this._shouldIndent = true;
  }

  write(str: string) {
    if(this._shouldIndent) {
      this._shouldIndent = false;
      this._content += this._indent;
    }
    this._content += str;
  }

  toString() {
    return this._content;
  }
}
