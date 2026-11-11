# Spec — Lunastrology (Mapa Astral + Tarot com IA)

> Documento de **QUÊ** e **PORQUÊ**. Sem decisões de código (isso fica em `plan.md`).
> Fonte original: `PROMPT.md`. Status: **rascunho para aprovação (Etapa 2)**.

## 1. Decisões tomadas (respostas da Etapa 1)

| # | Tema | Decisão |
|---|---|---|
| 1 | Efemérides | Biblioteca MIT (`astronomy-engine`) como escolha recomendada; Ascendente/MC/casas implementados no projeto. Justificativa final no plano. Módulo isolado `lib/astro/`. |
| 2 | Casas / Nodo | Placidus padrão (+ Whole Sign, Iguais, Koch). Nodo **médio** padrão, sem opção "verdadeiro" no MVP (a biblioteca não o oferece). |
| 3 | Geocodificação | Nominatim/OpenStreetMap com cache no banco. |
| 4 | Validação | Claude monta ≥10 mapas de referência (≥4 no Brasil, com/sem horário de verão); a dona do projeto confere 2–3 no Astro.com. |
| 5 | IA | Modelo **gratuito** da OpenRouter, configurável por variável de ambiente. |
| 6 | Conteúdo educativo | Textos-base em PT-BR escritos por Claude, em arquivos de dados, revisados depois pela dona. |
| 7 | Imagens do tarot | Rider-Waite-Smith 1909 (domínio público), digitalizações verificadas; download só com aprovação. |
| 7b | Login | Link mágico por e-mail. Google fica para depois do MVP. |
| 8 | Rate limit | Tabela no Postgres. Visitantes: 3 tiragens/dia/IP. Logados: 10/dia. |
| 9 | Domínio | `.vercel.app` por enquanto. |
| 10 | Git | Repositório conectado ao GitHub. Vercel e Node já disponíveis. |

Pendências marcadas abaixo como `[PRECISA DEFINIR]` serão resolvidas no plano.

## 2. Visão

Site de astrologia em português do Brasil onde a pessoa calcula seu **mapa astral** (cálculo astronômico real, roda em SVG, tabelas e interpretação escrita) e faz **tiragens de tarot** interpretadas por IA. Projeto pessoal, sem pagamentos, custo de operação mínimo, código limpo (serve de portfólio).

Público: curiosos, do iniciante ao intermediário. Tom: místico-elegante, mas claro.

## 3. Princípios (constituição)

1. **Precisão astronômica primeiro:** planetas ≤ 1' de arco da referência; Ascendente/MC ≤ 5'.
2. **IA interpreta, não calcula nem sorteia.** Posições por código; cartas por sorteio criptográfico no servidor.
3. **Respeito ao usuário:** sem previsões de morte, doença, gravidez ou desastre; sem conselho médico, jurídico ou financeiro; tom acolhedor, interpretação como reflexão.
4. **Privacidade (LGPD):** coletar o mínimo, explicar o uso, permitir exportar e apagar tudo.
5. **Mobile-first, PT-BR, acessível** (WCAG AA, teclado, textos alternativos).
6. **Simples de manter:** poucas dependências bem mantidas.

## 4. Histórias de usuário e critérios de aceitação

### H1 — Calcular meu mapa astral
*Como visitante, quero informar nome (opcional), data, hora e cidade de nascimento para ver meu mapa.*

- Busca de cidade com autocomplete; escolher entre resultados ambíguos.
- Resultado inclui: roda SVG, tabela de planetas (signo, grau/minuto, casa, retrógrado), cúspides das casas, aspectos (tipo, orbe, aplicativo/separativo), elementos, modalidades, regente do mapa e Big Three.
- Astros: Sol a Plutão, Nodo Norte/Sul (médio), Lilith (média), Parte da Fortuna (fórmula diurna/noturna). Quíron: **fora do MVP** (biblioteca escolhida não calcula) — registrado no roadmap.
- Longitude eclíptica geocêntrica, aparente, zodíaco tropical.
- Conversão hora local → UTC usa as regras históricas do fuso na data de nascimento (horário de verão brasileiro).
- Casas: Placidus por padrão; usuário pode trocar para Inteiras, Iguais ou Koch. Latitude acima de ~66°: cai automaticamente para Casas Inteiras e avisa.
- Aspectos: conjunção, oposição, trígono, quadratura, sextil (quincúncio opcional). Orbes configuráveis em **um único arquivo**.
- **Aceite:** ver critérios do MVP (seção 8), itens 1–4.

### H2 — "Não sei minha hora de nascimento"
- Calcula para 12:00 local; **não mostra Ascendente, MC nem casas**; aviso de que a Lua pode variar até ~6°.

### H3 — Interpretação do mapa por IA
- Texto em seções: Big Three, planetas pessoais, casas em destaque, aspectos mais fortes.
- A IA recebe apenas os dados calculados (JSON). Gerada **uma vez**, salva e reutilizada.

### H4 — Tarot
- Baralho de 78 cartas com significados base (direito/invertido) em PT-BR, em arquivo de dados.
- Tiragens: Carta do dia (1), Passado/Presente/Futuro (3), Situação/Obstáculo/Conselho (3), Cruz Celta (10).
- Sorteio no servidor, aleatoriedade criptográfica, embaralhamento Fisher–Yates, chance configurável de carta invertida.
- Pergunta opcional com limite de caracteres. Tratada como dado, não instrução.
- Se a pergunta indicar sofrimento grave/risco de vida: resposta acolhedora com CVV (188), **sem tiragem**.
- Animação de embaralhar e virar (sem blur durante a animação). Interpretação em streaming, começando em até ~3 s.
- Logada com mapa salvo: Big Three opcional como contexto.
- Erros da IA (sem crédito, modelo fora, timeout): mensagem amigável e tentativa no modelo reserva.
- Controle de custo: rate limit, `max_tokens`, registro de tokens/custo por chamada.

