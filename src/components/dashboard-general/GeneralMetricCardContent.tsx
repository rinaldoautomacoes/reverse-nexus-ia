import React from 'react';
import { Package, Truck } from 'lucide-react';
import type { MetricItem } from './GeneralMetricsCards'; // Importando o tipo MetricItem

interface GeneralMetricCardContentProps {
  metric: MetricItem;
}

export const GeneralMetricCardContent: React.FC<GeneralMetricCardContentProps> = ({ metric }) => {
  return (
    <>
      <div className="text-4xl font-bold font-orbitron gradient-text mb-1"> {/* Alterado para text-4xl */}
        {metric.value}
      </div>
      {metric.id === 'total-operacoes' && (
        <div className="space-y-1 text-sm text-muted-foreground mt-1"> {/* Alterado para text-sm */}
          <div className="flex items-center gap-1">
            <Package className="h-3 w-3 text-primary" />
            <span>{metric.coletasCount} Coletas</span>
          </div>
          <div className="flex items-center gap-1">
            <Truck className="h-3 w-3 text-accent" />
            <span>{metric.entregasCount} Entregas</span>
          </div>
        </div>
      )}
      {metric.id === 'operacoes-em-transito' && (
        <div className="space-y-1 text-sm text-muted-foreground mt-1"> {/* Alterado para text-sm */}
          <div className="flex items-center gap-1">
            <Package className="h-3 w-3 text-primary" />
            <span>{metric.coletasCount} Coletas pendentes</span>
          </div>
          <div className="flex items-center gap-1">
            <Truck className="h-3 w-3 text-accent" />
            <span>{metric.entregasCount} Entregas pendentes</span>
          </div>
        </div>
      )}
      {metric.id === 'operacoes-pendentes' && (
        <div className="space-y-1 text-sm text-muted-foreground mt-1"> {/* Alterado para text-sm */}
          <div className="flex items-center gap-1">
            <Package className="h-3 w-3 text-primary" />
            <span>{metric.coletasCount} Coletas pendentes</span>
          </div>
          <div className="flex items-center gap-1">
            <Truck className="h-3 w-3 text-accent" />
            <span>{metric.entregasCount} Entregas pendentes</span>
          </div>
        </div>
      )}
      {metric.id === 'operacoes-concluidas' && (
        <div className="space-y-1 text-sm text-muted-foreground mt-1"> {/* Alterado para text-sm */}
          <div className="flex items-center gap-1">
            <Package className="h-3 w-3 text-primary" />
            <span>{metric.coletasCount} Coletas finalizadas</span>
          </div>
          <div className="flex items-center gap-1">
            <Truck className="h-3 w-3 text-accent" />
            <span>{metric.entregasCount} Entregas finalizadas</span>
          </div>
        </div>
      )}
      {metric.description && metric.id !== 'total-operacoes' && metric.id !== 'operacoes-em-transito' && metric.id !== 'operacoes-concluidas' && metric.id !== 'operacoes-pendentes' && (
        <p className="text-sm text-muted-foreground mb-1">{metric.description}</p>
      )}
    </>
  );
};