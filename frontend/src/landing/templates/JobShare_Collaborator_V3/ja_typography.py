"""Presentation-only Japanese phrase boundaries; never changes the source words."""
from html.parser import HTMLParser
from html import escape
import re
PHRASES=[
 ['始める準備は'],['できていますか'],
 ['日系エンジニア採用','コラボレーター'],['コミュニティ','日本最大級'],
 ['JobShareのAI技術で、','日本基準の履歴書を','わずか3分で。','プロ品質の','職務経歴書を'],
 ['3つの簡単なステップ'],['JobShare','コラボレーターになる'],
 ['200社超の','日本企業パートナー'],['外国人人材を募集'],
 ['10年以上の','採用経験を持つ','チームと連携'],['日本企業からの','多様な求人を','継続的に更新'],
 ['経験不要 - ','詳細なサポートあり'],['明確な報酬制度：','25%から','最大50%まで'],
 ['無料で使える','4つの機能'],['採用イベントの','更新と直接申込み'],
 ['候補者プロフィールの','管理'],['採用プロセスの管理'],['求人データベースへ','アクセス'],
 ['推薦プロセスの','伴走と報酬受取'],['採用のチャンスを','つかむ'],['進捗を効率的に管理'],['連携とAIサポート']]
LOOKUP={''.join(a):a for a in PHRASES}
TOKEN=re.compile(r'(?:Workstation|JobShare|JLPT|AI|CV|25%|50%|3分|200社|10年以上)(?:から|まで|[はがをにでとのへも])?')
class Transform(HTMLParser):
 def __init__(self):super().__init__(convert_charrefs=False);self.out=[];self.skip=0;self.inhead=0
 def handle_starttag(self,t,a):
  self.out.append(self.get_starttag_text())
  if t in ['script','style']:self.skip+=1
  if t in ['h1','h2','h3']:self.inhead+=1
 def handle_endtag(self,t):
  self.out.append('</'+t+'>')
  if t in ['script','style']:self.skip-=1
  if t in ['h1','h2','h3']:self.inhead-=1
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
   self.out.append(escape(d[last:m.start()]));self.out.append('<span class="no-split">'+escape(m[0])+'</span>');last=m.end()
  self.out.append(escape(d[last:]))
def apply(html):
 t=Transform();t.feed(html);return ''.join(t.out)
