"use client";

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LogOut, CheckCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';

interface SidebarAuthButtonProps {
  isCollapsed: boolean;
  setIsSheetOpen?: (open: boolean) => void; // Optional for mobile sheet
}

export const SidebarAuthButton: React.FC<SidebarAuthButtonProps> = ({ isCollapsed, setIsSheetOpen }) => {
  const navigate = useNavigate();
  const { user } = useAuth(); // Apenas o 'user' é suficiente para decidir se o botão é de 'Sair' ou 'Login'
  const isMobile = useIsMobile();
  const { toast } = useToast();

  const handleAuthClick = async () => {
    if (user) { // Se o usuário está logado na UI, tentamos sair
      console.log("Attempting to log out...");
      try {
        const { error } = await supabase.auth.signOut();

        if (error) {
          // Se o erro for "Auth session missing!", tratamos como logout bem-sucedido
          if (error.message.includes("Auth session missing!")) {
            console.warn("Supabase reported 'Auth session missing!' during signOut. Treating as successful logout.");
            toast({
              title: "Sessão encerrada",
              description: "Você foi desconectado com sucesso.",
            });
          } else {
            // Outros erros são falhas reais de logout
            console.error("Logout error:", error.message);
            toast({
              title: "Erro ao sair",
              description: error.message,
              variant: "destructive"
            });
            return; // Não redireciona se for um erro diferente
          }
        } else {
          console.log("Logout successful.");
          toast({
            title: "Sessão encerrada",
            description: "Você foi desconectado com sucesso.",
          });
        }
        // Sempre navega para /auth após tentar o logout (mesmo que a sessão já estivesse ausente)
        navigate('/auth');
      } catch (error: any) {
        // Captura quaisquer erros inesperados da chamada signOut
        if (error.message.includes("Auth session missing!")) {
          console.warn("Caught 'Auth session missing!' error. Treating as successful logout.");
          toast({
            title: "Sessão encerrada",
            description: "Você foi desconectado com sucesso.",
          });
          navigate('/auth');
        } else {
          console.error("Unexpected error during logout:", error);
          toast({
            title: "Erro inesperado",
            description: error.message || "Tente novamente em alguns momentos.",
            variant: "destructive"
          });
        }
      }
    } else { // Se o usuário não está logado na UI, apenas navegamos para a página de autenticação
      console.log("User is not logged in. Navigating to /auth.");
      navigate('/auth');
    }
    if (isMobile && setIsSheetOpen) setIsSheetOpen(false);
  };

  return (
    <div className="border-t border-border/30 pt-4">
      {user ? (
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left h-12 text-base border-destructive text-destructive hover:bg-destructive/10",
            isCollapsed && 'justify-center px-0'
          )}
          onClick={handleAuthClick}
        >
          <LogOut className={cn(isCollapsed ? 'h-6 w-6' : 'mr-3 h-5 w-5')} />
          {!isCollapsed && 'Sair'}
        </Button>
      ) : (
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left h-12 text-base border-neural text-neural hover:bg-neural/10",
            isCollapsed && 'justify-center px-0'
          )}
          onClick={handleAuthClick}
        >
          <CheckCircle className={cn(isCollapsed ? 'h-6 w-6' : 'mr-3 h-5 w-5')} />
          {!isCollapsed && 'Login / Cadastro'}
        </Button>
      )}
    </div>
  );
};