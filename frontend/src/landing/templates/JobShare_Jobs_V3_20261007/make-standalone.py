from pathlib import Path
import re,base64,mimetypes
root=Path(__file__).parent;dist=root/'dist';out=root/'standalone';out.mkdir(exist_ok=True)
def data(p):return 'data:'+str(mimetypes.guess_type(p.name)[0] or 'application/octet-stream')+';base64,'+base64.b64encode(p.read_bytes()).decode()
css='\n'.join((dist/f).read_text() for f in ['fonts.css','v3.css','jobs.css','filters-v3.css'])
css=re.sub(r'url\([\'\"]?([^\)\'\"]+)[\'\"]?\)',lambda m:'url("'+data(dist/m[1])+'")' if (dist/m[1]).is_file() else m[0],css)
js='\n'.join(re.sub(r'^import .*?;\n','',re.sub(r'\bexport ','',(dist/f).read_text()),flags=re.M) for f in ['content.js','filter-model.js','model.js','ui.js','picker.js','app.js'])
js='function e(value){return escapeHtml(value)}\n'+js
js=js.replace('`/${a.dataset.lang}/jobs${state.size?', '`./JobShare_Jobs_${a.dataset.lang.toUpperCase()}_V3.html${state.size?')
# Browsers may disallow history manipulation on file URLs; filtering still works.
js=js.replace("history.pushState({},'',`${location.pathname}${state.size?'?'+state:''}`);", "try{history.pushState({},'',`${location.pathname}${state.size?'?'+state:''}`);}catch{}")
for lang in ['vi','en','ja']:
 s=(dist/f'{lang}/jobs/index.html').read_text()
 s=re.sub(r'<link rel="stylesheet"[^>]+>','',s).replace('</head>','<style>'+css+'</style></head>')
 s=s.replace('<script type="module" src="/app.js"></script>','<script>(()=>{'+js+'})();</script>')
 s=re.sub(r'(src|href)="(/assets/[^\"]+)"',lambda m:m[1]+'="'+data(dist/m[2].lstrip('/'))+'"',s)
 for loc in ['vi','en','ja']:s=s.replace('href="/'+loc+'/jobs"','href="./JobShare_Jobs_'+loc.upper()+'_V3.html"')
 (out/f'JobShare_Jobs_{lang.upper()}_V3.html').write_text(s)
print('Created 3 self-contained HTML files')
