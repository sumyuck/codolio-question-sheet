import path from 'node:path';
import crypto from 'node:crypto';
import { z } from 'zod';
import { fileExists, readJsonFile, writeJsonFile } from '../utils/fileIO.js';
import type { Question, ReorderPayload, SheetState, SubTopic, Topic } from '../types/sheet.js';

const seedPath = path.resolve(process.cwd(), 'seed', 'sheet.json');
const statePath = path.resolve(process.cwd(), 'data', 'state.json');

const difficultyEnum = z.enum(['Basic', 'Easy', 'Medium', 'Hard']);

const seedQuestionSchema = z
  .object({
    title: z.string(),
    difficulty: difficultyEnum.optional().default('Basic'),
    source: z.string().optional(),
    youtubeUrl: z.string().optional(),
    problemUrl: z.string().optional(),
    notes: z.string().optional(),
    tags: z.array(z.string()).optional(),
    solved: z.boolean().optional().default(false),
    starred: z.boolean().optional().default(false)
  })
  .passthrough();

const seedRowSchema = z
  .object({
    topic: z.string().optional(),
    subTopic: z.string().optional(),
    title: z.string().optional(),
    difficulty: difficultyEnum.optional(),
    source: z.string().optional(),
    youtubeUrl: z.string().optional(),
    notes: z.string().optional(),
    solved: z.boolean().optional(),
    starred: z.boolean().optional()
  })
  .passthrough();

const hierarchicalSchema = z.object({
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
});

const seedSchema = z.union([
  hierarchicalSchema,

  // { data: [...] }
  z.object({ data: z.array(seedRowSchema) }),

  // { data: { questions: [...] } }
  z.object({
    data: z
      .object({
        sheet: z.any().optional(),
        questions: z.array(seedRowSchema)
      })
      .passthrough()
  }),

  // directly: [...]
  z.array(seedRowSchema)
]);

let sheetState: SheetState | null = null;

const computeProgress = (questions: Question[]) => {
  const solved = questions.filter((q) => q.solved).length;
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
    const topicProgress = computeProgress(subTopics.flatMap((s) => s.questions));
    return { ...topic, order: topicIndex, subTopics, progress: topicProgress };
  });

  return { ...state, topics, updatedAt: new Date().toISOString() };
};

const normalizeDifficulty = (value: unknown): z.infer<typeof difficultyEnum> => {
  if (value === 'Basic' || value === 'Easy' || value === 'Medium' || value === 'Hard') return value;
  return 'Basic';
};

const normalizeString = (v: unknown): string => (typeof v === 'string' ? v : '');

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
  problemUrl: input.problemUrl ?? '',
  tags: input.tags ?? []
});

const getRowsFromParsed = (parsed: z.infer<typeof seedSchema>): any[] => {
  if (Array.isArray(parsed)) return parsed;
  if ('data' in parsed) {
    const d: any = (parsed as any).data;
    if (Array.isArray(d)) return d;
    if (d && typeof d === 'object' && Array.isArray(d.questions)) return d.questions;
    return [];
  }
  return [];
};

const rowToSeedQuestion = (row: any): z.infer<typeof seedQuestionSchema> => {
  // Codolio export shape (based on your uploaded file):
  // - youtube link is `resource`
  // - solved is `isSolved`
  // - platform & difficulty live under `questionId`
  // - tags/topics can live under `questionId.topics`
  const qid = row?.questionId ?? {};

  const title =
    normalizeString(row?.title) ||
    normalizeString(qid?.name) ||
    normalizeString(qid?.slug) ||
    'Untitled';

  const source =
    normalizeString(row?.source) ||
    normalizeString(qid?.platform) ||
    'TUF';

  const difficulty = normalizeDifficulty(row?.difficulty ?? qid?.difficulty);

  const youtubeUrl =
    normalizeString(row?.youtubeUrl) ||
    normalizeString(row?.resource) ||
    '';

  const problemUrl =
    normalizeString(row?.problemUrl) ||
    normalizeString(row?.link) ||
    normalizeString(row?.url) ||
    normalizeString(row?.leetcodeUrl) ||
    normalizeString(row?.questionUrl) ||
    normalizeString(row?.questionLink) ||
    normalizeString(qid?.link) ||
    normalizeString(qid?.url) ||
    normalizeString(qid?.questionLink) ||
    normalizeString(qid?.problemUrl) ||
    '';

  const notes = normalizeString(row?.notes) || normalizeString(qid?.description) || '';

  const solved =
    typeof row?.solved === 'boolean'
      ? row.solved
      : typeof row?.isSolved === 'boolean'
        ? row.isSolved
        : false;

  const starred =
    typeof row?.starred === 'boolean'
      ? row.starred
      : typeof row?.isStarred === 'boolean'
        ? row.isStarred
        : false;

  const tags: string[] = Array.isArray(row?.tags)
    ? row.tags.filter((t: any) => typeof t === 'string')
    : Array.isArray(qid?.topics)
      ? qid.topics.filter((t: any) => typeof t === 'string')
      : [];

  return {
    title,
    source,
    difficulty,
    youtubeUrl,
    problemUrl,
    notes,
    solved,
    starred,
    tags
  };
};

