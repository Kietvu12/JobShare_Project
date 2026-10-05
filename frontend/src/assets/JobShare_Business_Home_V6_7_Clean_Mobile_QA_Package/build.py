from pathlib import Path
import html, shutil, sys, base64, mimetypes
ROOT=Path(__file__).parent
sys.path.insert(0,str(ROOT/'source'))
from content import COPY

CSS=(ROOT/'dist/jobshare-home-v2.css').read_text()
JS=(ROOT/'dist/jobshare-home-v2.js').read_text()

ICON={
'mechanical':'<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M8 3h8l1 4 3 2-2 4 1 4-4 1-3 3-3-3-4-1 1-4-2-4 3-2 1-4Z"/><circle cx="12" cy="12" r="3"/></svg>',
'electrical':'<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M13 2 5 13h6l-1 9 9-12h-6V2Z"/></svg>',
'it':'<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="4" width="18" height="13" rx="1"/><path d="M8 21h8M12 17v4M8 9l-2 2 2 2M16 9l2 2-2 2M14 7l-4 8"/></svg>',
'construction':'<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 21h18M5 21V8l7-5 7 5v13M9 21v-5h6v5M8 10h2M14 10h2"/></svg>',
'manufacturing':'<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 21V9l5 3V8l5 4V7l8 4v10H3Z"/><path d="M7 16h2M12 16h2M17 16h2"/></svg>'}

def esc(s): return html.escape(str(s), quote=True)
def lines(s): return ''.join('<span class="heading-line">'+esc(x)+'</span>' for x in str(s).split('\n'))

def routes(lang):
    return {
      'register':f'https://test.ws-jobshare.com/business/register?lang={lang}',
      'contact':f'https://test.ws-jobshare.com/{lang}/business/contact_rc',
      'documents':f'https://test.ws-jobshare.com/{lang}/business/inquiry_docs_rc',
      'services':f'https://test.ws-jobshare.com/{lang}/business/price'
    }

def platform_text(lang):
    if lang=='ja': return {
      'menu':'RECRUITMENT','jobs':'求人管理','candidates':'候補者','partners':'採用パートナー','invoices':'費用・請求','role':'機械設計エンジニア','draft':'求人を作成','all':'候補者','screening':'選考中','offer':'内定','name':'候補者','source':'採用経路','status':'進捗','a':'候補者 A','b':'候補者 B','c':'候補者 C','direct':'ダイレクト','ws':'Workstation','partner':'パートナー','review':'書類確認','interview':'面接調整','offered':'内定','ai':'AI求人作成支援','ai2':'募集要件から下書きを作成'}
    if lang=='en': return {
      'menu':'RECRUITMENT','jobs':'Jobs','candidates':'Candidates','partners':'Partners','invoices':'Costs / Invoices','role':'Mechanical Design Engineer','draft':'Create job','all':'Candidates','screening':'In selection','offer':'Offers','name':'Candidate','source':'Source','status':'Status','a':'Candidate A','b':'Candidate B','c':'Candidate C','direct':'Direct','ws':'Workstation','partner':'Partner','review':'CV review','interview':'Interview','offered':'Offer','ai':'AI job creation','ai2':'Create a draft from requirements'}
    return {
      'menu':'RECRUITMENT','jobs':'Vị trí tuyển','candidates':'Ứng viên','partners':'HR Partner','invoices':'Chi phí / Hóa đơn','role':'Kỹ sư thiết kế cơ khí','draft':'Tạo JD','all':'Ứng viên','screening':'Đang tuyển chọn','offer':'Offer','name':'Ứng viên','source':'Nguồn','status':'Tiến độ','a':'Ứng viên A','b':'Ứng viên B','c':'Ứng viên C','direct':'Trực tiếp','ws':'Workstation','partner':'Partner','review':'Check CV','interview':'Xếp lịch PV','offered':'Offer','ai':'AI hỗ trợ tạo JD','ai2':'Tạo bản nháp từ yêu cầu tuyển'}

