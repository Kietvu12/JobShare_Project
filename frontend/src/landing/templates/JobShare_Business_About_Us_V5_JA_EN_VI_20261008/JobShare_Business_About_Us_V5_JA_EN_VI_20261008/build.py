from pathlib import Path
import json, html, re, base64

ROOT = Path(__file__).parent
OUT = ROOT / 'dist'
D = json.loads((ROOT / 'data/company-data.json').read_text())
e = lambda s: html.escape(str(s), quote=True)

UI = {
    'ja': dict(
        title='JobShare Businessについて｜会社情報・日越連携体制', about='会社概要', who='私たちについて',
        mission='私たちの使命', vision='目指す姿', strengths='Work Stationの強み',
        structure=['日本・ベトナム連携型の','エンジニアリング体制'], company='企業情報', scope='事業内容',
        final=['採用や技術業務について、','まずはご相談ください'], contact='採用相談', docs='資料ダウンロード',
        profile='企業情報を見る', name='会社名', est='設立', address='所在地', rep='代表取締役',
        license='有料職業紹介事業許可', website='ウェブサイト', phone='連絡先', partner='日本側連携企業・窓口',
        base='【ベトナム拠点】', hq='本社所在地', collab='Work Station × Seta Engineering 連携モデル',
        nav=['JobShare Businessとは','各サービス','セミナー・イベント','ニュース','会社概要'], register='無料で企業登録',
        login='ログイン', menu='メニュー', skip='本文へ'
    ),
    'en': dict(
        title='About JobShare Business | Japan–Vietnam Recruitment & Engineering', about='About us', who='Who we are',
        mission='Our mission', vision='Our vision', strengths='The strengths of Work Station',
        structure=['An integrated Japan–Vietnam','engineering framework'], company='Company information', scope='Business scope',
        final=['Talk to us about recruitment','and technical operations'], contact='Recruitment consultation', docs='Download materials',
        profile='View company information', name='Company name', est='Established', address='Address', rep='Representative Director',
        license='Paid employment placement license', website='Website', phone='Contact', partner='Japan-side partner & client contact',
        base='Vietnam base', hq='Head office', collab='Work Station × Seta Engineering collaboration model',
        nav=['About JobShare Business','Services','Seminars & events','News','About us'], register='Register your company',
        login='Log in', menu='Menu', skip='Skip to content'
    ),
    'vi': dict(
        title='Về JobShare Business | Tuyển dụng và kỹ thuật Nhật – Việt', about='Về chúng tôi', who='Về chúng tôi',
        mission='Sứ mệnh', vision='Tầm nhìn', strengths='Thế mạnh của Work Station',
        structure=['Mô hình kỹ thuật phối hợp','Nhật Bản – Việt Nam'], company='Thông tin công ty', scope='Lĩnh vực hoạt động',
        final=['Trao đổi với chúng tôi về tuyển dụng','và nghiệp vụ kỹ thuật'], contact='Tư vấn tuyển dụng', docs='Tải tài liệu',
        profile='Xem thông tin công ty', name='Tên công ty', est='Thành lập', address='Địa chỉ', rep='Giám đốc đại diện',
        license='Giấy phép giới thiệu việc làm có thu phí', website='Website', phone='Liên hệ', partner='Đối tác & đầu mối khách hàng tại Nhật',
        base='Cơ sở tại Việt Nam', hq='Trụ sở chính', collab='Mô hình hợp tác Work Station × Seta Engineering',
        nav=['Về JobShare Business','Dịch vụ','Hội thảo & sự kiện','Tin tức','Về chúng tôi'], register='Đăng ký doanh nghiệp',
        login='Đăng nhập', menu='Menu', skip='Đến nội dung'
    ),
}

