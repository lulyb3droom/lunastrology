# Tarefas — Lunastrology

Regras: uma fase por vez. Ao fim de cada fase → testes, commit, deploy de preview na Vercel, link + o que testar, **pausa para aprovação**.
Cada tarefa tem critério de "pronto" (✔).

## Fase 0 — Fundação
- **T0.1** Criar app Next.js + TypeScript estrito em `D:\lunastrology` (preservando `specs/`, `PROMPT.md`). ✔ `npm run dev` abre a página inicial.
- **T0.2** Git: `git init`, `.gitignore` (inclui `.env*`, `tmp-tarot-staging`), primeiro commit. ✔ histórico limpo, sem segredos.
- **T0.3** Tailwind + tokens da paleta + utilitários `glass`, `glass-strong`, `glass-subtle` + `StarField` + nebulosas + fallbacks de acessibilidade. ✔ página de demonstração `/estilo` com contraste conferido.
- **T0.4** Layout base (header de vidro, rodapé, aviso de entretenimento), fonte, `lang="pt-BR"`. ✔ mobile 375px sem rolagem horizontal.
- **T0.5** Vitest configurado + 1 teste de exemplo. ✔ `npm test` passa.
- **T0.6** `.env.example` e `README.md` iniciais. ✔
- **T0.7** *(você)* Criar repositório no GitHub e conectar (passo a passo meu); *(você)* `vercel login`, importar o projeto, criar banco Neon pela Vercel. ✔ preview publicado.
- **T0.8** Drizzle + conexão Neon + primeira migração (tabelas base). ✔ `/api/saude` responde "ok" lendo o banco.

## Fase 1 — Núcleo astronômico (`lib/astro/`, sem interface)
- **T1.1** Tipos, `config.ts` (orbes, sistemas, regências) e interface `EphemerisProvider`. ✔ compila.
- **T1.2** `scripts/gerar-gabarito.py` (Swiss Ephemeris, só dev) + `mapas-referencia.json` com ≥12 mapas:
  BR com verão: São Paulo jan/1986, Rio dez/1990, Porto Alegre nov/2008, Goiânia out/1993 · BR sem verão: Recife 1995, Manaus 1982, Brasília jul/2019 · Mundo: Nova York 1969, Sydney 1977, Londres 2001, Tóquio 1955 · Extremos: Reykjavik (lat. alta) e um mapa sem hora. ✔ arquivo gerado e versionado.
- **T1.3** Conversão local→UTC com testes BR. ✔ todos os casos batem com o esperado.
- **T1.4** Posições aparentes de Sol a Plutão + retrogradação. ✔ ≤ 1' do gabarito nos 12 mapas.
- **T1.5** Nodo médio, Lilith média. ✔ ≤ 1' do gabarito.
- **T1.6** Tempo sideral, MC e Ascendente. ✔ ≤ 5'.
- **T1.7** Casas Placidus, Koch, Iguais, Inteiras + fallback polar. ✔ cúspides ≤ 5'; Reykjavik cai para Inteiras com aviso.
- **T1.8** Signo/grau/minuto, planeta→casa, Parte da Fortuna. ✔
- **T1.9** Aspectos (aplicativo/separativo). ✔ conjunto de aspectos idêntico ao gabarito.
- **T1.10** Resumos (elementos, modalidades, regente, Big Three) + modo "sem hora". ✔ sem ASC/MC/casas e com aviso.
- **T1.11** *(você)* Conferir 2–3 mapas no Astro.com. ✔ aprovado por você.

## Fase 2 — Mapa na interface
- **T2.1** Geocodificação + cache + autocomplete + fuso. ✔ "Goiânia, GO" retorna coordenadas e fuso.
- **T2.2** Formulário de nascimento (com "não sei a hora", escolha do sistema de casas). ✔ validações em português.
- **T2.3** `ChartWheel` em SVG (signos, casas, glifos, aspectos com legenda além da cor, seleção em `neon-nebula`). ✔ correta em 375px e desktop.
- **T2.4** Tabelas de planetas, casas e aspectos; cartões de Big Three e resumos. ✔
- **T2.5** Salvar mapa no banco (visitante: UUID; limpeza em 30 dias). ✔ recarregar a URL mostra o mesmo mapa.

