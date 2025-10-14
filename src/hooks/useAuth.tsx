import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { CacheManager } from '@/utils/cacheManager';
import { toast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🔐 Initializing Auth Provider');
    
    // Check and fix corrupted sessions
    const checkAndFixCorruptedSession = async () => {
      try {
        const authData = localStorage.getItem('sb-paawojkqrggnuvpnnwrc-auth-token');
        const corruptedFlag = sessionStorage.getItem('corrupted-session-cleaned');
        
        if (authData && !corruptedFlag) {
          const parsed = JSON.parse(authData);
          const refreshToken = parsed?.refresh_token;
          const accessToken = parsed?.access_token;
          
          // Detectar tokens corrompidos (muito curtos)
          const isRefreshTokenCorrupted = refreshToken && refreshToken.length < 100;
          const isAccessTokenCorrupted = accessToken && accessToken.length < 500;
          
          if (isRefreshTokenCorrupted || isAccessTokenCorrupted) {
            console.warn('⚠️ Token corrompido detectado');
            console.warn('Refresh token:', refreshToken?.length || 0, 'chars');
            console.warn('Access token:', accessToken?.length || 0, 'chars');
            
            // Marcar que já limpamos para evitar loops
            sessionStorage.setItem('corrupted-session-cleaned', 'true');
            
            // Limpar tudo
            localStorage.removeItem('sb-paawojkqrggnuvpnnwrc-auth-token');
            sessionStorage.clear();
            
            await supabase.auth.signOut();
            
            // Notificar usuário
            toast({
              title: "⚠️ Sessão Corrompida Detectada",
              description: "Sua sessão foi limpa automaticamente. Por favor, faça login novamente.",
              variant: "destructive",
              duration: 6000,
            });
            
            console.log('✅ Sessão corrompida removida. Redirecionando para login...');
            
            // Aguardar um pouco antes de definir loading como false
            setTimeout(() => {
              setLoading(false);
              window.location.href = '/auth';
            }, 1000);
            
            return true; // Indica que houve correção
          }
        }
        
        return false; // Nenhuma correção necessária
      } catch (error) {
        console.error('Erro ao verificar sessão:', error);
        return false;
      }
    };
    
    // Executar verificação de forma assíncrona
    checkAndFixCorruptedSession().then((wasCorrupted) => {
      // Se detectou corrupção, não continuar com o fluxo normal
      if (wasCorrupted) {
        return;
      }
      
      // Check and clear stale cache
      CacheManager.checkAndClearStaleCache();
      
      // Clear stale sessions
      if (CacheManager.isStaleSession()) {
        console.log('🧹 Clearing stale session');
        supabase.auth.signOut();
      }
    });
    // Add timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      if (loading) {
        console.warn('⚠️ Auth loading timeout - proceeding without auth');
        setLoading(false);
      }
    }, 5000);

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('🔐 Auth state changed:', event, !!session);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        clearTimeout(loadingTimeout);
        
        // Update activity when user signs in
        if (session) {
          CacheManager.updateActivity();
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('❌ Error getting session:', error);
        setLoading(false);
        return;
      }
      
      console.log('🔐 Initial session check:', !!session);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      clearTimeout(loadingTimeout);
      
      if (session) {
        CacheManager.updateActivity();
      }
    }).catch((error) => {
      console.error('❌ Error in getSession:', error);
      setLoading(false);
      clearTimeout(loadingTimeout);
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(loadingTimeout);
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}