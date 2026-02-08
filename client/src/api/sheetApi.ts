import axios from 'axios';
import type { ReorderPayload, SheetState } from '../types/sheet';

export interface QuestionInput {
  title: string;
  source?: string;
  difficulty: Question['difficulty'];
  solved?: boolean;
  starred?: boolean;
  notes?: string;
  youtubeUrl?: string;
  tags?: string[];
}

export interface TopicInput {
  title: string;
}

export interface SubTopicInput {
  title: string;
}

export const sheetApi = {
  async getSheet(): Promise<SheetState> {
    const { data } = await axios.get('/api/sheet');
    return data.data;
  },
  async createTopic(payload: TopicInput): Promise<SheetState> {
    const { data } = await axios.post('/api/topics', payload);
    return data.data;
  },
  async updateTopic(topicId: string, payload: Partial<TopicInput>): Promise<SheetState> {
    const { data } = await axios.patch(`/api/topics/${topicId}`, payload);
    return data.data;
  },
  async deleteTopic(topicId: string): Promise<SheetState> {
    const { data } = await axios.delete(`/api/topics/${topicId}`);
    return data.data;
  },
  async createSubTopic(topicId: string, payload: SubTopicInput): Promise<SheetState> {
    const { data } = await axios.post(`/api/topics/${topicId}/subtopics`, payload);
    return data.data;
  },
  async updateSubTopic(subTopicId: string, payload: Partial<SubTopicInput>): Promise<SheetState> {
    const { data } = await axios.patch(`/api/subtopics/${subTopicId}`, payload);
    return data.data;
  },
  async deleteSubTopic(subTopicId: string): Promise<SheetState> {
    const { data } = await axios.delete(`/api/subtopics/${subTopicId}`);
    return data.data;
  },
  async createQuestion(subTopicId: string, payload: QuestionInput): Promise<SheetState> {
    const { data } = await axios.post(`/api/subtopics/${subTopicId}/questions`, payload);
    return data.data;
  },
  async updateQuestion(questionId: string, payload: Partial<QuestionInput>): Promise<SheetState> {
    const { data } = await axios.patch(`/api/questions/${questionId}`, payload);
    return data.data;
  },
  async deleteQuestion(questionId: string): Promise<SheetState> {
    const { data } = await axios.delete(`/api/questions/${questionId}`);
    return data.data;
  },
  async reorder(payload: ReorderPayload): Promise<SheetState> {
    const { data } = await axios.post('/api/reorder', payload);
    return data.data;
  },
  async exportSheet(): Promise<SheetState> {
    const { data } = await axios.get('/api/export');
    return data.data;
  },
  async importSheet(payload: SheetState): Promise<SheetState> {
    const { data } = await axios.post('/api/import', payload);
    return data.data;
  }
};
