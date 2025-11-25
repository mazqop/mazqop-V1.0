import React, { useMemo } from 'react';
import { FileNode } from '../types';
import * as Diff from 'diff';
import { Check, X, Sparkles } from 'lucide-react';

interface EditorProps {
  activeFile: FileNode | null;
  content: string;
  onChange: (newContent: string) => void;
  previewContent?: string | null;
  onAcceptPreview?: () => void;
  onRejectPreview?: () => void;
  onReverseOutline?: () => void; // New callback
  isLoading?: boolean; // To disable button during generation
}

export const Editor: React.FC<EditorProps> = ({ 
    activeFile, 
    content, 
    onChange,
    previewContent,
    onAcceptPreview,
    onRejectPreview,
    onReverseOutline,
    isLoading
}) => {
  if (!activeFile) {
    return (
      <div className="h-full flex items-center justify-center text-zinc-600 bg-zinc-950">
        <div className="text-center p-8 border border-zinc-800 rounded-xl bg-zinc-900/50">
            <p className="text-xl mb-2 font-light text-zinc-300">NovelCraft AI</p>
            <p className="text-sm">请在左侧选择章节或设定开始创作</p>
        </div>
      </div>
    );
  }

  // Diff Logic
  const diffGroups = useMemo(() => {
    if (!previewContent) return [];
    return Diff.diffLines(content, previewContent);
  }, [content, previewContent]);

  // Check if current file is a "Prose" file to show the button
  const isProseFile = activeFile.name.includes('正文');

  return (
    <div className="h-full flex flex-col relative overflow-hidden">
      {/* Editor Tab / Breadcrumb */}
      <div className="h-10 bg-zinc-950 border-b border-zinc-800 flex items-center px-6 justify-between shrink-0">
        <span className="text-sm text-zinc-400 flex items-center gap-2 font-medium">
            {activeFile.name}
            {previewContent && (
                <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-500/20 animate-pulse">
                    AI 建议比对中
                </span>
            )}
        </span>
        
        <div className="flex items-center gap-4">
            {/* Reverse Outline Button */}
            {isProseFile && !previewContent && (
                <button 
                    onClick={onReverseOutline}
                    disabled={isLoading}
                    className={`flex items-center gap-1.5 text-xs px-3 py-1 rounded-md transition-all border ${
                        isLoading 
                        ? 'bg-zinc-800 text-zinc-500 border-zinc-700 cursor-not-allowed' 
                        : 'bg-purple-900/20 text-purple-300 border-purple-500/30 hover:bg-purple-900/40 hover:text-white hover:border-purple-400'
                    }`}
                    title="根据当前正文内容，反向生成或更新该章节的细纲"
                >
                    <Sparkles size={12} className={isLoading ? "animate-spin" : ""} />
                    {isLoading ? "生成中..." : "一键生成本章细纲"}
                </button>
            )}

            <div className="text-xs text-zinc-600 font-mono border-l border-zinc-800 pl-4">
                {content.length} 字符
            </div>
        </div>
      </div>
      
      {/* Main Editing Area - Centered Document Style */}
      <div className="flex-1 overflow-y-auto bg-zinc-950 custom-scrollbar relative">
          <div className="max-w-3xl mx-auto min-h-full bg-zinc-950 py-8 px-8 md:px-12 shadow-sm">
            {previewContent ? (
                // Diff View
                <div className="font-sans text-base leading-relaxed text-zinc-300 whitespace-pre-wrap">
                    {diffGroups.map((part, index) => {
                        if (part.removed) {
                            return (
                                <div key={index} className="bg-red-900/20 text-red-200/50 line-through decoration-red-800/50 px-1 -mx-1 rounded-sm my-0.5 border-l-2 border-red-800/50">
                                    {part.value}
                                </div>
                            );
                        }
                        if (part.added) {
                            return (
                                <div key={index} className="bg-green-900/20 text-green-100 px-1 -mx-1 rounded-sm my-0.5 border-l-2 border-green-600 shadow-sm">
                                    {part.value}
                                </div>
                            );
                        }
                        return <span key={index} className="opacity-70">{part.value}</span>;
                    })}
                    
                    {/* Padding at bottom for floating bar */}
                    <div className="h-24"></div> 
                </div>
            ) : (
                // Normal Edit View
                <textarea
                    className="w-full h-full min-h-[calc(100vh-120px)] bg-transparent text-zinc-200 resize-none focus:outline-none font-sans text-base leading-relaxed placeholder-zinc-700 selection:bg-blue-500/30"
                    value={content}
                    onChange={(e) => onChange(e.target.value)}
                    spellCheck={false}
                    placeholder="开始你的创作..."
                />
            )}
          </div>
      </div>

      {/* Floating Action Bar for Diff Mode */}
      {previewContent && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 flex flex-col items-center animate-in slide-in-from-bottom-4 fade-in duration-300">
            <div className="flex items-center gap-1 p-1 bg-zinc-800 border border-zinc-700 rounded-full shadow-2xl">
                <button 
                   onClick={onRejectPreview}
                   className="flex items-center gap-2 pl-4 pr-3 py-2 rounded-full text-zinc-300 hover:bg-zinc-700 hover:text-white transition-all text-sm font-medium"
                >
                    <X size={16} /> 放弃
                </button>
                <div className="w-px h-6 bg-zinc-700 mx-1"></div>
                <button 
                   onClick={onAcceptPreview}
                   className="flex items-center gap-2 pl-3 pr-4 py-2 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 transition-all text-sm font-medium"
                >
                    <Check size={16} /> 采纳变更
                </button>
            </div>
            <div className="mt-2 text-xs text-zinc-500 bg-zinc-900/80 px-2 py-1 rounded backdrop-blur-sm border border-zinc-800">
                AI 生成内容预览模式
            </div>
        </div>
      )}
    </div>
  );
};