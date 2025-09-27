import { useState } from 'react';

export const useUsernameGenerator = () => {
  const [loading, setLoading] = useState(false);

  const generateUsername = async (baseUsername: string): Promise<string> => {
    return baseUsername + Math.random().toString(36).substr(2, 9);
  };

  return {
    loading,
    generateUsername
  };
};