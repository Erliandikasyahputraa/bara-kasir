import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';

interface AuthContextType {
  session: Session | null;
  profile: any | null;
  loading: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  profile: null,
  loading: true,
  isAdmin: false,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (uid: string) => {
    // 1. Coba ambil data profil
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', uid)
      .maybeSingle();

    if (!data && !error) {
      // 2. Jika data TIDAK ADA, buatkan profil baru otomatis
      // Akun pertama akan selalu jadi 'owner' sebagai pengaman
      const { data: allProfiles } = await supabase.from('profiles').select('id').limit(1);
      const isFirstUser = !allProfiles || allProfiles.length === 0;
      
      const { data: newProfile } = await supabase
        .from('profiles')
        .insert([
          { id: uid, role: isFirstUser ? 'owner' : 'staff', full_name: 'User Baru' }
        ])
        .select()
        .single();
      
      setProfile(newProfile);
    } else {
      setProfile(data);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else setProfile(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const isAdmin = profile?.role === 'owner';

  return (
    <AuthContext.Provider value={{ session, profile, loading, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
