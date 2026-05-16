import type { Edge, Node } from '@xyflow/react';
import type { HealthStatus, Mentor, Relationship, Startup } from './types';

export type CohortGraphNodeData = {
  label: string;
  detail: string;
};

export type CohortGraphEdgeData = {
  relationshipId: string;
  label: string;
};

export type CohortGraphNode = Node<CohortGraphNodeData, 'cohort'>;
export type CohortGraphEdge = Edge<CohortGraphEdgeData>;

const MENTOR_X = 80;
const STARTUP_X = 620;
const TOP_OFFSET = 40;
const ROW_GAP = 92;

function statusClass(status: HealthStatus) {
  if (status === 'at-risk') return 'risk';
  return status;
}

function nodeHealthForStartup(startupId: string, relationships: Relationship[]) {
  const connected = relationships.filter((relationship) => relationship.startupId === startupId);
  if (connected.some((relationship) => relationship.status === 'at-risk')) return 'node-risk';
  if (connected.some((relationship) => relationship.status === 'watch')) return 'node-watch';
  return 'node-healthy';
}

function uniqueConnectedIds(relationships: Relationship[], key: 'mentorId' | 'startupId') {
  return [...new Set(relationships.map((relationship) => relationship[key]))];
}

function averageIndex(ids: string[], orderedIds: string[]) {
  if (ids.length === 0) return Number.MAX_SAFE_INTEGER;
  const total = ids.reduce((sum, id) => {
    const index = orderedIds.indexOf(id);
    return sum + (index === -1 ? orderedIds.length : index);
  }, 0);
  return total / ids.length;
}

function readableStatus(status: HealthStatus) {
  return status === 'at-risk' ? 'at risk' : status;
}

export function relationshipsToGraph(
  relationships: Relationship[],
  mentors: Mentor[],
  startups: Startup[],
): { nodes: CohortGraphNode[]; edges: CohortGraphEdge[] } {
  const mentorById = new Map(mentors.map((mentor) => [mentor.id, mentor]));
  const startupById = new Map(startups.map((startup) => [startup.id, startup]));
  const validRelationships = relationships.filter(
    (relationship) => mentorById.has(relationship.mentorId) && startupById.has(relationship.startupId),
  );

  const connectedMentorIds = uniqueConnectedIds(validRelationships, 'mentorId');
  const connectedStartupIds = uniqueConnectedIds(validRelationships, 'startupId').sort(
    (firstStartupId, secondStartupId) => {
      const firstMentors = validRelationships
        .filter((relationship) => relationship.startupId === firstStartupId)
        .map((relationship) => relationship.mentorId);
      const secondMentors = validRelationships
        .filter((relationship) => relationship.startupId === secondStartupId)
        .map((relationship) => relationship.mentorId);
      const averageDelta =
        averageIndex(firstMentors, connectedMentorIds) - averageIndex(secondMentors, connectedMentorIds);

      if (averageDelta !== 0) return averageDelta;
      return firstStartupId.localeCompare(secondStartupId);
    },
  );

  const mentorNodes: CohortGraphNode[] = connectedMentorIds.map((mentorId, index) => {
    const mentor = mentorById.get(mentorId);

    return {
      id: mentorId,
      type: 'cohort',
      className: 'cohort-node node-mentor',
      position: { x: MENTOR_X, y: TOP_OFFSET + index * ROW_GAP },
      data: {
        label: mentor?.name ?? mentorId,
        detail: mentor ? `${mentor.role} | ${mentor.domain}` : mentorId,
      },
      draggable: false,
    };
  });

  const startupNodes: CohortGraphNode[] = connectedStartupIds.map((startupId, index) => {
    const startup = startupById.get(startupId);

    return {
      id: startupId,
      type: 'cohort',
      className: `cohort-node node-startup ${nodeHealthForStartup(startupId, validRelationships)}`,
      position: { x: STARTUP_X, y: TOP_OFFSET + index * ROW_GAP },
      data: {
        label: startup?.name ?? startupId,
        detail: startup ? `${startup.stage} | ${startup.category}` : startupId,
      },
      draggable: false,
    };
  });

  const edges: CohortGraphEdge[] = validRelationships.map((relationship) => {
    const mentor = mentorById.get(relationship.mentorId);
    const startup = startupById.get(relationship.startupId);
    const label = `${mentor?.name ?? relationship.mentorId} to ${startup?.name ?? relationship.startupId}, ${readableStatus(
      relationship.status,
    )} relationship`;

    return {
      id: relationship.id,
      source: relationship.mentorId,
      target: relationship.startupId,
      className: `cohort-edge edge-${statusClass(relationship.status)}`,
      data: { relationshipId: relationship.id, label },
      ariaLabel: label,
      interactionWidth: 28,
      animated: relationship.status === 'at-risk',
    };
  });

  return {
    nodes: [...mentorNodes, ...startupNodes],
    edges,
  };
}
