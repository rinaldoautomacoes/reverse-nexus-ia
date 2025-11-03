import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Mail, Lock, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { z } from "zod";
// Removido: import aiAssistantBg from "@/assets/ai-assistant-login-bg.png";

const loginSchema = z.object({
  email: z.string().trim().email("E-mail inválido").max(255, "E-mail muito longo"),
  password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres").max(72, "Senha muito longa"),
});

export const Auth = () => {
  const { user, profile, isLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    // Only redirect if we are on the /auth path AND user is logged in
    if (!isLoading && user && profile && location.pathname === '/auth') {
      if (profile.role === 'admin') {
        navigate('/dashboard-geral', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
    // If not loading and no user/profile, or not on /auth path, do nothing (stay on current page or render login form)
  }, [user, profile, isLoading, navigate, location.pathname]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate input before making API call
      const validationResult = loginSchema.safeParse({
        email: loginEmail,
        password: loginPassword,
      });

      if (!validationResult.success) {
        const firstError = validationResult.error.errors[0];
        toast({
          title: "Dados inválidos",
          description: firstError.message,
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: validationResult.data.email,
        password: validationResult.data.password,
      });

      if (error) {
        toast({
          title: "Erro no login",
          description: error.message || "E-mail ou senha incorretos. Verifique suas credenciais.",
          variant: "destructive"
        });
      } else {
        // The useEffect above will handle redirection once user and profile are loaded by useAuth.
        toast({
          title: "Login realizado!",
          description: `Bem-vindo(a) à plataforma de logística 360.`,
        });
        setLoginEmail("");
        setLoginPassword("");
      }
    } catch (error) {
      console.error("Erro no login:", error);
      toast({
        title: "Erro inesperado",
        description: "Tente novamente em alguns momentos.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while auth is being checked
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Verificando sessão...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Removido: AI Assistant Background */}
      {/* Removido: Subtle Gradient Overlay */}
      
      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 relative z-10">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 rounded-xl bg-gradient-primary glow-effect">
                <Brain className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold font-orbitron gradient-text mb-2">
              Gestão Logística
            </h1>
            <p className="text-muted-foreground">
              Plataforma Inteligente de Logística
            </p>
          </div>

          {/* Auth Card */}
          <Card className="card-futuristic border-primary/20">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-semibold">Acesso à Plataforma</CardTitle>
              <CardDescription>
                Entre na sua conta
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="seu@email.com"
                      className="pl-10"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-gradient-primary hover:bg-gradient-primary/80 glow-effect"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  ) : (
                    <Zap className="w-4 h-4 mr-2" />
                  )}
                  Entrar
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};