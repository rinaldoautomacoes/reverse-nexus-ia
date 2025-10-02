"use client";

import React from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, PlayCircle, Brain } from 'lucide-react'; // Adicionado Brain para o placeholder
import { cn } from '@/lib/utils';

interface VideoItem {
  id: string;
  title: string;
  description: string;
  embedUrl: string; // Agora é a URL de incorporação do YouTube
}

const videoData: VideoItem[] = [
  // Os dados dos vídeos foram removidos para deixar o carrossel vazio
];

export const VideoCarousel: React.FC = () => {
  // Não precisamos mais do emblaRef e emblaApi se não houver vídeos
  // const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'start' });

  // const scrollPrev = React.useCallback(() => {
  //   if (emblaApi) emblaApi.scrollPrev();
  // }, [emblaApi]);

  // const scrollNext = React.useCallback(() => {
  //   if (emblaApi) emblaApi.scrollNext();
  // }, [emblaApi]);

  return (
    <div className="relative">
      {videoData.length > 0 ? ( // Renderiza o carrossel apenas se houver dados de vídeo
        <div className="overflow-hidden" /* ref={emblaRef} */>
          <div className="flex -ml-4">
            {videoData.map((video) => (
              <div key={video.id} className="flex-none w-full md:w-1/2 lg:w-1/3 pl-4">
                <Card className="card-futuristic h-full flex flex-col bg-card/80 backdrop-blur-sm border-border/50">
                  <CardHeader className="relative p-0 overflow-hidden rounded-t-lg">
                    <div className="relative w-full pt-[56.25%]"> {/* 16:9 Aspect Ratio */}
                      <iframe
                        className="absolute top-0 left-0 w-full h-full rounded-t-lg"
                        src={video.embedUrl}
                        title={video.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      ></iframe>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <CardTitle className="text-lg font-semibold mb-2 gradient-text">{video.title}</CardTitle>
                      <CardDescription className="text-sm text-muted-foreground">{video.description}</CardDescription>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      ) : ( // Caso contrário, renderiza o card de placeholder
        <Card className="card-futuristic border-0 bg-gradient-dark h-64 flex items-center justify-center text-center">
          <CardContent className="p-6">
            <PlayCircle className="h-12 w-12 text-primary mx-auto mb-4 animate-float" />
            <p className="text-lg font-semibold text-muted-foreground">
              Conteúdo de vídeo futuro para esta seção.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Tutoriais e demonstrações em breve!
            </p>
          </CardContent>
        </Card>
      )}

      {/* Botões de navegação do carrossel (ocultos se não houver vídeos) */}
      {videoData.length > 0 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            // onClick={scrollPrev}
            className="absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 z-10 bg-card/80 hover:bg-card border border-border/50 rounded-full"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            // onClick={scrollNext}
            className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 z-10 bg-card/80 hover:bg-card border border-border/50 rounded-full"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </>
      )}
    </div>
  );
};