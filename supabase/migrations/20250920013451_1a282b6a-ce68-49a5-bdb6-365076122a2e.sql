-- Add the missing "perfil_completo" rule to complete all 11 gamification criteria
INSERT INTO public.gam_points_rules (key, label, descricao, pontos, ativo)
VALUES (
  'perfil_completo',
  'Cadastro Completo',
  'Complete 100% do seu perfil com nome, bio, avatar, CRECI e telefone',
  5,
  true
);