"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Loader2, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useNavigate } from "react-router-dom";

const newPasswordSchema = z.object({
  password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres").max(72, "Senha muito longa"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

interface SetNewPasswordFormProps {
  onPasswordSet: () => void;
}

export const SetNewPasswordForm: React.FC<SetNewPasswordFormProps> = ({ onPasswordSet }) => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validationResult = newPasswordSchema.safeParse({ password, confirmPassword });

      if (!validationResult.success) {
        const firstError = validationResult.error.errors[0];
        toast({
          title: "Erro de validação",
          description: firstError.message,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.updateUser({
        password: validationResult.data.password,
      });

      if (error) {
        toast({
          title: "Erro ao definir nova senha",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Senha redefinida com sucesso!",
          description: "Sua nova senha foi salva. Você já pode fazer login.",
        });
        setPassword("");
        setConfirmPassword("");
        onPasswordSet(); // Notifica o componente pai para fechar o formulário ou redirecionar
        navigate('/auth', { replace: true }); // Redireciona para a página de login
      }
    } catch (error) {
      console.error("Erro inesperado ao definir nova senha:", error);
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro ao tentar definir sua nova senha. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSetNewPassword} className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="new-password">Nova Senha</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="new-password"
            type="password"
            placeholder="••••••••"
            className="pl-10"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="confirm-password"
            type="password"
            placeholder="••••••••"
            className="pl-10"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={loading}
          />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button
          type="submit"
          className="bg-gradient-primary hover:bg-gradient-primary/80 glow-effect"
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle className="mr-2 h-4 w-4" />
          )}
          Definir Nova Senha
        </Button>
      </div>
    </form>
  );
};