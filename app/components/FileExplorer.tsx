import React from 'react';

interface FileExplorerProps {
  onFileClick: (fileName: string) => void;
}

const FileExplorer: React.FC<FileExplorerProps> = ({ onFileClick }) => {
  const files = ['file1.js', 'file2.css', 'file3.html'];

  return (
    <div style={{ width: '200px', borderRight: '1px solid #ccc' }}>
      <h3>Files</h3>
      <ul>
        {files.map((file, index) => (
          <li key={index} style={{ cursor: 'pointer' }} onClick={() => onFileClick(file)}>
            {file}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default FileExplorer;