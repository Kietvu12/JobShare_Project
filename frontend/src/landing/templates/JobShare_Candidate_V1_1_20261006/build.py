"""Candidate renderer forked from JobShare_Collaborator_V3_20261005.

Layout/CSS/component language remain inherited from Collaborator V3. Candidate content,
routes, jobs/news data and visuals are supplied separately.
"""
from pathlib import Path
from html import escape
import json
from PIL import Image

ROOT=Path(__file__).resolve().parent
SOURCE=json.loads((ROOT/'source-content.json').read_text(encoding='utf-8'))
UI=json.loads((ROOT/'ui-content.json').read_text(encoding='utf-8'))
SUPPORT=json.loads((ROOT/'support-content.json').read_text(encoding='utf-8'))
NEWS=json.loads((ROOT/'news.json').read_text(encoding='utf-8'))
JOBS=json.loads((ROOT/'jobs.json').read_text(encoding='utf-8'))
ICONS=json.loads((ROOT/'icons.json').read_text(encoding='utf-8'))
PARTNERS=['Link Trust','Koyo Engineering','EXEO Engineering West Japan','TechnoPro Construction','Nuvoton','TechnoPro Design','TechnoPro IT','ACA Next','GMO-Z.com Trust Company','Rakus','BREXA Technology','B-Next Technologies','Staff Service Engineering','Quest Global','Persol Excel HR Partners','Meitec Fielders','Unlock Design','VMO Japan']
SEO_TITLES={
 'vi':'Tìm việc kỹ sư tại Nhật Bản | Workstation JobShare - Tạo CV bằng AI',
 'en':'Engineering Jobs in Japan | Workstation JobShare - AI-Powered CV Builder',
 'ja':'日本のエンジニア求人 | Workstation JobShare - AIで履歴書作成',
}
SEO_DESCS={
 'vi':'Nền tảng tuyển dụng thông minh cho người nước ngoài tại Nhật Bản. Tìm việc làm kỹ sư, tạo CV chuẩn Nhật bằng AI, theo dõi ứng tuyển minh bạch. Hoàn toàn miễn phí!',
 'en':'A smart recruitment platform for foreign professionals in Japan. Find engineering jobs, build a Japan-ready CV with AI, and track applications transparently.',
 'ja':'日本で働く外国人向けのスマート採用プラットフォーム。エンジニア求人検索、AIによる履歴書作成、応募進捗の確認を無料で利用できます。',
}
PARTNER_DESC_KEY='partnerDesc'
MORE_JOBS_COPY={
 'vi':{'eyebrow':'Cơ hội khác','text':'Việc làm trên JobShare. Khám phá tất cả'},
 'en':{'eyebrow':'More opportunities','text':'Jobs on JobShare. Explore all'},
 'ja':{'eyebrow':'さらに探す','text':'JobShareの求人をもっと見る'},
}
OG_LOCALE={'vi':'vi_VN','en':'en_US','ja':'ja_JP'}

def e(s): return escape(str(s), quote=True)
def icon(n): return '<svg aria-hidden="true" viewBox="0 0 24 24">'+ICONS[n]+'</svg>'
def img(src,alt,lazy=True):
    with Image.open(ROOT/src) as im: w,h=im.size
    loading='loading="lazy"' if lazy else 'fetchpriority="high"'
    return f'<img src="{src}" alt="{e(alt)}" width="{w}" height="{h}" {loading} decoding="async">'
