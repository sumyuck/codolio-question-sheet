import { Star, StickyNote, Youtube } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import clsx from 'clsx';
import type { Question } from '../types/sheet';
import { isYoutube } from '../utils/sheet';

interface QuestionRowProps {
  question: Question;
  containerId: string;
  onToggleSolved: () => void;
  onToggleStar: () => void;
  onOpenDrawer: () => void;
}

export default function QuestionRow({
  question,
  containerId,
  onToggleSolved,
  onToggleStar,
  onOpenDrawer
}: QuestionRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: question.id,
    data: { type: 'question', containerId }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={clsx(
        'flex items-center justify-between rounded-lg border border-codolio-border bg-codolio-panelLight px-4 py-3 text-sm',
        isDragging && 'opacity-70'
      )}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSolved}
          className={clsx(
            'h-4 w-4 rounded-full border-2',
            question.solved ? 'border-codolio-success bg-codolio-success' : 'border-codolio-success'
          )}
        />
        <div>
          <p className="font-medium text-white">{question.title}</p>
          <div className="mt-1 flex flex-wrap gap-2 text-xs text-codolio-muted">
            {question.source && <span className="pill">{question.source}</span>}
            <span
              className={clsx(
                'pill',
                question.difficulty === 'Easy' && 'text-emerald-400',
                question.difficulty === 'Medium' && 'text-yellow-400',
                question.difficulty === 'Hard' && 'text-red-400'
              )}
            >
              {question.difficulty}
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 text-codolio-muted">
        {isYoutube(question) && <Youtube className="h-4 w-4 text-red-500" />}
        <button onClick={onToggleStar} className="icon-button">
          <Star className={clsx('h-4 w-4', question.starred && 'fill-codolio-accent text-codolio-accent')} />
        </button>
        <button onClick={onOpenDrawer} className="icon-button">
          <StickyNote className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
