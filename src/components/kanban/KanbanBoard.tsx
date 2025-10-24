import React, { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
  UniqueIdentifier,
  DragOverlay,
} from '@dnd-kit/core';
import { 
  SortableContext, 
  useSortable, 
  verticalListSortingStrategy,
  arrayMove 
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToWindowEdges } from '@dnd-kit/modifiers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useLang } from '@/hooks/useLang';
import { useTranslation } from 'react-i18next';
import { GripVertical } from 'lucide-react';

export interface KanbanItem {
  id: UniqueIdentifier;
  title: string;
  description?: string;
  status: string;
  priority?: 'low' | 'medium' | 'high';
  assignee?: string;
  dueDate?: string;
  tags?: string[];
  [key: string]: any;
}

export interface KanbanColumn {
  id: string;
  title: string;
  items: KanbanItem[];
  color?: string;
  limit?: number;
}

export interface KanbanBoardProps {
  columns: KanbanColumn[];
  onColumnsChange: (columns: KanbanColumn[]) => void;
  onItemClick?: (item: KanbanItem) => void;
  className?: string;
}

// Draggable Item Component
const DraggableKanbanItem: React.FC<{
  item: KanbanItem;
  onItemClick?: (item: KanbanItem) => void;
  isOverlay?: boolean;
}> = ({ item, onItemClick, isOverlay = false }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-slate-900/20 dark:text-slate-300';
    }
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "cursor-pointer transition-all hover:shadow-md",
        "border border-border/50",
        isDragging && "opacity-50",
        isOverlay && "rotate-3 shadow-xl"
      )}
      onClick={() => !isDragging && onItemClick?.(item)}
      {...attributes}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Drag Handle and Title */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2 flex-1">
              <div
                {...listeners}
                className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 dark:hover:bg-slate-800 rounded"
              >
                <GripVertical className="h-4 w-4 text-gray-400" />
              </div>
              <h4 className="font-medium text-sm leading-tight flex-1">
                {item.title}
              </h4>
            </div>
            {item.priority && (
              <Badge 
                variant="secondary" 
                className={cn("text-xs", getPriorityColor(item.priority))}
              >
                {item.priority}
              </Badge>
            )}
          </div>

          {/* Description */}
          {item.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 ml-6">
              {item.description}
            </p>
          )}

          {/* Tags */}
          {item.tags && item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 ml-6">
              {item.tags.slice(0, 3).map((tag, index) => (
                <Badge 
                  key={index} 
                  variant="outline" 
                  className="text-xs px-2 py-0"
                >
                  {tag}
                </Badge>
              ))}
              {item.tags.length > 3 && (
                <Badge variant="outline" className="text-xs px-2 py-0">
                  +{item.tags.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Footer with assignee and due date */}
          {(item.assignee || item.dueDate) && (
            <div className="flex items-center justify-between text-xs text-muted-foreground ml-6">
              {item.assignee && (
                <span>{item.assignee}</span>
              )}
              {item.dueDate && (
                <span>{item.dueDate}</span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  columns,
  onColumnsChange,
  onItemClick,
  className,
}) => {
  const { t } = useTranslation('common');
  const { isRTL } = useLang();
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [activeItem, setActiveItem] = useState<KanbanItem | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const findContainer = (id: UniqueIdentifier) => {
    if (columns.find(column => column.id === id)) {
      return id;
    }

    return columns.find(column => 
      column.items.find(item => item.id === id)
    )?.id;
  };

  const findItem = (id: UniqueIdentifier) => {
    for (const column of columns) {
      const item = column.items.find(item => item.id === id);
      if (item) return item;
    }
    return null;
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id);
    setActiveItem(findItem(event.active.id));
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    
    if (!over) return;

    const activeContainer = findContainer(active.id);
    const overContainer = findContainer(over.id);

    if (!activeContainer || !overContainer || activeContainer === overContainer) {
      return;
    }

    const newColumns = [...columns];
    const activeColumnIndex = newColumns.findIndex(col => col.id === activeContainer);
    const overColumnIndex = newColumns.findIndex(col => col.id === overContainer);

    const activeItems = newColumns[activeColumnIndex].items;
    const overItems = newColumns[overColumnIndex].items;

    const activeItemIndex = activeItems.findIndex(item => item.id === active.id);
    const overItemIndex = over.id in overItems ? overItems.findIndex(item => item.id === over.id) : 0;

    const activeItem = activeItems[activeItemIndex];
    
    // Remove from active column
    newColumns[activeColumnIndex].items = activeItems.filter(item => item.id !== active.id);
    
    // Add to over column
    newColumns[overColumnIndex].items.splice(overItemIndex, 0, {
      ...activeItem,
      status: newColumns[overColumnIndex].id,
    });

    onColumnsChange(newColumns);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setActiveItem(null);

    if (!over) return;

    const activeContainer = findContainer(active.id);
    const overContainer = findContainer(over.id);

    if (!activeContainer || !overContainer) return;

    if (activeContainer === overContainer) {
      const columnIndex = columns.findIndex(col => col.id === activeContainer);
      const items = columns[columnIndex].items;
      const activeIndex = items.findIndex(item => item.id === active.id);
      const overIndex = items.findIndex(item => item.id === over.id);

      if (activeIndex !== overIndex) {
        const newColumns = [...columns];
        newColumns[columnIndex].items = arrayMove(items, activeIndex, overIndex);
        onColumnsChange(newColumns);
      }
    }
  };

  return (
    <div className={cn(
      "flex gap-6 p-6 overflow-x-auto min-h-96",
      isRTL && "flex-row-reverse",
      className
    )} dir={isRTL ? "rtl" : "ltr"}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        modifiers={[restrictToWindowEdges]}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        {columns.map((column) => (
          <div
            key={column.id}
            className="flex-shrink-0 w-80"
          >
            <Card className="h-full">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold">
                    {column.title}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-sm">
                      {column.items.length}
                    </Badge>
                    {column.limit && (
                      <span className="text-xs text-muted-foreground">
                        / {column.limit}
                      </span>
                    )}
                  </div>
                </div>
                {column.color && (
                  <div 
                    className="h-1 w-full rounded-full" 
                    style={{ backgroundColor: column.color }}
                  />
                )}
              </CardHeader>
              
              <CardContent className="space-y-3 min-h-96">
                <SortableContext 
                  items={column.items.map(item => item.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {column.items.map((item) => (
                    <DraggableKanbanItem
                      key={item.id}
                      item={item}
                      onItemClick={onItemClick}
                    />
                  ))}
                </SortableContext>
              </CardContent>
            </Card>
          </div>
        ))}
        
        <DragOverlay>
          {activeItem && (
            <DraggableKanbanItem
              item={activeItem}
              isOverlay={true}
            />
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}; 