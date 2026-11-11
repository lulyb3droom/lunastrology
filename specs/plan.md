# Plano técnico — Lunastrology

> O **COMO**. Deriva de `specs/spec.md` (aprovado). Versões conferidas no npm em 11/11/2026; nenhuma publicada há menos de 14 dias será usada (ex.: `next@16.4.6` e `tailwindcss@4.3.5` saíram há ~1 dia → **fixar a versão anterior estável** na hora de instalar).

## 1. Decisões e justificativas (em linguagem simples)

### 1.1 Biblioteca de efemérides: `astronomy-engine` 2.1.19 (MIT)
- **O que é:** biblioteca que calcula onde cada planeta está no céu, com precisão de segundos de arco.
- **Por que ela:** licença MIT (sem obrigações), roda em qualquer lugar (inclusive Vercel), sem arquivo nativo. A versão é de 2023, mas é estável e madura.
- **Swiss Ephemeris** é o padrão profissional, mas é AGPL (obriga abrir o código para quem usa o site) e pode dar dor de cabeça na Vercel. **Será usado só como "gabarito" nos testes** (ferramenta de desenvolvimento, não vai para o site).
- **O que ela não faz e eu implemento em `lib/astro/`:** conversão para eclíptica *de data* aparente (precessão + nutação + aberração), Nodo médio, Lilith média, Ascendente, MC, casas, aspectos.
- **Risco:** a precisão dos planetas depende de converter certo as coordenadas. Mitigação: testes contra o gabarito desde a Fase 1.
- **Trocar depois:** tudo fica atrás de uma interface (`EphemerisProvider`) em `lib/astro/ephemeris/`.

### 1.2 Fuso horário histórico
- `tz-lookup` (coordenadas → nome do fuso IANA) + `luxon` (converte hora local → UTC com as regras históricas do banco IANA do Node).
- ⚠️ O banco IANA embutido no Node pode ter lacunas em datas antigas do Brasil. Mitigação: testes específicos com casos de verão por estado e ano; se falhar, adicionar tabela de correções própria.
- Hora ambígua/inexistente (virada de horário de verão): o app avisa e pede escolha.

### 1.3 Geocodificação
- Nominatim (OSM), 1 requisição/s, `User-Agent` identificado, cache em `geocode_cache`. Chamado só do servidor, com debounce no autocomplete (mín. 3 letras).
- Risco: política do Nominatim contra autocomplete pesado. Mitigação: busca só ao clicar/pausar a digitação (≥600 ms) e cache; se incomodar, trocar por Photon (mesmo OSM) via variável de ambiente.

### 1.3b Login (mudança proposta ao spec — **precisa do seu OK**)
- O link mágico exige enviar e-mail. Sem domínio próprio, o Resend só entrega para o seu e-mail; e e-mails enviados "em nome de um Gmail" caem em spam.
- **Proposta:** MVP com **login Google** (grátis, confiável, sem e-mail) via `next-auth@4.24.15` (estável; a v5 ainda é beta). Link mágico fica para quando houver domínio próprio.
- Se preferir manter o link mágico no MVP: Brevo SMTP gratuito com remetente verificado; aviso de que pode cair no spam.

### 1.4 IA: OpenRouter, chamada direta (sem SDK)
- `fetch` ao endpoint `/chat/completions` com `stream: true`; o servidor repassa o fluxo ao navegador.
- Modelo principal: `nvidia/nemotron-3-ultra-550b-a55b:free` (verificado na API: existe, gratuito, 1M de contexto; 550B no total, 55B ativos por resposta). É um modelo de *raciocínio*: pode "pensar" antes de responder, o que atrasa o início do texto e gasta tokens. Mitigação: `reasoning_effort` baixo, `max_tokens` com folga e ignorar o texto de raciocínio no streaming. Se o início passar de ~3 s, testar `reasoning` desligado.
- Modelo reserva: `google/gemma-4-31b-it:free` (existe, 31B, não é de raciocínio, então tende a começar mais rápido).
- `liquid/lfm-3-1.7b:free` (1,7B) ficou **descartado como principal** por ser muito pequeno; só seria usado se os outros falharem.
- Os modelos podem ser trocados na variável `OPENROUTER_MODEL`, sem mexer no código; a comparação final é a tarefa T4.7.
- Modelos gratuitos têm limite de uso por dia/minuto na OpenRouter; por isso o reserva, o rate limit próprio e mensagem amigável.
- Cabeçalhos `HTTP-Referer` e `X-Title`; `max_tokens` fixo; custo/tokens registrados em `ai_usage` (gratuito = custo 0, mas os tokens ficam registrados).

