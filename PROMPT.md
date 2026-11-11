# Prompt SDD — Site de Astrologia (Mapa Astral + Tarot com IA)

> Cole este arquivo inteiro no Claude Code (ou salve como `PROMPT.md` na raiz de uma pasta vazia e diga: "leia o PROMPT.md e siga").

---

## 0. Como você (Claude Code) deve trabalhar

Você vai construir este projeto usando **Spec-Driven Development (SDD)**. Isso significa: **especificar antes de programar**, e a especificação é a fonte da verdade.

Regras de trabalho:

1. **Eu não sei programar.** Sei usar a Vercel, configurar variáveis de ambiente, montar banco de dados e fazer chamadas de API/webhook. Explique decisões técnicas em linguagem simples, sem jargão desnecessário. Quando eu precisar fazer algo manualmente (login, criar chave, clicar em algo num painel), me dê o passo a passo numerado.
2. **Fluxo obrigatório em 4 etapas, com pausa para minha aprovação entre cada uma:**
   - **Etapa 1 — Perguntas:** antes de qualquer coisa, leia este documento inteiro e me faça as perguntas que faltarem (no máximo 10, agrupadas e com uma sugestão de resposta padrão para cada). Marque no spec tudo que estiver indefinido com `[PRECISA DEFINIR]`.
   - **Etapa 2 — Spec:** crie `specs/spec.md` (o QUÊ e o PORQUÊ: histórias de usuário, critérios de aceitação, fora de escopo). Sem decisões de código aqui.
   - **Etapa 3 — Plano:** crie `specs/plan.md` (o COMO: arquitetura, bibliotecas, esquema do banco, rotas, variáveis de ambiente, riscos) e `specs/tasks.md` (lista de tarefas pequenas, numeradas, em fases, cada uma com critério de "pronto").
   - **Etapa 4 — Implementação:** execute as tarefas **uma fase por vez**. Ao fim de cada fase: rode os testes, faça commit, faça deploy de preview na Vercel e me mostre o link + o que testar.
3. Se durante a implementação algo do spec se mostrar errado ou impossível, **pare, atualize o spec e me avise** — não improvise silenciosamente.
4. Antes de usar qualquer biblioteca, **confira a documentação atual e a versão estável** (não confie na memória). Não use versões publicadas há menos de 14 dias.
5. Nunca coloque chaves de API no código nem em commits. Tudo em variáveis de ambiente, com um `.env.example` documentado.
6. Mantenha um `README.md` em português explicando como rodar, como fazer deploy e como dar manutenção (pensando que outra pessoa leiga possa assumir depois).

---

## 1. Constituição do projeto (princípios que não mudam)

- **Precisão astronômica primeiro.** O mapa astral é um cálculo astronômico real, não texto genérico. Os números têm que bater com referências profissionais (tolerância: até 1 minuto de arco nos planetas, até alguns minutos no Ascendente/MC).
- **A IA interpreta, mas não calcula nem sorteia.** Posições planetárias são calculadas por código. Cartas de tarot são sorteadas por código com aleatoriedade criptográfica. A IA só recebe o resultado e escreve a interpretação.
- **Respeito ao usuário.** Interpretações nunca fazem previsões de morte, doença, gravidez ou desastres, e nunca dão conselho médico, jurídico ou financeiro. Tom acolhedor, nunca fatalista.
- **Privacidade (LGPD).** Data, hora e local de nascimento são dados pessoais. Coletar o mínimo, explicar o uso, permitir apagar tudo.
- **Mobile-first, em português do Brasil**, acessível (contraste, navegação por teclado, textos alternativos).
- **Simples de manter.** Preferir poucas dependências bem mantidas a muitas "mágicas".

---

## 2. Visão do produto

Um site de astrologia onde a pessoa:

1. Informa **nome, data, hora e cidade de nascimento** e recebe seu **mapa astral completo**: roda zodiacal desenhada, tabela de planetas, casas e aspectos, e uma interpretação escrita.
2. Faz **tiragens de tarot** com interpretação gerada por IA (via OpenRouter), podendo fazer uma pergunta.
3. (Fases futuras) Recebe conteúdos personalizados com base no próprio mapa.

**Público:** pessoas curiosas sobre astrologia, do iniciante ao intermediário. **Tom:** místico-elegante, mas claro.

**Contexto:** é um **projeto pessoal** (não é para cliente). Sem pagamentos no MVP; priorizar custo baixo de operação (planos gratuitos da Vercel e da Neon, modelos baratos ou gratuitos na OpenRouter) e código limpo, que também sirva como portfólio.