def heading(s): return str(s).rstrip().rstrip('.。')
def numbered(n): return f'<span class="section-number" aria-hidden="true">{n:02d}</span>'
def fmt_date(s,lang):
    y,m,d=map(int,s.split('-'))
    if lang=='vi': return f'{d} thg {m}, {y}'
    if lang=='ja': return f'{y}年{m}月{d}日'
    months=['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    return f'{months[m]} {d}, {y}'

for lang,t in SOURCE.items():
    u=UI[lang]; chat=SUPPORT[lang]
    live=f'https://ws-jobshare.com/{lang}'
    candidate=f'{live}/candidate'
    output_file='index.html' if lang=='vi' else f'index-{lang}.html'
    register=f'{candidate}/register'; profile=f'{candidate}/profile'; jobs_url=f'{candidate}/jobs'; blog=f'{candidate}/blog'; login=f'{candidate}/login'

    def S(key,tag='p',cls='',head=False):
        val=t.get(key,'')
        if val=='': return ''
        return f'<{tag} class="{cls}" data-source="{key}">{e(heading(val) if head else val)}</{tag}>'
    def H(keys,cls=''):
        parts=[k for k in keys if t.get(k)]
        return '<h2 class="'+cls+'">'+''.join(f'<span class="semantic-line" data-source="{k}">{e(heading(t[k]))}</span>' for k in parts)+'</h2>'
    def A(key,url,primary=True):
        return f'<a class="btn {"btn-primary" if primary else "btn-quiet"}" data-source="{key}" href="{e(url)}">{e(t[key])}</a>'
    def B(key,action):
        return f'<button class="btn btn-quiet" type="button" data-source="{key}" data-action="{action}">{e(t[key])}</button>'

    role_urls=[live,candidate,'https://ws-jobshare.com/business']
    roles=''.join(
        f'<a class="role" href="{url}" {"aria-current=page" if i==1 else ""}>{icon(["people","user","brief"][i])}<span><strong>{e(u["roles"][i])}</strong><small>{e(u["roleSub"][i])}</small></span></a>'
        for i,url in enumerate(role_urls)
    )
    langs=''.join(f'<a href="https://ws-jobshare.com/{l}/candidate" lang="{l}" hreflang="{l}" {"aria-current=page" if l==lang else ""}>{l.upper()}</a>' for l in ['vi','en','ja'])
    nav_items=[('navHome','#top'),('navJobs',jobs_url),('navProfile',profile),('navAbout','#why'),('navPartners','#partners'),('navBlog',blog)]
    nav=''.join(f'<a href="{url}">{e(u[k])}</a>' for k,url in nav_items)+f'<a class="nav-login" href="{login}">{e(u["login"])}</a>'

    community=''.join(
        f'<article class="community-card" data-reveal style="--delay:{(i-1)*65}ms"><div class="card-top"><span class="card-number">0{i}</span>{icon(ic)}</div>{S(f"aboutCard{i}Title","h3",head=True)}{S(f"aboutCard{i}Desc")}</article>'
        for i,ic in enumerate(['search','ai','progress'],1)
    )
    why=''.join(
        f'<article class="why-card" data-reveal style="--delay:{(i-1)*55}ms"><div class="card-top"><span class="card-number">0{i}</span>{icon(ic)}</div>{S(f"whyCard{i}Title","h3",head=True)}{S(f"whyCard{i}Desc")}</article>'
        for i,ic in zip(range(1,5),['search','doc','progress','brief'])
    )
    steps=''.join(
        f'<article class="flow-step" data-reveal style="--delay:{(i-1)*80}ms"><div class="step-top"><span class="step-no">0{i}</span>{icon(ic)}</div>{S(f"guideStep{i}Title","h3",head=True)}{S(f"guideStep{i}Desc")}</article>'
        for i,ic in enumerate(['search','user','progress'],1)
    )
    features=''.join(
        f'<article class="feature" data-reveal><div class="feature-heading"><span class="card-number">0{i}</span>{S(f"feature{i}Title","h3",head=True)}</div>{S(f"feature{i}Desc")}<ul class="check-list">'+''.join(f'<li data-source="feature{i}Points.{j}">{e(x)}</li>' for j,x in enumerate(t[f'feature{i}Points']))+'</ul></article>'
        for i in range(1,5)
    )
    logos=''.join(f'<div class="partner" title="{e(name)}">{img(f"assets/partner-{i+1}.png",name)}</div>' for i,name in enumerate(PARTNERS))

    job_cards=''.join(
        f'<a class="job-card" href="{candidate}/jobs/{job["id"]}" data-reveal><div class="job-card-top"><span class="job-company">{e(job["company"][lang])}</span><span class="job-arrow" aria-hidden="true">→</span></div><h3>{e(job["title"][lang])}</h3><div class="job-meta"><span class="job-salary">{e(job["salary"][lang])}</span><span class="job-type">{e(job["type"][lang])}</span></div></a>'
        for job in JOBS
    )
    more=MORE_JOBS_COPY[lang]
    job_cards += f'<a class="job-more-card" href="{jobs_url}" data-reveal aria-label="{e(more["text"])}"><div class="job-more-top"><span>{e(more["eyebrow"])}</span><span class="job-more-arrow" aria-hidden="true">↗</span></div><strong>+481</strong><p>{e(more["text"])} <span aria-hidden="true">›</span></p></a>'
    news=''.join(
        f'<a class="news-card" href="{e(n["urls"][lang])}" data-news-id="{n["id"]}" data-reveal><div class="news-image">{img(n["image"],n["title"][lang])}</div><div class="news-body"><div class="news-meta"><time datetime="{n["date"]}">{e(fmt_date(n["date"],lang))}</time><span>· {e(n["category"][lang])}</span></div><h3>{e(n["title"][lang])}</h3></div></a>'
        for n in NEWS
    )
    footerlinks=''.join(
        f'<li><a data-source="footerExploreLinks.{i}" href="{url}">{e(label)}</a></li>'
        for i,(url,label) in enumerate(zip([jobs_url,'#why','#partners',blog],t['footerExploreLinks']))
    )
    sep='' if lang=='ja' else ' '
    messenger='<svg aria-hidden="true" viewBox="0 0 24 24" class="messenger-icon"><path d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719"/></svg>'
    greeting=chat['greeting'].replace('${n}',chat['guest'])
    support_options=(
        f'<details class="support-question"><summary>{e(chat["opt1"])}</summary><div>{e(chat["opt1ReplyBefore"])}<a href="{jobs_url}">{e(chat["jobsLinkLabel"])}</a>{e(chat["opt1ReplyAfter"])}</div></details>'
        f'<details class="support-question"><summary>{e(chat["opt2"])}</summary><div>{e(chat["opt2Reply"])}</div></details>'
        f'<details class="support-question"><summary>{e(chat["opt3"])}</summary><div>{e(chat["opt3ContactIntro"])}<p><a href="tel:+84972899728">{e(chat["opt3HotlineVn"])}</a></p><p><a href="tel:+819094411975">{e(chat["opt3HotlineJp"])}</a></p><p><a href="https://www.facebook.com/" target="_blank" rel="noopener noreferrer">{e(chat["opt3Facebook"])}</a></p></div></details>'
    )
    canonical=f'https://ws-jobshare.com/{lang}/candidate'
    alternates=''.join(f'<link rel="alternate" hreflang="{l}" href="https://ws-jobshare.com/{l}/candidate">' for l in ['vi','en','ja'])+'<link rel="alternate" hreflang="x-default" href="https://ws-jobshare.com/vi/candidate">'
    social_image=f'{canonical}/assets/candidate-hero-2.png'
    site_id='https://ws-jobshare.com/#website'
    org_id='https://ws-jobshare.com/#organization'
    page_id=canonical+'#webpage'
    schema=json.dumps({'@context':'https://schema.org','@graph':[
        {'@type':'WebSite','@id':site_id,'url':'https://ws-jobshare.com/','name':'Workstation JobShare','publisher':{'@id':org_id},'inLanguage':['vi','en','ja']},
        {'@type':'Organization','@id':org_id,'name':'Workstation JobShare','url':'https://ws-jobshare.com/','logo':{'@type':'ImageObject','url':'https://ws-jobshare.com/assets/jobshare-logo.png'}},
        {'@type':'WebPage','@id':page_id,'url':canonical,'name':SEO_TITLES[lang],'description':SEO_DESCS[lang],'inLanguage':lang,'isPartOf':{'@id':site_id},'about':{'@id':org_id},'primaryImageOfPage':{'@type':'ImageObject','url':social_image}}
    ]},ensure_ascii=False,separators=(',',':'))
    social=f'''<meta property="og:type" content="website"><meta property="og:site_name" content="Workstation JobShare"><meta property="og:locale" content="{OG_LOCALE[lang]}"><meta property="og:title" content="{e(SEO_TITLES[lang])}"><meta property="og:description" content="{e(SEO_DESCS[lang])}"><meta property="og:url" content="{canonical}"><meta property="og:image" content="{social_image}"><meta property="og:image:width" content="1672"><meta property="og:image:height" content="941"><meta property="og:image:alt" content="{e(u['heroAlt'])}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="{e(SEO_TITLES[lang])}"><meta name="twitter:description" content="{e(SEO_DESCS[lang])}"><meta name="twitter:image" content="{social_image}"><meta name="twitter:image:alt" content="{e(u['heroAlt'])}">'''

    html=f'''<!doctype html><html lang="{lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{e(SEO_TITLES[lang])}</title><meta name="description" content="{e(SEO_DESCS[lang])}"><meta name="theme-color" content="#ed212f"><meta name="robots" content="index,follow,max-image-preview:large"><link rel="canonical" href="{canonical}">{alternates}{social}<link rel="icon" href="assets/jobshare-logo.png"><link rel="stylesheet" href="fonts.css"><link rel="stylesheet" href="styles.css"><script src="app.js" defer></script><script type="application/ld+json">{schema}</script></head>
<body lang="{lang}" id="top"><a class="skip" href="#main">{e(u['skip'])}</a>
<div class="role-bar"><div class="wrap role-intro">{e(u['roleIntro'])}</div><nav class="wrap roles" aria-label="{e('/'.join(u['roles']))}">{roles}</nav></div>
<header class="site-header"><div class="wrap header-inner"><a class="brand" href="{candidate}" aria-label="JobShare">{img('assets/jobshare-logo.png','JobShare',False)}</a><nav class="nav" id="main-nav" aria-label="{e(u['openMenu'])}">{nav}</nav><div class="header-tools"><div class="languages" aria-label="Language">{langs}</div><a class="login" href="{login}">{e(u['login'])}</a><a class="header-register" href="{register}">{e(u['register'])}</a><button class="menu-btn" aria-label="{e(u['openMenu'])}" aria-controls="main-nav" aria-expanded="false">{icon('menu')}</button></div></div></header>
<main id="main">
<section class="hero" id="hero"><div class="wrap hero-grid"><div class="hero-copy">{S('heroBadge','p','kicker')}<h1><span class="hero-line" data-source="heroTitle1">{e(t['heroTitle1'])}</span><span class="hero-line" data-source="heroTitle2">{e(t['heroTitle2'])}</span></h1>{S('heroDesc','p','hero-lead')}<div class="actions">{A('heroBtnPrimary',jobs_url)}{A('heroBtnSecondary',profile,False)}</div></div><figure class="hero-media">{img('assets/candidate-hero-2.webp',u['heroAlt'],False)}</figure></div></section>
<section class="section community" id="community"><div class="wrap"><div class="source-section-head" data-reveal>{numbered(1)}{H(['aboutTitleLine1','aboutTitleLine2'])}</div><div class="community-grid">{community}</div></div></section>
<section class="section why-section" id="why"><div class="wrap"><div class="section-head" data-reveal><div>{numbered(2)}{S('whyTitle','h2',head=True)}</div>{S('whyDesc')}</div><div class="why-grid why-grid--candidate">{why}</div></div></section>
<section class="section ai-section" id="ai-cv"><div class="wrap split"><figure class="media-frame" data-reveal>{img('assets/candidate-ai-cv.webp',u['aiAlt'])}</figure><div class="split-copy" data-reveal>{numbered(3)}{S('aiCvPromoTitle','h2',head=True)}<div class="actions">{A('aiCvPromoCta',register)}</div></div></div></section>
<section class="section flow" id="guide"><div class="wrap"><div class="source-section-head" data-reveal>{numbered(4)}{H(['guideTitleLine1','guideTitleLine2'])}</div><div class="flow-board">{steps}</div></div></section>
<section class="section platform" id="features"><div class="wrap"><div class="platform-intro"><div data-reveal>{numbered(5)}{S('featureTitle','h2',head=True)}<div class="actions">{A('featureCta',profile)}</div></div><figure class="media-frame" data-reveal>{img('assets/candidate-platform.webp',u['platformAlt'])}</figure></div><div class="features">{features}</div></div></section>
<section class="section partners" id="partners"><div class="wrap"><div class="source-section-head" data-reveal>{numbered(6)}{H(['partnerTitleLine1','partnerTitleLine2'])}{S(PARTNER_DESC_KEY,'p','partner-lead')}</div><div class="partner-grid">{logos}</div></div></section>
<section class="section jobs-section" id="jobs"><div class="wrap"><div class="section-head" data-reveal><div>{numbered(7)}{S('jobsTitle','h2',head=True)}</div><div>{S('jobsDesc')}<a class="text-link" href="{jobs_url}">{e(t['jobsViewAll'])}</a></div></div><div class="jobs-grid">{job_cards}</div></div></section>
<section class="section news candidate-news" id="news"><div class="wrap"><div class="section-head" data-reveal><div>{numbered(8)}{S('hotNewsTitle','h2',head=True)}</div><div>{S('hotNewsDesc')}<a class="text-link" data-source="hotNewsViewAll" href="{blog}">{e(t['hotNewsViewAll'])}</a></div></div><div class="news-grid candidate-news-grid">{news}</div></div></section>
<section class="final" id="final"><div class="wrap"><div class="final-box" data-reveal><figure class="final-media">{img('assets/candidate-career-support.webp',u['finalAlt'])}</figure><div class="final-copy"><h2>{e(t['footerCtaTitleWhite'])}{sep}<span>{e(t['footerCtaTitleRed'])}</span>{sep if lang!='ja' and t['footerCtaTitleWhiteEnd']!='?' else ''}{e(t['footerCtaTitleWhiteEnd'])}</h2>{S('footerCtaDesc')}<div class="actions">{A('footerBtnPrimary',profile)}{B('footerBtnSecondary','contact')}</div></div></div></div></section>
</main>
<footer class="site-footer"><div class="wrap"><div class="footer-grid"><div class="footer-brand">{img('assets/jobshare-white.png','JobShare')}{S('footerDesc')}</div><div>{S('footerExploreTitle','h3',head=True)}<ul>{footerlinks}</ul></div><div>{S('footerSupportTitle','h3',head=True)}<ul><li><a href="#guide" data-source="footerSupportLinks.0">{e(t['footerSupportLinks'][0])}</a></li><li><a href="#" data-source="footerSupportLinks.1">{e(t['footerSupportLinks'][1])}</a></li><li><a href="#" data-source="footerSupportLinks.2">{e(t['footerSupportLinks'][2])}</a></li><li><button class="footer-contact" data-action="contact" data-source="footerSupportLinks.3">{e(t['footerSupportLinks'][3])}</button></li></ul></div><div>{S('footerContactTitle','h3',head=True)}{S('footerContactLocation','address')}{S('footerContactInfoTitle','p','footer-subtitle')}<a class="footer-phone" href="tel:+84972899728" data-source="footerContactPhone">{e(t['footerContactPhone'])}</a></div></div><div class="footer-bottom"><span>© 2026 Workstation JobShare</span><a href="https://ws-jobshare.com/" data-source="footerLinkUrl">{e(t['footerLinkUrl'])}</a></div></div></footer>
<div class="floating-controls"><a class="back-top" href="#top" aria-label="{e(u['top'])}">{icon('up')}</a><button class="support-launcher" type="button" aria-controls="support-panel" aria-expanded="false" aria-label="{e(chat['openAria'])}">{messenger}<span>{e(chat['title'])}</span></button></div>
<section class="support-panel" id="support-panel" role="dialog" aria-label="{e(chat['title'])}" hidden><header><div><strong>{e(chat['title'])}</strong><p>{e(chat['subtitle'])}</p></div><button class="support-close" aria-label="{e(chat['close'])}">×</button></header><div class="support-tabs" role="tablist"><button role="tab" id="tab-home" aria-selected="true" aria-controls="support-home">{e(chat['tabHome'])}</button><button role="tab" id="tab-messages" aria-selected="false" aria-controls="support-messages">{e(chat['tabMessages'])}</button></div><div id="support-home" role="tabpanel" aria-labelledby="tab-home"><p>{e(greeting)}</p>{support_options}</div><div id="support-messages" role="tabpanel" aria-labelledby="tab-messages" hidden><p class="chat-hint">{e(chat['chatWithAdminHint'])}</p><label class="name-label">{e(chat['yourName'])}<input id="visitor-name" maxlength="100" autocomplete="name"></label><div class="chat-history" role="log" aria-live="polite"></div><form id="support-form"><label class="sr-only" for="chat-body">{e(chat['chatPlaceholder'])}</label><textarea id="chat-body" maxlength="4000" rows="3" placeholder="{e(chat['placeholderFirst'])}" required></textarea><button class="btn btn-primary" type="submit">{e(chat['startChat'])}</button></form><p class="chat-error" role="status" hidden>{e(u['chatError'])}</p><div class="chat-phones"><a href="tel:+84972899728">{e(chat['opt3HotlineVn'])}</a><a href="tel:+819094411975">{e(chat['opt3HotlineJp'])}</a></div></div></section>
<dialog class="contact-dialog"><div class="contact-dialog-inner"><h2>{e(t['footerContactTitle'])}</h2><address>{e(t['footerContactLocation'])}</address><a href="https://ws-jobshare.com/">{e(t['footerLinkUrl'])}</a><a class="footer-phone" href="tel:+84972899728">{e(t['footerContactPhone'])}</a><form method="dialog"><button class="btn btn-primary">OK</button></form></div></dialog>
<script type="application/json" id="chat-config">{json.dumps({'api':'https://ws-jobshare.com/api_jobshare/api','send':chat['send'],'connecting':chat['connecting'],'start':chat['startChat']},ensure_ascii=False)}</script>
</body></html>'''
    if lang=='ja':
        from ja_typography import apply
        html=apply(html)
    else:
        from latin_typography import apply
        html=apply(html,lang)
    (ROOT/output_file).write_text(html,encoding='utf-8')
print('Built Candidate locales from forked V3 components')