JP_TOKENS = [
 ('株式会社Seta Engineering','token'),('WORK STATION.,JSC','token'),('Seta Engineering','token'),('Work Station','token'),
 ('NO.1リーディングカンパニー','phrase'),('包括的な技術パートナーシップ','phrase'),
 ('圧倒的な技術力','token'),('プロジェクトの価値','token'),('持続可能な社会基盤の構築','token'),('構築に貢献します','token'),
 ('プロジェクトマネジメント','token'),('リーディングカンパニー','token'),('日本語・ビジネスマナー教育','token'),
 ('企業の要件に応じた研修','token'),('ベトナム帰国後','token'),('日本向けの業務','token'),('キャリアの継続','token'),
 ('入社後のフォロー','token'),('企業へのヒアリング','token'),('人材の定着','token'),('継続的な活躍','token'),
 ('専属チーム構築','token'),('高度人材の紹介支援','token'),('外国人エンジニア','token'),('日本向けラボ型開発','token'),
 ('技術者育成','token'),('技術業務支援','token'),('BIM・建設DX','token'),('ラボ型開発','token'),('運用支援','token'),
 ('日本とベトナム','token'),('ベトナム','token'),('BIM','token'),('DX','token'),('IT','token')
]
JP_TOKENS.sort(key=lambda x: len(x[0]), reverse=True)
JP_TYPE = dict(JP_TOKENS)
JP_PATTERN = re.compile('|'.join(re.escape(x[0]) for x in JP_TOKENS))

def lines(items):
    return ''.join(f'<span class="heading-line">{e(x)}</span>' for x in items)

def jp(s):
    out, last = [], 0
    for m in JP_PATTERN.finditer(s):
        out.append(e(s[last:m.start()]))
        cls = 'jp-nowrap-token' if JP_TYPE[m.group()] == 'token' else 'jp-phrase'
        out.append(f'<span class="{cls}">{e(m.group())}</span>')
        last = m.end()
    out.append(e(s[last:]))
    return ''.join(out)

def rich(lang, s):
    return jp(s) if lang == 'ja' else e(s)

def paras(lang, arr):
    return ''.join(f'<p>{rich(lang, x)}</p>' for x in arr)

def scope_title(lang, s):
    if lang == 'ja' and s.startswith('プロジェクト型アウトソーシング'):
        x = 'プロジェクト型アウトソーシング'
        return f'<span class="scope-title-line">{e(x)}</span><span class="scope-title-line">{jp(s[len(x):])}</span>'
    return rich(lang, s)

def icon(i):
    paths = [
        '<rect x="3" y="3" width="18" height="14" rx="1"/><path d="m7 17-2 4 7-4M7 8h10M7 12h6"/>',
        '<circle cx="9" cy="7" r="3"/><path d="M3 21v-4a6 6 0 0 1 12 0v4M16 4a3 3 0 0 1 0 6M18 13a5 5 0 0 1 3 4v4"/>',
        '<path d="M3 21h18M5 21V3h14v18M9 7h2m2 0h2M9 11h2m2 0h2M10 21v-5h4v5"/>'
    ]
    return '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6">'+paths[i]+'</svg>'

OUT.mkdir(exist_ok=True)
(ROOT/'integration').mkdir(exist_ok=True)
(ROOT/'standalone').mkdir(exist_ok=True)

