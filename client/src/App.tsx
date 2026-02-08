import { useEffect } from 'react';
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import Sidebar from './components/Sidebar';
import HeaderBar from './components/HeaderBar';
import ProgressRing from './components/ProgressRing';
import TopicAccordion from './components/TopicAccordion';
import QuestionDrawer from './features/questions/QuestionDrawer';
import { useSheetStore } from './store/sheetStore';
import { computeOverallProgress, filterQuestions } from './utils/sheet';
import type { ReorderPayload, SheetState } from './types/sheet';

export default function App() {
  const { sheet, fetchSheet, search, setSearch, reorder, openDrawer, exportSheet, importSheet } =
    useSheetStore((state) => ({
      sheet: state.sheet,
      fetchSheet: state.fetchSheet,
      search: state.search,
      setSearch: state.setSearch,
      reorder: state.reorder,
      openDrawer: state.openDrawer,
      exportSheet: state.exportSheet,
      importSheet: state.importSheet
    }));

  useEffect(() => {
    fetchSheet();
  }, [fetchSheet]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const getIndex = (
    currentSheet: SheetState,
    type: ReorderPayload['type'],
    containerId: string,
    itemId: string
  ) => {
    if (type === 'topic') {
      return currentSheet.topics.findIndex((topic) => topic.id === itemId);
    }
    if (type === 'subtopic') {
      const topic = currentSheet.topics.find((t) => t.id === containerId);
      return topic ? topic.subTopics.findIndex((sub) => sub.id === itemId) : -1;
    }
    const subTopic = currentSheet.topics
      .flatMap((topic) => topic.subTopics)
      .find((sub) => sub.id === containerId);
    return subTopic ? subTopic.questions.findIndex((q) => q.id === itemId) : -1;
  };

  const getContainerSize = (
    currentSheet: SheetState,
    type: ReorderPayload['type'],
    containerId: string
  ) => {
    if (type === 'topic') return currentSheet.topics.length;
    if (type === 'subtopic') {
      const topic = currentSheet.topics.find((t) => t.id === containerId);
      return topic ? topic.subTopics.length : 0;
    }
    const subTopic = currentSheet.topics
      .flatMap((topic) => topic.subTopics)
      .find((sub) => sub.id === containerId);
    return subTopic ? subTopic.questions.length : 0;
  };

  const handleDragEnd = async ({ active, over }: DragEndEvent) => {
    if (!over) return;
    if (search.trim()) return;
    const activeData = active.data.current as { type?: string; containerId?: string } | undefined;
    const overData = over.data.current as { type?: string; containerId?: string } | undefined;
    if (!activeData?.type || !overData?.containerId || !sheet) return;

    if (active.id === over.id && activeData.containerId === overData.containerId) return;

    if (activeData.type === 'subtopic' && activeData.containerId !== overData.containerId) {
      return;
    }

    const payload: ReorderPayload = {
      type: activeData.type as ReorderPayload['type'],
      from: {
        containerId: activeData.containerId ?? '',
        index: getIndex(sheet, activeData.type as ReorderPayload['type'], activeData.containerId ?? '', String(active.id))
      },
      to: {
        containerId: overData.containerId ?? '',
        index: overData.type?.includes('list')
          ? getContainerSize(sheet, activeData.type as ReorderPayload['type'], overData.containerId ?? '')
          : getIndex(sheet, activeData.type as ReorderPayload['type'], overData.containerId ?? '', String(over.id))
      },
      itemId: String(active.id)
    };

    if (payload.from.index < 0 || payload.to.index < 0) return;

    await reorder(payload);
  };

  const handleExport = async () => {
    const current = await exportSheet();
    if (!current) return;
    const blob = new Blob([JSON.stringify(current, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sheet-export.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = async () => {
      if (!input.files?.[0]) return;
      const text = await input.files[0].text();
      const parsed = JSON.parse(text);
      await importSheet(parsed);
    };
    input.click();
  };

  const filteredSheet = sheet ? filterQuestions(sheet, search) : null;
  const progress = sheet ? computeOverallProgress(sheet) : { solved: 0, total: 0 };

  return (
    <div className="flex min-h-screen bg-codolio-bg text-white">
      <Sidebar />
      <main className="flex-1 px-10 py-8">
        <div className="flex items-start justify-between gap-8">
          <div className="flex-1 space-y-6">
            <HeaderBar search={search} onSearch={setSearch} onExport={handleExport} onImport={handleImport} />
            <div className="panel p-6">
              <p className="text-sm text-codolio-muted">
                Track your progress through structured steps, lectures, and questions.
              </p>
              <button
                className="accent-button mt-4"
                onClick={() => {
                  const subTopicId = sheet?.topics[0]?.subTopics[0]?.id;
                  openDrawer({
                    open: true,
                    mode: 'add',
                    tab: 'overview',
                    subTopicId
                  });
                }}
              >
                Add Question
              </button>
            </div>
          </div>
          <ProgressRing solved={progress.solved} total={progress.total} />
        </div>
        <section className="mt-8 space-y-6">
          {filteredSheet ? (
            <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
              <SortableContext items={filteredSheet.topics.map((topic) => topic.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-6">
                  {filteredSheet.topics.map((topic) => (
                    <TopicAccordion key={topic.id} topic={topic} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          ) : (
            <div className="panel p-6">Loading sheet...</div>
          )}
        </section>
      </main>
      <QuestionDrawer />
    </div>
  );
}
