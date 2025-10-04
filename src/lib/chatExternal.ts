/**
 * Helper para integração com chat externo ConectaIOS
 * URL base: https://chat.conectaios.com.br/auth/callback
 */

export type PropertyLite = {
  id: string;
  slug?: string;
  title?: string;
  code?: string;
  addressLine?: string;
  city?: string;
  state?: string;
};

export interface ChatUrlOptions {
  property?: PropertyLite;
  corretorId?: string;
  originBaseUrl?: string;
}

/**
 * Constrói a URL do chat externo com autenticação e parâmetros opcionais
 * @param accessToken - Token de acesso do usuário (session.access_token)
 * @param refreshToken - Token de refresh do usuário (session.refresh_token)
 * @param opts - Opções adicionais (imóvel, corretor, origem)
 * @returns URL completa para abrir o chat externo
 */
export function buildChatUrl(
  accessToken: string,
  refreshToken: string,
  opts?: ChatUrlOptions
): string {
  const base = "https://chat.conectaios.com.br/auth/callback";
  const params = new URLSearchParams({
    token: accessToken,
    refresh: refreshToken,
  });

  // Adicionar ID do corretor se fornecido
  if (opts?.corretorId) {
    params.set("corretorId", opts.corretorId);
  }

  // Se houver dados do imóvel, criar mensagem pré-preenchida
  if (opts?.property) {
    const p = opts.property;
    const originBase = opts.originBaseUrl ?? "";
    const linkImovel = `${originBase}/imovel/${p.slug ?? p.id}`;
    const codigo = p.code ?? p.id.slice(0, 8);
    const titulo = p.title ?? `Imóvel ${codigo}`;
    const local = [p.addressLine, p.city, p.state].filter(Boolean).join(" - ");
    
    const msg = `Olá! Tenho interesse no imóvel:

📍 ${titulo}
🏷️ Código: ${codigo}
📌 Link: ${linkImovel}
${local ? `📍 Localização: ${local}` : ''}

Pode me passar mais informações?`.trim();

    params.set("propertyId", p.id);
    params.set("propertyCode", codigo);
    params.set("message", msg);
  }

  return `${base}?${params.toString()}`;
}
