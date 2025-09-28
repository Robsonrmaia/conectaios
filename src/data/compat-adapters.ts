import type { PropertyCompat, PropertyImageCompat, BrokerCompat, ProfileCompat, ClientCompat, DealCompat, ChatMessageCompat, IndicationCompat, UserCompat } from '@/types/compat';

// Converte linhas da view `properties` para PropertyCompat
export function asPropertyCompat<T = any>(row: T): PropertyCompat {
  const r = row as any;
  return {
    id: String(r.id || ''),
    title: String(r.title ?? r.titulo ?? ''),
    description: r.description ?? r.descricao ?? null,
    city: r.city ?? r.cidade ?? null,
    neighborhood: r.neighborhood ?? r.bairro ?? null,
    price: r.price ?? r.valor ?? null,
    purpose: r.purpose ?? null,
    is_public: r.is_public ?? null,
    visibility: r.visibility ?? null,
    created_at: r.created_at ?? undefined,
    owner_id: r.owner_id ?? undefined,
    thumb_url: r.thumb_url ?? null,
    // Campos legados
    titulo: r.titulo ?? r.title ?? null,
    valor: r.valor ?? r.price ?? null,
    descricao: r.descricao ?? r.description ?? null,
    cidade: r.cidade ?? r.city ?? null,
    bairro: r.bairro ?? r.neighborhood ?? null,
    // Campos adicionais
    bathrooms: r.bathrooms ?? null,
    parking_spots: r.parking_spots ?? r.parking ?? null,
    parking: r.parking ?? r.parking_spots ?? null,
    raw_cnm: r.raw_cnm ?? null,
    raw_vrsync: r.raw_vrsync ?? null,
    listing_type: r.listing_type ?? null,
    property_type: r.property_type ?? null,
    fotos: r.fotos ?? null,
    area: r.area ?? r.area_total ?? null,
    quartos: r.quartos ?? r.bedrooms ?? null,
    condominium_fee: r.condominium_fee ?? r.condo_fee ?? null,
    iptu: r.iptu ?? null,
    zipcode: r.zipcode ?? null,
    distancia_mar: r.distancia_mar ?? r.sea_distance ?? null,
    has_sea_view: r.has_sea_view ?? r.vista_mar ?? null,
    banner_type: r.banner_type ?? null,
    furnishing_type: r.furnishing_type ?? null,
    videos: r.videos ?? null,
    sea_distance: r.sea_distance ?? r.distancia_mar ?? null,
  };
}

// Converte imagem tanto da view `property_images` quanto da tabela nativa
export function asPropertyImageCompat<T = any>(row: T): PropertyImageCompat {
  const r = row as any;
  return {
    id: String(r.id || ''),
    property_id: r.property_id ?? r.imovel_id ?? undefined,
    imovel_id: r.imovel_id ?? r.property_id ?? undefined,
    url: String(r.url ?? ''),
    storage_path: r.storage_path ?? null,
    is_cover: r.is_cover ?? null,
    created_at: r.created_at ?? undefined,
    updated_at: r.updated_at ?? undefined,
  };
}

export function asBrokerCompat<T = any>(row: T): BrokerCompat {
  const r = row as any;
  return {
    id: String(r.id || ''),
    user_id: r.user_id ?? undefined,
    name: r.name ?? null,
    email: r.email ?? null,
    phone: r.phone ?? null,
    creci: r.creci ?? null,
    avatar_url: r.avatar_url ?? null,
    cover_url: r.cover_url ?? null,
    bio: r.bio ?? null,
    status: r.status ?? null,
    subscription_status: r.subscription_status ?? null,
    subscription_expires_at: r.subscription_expires_at ?? null,
    referral_code: r.referral_code ?? null,
    cpf_cnpj: r.cpf_cnpj ?? null,
    plan_id: r.plan_id ?? null,
    region_id: r.region_id ?? null,
    created_at: r.created_at ?? undefined,
    updated_at: r.updated_at ?? undefined,
  };
}

export function asProfileCompat<T = any>(row: T): ProfileCompat {
  const r = row as any;
  return {
    id: String(r.id || ''),
    user_id: r.user_id ?? r.id ?? undefined, // user_id = id para compatibilidade
    email: r.email ?? null,
    name: r.name ?? r.nome ?? r.full_name ?? null,
    full_name: r.full_name ?? r.name ?? r.nome ?? null,
    nome: r.nome ?? r.name ?? r.full_name ?? null,
    avatar_url: r.avatar_url ?? null,
    bio: r.bio ?? null,
    cover_url: r.cover_url ?? null,
    phone: r.phone ?? null,
    role: r.role ?? null,
    created_at: r.created_at ?? undefined,
    updated_at: r.updated_at ?? undefined,
  };
}

