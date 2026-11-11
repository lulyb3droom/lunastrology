# Scripts de desenvolvimento

Estes scripts geram os "gabaritos" usados nos testes. **Não fazem parte do site** e normalmente você não precisa rodá-los de novo: os arquivos gerados já estão em `tests/fixtures/`.

## Gabarito dos mapas (Swiss Ephemeris)

O Swiss Ephemeris tem licença AGPL, por isso fica **fora** do projeto (instalado numa pasta à parte, só para gerar os dados de teste).

1. Numa pasta qualquer fora do projeto: `npm init -y` e `npm install sweph`.
2. `python scripts/utc-gabarito.py scripts/mapas-referencia-entrada.json casos-utc.json` (converte a hora local para UTC usando o Python, um caminho independente do site).
3. `SWEPH_DIR=<pasta do passo 1> node scripts/gerar-gabarito.mjs casos-utc.json` → atualiza `tests/fixtures/mapas-referencia.json`.

## Gabarito de fusos do Brasil

`python scripts/gerar-fusos-br.py` → atualiza `tests/fixtures/fusos-br.json` (precisa do pacote `tzdata` do Python no Windows).
