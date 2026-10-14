from pathlib import Path
from lxml import html
import json,re
p=Path('JobShare_Business_Seminar_V2_20261008'); data=json.loads((p/'data/seminars.json').read_text());result=[]
for f in (p/'dist').rglob('*.html'):
 s=html.fromstring(f.read_text());ids=s.xpath('//*[@id]/@id');assert len(ids)==len(set(ids)),f
 assert len(s.xpath('//h1'))==1
 cards=s.xpath('//article[@data-category]');assert len(cards)==18
 for x in data:assert s.xpath('//a[@href=$u]',u=x['url'])
 assert s.xpath('//a[@href="tel:080-9441-1975"]')
 for node in s.xpath('//*[@src] | //link[@rel="stylesheet"]'):
  path=node.get('src') or node.get('href')
  if not path.startswith(('http','data:','/')):assert (f.parent/path).exists(),(f,path)
 for a in s.xpath('//a[starts-with(@href,"#")]'):assert a.get('href')[1:] in ids
 for el in s.xpath('//h1|//h2|//h3|//summary'):assert not el.xpath('.//br')
 if s.get('lang') in ['en','vi']:
  assert not re.search('[\u3040-\u30ff\u4e00-\u9fff]',s.xpath('//main')[0].text_content()),f
 result.append(str(f))
print('PASS:',len(result),'HTML pages; 18 original URLs each; local assets; unique IDs; anchors; localized content; heading line-break rules')
