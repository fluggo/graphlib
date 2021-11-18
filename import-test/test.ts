import { Graph } from '@fluggo/graphlib';

const graph = new Graph({directed: true});

graph.setNode('k');
console.log(graph.nodes());
