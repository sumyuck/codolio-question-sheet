import { X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { Difficulty, Question } from '../../types/sheet';
import { useSheetStore } from '../../store/sheetStore';

const difficulties: Difficulty[] = ['Basic', 'Easy', 'Medium', 'Hard'];

export default function QuestionDrawer() {
  const { drawer, sheet, closeDrawer, setDrawerTab, createQuestion, updateQuestion, deleteQuestion } =
    useSheetStore((state) => ({
      drawer: state.drawer,
      sheet: state.sheet,
      closeDrawer: state.closeDrawer,
      setDrawerTab: state.setDrawerTab,
      createQuestion: state.createQuestion,
      updateQuestion: state.updateQuestion,
      deleteQuestion: state.deleteQuestion
    }));

  const editingQuestion = useMemo(() => {
    if (!sheet || !drawer.questionId) return null;
    for (const topic of sheet.topics) {
      for (const subTopic of topic.subTopics) {
        const found = subTopic.questions.find((question) => question.id === drawer.questionId);
        if (found) return found;
      }
    }
    return null;
  }, [sheet, drawer.questionId]);

  const [formState, setFormState] = useState<Question>(() => ({
    id: 'new',
    title: '',
    order: 0,
    source: 'TUF',
    difficulty: 'Basic',
    solved: false,
    starred: false,
    notes: '',
    youtubeUrl: ''
  }));

  useEffect(() => {
    if (editingQuestion) {
      setFormState(editingQuestion);
      return;
    }
    if (drawer.open) {
      setFormState({
        id: 'new',
        title: '',
        order: 0,
        source: 'TUF',
        difficulty: 'Basic',
        solved: false,
        starred: false,
        notes: '',
        youtubeUrl: ''
      });
    }
  }, [editingQuestion, drawer.open]);

  const handleChange = (field: keyof Question, value: string | boolean) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!formState.title.trim()) return;
    if (drawer.mode === 'add' && drawer.subTopicId) {
      await createQuestion(drawer.subTopicId, {
        title: formState.title,
        source: formState.source,
        difficulty: formState.difficulty,
        solved: formState.solved,
        starred: formState.starred,
        notes: formState.notes,
        youtubeUrl: formState.youtubeUrl
      });
    }
    if (drawer.mode === 'edit' && editingQuestion) {
      await updateQuestion(editingQuestion.id, {
        title: formState.title,
        source: formState.source,
        difficulty: formState.difficulty,
        solved: formState.solved,
        starred: formState.starred,
        notes: formState.notes,
        youtubeUrl: formState.youtubeUrl
      });
    }
    closeDrawer();
  };

  const handleDelete = async () => {
    if (editingQuestion) {
      await deleteQuestion(editingQuestion.id);
      closeDrawer();
    }
  };

  if (!drawer.open) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-30 w-full max-w-lg border-l border-codolio-border bg-codolio-panel p-6 shadow-soft">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-codolio-muted">
            {drawer.mode === 'add' ? 'Add Question' : 'Edit Question'}
          </p>
          <h2 className="text-lg font-semibold text-white">{formState.title || 'Untitled Question'}</h2>
        </div>
        <button className="icon-button" onClick={closeDrawer}>
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-6 flex gap-4 border-b border-codolio-border text-sm">
        {(['overview', 'notes'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setDrawerTab(tab)}
            className={`pb-2 ${
              drawer.tab === tab
                ? 'border-b-2 border-codolio-accent text-white'
                : 'text-codolio-muted'
            }`}
          >
            {tab === 'overview' ? 'Overview' : 'Notes'}
          </button>
        ))}
      </div>

      {drawer.tab === 'overview' && (
        <div className="mt-6 space-y-4 text-sm">
          <div>
            <label className="text-xs text-codolio-muted">Title</label>
            <input
              value={formState.title}
              onChange={(event) => handleChange('title', event.target.value)}
              className="mt-2 w-full rounded-lg border border-codolio-border bg-codolio-panelLight px-3 py-2"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-codolio-muted">Source</label>
              <input
                value={formState.source ?? ''}
                onChange={(event) => handleChange('source', event.target.value)}
                className="mt-2 w-full rounded-lg border border-codolio-border bg-codolio-panelLight px-3 py-2"
              />
            </div>
            <div>
              <label className="text-xs text-codolio-muted">Difficulty</label>
              <select
                value={formState.difficulty}
                onChange={(event) => handleChange('difficulty', event.target.value)}
                className="mt-2 w-full rounded-lg border border-codolio-border bg-codolio-panelLight px-3 py-2"
              >
                {difficulties.map((difficulty) => (
                  <option key={difficulty} value={difficulty}>
                    {difficulty}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-codolio-muted">YouTube Link</label>
            <input
              value={formState.youtubeUrl ?? ''}
              onChange={(event) => handleChange('youtubeUrl', event.target.value)}
              className="mt-2 w-full rounded-lg border border-codolio-border bg-codolio-panelLight px-3 py-2"
            />
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-codolio-muted">
              <input
                type="checkbox"
                checked={formState.solved}
                onChange={(event) => handleChange('solved', event.target.checked)}
              />
              Solved
            </label>
            <label className="flex items-center gap-2 text-codolio-muted">
              <input
                type="checkbox"
                checked={formState.starred}
                onChange={(event) => handleChange('starred', event.target.checked)}
              />
              Starred
            </label>
          </div>
        </div>
      )}

      {drawer.tab === 'notes' && (
        <div className="mt-6">
          <label className="text-xs text-codolio-muted">Notes</label>
          <textarea
            value={formState.notes ?? ''}
            onChange={(event) => handleChange('notes', event.target.value)}
            className="mt-2 h-40 w-full rounded-lg border border-codolio-border bg-codolio-panelLight px-3 py-2"
          />
        </div>
      )}

      <div className="mt-8 flex items-center justify-between">
        {drawer.mode === 'edit' && (
          <button className="rounded-lg border border-red-500 px-4 py-2 text-sm text-red-400" onClick={handleDelete}>
            Delete
          </button>
        )}
        <button className="accent-button ml-auto" onClick={handleSave}>
          Save
        </button>
      </div>
    </div>
  );
}
