export type Difficulty = 'Basic' | 'Easy' | 'Medium' | 'Hard';

export interface Progress {
  solved: number;
  total: number;
}

export interface Question {
  id: string;
  title: string;
  order: number;
  source?: string;
  difficulty: Difficulty;
  solved: boolean;
  starred: boolean;
  notes?: string;
  youtubeUrl?: string;
  problemUrl?: string;
  tags?: string[];
}

export interface SubTopic {
  id: string;
  title: string;
  order: number;
  progress: Progress;
  questions: Question[];
}

export interface Topic {
  id: string;
  title: string;
  order: number;
  progress: Progress;
  subTopics: SubTopic[];
}

export interface SheetState {
  topics: Topic[];
  updatedAt: string;
  version: number;
}

export interface ReorderPayload {
  type: 'topic' | 'subtopic' | 'question';
  from: { containerId: string; index: number };
  to: { containerId: string; index: number };
  itemId: string;
}