---

## 3. Funcionalidades — MVP

### 3.1 Cálculo do mapa astral (núcleo do sistema)

**Entrada do usuário**
- Nome (opcional), data de nascimento, hora de nascimento, cidade de nascimento (com busca/autocomplete).
- Opção **"não sei minha hora de nascimento"**: nesse caso calcular para 12:00 local, **não mostrar Ascendente, MC nem casas**, e avisar que a posição da Lua pode variar até ~6°.

**Como o mapa deve ser calculado (siga esta ordem):**

1. **Geocodificação:** cidade → latitude e longitude. (Sugestão: Nominatim/OpenStreetMap, respeitando a política de uso — máx. 1 requisição/segundo, User-Agent identificado, cache dos resultados no banco. Avalie alternativas no plano.)
2. **Fuso horário histórico:** coordenadas → fuso IANA (ex.: `America/Sao_Paulo`) e conversão da hora local para **UTC usando as regras da data de nascimento**. ⚠️ Crítico para o Brasil: o horário de verão mudou quase todo ano e variou por estado (e houve anos sem). Usar uma biblioteca com o banco de dados de fusos IANA completo e escrever testes específicos para datas brasileiras com e sem horário de verão.
3. **Dia Juliano** a partir do UTC (e conversão para Tempo Terrestre, ΔT, quando a biblioteca exigir).
4. **Posições dos astros:** longitude eclíptica **geocêntrica, aparente, zodíaco tropical** de: Sol, Lua, Mercúrio, Vênus, Marte, Júpiter, Saturno, Urano, Netuno, Plutão. Indicar se está **retrógrado** (velocidade negativa).
5. **Pontos:** Nodo Norte e Sul (lunar médio — permitir opção "verdadeiro" se a biblioteca suportar), Lilith (Lua Negra média), Parte da Fortuna (fórmula diurna/noturna). Quíron se a biblioteca escolhida suportar.
6. **Tempo sideral local** → **Ascendente** e **Meio do Céu (MC)**, considerando a obliquidade da eclíptica.
7. **Casas:** sistema padrão **Placidus**, com opção de **Casas Inteiras (Whole Sign)**, **Iguais** e **Koch**. Tratar latitudes extremas (acima de ~66°), onde Placidus/Koch falham: cair automaticamente para Casas Inteiras e avisar.
8. **Signo e grau de cada ponto** (ex.: "Sol a 14°23' de Leão, Casa 10"), e em que casa cada planeta está.
9. **Aspectos** entre planetas e pontos: conjunção (0°), oposição (180°), trígono (120°), quadratura (90°), sextil (60°) — e opcionalmente quincúncio (150°). Orbes configuráveis em um único arquivo (sugestão inicial: 8° para os maiores, 6° para sextil, maiores para Sol/Lua). Indicar se é aplicativo ou separativo.
10. **Resumos:** distribuição por elementos (fogo, terra, ar, água) e modalidades (cardinal, fixo, mutável), regente do mapa, "Big Three" (Sol, Lua, Ascendente).

**Biblioteca de efemérides — decisão a documentar no plano:**
- **Opção A — `astronomy-engine` (licença MIT):** precisa, leve, roda bem na Vercel. Não calcula Quíron; casas e Ascendente precisam ser implementados à mão (fórmulas conhecidas). Boa para começar sem risco de licença.
- **Opção B — Swiss Ephemeris (via pacote Node/WASM):** padrão profissional da astrologia, calcula tudo (incluindo Quíron e Nodo verdadeiro). ⚠️ Licença **AGPL** — se o site for comercial e o código não for aberto, exige licença comercial paga. Também pode haver dificuldade com módulos nativos na Vercel.
- Como é um projeto pessoal, a AGPL só obriga a deixar o código-fonte disponível para quem usa o site; isso pode ser aceitável. Mesmo assim, compare as duas, recomende uma e explique para mim em termos simples. O cálculo deve ficar isolado num módulo (`lib/astro/`) para poder trocar a biblioteca depois sem mexer no resto.

**Validação obrigatória:** criar uma bateria de testes automatizados com **pelo menos 10 mapas de referência** (de diferentes décadas, hemisférios, com e sem horário de verão, incluindo pelo menos 4 nascimentos no Brasil) comparando com valores de uma fonte profissional (ex.: Astro.com). Me peça para conferir alguns manualmente se precisar.

