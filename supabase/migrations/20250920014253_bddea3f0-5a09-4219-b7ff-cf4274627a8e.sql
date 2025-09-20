-- Clean up ALL existing gamification rules and recreate with consistent keys
DELETE FROM public.gam_points_rules;

-- Insert all 11 gamification rules with consistent keys matching frontend icons
INSERT INTO public.gam_points_rules (key, label, descricao, pontos, ativo) VALUES
-- High value actions
('imovel_vendido', 'Negócio fechado', 'Anúncio vendido ou alugado com sucesso', 25, true),
('indicacao', 'Indicação confirmada', 'Indicou um novo corretor que se cadastrou na plataforma', 20, true),
('imovel_qualidade', 'Anúncio de qualidade', 'Anúncio com 90%+ de qualidade (fotos, descrição completa, localização)', 15, true),

-- Match responses (time-based)
('match_1h', 'Resposta rápida (<1h)', 'Respondeu a um match em menos de 1 hora', 10, true),
('imovel_8_fotos', 'Anúncio completo', 'Anúncio com 8 ou mais fotos de qualidade', 5, true),
('match_12h', 'Resposta em 12h', 'Respondeu a um match em menos de 12 horas', 5, true),

-- Profile and engagement
('perfil_completo', 'Cadastro Completo', 'Complete 100% do seu perfil com nome, bio, avatar, CRECI e telefone', 5, true),
('social_share', 'Compartilhamento', 'Compartilhou anúncio nas redes sociais', 3, true),
('match_24h', 'Resposta em 24h', 'Respondeu a um match em menos de 24 horas', 2, true),

-- Social interactions  
('social_like', 'Curtida social', 'Recebeu curtida em post ou anúncio nas redes sociais', 1, true),
('social_comment', 'Comentário social', 'Recebeu comentário positivo em post ou anúncio', 1, true);