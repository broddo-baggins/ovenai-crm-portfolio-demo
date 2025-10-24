import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
  UniqueIdentifier,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  restrictToVerticalAxis,
  restrictToHorizontalAxis,
  restrictToWindowEdges,
} from '@dnd-kit/modifiers';

export interface DragDropItem {
  id: UniqueIdentifier;
  [key: string]: any;
}

export interface DragDropProviderProps {
  children: React.ReactNode;
  items: DragDropItem[];
  onItemsChange: (items: DragDropItem[]) => void;
  strategy?: 'vertical' | 'horizontal';
  modifiers?: Array<any>;
  onDragStart?: (event: DragStartEvent) => void;
  onDragEnd?: (event: DragEndEvent) => void;
  onDragOver?: (event: DragOverEvent) => void;
  disabled?: boolean;
}

export const DragDropProvider: React.FC<DragDropProviderProps> = ({
  children,
  items,
  onItemsChange,
  strategy = 'vertical',
  modifiers,
  onDragStart,
  onDragEnd,
  onDragOver,
  disabled = false,
}) => {
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);

  // Configure sensors for different input methods
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before drag starts
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200, // Delay touch activation to allow scrolling
        tolerance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Default modifiers based on strategy
  const defaultModifiers = modifiers || [
    restrictToWindowEdges,
    strategy === 'vertical' ? restrictToVerticalAxis : restrictToHorizontalAxis,
  ];

  // Strategy mapping
  const sortingStrategy = strategy === 'horizontal' 
    ? horizontalListSortingStrategy 
    : verticalListSortingStrategy;

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id);
    onDragStart?.(event);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    setActiveId(null);
    
    if (active.id !== over?.id) {
      const oldIndex = items.findIndex(item => item.id === active.id);
      const newIndex = items.findIndex(item => item.id === over?.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newItems = arrayMove(items, oldIndex, newIndex);
        onItemsChange(newItems);
      }
    }
    
    onDragEnd?.(event);
  };

  const handleDragOver = (event: DragOverEvent) => {
    onDragOver?.(event);
  };

  if (disabled) {
    return <>{children}</>;
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={defaultModifiers}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
    >
      <SortableContext
        items={items.map(item => item.id)}
        strategy={sortingStrategy}
      >
        {children}
      </SortableContext>
    </DndContext>
  );
}; 