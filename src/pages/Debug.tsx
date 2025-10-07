import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { CheckCircle, XCircle, User, Database, ArrowLeft } from "lucide-react";

export const Debug = () => {
  const { user, session, profile, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen bg-background ai-pattern p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-3xl font-bold">Debug Dashboard</h1>
        </div>

        {/* Authentication Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Estado da Autenticação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Status de Carregamento:</p>
                <Badge variant={isLoading ? "secondary" : "outline"}>
                  {isLoading ? "Carregando..." : "Carregado"}
                </Badge>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Usuário Logado:</p>
                <Badge variant={user ? "default" : "destructive"}>
                  {user ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                  {user ? "Sim" : "Não"}
                </Badge>
              </div>
            </div>

            {user && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Dados do Usuário:</p>
                <div className="bg-muted p-3 rounded-lg">
                  <pre className="text-xs overflow-auto">
                    {JSON.stringify({
                      id: user.id,
                      email: user.email,
                      created_at: user.created_at
                    }, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {profile && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Perfil do Usuário:</p>
                <div className="bg-muted p-3 rounded-lg">
                  <pre className="text-xs overflow-auto">
                    {JSON.stringify(profile, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {session && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Sessão:</p>
                <div className="bg-muted p-3 rounded-lg">
                  <pre className="text-xs overflow-auto">
                    {JSON.stringify({
                      access_token: session.access_token ? "Presente" : "Ausente",
                      refresh_token: session.refresh_token ? "Presente" : "Ausente",
                      expires_at: session.expires_at,
                      token_type: session.token_type
                    }, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {user && (
              <Button onClick={handleLogout} variant="destructive">
                Fazer Logout
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Database Connection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Conexão com Supabase
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm font-medium">URL do Supabase:</p>
              <p className="text-xs font-mono bg-muted p-2 rounded">
                {process.env.NODE_ENV === 'development' ? 'wbfbhdmkawoxpxkeeucj.supabase.co' : 'Conectado'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Environment Info */}
        <Card>
          <CardHeader>
            <CardTitle>Informações do Ambiente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium">Ambiente:</p>
                <p className="text-muted-foreground">{process.env.NODE_ENV}</p>
              </div>
              <div>
                <p className="font-medium">URL Atual:</p>
                <p className="text-muted-foreground break-all">{window.location.href}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};