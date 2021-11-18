#!/usr/bin/env node
/* eslint-env node */

import b from 'benny';
import seedrandom from 'seedrandom';

const seed = process.env.SEED;
seedrandom(seed, { global: true });
if(seed) {
  console.log('SEED: %s (%d)', seed, Math.random());
}

import { Graph } from '../lib/graph';
import { components } from '../lib/alg/components';
import { dijkstraAll } from '../lib/alg/dijkstra-all';

const NODE_SIZES = [100],
  EDGE_DENSITY = 0.2,
  KEY_SIZE = 10;

function keys(count: number) {
  const ks = [];
  let k;
  for(let i = 0; i < count; ++i) {
    k = '';
    for(let j = 0; j < KEY_SIZE; ++j) {
      k += String.fromCharCode(97 + Math.floor(Math.random() * 26));
    }
    ks.push(k);
  }
  return ks;
}

function buildGraph(numNodes: number, edgeDensity: number) {
  const g = new Graph(),
    numEdges = numNodes * numNodes * edgeDensity,
    ks = keys(numNodes);

  ks.forEach(function(k) {
    g.setNode(k);
  });

  for(let i = 0; i < numEdges; ++i) {
    let v, w;
    do {
      v = ks[Math.floor(Math.random() * ks.length)];
      w = ks[Math.floor(Math.random() * ks.length)];
    } while(g.hasEdge(v, w));
    g.setEdge(v, w);
  }
  return g;
}

NODE_SIZES.forEach(size => {
  const g = buildGraph(size, EDGE_DENSITY),
    nodes = g.nodes(),
    edges = g.edges();

  let count = Math.random() * 1000;
  function nextInt(range: number) {
    return Math.floor(count++ % range);
  }

  b.suite(
    `(${size},${EDGE_DENSITY})`,

    b.add('nodes', () => g.nodes()),

    b.add('sources', () => g.sources()),

    b.add('sinks', () => g.sinks()),

    b.add('filterNodes all', () => {
      g.filterNodes(function() {
        return true;
      });
    }),

    b.add('filterNodes none', () => {
      g.filterNodes(function() {
        return false;
      });
    }),

    b.add('setNode', () => {
      g.setNode('key', 'label');
    }),

    b.add('node', () => {
      g.node(nodes[nextInt(nodes.length)]);
    }),

    b.add('set + removeNode', () => {
      g.setNode('key');
      g.removeNode('key');
    }),

    b.add('predecessors', () => {
      g.predecessors(nodes[nextInt(nodes.length)]);
    }),

    b.add('successors', () => {
      g.successors(nodes[nextInt(nodes.length)]);
    }),

    b.add('neighbors', () => {
      g.neighbors(nodes[nextInt(nodes.length)]);
    }),

    b.add('edges', () => g.edges()),

    b.add('setPath', () => {
      g.setPath(['a', 'b', 'c', 'd', 'e']);
    }),

    b.add('setEdge', () => {
      g.setEdge('from', 'to', 'label');
    }),

    b.add('edge', () => {
      const edge = edges[nextInt(edges.length)];
      g.edge(edge);
    }),

    b.add('set + removeEdge', () => {
      g.setEdge('from', 'to');
      g.removeEdge('from', 'to');
    }),

    b.add('inEdges', () => {
      g.inEdges(nodes[nextInt(nodes.length)]);
    }),

    b.add('outEdges', () => {
      g.outEdges(nodes[nextInt(nodes.length)]);
    }),

    b.add('nodeEdges', () => {
      g.nodeEdges(nodes[nextInt(nodes.length)]);
    }),

    b.add('components', () => {
      components(g);
    }),

    b.add('dijkstraAll', () => {
      dijkstraAll(g);
    }),

    b.cycle(),

    b.complete(),
  ).catch(err => {
    console.error('Failed to run:');
    console.error(err);
    process.exitCode = 1;
  });
});
