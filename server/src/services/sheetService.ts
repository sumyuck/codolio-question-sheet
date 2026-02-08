import path from 'node:path';
import crypto from 'node:crypto';
import { z } from 'zod';
import { fileExists, readJsonFile, writeJsonFile } from '../utils/fileIO.js';
import type { Question, ReorderPayload, SheetState, SubTopic, Topic } from '../types/sheet.js';

const seedPath = path.resolve(process.cwd(), 'seed', 'sheet.json');
const statePath = path.resolve(process.cwd(), 'data', 'state.json');

const difficultyEnum = z.enum(['Basic', 'Easy', 'Medium', 'Hard']);

const seedQuestionSchema = z.object({
  title: z.string(),
  difficulty: difficultyEnum.optional().default('Basic'),
  source: z.string().optional(),
  youtubeUrl: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  solved: z.boolean().optional().default(false),
  starred: z.boolean().optional().default(false)
});

const seedSchema = z.union([
  z.object({
    topics: z.array(
      z.object({
        title: z.string(),
        subTopics: z.array(
          z.object({
            title: z.string(),
            questions: z.array(seedQuestionSchema)
          })
        )
      })
    )
  }),
  z.object({
    data: z.array(
      z.object({
        topic: z.string(),
        subTopic: z.string(),
        title: z.string(),
        difficulty: difficultyEnum.optional(),
        source: z.string().optional(),
        youtubeUrl: z.string().optional(),
        notes: z.string().optional(),
        solved: z.boolean().optional(),
        starred: z.boolean().optional()
      })
    )
  })
]);

let sheetState: SheetState | null = null;

const computeProgress = (questions: Question[]) => {
  const solved = questions.filter((question) => question.solved).length;
  return { solved, total: questions.length };
};

const recomputeProgress = (state: SheetState): SheetState => {
  const topics = state.topics.map((topic, topicIndex) => {
    const subTopics = topic.subTopics.map((subTopic, subIndex) => ({
      ...subTopic,
      order: subIndex,
      questions: subTopic.questions.map((question, qIndex) => ({ ...question, order: qIndex })),
      progress: computeProgress(subTopic.questions)
    }));
    const topicProgress = computeProgress(subTopics.flatMap((subTopic) => subTopic.questions));
    return {
      ...topic,
      order: topicIndex,
      subTopics,
      progress: topicProgress
    };
  });
  return {
    ...state,
    topics,
    updatedAt: new Date().toISOString()
  };
};

const toQuestion = (input: z.infer<typeof seedQuestionSchema>, order: number): Question => ({
  id: crypto.randomUUID(),
  title: input.title,
  order,
  source: input.source ?? 'TUF',
  difficulty: input.difficulty ?? 'Basic',
  solved: input.solved ?? false,
  starred: input.starred ?? false,
  notes: input.notes ?? '',
  youtubeUrl: input.youtubeUrl ?? '',
  tags: input.tags ?? []
});

const transformSeed = (raw: unknown): SheetState => {
  const parsed = seedSchema.parse(raw);

  let topics: Topic[] = [];

  if ('topics' in parsed) {
    topics = parsed.topics.map((topic, topicIndex) => {
      const subTopics: SubTopic[] = topic.subTopics.map((subTopic, subIndex) => {
        const questions = subTopic.questions.map((question, qIndex) => toQuestion(question, qIndex));
        return {
          id: crypto.randomUUID(),
          title: subTopic.title,
          order: subIndex,
          questions,
          progress: computeProgress(questions)
        };
      });
      return {
        id: crypto.randomUUID(),
        title: topic.title,
        order: topicIndex,
        subTopics,
        progress: computeProgress(subTopics.flatMap((sub) => sub.questions))
      };
    });
  }

  if ('data' in parsed) {
    const grouped = new Map<string, Map<string, z.infer<typeof seedQuestionSchema>[]>>();
    parsed.data.forEach((row) => {
      if (!grouped.has(row.topic)) grouped.set(row.topic, new Map());
      const subMap = grouped.get(row.topic)!;
      if (!subMap.has(row.subTopic)) subMap.set(row.subTopic, []);
      subMap.get(row.subTopic)!.push({
        title: row.title,
        difficulty: row.difficulty ?? 'Basic',
        source: row.source,
        youtubeUrl: row.youtubeUrl,
        notes: row.notes,
        solved: row.solved ?? false,
        starred: row.starred ?? false
      });
    });

    topics = Array.from(grouped.entries()).map(([topicTitle, subMap], topicIndex) => {
      const subTopics = Array.from(subMap.entries()).map(([subTitle, questions], subIndex) => {
        const normalizedQuestions = questions.map((question, qIndex) => toQuestion(question, qIndex));
        return {
          id: crypto.randomUUID(),
          title: subTitle,
          order: subIndex,
          questions: normalizedQuestions,
          progress: computeProgress(normalizedQuestions)
        };
      });
      return {
        id: crypto.randomUUID(),
        title: topicTitle,
        order: topicIndex,
        subTopics,
        progress: computeProgress(subTopics.flatMap((sub) => sub.questions))
      };
    });
  }

  return {
    topics,
    updatedAt: new Date().toISOString(),
    version: 1
  };
};

