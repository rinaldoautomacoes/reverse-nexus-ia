import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LogOut, CheckCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

export const AuthButton: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleAuthClick = async () => {
    if (user) {
      await supabase.auth.signOut();
      navigate('/auth');
    } else {
      navigate('/auth');
    }
  };

  return (
    <Button
      variant="outline"
      className={cn(
        "border-neural text-neural hover:bg-neural/10 glow-effect",
        user ? "bg-destructive/10 border-destructive text-destructive hover:bg-destructive/20" : ""
      )}
      onClick={handleAuthClick}
    >
      {user ? (
        <>
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </>
      ) : (
        <>
          <CheckCircle className="mr-2 h-4 w-4" />
          Login / Cadastro
        </>
      )}
    </Button>
  );
};