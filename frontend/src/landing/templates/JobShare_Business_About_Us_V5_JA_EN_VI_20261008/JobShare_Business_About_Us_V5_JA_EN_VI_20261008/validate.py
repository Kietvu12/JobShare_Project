from pathlib import Path
from html.parser import HTMLParser
import json,re
R=Path(__file__).parent;D=json.loads((R/'data/company-data.json').read_text())
class Doc(HTMLParser):
 def __init__(self):super().__init__();self.ids=[];self.refs=[];self.images=[];self.text=[];self.h1=0
 def handle_starttag(self,t,a):
  a=dict(a)
  if 'id' in a:self.ids.append(a['id'])
  if t=='a':self.refs.append(a.get('href',''))
  if t=='img':self.images.append(a)
  if t=='h1':self.h1+=1
 def handle_data(self,d):self.text.append(d)
for lang in ['ja','en','vi']:
 p=R/'dist'/f'index-{lang}.html';s=p.read_text();doc=Doc();doc.feed(s)
 assert doc.h1==1 and len(doc.ids)==len(set(doc.ids)),lang
 for ref in doc.refs:
  if ref.startswith('#'):assert ref[1:] in doc.ids,(lang,ref)
  elif not re.match('https?://|tel:',ref):assert (p.parent/ref).exists(),(lang,ref)
 for im in doc.images:assert (p.parent/im['src']).exists() and 'alt' in im,(lang,im)
 for key in ['name','address','license','representative','website']:
  assert D['companies']['seta'][key] in s,(lang,key)
 for key in ['display','address']:
  assert D['companies']['workstation'][key] in s,(lang,key)
 for old in ['株式会社ワークステーション','Thank Asia','サンクアジア','address conflict','frontier-gr.jp']:
  assert old not in s,(lang,old)
 assert all(('hreflang="'+l+'"') in s for l in ['ja','en','vi','x-default']),(lang,'hreflang')
 assert s.count('about-business-hero.webp')==1,(lang,'hero image')
 assert '<figcaption>JAPAN × VIETNAM</figcaption>' not in s,(lang,'hero badge')
 assert 'JOBSHARE BUSINESS' in s and 'for Business' not in s,(lang,'brand')
 print(lang.upper()+': facts, links, images, locale metadata, branding and hero badge checks passed')

# Japanese factual/source text retention.
ja=(R/'dist/index-ja.html').read_text()
class TextOnly(HTMLParser):
 def __init__(self):super().__init__();self.content=[]
 def handle_data(self,data):self.content.append(data)
parser=TextOnly();parser.feed(ja);visible=''.join(parser.content)
for k in ['mission','vision','structure','connection','cta']:assert D['ja'][k] in visible,k
for x in D['ja']['intro']+D['ja']['scope']+list(D['ja']['roles'].values()):assert x in visible,x[:30]
for row in D['ja']['strengths']:
 for x in row:assert x in visible,x[:30]
print('JA: source paragraphs retained')

css=(R/'dist/about-us.css').read_text()
assert 'aspect-ratio:1.34' not in css and 'aspect-ratio:1.25' not in css and 'aspect-ratio:2.15' not in css
assert 'aspect-ratio:16/9' in css
assert '.jsb-v5.jsb-about[lang="vi"] .about-hero h1' in css
assert '.jsb-v5.jsb-about .about-hero-media figcaption{display:none!important}' in css
print('V5 CSS checks passed')
