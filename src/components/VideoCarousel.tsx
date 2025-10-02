"use client";

import React from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, PlayCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VideoItem {
  id: string;
  title: string;
  description: string;
  embedUrl: string; // Agora é a URL de incorporação do YouTube
}

const videoData: VideoItem[] = [
  {
    id: '1',
    title: 'Logística 4.0: Conceitos e Aplicações',
    description: 'Entenda os pilares da Logística 4.0 e como ela revoluciona a cadeia de suprimentos com tecnologias avançadas.',
    embedUrl: 'https://www.youtube.com/embed/SEU_VIDEO_ID_1', // SUBSTITUA ESTE ID PELO SEU VÍDEO DE LOGÍSTICA 4.0
  },
  {
    id: '2',
    title: 'Automação e Robótica em Armazéns',
    description: 'Descubra como a automação e robôs inteligentes otimizam a gestão de estoque e operações em centros de distribuição.',
    embedUrl: 'https://www.youtube.com/embed/SEU_VIDEO_ID_2', // SUBSTITUA ESTE ID PELO SEU VÍDEO DE LOGÍSTICA 4.0
  },
  {
    id: '3',
    title: 'Inteligência Artificial na Otimização de Rotas',
    description: 'Veja como a IA é utilizada para planejar as rotas mais eficientes, economizando tempo e recursos no transporte.',
    embedUrl: 'https://www.youtube.com/embed/SEU_VIDEO_ID_3', // SUBSTITUA ESTE ID PELO SEU VÍDEO DE LOGÍSTICA 4.0
  },
  {
    id: '4',
    title: 'Big Data e Análise Preditiva na Logística',
    description: 'Aprenda como o Big Data e a análise preditiva fornecem insights valiosos para tomadas de decisão estratégicas na logística.',
    embedUrl: 'https://www.youtube.com/embed/SEU_VIDEO_ID_4', // SUBSTITUA ESTE ID PELO SEU VÍDEO DE LOGÍSTICA 4.0
  },
  {
    id: '5',
    title: 'Sustentabilidade e Logística Verde',
    description: 'Explore as práticas e tecnologias da Logística 4.0 que promovem a sustentabilidade e reduzem o impacto ambiental.',
    embedUrl: 'https://www.youtube.com/embed/SEU_VIDEO_ID_5', // SUBSTITUA ESTE ID PELO SEU VÍDEO DE LOGÍSTICA 4.0
  },
];

export const VideoCarousel: React.FC = () => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'start' });

  const scrollPrev = React.useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = React.useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  return (
    <div className="relative">
      <div className="overflow-hidden" ref={emblaRef}>
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

      <Button
        variant="ghost"
        size="icon"
        onClick={scrollPrev}
        className="absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 z-10 bg-card/80 hover:bg-card border border-border/50 rounded-full"
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={scrollNext}
        className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 z-10 bg-card/80 hover:bg-card border border-border/50 rounded-full"
      >
        <ChevronRight className="h-5 w-5" />
      </Button>
    </div>
  );
};