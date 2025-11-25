import React, { useState, useCallback, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Editor } from './components/Editor';
import { ChatPanel } from './components/ChatPanel';
import { FileNode, ChatMessage, AgentType, WorkflowStep } from './types';
import { INITIAL_FILES, SYSTEM_INSTRUCTIONS } from './constants';
import { generateAgentResponse } from './services/geminiService';
import { BookOpenText, Layout } from 'lucide-react';

const App: React.FC = () => {
  // --- State ---
  const [files, setFiles] = useState<FileNode[]>(INITIAL_FILES);
  const [activeFileId, setActiveFileId] = useState<string | null>('macro_outline');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeAgent, setActiveAgent] = useState<AgentType>(AgentType.ARCHITECT);
  const [workflowStep, setWorkflowStep] = useState<WorkflowStep>(WorkflowStep.IDLE);
  
  // Custom Prompts State
  const [systemPrompts, setSystemPrompts] = useState<Record<AgentType, string>>(SYSTEM_INSTRUCTIONS);

  // Editor Comparison State
  const [previewContent, setPreviewContent] = useState<string | null>(null);

  // References State (for UI display)
  const [activeReferences, setActiveReferences] = useState<string[]>([]);
  
  // UI State
  const [sidebarVisible, setSidebarVisible] = useState(true);

  // --- File System Helpers ---
  const findFile = useCallback((nodes: FileNode[], id: string): FileNode | null => {
    for (const node of nodes) {
      if (node.id === id) return node;
      if (node.children) {
        const found = findFile(node.children, id);
        if (found) return found;
      }
    }
    return null;
  }, []);

  const findParentFolder = useCallback((nodes: FileNode[], childId: string): FileNode | null => {
      for (const node of nodes) {
          if (node.type === 'folder' && node.children) {
              if (node.children.some(child => child.id === childId)) {
                  return node;
              }
              const foundInSub = findParentFolder(node.children, childId);
              if (foundInSub) return foundInSub;
          }
      }
      return null;
  }, []);

  const updateFileContent = useCallback((nodes: FileNode[], id: string, newContent: string): FileNode[] => {
    return nodes.map((node) => {
      if (node.id === id) {
        return { ...node, content: newContent };
      }
      if (node.children) {
        return { ...node, children: updateFileContent(node.children, id, newContent) };
      }
      return node;
    });
  }, []);

  const toggleFolder = useCallback((nodes: FileNode[], id: string): FileNode[] => {
    return nodes.map((node) => {
      if (node.id === id) {
        return { ...node, isOpen: !node.isOpen };
      }
      if (node.children) {
        return { ...node, children: toggleFolder(node.children, id) };
      }
      return node;
    });
  }, []);

  const getFolderFilesContent = useCallback((folder: FileNode): {name: string, content: string}[] => {
      let results: {name: string, content: string}[] = [];
      if (folder.children) {
          folder.children.forEach(child => {
              if (child.type === 'file' && child.content) {
                  results.push({ name: child.name, content: child.content });
              } else if (child.type === 'folder') {
                  results = [...results, ...getFolderFilesContent(child)];
              }
          });
      }
      return results;
  }, []);

  const activeFile = activeFileId ? findFile(files, activeFileId) : null;

  // --- Context Building ---
  const getContextForAI = () => {
    let context = "";
    const refs: string[] = [];
    
    const settingsFolder = findFile(files, 'settings_folder');
    if (settingsFolder) {
        const settingFiles = getFolderFilesContent(settingsFolder);
        if (settingFiles.length > 0) {
            context += "【核心设定资料库 (必须严格遵守)】\n";
            settingFiles.forEach(f => {
                context += `--- 文件名: ${f.name} ---\n${f.content}\n\n`;
                refs.push(f.name);
            });
            context += "【设定资料结束，以上内容为绝对真理】\n\n";
        }
    }

    if (activeFile && activeFile.content) {
        context += `【当前编辑文件】${activeFile.name}:\n${activeFile.content}\n\n`;
        refs.push(activeFile.name);
    }

    if (activeFileId) {
        const parentFolder = findParentFolder(files, activeFileId);
        if (parentFolder && parentFolder.children) {
            parentFolder.children.forEach(sibling => {
                if (sibling.id !== activeFileId && sibling.type === 'file' && sibling.content) {
                    context += `【同章节/同目录参考】${sibling.name}:\n${sibling.content}\n\n`;
                    refs.push(sibling.name);
                }
            });
        }
    }

    setActiveReferences([...new Set(refs)]);
    return context;
  };

  // --- Event Handlers ---
  const handleFileClick = (id: string) => {
    if (previewContent) {
        if (!confirm("您有未保存的比对内容，切换文件将丢弃更改。确认切换吗？")) {
            return;
        }
        setPreviewContent(null);
    }

    setActiveFileId(id);
    const node = findFile(files, id);
    if (node) {
        if (node.name.includes('细纲') || node.name.includes('大纲')) {
            setActiveAgent(AgentType.ARCHITECT);
            setWorkflowStep(WorkflowStep.PLANNING);
        } else if (node.name.includes('正文')) {
            setActiveAgent(AgentType.WRITER);
            setWorkflowStep(WorkflowStep.WRITING);
        }
    }
  };

  const handleToggleFolder = (id: string) => {
    setFiles(prev => toggleFolder(prev, id));
  };

  const handleEditorChange = (newContent: string) => {
    if (activeFileId) {
      setFiles(prev => updateFileContent(prev, activeFileId, newContent));
    }
  };

  const handleApplyContent = (contentToInsert: string) => {
      if(activeFileId && activeFile) {
          const currentContent = activeFile.content || "";
          const newContent = currentContent + (currentContent ? "\n\n" : "") + contentToInsert;
          setPreviewContent(newContent);
      }
  };

  const handleAcceptPreview = () => {
      if (activeFileId && previewContent !== null) {
          setFiles(prev => updateFileContent(prev, activeFileId, previewContent));
          setPreviewContent(null);
      }
  };

  const handleRejectPreview = () => {
      setPreviewContent(null);
  };

  const handleUpdateSystemPrompt = (agent: AgentType, newPrompt: string) => {
      setSystemPrompts(prev => ({
          ...prev,
          [agent]: newPrompt
      }));
  };

  // Logic to Reverse Engineer Outline from Prose
  const handleReverseOutline = async () => {
      if (!activeFile || !activeFileId) return;

      // 1. Find the sibling Outline file
      const parentFolder = findParentFolder(files, activeFileId);
      const outlineFile = parentFolder?.children?.find(
          c => c.type === 'file' && (c.name.includes('细纲') || c.name.includes('大纲'))
      );

      if (!outlineFile) {
          alert('未在当前目录下找到“细纲”或“大纲”文件，无法进行反向同步。请确保目录结构包含对应的细纲文件。');
          return;
      }

      setIsLoading(true);

      // 2. Construct Prompt
      const reversePrompt = `请阅读以下小说正文，反向归纳出详细的章节细纲。
要求：
1. 提取核心冲突、关键剧情点。
2. 标注出场景变化和情绪起伏（Beats）。
3. 记录文中埋下的伏笔。
4. 输出格式必须符合【细纲专家】的标准格式。

【小说正文】：
${activeFile.content}`;

      try {
        // 3. Call AI (Using Architect Agent)
        const responseText = await generateAgentResponse(
            AgentType.ARCHITECT,
            reversePrompt,
            getContextForAI(), // Still pass context for character names accuracy etc.
            systemPrompts[AgentType.ARCHITECT]
        );

        // 4. Switch Context to Outline File and Enter Diff Mode
        setActiveFileId(outlineFile.id);
        setActiveAgent(AgentType.ARCHITECT); // Switch agent focus
        
        // We set the preview content. If outline was empty, it's all new. 
        // If outline existed, it acts as a comparison/update.
        setPreviewContent(responseText);

        // Add a system message to chat to inform user
        const sysMsg: ChatMessage = {
            id: Date.now().toString(),
            role: 'model',
            text: `已根据正文内容反向生成了细纲。请在左侧编辑器中审阅差异，点击下方“采纳变更”以保存。`,
            timestamp: Date.now(),
            agent: AgentType.ARCHITECT
        };
        setMessages(prev => [...prev, sysMsg]);

      } catch (err) {
        console.error("Failed to generate outline", err);
        alert("生成细纲失败，请重试。");
      } finally {
        setIsLoading(false);
      }
  };

  const handleSendMessage = async (text: string, agent: AgentType) => {
    const newUserMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, newUserMsg]);
    setIsLoading(true);

    const context = getContextForAI(); 
    const currentSystemPrompt = systemPrompts[agent];

    try {
      const responseText = await generateAgentResponse(agent, text, context, currentSystemPrompt);
      
      const newAiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: Date.now(),
        agent: agent
      };
      setMessages((prev) => [...prev, newAiMsg]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
      getContextForAI();
  }, [activeFileId, files]);

  return (
    <div className="flex flex-col h-screen w-screen bg-zinc-950 text-gray-300 font-sans overflow-hidden">
        {/* Top App Header */}
        <header className="h-12 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between px-4 shrink-0 z-20">
            <div className="flex items-center gap-3">
                <BookOpenText className="text-blue-500" size={20} />
                <span className="font-semibold text-gray-200 tracking-tight">NovelCraft AI</span>
                <span className="text-xs bg-zinc-800 text-gray-500 px-2 py-0.5 rounded border border-zinc-700">Alpha</span>
            </div>
            <div className="flex items-center gap-2">
                <button 
                    onClick={() => setSidebarVisible(!sidebarVisible)}
                    className={`p-1.5 rounded hover:bg-zinc-800 transition-colors ${!sidebarVisible ? 'text-gray-500' : 'text-gray-300'}`}
                    title="切换侧边栏"
                >
                    <Layout size={18} />
                </button>
            </div>
        </header>

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden">
            {/* Left Sidebar */}
            {sidebarVisible && (
                <div className="w-64 flex-shrink-0 bg-zinc-900/50 border-r border-zinc-800 transition-all duration-300">
                    <Sidebar 
                        files={files} 
                        activeFileId={activeFileId} 
                        onFileClick={handleFileClick} 
                        onToggleFolder={handleToggleFolder} 
                    />
                </div>
            )}

            {/* Center: Editor Canvas */}
            <div className="flex-1 flex flex-col min-w-0 bg-zinc-950 relative">
                <Editor 
                    activeFile={activeFile} 
                    content={activeFile?.content || ''} 
                    onChange={handleEditorChange} 
                    previewContent={previewContent}
                    onAcceptPreview={handleAcceptPreview}
                    onRejectPreview={handleRejectPreview}
                    onReverseOutline={handleReverseOutline}
                    isLoading={isLoading}
                />
            </div>

            {/* Right Sidebar: AI Chat */}
            <div className="w-[400px] flex-shrink-0 bg-zinc-900 border-l border-zinc-800 flex flex-col shadow-2xl z-10">
                <ChatPanel 
                    messages={messages} 
                    onSendMessage={handleSendMessage} 
                    isLoading={isLoading} 
                    activeAgent={activeAgent}
                    setActiveAgent={setActiveAgent}
                    workflowStep={workflowStep}
                    onApplyContent={handleApplyContent}
                    systemPrompts={systemPrompts}
                    onUpdateSystemPrompt={handleUpdateSystemPrompt}
                    activeReferences={activeReferences}
                />
            </div>
        </div>
    </div>
  );
};

export default App;