**Saída visual:**
- **Roda zodiacal em SVG** gerada pelo próprio código (signos, cúspides das casas, planetas com glifos, linhas de aspecto coloridas por tipo). Responsiva e bonita no celular.
- Tabelas: planetas (signo, grau, casa, retrógrado), casas (cúspides), aspectos (com orbe).
- **Interpretação por IA** do mapa: enviar ao modelo apenas os dados calculados (estruturados em JSON) e pedir um texto organizado por seções (Big Three, planetas pessoais, casas em destaque, aspectos mais fortes). Gerar uma vez, salvar no banco e reutilizar — não gastar IA a cada visita.

### 3.2 Tarot com IA (OpenRouter)

- **Baralho:** 78 cartas (22 Arcanos Maiores + 56 Menores), com significados base (direito e invertido) em português guardados no próprio projeto (arquivo de dados), para a IA ter uma base consistente.
- **Imagens:** usar o **Rider-Waite-Smith original de 1909** (domínio público), a partir de digitalizações das cartas originais. ⚠️ Não usar as versões recoloridas/modernas de editoras, que têm direitos autorais. Alternativa: ilustrações próprias.
- **Tiragens:**
  - Carta do dia (1 carta)
  - Passado / Presente / Futuro (3 cartas)
  - Situação / Obstáculo / Conselho (3 cartas)
  - Cruz Celta (10 cartas)
- O sorteio é feito **no servidor** com aleatoriedade criptográfica, com chance configurável de carta invertida. Embaralhamento Fisher–Yates.
- Usuário pode digitar uma **pergunta** (opcional, com limite de caracteres).
- **Animação** de embaralhar e virar as cartas.
- A interpretação chega **em streaming** (texto aparecendo aos poucos).
- Se a pessoa estiver logada e tiver mapa salvo, a IA pode receber o "Big Three" dela como contexto opcional.

**Integração OpenRouter:**
- API compatível com o formato OpenAI (`https://openrouter.ai/api/v1/chat/completions`), chamada **apenas do servidor**.
- Variáveis: `OPENROUTER_API_KEY`, `OPENROUTER_MODEL` (modelo configurável sem mexer no código), `OPENROUTER_FALLBACK_MODEL`.
- Enviar os cabeçalhos de identificação do app recomendados pela OpenRouter (`HTTP-Referer`, `X-Title`).
- **Controle de custo:** limite de tiragens por usuário/IP por dia (rate limit), `max_tokens` definido, e registro no banco de tokens/custo por chamada para eu acompanhar.
- **Prompt de sistema** do tarólogo guardado em arquivo separado e versionado, com as regras da constituição (sem previsões de morte/doença, sem conselhos médicos/financeiros/jurídicos, linguagem acolhedora, interpretação como reflexão e não destino fixo).
- **Segurança:** a pergunta do usuário é tratada como dado, não como instrução (proteção contra prompt injection). Se a pergunta indicar sofrimento grave ou risco à vida, responder com acolhimento e indicar o CVV (188), sem fazer a tiragem.
- Tratar erros da API (sem crédito, modelo fora do ar, timeout) com mensagem amigável e tentativa no modelo reserva.

### 3.3 Contas e histórico

- Usar o site **sem login** para um mapa e uma tiragem rápida.
- **Login opcional** (sugestão: e-mail com link mágico e/ou Google) para salvar mapas (o próprio e de outras pessoas, ex.: parceiro, filhos) e histórico de tiragens.
- Página "Meus dados" com **exportar e apagar tudo** (LGPD).

### 3.4 Páginas

- Home (chamada para calcular o mapa + carta do dia)
- Calcular mapa / Resultado do mapa (URL compartilhável opcional, desligada por padrão)
- Tarot (escolha da tiragem → pergunta → cartas → interpretação)
- Minha conta (mapas salvos, histórico)
- Conteúdo educativo: os 12 signos, 10 planetas, 12 casas, aspectos, 78 cartas (bom para SEO)
- Política de privacidade, Termos de uso e aviso "astrologia e tarot são para entretenimento e autoconhecimento"

---

## 4. Stack e infraestrutura

- **Framework:** Next.js (App Router) + TypeScript, hospedado na **Vercel**.
- **Banco:** **Neon (Postgres serverless)**, conectado pela integração Neon do Marketplace da Vercel (assim `DATABASE_URL` já aparece nas variáveis do projeto). Usar o driver serverless da Neon e um ORM com migrações versionadas (sugestão: Drizzle). Usar **branch de banco separado** para previews e produção.
- **Estilo:** Tailwind CSS, com a paleta da seção 4.1 configurada como tokens do tema. **Somente tema escuro** no MVP (a identidade do site é o céu noturno).
- **Testes:** testes unitários para todo o módulo `lib/astro/` e para o sorteio do tarot; um teste ponta a ponta do fluxo principal.
- **Rate limit:** solução que funcione em serverless (ex.: tabela no Postgres ou serviço tipo Upstash) — justificar no plano.
- **SEO:** metadados, sitemap, Open Graph; imagem de compartilhamento gerada dinamicamente para o mapa ("Meu Big Three: ☉ Leão ☽ Peixes ↑ Escorpião").
- **Observabilidade:** logs de erros e uma página simples de admin (protegida) mostrando uso e custo da IA.

