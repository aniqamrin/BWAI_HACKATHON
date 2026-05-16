import { Handle, Position, ReactFlow, type EdgeMouseHandler, type NodeProps, type NodeTypes } from '@xyflow/react';
import { useMemo } from 'react';
import { relationshipsToGraph, type CohortGraphNode } from '../domain/graphViewModel';
import type { Mentor, Relationship, Startup } from '../domain/types';

type CohortGraphProps = {
  relationships: Relationship[];
  mentors: Mentor[];
  startups: Startup[];
  onSelectRelationship: (relationshipId: string) => void;
};

function AtlasNode({ data }: NodeProps<CohortGraphNode>) {
  return (
    <>
      <Handle type="target" position={Position.Left} isConnectable={false} />
      <div className="cohort-node__label">{data.label}</div>
      <div className="cohort-node__detail">{data.detail}</div>
      <Handle type="source" position={Position.Right} isConnectable={false} />
    </>
  );
}

const nodeTypes: NodeTypes = {
  cohort: AtlasNode,
};

export function CohortGraph({ relationships, mentors, startups, onSelectRelationship }: CohortGraphProps) {
  const { nodes, edges } = useMemo(
    () => relationshipsToGraph(relationships, mentors, startups),
    [relationships, mentors, startups],
  );
  const relationshipById = useMemo(
    () => new Map(relationships.map((relationship) => [relationship.id, relationship])),
    [relationships],
  );
  const traceItems = edges
    .map((edge) => {
      const relationshipId = edge.data?.relationshipId;
      const label = edge.data?.label;
      if (typeof relationshipId !== 'string' || typeof label !== 'string') return null;

      return {
        relationshipId,
        label,
        status: relationshipById.get(relationshipId)?.status ?? 'healthy',
      };
    })
    .filter((item): item is { relationshipId: string; label: string; status: Relationship['status'] } =>
      Boolean(item),
    );

  const handleEdgeClick: EdgeMouseHandler = (_event, edge) => {
    const relationshipId = edge.data?.relationshipId;
    if (typeof relationshipId === 'string') {
      onSelectRelationship(relationshipId);
    }
  };

  return (
    <div className="cohort-graph-frame">
      <div className="cohort-graph" aria-label="Mentor and startup relationship graph">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.18 }}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          panOnDrag={false}
          zoomOnScroll={false}
          zoomOnPinch={false}
          zoomOnDoubleClick={false}
          onEdgeClick={handleEdgeClick}
        />
      </div>
      <section className="relationship-trace" aria-label="Relationship trace controls">
        {traceItems.map((item) => (
          <button
            key={item.relationshipId}
            type="button"
            className={`relationship-trace__button trace-${item.status === 'at-risk' ? 'risk' : item.status}`}
            aria-label={`Select ${item.label}`}
            onClick={() => onSelectRelationship(item.relationshipId)}
          >
            <span>{item.label.replace(', ', ' | ')}</span>
          </button>
        ))}
      </section>
    </div>
  );
}
