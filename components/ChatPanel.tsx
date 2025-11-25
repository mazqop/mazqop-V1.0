import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, AgentType, WorkflowStep } from '../types';
import { Send, Bot, User, Sparkles, BookOpen, PenTool, CheckCircle, Settings, X, Save, FileText } from 'lucide-react';

interface ChatPanelProps {
  messages: ChatMessage[];
  onSendMessage: (text: string, agent: AgentType) => void;
  isLoading: boolean;
  activeAgent: AgentType;
  setActiveAgent: (agent: AgentType) => void;
  workflowStep: WorkflowStep;
  onApplyContent: (content: string) => void;
  systemPrompts: Record<AgentType, string>;
  onUpdateSystemPrompt: (agent: AgentType, newPrompt: string) => void;
  activeReferences: string[]; // List of file names being referenced
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  onSendMessage,
  isLoading,
  activeAgent,
  setActiveAgent,
  workflowStep,
  onApplyContent,
  systemPrompts,
  onUpdateSystemPrompt,
  activeReferences
}) => {
  const [input, setInput] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input, activeAgent);
    setInput('');
  };

  const getAgentDisplayName = (agent: AgentType) => {
    switch (agent) {
      case AgentType.ARCHITECT: return '细纲专家';
      case AgentType.WRITER: return '正文作家';
      case AgentType.REVIEWER: return '审阅顾问';
      default: return agent;
    }
  };

  const getWorkflowDisplayName = (step: WorkflowStep) => {
    switch (step) {
        case WorkflowStep.IDLE: return '就绪';
        case WorkflowStep.PLANNING: return '构思中';
        case WorkflowStep.WRITING: return '写作中';
        case WorkflowStep.REVIEWING: return '审阅中';
        default: return step;
    }
  };

  const renderAgentSelector = () => (
    <div className="flex bg-[#2b2d31] p-1 rounded-md mb-4 mx-4 mt-4">
      <button
        onClick={() => setActiveAgent(AgentType.ARCHITECT)}
        className={`flex-1 flex items-center justify-center py-1 text-xs rounded ${
          activeAgent === AgentType.ARCHITECT ? 'bg-[#37373d] text-white' : 'text-gray-400 hover:text-gray-200'
        }`}
        title="负责章节结构和剧情推演"
      >
        <BookOpen size={12} className="mr-1" /> 细纲
      </button>
      <button
        onClick={() => setActiveAgent(AgentType.WRITER)}
        className={`flex-1 flex items-center justify-center py-1 text-xs rounded ${
          activeAgent === AgentType.WRITER ? 'bg-[#37373d] text-white' : 'text-gray-400 hover:text-gray-200'
        }`}
        title="负责正文扩写"
      >
        <PenTool size={12} className="mr-1" /> 正文
      </button>
      <button
        onClick={() => setActiveAgent(AgentType.REVIEWER)}
        className={`flex-1 flex items-center justify-center py-1 text-xs rounded ${
          activeAgent === AgentType.REVIEWER ? 'bg-[#37373d] text-white' : 'text-gray-400 hover:text-gray-200'
        }`}
        title="负责检查和优化"
      >
        <CheckCircle size={12} className="mr-1" /> 审阅
      </button>
    </div>
  );

  const SettingsPanel = () => {
      const [localPrompt, setLocalPrompt] = useState(systemPrompts[activeAgent]);

      useEffect(() => {
          setLocalPrompt(systemPrompts[activeAgent]);
      }, [activeAgent, systemPrompts]);

      const handleSave = () => {
          onUpdateSystemPrompt(activeAgent, localPrompt);
          setShowSettings(false);
      };

      return (
        <div className="absolute inset-0 bg-[#18181b] z-20 flex flex-col">
            <div className="h-9 border-b border-[#2b2d31] flex items-center px-4 justify-between bg-[#1f2125]">
                <span className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                    <Settings size={14} />
                    配置: {getAgentDisplayName(activeAgent)}提示词
                </span>
                <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-white">
                    <X size={14} />
                </button>
            </div>
            <div className="flex-1 p-4 flex flex-col">
                <p className="text-xs text-gray-500 mb-2">在此处修改该智能体的系统提示词 (System Instruction)。</p>
                <textarea 
                    className="flex-1 bg-[#2b2d31] text-gray-200 text-xs p-3 rounded resize-none focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                    value={localPrompt}
                    onChange={(e) => setLocalPrompt(e.target.value)}
                />
            </div>
            <div className="p-4 border-t border-[#2b2d31] flex justify-end">
                <button 
                    onClick={handleSave}
                    className="flex items-center gap-1 bg-blue-600 hover:bg-blue-500 text-white text-xs px-3 py-1.5 rounded transition-colors"
                >
                    <Save size={12} /> 保存设置
                </button>
            </div>
        </div>
      );
  };

  return (
    <div className="h-full flex flex-col bg-[#18181b] border-l border-[#2b2d31] w-[350px] relative">
        {showSettings && <SettingsPanel />}

        {/* Header */}
        <div className="h-9 border-b border-[#2b2d31] flex items-center px-4 justify-between">
            <span className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                <Sparkles size={14} className="text-purple-400" />
                AI 智能体
            </span>
            <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-500 uppercase border border-gray-700 px-1 rounded">
                    {getWorkflowDisplayName(workflowStep)}
                </span>
                <button 
                    onClick={() => setShowSettings(true)}
                    className="text-gray-400 hover:text-white p-1 rounded hover:bg-[#2b2d31] transition-colors"
                    title="设置提示词"
                >
                    <Settings size={14} />
                </button>
            </div>
        </div>

        {renderAgentSelector()}

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
                <div className="text-gray-500 text-center text-sm mt-10 px-4">
                    <p>欢迎使用 NovelCraft。</p>
                    <p className="mt-2 text-xs">工作流建议：先切换到“细纲”生成章节大纲，再切换到“正文”进行扩写。</p>
                </div>
            )}
            {messages.map((msg) => (
            <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`flex items-center gap-2 mb-1 text-xs text-gray-500`}>
                    {msg.role === 'user' ? (
                        <><span>你</span><User size={12}/></>
                    ) : (
                        <><Bot size={12}/><span>{getAgentDisplayName(msg.agent!)}</span></>
                    )}
                </div>
                <div
                className={`max-w-[90%] rounded-lg p-3 text-sm whitespace-pre-wrap ${
                    msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-[#2b2d31] text-gray-200 border border-gray-700'
                }`}
                >
                {msg.text}
                </div>
                
                {/* Apply content button for AI messages */}
                {msg.role === 'model' && (
                    <button 
                        onClick={() => onApplyContent(msg.text)}
                        className="mt-2 text-xs flex items-center gap-1 text-green-400 hover:text-green-300 transition-colors bg-[#2b2d31] px-2 py-1 rounded border border-gray-700"
                        title="在编辑器中比对并插入"
                    >
                        <PenTool size={10} /> 
                        <span className="font-medium">比对并采纳</span>
                    </button>
                )}
            </div>
            ))}
            <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-[#2b2d31] bg-[#18181b]">
             {/* Reference Indicator (TRAE Style) */}
            <div className="mb-2 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                <span className="text-[10px] text-gray-500 shrink-0">引用:</span>
                {activeReferences.length > 0 ? activeReferences.map((ref, idx) => (
                    <div key={idx} className="flex items-center gap-1 bg-[#2b2d31] text-gray-300 px-1.5 py-0.5 rounded text-[10px] border border-gray-700 whitespace-nowrap">
                        <FileText size={8} />
                        {ref}
                    </div>
                )) : (
                    <span className="text-[10px] text-gray-600 italic">无上下文</span>
                )}
            </div>

            <form onSubmit={handleSubmit} className="relative">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={`向 ${getAgentDisplayName(activeAgent)} 提问...`}
                    className="w-full bg-[#2b2d31] text-gray-200 text-sm rounded-md pl-3 pr-10 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-gray-500"
                    disabled={isLoading}
                />
                <button
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white disabled:opacity-50"
                >
                    <Send size={16} />
                </button>
            </form>
            <div className="mt-2 flex justify-between items-center">
                <span className="text-[10px] text-gray-500"></span>
                <span className="text-[10px] text-purple-400 flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                    Gemini 2.5 Flash
                </span>
            </div>
        </div>
    </div>
  );
};