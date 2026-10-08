"""Presentation-only Japanese phrase boundaries inherited from V3.
Only visible body text is touched; title/meta/script/style/JSON stay unchanged.
The V1.1 pass adds a small set of lexical atoms found during rendered line-break QA.
"""
from html.parser import HTMLParser
from html import escape
import re

PHRASES=[
 ['キャリアを一段上へ'],['確かな未来へ'],['エンジニア求人'],['JobShareで探す'],
 ['求職者向け無料機能 4つ'],['始める準備は'],['できていますか'],
 ['本日の注目求人'],['主要パートナー']
]
LOOKUP={''.join(a):a for a in PHRASES}

# Keep product/Latin tokens and a few Japanese lexical units intact. These are deliberately
# short: the browser still controls line wrapping, but it cannot split inside the unit.
ATOMS=[
 '「マッチング」度','高い求人','求職者プロフィール','募集中の求人','希望条件','ステータス',
 'すばやく確認','提供します','最適化を行います','提案します','応募精度を高めます',
 '通過率向上を支援します','迅速にサポートします','更新しています','選ぶことができます',
 '応募を始められます','応募できます','ご案内します','検索できます','自動作成します',
 '保存・管理できます','改善提案を受け取れます','ステータスを確認できます','素早く連携できます',
 '一元管理できます','参加できます','申し込みできます','お届けします','見つけましょう',
 '日本での多くの','求人機会','利用は完全無料です','プラットフォームです'
]
ATOM_ALT='|'.join(re.escape(x) for x in sorted(ATOMS,key=len,reverse=True))
TOKEN=re.compile(r'(?:'+ATOM_ALT+r'|(?:Workstation|JobShare|JLPT|AI|CV|3分)(?:から|まで|[はがをにでとのへも])?)')

class Transform(HTMLParser):
 def __init__(self):
  super().__init__(convert_charrefs=False);self.out=[];self.skip=0;self.inhead=0
 def handle_starttag(self,t,a):
  self.out.append(self.get_starttag_text())
  if t in ['script','style','title']:self.skip+=1
  if t in ['h1','h2','h3','h4']:self.inhead+=1
 def handle_endtag(self,t):
  self.out.append('</'+t+'>')
  if t in ['script','style','title']:self.skip-=1
  if t in ['h1','h2','h3','h4']:self.inhead-=1
 def handle_startendtag(self,t,a):self.out.append(self.get_starttag_text())
 def handle_entityref(self,n):self.out.append('&'+n+';')
 def handle_charref(self,n):self.out.append('&#'+n+';')
 def handle_decl(self,d):self.out.append('<!'+d+'>')
 def handle_data(self,d):
  if self.skip:self.out.append(d);return
  if self.inhead and d in LOOKUP:
   self.out.append(''.join('<span class="ja-phrase">'+escape(p)+'</span>' for p in LOOKUP[d]));return
  last=0
  for m in TOKEN.finditer(d):
   self.out.append(escape(d[last:m.start()]))
   self.out.append('<span class="no-split">'+escape(m[0])+'</span>')
   last=m.end()
  self.out.append(escape(d[last:]))

def apply(html):
 t=Transform();t.feed(html);return ''.join(t.out)
