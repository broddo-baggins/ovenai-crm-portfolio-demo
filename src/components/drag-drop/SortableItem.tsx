import React from 'react';
import {
  useSortable,
} from '@dnd-kit/sortable';
import {
  CSS,
} from '@dnd-kit/utilities';
import { GripVertical, GripHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SortableItemProps {
  id: string | number;
  children: React.ReactNode;
  disabled?: boolean;
  handle?: boolean;
  orientation?: 'vertical' | 'horizontal';
  className?: string;
  activeClassName?: string;
  dragOverlayClassName?: string;
}

export const SortableItem: React.FC<SortableItemProps> = ({
  id,
  children,
  disabled = false,
  handle = true,
  orientation = 'vertical',
  className,
  activeClassName,
  dragOverlayClassName,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({
    id,
    disabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const GripIcon = orientation === 'horizontal' ? GripHorizontal : GripVertical;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative group",
        isDragging && "opacity-50 z-50",
        isOver && "opacity-75",
        isDragging && activeClassName,
        className
      )}
      {...(!handle ? { ...attributes, ...listeners } : {})}
    >
      {handle && (
        <button
          className={cn(
            "absolute left-2 top-1/2 -translate-y-1/2 z-10",
            "opacity-0 group-hover:opacity-100 transition-opacity",
            "p-1 rounded-md hover:bg-gray-100 dark:hover:bg-slate-800",
            "focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-blue-500",
            "cursor-grab active:cursor-grabbing",
            orientation === 'horizontal' ? "left-1/2 top-2 -translate-x-1/2 translate-y-0" : ""
          )}
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder"
        >
          <GripIcon className="h-4 w-4 text-gray-400" />
        </button>
      )}
      
      <div className={cn(
        handle && "pl-8", // Add padding when handle is visible
        orientation === 'horizontal' && handle && "pl-0 pt-8"
      )}>
        {children}
      </div>
    </div>
  );
};

// Hook for creating drag overlay content
export const useDragOverlay = () => {
  return {
    style: {
      cursor: 'grabbing',
      transform: 'rotate(5deg)',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    },
  };
}; 