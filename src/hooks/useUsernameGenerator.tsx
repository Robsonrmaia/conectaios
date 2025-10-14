import { supabase } from '@/integrations/supabase/client';

export const useUsernameGenerator = () => {
  
  const generateUsername = async (fullName: string): Promise<string> => {
    // Sanitize and create base username from full name
    const sanitizedName = fullName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-z0-9]/g, '') // Only letters and numbers
      .substring(0, 20); // Max 20 chars

    if (sanitizedName.length < 3) {
      throw new Error('Nome muito curto para gerar username');
    }

    let username = sanitizedName;
    let counter = 1;
    
    // Check if username is available, add numbers if not
    while (await isUsernameTaken(username)) {
      username = `${sanitizedName}${counter}`;
      counter++;
      
      // Prevent infinite loop
      if (counter > 999) {
        username = `${sanitizedName}${Date.now().toString().slice(-4)}`;
        break;
      }
    }

    return username;
  };

  const isUsernameTaken = async (username: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('conectaios_brokers')
        .select('username')
        .eq('username', username)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error checking username:', error);
        return true; // Assume taken on error for safety
      }

      return !!data;
    } catch (error) {
      console.error('Error in isUsernameTaken:', error);
      return true; // Assume taken on error for safety
    }
  };

  const validateUsername = (username: string): { isValid: boolean; error?: string } => {
    if (!username || username.length < 3) {
      return { isValid: false, error: 'Username deve ter pelo menos 3 caracteres' };
    }
    
    if (username.length > 30) {
      return { isValid: false, error: 'Username não pode ter mais de 30 caracteres' };
    }
    
    if (!/^[a-z0-9_]+$/.test(username)) {
      return { isValid: false, error: 'Username pode conter apenas letras minúsculas, números e underscore' };
    }
    
    if (username.startsWith('_') || username.endsWith('_')) {
      return { isValid: false, error: 'Username não pode começar ou terminar com underscore' };
    }

    return { isValid: true };
  };

  return {
    generateUsername,
    isUsernameTaken,
    validateUsername
  };
};