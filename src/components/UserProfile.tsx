import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

interface UserProfileData {
  id: string;
  email: string | null;
  full_name: string | null;
  role: string;
}

export function UserProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, email, full_name, role')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
        } else {
          setProfile(data);
        }
      } catch (error) {
        console.error('Unexpected error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  if (loading) return <div>Carregando perfil...</div>;
  if (!profile) return null;

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm">{profile.full_name || profile.email}</span>
      {profile.role === 'admin' && (
        <Badge variant="secondary" className="text-xs">
          Admin
        </Badge>
      )}
    </div>
  );
}