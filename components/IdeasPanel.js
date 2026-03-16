"use client";
import { useState, useRef, useEffect } from "react";

// ─── Single Idea Row ──────────────────────────────────────────────────────────

function IdeaRow({ idea, isSelected, onSelect, onPromote }) {
  const date = new Date(idea.created_at).toLocaleDateString("en-US", {
    month: "short", day: "numeric",
  });
  const sourceLabel = idea.source === "janet" ? "Janet" : null;

  return (
    <div
      onClick={() => onSelect(idea)}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        padding: "14px 14px",
        background: isSelected ? "#1e1e1e" : "#141414",
        cursor: "pointer",
        borderRadius: 10,
        margin: "0 12px 5px",
        border: isSelected ? "1px solid rgba(201,169,110,0.25)" : "1px solid transparent",
        transition: "background 0.1s",
      }}
    >
      {/* Lightbulb icon */}
      <span style={{
        fontSize: 16,
        flexShrink: 0,
        marginTop: 1,
        color: isSelected ? "#c9a96e" : "#333",
        transition: "color 0.1s",
      }}>
        💡
      </span>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 16,
          color: "#f0f0f0",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          lineHeight: 1.4,
        }}>
          {idea.title}
        </div>
        {idea.body && (
          <div style={{
            fontSize: 13,
            color: "#555",
            marginTop: 3,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}>
            {idea.body}
          </div>
        )}
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          marginTop: 4,
        }}>
          <span style={{ fontSize: 11, color: "#444" }}>{date}</span>
          {sourceLabel && (
            <span style={{
              fontSize: 10, color: "#6366f1",
              background: "#6366f11a", padding: "1px 5px", borderRadius: 3,
            }}>
              {sourceLabel}
            </span>
          )}
          {idea.promoted_to_task_id && (
            <span style={{
              fontSize: 10, color: "#10b981",
              background: "#10b9811a", padding: "1px 5px", borderRadius: 3,
            }}>
              → Task
            </span>
          )}
        </div>
      </div>

      {/* Promote button */}
      {!idea.promoted_to_task_id && (
        <button
          onClick={(e) => { e.stopPropagation(); onPromote(idea); }}
          title="Promote to task"
          style={{
            background: "none",
            border: "1px solid #222",
            borderRadius: 6,
            color: "#444",
            fontSize: 11,
            cursor: "pointer",
            padding: "4px 8px",
            flexShrink: 0,
            transition: "border-color 0.1s, color 0.1s",
            whiteSpace: "nowrap",
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "#c9a96e"; e.currentTarget.style.color = "#c9a96e"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "#222"; e.currentTarget.style.color = "#444"; }}
        >
          → Task
        </button>
      )}
    </div>
  );
}

// ─── Idea Detail (right panel) ────────────────────────────────────────────────

