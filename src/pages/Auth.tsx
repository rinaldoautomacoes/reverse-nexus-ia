import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, Mail, Lock, Truck, Zap, ArrowLeft, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { User, Session } from '@supabase/supabase-js';
import { EmailCombobox } from "@/components/EmailCombobox"; // Importar o novo componente

const RECENT_EMAILS_KEY = 'logireverseia_recent_emails';

export const Auth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [recentEmails, setRecentEmails] = useState<string[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Load recent emails from localStorage
    const storedEmails = localStorage.getItem(RECENT_EMAILS_KEY);
    try {
      if (storedEmails) {
        const parsedEmails = JSON.parse(storedEmails);
        if (Array.isArray(parsedEmails)) {
          setRecentEmails(parsedEmails);
        } else {
          console.warn("Stored recent emails are not an array:", parsedEmails);
          setRecentEmails([]); // Fallback to empty array
        }
      }
    } catch (e) {
      console.error("Error parsing recent emails from localStorage:", e);
      setRecentEmails([]); // Fallback to empty array on parse error
    }

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Redirect authenticated users to dashboard
        if (session?.user) {
          navigate('/');
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      // Redirect if already authenticated
      if (session?.user) {
        navigate('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const addEmailToRecent = (newEmail: string) => {
    setRecentEmails(prevEmails => {
      const updatedEmails = [newEmail, ...prevEmails.filter(e => e !== newEmail)].slice(0, 5); // Keep last 5 emails
      localStorage.setItem(RECENT_EMAILS_KEY, JSON.stringify(updatedEmails));
      return updatedEmails;
    });
  };

  const clearRecentEmails = () => {
    localStorage.removeItem(RECENT_EMAILS_KEY);
    setRecentEmails([]);
    setEmail(""); // Clear current email if it was from recent list
    toast({
      title: "Histórico Limpo",
      description: "O histórico de e-mails recentes foi removido.",
    });
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl
        }
      });

      if (error) {
        if (error.message.includes("already registered")) {
          toast({
            title: "Email já cadastrado",
            description: "Este email já está registrado. Tente fazer login ou use outro email.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Erro no cadastro",
            description: error.message,
            variant: "destructive"
          });
        }
      } else {
        addEmailToRecent(email); // Add email to recent list on successful signup
        toast({
          title: "Cadastro realizado!",
          description: "Verifique seu email para confirmar a conta e fazer login.",
        });
      }
    } catch (error) {
      toast({
        title: "Erro inesperado",
        description: "Tente novamente em alguns momentos.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        toast({
          title: "Erro no login",
          description: "Email ou senha incorretos. Verifique suas credenciais.",
          variant: "destructive"
        });
      } else {
        addEmailToRecent(email); // Add email to recent list on successful signin
        toast({
          title: "Login realizado!",
          description: "Bem-vindo ao LogiReverseIA.",
        });
      }
    } catch (error) {
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
    <div className="min-h-screen bg-background ai-pattern flex flex-col">
      {/* Header */}
      <div className="p-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="hover:bg-primary/10"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar ao Dashboard
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 rounded-xl bg-gradient-primary glow-effect">
                <Brain className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold font-orbitron gradient-text mb-2">
              LogiReverseIA
            </h1>
            <p className="text-muted-foreground">
              Plataforma Inteligente de Logística Reversa
            </p>
          </div>

          {/* Auth Card */}
          <Card className="card-futuristic border-primary/20">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-semibold">Acesso à Plataforma</CardTitle>
              <CardDescription>
                Entre na sua conta para começar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="signin" className="w-full">
                <TabsList className="grid w-full grid-cols-1 mb-6">
                  <TabsTrigger value="signin">Entrar</TabsTrigger>
                </TabsList>

                <TabsContent value="signin">
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signin-email">Email</Label>
                      <EmailCombobox
                        value={email}
                        onValueChange={setEmail}
                        recentEmails={recentEmails}
                        onClearRecentEmails={clearRecentEmails}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signin-password">Senha</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signin-password"
                          type="password"
                          placeholder="••••••••"
                          className="pl-10"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
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
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Features */}
          <div className="mt-8 text-center">
            <div className="grid grid-cols-1 gap-4 text-sm text-muted-foreground">
              <div className="flex items-center justify-center gap-2">
                <Truck className="w-4 h-4 text-primary" />
                <span>Gestão Inteligente de Rotas</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <Brain className="w-4 h-4 text-neural" />
                <span>IA para Otimização Logística</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <Zap className="w-4 h-4 text-accent" />
                <span>Automação de Processos</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};