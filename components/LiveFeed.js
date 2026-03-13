"use client";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// ─── Dept colors for agent avatars ────────────────────────────────────────────

const DEPT_COLOR = {
  content:    "#ec4899",
  research:   "#f59e0b",
  operations: "#6366f1",
  build:      "#06b6d4",
};

const TYPE_ICON = {
  code:            "⌨",
  document:        "◻",
  research_summary:"◎",
  spec:            "▤",
  draft:           "✎",
  link:            "⤷",
  image:           "⬡",
  status_report:   "◈",
};

function getAgentByDisplayName(agents, name) {
  return agents.find(a =>
    a.display_name?.toLowerCase() === name?.toLowerCase()
  );
}

function getAgentByName(agents, name) {
  return agents.find(a =>
    a.name?.toLowerCase() === name?.toLowerCase()
  );
}

function AgentAvatar({ name, dept }) {
  const color = DEPT_COLOR[dept] || "#c9a96e";
  const initials = name?.slice(0, 2).toUpperCase() || "??";
  return (
    <div style={{
      width: 32, height: 32, borderRadius: 8, flexShrink: 0,
      background: `${color}18`,
      border: `1.5px solid ${color}40`,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <span style={{ fontSize: 11, fontWeight: 700, color, letterSpacing: -0.3 }}>
        {initials}
      </span>
    </div>
  );
}

function timeAgo(iso) {
  if (!iso) return "";
  const diff  = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hrs   = Math.floor(mins / 60);
  const days  = Math.floor(hrs / 24);
  if (mins < 1)   return "just now";
  if (mins < 60)  return `${mins}m`;
  if (hrs  < 24)  return `${hrs}h`;
  return `${days}d`;
}

// ─── Feed items ───────────────────────────────────────────────────────────────

function CommentFeedItem({ item, agents }) {
  const agent = getAgentByDisplayName(agents, item.author_name);
  const authorColor =
    item.author_type === "denver" ? "#c9a96e" :
    item.author_type === "system" ? "#444" : null;
  const nameColor = authorColor || DEPT_COLOR[agent?.department] || "#888";
  const preview = item.body?.slice(0, 100) + (item.body?.length > 100 ? "…" : "");

  return (
    <div style={{
      padding: "10px 14px",
      borderBottom: "1px solid #111",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <AgentAvatar
          name={agent?.display_name || item.author_name}
          dept={agent?.department}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Name + time */}
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: nameColor }}>
              {item.author_name}
            </span>
            <span style={{ fontSize: 10, color: "#333", flexShrink: 0, marginLeft: 6 }}>
              {timeAgo(item.created_at)}
            </span>
          </div>
          {/* Task ref */}
          <div style={{
            fontSize: 11, color: "#444", marginBottom: 4,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            #{item.task_number} · {item.task_title}
          </div>
          {/* Body preview */}
          {preview && (
            <div style={{
              fontSize: 12, color: "#777",
              lineHeight: 1.5,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}>
              {preview}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DeliverableFeedItem({ item, agents }) {
  const agent = getAgentByName(agents, item.created_by);
  const color = DEPT_COLOR[agent?.department] || "#c9a96e";
  const icon  = TYPE_ICON[item.deliverable_type] || "◎";

  return (
    <div style={{
      padding: "10px 14px",
      borderBottom: "1px solid #111",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <AgentAvatar
          name={agent?.display_name || item.created_by}
          dept={agent?.department}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color }}>
              {agent?.display_name || item.created_by}
            </span>
            <span style={{ fontSize: 10, color: "#333", flexShrink: 0, marginLeft: 6 }}>
              {timeAgo(item.created_at)}
            </span>
          </div>
          <div style={{
            fontSize: 11, color: "#444", marginBottom: 4,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            #{item.task_number} · {item.task_title}
          </div>
          {/* Deliverable card */}
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "#141414",
            border: "1px solid #222",
            borderRadius: 6, padding: "5px 8px",
          }}>
            <span style={{ fontSize: 12, color: color, flexShrink: 0 }}>{icon}</span>
            <span style={{
              fontSize: 12, color: "#888", flex: 1,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {item.deliverable_title}
            </span>
            <span style={{
              fontSize: 9, color: "#10b981",
              background: "#10b98118", padding: "1px 5px", borderRadius: 3,
              flexShrink: 0, fontWeight: 600, letterSpacing: 0.5,
            }}>
              DELIVERED
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main LiveFeed ─────────────────────────────────────────────────────────────

export default function LiveFeed({ agents }) {
  const [items, setItems] = useState([]);

  const loadFeed = useCallback(async () => {
    const [cm, dv] = await Promise.all([
      sb.from("mc_task_comments")
        .select("id, author_name, author_type, comment_type, body, created_at, mc_tasks(task_number, title)")
        .order("created_at", { ascending: false })
        .limit(20),
      sb.from("mc_task_deliverables")
        .select("id, created_by, type, title, summary, created_at, mc_tasks(task_number, title)")
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

    const comments = (cm.data || []).map(c => ({
      _type:       "comment",
      id:          c.id,
      author_name: c.author_name,
      author_type: c.author_type,
      comment_type: c.comment_type,
      body:        c.body,
      created_at:  c.created_at,
      task_number: c.mc_tasks?.task_number,
      task_title:  c.mc_tasks?.title,
    }));

    const deliverables = (dv.data || []).map(d => ({
      _type:            "deliverable",
      id:               d.id,
      created_by:       d.created_by,
      deliverable_type: d.type,
      deliverable_title: d.title,
      summary:          d.summary,
      created_at:       d.created_at,
      task_number:      d.mc_tasks?.task_number,
      task_title:       d.mc_tasks?.title,
    }));

    const merged = [...comments, ...deliverables].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    ).slice(0, 30);

    setItems(merged);
  }, []);

  useEffect(() => {
    loadFeed();
    const t = setInterval(loadFeed, 30000);
    return () => clearInterval(t);
  }, [loadFeed]);

  return (
    <div style={{
      width: 280,
      flexShrink: 0,
      height: "100%",
      display: "flex",
      flexDirection: "column",
      background: "#0a0a0a",
      borderLeft: "1px solid #161616",
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        padding: "12px 14px 10px",
        borderBottom: "1px solid #161616",
        flexShrink: 0,
        display: "flex", alignItems: "center", gap: 8,
      }}>
        <div style={{
          width: 6, height: 6, borderRadius: "50%",
          background: "#10b981",
          boxShadow: "0 0 6px #10b981",
          flexShrink: 0,
        }} />
        <span style={{
          fontSize: 10, color: "#555",
          letterSpacing: 2, fontWeight: 700, textTransform: "uppercase",
        }}>
          Live Feed
        </span>
      </div>

      {/* Feed items */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {items.length === 0 && (
          <div style={{
            padding: "40px 14px",
            textAlign: "center",
            color: "#222", fontSize: 12,
          }}>
            No activity yet.
          </div>
        )}
        {items.map(item =>
          item._type === "comment"
            ? <CommentFeedItem key={`c-${item.id}`} item={item} agents={agents} />
            : <DeliverableFeedItem key={`d-${item.id}`} item={item} agents={agents} />
        )}
      </div>
    </div>
  );
}
