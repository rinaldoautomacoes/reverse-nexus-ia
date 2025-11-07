import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';
import type { Tables } from '@/integrations/supabase/types_generated'; // Corrected import path

type Profile = Tables<'profiles'>;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log("AuthProvider: Inicializando autenticação...");
    
    const fetchUserProfile = async (userId: string) => {
      console.log("AuthProvider: Buscando perfil para o usuário:", userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error("Erro ao buscar perfil do usuário:", error);
        setProfile(null);
      } else {
        console.log("AuthProvider: Perfil encontrado:", data);
        setProfile(data);
      }
    };

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        console.log("AuthProvider: Auth state changed", event, currentSession?.user?.id);
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        // Defer Supabase calls with setTimeout to prevent deadlock
        if (currentSession?.user) {
          setTimeout(() => {
            fetchUserProfile(currentSession.user.id);
          }, 0);
        } else {
          setProfile(null);
        }
        setIsLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      console.log("AuthProvider: Sessão inicial:", initialSession?.user?.id);
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      
      if (initialSession?.user) {
        setTimeout(() => {
          fetchUserProfile(initialSession.user.id);
        }, 0);
      } else {
        setProfile(null);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, profile, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  console.log("useAuth hook called"); // Adicionado para depuração
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};