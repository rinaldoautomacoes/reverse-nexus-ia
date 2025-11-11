import React from 'react';
import { useSortable } from '@dnd-kit/sortable'; // Importar useSortable do @dnd-kit/sortable
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
  onDetailsClick?: (id: string) => void; // Nova prop para o clique de detalhes, passando o ID
  customHeaderButton?: React.ReactNode; // New prop for custom button
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
  onDetailsClick,
  customHeaderButton,
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
        "card-futuristic border-0 animate-slide-up transition-all duration-300 ease-in-out relative h-[186px]", // Altura ajustada para 186px
        isDragging ? "ring-2 ring-primary-foreground" : "",
        className
      )}
      {...props} 
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium text-muted-foreground gradient-text leading-tight text-wrap">
          {title}
        </CardTitle>
        <div className="flex items-center gap-2">
          {/* Metric-specific icon or custom button */}
          {customHeaderButton ? (
            customHeaderButton
          ) : (
            Icon && (
              <div className={cn("p-2 rounded-full", iconBgColorClass)}>
                <Icon className={cn("h-4 w-4", iconColorClass)} />
              </div>
            )
          )}
          {/* Drag handle */}
          <div className="cursor-grab" {...attributes} {...listeners}> 
            <GripVertical className="h-5 w-5 text-muted-foreground" /> 
          </div>
        </div>
      </CardHeader>
      {/* Conteúdo clicável para detalhes */}
      <CardContent className="p-4 cursor-pointer" onClick={() => onDetailsClick?.(id)}>
        {children}
      </CardContent>
    </Card>
  );
};