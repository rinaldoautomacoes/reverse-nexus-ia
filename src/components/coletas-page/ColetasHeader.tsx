import React from 'react';

export const ColetasHeader: React.FC = () => {
  return (
    <div className="text-center">
      <h1 className="text-4xl font-bold font-orbitron gradient-text mb-4">
        Coletas Ativas
      </h1>
      <p className="text-muted-foreground">
        Gerencie todas as coletas que ainda não foram concluídas.
      </p>
    </div>
  );
};