export const loadSheetState = async (): Promise<SheetState> => {
  if (sheetState) return sheetState;
  if (await fileExists(statePath)) {
    sheetState = await readJsonFile<SheetState>(statePath);
    return sheetState;
  }
  const seed = await readJsonFile<unknown>(seedPath);
  sheetState = transformSeed(seed);
  await writeJsonFile(statePath, sheetState);
  return sheetState;
};

export const getSheetState = async (): Promise<SheetState> => {
  if (!sheetState) {
    return loadSheetState();
  }
  return sheetState;
};

const persistState = async () => {
  if (!sheetState) return;
  sheetState = recomputeProgress(sheetState);
  await writeJsonFile(statePath, sheetState);
};

export const setSheetState = async (nextState: SheetState) => {
  sheetState = recomputeProgress(nextState);
  await writeJsonFile(statePath, sheetState);
  return sheetState;
};

export const addTopic = async (title: string) => {
  const state = await getSheetState();
  const topic: Topic = {
    id: crypto.randomUUID(),
    title,
    order: state.topics.length,
    subTopics: [],
    progress: { solved: 0, total: 0 }
  };
  state.topics.push(topic);
  await persistState();
  return sheetState!;
};

export const updateTopic = async (topicId: string, title?: string) => {
  const state = await getSheetState();
  const topic = state.topics.find((item) => item.id === topicId);
  if (!topic) throw new Error('Topic not found');
  if (title) topic.title = title;
  await persistState();
  return sheetState!;
};

export const deleteTopic = async (topicId: string) => {
  const state = await getSheetState();
  state.topics = state.topics.filter((topic) => topic.id !== topicId);
  await persistState();
  return sheetState!;
};

export const addSubTopic = async (topicId: string, title: string) => {
  const state = await getSheetState();
  const topic = state.topics.find((item) => item.id === topicId);
  if (!topic) throw new Error('Topic not found');
  const subTopic: SubTopic = {
    id: crypto.randomUUID(),
    title,
    order: topic.subTopics.length,
    questions: [],
    progress: { solved: 0, total: 0 }
  };
  topic.subTopics.push(subTopic);
  await persistState();
  return sheetState!;
};

export const updateSubTopic = async (subTopicId: string, title?: string) => {
  const state = await getSheetState();
  const subTopic = state.topics.flatMap((topic) => topic.subTopics).find((item) => item.id === subTopicId);
  if (!subTopic) throw new Error('Subtopic not found');
  if (title) subTopic.title = title;
  await persistState();
  return sheetState!;
};

export const deleteSubTopic = async (subTopicId: string) => {
  const state = await getSheetState();
  state.topics.forEach((topic) => {
    topic.subTopics = topic.subTopics.filter((subTopic) => subTopic.id !== subTopicId);
  });
  await persistState();
  return sheetState!;
};

export const addQuestion = async (subTopicId: string, input: Omit<Question, 'id' | 'order'>) => {
  const state = await getSheetState();
  const subTopic = state.topics.flatMap((topic) => topic.subTopics).find((item) => item.id === subTopicId);
  if (!subTopic) throw new Error('Subtopic not found');
  const question: Question = {
    ...input,
    id: crypto.randomUUID(),
    order: subTopic.questions.length
  };
  subTopic.questions.push(question);
  await persistState();
  return sheetState!;
};

export const updateQuestion = async (questionId: string, payload: Partial<Question>) => {
  const state = await getSheetState();
  const question = state.topics
    .flatMap((topic) => topic.subTopics)
    .flatMap((sub) => sub.questions)
    .find((item) => item.id === questionId);
  if (!question) throw new Error('Question not found');
  Object.assign(question, payload);
  await persistState();
  return sheetState!;
};

export const deleteQuestion = async (questionId: string) => {
  const state = await getSheetState();
  state.topics.forEach((topic) => {
    topic.subTopics.forEach((subTopic) => {
      subTopic.questions = subTopic.questions.filter((question) => question.id !== questionId);
    });
  });
  await persistState();
  return sheetState!;
};

export const reorderSheet = async (payload: ReorderPayload) => {
  const state = await getSheetState();
  if (payload.type === 'topic') {
    const [removed] = state.topics.splice(payload.from.index, 1);
    state.topics.splice(payload.to.index, 0, removed);
  }
  if (payload.type === 'subtopic') {
    const topic = state.topics.find((item) => item.id === payload.from.containerId);
    if (!topic) throw new Error('Topic not found');
    const [removed] = topic.subTopics.splice(payload.from.index, 1);
    topic.subTopics.splice(payload.to.index, 0, removed);
  }
  if (payload.type === 'question') {
    const fromSub = state.topics
      .flatMap((topic) => topic.subTopics)
      .find((sub) => sub.id === payload.from.containerId);
    const toSub = state.topics
      .flatMap((topic) => topic.subTopics)
      .find((sub) => sub.id === payload.to.containerId);
    if (!fromSub || !toSub) throw new Error('Subtopic not found');
    const [removed] = fromSub.questions.splice(payload.from.index, 1);
    toSub.questions.splice(payload.to.index, 0, removed);
  }
  await persistState();
  return sheetState!;
};