### 1.5 Segurança do tarot
- A pergunta vai dentro de um bloco de dados delimitado; o *system prompt* diz que é conteúdo e nunca instrução.
- Pré-filtro **determinístico** (lista de expressões em PT-BR sobre risco de vida) antes de sortear/gastar IA → resposta acolhedora + CVV 188. Limitação documentada: não pega todos os casos.
- O prompt do tarólogo fica em `lib/ai/prompts/tarologo.v1.md` (versionado) e o do mapa em `mapa.v1.md`.

### 1.6 Rate limit
- Tabela `rate_limits` no Postgres com contador atômico por (chave, dia). Chave = hash do IP (visitante) ou id do usuário. Evita serviço extra. Limites: 3/dia visitante, 10/dia logado (configuráveis por env).

### 1.7 Demais escolhas
| Área | Escolha |
|---|---|
| Framework | Next.js (App Router) + TypeScript estrito |
| Estilo | Tailwind CSS 4, tokens de cor em `@theme`, utilitários `glass*` |
| Banco | Neon Postgres + Drizzle ORM + `drizzle-kit` (migrações versionadas); branch Neon separado para preview e produção |
| Testes | Vitest (unitários), Playwright (1 teste ponta a ponta) |
| Imagens do tarot | Hospedadas no projeto (`public/tarot/`), RWS 1909 da Wikimedia Commons ("Roses & Lilies"), domínio público; arquivo `CREDITOS.md` |
| Roda do mapa | SVG gerado por componente React (sem biblioteca de gráficos) |
| OG image | `next/og` (`ImageResponse`) |
| Admin | Rota `/admin` liberada só se o e-mail do login = `ADMIN_EMAIL` |
| Logs | `console.error` estruturado (aparece nos logs da Vercel) + tabela `error_log` simples |

## 2. Estrutura de pastas

```
app/                  # páginas e rotas (App Router)
  (site)/ mapa, tarot, conta, aprender, legal...
  api/ geocode, mapa, tarot, ia, conta, admin
components/           # UI: Glass, StarField, ChartWheel, TarotCard...
lib/
  astro/              # núcleo astronômico (isolado, sem dependência de web/banco)
    ephemeris/ time/ houses/ aspects/ points/ summary/ config.ts
  tarot/              # baralho (dados), sorteio, tiragens
  ai/                 # cliente OpenRouter, prompts versionados, segurança
  db/                 # schema Drizzle, migrações, queries
  geo/                # geocodificação + fuso
  rate-limit/ auth/ privacy/
data/                 # signos, planetas, casas, aspectos, 78 cartas (PT-BR)
tests/                # unit, fixtures/mapas-referencia, e2e
scripts/              # gerar-gabarito.py (Swiss Ephemeris, só dev), baixar imagens
specs/                # spec.md, plan.md, tasks.md
```

## 3. Núcleo astronômico (`lib/astro/`)

Pipeline (cada etapa é função pura e testada):
1. `resolveInstant(localDate, localTime, tz)` → UTC.
2. Dia Juliano + ΔT (via astronomy-engine).
3. Posições aparentes: vetor geocêntrico com aberração → equatorial *de data* → eclíptica com obliquidade verdadeira (nutação incluída). Retrogradação: diferença de longitude em ±1 hora.
4. Pontos: Nodo médio e Lilith média (fórmulas de Meeus), Nodo Sul = +180°, Parte da Fortuna (diurno/noturno pela posição do Sol vs. horizonte).
5. Tempo sideral → RAMC → MC e Ascendente (obliquidade verdadeira).
6. Casas: Placidus (iteração), Koch, Iguais, Inteiras. Latitude |φ| > ~66°: fallback automático para Inteiras + aviso.
7. Planeta → casa; signo/grau/minuto.
8. Aspectos com orbes de `config.ts` (único arquivo); aplicativo/separativo pela velocidade relativa.
9. Resumos: elementos, modalidades, regente do mapa (regência tradicional + moderna documentada), Big Three.
10. Sem hora: 12:00 local, omite ASC/MC/casas e Parte da Fortuna, retorna aviso da Lua (±6°).

Saída: objeto `ChartResult` tipado + `calcVersion` (salvo no banco para recalcular se o algoritmo mudar). Zodíaco tropical, com parâmetro `zodiac` reservado para o sideral no futuro.

### Validação
- `scripts/gerar-gabarito.py` usa `pyswisseph` (Python 3.14 instalado; instalar só como ferramenta de dev, AGPL não toca o site) para gerar `tests/fixtures/mapas-referencia.json` com ≥12 mapas fictícios (lista em `tasks.md`).
- Testes exigem planetas ≤ 1' e ASC/MC ≤ 5' (Placidus). Você confere 2–3 mapas no Astro.com como validação independente.
- Testes de fuso: casos BR com/sem verão (SP 1986, RJ 1990, POA 2008, GYN 1993, REC 1995, MAO 1982, BSB 2019).