const transformSeed = (raw: unknown): SheetState => {
  const parsed = seedSchema.parse(raw);

  // Case 1: hierarchical seed
  if (!Array.isArray(parsed) && 'topics' in parsed) {
    const topics = parsed.topics.map((topic, topicIndex) => {
      const subTopics: SubTopic[] = topic.subTopics.map((subTopic, subIndex) => {
        const questions = subTopic.questions.map((q, qIndex) => toQuestion(q, qIndex));
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
        progress: computeProgress(subTopics.flatMap((s) => s.questions))
      };
    });

    return { topics, updatedAt: new Date().toISOString(), version: 1 };
  }

  // Case 2: flat rows (Codolio export / other)
  const rows = getRowsFromParsed(parsed);

  const grouped = new Map<string, Map<string, z.infer<typeof seedQuestionSchema>[]>>();

  rows.forEach((row) => {
    const topic = normalizeString(row?.topic) || 'Untitled Topic';
    const subTopic = normalizeString(row?.subTopic) || 'Untitled Subtopic';

    if (!grouped.has(topic)) grouped.set(topic, new Map());
    const subMap = grouped.get(topic)!;
    if (!subMap.has(subTopic)) subMap.set(subTopic, []);

    subMap.get(subTopic)!.push(rowToSeedQuestion(row));
  });

  const topics: Topic[] = Array.from(grouped.entries()).map(([topicTitle, subMap], topicIndex) => {
    const subTopics: SubTopic[] = Array.from(subMap.entries()).map(([subTitle, questions], subIndex) => {
      const normalizedQuestions = questions.map((q, qIndex) => toQuestion(q, qIndex));
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
      progress: computeProgress(subTopics.flatMap((s) => s.questions))
    };
  });

  return { topics, updatedAt: new Date().toISOString(), version: 1 };
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
  if (!sheetState) return loadSheetState();
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
  const topic = state.topics.find((t) => t.id === topicId);
  if (!topic) throw new Error('Topic not found');
  if (title) topic.title = title;
  await persistState();
  return sheetState!;
};

export const deleteTopic = async (topicId: string) => {
  const state = await getSheetState();
  state.topics = state.topics.filter((t) => t.id !== topicId);
  await persistState();
  return sheetState!;
};

export const addSubTopic = async (topicId: string, title: string) => {
  const state = await getSheetState();
  const topic = state.topics.find((t) => t.id === topicId);
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
  const subTopic = state.topics.flatMap((t) => t.subTopics).find((s) => s.id === subTopicId);
  if (!subTopic) throw new Error('Subtopic not found');
  if (title) subTopic.title = title;
  await persistState();
  return sheetState!;
};

export const deleteSubTopic = async (subTopicId: string) => {
  const state = await getSheetState();
  state.topics.forEach((t) => {
    t.subTopics = t.subTopics.filter((s) => s.id !== subTopicId);
  });
  await persistState();
  return sheetState!;
};

export const addQuestion = async (subTopicId: string, input: Omit<Question, 'id' | 'order'>) => {
  const state = await getSheetState();
  const subTopic = state.topics.flatMap((t) => t.subTopics).find((s) => s.id === subTopicId);
  if (!subTopic) throw new Error('Subtopic not found');

  const question: Question = { ...input, id: crypto.randomUUID(), order: subTopic.questions.length };
  subTopic.questions.push(question);

  await persistState();
  return sheetState!;
};

export const updateQuestion = async (questionId: string, payload: Partial<Question>) => {
  const state = await getSheetState();
  const question = state.topics.flatMap((t) => t.subTopics).flatMap((s) => s.questions).find((q) => q.id === questionId);
  if (!question) throw new Error('Question not found');
  Object.assign(question, payload);
  await persistState();
  return sheetState!;
};

export const deleteQuestion = async (questionId: string) => {
  const state = await getSheetState();
  state.topics.forEach((t) => {
    t.subTopics.forEach((s) => {
      s.questions = s.questions.filter((q) => q.id !== questionId);
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
    const topic = state.topics.find((t) => t.id === payload.from.containerId);
    if (!topic) throw new Error('Topic not found');
    const [removed] = topic.subTopics.splice(payload.from.index, 1);
    topic.subTopics.splice(payload.to.index, 0, removed);
  }

  if (payload.type === 'question') {
    const fromSub = state.topics.flatMap((t) => t.subTopics).find((s) => s.id === payload.from.containerId);
    const toSub = state.topics.flatMap((t) => t.subTopics).find((s) => s.id === payload.to.containerId);
    if (!fromSub || !toSub) throw new Error('Subtopic not found');

    const [removed] = fromSub.questions.splice(payload.from.index, 1);
    toSub.questions.splice(payload.to.index, 0, removed);
  }

  await persistState();
  return sheetState!;
};
