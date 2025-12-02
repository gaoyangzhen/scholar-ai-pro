export interface Model {
  id: string;
  name: string;
  desc: string;
  badge: string;
  isDefault: boolean;
  key?: string; // Optional key for user-added models
}

export interface HistoryRecord {
  id: number;
  type: 'review' | 'editor';
  title: string;
  date: string;
  score?: number;
  words?: number;
}

export interface DiffItem {
  id: number;
  original: string;
  revised: string;
  type: string;
  severity: 'Low' | 'Medium' | 'High';
  reasonCN: string;
  reasonEN: string;
  highlight: boolean;
  resolved: boolean;
}

export interface SavedPrompt {
  id: number;
  name: string;
  content: string;
  isSystem: boolean;
}

export interface Chapter {
  id: string;
  title: string;
  level: number;
  children?: Chapter[];
}

export interface GlossaryTerm {
  id: string;
  source: string;
  target: string;
  category?: string;
  createdAt: string;
}

export interface FileItem {
  id: number;
  name: string;
  type: string;
  size: string;
}

export interface NavigationState {
  module: 'reviewer' | 'editor' | 'kb' | 'history' | 'translator' | 'glossary';
  step?: 'upload' | 'analysis' | 'chat';
  editorMode?: 'polish' | 'expand' | 'summarize' | 'none';
}

export type UserMode = 'guest' | 'account';

export interface ReviewScore {
  subject: string;
  A: number;
  fullMark: number;
}