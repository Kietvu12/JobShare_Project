from pathlib import Path
import re,base64,mimetypes
root=Path(__file__).resolve().parent
out=root/'standalone';out.mkdir(exist_ok=True)
names={l:'JobShare_Collaborator_'+l.upper()+'_V3.html' for l in ['vi','en','ja']}
def embed(m):
 p=root/m.group(1);mime=mimetypes.guess_type(p)[0] or 'application/octet-stream';return 'data:'+mime+';base64,'+base64.b64encode(p.read_bytes()).decode()
css=(root/'fonts.css').read_text()+'\n'+(root/'styles.css').read_text()
css=re.sub(r'(?<=url\(")(assets/[^\"]+)(?="\))',embed,css)
for l,name in names.items():
 p=root/('index.html' if l=='vi' else 'index-'+l+'.html');s=p.read_text()
 s=s.replace('<link rel="stylesheet" href="fonts.css"><link rel="stylesheet" href="styles.css">','<style>'+css+'</style>').replace('<script src="app.js" defer></script>','')
 s=s.replace('</body>','<script>'+(root/'app.js').read_text()+'</script></body>')
 s=re.sub(r'(?<=["\'])(assets/[^"\']+)(?=["\'])',embed,s)
 for lang,filename in names.items():s=s.replace('href="'+('index.html' if lang=='vi' else 'index-'+lang+'.html')+'"','href="'+filename+'"')
 (out/name).write_text(s)
 print(name,len(s.encode()))
