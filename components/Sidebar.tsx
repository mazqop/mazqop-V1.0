import React from 'react';
import { FileNode } from '../types';
import { Folder, FileText, ChevronRight, ChevronDown, FolderPlus } from 'lucide-react';

interface SidebarProps {
  files: FileNode[];
  activeFileId: string | null;
  onFileClick: (id: string) => void;
  onToggleFolder: (id: string) => void;
}

const FileTreeItem: React.FC<{
  node: FileNode;
  activeFileId: string | null;
  level: number;
  onFileClick: (id: string) => void;
  onToggleFolder: (id: string) => void;
}> = ({ node, activeFileId, level, onFileClick, onToggleFolder }) => {
  const isSelected = node.id === activeFileId;
  const paddingLeft = `${level * 12 + 12}px`;

  return (
    <div>
      <div
        className={`flex items-center py-1 cursor-pointer select-none text-sm hover:bg-[#2b2d31] transition-colors ${
          isSelected ? 'bg-[#37373d] text-white' : 'text-gray-400'
        }`}
        style={{ paddingLeft }}
        onClick={() => {
          if (node.type === 'folder') {
            onToggleFolder(node.id);
          } else {
            onFileClick(node.id);
          }
        }}
      >
        <span className="mr-1">
          {node.type === 'folder' && (
            node.isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />
          )}
          {node.type === 'file' && <span className="w-[14px] inline-block" />} 
        </span>
        <span className="mr-2">
          {node.type === 'folder' ? (
            <Folder size={16} className="text-blue-400" />
          ) : (
            <FileText size={16} className="text-gray-300" />
          )}
        </span>
        <span className="truncate">{node.name}</span>
      </div>
      {node.type === 'folder' && node.isOpen && node.children && (
        <div>
          {node.children.map((child) => (
            <FileTreeItem
              key={child.id}
              node={child}
              activeFileId={activeFileId}
              level={level + 1}
              onFileClick={onFileClick}
              onToggleFolder={onToggleFolder}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const Sidebar: React.FC<SidebarProps> = ({
  files,
  activeFileId,
  onFileClick,
  onToggleFolder,
}) => {
  return (
    <div className="h-full bg-[#18181b] border-r border-[#2b2d31] flex flex-col">
      <div className="p-3 text-xs font-bold text-gray-500 uppercase tracking-wider flex justify-between items-center">
        <span>资源管理器</span>
        <div className="flex gap-2">
            <FileText size={14} className="hover:text-white cursor-pointer" title="新建文件" />
            <FolderPlus size={14} className="hover:text-white cursor-pointer" title="新建文件夹" />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {files.map((node) => (
          <FileTreeItem
            key={node.id}
            node={node}
            activeFileId={activeFileId}
            level={0}
            onFileClick={onFileClick}
            onToggleFolder={onToggleFolder}
          />
        ))}
      </div>
    </div>
  );
};