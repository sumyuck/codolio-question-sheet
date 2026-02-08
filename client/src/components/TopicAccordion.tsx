import { ChevronDown, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import clsx from 'clsx';
import type { SubTopic, Topic } from '../types/sheet';
import SubTopicAccordion from './SubTopicAccordion';
import { useSheetStore } from '../store/sheetStore';

interface TopicAccordionProps {
  topic: Topic;
}

export default function TopicAccordion({ topic }: TopicAccordionProps) {
  const [open, setOpen] = useState(true);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: topic.id,
    data: { type: 'topic', containerId: 'topics' }
  });
  const createSubTopic = useSheetStore((state) => state.createSubTopic);
  const updateTopic = useSheetStore((state) => state.updateTopic);
  const deleteTopic = useSheetStore((state) => state.deleteTopic);
  const openDrawer = useSheetStore((state) => state.openDrawer);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  const { setNodeRef: setDroppableRef } = useDroppable({
    id: `subtopics-${topic.id}`,
    data: { type: 'subtopic-list', containerId: topic.id }
  });

  return (
    <div ref={setNodeRef} style={style} className={clsx('space-y-3', isDragging && 'opacity-70')}>
      <button
        className="flex w-full items-center justify-between rounded-xl border border-codolio-border bg-codolio-panel px-6 py-4 text-sm text-white"
        onClick={() => setOpen((value) => !value)}
        {...attributes}
        {...listeners}
      >
        <div className="flex items-center gap-4">
          <ChevronDown className={`h-5 w-5 transition ${open ? 'rotate-180' : ''}`} />
          <div>
            <p className="text-base font-semibold">{topic.title}</p>
            <p className="text-xs text-codolio-muted">
              {topic.progress.solved}/{topic.progress.total}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(event) => {
              event.stopPropagation();
              const title = window.prompt('Rename topic', topic.title);
              if (title) updateTopic(topic.id, { title });
            }}
            className="icon-button"
            type="button"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={(event) => {
              event.stopPropagation();
              deleteTopic(topic.id);
            }}
            className="icon-button"
            type="button"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <button
            onClick={(event) => {
              event.stopPropagation();
              createSubTopic(topic.id, { title: `Lec ${topic.subTopics.length + 1}: New Lecture` });
            }}
            className="icon-button"
            type="button"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </button>
      {open && (
        <SortableContext items={topic.subTopics.map((sub) => sub.id)} strategy={verticalListSortingStrategy}>
          <div ref={setDroppableRef} className="space-y-4 pl-6">
            {topic.subTopics.map((subTopic: SubTopic) => (
              <div key={subTopic.id}>
                <SubTopicAccordion
                  subTopic={subTopic}
                  topicId={topic.id}
                  onAddQuestion={() =>
                    openDrawer({
                      open: true,
                      mode: 'add',
                      subTopicId: subTopic.id,
                      tab: 'overview'
                    })
                  }
                />
              </div>
            ))}
          </div>
        </SortableContext>
      )}
    </div>
  );
}