function IdeaDetail({ idea, folders, onClose, onUpdate, onDelete, onPromote, isMobile }) {
  const [editTitle, setEditTitle] = useState(idea.title);
  const [editBody,  setEditBody]  = useState(idea.body || "");
  const [editFolder, setEditFolder] = useState(idea.folder_id || "");
  const [dirty, setDirty] = useState(false);

  // Reset when idea changes
  useEffect(() => {
    setEditTitle(idea.title);
    setEditBody(idea.body || "");
    setEditFolder(idea.folder_id || "");
    setDirty(false);
  }, [idea.id]);

  const handleSave = () => {
    if (!editTitle.trim()) return;
    onUpdate(idea.id, {
      title:     editTitle.trim(),
      body:      editBody.trim() || null,
      folder_id: editFolder || null,
    });
    setDirty(false);
  };

  const date = new Date(idea.created_at).toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric",
  });

  return (
    <div style={{
      height: "100%",
      display: "flex",
      flexDirection: "column",
      background: "#0d0d0d",
      borderLeft: isMobile ? "none" : "1px solid #1a1a1a",
    }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "16px 16px 12px",
        borderBottom: "1px solid #1a1a1a",
        flexShrink: 0,
      }}>
        <span style={{ fontSize: 11, color: "#555", letterSpacing: 1.5, textTransform: "uppercase" }}>
          Idea
        </span>
        <button
          onClick={onClose}
          style={{
            background: "none", border: "none",
            color: "#444", fontSize: 22, cursor: "pointer",
            padding: "0 2px", lineHeight: 1,
          }}
        >
          ×
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 16px" }}>
        {/* Title */}
        <input
          value={editTitle}
          onChange={e => { setEditTitle(e.target.value); setDirty(true); }}
          placeholder="Idea title"
          style={{
            width: "100%", boxSizing: "border-box",
            background: "none", border: "none", outline: "none",
            fontSize: 22, fontWeight: 600,
            color: "#f0f0f0", lineHeight: 1.3,
            marginBottom: 16,
            padding: 0,
          }}
        />

        {/* Notes */}
        <textarea
          value={editBody}
          onChange={e => { setEditBody(e.target.value); setDirty(true); }}
          placeholder="Add notes..."
          rows={6}
          style={{
            width: "100%", boxSizing: "border-box",
            background: "#1a1a1a", border: "1px solid #222",
            borderRadius: 8, outline: "none",
            fontSize: 14, color: "#ccc",
            padding: "12px", lineHeight: 1.6,
            resize: "vertical",
            fontFamily: "inherit",
          }}
        />

        {/* Folder selector */}
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 11, color: "#555", letterSpacing: 1.2, marginBottom: 6, textTransform: "uppercase" }}>
            Folder
          </div>
          <select
            value={editFolder}
            onChange={e => { setEditFolder(e.target.value); setDirty(true); }}
            style={{
              background: "#1a1a1a", border: "1px solid #222",
              borderRadius: 8, color: "#ccc",
              fontSize: 14, padding: "8px 12px",
              outline: "none", cursor: "pointer", width: "100%",
            }}
          >
            <option value="">No folder</option>
            {folders.map(f => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
        </div>

        {/* Meta */}
        <div style={{ marginTop: 20, fontSize: 12, color: "#444" }}>
          Captured {date}
          {idea.source === "janet" && " by Janet"}
        </div>
      </div>

      {/* Footer actions */}
      <div style={{
        padding: "12px 16px",
        borderTop: "1px solid #1a1a1a",
        display: "flex", gap: 8,
        flexShrink: 0,
      }}>
        {dirty && (
          <button
            onClick={handleSave}
            style={{
              flex: 1,
              background: "#c9a96e", border: "none",
              borderRadius: 8, color: "#000",
              fontSize: 14, fontWeight: 600,
              padding: "10px", cursor: "pointer",
              transition: "opacity 0.1s",
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
            onMouseLeave={e => e.currentTarget.style.opacity = "1"}
          >
            Save
          </button>
        )}
        {!idea.promoted_to_task_id && (
          <button
            onClick={() => onPromote(idea)}
            style={{
              flex: dirty ? 0 : 1,
              background: "#1a1a1a", border: "1px solid #333",
              borderRadius: 8, color: "#c9a96e",
              fontSize: 14, padding: "10px 16px",
              cursor: "pointer",
              transition: "border-color 0.1s",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = "#c9a96e"}
            onMouseLeave={e => e.currentTarget.style.borderColor = "#333"}
          >
            → Promote to Task
          </button>
        )}
        <button
          onClick={() => { if (confirm("Delete this idea?")) onDelete(idea.id); }}
          style={{
            background: "none", border: "1px solid #222",
            borderRadius: 8, color: "#444",
            fontSize: 14, padding: "10px 12px",
            cursor: "pointer",
            transition: "color 0.1s, border-color 0.1s",
          }}
          onMouseEnter={e => { e.currentTarget.style.color = "#ef4444"; e.currentTarget.style.borderColor = "#ef4444"; }}
          onMouseLeave={e => { e.currentTarget.style.color = "#444"; e.currentTarget.style.borderColor = "#222"; }}
        >
          🗑
        </button>
      </div>
    </div>
  );
}

// ─── Ideas Panel ──────────────────────────────────────────────────────────────

export default function IdeasPanel({
  ideas,
  folders,
  activeView,      // "ideas:all" | "ideas:folder:{id}"
  selectedId,
  isMobile,
  onIdeaSelect,
  onAddIdea,
  onUpdateIdea,
  onDeleteIdea,
  onPromoteIdea,
  onAddFolder,
}) {
  const [captureText, setCaptureText] = useState("");
  const inputRef = useRef(null);

  // Determine which folder is active
  const activeFolderId = activeView.startsWith("ideas:folder:")
    ? activeView.slice("ideas:folder:".length)
    : null;

  const activeFolder = activeFolderId
    ? folders.find(f => f.id === activeFolderId)
    : null;

  // Filter ideas to current view
  const filteredIdeas = activeFolderId
    ? ideas.filter(i => i.folder_id === activeFolderId)
    : ideas;

  // Sort by newest first
  const sorted = [...filteredIdeas].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );

  const selectedIdea = ideas.find(i => i.id === selectedId) || null;
  const showDetail = !!selectedIdea;

  const handleCapture = (e) => {
    if (e.key === "Enter" && captureText.trim()) {
      onAddIdea(captureText.trim(), activeFolderId);
      setCaptureText("");
    }
    if (e.key === "Escape") {
      setCaptureText("");
      inputRef.current?.blur();
    }
  };

  const viewTitle = activeFolder ? activeFolder.name : "All Ideas";

  return (
    <div style={{
      height: "100%",
      display: "flex",
      overflow: "hidden",
      minWidth: 0,
    }}>
      {/* Ideas list -- hidden on mobile when detail is open */}
      {(!isMobile || !showDetail) && (
        <div style={{
          flex: showDetail && !isMobile ? "0 0 auto" : 1,
          width: showDetail && !isMobile ? "calc(100% - 400px)" : "100%",
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          background: "#000",
        }}>
          {/* Header */}
          <div style={{ padding: "24px 20px 10px", flexShrink: 0 }}>
            <h1 style={{
              fontSize: 34,
              fontWeight: 700,
              color: "#c9a96e",
              margin: 0,
              lineHeight: 1.15,
              letterSpacing: -0.5,
            }}>
              {viewTitle}
            </h1>
            <div style={{ fontSize: 13, color: "#444", marginTop: 4 }}>
              {sorted.length} {sorted.length === 1 ? "idea" : "ideas"}
            </div>
          </div>

          {/* Ideas list */}
          <div style={{ flex: 1, overflowY: "auto", paddingTop: 6 }}>
            {sorted.length === 0 && (
              <div style={{
                textAlign: "center",
                padding: "60px 20px",
                color: "#252525",
                fontSize: 14,
              }}>
                No ideas yet. Capture one below.
              </div>
            )}

            {sorted.map(idea => (
              <IdeaRow
                key={idea.id}
                idea={idea}
                isSelected={idea.id === selectedId}
                onSelect={onIdeaSelect}
                onPromote={onPromoteIdea}
              />
            ))}

            <div style={{ height: 12 }} />
          </div>

          {/* Capture bar */}
          <div style={{
            flexShrink: 0,
            padding: "8px 12px 14px",
            background: "#000",
            borderTop: "1px solid #1a1a1a",
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              background: "#1c1c1c",
              borderRadius: 10,
              padding: "14px 14px",
              border: "1px solid transparent",
            }}>
              <span style={{
                color: "#c9a96e",
                fontSize: 20,
                lineHeight: 1,
                flexShrink: 0,
              }}>
                💡
              </span>
              <input
                ref={inputRef}
                value={captureText}
                onChange={e => setCaptureText(e.target.value)}
                onKeyDown={handleCapture}
                placeholder="Capture an idea"
                style={{
                  flex: 1,
                  background: "none",
                  border: "none",
                  outline: "none",
                  color: "#f0f0f0",
                  fontSize: 16,
                }}
              />
              {captureText && (
                <span style={{ fontSize: 12, color: "#555", flexShrink: 0 }}>↵</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Detail panel */}
      {showDetail && (
        <div style={{
          width:      isMobile ? "100%" : 400,
          flexShrink: 0,
          overflow:   "hidden",
          display:    "flex",
          flexDirection: "column",
        }}>
          <IdeaDetail
            idea={selectedIdea}
            folders={folders}
            isMobile={isMobile}
            onClose={() => onIdeaSelect(null)}
            onUpdate={onUpdateIdea}
            onDelete={onDeleteIdea}
            onPromote={onPromoteIdea}
          />
        </div>
      )}
    </div>
  );
}
