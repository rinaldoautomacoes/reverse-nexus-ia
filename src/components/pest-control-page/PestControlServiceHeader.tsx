import React from 'react';

interface PestControlServiceHeaderProps {
  title: string;
  description: string;
}

export const PestControlServiceHeader: React.FC<PestControlServiceHeaderProps> = ({ title, description }) => {
  return (
    <div className="text-center">
      <h1 className="text-4xl font-bold font-orbitron gradient-text mb-4">
        {title}
      </h1>
      <p className="text-muted-foreground">
        {description}
      </p>
    </div>
  );
};