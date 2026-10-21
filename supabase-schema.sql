-- Esquema do ranking público do Simulador de Campanha — Bansh.
-- Rode isto inteiro no SQL Editor do seu projeto Supabase (supabase.com),
-- uma vez, antes de colocar as chaves no .env do jogo e do dashboard.

create extension if not exists pgcrypto;

create table if not exists resultados (
  id uuid primary key,
  nome text not null,
  candidato_id text not null,
  candidato_nome text not null,
  votos_finais numeric not null,
  nota_governabilidade numeric not null,
  score numeric not null,
  venceu boolean not null,
  seed bigint not null,
  criado_em timestamptz not null default now()
);

create table if not exists comentarios (
  id uuid primary key default gen_random_uuid(),
  jogo_id uuid not null,
  nome text not null,
  candidato_id text not null,
  fase text not null,
  fase_nome text not null,
  texto text not null,
  criado_em timestamptz not null default now()
);

-- Decisões de verdade dentro do jogo (verba, dilema, tom) — alimenta os
-- gráficos de "principais escolhas" do dashboard. `detalhe` varia por `tipo`:
--   verba: { tv, digital, comicios, pesquisas, juridica }  (R$ mi por canal)
--   dilema: { dilemaId, dilemaTitulo, opcaoId, opcaoTexto, conselheiroSeguidoId, porOmissao }
--   tom: { tom }
create table if not exists decisoes (
  id uuid primary key default gen_random_uuid(),
  jogo_id uuid not null,
  nome text not null,
  candidato_id text not null,
  fase text not null,
  fase_nome text not null,
  tipo text not null check (tipo in ('verba', 'dilema', 'tom')),
  detalhe jsonb not null,
  criado_em timestamptz not null default now()
);

create index if not exists resultados_score_idx on resultados (score desc);
create index if not exists comentarios_criado_em_idx on comentarios (criado_em desc);
create index if not exists comentarios_jogo_id_idx on comentarios (jogo_id);
create index if not exists decisoes_tipo_idx on decisoes (tipo);
create index if not exists decisoes_jogo_id_idx on decisoes (jogo_id);

-- RLS: qualquer pessoa (mesmo sem login) pode ler e inserir, ninguém pode
-- alterar ou apagar depois de criado — é um livro de registro público, não um
-- banco administrável por quem joga.
alter table resultados enable row level security;
alter table comentarios enable row level security;
alter table decisoes enable row level security;

create policy "qualquer um lê resultados" on resultados for select using (true);
create policy "qualquer um insere resultado" on resultados for insert with check (true);
create policy "qualquer um atualiza o próprio resultado (upsert)" on resultados for update using (true);

create policy "qualquer um lê comentários" on comentarios for select using (true);
create policy "qualquer um insere comentário" on comentarios for insert with check (true);

create policy "qualquer um lê decisões" on decisoes for select using (true);
create policy "qualquer um insere decisão" on decisoes for insert with check (true);

-- Habilita o Realtime (necessário para o dashboard atualizar sozinho) —
-- no painel do Supabase: Database > Replication > marque "resultados",
-- "comentarios" e "decisoes" na publicação supabase_realtime. Ou rode:
alter publication supabase_realtime add table resultados;
alter publication supabase_realtime add table comentarios;
alter publication supabase_realtime add table decisoes;
