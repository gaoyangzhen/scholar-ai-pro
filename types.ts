export interface Model {
  id: string;
  name: string;
  desc: string;
  badge: string;
  isDefault: boolean;
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

export interface GlossaryItem {
  id: number;
  cn: string;
  en: string;
  note: string;
}

export interface FileItem {
  id: number;
  name: string;
  type: string;
  size: string;
}

export interface NavigationState {
  module: 'reviewer' | 'editor' | 'kb' | 'history';
  step?: 'upload' | 'dashboard' | 'detail';
  editorMode?: 'none' | 'blank' | 'uploaded';
}

export type UserMode = 'guest' | 'account';

export interface ReviewScore {
  subject: string;
  A: number;
  fullMark: number;
}