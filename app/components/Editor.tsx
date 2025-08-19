"use client";

import React, { useState } from "react";
import Editor from "@monaco-editor/react";

interface CodeEditorProps {
  activeFile: string;
  code: string;
  onCodeChange: (newCode: string) => void;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ activeFile, code, onCodeChange }) => {
  const [theme, setTheme] = useState("vs-dark");

  const toggleTheme = () => {
    setTheme(theme === "vs-dark" ? "light" : "vs-dark");
  };

  return (
    <div>
      <button onClick={toggleTheme}>
        {theme === "vs-dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
      </button>
      <Editor
        height="90vh"
        language={activeFile ? activeFile.split(".").pop() : "javascript"}
        value={code}
        theme={theme}
        onChange={(value) => onCodeChange(value || "")}
      />
    </div>
  );
};

export default CodeEditor;