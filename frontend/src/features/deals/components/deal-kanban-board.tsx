import { DndContext, DragEndEvent, PointerSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DealPipelineColumn, DealStage } from "@/features/deals/api/deals.api";

type DealKanbanBoardProps = {
  columns: DealPipelineColumn[];
  onMoveDeal: (dealId: string, stage: DealStage) => void;
};

const stageLabels: Record<DealStage, string> = {
  INQUIRY: "Inquiry",
  NEGOTIATION: "Negotiation",
  AGREEMENT: "Agreement",
  CLOSED: "Closed",
  LOST: "Lost"
};

export const DealKanbanBoard = ({ columns, onMoveDeal }: DealKanbanBoardProps) => {
  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragEnd = (event: DragEndEvent) => {
    const activeId = String(event.active.id);
    const overId = event.over ? String(event.over.id) : undefined;

    if (!overId) {
      return;
    }

    const targetColumn = columns.find((column) => column.stage === overId || column.items.some((item) => item.id === overId));

    if (!targetColumn) {
      return;
    }

    onMoveDeal(activeId, targetColumn.stage);
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        {columns.map((column) => (
          <Card key={column.stage} id={column.stage} className="h-full">
            <CardHeader>
              <CardTitle className="text-lg">
                {stageLabels[column.stage]} ({column.count})
              </CardTitle>
              <p className="text-xs text-muted-foreground">Total value: {column.totalValue.toLocaleString()}</p>
            </CardHeader>
            <CardContent className="space-y-2">
              <SortableContext items={column.items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
                {column.items.map((item) => (
                  <div key={item.id} id={item.id} className="cursor-grab rounded-lg border bg-muted/40 p-3">
                    <p className="font-medium">{item.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.client?.firstName} {item.client?.lastName ?? ""}
                    </p>
                    <p className="text-xs">
                      {item.currency} {Number(item.dealValue).toLocaleString()}
                    </p>
                  </div>
                ))}
              </SortableContext>
            </CardContent>
          </Card>
        ))}
      </div>
    </DndContext>
  );
};
