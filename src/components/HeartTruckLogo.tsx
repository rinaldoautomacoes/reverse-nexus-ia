import React from 'react';

interface HeartTruckLogoProps {
  width?: number;
  height?: number;
  className?: string;
}

export const HeartTruckLogo: React.FC<HeartTruckLogoProps> = ({ width = 96, height = 96, className }) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Fundo do Coração Vermelho */}
      <path
        d="M50 10 C 70 0, 90 20, 90 40 C 90 60, 70 80, 50 90 C 30 80, 10 60, 10 40 C 10 20, 30 0, 50 10 Z"
        fill="#EF4444" // Cor vermelha
      />

      {/* Linha do Batimento Cardíaco e Caminhão (caminho combinado) */}
      <path
        d="M20 50 
           L30 50 
           L35 40 
           L40 60 
           L45 50 
           L50 50 
           L50 40 
           L60 40 
           L60 50 
           L75 50 
           L75 60 
           L55 60 
           L55 50 
           L50 50"
        stroke="white"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Rodas do caminhão */}
      <circle cx="57" cy="65" r="5" fill="white"/>
      <circle cx="72" cy="65" r="5" fill="white"/>
    </svg>
  );
};