import json,pathlib,html
root=pathlib.Path(__file__).resolve().parent
snap=json.loads((root/'data/source-detail.json').read_text())
jobs=json.loads((root/'data/list-jobs.json').read_text())
cats=json.loads((root/'data/categories.json').read_text())
for lang in ['vi','en','ja']:
 demo=next(x for x in jobs if x['id']==708)
 title=demo['title'+({'vi':'','en':'En','ja':'Jp'}[lang])]
 j=json.dumps({'demoId':708,'snapshots':snap,'jobs':jobs,'categories':cats},ensure_ascii=False,separators=(',',':')).replace('<','\\u003c').replace('>','\\u003e').replace('&','\\u0026')
 page=f'''<!doctype html><html lang="{lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#ed212f"><title>{html.escape(title)} | Workstation JobShare</title><meta name="description" content="{html.escape(title)} - Workstation JobShare"><link rel="canonical" href="https://ws-jobshare.com/{lang}/jobs/708">{''.join(f'<link rel="alternate" hreflang="{l}" href="https://ws-jobshare.com/{l}/jobs/708">' for l in ['vi','en','ja'])}<link rel="icon" href="../../../assets/jobshare-logo.png"><link rel="stylesheet" href="../../../assets/v3.css"><link rel="stylesheet" href="../../../assets/detail.css"></head><body><div id="app"></div><script id="job-data" type="application/json">{j}</script><script defer src="../../../assets/app.js"></script></body></html>'''
 path=root/lang/'jobs'/'708'/'index.html';path.parent.mkdir(parents=True,exist_ok=True);path.write_text(page,encoding='utf-8')
 print(path.relative_to(root),len(page))
