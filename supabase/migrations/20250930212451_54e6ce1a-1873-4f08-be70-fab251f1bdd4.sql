-- Adicionar coluna show_on_site para controlar visibilidade no site quando visibility='partners'
ALTER TABLE public.imoveis 
ADD COLUMN IF NOT EXISTS show_on_site boolean NOT NULL DEFAULT false;

-- Migrar dados existentes: se visibility='public_site', marcar show_on_site=true
UPDATE public.imoveis 
SET show_on_site = true 
WHERE visibility = 'public_site';

-- Atualizar propriedades que eram 'public_site' para 'partners' mantendo show_on_site=true
-- Isso permite que elas apareçam no site (show_on_site=true) mas não no marketplace (visibility não é partners originalmente)
-- Na verdade, vamos manter a lógica: public_site = só site, partners = marketplace
-- Deixar os dados como estão por enquanto, a aplicação vai gerenciar