## Fase 3 — Tarot (sem IA ainda)
- **T3.1** `data/tarot/cartas.ts`: 78 cartas com significado direito/invertido em PT-BR. ✔ 78 itens validados por teste.
- **T3.2** Imagens: mover de `tmp-tarot-staging/` para `public/tarot/`, nomes padronizados, conferir carta a carta, `CREDITOS.md`. ✔ 78 imagens corretas.
- **T3.3** Sorteio no servidor (`crypto`, Fisher–Yates, invertida configurável) + tiragens. ✔ testes de distribuição e de unicidade.
- **T3.4** Telas: escolha da tiragem → pergunta → animação de embaralhar/virar → cartas. ✔ sem blur durante a animação; respeita `prefers-reduced-motion`.
- **T3.5** Carta do dia na Home. ✔

## Fase 4 — IA (OpenRouter)
- **T4.1** Cliente OpenRouter (streaming, cabeçalhos, `max_tokens`, timeout, reserva). ✔ simulado em teste; erro de crédito/modelo vira mensagem amigável.
- **T4.2** Prompts versionados (`tarologo.v1.md`, `mapa.v1.md`) com regras da constituição. ✔ revisados por você.
- **T4.3** Pré-filtro de risco de vida + resposta com CVV 188. ✔ testes com frases de exemplo.
- **T4.4** Rate limit em Postgres + registro em `ai_usage`. ✔ 4ª tiragem do visitante no dia é bloqueada.
- **T4.5** Interpretação do tarot em streaming na tela. ✔ começa em ~3 s.
- **T4.6** Interpretação do mapa (uma vez, salva). ✔ segunda visita não chama a IA.
- **T4.7** Comparar `nemotron-3-ultra-550b-a55b:free` (principal) x `gemma-4-31b-it:free` (reserva) em 5 casos, medindo tempo até o primeiro texto e respeito às regras de segurança, e confirmar a escolha. ✔ decisão sua.

## Fase 5 — Contas e LGPD
- **T5.1** *(você)* Criar credenciais Google OAuth (passo a passo meu). ✔
- **T5.2** Login Google (next-auth 4.24.15) + sessão. ✔
- **T5.3** Mapas salvos (próprio e de outras pessoas) e histórico de tiragens. ✔
- **T5.4** `/conta/dados`: exportar (JSON) e apagar tudo. ✔ após apagar, nada resta no banco.
- **T5.5** Contexto opcional do Big Three nas tiragens. ✔

## Fase 6 — Conteúdo, SEO, admin
- **T6.1** Textos educativos em `data/`: 12 signos, 10 planetas, 12 casas, aspectos, 78 cartas. ✔ você revisa depois.
- **T6.2** Páginas `/aprender/...`, metadados, `sitemap.xml`, `robots.txt`. ✔
- **T6.3** OG dinâmica do Big Three. ✔
- **T6.4** `/admin` (uso e custo da IA, erros) protegida por `ADMIN_EMAIL`. ✔ outro usuário recebe 404.
- **T6.5** Privacidade, Termos, aviso de entretenimento. ✔

## Fase 7 — Fechamento
- **T7.1** Teste ponta a ponta (calcular mapa → ver resultado; e uma tiragem). ✔
- **T7.2** Revisão de acessibilidade (teclado, contraste, alt) e desempenho no celular. ✔
- **T7.3** Auditoria de segredos (nenhuma chave no código/cliente/commits). ✔
- **T7.4** README completo (rodar, deploy, manutenção). ✔
- **T7.5** Deploy de produção (só com sua aprovação). ✔ critérios da seção 8 do spec marcados.
