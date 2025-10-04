-- Atualizar visibilidade dos imóveis CNM já importados
UPDATE imoveis 
SET 
  is_public = true,
  visibility = 'partners',
  show_on_site = true,
  show_on_marketplace = true,
  show_on_minisite = true
WHERE source = 'cnm' 
  AND visibility = 'private';