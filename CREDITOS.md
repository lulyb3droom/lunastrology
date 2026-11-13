# Créditos

## Imagens do tarot

As cartas em `public/tarot/` são as ilustrações do baralho **Rider-Waite-Smith**, edição original de **1909**
(William Rider & Son, Londres), desenhadas por **Pamela Colman Smith** (1878–1951) sob a direção de Arthur Edward Waite.

- **Situação de direitos:** domínio público (a autora morreu em 1951, e a obra foi publicada em 1909). No Brasil, a
  proteção (vida + 70 anos) terminou em 2022.
- **Fonte das digitalizações:** Wikimedia Commons, categoria
  [Rider-Waite tarot deck (Roses & Lilies)](https://commons.wikimedia.org/wiki/Category:Rider-Waite_tarot_deck_(Roses_%26_Lilies)),
  arquivos `RWS1909 - ...`. Todos marcados como "Public domain" na página de cada arquivo.
- **O que NÃO usamos:** versões recoloridas, restauradas ou "modernizadas" de editoras (ex.: U.S. Games), que podem ter
  direitos autorais próprios.
- **Tratamento:** apenas redimensionadas (420 px de largura) e convertidas para WebP, sem alterar o desenho.
  Para refazer: `node scripts/preparar-imagens-tarot.mjs <pasta com os JPEG originais>`.

## Efemérides e cálculo

- Posições dos astros: biblioteca [astronomy-engine](https://github.com/cosinekitty/astronomy) (MIT).
- Fusos horários: banco IANA, via `luxon` e `tz-lookup`.
- Validação dos testes: Swiss Ephemeris, usado **somente** para gerar dados de teste (não faz parte do site).

## Mapas e geocodificação

- Busca de cidades: dados do [OpenStreetMap](https://www.openstreetmap.org/copyright) © colaboradores do OpenStreetMap
  (ODbL), via Nominatim.

## Fontes

- Inter, Cormorant Garamond, Noto Sans Symbols e Noto Sans Symbols 2 (SIL Open Font License), via Google Fonts.
