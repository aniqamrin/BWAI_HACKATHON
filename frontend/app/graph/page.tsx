"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import ReactFlow, {
  Node, Edge, Background, Controls, MiniMap,
  useNodesState, useEdgesState, addEdge, Connection,
  BackgroundVariant, Panel
} from "reactflow";
import "reactflow/dist/style.css";
import { Network, Briefcase, GraduationCap, Building2, Users, RefreshCw, AlertTriangle, UserX, Zap, GitBranch, ChevronDown, ChevronUp } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { graphApi } from "@/lib/api";

const DiagnosticsPanel = ({ diagnostics }: { diagnostics: any }) => {
  const [open, setOpen] = useState<string | null>("orphans");
  if (!diagnostics) return null;

  const sections = [
    {
      id: "orphans", label: "Orphan Entities", icon: UserX, color: "text-red-400",
      count: diagnostics.orphans?.total || 0,
      content: (
        <div className="space-y-1">
          {diagnostics.orphans?.startups?.map((s: any) => (
            <div key={s.id} className="flex items-center gap-2 text-xs">
              <Briefcase className="w-3 h-3 text-violet-400 flex-shrink-0" />
              <span>{s.name}</span>
              <span className="ml-auto text-muted-foreground">{Math.floor(s.days_since_join || 0)}d</span>
            </div>
          ))}
          {diagnostics.orphans?.mentors?.map((m: any) => (
            <div key={m.id} className="flex items-center gap-2 text-xs">
              <GraduationCap className="w-3 h-3 text-green-400 flex-shrink-0" />
              <span>{m.name}</span>
              <span className="ml-auto text-green-400 text-[10px]">available</span>
            </div>
          ))}
        </div>
      )
    },
    {
      id: "bridges", label: "Bridge Suggestions", icon: GitBranch, color: "text-violet-400",
      count: diagnostics.bridge_suggestions?.length || 0,
      content: (
        <div className="space-y-2">
          {diagnostics.bridge_suggestions?.map((b: any, i: number) => (
            <div key={i} className="p-2 rounded-lg bg-violet-500/8 border border-violet-500/15 text-xs">
              <div className="flex items-center gap-1 mb-1">
                <span className="font-medium">{b.from_entity?.name}</span>
                <span className="text-muted-foreground">→</span>
                <span className="font-medium text-violet-400">{b.to_entity?.name}</span>
                <span className="ml-auto text-violet-400 font-bold">{b.potential_score}%</span>
              </div>
              <p className="text-[10px] text-muted-foreground">{b.reason}</p>
            </div>
          ))}
        </div>
      )
    },
    {
      id: "gaps", label: "Cluster Gaps", icon: AlertTriangle, color: "text-yellow-400",
      count: diagnostics.cluster_gaps?.length || 0,
      content: (
        <div className="space-y-2">
          {diagnostics.cluster_gaps?.map((g: any, i: number) => (
            <div key={i} className="text-xs p-2 rounded-lg bg-yellow-500/8 border border-yellow-500/15">
              <p className="font-medium text-yellow-400 mb-0.5">{g.industry}</p>
              <p className="text-muted-foreground text-[10px]">{g.recommendation}</p>
            </div>
          ))}
        </div>
      )
    },
    {
      id: "overloaded", label: "Overloaded Mentors", icon: Zap, color: "text-orange-400",
      count: diagnostics.overloaded?.length || 0,
      content: (
        <div className="space-y-1">
          {diagnostics.overloaded?.map((m: any) => (
            <div key={m.id} className="flex items-center gap-2 text-xs">
              <GraduationCap className="w-3 h-3 text-orange-400" />
              <span>{m.name}</span>
              <span className="ml-auto text-orange-400 font-bold">{m.current_startups}/{m.max_startups}</span>
            </div>
          ))}
          {!diagnostics.overloaded?.length && <p className="text-xs text-muted-foreground">None — capacity is healthy</p>}
        </div>
      )
    },
  ];

  return (
    <div className="w-72 flex-shrink-0 space-y-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-3">Graph Diagnostics</p>
      {sections.map(s => (
        <div key={s.id} className="rounded-xl border border-white/8 bg-white/3 overflow-hidden">
          <button
            onClick={() => setOpen(open === s.id ? null : s.id)}
            className="w-full flex items-center gap-2 p-3 hover:bg-white/5 transition-colors"
          >
            <s.icon className={`w-3.5 h-3.5 ${s.color}`} />
            <span className="text-xs font-medium flex-1 text-left">{s.label}</span>
            <span className={`text-xs font-bold ${s.count > 0 ? s.color : "text-muted-foreground"}`}>{s.count}</span>
            {open === s.id ? <ChevronUp className="w-3 h-3 text-muted-foreground" /> : <ChevronDown className="w-3 h-3 text-muted-foreground" />}
          </button>
          {open === s.id && s.count > 0 && (
            <div className="px-3 pb-3 border-t border-white/5 pt-2">
              {s.content}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

const nodeColors: Record<string, { bg: string; border: string; text: string }> = {
  startup: { bg: "rgba(124,58,237,0.15)", border: "rgba(124,58,237,0.5)", text: "#a78bfa" },
  mentor: { bg: "rgba(16,185,129,0.15)", border: "rgba(16,185,129,0.5)", text: "#34d399" },
  programme: { bg: "rgba(245,158,11,0.15)", border: "rgba(245,158,11,0.5)", text: "#fbbf24" },
  investor: { bg: "rgba(236,72,153,0.15)", border: "rgba(236,72,153,0.5)", text: "#f472b6" },
};

const edgeColors: Record<string, string> = {
  mentor_startup: "#7C3AED",
  startup_programme: "#F59E0B",
  startup_investor: "#EC4899",
  default: "#4B5563",
};

function CustomNode({ data }: { data: any }) {
  const colors = nodeColors[data.type] || nodeColors.startup;
  const icons: Record<string, any> = {
    startup: Briefcase,
    mentor: GraduationCap,
    programme: Building2,
    investor: Users,
  };
  const Icon = icons[data.type] || Briefcase;

  return (
    <div
      className="px-4 py-3 rounded-xl border min-w-[140px] text-center cursor-pointer transition-all hover:scale-105"
      style={{ background: colors.bg, borderColor: colors.border }}
    >
      <div className="flex items-center justify-center gap-2 mb-1">
        <Icon className="w-3.5 h-3.5" style={{ color: colors.text }} />
        <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: colors.text }}>
          {data.type}
        </span>
      </div>
      <p className="text-xs font-bold text-white leading-tight">{data.label}</p>
      {data.industry && <p className="text-[10px] text-gray-400 mt-0.5">{data.industry}</p>}
      {data.verification_score > 0 && (
        <div className="mt-1.5 flex items-center justify-center gap-1">
          <div className="h-1 flex-1 rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-500"
              style={{ width: `${data.verification_score}%` }}
            />
          </div>
          <span className="text-[9px] text-gray-400">{Math.round(data.verification_score)}</span>
        </div>
      )}
    </div>
  );
}

const nodeTypes = { startup: CustomNode, mentor: CustomNode, programme: CustomNode, investor: CustomNode };

const LAYOUT_POSITIONS: Record<string, { baseX: number; baseY: number }> = {
  startup: { baseX: 100, baseY: 200 },
  mentor: { baseX: 600, baseY: 100 },
  programme: { baseX: 600, baseY: 400 },
  investor: { baseX: 350, baseY: 50 },
};

function layoutNodes(rawNodes: any[]): Node[] {
  const byType: Record<string, any[]> = {};
  rawNodes.forEach((n) => {
    if (!byType[n.type]) byType[n.type] = [];
    byType[n.type].push(n);
  });

  const positioned: Node[] = [];
  Object.entries(byType).forEach(([type, nodes]) => {
    const base = LAYOUT_POSITIONS[type] || { baseX: 300, baseY: 300 };
    nodes.forEach((node, i) => {
      positioned.push({
        id: node.id,
        type: node.type,
        position: {
          x: base.baseX + (i % 3) * 200,
          y: base.baseY + Math.floor(i / 3) * 160,
        },
        data: { ...node.data, type: node.type, label: node.data.label },
      });
    });
  });
  return positioned;
}

export default function GraphPage() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [stats, setStats] = useState({ startups: 0, mentors: 0, programmes: 0, investors: 0, relationships: 0 });
  const [diagnostics, setDiagnostics] = useState<any>(null);

  const loadGraph = useCallback(async () => {
    setLoading(true);
    try {
      const [res, diagRes] = await Promise.all([graphApi.getNetwork(), graphApi.getDiagnostics()]) as any[];
      setDiagnostics((diagRes as any).data);
      const res2 = res;
      const raw = res2.data;

      const positioned = layoutNodes(raw.nodes || []);
      setNodes(positioned);

      const styledEdges: Edge[] = (raw.edges || []).map((edge: any) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        animated: edge.animated,
        style: {
          stroke: edgeColors[edge.type] || edgeColors.default,
          strokeWidth: edge.data?.match_score > 85 ? 2.5 : 1.5,
          opacity: 0.7,
        },
        label: edge.data?.match_score ? `${Math.round(edge.data.match_score)}%` : undefined,
        labelStyle: { fill: "#9CA3AF", fontSize: 10 },
        labelBgStyle: { fill: "rgba(0,0,0,0.5)" },
      }));
      setEdges(styledEdges);

      // Count by type
      const counts = { startups: 0, mentors: 0, programmes: 0, investors: 0, relationships: raw.edges?.length || 0 };
      (raw.nodes || []).forEach((n: any) => {
        if (n.type === "startup") counts.startups++;
        else if (n.type === "mentor") counts.mentors++;
        else if (n.type === "programme") counts.programmes++;
        else if (n.type === "investor") counts.investors++;
      });
      setStats(counts);
    } catch (err) {
      console.error("Graph load error:", err);
    } finally {
      setLoading(false);
    }
  }, [setNodes, setEdges]);

  useEffect(() => { loadGraph(); }, [loadGraph]);

  const onConnect = useCallback((params: Connection) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  return (
    <DashboardLayout>
      <PageHeader
        title="Ecosystem Graph"
        description="Interactive visualization of all ecosystem relationships"
        icon={Network}
        actions={
          <Button variant="outline" size="sm" onClick={loadGraph}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        }
      />

      <div className="flex gap-4 items-start">
        {/* Main graph area */}
        <div className="flex-1 min-w-0">
      {/* Legend */}
      <div className="flex items-center gap-4 mb-4 flex-wrap">
        {Object.entries(nodeColors).map(([type, colors]) => (
          <div key={type} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ background: colors.text }} />
            <span className="text-xs text-muted-foreground capitalize">{type}s ({stats[type as keyof typeof stats] || 0})</span>
          </div>
        ))}
        <div className="flex items-center gap-2 ml-4">
          <div className="w-8 h-0.5 bg-gray-500" />
          <span className="text-xs text-muted-foreground">{stats.relationships} relationships</span>
        </div>
      </div>

      {/* Graph */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="rounded-2xl border border-white/8 overflow-hidden"
        style={{ height: "calc(100vh - 280px)", minHeight: 500 }}
      >
        {loading ? (
          <div className="h-full flex items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-4">
              <div className="w-10 h-10 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
              <p className="text-sm text-muted-foreground">Loading ecosystem graph...</p>
            </div>
          </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={(_, node) => setSelectedNode(node)}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            minZoom={0.3}
            maxZoom={2}
          >
            <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="rgba(255,255,255,0.05)" />
            <Controls className="!bg-card !border-white/10 !rounded-xl" />
            <MiniMap
              className="!bg-card !border-white/10 !rounded-xl"
              nodeColor={(node) => nodeColors[node.type || "startup"]?.text || "#7C3AED"}
              maskColor="rgba(0,0,0,0.7)"
            />

            {/* Selected node panel */}
            {selectedNode && (
              <Panel position="top-right">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="glass-card rounded-xl p-4 w-64"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground capitalize">
                      {selectedNode.type}
                    </span>
                    <button onClick={() => setSelectedNode(null)} className="text-muted-foreground hover:text-foreground text-xs">✕</button>
                  </div>
                  <p className="font-semibold text-sm mb-2">{selectedNode.data.label}</p>
                  {selectedNode.data.industry && (
                    <p className="text-xs text-muted-foreground">Industry: {selectedNode.data.industry}</p>
                  )}
                  {selectedNode.data.stage && (
                    <p className="text-xs text-muted-foreground">Stage: {selectedNode.data.stage}</p>
                  )}
                  {selectedNode.data.verification_score > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Score: <span className="text-primary font-medium">{Math.round(selectedNode.data.verification_score)}/100</span>
                    </p>
                  )}
                  {selectedNode.data.rating > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Rating: <span className="text-yellow-400 font-medium">★ {selectedNode.data.rating}</span>
                    </p>
                  )}
                </motion.div>
              </Panel>
            )}
          </ReactFlow>
        )}
      </motion.div>
        </div>
        {/* Diagnostics sidebar */}
        <DiagnosticsPanel diagnostics={diagnostics} />
      </div>
    </DashboardLayout>
  );
}
