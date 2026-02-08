import { ChevronDown, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import clsx from 'clsx';
import type { Question, SubTopic } from '../types/sheet';
import QuestionRow from './QuestionRow';
import { useSheetStore } from '../store/sheetStore';

interface SubTopicAccordionProps {
  subTopic: SubTopic;
  topicId: string;
  onAddQuestion: () => void;
}

export default function SubTopicAccordion({ subTopic, topicId, onAddQuestion }: SubTopicAccordionProps) {
  const [open, setOpen] = useState(true);
  const updateQuestion = useSheetStore((state) => state.updateQuestion);
  const updateSubTopic = useSheetStore((state) => state.updateSubTopic);
  const deleteSubTopic = useSheetStore((state) => state.deleteSubTopic);
  const openDrawer = useSheetStore((state) => state.openDrawer);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: subTopic.id,
    data: { type: 'subtopic', containerId: topicId }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  const { setNodeRef: setDroppableRef } = useDroppable({
    id: `questions-${subTopic.id}`,
    data: { type: 'question-list', containerId: subTopic.id }
  });

  return (
    <div ref={setNodeRef} style={style} className={clsx('space-y-3', isDragging && 'opacity-70')}>
      <button
        className="flex w-full items-center justify-between rounded-lg border border-codolio-border bg-codolio-panel px-4 py-3 text-sm text-white"
        onClick={() => setOpen((value) => !value)}
        {...attributes}
        {...listeners}
      >
        <div className="flex items-center gap-3">
          <ChevronDown className={`h-4 w-4 transition ${open ? 'rotate-180' : ''}`} />
          <span className="font-medium">{subTopic.title}</span>
          <span className="text-xs text-codolio-muted">
            {subTopic.progress.solved}/{subTopic.progress.total}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(event) => {
              event.stopPropagation();
              const title = window.prompt('Rename lecture', subTopic.title);
              if (title) updateSubTopic(subTopic.id, { title });
            }}
            className="icon-button"
            type="button"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={(event) => {
              event.stopPropagation();
              deleteSubTopic(subTopic.id);
            }}
            className="icon-button"
            type="button"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <button
            onClick={(event) => {
              event.stopPropagation();
              onAddQuestion();
            }}
            className="icon-button"
            type="button"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </button>
      {open && (
        <SortableContext items={subTopic.questions.map((q) => q.id)} strategy={verticalListSortingStrategy}>
          <div ref={setDroppableRef} className="space-y-2 pl-8">
            {subTopic.questions.map((question: Question) => (
              <QuestionRow
                key={question.id}
                question={question}
                containerId={subTopic.id}
                onToggleSolved={() => updateQuestion(question.id, { solved: !question.solved })}
                onToggleStar={() => updateQuestion(question.id, { starred: !question.starred })}
                onOpenDrawer={() =>
                  openDrawer({
                    open: true,
                    mode: 'edit',
                    questionId: question.id,
                    subTopicId: subTopic.id
                  })
                }
              />
            ))}
          </div>
        </SortableContext>
      )}
    </div>
  );
}
