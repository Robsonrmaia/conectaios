import { useState } from 'react';
import { suppressTypes } from '@/utils/typeSuppress';

export function useMinisite() {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const updateConfig = (newConfig: any) => {
    setConfig(suppressTypes.object({ ...config, ...newConfig }));
  };

  const saveConfig = async () => {
    return;
  };

  const generateUrl = async () => {
    return '';
  };

  return {
    config,
    loading,
    updateConfig,
    saveConfig,
    generateUrl
  };
}