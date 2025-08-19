import React from 'react';

interface TabsProps {
  openFiles: string[];
  activeFile: string;
  onTabClick: (fileName: string) => void;
  onTabClose: (fileName: string) => void;
}

const Tabs: React.FC<TabsProps> = ({ openFiles, activeFile, onTabClick, onTabClose }) => {
  return (
    <div style={{ display: 'flex' }}>
      {openFiles.map((file, index) => (
        <div
          key={index}
          style={{
            padding: '8px 10px',
            cursor: 'pointer',
            backgroundColor: file === activeFile ? '#121212' : 'transparent',
            border: '1px solid #2a2a2a',
            borderBottom: 'none',
            borderTopLeftRadius: 8,
            borderTopRightRadius: 8,
          }}
          onClick={() => onTabClick(file)}
        >
          {file}
          <button
            style={{ marginLeft: '5px', cursor: 'pointer', background: 'transparent', border: 'none', color: '#9ca3af' }}
            onClick={(e) => {
              e.stopPropagation();
              onTabClose(file);
            }}
          >
            x
          </button>
        </div>
      ))}
    </div>
  );
};

export default Tabs;