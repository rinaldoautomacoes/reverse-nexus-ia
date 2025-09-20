import React, { createContext, useContext, useState, useMemo } from 'react';

interface SidebarContextType {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  sidebarWidthClass: string; // Classe Tailwind para a largura do sidebar
  mainContentMarginClass: string; // Classe Tailwind para a margem esquerda do conteúdo principal
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const SidebarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Começa aberto por padrão

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  // Define as classes de largura e margem com base no estado do sidebar
  // Ajustado para 'w-32' quando recolhido para acomodar o texto do botão de login/logout
  const sidebarWidthClass = useMemo(() => (isSidebarOpen ? 'w-64' : 'w-32'), [isSidebarOpen]);
  const mainContentMarginClass = useMemo(() => (isSidebarOpen ? 'ml-64' : 'ml-32'), [isSidebarOpen]);

  const value = {
    isSidebarOpen,
    toggleSidebar,
    sidebarWidthClass,
    mainContentMarginClass,
  };

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
};

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};