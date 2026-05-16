import { describe, expect, it } from 'vitest';
import { relationshipsToGraph } from '../graphViewModel';
import { baselineRelationships, mentors, startups } from '../sampleCohort';

describe('relationshipsToGraph', () => {
  it('creates mentor and startup nodes for connected entities', () => {
    const graph = relationshipsToGraph(baselineRelationships, mentors, startups);

    const mentorNodeIds = new Set(
      graph.nodes.filter((node) => node.className?.includes('node-mentor')).map((node) => node.id),
    );
    const startupNodeIds = new Set(
      graph.nodes.filter((node) => node.className?.includes('node-startup')).map((node) => node.id),
    );

    expect(mentorNodeIds).toEqual(new Set(baselineRelationships.map((relationship) => relationship.mentorId)));
    expect(startupNodeIds).toEqual(new Set(baselineRelationships.map((relationship) => relationship.startupId)));
  });

  it('creates one relationship edge per baseline relationship with relationship data', () => {
    const graph = relationshipsToGraph(baselineRelationships, mentors, startups);

    expect(graph.edges).toHaveLength(baselineRelationships.length);
    for (const relationship of baselineRelationships) {
      expect(graph.edges).toContainEqual(
        expect.objectContaining({
          id: relationship.id,
          source: relationship.mentorId,
          target: relationship.startupId,
          data: expect.objectContaining({ relationshipId: relationship.id }),
        }),
      );
    }
  });

  it('adds readable labels to relationship edges', () => {
    const graph = relationshipsToGraph(baselineRelationships, mentors, startups);
    const loopPayEdge = graph.edges.find((edge) => edge.id === 'M-104:S-LOOP');

    expect(loopPayEdge?.ariaLabel).toBe('Maya Chen to LoopPay, at risk relationship');
    expect(loopPayEdge?.data?.label).toBe('Maya Chen to LoopPay, at risk relationship');
    expect(loopPayEdge?.interactionWidth).toBeGreaterThanOrEqual(24);
  });

  it('applies risk, watch, and healthy classes to edges and startup nodes', () => {
    const graph = relationshipsToGraph(baselineRelationships, mentors, startups);

    expect(graph.edges.find((edge) => edge.id === 'M-104:S-LOOP')?.className).toContain('edge-risk');
    expect(graph.edges.find((edge) => edge.id === 'M-207:S-ORBIT')?.className).toContain('edge-watch');
    expect(graph.edges.find((edge) => edge.id === 'M-319:S-KIN')?.className).toContain('edge-healthy');
    expect(graph.nodes.find((node) => node.id === 'S-LOOP')?.className).toContain('node-risk');
    expect(graph.nodes.find((node) => node.id === 'S-ORBIT')?.className).toContain('node-watch');
    expect(graph.nodes.find((node) => node.id === 'S-KIN')?.className).toContain('node-healthy');
  });

  it('keeps graph positions deterministic', () => {
    const first = relationshipsToGraph(baselineRelationships, mentors, startups);
    const second = relationshipsToGraph(baselineRelationships, mentors, startups);

    expect(second.nodes.map((node) => [node.id, node.position])).toEqual(
      first.nodes.map((node) => [node.id, node.position]),
    );
  });
});
