"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Loader2, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

interface ForgotPasswordDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const emailSchema = z.string().trim().email("E-mail inválido").max(255, "E-mail muito longo");

export const ForgotPasswordDialog: React.FC<ForgotPasswordDialogProps> = ({
  isOpen,
  onClose,
}) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validationResult = emailSchema.safeParse(email);

      if (!validationResult.success) {
        const firstError = validationResult.error.errors[0];
        toast({
          title: "E-mail inválido",
          description: firstError.message,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.resetPasswordForEmail(validationResult.data, {
        redirectTo: `${window.location.origin}/auth?reset=true`, // Redireciona de volta para a página de login com um parâmetro
      });

      if (error) {
        toast({
          title: "Erro ao redefinir senha",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "E-mail de recuperação enviado!",
          description: "Verifique sua caixa de entrada (e spam) para o link de redefinição de senha.",
        });
        setEmail("");
        onClose();
      }
    } catch (error) {
      console.error("Erro inesperado na redefinição de senha:", error);
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro ao tentar redefinir sua senha. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-card border-primary/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 gradient-text">
            <Lock className="h-5 w-5" />
            Esqueceu sua senha?
          </DialogTitle>
          <DialogDescription>
            Insira seu e-mail abaixo para receber um link de redefinição de senha.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleResetPassword} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="email-reset">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email-reset"
                type="email"
                placeholder="seu@email.com"
                className="pl-10"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-gradient-primary hover:bg-gradient-primary/80 glow-effect"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Lock className="mr-2 h-4 w-4" />
              )}
              Redefinir Senha
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};