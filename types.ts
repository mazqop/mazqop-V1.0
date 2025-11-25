export enum AgentType {
  ARCHITECT = 'ARCHITECT', // Focuses on Outlines, Structure, Pacing
  WRITER = 'WRITER',       // Focuses on Prose, Dialogue, Scene setting
  REVIEWER = 'REVIEWER'    // Focuses on consistency and editing
}

export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  content?: string; // Only for files
  children?: FileNode[]; // Only for folders
  isOpen?: boolean; // For folder expansion
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  agent?: AgentType; // Which agent generated this
}

export enum WorkflowStep {
  IDLE = 'IDLE',
  PLANNING = 'PLANNING', // Generating Outline
  WRITING = 'WRITING',   // Generating Prose
  REVIEWING = 'REVIEWING'
}

export interface ProjectState {
  files: FileNode[];
  activeFileId: string | null;
  expandedFolders: string[];
}