/**
 * Helper para integração com chat externo ConectaIOS via PostMessage Bridge
 * URL base: https://chat.conectaios.com.br/bridge
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
  originBaseUrl?: string;
  baseUrl?: string; // opcional, para testes
}

/**
 * Constrói a URL do bridge (SEM tokens - segurança via postMessage)
 * @param opts - Opções de contexto (imóvel, origem)
 * @returns URL do bridge com params de contexto
 */
export function buildChatUrl(opts?: ChatUrlOptions): string {
  const base = (opts?.baseUrl || "https://preview--chatconectaios.lovable.app/bridge").replace(/\/+$/, "");
  const params = new URLSearchParams();

  if (opts?.originBaseUrl) {
    params.set("origin", opts.originBaseUrl);
  }

  // Se houver dados do imóvel, adicionar à query
  if (opts?.property) {
    const p = opts.property;
    const titulo = p.title || `Imóvel ${p.code || p.id}`;
    const codigo = p.code || p.slug || p.id.slice(0, 8);
    const linkImovel = opts.originBaseUrl ? `${opts.originBaseUrl}/imovel/${p.slug || p.id}` : "";
    const local = [p.addressLine, p.city, p.state].filter(Boolean).join(" - ");
    
    const msg = `Olá! Tenho interesse neste imóvel:\n\n📍 ${titulo}\n🏷️ Código: ${codigo}\n📌 Link: ${linkImovel}\n${local ? `📍 Localização: ${local}` : ''}\n\nPode me passar mais informações?`;

    params.set("propertyId", p.id);
    params.set("propertyCode", codigo);
    params.set("message", encodeURIComponent(msg));
  }

  // ZERO tokens na URL - segurança via postMessage!
  return `${base}${params.toString() ? `?${params.toString()}` : ''}`;
}