### 4.1 Identidade visual — Paleta "Mística & Deep Tech"

Configure estas cores como variáveis CSS e tokens do Tailwind (use os nomes de token abaixo no código, nunca o hex solto nos componentes):

| Token | Nome | Hex | Uso |
|---|---|---|---|
| `bg-deep` | Preto Absoluto | `#09070F` | Fundo principal (preto com leve toque de roxo) |
| `bg-cosmic` | Roxo Cósmico | `#1C1033` | Containers secundários, cards, gradientes e sombras |
| `violet-astral` | Violeta Astral | `#6B3FA0` | Destaques, seleções, botões de ação secundários |
| `white-cosmic` | Branco Puríssimo | `#FFFFFF` | Estrelas, ícones de constelações, brilhos e linhas finas |
| `text-main` | Branco Suave | `#F1EEF8` | Texto de leitura |
| `neon-nebula` | Neon Nebulosa | `#A855F7` | Hover de botões, signos ativos, destaques do horóscopo |

**Regras de aplicação:**
- Fundo da página em `bg-deep`; cards e painéis em `bg-cosmic`, com gradientes suaves entre os dois. Pode haver um fundo sutil de estrelas (pontos `white-cosmic` com opacidade baixa), leve e sem atrapalhar a leitura.
- Na **roda do mapa astral:** linhas finas e glifos em `white-cosmic`/`text-main`, casas e divisões em `violet-astral` com transparência, planeta ou signo selecionado em `neon-nebula`. Cores dos aspectos derivadas da paleta (ex.: harmônicos em tons de violeta claro, tensos em `neon-nebula`), sempre com legenda, sem depender só da cor.
- No **tarot:** verso das cartas com padrão geométrico em `bg-cosmic` + `violet-astral`, e brilho `neon-nebula` ao passar o mouse ou virar.
- Brilhos (glow/box-shadow com `neon-nebula`) usados com moderação, só em elementos interativos ou ativos.

**Efeito de vidro fosco (glassmorphism):**

Cards, painéis, menu/header, modais e a área de interpretação usam efeito de vidro fosco. Crie **um componente/utilitário reutilizável** (ex.: classe `glass` e variantes `glass-strong` e `glass-subtle`), em vez de repetir o estilo em cada lugar.
- **Base:** fundo `bg-cosmic` semitransparente (entre ~40% e 60% de opacidade), `backdrop-filter: blur()` moderado (~12–20px) com leve saturação, borda fina `white-cosmic` com ~10–15% de opacidade, cantos arredondados e sombra suave arroxeada.
- **Reflexo de luz:** um gradiente sutil na borda superior/esquerda (branco com opacidade baixa), simulando luz batendo no vidro.
- **O vidro precisa de algo atrás para aparecer.** Crie um fundo de página com profundidade: campo de estrelas + 2 ou 3 "nebulosas" (manchas desfocadas grandes em `violet-astral` e `neon-nebula` com opacidade baixa), fixas ou com movimento bem lento. Sem isso, o vidro vira só um card cinza.
- **Interação:** no hover/foco, a borda ganha um leve brilho `neon-nebula`, com transição suave.
- **Legibilidade:** texto sobre vidro sempre em `text-main`. Se o fundo atrás ficar claro demais em algum ponto, aumentar a opacidade do vidro. O contraste mínimo vale também sobre o vidro.
- **Desempenho:** `backdrop-filter` pesa no celular. Não empilhar vidro dentro de vidro, evitar blur em elementos que animam, e testar a rolagem num celular intermediário. As cartas de tarot durante a animação de virar **não** usam blur.
- **Fallbacks:** se o navegador não suportar `backdrop-filter`, usar fundo `bg-cosmic` mais opaco (~90%). Respeitar `prefers-reduced-transparency` (vidro vira sólido) e `prefers-reduced-motion` (nebulosas param de se mover).

