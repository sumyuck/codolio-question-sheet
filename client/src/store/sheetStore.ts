import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { ReorderPayload, SheetState } from '../types/sheet';
import { sheetApi, type QuestionInput, type SubTopicInput, type TopicInput } from '../api/sheetApi';

interface DrawerState {
  open: boolean;
  mode: 'add' | 'edit';
  questionId?: string;
  subTopicId?: string;
  tab: 'overview' | 'notes';
}

interface SheetStore {
  sheet: SheetState | null;
  loading: boolean;
  search: string;
  drawer: DrawerState;
  setSearch: (value: string) => void;
  fetchSheet: () => Promise<void>;
  openDrawer: (payload: Partial<DrawerState>) => void;
  closeDrawer: () => void;
  setDrawerTab: (tab: DrawerState['tab']) => void;
  createTopic: (payload: TopicInput) => Promise<void>;
  updateTopic: (topicId: string, payload: Partial<TopicInput>) => Promise<void>;
  deleteTopic: (topicId: string) => Promise<void>;
  createSubTopic: (topicId: string, payload: SubTopicInput) => Promise<void>;
  updateSubTopic: (subTopicId: string, payload: Partial<SubTopicInput>) => Promise<void>;
  deleteSubTopic: (subTopicId: string) => Promise<void>;
  createQuestion: (subTopicId: string, payload: QuestionInput) => Promise<void>;
  updateQuestion: (questionId: string, payload: Partial<QuestionInput>) => Promise<void>;
  deleteQuestion: (questionId: string) => Promise<void>;
  reorder: (payload: ReorderPayload) => Promise<void>;
  importSheet: (payload: SheetState) => Promise<void>;
  exportSheet: () => Promise<SheetState | null>;
}

export const useSheetStore = create<SheetStore>()(
  devtools((set, get) => ({
    sheet: null,
    loading: false,
    search: '',
    drawer: {
      open: false,
      mode: 'add',
      tab: 'overview'
    },
    setSearch: (value) => set({ search: value }),
    fetchSheet: async () => {
      set({ loading: true });
      const sheet = await sheetApi.getSheet();
      set({ sheet, loading: false });
    },
    openDrawer: (payload) =>
      set((state) => ({
        drawer: {
          ...state.drawer,
          ...payload,
          open: true
        }
      })),
    closeDrawer: () =>
      set((state) => ({
        drawer: {
          ...state.drawer,
          open: false,
          questionId: undefined,
          subTopicId: undefined
        }
      })),
    setDrawerTab: (tab) => set((state) => ({ drawer: { ...state.drawer, tab } })),
    createTopic: async (payload) => {
      const sheet = await sheetApi.createTopic(payload);
      set({ sheet });
    },
    updateTopic: async (topicId, payload) => {
      const sheet = await sheetApi.updateTopic(topicId, payload);
      set({ sheet });
    },
    deleteTopic: async (topicId) => {
      const sheet = await sheetApi.deleteTopic(topicId);
      set({ sheet });
    },
    createSubTopic: async (topicId, payload) => {
      const sheet = await sheetApi.createSubTopic(topicId, payload);
      set({ sheet });
    },
    updateSubTopic: async (subTopicId, payload) => {
      const sheet = await sheetApi.updateSubTopic(subTopicId, payload);
      set({ sheet });
    },
    deleteSubTopic: async (subTopicId) => {
      const sheet = await sheetApi.deleteSubTopic(subTopicId);
      set({ sheet });
    },
    createQuestion: async (subTopicId, payload) => {
      const sheet = await sheetApi.createQuestion(subTopicId, payload);
      set({ sheet });
    },
    updateQuestion: async (questionId, payload) => {
      const sheet = await sheetApi.updateQuestion(questionId, payload);
      set({ sheet });
    },
    deleteQuestion: async (questionId) => {
      const sheet = await sheetApi.deleteQuestion(questionId);
      set({ sheet });
    },
    reorder: async (payload) => {
      const updated = await sheetApi.reorder(payload);
      set({ sheet: updated });
    },
    importSheet: async (payload) => {
      const sheet = await sheetApi.importSheet(payload);
      set({ sheet });
    },
    exportSheet: async () => {
      const sheet = await sheetApi.exportSheet();
      return sheet;
    }
  }))
);
