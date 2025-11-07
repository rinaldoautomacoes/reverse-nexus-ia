import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { LogOut, User as UserIcon } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface UserProfileCardProps {
  isCollapsed: boolean;
}

export const UserProfileCard: React.FC<UserProfileCardProps> = ({ isCollapsed }) => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  if (!user || !profile) {
    return null; // Não renderiza se não houver usuário ou perfil
  }

  const displayName = profile.first_name || user.email?.split('@')[0] || 'Usuário';
  const displayRole = profile.role === 'admin' ? 'Administrador' : 'Padrão';

  return (
    <div className={cn(
      "flex items-center gap-3 p-2 rounded-lg bg-primary/10 text-primary-foreground",
      isCollapsed ? "justify-center" : "justify-start"
    )}>
      <Avatar className={cn("h-9 w-9", isCollapsed && "h-10 w-10")}>
        <AvatarImage src={profile.avatar_url || undefined} alt={displayName} />
        <AvatarFallback className="bg-primary text-primary-foreground">
          {displayName.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      {!isCollapsed && (
        <div className="flex-1">
          <p className="font-semibold text-sm text-neon-cyan">{displayName}</p>
          <p className="text-xs text-muted-foreground">{displayRole}</p>
        </div>
      )}
    </div>
  );
};