"use client";

import React, { useState } from "react";

interface ProjectFile {
  path: string;
  content: string;
}

interface FileSystemToolProps {
  files: ProjectFile[];
  onCreateFile: (path: string, content?: string) => void;
  onUpdateFile: (path: string, content: string) => void;
  onRenameFile: (oldPath: string, newPath: string) => void;
  onDeleteFile: (path: string) => void;
  onOpenFile: (path: string) => void;
}

export default function FileSystemTool(props: FileSystemToolProps) {
  const { files, onCreateFile, onUpdateFile, onRenameFile, onDeleteFile, onOpenFile } = props;
  const [newPath, setNewPath] = useState("");
  const [newContent, setNewContent] = useState("");
  const [renameFrom, setRenameFrom] = useState("");
  const [renameTo, setRenameTo] = useState("");

  return (
    <div style={{ width: 320, borderRight: "1px solid #333", display: "flex", flexDirection: "column", gap: 12, padding: 12 }}>
      <div>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>Project Files</div>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            placeholder="path/to/file.sol"
            value={newPath}
            onChange={(e) => setNewPath(e.target.value)}
            style={{ flex: 1, background: "#2a2a2a", color: "#d4d4d4", border: "1px solid #444", padding: 6, borderRadius: 6 }}
          />
          <button
            onClick={() => {
              if (!newPath.trim()) return;
              onCreateFile(newPath.trim(), newContent);
              setNewPath("");
              setNewContent("");
            }}
            style={{ background: "#10b981", color: "white", border: "none", padding: "6px 10px", borderRadius: 6, cursor: "pointer" }}
          >
            Create
          </button>
        </div>
        <textarea
          placeholder="optional initial content"
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          style={{ marginTop: 8, width: "100%", minHeight: 60, background: "#2a2a2a", color: "#d4d4d4", border: "1px solid #444", padding: 6, borderRadius: 6 }}
        />
      </div>

      <div>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            placeholder="rename from path"
            value={renameFrom}
            onChange={(e) => setRenameFrom(e.target.value)}
            style={{ flex: 1, background: "#2a2a2a", color: "#d4d4d4", border: "1px solid #444", padding: 6, borderRadius: 6 }}
          />
          <input
            placeholder="rename to path"
            value={renameTo}
            onChange={(e) => setRenameTo(e.target.value)}
            style={{ flex: 1, background: "#2a2a2a", color: "#d4d4d4", border: "1px solid #444", padding: 6, borderRadius: 6 }}
          />
          <button
            onClick={() => {
              if (!renameFrom.trim() || !renameTo.trim()) return;
              onRenameFile(renameFrom.trim(), renameTo.trim());
              setRenameFrom("");
              setRenameTo("");
            }}
            style={{ background: "#f59e0b", color: "#0a0a0a", border: "none", padding: "6px 10px", borderRadius: 6, cursor: "pointer" }}
          >
            Rename
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", borderTop: "1px solid #333", paddingTop: 8 }}>
        {files.map((f) => (
          <div key={f.path} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px dashed #333" }}>
            <button onClick={() => onOpenFile(f.path)} style={{ background: "transparent", color: "#d4d4d4", border: "none", textAlign: "left", cursor: "pointer" }}>{f.path}</button>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => onDeleteFile(f.path)} style={{ background: "#ef4444", color: "white", border: "none", padding: "4px 8px", borderRadius: 6, cursor: "pointer" }}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}



