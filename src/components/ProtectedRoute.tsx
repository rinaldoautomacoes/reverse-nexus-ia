import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';

interface ProtectedRouteProps {
  allowedRoles?: string[];
  redirectPath?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  allowedRoles,
  redirectPath = '/auth',
}) => {
  const { user, profile, isLoading } = useAuth();

  if (isLoading) {
    // Pode renderizar um spinner de carregamento aqui
    return (
      <div className="min-h-screen bg-background ai-pattern p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // Se não houver usuário, redireciona para a página de autenticação
    return <Navigate to={redirectPath} replace />;
  }

  if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
    // Se o usuário não tiver um papel permitido, redireciona para o dashboard (ou outra página)
    // Para usuários padrão, eles podem ver o dashboard, mas não as páginas de gerenciamento
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};