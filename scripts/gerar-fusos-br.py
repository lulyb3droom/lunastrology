"""Gera tests/fixtures/fusos-br.json: UTC esperado para datas brasileiras (zoneinfo, independente do site).
Uso: python scripts/gerar-fusos-br.py   (ferramenta de desenvolvimento; precisa do pacote tzdata no Windows)"""
import json, random
from datetime import datetime, timezone, timedelta
from zoneinfo import ZoneInfo

random.seed(42)
zonas = ["America/Sao_Paulo", "America/Recife", "America/Manaus", "America/Rio_Branco", "America/Fortaleza",
         "America/Bahia", "America/Campo_Grande", "America/Cuiaba", "America/Belem", "America/Noronha",
         "America/Araguaina", "America/Maceio", "America/Porto_Velho", "America/Boa_Vista", "America/Eirunepe"]
casos = []
for _ in range(900):
    z = random.choice(zonas)
    d = datetime(1960, 1, 1) + timedelta(days=random.randint(0, 365 * 65))
    h = random.choice([3, 9, 12, 15, 18, 22])
    local = datetime(d.year, d.month, d.day, h, random.choice([0, 15, 30, 45]), tzinfo=ZoneInfo(z))
    # descarta horas ambíguas/inexistentes (tratadas em testes próprios)
    utc = local.astimezone(timezone.utc)
    if utc.astimezone(ZoneInfo(z)).replace(tzinfo=None) != local.replace(tzinfo=None):
        continue
    if local.replace(fold=1).utcoffset() != local.replace(fold=0).utcoffset():
        continue
    casos.append({"date": local.strftime("%Y-%m-%d"), "time": local.strftime("%H:%M"), "tz": z,
                  "utc": utc.strftime("%Y-%m-%dT%H:%M:00.000Z"), "offsetMin": int(local.utcoffset().total_seconds() // 60)})
json.dump(casos, open("tests/fixtures/fusos-br.json", "w"), indent=0)
print(len(casos), "casos;", len({c["offsetMin"] for c in casos}), "deslocamentos distintos")

# fatos de borda para conferência manual
z = ZoneInfo("America/Sao_Paulo")
for s in ["1992-02-08 23:30", "2008-10-19 00:30"]:
    dt = datetime.strptime(s, "%Y-%m-%d %H:%M")
    a, b = dt.replace(tzinfo=z, fold=0), dt.replace(tzinfo=z, fold=1)
    print(s, "fold0", a.utcoffset(), "fold1", b.utcoffset())
