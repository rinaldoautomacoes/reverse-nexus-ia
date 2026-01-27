import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MapboxTokenManagerProps {
  onTokenSet: (token: string) => void;
}

export const MapboxTokenManager: React.FC<MapboxTokenManagerProps> = ({ onTokenSet }) => {
  const { toast } = useToast();
  const [mapboxTokenInput, setMapboxTokenInput] = useState<string>('');

  const handleTokenSubmit = () => {
    if (!mapboxTokenInput) {
      toast({
        title: "Token Mapbox Vazio",
        description: "Por favor, insira seu token público do Mapbox.",
        variant: "destructive"
      });
      return;
    }
    localStorage.setItem("mapbox_token", mapboxTokenInput);
    onTokenSet(mapboxTokenInput);
    toast({
      title: "Token Mapbox Salvo",
      description: "O token foi salvo e o mapa será inicializado.",
    });
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-muted/20 backdrop-blur-sm">
      <Card className="bg-card p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
        <CardContent className="p-0">
          <h2 className="text-xl font-semibold mb-4">Configurar Mapbox</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Para visualizar o mapa, insira seu token público do Mapbox.
            Obtenha em:{" "}
            <a
              href="https://account.mapbox.com/access-tokens/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              mapbox.com
            </a>
          </p>
          <div className="space-y-3">
            <Input
              type="text"
              placeholder="pk.eyJ1Ijoi..."
              value={mapboxTokenInput}
              onChange={(e) => setMapboxTokenInput(e.target.value)}
            />
            <Button
              onClick={handleTokenSubmit}
              className="w-full"
              disabled={!mapboxTokenInput}
            >
              Inicializar Mapa
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};