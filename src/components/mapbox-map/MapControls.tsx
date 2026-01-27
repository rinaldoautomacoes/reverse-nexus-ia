import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Clock, Gauge, Car, Bike, Bus, Footprints } from "lucide-react";
import { cn, formatDuration } from "@/lib/utils";

type TransportMode = 'driving' | 'walking' | 'cycling' | 'public_transport';

interface MapControlsProps {
  selectedRouteDetails: any; // Use a more specific type if available
  directionsData: any; // Use a more specific type if available
  isLoadingDirections: boolean;
  selectedTransportMode: TransportMode;
  setSelectedTransportMode: (mode: TransportMode) => void;
  modeDurations: Partial<Record<TransportMode, number>>;
}

const modeIcons = {
  driving: Car,
  cycling: Bike,
  walking: Footprints,
  public_transport: Bus,
};

// Mapeamento dos rótulos para Português do Brasil
const modeLabels: Record<TransportMode, string> = {
  driving: 'Carro',
  walking: 'A Pé',
  cycling: 'Bicicleta',
  public_transport: 'Transporte Público',
};

export const MapControls: React.FC<MapControlsProps> = ({
  selectedRouteDetails,
  directionsData,
  isLoadingDirections,
  selectedTransportMode,
  setSelectedTransportMode,
  modeDurations,
}) => {
  // Sempre renderiza o container, mas ajusta o conteúdo com base em selectedRouteDetails
  const routeName = selectedRouteDetails?.name || "Nenhuma Rota Selecionada";
  const distance = directionsData?.distance?.toFixed(2) || 'N/A';
  const duration = directionsData?.duration ? formatDuration(directionsData.duration) : 'N/A';

  return (
    <>
      <Card className="absolute top-4 left-4 z-10 bg-card/80 backdrop-blur-sm border-border/50 shadow-lg">
        <CardContent className="p-4 space-y-2">
          <h3 className="font-semibold text-lg">{routeName}</h3>
          {selectedRouteDetails ? (
            isLoadingDirections ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Calculando rota...</span>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Gauge className="h-4 w-4" />
                  <span>Distância: {distance} km</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Duração: {duration}</span>
                </div>
              </>
            )
          ) : (
            <p className="text-sm text-muted-foreground">Selecione uma rota para ver os detalhes.</p>
          )}
        </CardContent>
      </Card>

      <div className="absolute top-4 right-4 z-10 bg-card/80 backdrop-blur-sm border-border/50 rounded-lg shadow-lg p-2 flex gap-2">
        {Object.entries(modeIcons).map(([mode, Icon]) => (
          // Desabilita se nenhuma rota for selecionada ou se as direções estão carregando
          <Button
            key={mode}
            variant="ghost"
            size="icon"
            className={cn(
              "h-10 w-10 rounded-full",
              selectedTransportMode === mode ? "bg-primary/20 text-primary" : "text-muted-foreground hover:bg-muted/20"
            )}
            onClick={() => setSelectedTransportMode(mode as TransportMode)}
            disabled={isLoadingDirections || !selectedRouteDetails}
          >
            <Icon className="h-5 w-5" />
          </Button>
        ))}
      </div>

      <div className="absolute bottom-4 left-4 z-10 bg-card/80 backdrop-blur-sm border-border/50 rounded-lg shadow-lg p-3">
        <h4 className="text-sm font-semibold text-foreground mb-2">Durações por Modalidade:</h4>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {Object.entries(modeDurations).map(([mode, duration]) => (
            <div key={mode} className="flex items-center gap-1">
              {modeIcons[mode as keyof typeof modeIcons] && React.createElement(modeIcons[mode as keyof typeof modeIcons], { className: "h-3 w-3 text-primary" })}
              <span className="capitalize">{modeLabels[mode as TransportMode]}:</span>
              <span className="font-medium text-foreground">
                {selectedRouteDetails && duration !== undefined ? formatDuration(duration) : 'N/A'}
              </span>
            </div>
          ))}
          {!selectedRouteDetails && (
            <div className="col-span-2 text-center text-xs text-muted-foreground mt-2">
              Selecione uma rota para ver as durações.
            </div>
          )}
        </div>
      </div>
    </>
  );
};