**Contraste (acessibilidade WCAG AA), obrigatório respeitar:**
- `text-main` sobre `bg-deep` ou `bg-cosmic`: ótimo para qualquer texto.
- `neon-nebula` sobre `bg-deep`: contraste ~5:1, OK para texto e links.
- `violet-astral` sobre `bg-deep`: contraste ~2,7:1, **não usar para texto**, só para fundos de botão, bordas e decoração.
- Texto branco sobre botão `violet-astral`: ~7:1, OK.
- Texto branco sobre fundo `neon-nebula`: ~4:1, só para textos grandes/negrito. Em botões com fundo `neon-nebula`, preferir texto `bg-deep`.

**Esquema do banco (rascunho — refinar no plano):**
- `users` (id, email, nome, criado_em)
- `birth_charts` (id, user_id nullable, rótulo, data/hora local, hora_desconhecida, cidade, lat, lon, fuso, utc, sistema_casas, resultado_calculado JSON, versão_do_cálculo, interpretação, criado_em)
- `tarot_readings` (id, user_id nullable, tipo_tiragem, pergunta, cartas JSON [carta + posição + invertida], interpretação, modelo, tokens, custo, criado_em)
- `geocode_cache` (consulta, lat, lon, fuso, nome_exibido)
- `ai_usage` (para relatório de custo)
- `rate_limits`

### Deploy — o que eu faço e o que você faz

- **Eu faço:** login na Vercel (`vercel login`), criar/conectar o banco Neon pela Vercel, criar a chave na OpenRouter e colar as variáveis de ambiente. Você me guia passo a passo quando chegar a hora e espera eu confirmar.
- **Você faz:** criar o repositório Git, configurar o projeto, rodar migrações, fazer deploy de preview a cada fase e o deploy de produção só quando eu aprovar.

---

## 5. Fora do escopo do MVP

- Pagamentos/assinaturas
- App mobile nativo
- Astrologia védica/sideral (deixar o código preparado para adicionar o zodíaco sideral depois)
- Múltiplos idiomas

---

## 6. Ideias para fases futuras (listar no spec como roadmap, não implementar agora)

**Fase 2 — Personalização com o mapa**
- **Trânsitos do dia/semana** personalizados: compara os planetas de hoje com o mapa natal da pessoa ("Saturno está em quadratura com seu Sol").
- **Sinastria (compatibilidade):** cruzar dois mapas salvos e mostrar aspectos entre eles + interpretação.
- **Revolução Solar:** mapa do momento exato em que o Sol volta à posição natal no aniversário.
- **Calendário lunar:** fases da Lua, Lua fora de curso, retrógrados do ano, eclipses.
- **Chat "pergunte ao seu mapa":** conversa com a IA que conhece o mapa da pessoa.

**Fase 3 — Engajamento**
- E-mail diário/semanal opcional com carta do dia + trânsito em destaque.
- Diário de tiragens: a pessoa anota o que aconteceu depois e revisita.
- Alertas: "Mercúrio fica retrógrado em 3 dias", "seu retorno de Saturno está chegando".
- Numerologia (número do caminho de vida, ano pessoal) — cálculo simples.
- Relatório do mapa em PDF bonito para baixar.

**Fase 4 — Monetização (só se um dia eu decidir transformar em produto)**
- Plano premium (tiragens ilimitadas, Cruz Celta, sinastria, relatório PDF) com pagamento via Pix/cartão (ex.: Mercado Pago ou Stripe).
- Créditos avulsos de leitura.

---

## 7. Critérios de aceitação do MVP

- [ ] Para os 10+ mapas de referência, todos os planetas ficam a até 1' do valor de referência, e Ascendente/MC a até 5'.
- [ ] Nascimentos no Brasil em períodos de horário de verão convertem corretamente para UTC (testes passando).
- [ ] "Não sei minha hora" oculta Ascendente, MC e casas, e mostra o aviso.
- [ ] A roda do mapa renderiza corretamente em tela de celular (375px) e desktop.
- [ ] Uma tiragem de 3 cartas mostra as cartas sorteadas no servidor e a interpretação em streaming em até ~3s para começar.
- [ ] Se a OpenRouter falhar, o usuário vê mensagem amigável e o modelo reserva é tentado.
- [ ] Rate limit impede abuso (ex.: limite diário por IP para visitantes).
- [ ] Usuário logado consegue salvar, ver, exportar e apagar seus mapas e tiragens.
- [ ] Nenhuma chave de API aparece no código, no navegador ou nos commits.
- [ ] Site publicado na Vercel com banco Neon de produção e README completo.

---

**Comece pela Etapa 1: leia tudo e me faça suas perguntas.**
