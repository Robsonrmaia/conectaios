import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Shield } from 'lucide-react';

export default function CreateAdminButton() {
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateAdmin = async () => {
    try {
      setIsCreating(true);
      
      const { data, error } = await supabase.functions.invoke('create-admin-user');
      
      if (error) {
        console.error('Error creating admin:', error);
        toast.error('Erro ao criar usuário admin');
        return;
      }

      toast.success('Usuário admin criado com sucesso!');
      console.log('Admin created:', data);
      
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erro ao criar usuário admin');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Button 
      onClick={handleCreateAdmin}
      disabled={isCreating}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      <Shield className="h-4 w-4" />
      {isCreating ? 'Criando Admin...' : 'Criar Admin'}
    </Button>
  );
}