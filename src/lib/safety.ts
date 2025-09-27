// FASE 2: Sistema de limpeza controlada
export const allowSamplePurge = import.meta.env.VITE_ALLOW_SAMPLE_PURGE === 'true';

export const SAFETY_FLAGS = {
  ALLOW_SAMPLE_PURGE: allowSamplePurge,
  PRODUCTION_MODE: import.meta.env.PROD,
  DEV_MODE: import.meta.env.DEV
};

export function validatePurgePermission(): boolean {
  return SAFETY_FLAGS.ALLOW_SAMPLE_PURGE && !SAFETY_FLAGS.PRODUCTION_MODE;
}

export function logSecurityAction(action: string, details: any = {}) {
  if (SAFETY_FLAGS.DEV_MODE) {
    console.log(`[SECURITY] ${action}:`, details);
  }
}