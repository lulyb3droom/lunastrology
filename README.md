# Lunastrology ☾

Site de astrologia em português do Brasil: **mapa astral** com cálculo astronômico real e **tarot** interpretado por IA.

> Projeto em construção. A especificação completa está em [`specs/`](specs/): `spec.md` (o quê e por quê), `plan.md` (como) e `tasks.md` (tarefas por fase).

## Como rodar no seu computador

Você precisa do [Node.js](https://nodejs.org) (versão 20 ou mais nova).

```bash
npm install
cp .env.example .env.local   # depois preencha os valores (veja abaixo)
npm run dev                  # abre em http://localhost:3000
```

Outros comandos:

| Comando | Para quê |
|---|---|
| `npm test` | Roda os testes automáticos |
| `npm run lint` | Verifica o estilo do código |
| `npm run build` | Gera a versão de produção (também serve para achar erros) |

## Variáveis de ambiente

Estão todas listadas e explicadas em [`.env.example`](.env.example). **Nunca** coloque chaves reais no código nem faça commit do `.env.local`. Na Vercel, elas são cadastradas em *Project → Settings → Environment Variables*.

## Deploy (Vercel)

1. O código fica no GitHub; a Vercel faz um deploy de **preview** a cada envio de código.
2. O banco é o **Neon** (integração do Marketplace da Vercel, que cria a `DATABASE_URL` sozinha).
3. A produção só é publicada depois de aprovação.

(Esta seção será detalhada passo a passo na Fase 7.)

## Estrutura

```
app/          páginas e rotas
components/   peças de interface (vidro fosco, fundo de estrelas, cabeçalho...)
lib/          lógica: cálculo astronômico, tarot, IA, banco
specs/        especificação, plano e tarefas
tests/        testes automáticos
```

## Identidade visual

As cores são "tokens" definidos em `app/globals.css` (`bg-deep`, `bg-cosmic`, `violet-astral`, `white-cosmic`, `text-main`, `neon-nebula`). Use sempre os nomes, nunca o código de cor solto. Veja a página `/estilo` para um guia visual.

## Aviso

Astrologia e tarot são oferecidos para entretenimento e autoconhecimento.

## Créditos

As imagens do tarot são do baralho Rider-Waite-Smith de 1909, em domínio público (Wikimedia Commons). Detalhes em [`CREDITOS.md`](CREDITOS.md).
