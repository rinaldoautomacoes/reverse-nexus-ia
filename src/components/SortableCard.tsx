import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { GripVertical } from 'lucide-react'; // Icon for drag handle

interface SortableCardProps extends React.ComponentPropsWithoutRef<typeof Card> {
  id: string;
  children: React.ReactNode;
  title: string;
  icon?: React.ElementType;
  iconColorClass?: string;
  iconBgColorClass?: string;
  delay?: number;
}

export const SortableCard: React.FC<SortableCardProps> = ({
  id,
  children,
  title,
  icon: Icon,
  iconColorClass,
  iconBgColorClass,
  delay,
  className,
  ...props
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 0,
    opacity: isDragging ? 0.7 : 1,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "card-futuristic border-0 animate-slide-up transition-all duration-300 ease-in-out relative cursor-grab",
        isDragging ? "ring-2 ring-primary-foreground" : "",
        className
      )}
      {...attributes} {...listeners} {...props} 
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="flex items-center gap-2">
          {Icon && (
            <div className={cn("p-2 rounded-lg", iconBgColorClass)}>
              <Icon className={cn("h-4 w-4", iconColorClass)} />
            </div>
          )}
          {/* O ícone GripVertical agora é apenas um indicador visual */}
          <GripVertical className="h-5 w-5 text-muted-foreground" /> 
        </div>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
};