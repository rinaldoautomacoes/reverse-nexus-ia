import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import { User as UserIcon } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface UserProfileCardProps {
  isCollapsed: boolean;
}

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
};

export const UserProfileCard: React.FC<UserProfileCardProps> = ({ isCollapsed }) => {
  const { user, profile, isLoading } = useAuth();
  const greeting = getGreeting();
  const userName = profile?.first_name || user?.email?.split('@')[0] || 'Usuário';
  const fullName = profile?.first_name && profile?.last_name 
    ? `${profile.first_name} ${profile.last_name}` 
    : userName;

  if (isLoading) {
    return (
      <div className={cn(
        "flex items-center gap-3 p-3 rounded-xl bg-gradient-primary border border-primary/50 animate-pulse",
        isCollapsed ? "justify-center" : ""
      )}>
        <div className="h-10 w-10 rounded-full bg-muted" />
        {!isCollapsed && (
          <div className="flex-1 space-y-1">
            <div className="h-4 w-24 bg-muted rounded" />
            <div className="h-3 w-16 bg-muted rounded" />
          </div>
        )}
      </div>
    );
  }

  if (!user) {
    return null; // Não mostra o card se não houver usuário logado
  }

  return (
    <div className={cn(
      "flex items-center gap-3 p-3 rounded-xl bg-gradient-primary border border-primary/50",
      isCollapsed ? "justify-center" : ""
    )}>
      {isCollapsed ? (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Avatar className="h-10 w-10 border-2 border-primary">
              <AvatarImage src={profile?.avatar_url || undefined} alt={fullName} />
              <AvatarFallback className="bg-primary/20 text-primary-foreground">
                {profile?.first_name?.charAt(0) || <UserIcon className="h-5 w-5" />}
              </AvatarFallback>
            </Avatar>
          </TooltipTrigger>
          <TooltipContent side="right">
            {greeting}, {fullName}
          </TooltipContent>
        </Tooltip>
      ) : (
        <>
          <Avatar className="h-10 w-10 border-2 border-primary">
            <AvatarImage src={profile?.avatar_url || undefined} alt={fullName} />
            <AvatarFallback className="bg-primary/20 text-primary-foreground">
              {profile?.first_name?.charAt(0) || <UserIcon className="h-5 w-5" />}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="text-sm font-medium text-primary-foreground">
              {greeting}, {profile?.first_name || 'Usuário'}!
            </p>
            <p className="text-xs text-secondary-foreground">
              {profile?.role === 'admin' ? 'Administrador' : 'Padrão'}
            </p>
          </div>
        </>
      )}
    </div>
  );
};