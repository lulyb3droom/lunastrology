"""Converte hora local -> UTC com zoneinfo (caminho independente do que o site usa).
Uso: python utc-gabarito.py entrada.json saida.json   (ferramenta de desenvolvimento)"""
import json, sys
from datetime import datetime, timezone
from zoneinfo import ZoneInfo

casos = json.load(open(sys.argv[1], encoding="utf-8"))
for c in casos:
    local = datetime.strptime(f"{c['date']} {c['time']}", "%Y-%m-%d %H:%M").replace(tzinfo=ZoneInfo(c["tz"]))
    c["utc"] = local.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    c["offsetMin"] = int(local.utcoffset().total_seconds() // 60)
json.dump(casos, open(sys.argv[2], "w", encoding="utf-8"), ensure_ascii=False, indent=1)