export function asUserCompat<T = any>(row: T): UserCompat {
  const r = row as any;
  return {
    id: String(r.id || ''),
    user_id: r.user_id ?? r.id ?? undefined, // user_id = id para compatibilidade
    email: r.email ?? null,
    name: r.name ?? r.nome ?? r.full_name ?? null,
    full_name: r.full_name ?? r.name ?? r.nome ?? null,
    nome: r.nome ?? r.name ?? r.full_name ?? null,
    avatar_url: r.avatar_url ?? null,
    bio: r.bio ?? null,
    cover_url: r.cover_url ?? null,
    phone: r.phone ?? null,
    role: r.role ?? null,
    created_at: r.created_at ?? undefined,
    updated_at: r.updated_at ?? undefined,
  };
}

export function asClientCompat<T = any>(row: T): ClientCompat {
  const r = row as any;
  return {
    id: String(r.id || ''),
    broker_id: r.broker_id ?? null,
    user_id: r.user_id ?? null,
    nome: r.nome ?? r.name ?? null,
    name: r.name ?? r.nome ?? null,
    email: r.email ?? null,
    telefone: r.telefone ?? r.phone ?? null,
    phone: r.phone ?? r.telefone ?? null,
    tipo: r.tipo ?? null,
    stage: r.stage ?? null,
    valor: r.valor ?? null,
    score: r.score ?? null,
    historico: r.historico ?? null,
    classificacao: r.classificacao ?? r.stage ?? null,
    created_at: r.created_at ?? undefined,
    updated_at: r.updated_at ?? undefined,
  };
}

export function asDealCompat<T = any>(row: T): DealCompat {
  const r = row as any;
  return {
    id: String(r.id || ''),
    client_id: r.client_id ?? null,
    property_id: r.property_id ?? null,
    user_id: r.user_id ?? null,
    status: r.status ?? null,
    offer_amount: r.offer_amount ?? null,
    commission_amount: r.commission_amount ?? null,
    notes: r.notes ?? null,
    created_at: r.created_at ?? undefined,
    updated_at: r.updated_at ?? undefined,
  };
}

export function asChatMessageCompat<T = any>(row: T): ChatMessageCompat {
  const r = row as any;
  return {
    id: String(r.id || ''),
    thread_id: String(r.thread_id || ''),
    sender_id: String(r.sender_id || ''),
    body: String(r.body ?? ''),
    attachments: Array.isArray(r.attachments) ? r.attachments : [],
    created_at: String(r.created_at || ''),
    updated_at: String(r.updated_at || r.created_at || ''),
    reply_to_id: r.reply_to_id ?? null,
    sender_name: r.sender_name ?? null,
    sender_avatar: r.sender_avatar ?? null,
    edited_at: r.edited_at ?? r.updated_at ?? r.created_at ?? null, // Campo obrigatório
  };
}

export function asIndicationCompat<T = any>(row: T): IndicationCompat {
  const r = row as any;
  return {
    id: String(r.id || ''),
    referrer_id: r.referrer_id ?? null,
    referred_id: r.referred_id ?? null,
    referred_email: r.referred_email ?? null,
    referred_phone: r.referred_phone ?? null,
    status: r.status ?? null,
    reward_amount: r.reward_amount ?? null,
    reward_claimed: r.reward_claimed ?? null,
    created_at: r.created_at ?? undefined,
    updated_at: r.updated_at ?? undefined,
    // Campos de compatibilidade legados
    id_indicador: r.id_indicador ?? r.referrer_id ?? null,
    id_indicado: r.id_indicado ?? r.referred_id ?? null,
    mes_recompensa: r.mes_recompensa ?? (r.created_at ? new Date(r.created_at).toISOString().substring(0, 7) : null) ?? null,
    data_criacao: r.data_criacao ?? r.created_at ?? null,
    valor_desconto: r.valor_desconto ?? r.reward_amount ?? null,
    valor_original: r.valor_original ?? r.reward_amount ?? null,
  };
}

// Função global para compatibilidade
if (typeof globalThis !== 'undefined') {
  (globalThis as any).compatIndication = asIndicationCompat;
}

// Type guard functions
export function isPropertyCompat(obj: any): obj is PropertyCompat {
  return obj && typeof obj.id === 'string';
}

export function isChatMessageCompat(obj: any): obj is ChatMessageCompat {
  return obj && typeof obj.id === 'string' && typeof obj.thread_id === 'string';
}

// Array mappers
export function asPropertyCompatArray<T = any>(rows: T[]): PropertyCompat[] {
  if (!Array.isArray(rows)) return [];
  return rows.map(asPropertyCompat);
}

export function asChatMessageCompatArray<T = any>(rows: T[]): ChatMessageCompat[] {
  if (!Array.isArray(rows)) return [];
  return rows.map(asChatMessageCompat);
}

export function asUserCompatArray<T = any>(rows: T[]): UserCompat[] {
  if (!Array.isArray(rows)) return [];
  return rows.map(asUserCompat);
}

export function asIndicationCompatArray<T = any>(rows: T[]): IndicationCompat[] {
  if (!Array.isArray(rows)) return [];
  return rows.map(asIndicationCompat);
}