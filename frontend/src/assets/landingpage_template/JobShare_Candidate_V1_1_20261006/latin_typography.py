"""Small visible-text boundary helpers for VI/EN.
Keeps brand/geography phrases together without changing source copy or metadata.
"""
from html.parser import HTMLParser
from html import escape
import re
ATOMS={
 'vi':['Workstation JobShare','Nhật Bản'],
 'en':['Workstation JobShare'],
}
class Transform(HTMLParser):
 def __init__(self,lang):
  super().__init__(convert_charrefs=False);self.lang=lang;self.out=[];self.skip=0
  alt='|'.join(re.escape(x) for x in sorted(ATOMS.get(lang,[]),key=len,reverse=True))
  self.rx=re.compile(alt) if alt else None
 def handle_starttag(self,t,a):
  self.out.append(self.get_starttag_text())
  if t in ['script','style','title']:self.skip+=1
 def handle_endtag(self,t):
  self.out.append('</'+t+'>')
  if t in ['script','style','title']:self.skip-=1
 def handle_startendtag(self,t,a):self.out.append(self.get_starttag_text())
 def handle_entityref(self,n):self.out.append('&'+n+';')
 def handle_charref(self,n):self.out.append('&#'+n+';')
 def handle_decl(self,d):self.out.append('<!'+d+'>')
 def handle_data(self,d):
  if self.skip or not self.rx:self.out.append(d);return
  last=0
  for m in self.rx.finditer(d):
   self.out.append(escape(d[last:m.start()]))
   self.out.append('<span class="no-split">'+escape(m[0])+'</span>')
   last=m.end()
  self.out.append(escape(d[last:]))
def apply(html,lang):
 t=Transform(lang);t.feed(html);return ''.join(t.out)