## 4. Esquema do banco (Drizzle)

- `users` (id, email, name, image, created_at) + tabelas padrão do adaptador de login (`accounts`, `sessions`).
- `birth_charts` (id, user_id null, label, birth_local_date, birth_local_time, time_unknown, place_name, lat, lon, tz, utc_instant, house_system, result jsonb, calc_version, interpretation text, interpretation_model, share_token null, created_at).
- `tarot_readings` (id, user_id null, spread, question, cards jsonb, interpretation, model, tokens_in, tokens_out, cost_usd, created_at).
- `geocode_cache` (query_norm PK, lat, lon, tz, display_name, created_at).
- `ai_usage` (id, kind, model, tokens_in, tokens_out, cost_usd, status, created_at).
- `rate_limits` (key, day, count; PK key+day).
- `error_log` (id, where, message, meta jsonb, created_at).
- Mapas de visitantes sem login: guardados no navegador (localStorage) e, se ele pedir interpretação, no banco com `user_id` nulo e id não adivinhável (UUID); apagados após 30 dias (tarefa agendada simples).

## 5. Rotas principais

| Rota | Função |
|---|---|
| `/` | Chamada do mapa + carta do dia |
| `/mapa`, `/mapa/[id]` | Formulário; resultado |
| `/tarot`, `/tarot/[id]` | Escolha da tiragem; leitura |
| `/conta`, `/conta/dados` | Mapas, histórico; exportar/apagar |
| `/aprender/...` | Signos, planetas, casas, aspectos, cartas |
| `/privacidade`, `/termos` | Institucional |
| `/admin` | Uso e custo da IA |
| `POST /api/geocode`, `/api/mapa`, `/api/tarot`, `/api/mapa/[id]/interpretar` | Servidor |

## 6. Variáveis de ambiente (`.env.example` documentado)

`DATABASE_URL` (Neon via Vercel), `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`, `OPENROUTER_FALLBACK_MODEL`, `APP_URL`, `AUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `ADMIN_EMAIL`, `RATE_LIMIT_GUEST_PER_DAY`, `RATE_LIMIT_USER_PER_DAY`, `GEOCODER_USER_AGENT`, `TAROT_REVERSED_CHANCE`.

## 7. Visual
- Tokens do tema (`bg-deep`, `bg-cosmic`, `violet-astral`, `white-cosmic`, `text-main`, `neon-nebula`), nunca hex solto.
- `glass`, `glass-strong`, `glass-subtle` + `StarField` (CSS, sem canvas) + 3 nebulosas estáticas/lentas; fallbacks para `backdrop-filter`, `prefers-reduced-transparency` e `prefers-reduced-motion`.
- Cartas em animação sem blur; sem vidro dentro de vidro.

## 8. Riscos

| Risco | Impacto | Mitigação |
|---|---|---|
| Precisão dos planetas (conversão de coordenadas) | Alto | Testes contra Swiss Ephemeris desde a Fase 1 |
| Placidus em casos limite | Médio | Fallback automático + testes de latitude alta |
| Banco de fusos do Node incompleto para BR | Alto | Testes BR; tabela de correção própria se preciso |
| Modelo gratuito fraco/lento/indisponível/limitado (Nemotron raciocina antes de responder) | Alto | Reserva (Gemma), `reasoning_effort` baixo, rate limit, trocar por env, pré-filtro determinístico |
| Nominatim bloqueando | Médio | Cache, debounce, Photon como alternativa |
| Imagens recoloridas com direitos | Médio | Só "RWS1909" da Commons com licença conferida; créditos |
| Link mágico em spam | Médio | Login Google no MVP |
| Limites do plano grátis (Vercel timeout, Neon) | Baixo | `maxDuration` do streaming; tarefas curtas |

## 9. Imagens do tarot — situação atual
- Origem: Wikimedia Commons, categoria *Rider-Waite tarot deck (Roses & Lilies)*, arquivos `RWS1909 - …`, todos marcados "Public domain" na API do Commons (78 cartas, ~3,5 MB no total).
- Baixadas para uma pasta temporária (`tmp-tarot-staging/`, fora do projeto final) com ritmo lento, pois o Commons limitou as requisições. Na Fase 3 serão movidas para `public/tarot/` com nomes padronizados.
- Numeração dos arquivos: Maiores 00–21; Menores 01 = Ás … 10, 11 = Valete, 12 = Cavaleiro, 13 = Rainha, 14 = Rei (conferir visualmente carta a carta).
