import 'mocha';
import { expect } from 'chai';
import Graph from '../graph';
import components from './components';

describe('alg.components', function() {
  it('returns an empty list for an empty graph', function() {
    expect(components(new Graph({ directed: false }))).to.be.empty;
  });

  it('returns singleton lists for unconnected nodes', function() {
    const g = new Graph({ directed: false });
    g.setNode('a');
    g.setNode('b');

    expect(components(g)).to.have.deep.members([['a'], ['b']]);
  });

  it('returns a list of nodes in a component', function() {
    const g = new Graph({ directed: false });
    g.setEdge('a', 'b');
    g.setEdge('b', 'c');

    const result = components(g);
    result.forEach(e => e.sort((a, b) => a < b ? -1 : (a > b ? 1 : 0)));

    expect(result).to.have.deep.members([['a', 'b', 'c']]);
  });

  it('returns nodes connected by a neighbor relationship in a digraph', function() {
    const g = new Graph();
    g.setPath(['a', 'b', 'c', 'a']);
    g.setEdge('d', 'c');
    g.setEdge('e', 'f');

    const result = components(g);
    result.forEach(e => e.sort((a, b) => a < b ? -1 : (a > b ? 1 : 0)));

    expect(result).to.have.deep.members([['a', 'b', 'c', 'd'], ['e', 'f']]);
  });
});
