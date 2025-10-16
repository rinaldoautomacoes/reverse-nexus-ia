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
      {/* Coração de fundo - ajustado para um formato mais clássico e arredondado na base */}
      <path
        d="M50 10 C 20 0, 0 30, 0 40 C 0 60, 20 85, 50 90 C 80 85, 100 60, 100 40 C 100 30, 80 0, 50 10 Z"
        fill="#EF4444" // Cor vermelha
      />

      {/* Caminhão - silhueta branca */}
      {/* Corpo principal do caminhão */}
      <rect x="30" y="45" width="40" height="15" fill="white" />
      {/* Cabine do caminhão */}
      <polygon points="60,45 70,45 70,35 65,35 60,40" fill="white" />
      {/* Rodas do caminhão */}
      <circle cx="35" cy="60" r="5" fill="white" />
      <circle cx="65" cy="60" r="5" fill="white" />

      {/* Batimento cardíaco - linha vermelha sobreposta ao caminhão */}
      <path
        d="M20 50 L30 50 L35 45 L40 55 L45 50 L50 50 L55 45 L60 55 L65 50 L70 50"
        stroke="#EF4444" // Cor vermelha para o batimento
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};