### H5 — Conta e histórico
- Uso sem login para um mapa e uma tiragem rápida.
- Login opcional por link mágico: salvar mapas (próprio e de outras pessoas) e histórico de tiragens.
- Página "Meus dados": **exportar e apagar tudo**.
- URL compartilhável do mapa: opcional, **desligada por padrão**.

### H6 — Conteúdo educativo (SEO)
- Páginas dos 12 signos, 10 planetas, 12 casas, aspectos e 78 cartas.
- Metadados, sitemap, Open Graph; imagem de compartilhamento dinâmica ("Meu Big Three: ☉ Leão ☽ Peixes ↑ Escorpião").

### H7 — Páginas institucionais
- Política de privacidade, Termos de uso e aviso "astrologia e tarot são para entretenimento e autoconhecimento".

### H8 — Admin (dona do projeto)
- Página protegida (somente o e-mail da dona) com uso e custo da IA, e logs de erro.

## 5. Identidade visual (requisitos)

- Somente tema escuro. Paleta "Mística & Deep Tech" (tokens `bg-deep`, `bg-cosmic`, `violet-astral`, `white-cosmic`, `text-main`, `neon-nebula`), usados por nome, nunca hex solto em componentes.
- Efeito vidro fosco reutilizável (`glass`, `glass-strong`, `glass-subtle`), com fundo de estrelas + nebulosas; fallbacks para navegador sem `backdrop-filter`, `prefers-reduced-transparency` e `prefers-reduced-motion`.
- Regras de contraste do PROMPT (seção 4.1) são obrigatórias; `violet-astral` nunca como cor de texto.
- Aspectos na roda sempre com legenda, sem depender só da cor.

## 6. Requisitos não funcionais

- **Desempenho:** rolagem fluida em celular intermediário; sem vidro dentro de vidro.
- **Segurança:** nenhuma chave no código/navegador/commits; chamadas à OpenRouter só no servidor; `.env.example` documentado.
- **Privacidade:** dados de nascimento são pessoais; exportação e exclusão completas.
- **Custo:** planos gratuitos (Vercel, Neon, modelo gratuito da OpenRouter). Limitações de modelos gratuitos (limites de uso, qualidade, disponibilidade) tratadas pelo modelo reserva e rate limit.
- **Manutenção:** `README.md` em PT-BR para pessoa leiga.
- **Testes:** unitários em `lib/astro/` e no sorteio do tarot; ≥10 mapas de referência; um teste ponta a ponta do fluxo principal.

## 7. Fora do escopo do MVP

Pagamentos, app nativo, astrologia védica/sideral (código preparado para adicionar), múltiplos idiomas, Quíron, Nodo verdadeiro, login com Google.

### Roadmap (não implementar agora)
- **Fase 2:** trânsitos, sinastria, revolução solar, calendário lunar, chat "pergunte ao seu mapa", Quíron/Nodo verdadeiro (se trocar de biblioteca), login Google.
- **Fase 3:** e-mail diário/semanal, diário de tiragens, alertas, numerologia, PDF do mapa.
- **Fase 4:** premium e créditos (Pix/cartão), só se virar produto.

## 8. Critérios de aceitação do MVP

- [ ] Em ≥10 mapas de referência, planetas a ≤1' e Ascendente/MC a ≤5' da referência.
- [ ] Nascimentos no Brasil em horário de verão convertem corretamente para UTC (testes passando).
- [ ] "Não sei minha hora" oculta Ascendente, MC e casas e mostra o aviso.
- [ ] Roda do mapa renderiza corretamente em 375px e desktop.
- [ ] Tiragem de 3 cartas: cartas sorteadas no servidor e interpretação em streaming começando em ~3 s.
- [ ] Falha na OpenRouter: mensagem amigável e modelo reserva tentado.
- [ ] Rate limit impede abuso (diário por IP para visitantes).
- [ ] Usuário logado salva, vê, exporta e apaga mapas e tiragens.
- [ ] Nenhuma chave de API no código, no navegador ou nos commits.
- [ ] Site na Vercel com banco Neon de produção e README completo.

## 9. Pendências `[PRECISA DEFINIR]` (resolver no plano)

- `[PRECISA DEFINIR]` Modelo gratuito específico da OpenRouter (e o reserva): verificar quais estão disponíveis e estáveis na hora do plano.
- `[PRECISA DEFINIR]` Nome e visibilidade (público/privado) do repositório no GitHub. Observação: o GitHub CLI (`gh`) não está instalado; a conexão será feita com um passo a passo na implementação.
- `[PRECISA DEFINIR]` Serviço de envio do link mágico (sugestão: Resend, plano gratuito) e remetente. Sem domínio próprio, o Resend só envia a e-mails limitados; avaliar alternativa no plano.
- `[PRECISA DEFINIR]` Fonte exata das imagens RWS 1909 e confirmação de licença carta a carta.
- `[PRECISA DEFINIR]` Quais mapas de referência (pessoas/datas) serão usados e como serão obtidos os valores profissionais de comparação.