def locale_switch(lang, mode='root'):
    labels={'ja':'JA','en':'EN','vi':'VI'}
    if mode=='dist':
        files={'ja':'index-ja.html','en':'index-en.html','vi':'index-vi.html'}
    elif mode=='standalone':
        files={'ja':'JobShare_Business_Home_JA_V6_7_STANDALONE.html','en':'JobShare_Business_Home_EN_V6_7_STANDALONE.html','vi':'JobShare_Business_Home_VI_V6_7_STANDALONE.html'}
    else:
        files={'ja':'JobShare_Business_Home_JA_V6_7.html','en':'JobShare_Business_Home_EN_V6_7.html','vi':'JobShare_Business_Home_VI_V6_7.html'}
    a=[]
    for k in ('ja','en','vi'):
      cur=' aria-current="page"' if k==lang else ''
      a.append(f'<a href="{files[k]}"{cur}>{labels[k]}</a>')
    return '<nav class="locale-switch" aria-label="Language preview">'+''.join(a)+'</nav>'

def render(lang, asset_prefix='assets/', include_switch=True, switch_mode='root'):
    c=COPY[lang]; r=routes(lang); p=platform_text(lang)
    badge=f'{asset_prefix}trust-{lang}.png'
    field_icons=['mechanical','electrical','it','construction','manufacturing']
    field_html=''.join(f'''<article class="field-card" data-reveal data-spotlight data-press tabindex="0"><div class="field-top"><span class="field-no">{esc(f[0])}</span><span class="field-en">{esc(f[1])}</span></div><div class="field-icon">{ICON[field_icons[i]]}</div><h3>{esc(f[2])}</h3><p>{esc(f[3])}</p><div class="chips"><span>{esc(f[4])}</span><span>{esc(f[5])}</span><span>{esc(f[6])}</span></div></article>''' for i,f in enumerate(c['fields']))
    challenge_html=''.join(f'''<article class="challenge-row" data-reveal data-spotlight><div class="challenge-no">{esc(x[0])}</div><div class="challenge-label">{esc(x[1])}</div><div class="challenge-main"><h3>{esc(x[2])}</h3><p>{esc(x[3])}</p></div></article>''' for x in c['challenges'])
    service_html=''.join(f'''<article class="service-card" data-reveal data-spotlight data-press tabindex="0"><span class="service-en">{esc(x[0])}</span><h3>{esc(x[1])}</h3><p>{esc(x[2])}</p><div class="service-meta"><span>{esc(x[3])}</span><span>{esc(x[4])}</span></div></article>''' for x in c['services'])
    flow_html=''.join(f'''<article class="flow-step" data-reveal><b>{esc(x[0])}</b><h3>{esc(x[1])}</h3><p>{esc(x[2])}</p></article>''' for x in c['flow'])
    support_tags=''.join(f'<span>{esc(x)}</span>' for x in c['support_tags'])
    faq_html=''.join(f'''<details><summary><span class="faq-q">Q.</span><strong>{esc(q)}</strong><span class="faq-plus">+</span></summary><div class="faq-answer"><b>A.</b><p>{esc(a)}</p></div></details>''' for q,a in c['faqs'])
    switch=locale_switch(lang, switch_mode) if include_switch else ''
    proof_sr={'ja':['技術系外国人材データベース 40,000+','HRパートナーネットワーク 500+','AI外国人採用プラットフォーム 東南アジア初'], 'en':['Skilled Foreign Talent Database 40,000+','HR Partner Network 500+','AI Recruitment Platform — First in Southeast Asia'], 'vi':['Kho dữ liệu nhân sự kỹ thuật 40,000+','Mạng lưới HR Partner 500+','Nền tảng tuyển dụng tích hợp AI — Đầu tiên tại Đông Nam Á']}[lang]
    body=f'''<main class="jsb-v2" id="jobshare-business-v2" lang="{c['html_lang']}"><div class="read-progress" aria-hidden="true"></div>{switch}
<section class="hero" aria-labelledby="v2-title"><img class="hero-bg-photo" src="{asset_prefix}city-photo-bg.png" alt="" aria-hidden="true"><div class="wrap hero-inner">
 <div class="hero-copy"><p class="kicker">{esc(c['final_kicker'])}</p><h1 id="v2-title">{lines(c['hero_title'])}</h1><p class="hero-lead">{esc(c['hero_body'])}</p><div class="hero-actions"><a class="btn btn-yellow" data-route="documents" href="{r['documents']}">{esc(c['download'])}<span class="arr">↓</span></a><a class="btn btn-white" data-route="register" href="{r['register']}">{esc(c['register'])}<span class="arr">→</span></a><a class="btn btn-consult" data-route="contact" href="{r['contact']}">{esc(c['contact'])}<span class="arr">→</span></a></div></div>
 <div class="hero-visual" aria-hidden="true"><img class="hero-person" src="{asset_prefix}hero-person.png" alt=""></div>
</div></section>
<section class="hero-proof" aria-label="JobShare performance"><div class="wrap"><div class="trust-scroll" data-reveal="scale"><img class="trust-image" src="{badge}" alt=""><span class="sr-only">{' / '.join(map(esc,proof_sr))}</span></div><p class="proof-note">{esc(c['proof_note'])}</p></div></section>
<section class="legacy-jobshare" aria-labelledby="legacy-title"><div class="legacy-watermark" aria-hidden="true">JobShare</div><div class="wrap legacy-grid"><div class="legacy-video" data-reveal="left"><a class="legacy-video-link" href="https://www.youtube.com/watch?v=s-qy-EaoOXg" target="_blank" rel="noopener noreferrer" aria-label="{esc(c['video_title'])}"><img src="{asset_prefix}jobshare-video-poster.png" alt="{esc(c['video_title'])}"><span class="sr-only">YouTube</span></a></div><div class="legacy-copy" data-reveal="right"><p class="kicker">{esc(c['legacy_kicker'])}</p><h2 id="legacy-title">{lines(c['legacy_title'])}</h2><p>{esc(c['legacy_body'])}</p></div></div></section>
<section class="quick-cta" aria-label="Quick check"><div class="wrap"><div class="quick-box" data-reveal><div class="quick-copy"><span>{esc(c['quick_pre'])}</span><strong><em>{esc(c['quick_big'])}</em></strong></div><a class="btn quick-btn" data-route="contact" href="{r['contact']}">{esc(c['quick_btn'])}<span class="arr">→</span></a></div></div></section>
<section class="section about" aria-labelledby="about-title"><div class="wrap about-grid"><div class="about-copy" data-reveal="left"><p class="kicker">{esc(c['about_kicker'])}</p><h2 id="about-title">{lines(c['about_title'])}</h2><p>{esc(c['about_body1'])}</p><p>{esc(c['about_body2'])}</p><div class="about-note"><b>{esc(c['about_note'])}</b><p>{esc(c['about_note_body'])}</p></div></div><figure class="about-media image-reveal" data-reveal="clip" data-image-parallax><img src="{asset_prefix}engineering-team.png" alt="{'技術人材チームのイメージ' if lang=='ja' else 'Illustration of a technical team' if lang=='en' else 'Hình ảnh minh họa đội ngũ kỹ thuật'}"><figcaption class="media-label">TECHNICAL TALENT × JAPAN</figcaption></figure></div></section>
<section class="section fields" aria-labelledby="fields-title"><div class="wrap"><div class="section-head" data-reveal><div><p class="kicker">{esc(c['fields_kicker'])}</p><h2 id="fields-title">{lines(c['fields_title'])}</h2></div><p>{esc(c['fields_body'])}</p></div><figure class="fields-media image-reveal" data-reveal="clip" data-image-parallax><img src="{asset_prefix}technical-team.png" alt="{'技術系人材チームのイメージ' if lang=='ja' else 'Technical professionals collaborating' if lang=='en' else 'Hình ảnh đội ngũ nhân sự kỹ thuật'}"><figcaption class="media-label">TECHNICAL PROFESSIONALS / TEAMWORK</figcaption></figure><div class="field-grid" data-stagger>{field_html}</div></div></section>
<section class="section challenges" aria-labelledby="ch-title"><div class="wrap"><div class="section-head" data-reveal><div><p class="kicker">{esc(c['ch_kicker'])}</p><h2 id="ch-title">{lines(c['ch_title'])}</h2></div><p>{esc(c['ch_body'])}</p></div><div class="challenge-list" data-stagger>{challenge_html}</div></div></section>
<section class="section solutions" aria-labelledby="solution-title"><div class="wrap"><div class="section-head" data-reveal><div><p class="kicker">{esc(c['solution_kicker'])}</p><h2 id="solution-title">{lines(c['solution_title'])}</h2></div><p>{esc(c['solution_body'])}</p></div><div class="service-grid" data-stagger>{service_html}</div><div class="service-cta"><a class="text-link" data-route="services" href="{r['services']}">{esc(c['service_more'])}<span>→</span></a></div></div></section>
<section class="mid-cta"><div class="wrap mid-grid"><div data-reveal><p class="kicker">{esc(c['mid_kicker'])}</p><h2>{esc(c['mid_title'])}</h2><p>{esc(c['mid_body'])}</p></div><a class="btn btn-blue" data-route="register" href="{r['register']}" data-reveal>{esc(c['mid_button'])}<span class="arr">↗</span></a></div></section>
<section class="section platform" aria-labelledby="platform-title"><div class="wrap platform-grid"><div class="platform-copy" data-reveal="left"><p class="kicker">{esc(c['platform_kicker'])}</p><h2 id="platform-title">{lines(c['platform_title'])}</h2><p>{esc(c['platform_body'])}</p><p class="platform-caption">{esc(c['platform_caption'])}</p></div><figure class="platform-media image-reveal" data-reveal="clip" data-image-parallax><img src="{asset_prefix}platform-showcase.png" alt="{'JobShare Business の画面イメージ' if lang=='ja' else 'JobShare Business dashboard illustration' if lang=='en' else 'Hình minh họa dashboard JobShare Business'}"></figure></div></section>
<section class="section flow" aria-labelledby="flow-title"><div class="wrap"><div class="section-head" data-reveal><div><p class="kicker">{esc(c['flow_kicker'])}</p><h2 id="flow-title">{lines(c['flow_title'])}</h2></div><p>{esc(c['flow_body'])}</p></div><div class="flow-board" data-stagger data-flow-sequence>{flow_html}</div></div></section>
<section class="section support" aria-labelledby="support-title"><div class="wrap support-grid"><figure class="support-media image-reveal" data-reveal="clip" data-image-parallax><img src="{asset_prefix}recruitment-consultation.png" alt="{'採用相談のイメージ' if lang=='ja' else 'Recruitment consultation illustration' if lang=='en' else 'Hình ảnh minh họa tư vấn tuyển dụng'}"></figure><div class="support-copy" data-reveal="right"><p class="kicker">{esc(c['support_kicker'])}</p><h2 id="support-title">{lines(c['support_title'])}</h2><p>{esc(c['support_body'])}</p><div class="support-tags">{support_tags}</div><a class="btn btn-blue" data-route="contact" href="{r['contact']}">{esc(c['support_btn'])}<span class="arr">→</span></a></div></div></section>
<section class="section faq" aria-labelledby="faq-title"><div class="wrap"><div class="section-head" data-reveal><div><p class="kicker">{esc(c['faq_kicker'])}</p><h2 id="faq-title">{esc(c['faq_title'])}</h2></div></div><div class="faq-list" data-reveal>{faq_html}</div></div></section>
<section class="final" aria-labelledby="final-title"><div class="wrap final-inner"><div class="final-person-wrap" aria-hidden="true"><img class="final-person" src="{asset_prefix}final-person.png" alt=""></div><div class="final-copy" data-reveal><p class="kicker">{esc(c['final_kicker'])}</p><h2 id="final-title">{lines(c['final_title'])}</h2><p>{esc(c['final_body'])}</p><div class="final-actions"><a class="btn btn-yellow" data-route="documents" href="{r['documents']}">{esc(c['download'])}<span class="arr">↓</span></a><a class="btn btn-white" data-route="contact" href="{r['contact']}">{esc(c['contact'])}<span class="arr">→</span></a><a class="final-phone" href="tel:08094411975">☎ <b>080-9441-1975</b> <span>{esc(c['hours'])}</span></a></div><p class="final-note">{esc(c['final_note'])}</p></div></div></section>
<nav class="mobile-cta" aria-label="Mobile call to action"><a data-route="contact" href="{r['contact']}">{esc(c['contact'])}</a><a data-route="register" href="{r['register']}">{esc(c['register'])}</a></nav>
</main>'''
    return body

