import { Router } from 'express';
import { z } from 'zod';
import {
  addQuestion,
  addSubTopic,
  addTopic,
  deleteQuestion,
  deleteSubTopic,
  deleteTopic,
  getSheetState,
  reorderSheet,
  setSheetState,
  updateQuestion,
  updateSubTopic,
  updateTopic
} from '../services/sheetService.js';

const router = Router();

const topicSchema = z.object({
  title: z.string()
});

const subTopicSchema = z.object({
  title: z.string()
});

const questionSchema = z.object({
  title: z.string(),
  source: z.string().optional(),
  difficulty: z.enum(['Basic', 'Easy', 'Medium', 'Hard']).default('Basic'),
  solved: z.boolean().optional().default(false),
  starred: z.boolean().optional().default(false),
  notes: z.string().optional(),
  youtubeUrl: z.string().optional(),
  tags: z.array(z.string()).optional()
});

const reorderSchema = z.object({
  type: z.enum(['topic', 'subtopic', 'question']),
  from: z.object({
    containerId: z.string(),
    index: z.number()
  }),
  to: z.object({
    containerId: z.string(),
    index: z.number()
  }),
  itemId: z.string()
});

router.get('/sheet', async (_req, res) => {
  const sheet = await getSheetState();
  res.json({ data: sheet });
});

router.post('/topics', async (req, res) => {
  const payload = topicSchema.parse(req.body);
  const sheet = await addTopic(payload.title);
  res.json({ data: sheet });
});

router.patch('/topics/:topicId', async (req, res) => {
  const payload = topicSchema.partial().parse(req.body);
  const sheet = await updateTopic(req.params.topicId, payload.title);
  res.json({ data: sheet });
});

router.delete('/topics/:topicId', async (req, res) => {
  const sheet = await deleteTopic(req.params.topicId);
  res.json({ data: sheet });
});

router.post('/topics/:topicId/subtopics', async (req, res) => {
  const payload = subTopicSchema.parse(req.body);
  const sheet = await addSubTopic(req.params.topicId, payload.title);
  res.json({ data: sheet });
});

router.patch('/subtopics/:subTopicId', async (req, res) => {
  const payload = subTopicSchema.partial().parse(req.body);
  const sheet = await updateSubTopic(req.params.subTopicId, payload.title);
  res.json({ data: sheet });
});

router.delete('/subtopics/:subTopicId', async (req, res) => {
  const sheet = await deleteSubTopic(req.params.subTopicId);
  res.json({ data: sheet });
});

router.post('/subtopics/:subTopicId/questions', async (req, res) => {
  const payload = questionSchema.parse(req.body);
  const sheet = await addQuestion(req.params.subTopicId, {
    ...payload,
    notes: payload.notes ?? '',
    youtubeUrl: payload.youtubeUrl ?? '',
    tags: payload.tags ?? []
  });
  res.json({ data: sheet });
});

router.patch('/questions/:questionId', async (req, res) => {
  const payload = questionSchema.partial().parse(req.body);
  const sheet = await updateQuestion(req.params.questionId, payload);
  res.json({ data: sheet });
});

router.delete('/questions/:questionId', async (req, res) => {
  const sheet = await deleteQuestion(req.params.questionId);
  res.json({ data: sheet });
});

router.post('/reorder', async (req, res) => {
  const payload = reorderSchema.parse(req.body);
  const sheet = await reorderSheet(payload);
  res.json({ data: sheet });
});

router.get('/export', async (_req, res) => {
  const sheet = await getSheetState();
  res.json({ data: sheet });
});

router.post('/import', async (req, res) => {
  const sheet = await setSheetState(req.body);
  res.json({ data: sheet });
});

export default router;
