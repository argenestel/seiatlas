"use client";

import React, { useState } from "react";
import Chat from "./Chat";
import FileSystemTool from "./FileSystemTool";

interface ProjectFile { path: string; content: string }

interface SidePanelProps {
  files: ProjectFile[];
  activeFile: string;
  onCreateFile: (path: string, content?: string) => void;
  onUpdateFile: (path: string, content: string) => void;
  onRenameFile: (oldPath: string, newPath: string) => void;
  onDeleteFile: (path: string) => void;
  onOpenFile: (path: string) => void;
  onCodeChange: (newCode: string) => void;
}

export default function SidePanel(props: SidePanelProps) {
  const { files, activeFile, onCreateFile, onUpdateFile, onRenameFile, onDeleteFile, onOpenFile, onCodeChange } = props;
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const raw = window.localStorage.getItem('seiatlas.sidebar.collapsed');
    return raw === '1';
  });
  const [activeTab, setActiveTab] = useState<"chat" | "files">(() => {
    if (typeof window === 'undefined') return 'chat';
    return (window.localStorage.getItem('seiatlas.sidebar.tab') as any) || 'chat';
  });

  const persist = (key: string, value: string) => {
    try { window.localStorage.setItem(key, value); } catch {}
  };

  if (collapsed) {
    return (
      <div style={{ width: 44, borderRight: "1px solid #333", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, paddingTop: 8 }}>
        <button title="Toggle sidebar" onClick={() => { setCollapsed(false); persist('seiatlas.sidebar.collapsed','0'); }} style={{ background: "#333", color: "#d4d4d4", border: "1px solid #444", borderRadius: 6, width: 32, height: 32, cursor: "pointer" }}>≡</button>
        <button title="Chat" onClick={() => { setActiveTab("chat"); setCollapsed(false); persist('seiatlas.sidebar.tab','chat'); persist('seiatlas.sidebar.collapsed','0'); }} style={{ background: activeTab === "chat" ? "#444" : "transparent", color: "#d4d4d4", border: "none", borderRadius: 6, width: 32, height: 32, cursor: "pointer" }}>💬</button>
        <button title="Files" onClick={() => { setActiveTab("files"); setCollapsed(false); persist('seiatlas.sidebar.tab','files'); persist('seiatlas.sidebar.collapsed','0'); }} style={{ background: activeTab === "files" ? "#444" : "transparent", color: "#d4d4d4", border: "none", borderRadius: 6, width: 32, height: 32, cursor: "pointer" }}>📁</button>
      </div>
    );
  }

  return (
    <div style={{ width: 360, borderRight: "1px solid #333", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 8, borderBottom: "1px solid #333" }}>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setActiveTab("chat")} style={{ background: activeTab === "chat" ? "#444" : "transparent", color: "#d4d4d4", border: "1px solid #444", padding: "6px 10px", borderRadius: 6, cursor: "pointer" }}>Chat</button>
          <button onClick={() => setActiveTab("files")} style={{ background: activeTab === "files" ? "#444" : "transparent", color: "#d4d4d4", border: "1px solid #444", padding: "6px 10px", borderRadius: 6, cursor: "pointer" }}>Files</button>
        </div>
        <button onClick={() => { setCollapsed(true); persist('seiatlas.sidebar.collapsed','1'); }} style={{ background: "transparent", color: "#d4d4d4", border: "1px solid #444", padding: "4px 8px", borderRadius: 6, cursor: "pointer" }}>Collapse</button>
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        {activeTab === "chat" ? (
          <Chat
            activeFile={activeFile}
            onCodeChange={onCodeChange}
            onCreateFile={onCreateFile}
            onUpdateFile={onUpdateFile}
            onOpenFile={onOpenFile}
          />
        ) : (
          <FileSystemTool
            files={files}
            onCreateFile={onCreateFile}
            onUpdateFile={onUpdateFile}
            onRenameFile={onRenameFile}
            onDeleteFile={onDeleteFile}
            onOpenFile={onOpenFile}
          />
        )}
      </div>
    </div>
  );
}