def document(lang, switch_mode='root'):
    c=COPY[lang]
    body=render(lang,'assets/',True,switch_mode)
    return f'''<!doctype html><html lang="{c['html_lang']}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>{esc(c['title'])}</title><meta name="description" content="{esc(c['description'])}"><style>html{{scroll-behavior:smooth}}body{{margin:0;background:#fff}}{CSS}</style></head><body>{body}<script>{JS}</script><script>window.initJobShareHomeV2(document.querySelector('.jsb-v2'));</script></body></html>'''

def as_data_uri(path):
    mime=mimetypes.guess_type(path.name)[0] or 'application/octet-stream'
    data=base64.b64encode(path.read_bytes()).decode('ascii')
    return f'data:{mime};base64,{data}'

def inline_assets(doc):
    # Make the STANDALONE preview truly self-contained, including the hero city background.
    assets=[
      'city-photo-bg.png','hero-person.png','final-person.png','jobshare-video-poster.png',
      'engineering-team.png','technical-team.png','platform-showcase.png','recruitment-consultation.png',
      'trust-ja.png','trust-en.png','trust-vi.png'
    ]
    for name in assets:
        marker=f'assets/{name}'
        if marker in doc:
            doc=doc.replace(marker,as_data_uri(ROOT/'assets'/name))
    return doc

