// Tipos de compatibilidade para resolver problemas de TypeScript
// Este arquivo fornece tipos que resolvem inconsistências entre schema e código

export type CompatPlans = {
  id: string;
  name: string;
  slug: string;
  price: number;
  property_limit: number;
  match_limit?: number;
  thread_limit?: number;
  features: any[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

// Tipos para propriedades compatíveis
export type PropertyCompat = {
  id: string;
  title: string;
  titulo?: string;
  description: string;
  descricao?: string;
  price: number | null;
  valor?: number | null;
  city: string | null;
  cidade?: string | null;
  neighborhood: string | null;
  bairro?: string | null;
  is_public: boolean;
  visibility: string | null;
  owner_id: string;
  created_at: string;
  updated_at: string;
  thumb_url?: string | null;
  bathrooms?: number;
  bedrooms?: number;
  parking_spots?: number;
  area_built?: number;
  area_total?: number;
  purpose?: string;
  type?: string;
  status?: string;
};

// Fix para useAdminAuth
export const safeUserRole = (data: any): string | null => {
  return data?.role || null;
};

// Fix para useBroker - garantir que planos são tipados corretamente
export const safePlanData = (data: any): CompatPlans | null => {
  if (!data || typeof data !== 'object') return null;
  
  // Se é um array, pegar o primeiro item
  if (Array.isArray(data)) {
    return data.length > 0 ? data[0] as CompatPlans : null;
  }
  
  // Se tem propriedades de plan, retornar como plan
  if (data.name && data.slug !== undefined) {
    return data as CompatPlans;
  }
  
  return null;
};

// Fix para queries que usam profiles.user_id → profiles.id
export const eqUserId = () => "= auth.uid()";

// Helper para converter dados de supabase que podem vir como diferentes tipos
export const asString = (value: any): string => {
  if (typeof value === 'string') return value;
  if (value === null || value === undefined) return '';
  return String(value);
};

export const asNumber = (value: any): number => {
  if (typeof value === 'number') return value;
  if (value === null || value === undefined) return 0;
  const num = Number(value);
  return isNaN(num) ? 0 : num;
};

export const asBoolean = (value: any): boolean => {
  if (typeof value === 'boolean') return value;
  if (value === null || value === undefined) return false;
  return Boolean(value);
};

// Tipos para support tickets compatíveis com a interface atual
export type CompatSupportTicket = {
  id: string;
  subject: string;
  body: string;
  status: string;
  priority: string;
  user_id: string;
  assignee_id: string;
  broker_id: string;
  created_at: string;
  updated_at: string;
  // Campos adicionais necessários pela interface
  title: string;
  description: string;
  category: string;
};

export const compatSupportTicket = (data: any): CompatSupportTicket => ({
  ...data,
  title: data.subject || '',
  description: data.body || '',
  category: 'geral'
});

// Tipos para indicações compatíveis
export type CompatIndication = {
  id: string;
  referrer_id: string;
  referred_id: string;
  referred_email: string;
  referred_phone: string;
  status: string;
  reward_amount: number;
  reward_claimed: boolean;
  created_at: string;
  updated_at: string;
  // Campos de compatibilidade
  id_indicador: string;
  id_indicado: string;
  mes_recompensa?: number;
  data_criacao: string;
  valor_desconto?: number;
  valor_original?: number;
  codigo_indicacao: string;
  desconto_aplicado: number;
  data_confirmacao?: string;
  indicador?: any;
  indicado?: any;
};

export const compatIndication = (data: any): CompatIndication => ({
  ...data,
  id_indicador: data.referrer_id || '',
  id_indicado: data.referred_id || '',
  data_criacao: data.created_at || '',
  mes_recompensa: data.created_at ? parseInt(new Date(data.created_at).toISOString().substring(0, 7).replace('-', '')) : undefined,
  valor_desconto: data.reward_amount || 0,
  valor_original: data.reward_amount || 0,
  codigo_indicacao: data.id || `IND-${data.id?.slice(0, 8)}`,
  desconto_aplicado: data.reward_amount || 0,
  data_confirmacao: data.updated_at
});

// Helper para property submissions compatíveis
export type CompatPropertySubmission = {
  id: string;
  broker_id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  property_data: any;
  status: string;
  created_at: string;
  updated_at: string;
  // Campos adicionais necessários
  submission_token: string;
  owner_name: string;
  owner_email: string;
  owner_phone: string;
};

export const compatPropertySubmission = (data: any): CompatPropertySubmission => ({
  ...data,
  submission_token: data.id || '',
  owner_name: data.name || '',
  owner_email: data.email || '',
  owner_phone: data.phone || ''
});

// Chat message compatível
export type CompatChatMessage = {
  id: string;
  thread_id: string;
  sender_id: string;
  body: string;
  attachments: any[];
  created_at: string;
  updated_at: string;
  reply_to_id?: string;
  sender_name?: string;
  sender_avatar?: string;
  edited_at: string; // Campo obrigatório
};

export const compatChatMessage = (data: any): CompatChatMessage => ({
  ...data,
  edited_at: data.edited_at || data.updated_at || data.created_at,
  attachments: data.attachments || []
});