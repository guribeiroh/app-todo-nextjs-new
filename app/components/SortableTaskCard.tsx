import React from 'react';
import { Task } from '../types';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableTaskCardProps {
  task: Task;
  columnId: string;
  isDragging?: boolean;
}

const SortableTaskCard: React.FC<SortableTaskCardProps> = ({ task, columnId, isDragging }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ 
    id: task.id,
    data: {
      task,
      columnId,
      type: 'task',
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="p-3 mb-2 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700"
    >
      <h4 className="font-medium text-sm">{task.title}</h4>
      {task.description && (
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
          {task.description}
        </p>
      )}
    </div>
  );
};

export default SortableTaskCard;