# build locale pages and integration fragments
names={'ja':'JA','en':'EN','vi':'VI'}
for lang,suffix in names.items():
    doc=document(lang)
    (ROOT/f'JobShare_Business_Home_{suffix}_V6_7.html').write_text(doc,encoding='utf-8')
    standalone=inline_assets(document(lang,'standalone'))
    (ROOT/'standalone'/f'JobShare_Business_Home_{suffix}_V6_7_STANDALONE.html').write_text(standalone,encoding='utf-8')
    # dist pages reference assets one level up
    c=COPY[lang]; body=render(lang,'../assets/',True,'dist')
    dist=f'''<!doctype html><html lang="{c['html_lang']}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>{esc(c['title'])}</title><meta name="description" content="{esc(c['description'])}"><link rel="stylesheet" href="jobshare-home-v2.css"></head><body style="margin:0">{body}<script src="jobshare-home-v2.js"></script><script>window.initJobShareHomeV2(document.querySelector('.jsb-v2'));</script></body></html>'''
    (ROOT/'dist'/f'index-{lang}.html').write_text(dist,encoding='utf-8')
    # integration assumes assets are copied to public /jobshare-home-v2/assets/
    frag=render(lang,'/jobshare-home-v2/assets/',False)
    (ROOT/'integration'/f'content-{lang}.html').write_text(frag,encoding='utf-8')

# convenience index -> JA
shutil.copy2(ROOT/'dist/index-ja.html',ROOT/'dist/index.html')
shutil.copy2(ROOT/'dist/jobshare-home-v2.css',ROOT/'integration/jobshare-home-v2.css')
shutil.copy2(ROOT/'dist/jobshare-home-v2.js',ROOT/'integration/jobshare-home-v2.js')
print('Built revised V6.7 JA/EN/VI pages, standalone files and integration fragments.')