for lang in ['ja','en','vi']:
    u, c = UI[lang], D[lang]
    w, s = D['companies']['workstation'], D['companies']['seta']
    base = f'https://ws-jobshare.com/{lang}/business'
    contact, docs = base+'/contact_rc', base+'/inquiry_docs_rc'

    def btn(txt, url, style='blue'):
        return f'<a class="btn btn-{style}" href="{e(url)}">{e(txt)}<span class="arr" aria-hidden="true">→</span></a>'
    def head(k, h, id=''):
        title = lines(h) if isinstance(h, list) else e(h)
        return f'<div class="section-head" data-reveal><div><p class="kicker">{k}</p><h2'+(f' id="{id}"' if id else '')+f'>{title}</h2></div></div>'
    def dl(rows):
        return '<dl>'+''.join(f'<div class="detail-row"><dt>{e(k)}</dt><dd>{v}</dd></div>' for k,v in rows)+'</dl>'

    langs = ''.join(f'<a href="index-{l}.html" lang="{l}"'+(' aria-current="page"' if l==lang else '')+f'>{l.upper()}</a>' for l in ['vi','en','ja'])
    nav = ''.join(f'<a href="{base}/{path}"'+(' aria-current="page"' if path=='about-us' else '')+f'>{e(t)}</a>' for path,t in zip(['price','proposal','seminar','news','about-us'],u['nav']))
    phone_top = {'ja':D['contacts'][0]['display'],'en':'(+81) 80 9441 1975 (Japan)','vi':'(+81) 80 9441 1975 (Nhật Bản)'}[lang]

    header = f'''<a class="skip-link" href="#content">{u['skip']}</a><header class="business-header"><div class="wrap header-top"><a href="{D['contacts'][0]['href']}">{e(phone_top)}</a><nav class="languages" aria-label="Language">{langs}</nav></div><div class="wrap header-main"><a class="business-brand" href="{base}">JOBSHARE BUSINESS</a><button class="menu-toggle" aria-expanded="false" aria-controls="business-nav">{u['menu']} <span aria-hidden="true">☰</span></button><nav id="business-nav" aria-label="Business">{nav}<a class="nav-register" href="https://ws-jobshare.com/business/register?lang={lang}">{u['register']}</a><a href="https://ws-jobshare.com/business/login?lang={lang}">{u['login']}</a></nav></div></header>'''

    hero_alt = {
        'ja':'日本とベトナムのチームによる業務連携のイメージ',
        'en':'A Japan–Vietnam team collaborating on recruitment and engineering work',
        'vi':'Đội ngũ Nhật Bản – Việt Nam phối hợp trong tuyển dụng và nghiệp vụ kỹ thuật'
    }[lang]
    team_alt = {
        'ja':'人材育成と技術業務に取り組むチームのイメージ',
        'en':'A team working on talent development and engineering delivery',
        'vi':'Đội ngũ phối hợp phát triển nhân lực và thực hiện nghiệp vụ kỹ thuật'
    }[lang]
    model_alt = {
        'ja':'日本とベトナムの拠点が協力する業務体制のイメージ',
        'en':'Japan and Vietnam teams working together in an integrated operating model',
        'vi':'Mô hình phối hợp vận hành giữa đội ngũ tại Nhật Bản và Việt Nam'
    }[lang]

    hero = f'''<section class="hero about-hero" aria-labelledby="page-title"><img class="hero-bg-photo" src="assets/city-photo-bg.png" alt="" aria-hidden="true"><div class="wrap hero-inner"><div class="hero-copy"><p class="kicker">ABOUT US</p><h1 id="page-title">{lines(c['hero'])}</h1><p class="hero-lead">{e(c['heroLead'])}</p><div class="about-hero-actions">{btn(u['profile'],'#company','yellow')}{btn(u['contact'],contact,'consult')}</div></div><figure class="about-hero-media"><img src="assets/about-business-hero.webp" width="1536" height="864" alt="{e(hero_alt)}" fetchpriority="high"></figure></div></section>'''
    anchor = f'''<nav class="about-index" aria-label="{e(u['about'])}"><div class="wrap"><a href="#who">01 <span>{e(u['who'])}</span></a><a href="#strengths">02 <span>{e(u['strengths'])}</span></a><a href="#model">03 <span>Japan × Vietnam</span></a><a href="#company">04 <span>{e(u['company'])}</span></a></div></nav>'''
    who = f'''<section class="section about" id="who"><div class="wrap about-grid"><div class="about-copy" data-reveal="left"><p class="kicker">WHO WE ARE</p><h2>{e(u['who'])}</h2>{paras(lang,c['intro'])}</div><figure class="about-media image-reveal" data-reveal="clip"><img src="assets/about-workstation-team.webp" width="1536" height="864" loading="lazy" alt="{e(team_alt)}"><figcaption class="media-label">TALENT · EDUCATION · ENGINEERING</figcaption></figure></div></section>'''
    purpose = '<section class="section purpose"><div class="wrap purpose-grid">'+''.join(
        f'<article class="purpose-card" data-reveal><div class="purpose-top"><p class="kicker">{k.upper()}</p><span aria-hidden="true">0{i+1}</span></div><h2>{e(u[k])}</h2><p>{rich(lang,c[k])}</p></article>'
        for i,k in enumerate(['mission','vision']))+'</div></section>'
    strength_labels = ['COMMUNICATION','TALENT & DELIVERY','JAPAN PARTNERSHIP']
    strengths = f'<section class="section" id="strengths"><div class="wrap">{head("OUR STRENGTHS",u["strengths"])}<div class="strength-grid" data-stagger>'+''.join(
        f'<article class="field-card" data-reveal data-spotlight><div class="field-top"><span class="field-no">0{i+1}</span><span class="field-en">{strength_labels[i]}</span></div><div class="field-icon">{icon(i)}</div><h3>{e(t)}</h3><p>{rich(lang,p)}</p></article>'
        for i,(t,p) in enumerate(c['strengths']))+'</div></div></section>'

    model = f'''<section class="section model" id="model"><div class="wrap">{head('JAPAN × VIETNAM',u['structure'])}<p class="model-intro" data-reveal>{rich(lang,c['structure'])}</p><div class="role-grid" data-stagger>'''
    for key in ['workstation','seta']:
        co = D['companies'][key]
        model += f'''<article class="role-card" data-reveal><p class="role-location">{'VIETNAM' if key=='workstation' else 'JAPAN'}</p><p class="role-eyebrow">{e(co['roleLabel'].split(' / ')[0])}</p><h3>{e(co['name'])}</h3>{'<p class="legal-name">'+e(w['legal'])+'</p>' if key=='workstation' else ''}<p>{rich(lang,c['roles'][key])}</p><a class="text-link" href="#{key}-info">{e(u['profile'])}<span>↗</span></a></article>'''
    collab_label = u['collab'].replace('連携モデル', '<span class="jp-nowrap">連携モデル</span>') if lang=='ja' else e(u['collab'])
    model += f'''</div><figure class="model-photo image-reveal" data-reveal="clip"><img src="assets/about-japan-vietnam-collaboration.webp" width="1536" height="864" loading="lazy" alt="{e(model_alt)}"></figure><div class="connection-note" data-reveal><span aria-hidden="true">↔</span><p>{rich(lang,c['connection'])}</p></div><a class="text-link collaboration-link" href="{s['collaborationUrl']}" target="_blank" rel="noopener noreferrer">{collab_label} <span>↗</span></a></div></section>'''

    est_ws = {'ja':w['established'],'en':'April 2015','vi':'Tháng 4/2015'}[lang]
    est_seta = {'ja':s['established'],'en':'February 2026','vi':'Tháng 2/2026'}[lang]
    wsrows = [(u['name'],e(w['display'])),(u['est'],e(est_ws)),(u['address'],e(u['base'])+'<br>'+e(w['address']))]
    serows = [(u['partner'],e(s['name'])),(u['est'],e(est_seta)),(u['rep'],e(s['representative'])),(u['license'],e(s['license'])),(u['hq'],e(s['address'])),(u['website'],f'<a href="{s["website"]}" target="_blank" rel="noopener noreferrer">{e(s["website"])}</a>')]
    contact_values = {
        'ja':[x['display'] for x in D['contacts']],
        'en':['(+81) 80 9441 1975 (Japan)','(+84) 904 605 939 (Vietnam)'],
        'vi':['(+81) 80 9441 1975 (Nhật Bản)','(+84) 904 605 939 (Việt Nam)']
    }[lang]
    contact_links = ''.join(f'<a href="{x["href"]}">{e(contact_values[i])}</a>' for i,x in enumerate(D['contacts']))
    company = f'''<section class="section company" id="company"><div class="wrap">{head('COMPANY INFORMATION',u['company'])}<div class="company-grid"><article id="workstation-info" data-reveal><p class="company-tag">VIETNAM</p><h3>{e(w['name'])}</h3>{dl(wsrows)}</article><article id="seta-info" data-reveal><p class="company-tag">JAPAN</p><h3>{e(s['name'])}</h3>{dl(serows)}</article></div><div class="contact-strip"><span>{e(u['phone'])}</span>{contact_links}</div></div></section>'''
    scope = f'<section class="section scope"><div class="wrap">{head("BUSINESS SCOPE",u["scope"])}<div class="scope-grid">'+''.join(
        f'<article data-reveal><span>0{i+1}</span><h3>{scope_title(lang,x)}</h3></article>' for i,x in enumerate(c['scope']))+'</div></div></section>'
    final = f'''<section class="final about-final"><div class="wrap"><p class="kicker">LET’S CONNECT</p><h2>{lines(u['final'])}</h2><p>{rich(lang,c['cta'])}</p><div class="closing-actions">{btn(u['docs'],docs,'yellow')}{btn(u['contact'],contact,'white')}</div></div></section>'''
    footer = f'''<footer class="business-footer"><div class="wrap footer-top"><a class="business-brand" href="{base}">JOBSHARE BUSINESS</a><nav>{nav}</nav></div><div class="wrap footer-bottom"><span>© {e(w['legal'])}</span><nav class="languages" aria-label="Language">{langs}</nav></div></footer>'''

    body = f'<div class="jsb-v2 jsb-v3 jsb-v4 jsb-v5 jsb-about" id="jobshare-business-v2" lang="{lang}">{header}<main id="content">{hero}{anchor}{who}{purpose}{strengths}{model}{company}{scope}{final}</main>{footer}<a class="back-top" href="#page-title" aria-label="Back to top">↑</a></div>'
    seo = f'<link rel="canonical" href="{base}/about-us">'+''.join(f'<link rel="alternate" hreflang="{x}" href="https://ws-jobshare.com/{x}/business/about-us">' for x in ['ja','en','vi'])+'<link rel="alternate" hreflang="x-default" href="https://ws-jobshare.com/ja/business/about-us">'
    document = f'''<!doctype html><html lang="{lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>{e(u['title'])}</title><meta name="description" content="{e(c['heroLead'])}">{seo}<link rel="stylesheet" href="business-v6.7.css"><link rel="stylesheet" href="about-us.css"></head><body>{body}<script src="business-v6.7.js"></script><script src="about-us.js"></script></body></html>'''

    (OUT/f'index-{lang}.html').write_text(document)
    (ROOT/'integration'/f'content-{lang}.html').write_text(f'<main class="jsb-v2 jsb-v3 jsb-v4 jsb-v5 jsb-about" id="jobshare-business-v2" lang="{lang}">{hero}{anchor}{who}{purpose}{strengths}{model}{company}{scope}{final}</main>')

    standalone = document
    for css in ['business-v6.7.css','about-us.css']:
        standalone = standalone.replace(f'<link rel="stylesheet" href="{css}">','<style>'+(OUT/css).read_text()+'</style>')
    for js in ['business-v6.7.js','about-us.js']:
        standalone = standalone.replace(f'<script src="{js}"></script>','<script>'+(OUT/js).read_text()+'</script>')
    for asset in (OUT/'assets').glob('*'):
        mime='image/webp' if asset.suffix=='.webp' else 'image/png'
        standalone=standalone.replace('assets/'+asset.name,'data:'+mime+';base64,'+base64.b64encode(asset.read_bytes()).decode())
    for l in ['ja','en','vi']:
        standalone = standalone.replace(f'index-{l}.html',f'JobShare_About_Us_{l.upper()}.html')
    (ROOT/'standalone'/f'JobShare_About_Us_{lang.upper()}.html').write_text(standalone)

(OUT/'index.html').write_text((OUT/'index-ja.html').read_text())
print('Built V5 JA + EN + VI')
