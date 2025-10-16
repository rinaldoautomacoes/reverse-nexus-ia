import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Lock, Truck, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { User, Session } from '@supabase/supabase-js';
import { HeartTruckLogo } from "@/components/HeartTruckLogo"; // Importar o novo componente da logo

export const Auth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          navigate('/');
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        navigate('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

      if (error) {
        toast({
          title: "Erro no login",
          description: error.message || "E-mail ou senha incorretos. Verifique suas credenciais.",
          variant: "destructive"
        });
      } else {
        // Login successful, now fetch the user's profile for the greeting
        const { data: { user: loggedInUser }, error: getUserError } = await supabase.auth.getUser();

        let greetingName = "usuário"; // Default greeting

        if (loggedInUser && !getUserError) {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('first_name')
            .eq('id', loggedInUser.id)
            .single();

          if (profileData && !profileError && profileData.first_name) {
            greetingName = profileData.first_name;
          }
        }

        toast({
          title: "Login realizado!",
          description: `Bem-vindo(a) ${greetingName} à plataforma de logística 360.`,
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

  return (
    <div className="min-h-screen bg-background login-background-pattern flex flex-col">
      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              {/* Usando o novo componente HeartTruckLogo */}
              <HeartTruckLogo width={96} height={96} />
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
                <Button
                  type="button"
                  className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  onClick={() => { /* Ação para o botão "Entrar" */ }}
                >
                  Entrar
                </Button>
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

          {/* Features */}
          {/* Removido o bloco de features */}
        </div>
      </div>
    </div>
  );
};