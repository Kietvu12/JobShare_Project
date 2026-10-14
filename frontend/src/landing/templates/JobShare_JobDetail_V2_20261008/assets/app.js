/* JobShare Job Detail V1 · original VI/EN/JA source + V3 tokens + source action routes.
   Integration hooks: window.JobShareDetailHooks = {loadJob, onNominate, downloadJobFile, candidateUrl}.
   In host app, bind to the existing API/client and router; never bypass existing auth guards. */
(() => {
'use strict';
const P=JSON.parse(document.getElementById('job-data').textContent);
const lang=document.documentElement.lang || 'vi';
const ASSETS=new URL('.',document.currentScript.src).href;
const t={
vi:{home:'Trang chủ',jobs:'Danh sách việc làm',about:'Về chúng tôi',blog:'Blog',login:'Đăng nhập',register:'Đăng ký',roles:[['Cộng tác viên','Giới thiệu ứng viên & nhận hoa hồng'],['Ứng viên','Tìm việc tại Nhật Bản'],['Doanh nghiệp','Đăng tuyển & tìm ứng viên']],intro:'Chào mừng bạn đến với Workstation JobShare, bạn muốn tham gia với tư cách nào?',category:'Nhóm ngành',detail:'Chi tiết việc làm',overview:'Tổng quan công việc',requirements:'Yêu cầu ứng tuyển',conditions:'Lương và điều kiện làm việc',benefits:'Phúc lợi',process:'Quy trình tuyển dụng',company:'Thông tin công ty',related:'Việc làm liên quan',salary:'Thu nhập năm',monthly:'Lương tháng',work:'Nơi làm việc',employment:'Hình thức tuyển dụng',recruitment:'Địa điểm tuyển dụng',visa:'Visa',jobid:'Job ID',created:'Ngày tạo',updated:'Ngày cập nhật',required:'Điều kiện bắt buộc',preferred:'Điều kiện ưu tiên',suggest:'Đề xuất ứng viên',copy:'Sao chép URL',copied:'Đã sao chép URL dành cho ứng viên',download:'Tải JD',view:'Xem chi tiết',all:'Xem tất cả',noFile:'Chưa có tệp JD có thể tải',checkFile:'Không kiểm tra được tệp JD. Vui lòng thử lại.',failedDownload:'Không tải được JD. Vui lòng thử lại.',failedLoad:'Chưa tải được thông tin việc làm này.',back:'Quay lại danh sách việc làm',menu:'Mở menu',footer:'Nền tảng kết nối việc làm Nhật Bản thông qua cộng đồng giới thiệu nhân sự',explore:'Khám phá',contact:'Liên hệ',fileNames:['JD tiếng Việt','JD tiếng Anh','JD tiếng Nhật','JD gốc','Form CV bắt buộc'],loading:'Đang tải thông tin việc làm…',noData:'Không tìm thấy việc làm',copyErr:'Không sao chép được URL. Vui lòng thử lại.'},
en:{home:'Home',jobs:'Job listings',about:'About us',blog:'Blog',login:'Log in',register:'Register',roles:[['Collaborator','Refer candidates and earn commission'],['Candidate','Find jobs in Japan'],['Company','Post jobs and find candidates']],intro:'Welcome to Workstation JobShare, how would you like to join?',category:'Job category',detail:'Job details',overview:'Job overview',requirements:'Requirements',conditions:'Salary & work conditions',benefits:'Benefits',process:'Recruitment process',company:'Company information',related:'Related jobs',salary:'Annual salary',monthly:'Monthly salary',work:'Work location',employment:'Employment type',recruitment:'Recruitment area',visa:'Visa',jobid:'Job ID',created:'Created',updated:'Updated',required:'Required qualifications',preferred:'Preferred qualifications',suggest:'Suggest candidate',copy:'Copy URL',copied:'Candidate URL copied',download:'Download JD',view:'View details',all:'View all jobs',noFile:'No JD files available',checkFile:'Could not check available JD files. Please try again.',failedDownload:'Could not download the JD. Please try again.',failedLoad:'Could not load this job.',back:'Back to job listings',menu:'Open menu',footer:'Connecting people with opportunities in Japan through a community of recruitment partners',explore:'Explore',contact:'Contact',fileNames:['JD Vietnamese','JD English','JD Japanese','Original JD','Required CV form'],loading:'Loading job details…',noData:'Job not found',copyErr:'Could not copy the URL. Please try again.'},
ja:{home:'ホーム',jobs:'求人一覧',about:'私たちについて',blog:'ブログ',login:'ログイン',register:'登録',roles:[['コラボレーター','候補者を紹介して報酬を獲得'],['応募者','日本で仕事を探す'],['企業','求人掲載と候補者探し']],intro:'JobShare ワークステーションへようこそ。どの立場で参加しますか？',category:'職種',detail:'求人詳細',overview:'仕事内容',requirements:'応募条件',conditions:'給与・勤務条件',benefits:'待遇・福利厚生',process:'選考の流れ',company:'企業情報',related:'関連求人',salary:'年収',monthly:'月給',work:'勤務地',employment:'雇用形態',recruitment:'採用対象地域',visa:'在留資格',jobid:'求人ID',created:'作成日',updated:'更新日',required:'必須条件',preferred:'歓迎条件',suggest:'候補者を推薦',copy:'URLをコピー',copied:'候補者向けURLをコピーしました',download:'JDをダウンロード',view:'詳細を見る',all:'求人一覧を見る',noFile:'ダウンロードできるJDがありません',checkFile:'JDファイルを確認できませんでした。再度お試しください。',failedDownload:'JDをダウンロードできませんでした。再度お試しください。',failedLoad:'求人情報を取得できませんでした。',back:'求人一覧に戻る',menu:'メニューを開く',footer:'人材紹介コミュニティを通じて、日本の仕事と人をつなぐプラットフォーム',explore:'サイト案内',contact:'お問い合わせ',fileNames:['JDベトナム語','JD英語','JD日本語','JD原本','必須CVフォーム'],loading:'求人情報を読み込んでいます…',noData:'求人が見つかりません',copyErr:'URLをコピーできませんでした。もう一度お試しください。'}
}[lang];
const svgPaths={code:'<path d="M8 7 3 12l5 5M16 7l5 5-5 5M14 4l-4 16"/>',circuit:'<path d="M12 2v5m0 10v5M2 12h5m10 0h5"/><circle cx="12" cy="12" r="4"/><path d="M5 5l3 3m8 8 3 3M19 5l-3 3m-8 8-3 3"/>',gear:'<path d="M9.7 4.2 10 2h4l.3 2.2 2.2.9L18.4 4l2.8 2.8-1.1 1.9.9 2.2 2 .3v4l-2 .3-.9 2.2 1.1 1.9-2.8 2.8-1.9-1.1-2.2.9-.3 2h-4l-.3-2-2.2-.9-1.9 1.1L2.8 19.6l1.1-1.9-.9-2.2-2-.3v-4l2-.3.9-2.2-1.1-1.9L5.6 4l1.9 1.1z"/><circle cx="12" cy="12" r="3"/>',building:'<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 7h2m4 0h2M8 11h2m4 0h2M8 15h2m4 0h2M10 21v-3h4v3"/>',handshake:'<path d="M2 9l4-4 5 1 2 2m9 1-4-4-5 1-5 5 4 2 3-2 4 4-5 5-3-2-2 1-3-3-2-1z"/>',document:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h8"/>',flask:'<path d="M9 3h6M10 3v7L4.5 19a2 2 0 0 0 1.7 3h11.6a2 2 0 0 0 1.7-3L14 10V3M7 16h10"/>',heart:'<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.9-7.6 1-1a5.5 5.5 0 0 0-.1-7.8z"/>',briefcase:'<rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V4h8v3M3 12a22 22 0 0 0 18 0M12 11v4"/>',user:'<circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',users:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m20 0v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/><circle cx="9" cy="7" r="4"/>',pin:'<path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',yen:'<path d="m6 3 6 9 6-9M5 12h14M5 16h14M12 12v9"/>',copy:'<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>',download:'<path d="M12 3v13m-4-4 4 4 4-4M4 17v4h16v-4"/>',arrow:'<path d="M5 12h14m-7-7 7 7-7 7"/>',chevron:'<path d="m9 18 6-6-6-6"/>',calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18"/>',check:'<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',star:'<path d="m12 3 2.7 5.6 6.2.9-4.5 4.4 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.5-4.4 6.2-.9z"/>',gift:'<rect x="3" y="10" width="18" height="11" rx="1"/><path d="M2 7h20v4H2zm10 0v14M12 7C5-1 2 7 12 7Zm0 0c7-8 10 0 0 0Z"/>',clock:'<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',layers:'<path d="m12 3 9 5-9 5-9-5 9-5Zm-9 10 9 5 9-5M3 18l9 5 9-5"/>'};
const icon=(name)=>`<svg aria-hidden="true" viewBox="0 0 24 24">${svgPaths[name]||svgPaths.briefcase}</svg>`;
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safe=s=>escape(s).replace(/\b(JobShare|JLPT|BrSE|N[1-5]|AI|CV)\b/g,'<span class="no-split">$1</span>');
const localized=(obj,field)=>{if(!obj)return '';const v=obj[field+(lang==='en'?'En':lang==='ja'?'Jp':'')];return typeof v==='string'&&v.trim()?v:(obj[field]??'');};
const money=(j,type)=>{const x=(j.salaryRanges||[]).find(a=>a.type===type);return x?localized(x,'salaryRange'):'';};
const allRoots=P.categories.data.tree;
const findRoot=(id,tree=allRoots)=>{for(const node of tree){if(+node.id===+id)return node;const has=(list)=>list.some(ch=>+ch.id===+id||has(ch.children||[]));if(has(node.children||[]))return node;}return null;};
const iconFor=id=>({11:'handshake',51:'document',79:'code',112:'circuit',137:'gear',190:'flask',225:'building',296:'handshake',326:'document',348:'heart',2:'circuit'}[id]||'briefcase');
const toneFor=id=>({11:'sales',51:'admin',79:'it',112:'embedded',137:'mechanical',190:'chemical',225:'construction',296:'sales',326:'admin',348:'construction',2:'mechanical'}[id]||'other');
const sid=['overview','requirements','conditions','benefits','process','company'];
const headIcons={overview:'briefcase',requirements:'check',conditions:'yen',benefits:'gift',process:'layers',company:'building'};
const txt=(value)=>value?`<span>${safe(value)}</span>`:'';
const jobHref=id=>location.protocol==='file:'||!location.host?.endsWith('ws-jobshare.com')?`https://ws-jobshare.com/${lang}/jobs/${encodeURIComponent(id)}`:`/${lang}/jobs/${encodeURIComponent(id)}`;
const lines=(text)=>{
 const arr=String(text||'').split(/\n+/).map(x=>x.trim()).filter(Boolean);
 let html='',items=[];
 const flush=()=>{if(items.length){html+=`<ul class="jd-lines">${items.map(x=>`<li><span>${safe(x)}</span></li>`).join('')}</ul>`;items=[];}};
 for(const row of arr){
   if(/^[・•●■]\s*/.test(row)){items.push(row.replace(/^[・•●■]\s*/,''));continue;}
   flush();
   if(/[:：]\s*$/.test(row)&&row.length<100){html+=`<h3 class="subheading">${safe(row)}</h3>`;continue;}
   html+=`<p class="content-intro">${safe(row)}</p>`;
 }
 flush();return html;
};
const reqList=(g)=>`<div class="req-group ${/required|必須|bắt buộc/i.test(g.label)?'required':'preferred'}"><h3 class="subheading">${icon(/required|必須|bắt buộc/i.test(g.label)?'check':'star')}${safe(g.label)}</h3><ul class="jd-lines ${/required|必須|bắt buộc/i.test(g.label)?'required':''}">${g.items.map(x=>`<li><span>${safe(x.replace(/^[■•・]\s*/,''))}</span></li>`).join('')}</ul></div>`;
const categories=(j)=>{const root=findRoot(j.jobCategoryId);return {root,tone:toneFor(root?.id),icon:iconFor(root?.id),name:localized(j.category,'name')||localized(root,'name')};};
// Presentation-only JA label cleanup. The exact numeric range/period is kept;
// headings already say 年収 or 月給, so don't repeat the same word inside the figure.
const period=(s,type)=>{
 const value=String(s||'');
 if(lang!=='ja')return value;
 return type==='yearly'?value.replace(/^年収\s*[:：]?\s*/,''):type==='monthly'?value.replace(/^月給\s*[:：]?\s*/,''):value;
};
const displayDate=(iso)=>{try{return new Intl.DateTimeFormat(lang==='ja'?'ja-JP':lang==='en'?'en-GB':'vi-VN',{year:'numeric',month:'2-digit',day:'2-digit',timeZone:'Asia/Tokyo'}).format(new Date(iso));}catch{return iso;}};
let currentJob=P.jobs.find(j=>j.id===708), source=P.snapshots[lang], fileFlags=null;
let isBusy=false;
const section=(id,inner)=>inner?`<section id="${id}" class="section-card section-${id}" aria-labelledby="heading-${id}"><div class="section-title"><span class="section-symbol">${icon(headIcons[id])}</span><h2 id="heading-${id}">${t[id]}</h2></div><div class="section-body">${inner}</div></section>`:'';
const headings=()=>`<nav class="section-links" aria-label="${t.overview}">${sid.filter(id=>document.querySelector('#'+id)).map(id=>`<a href="#${id}" data-section="${id}">${t[id]}</a>`).join('')}</nav>`;
const fileTypes=['jdFile','jdFileEn','jdFileJp','jdOriginalFile','requiredCvForm'];
const existingTypes=(j)=>fileTypes.filter(k=>String(j?.[k]||j?.[k.replace(/[A-Z]/g,c=>'_'+c.toLowerCase())]||'').trim());
function workAndBenefits(sections){
 const workPatterns=/^(thời gian làm việc|thời gian nghỉ|làm thêm giờ|ngày nghỉ|chi tiết ngày nghỉ|phụ cấp làm thêm|working hours|work hours|break time|overtime|days off|holiday details|勤務時間|休憩時間|残業|休日|休日の詳細)/i;
 const work=sections.benefits.filter(x=>workPatterns.test(x.label));
 const ben=sections.benefits.filter(x=>!workPatterns.test(x.label));
 const block=it=>`<div class="benefit-row"><h3>${safe(it.label)}</h3><div class="section-body">${it.items?.length?`<ul class="jd-lines">${it.items.map(x=>`<li><span>${safe(x.replace(/^・\s*/,''))}</span></li>`).join('')}</ul>`:`<div class="text-paragraphs">${lines(it.text||'')}</div>`}</div></div>`;
 return {work:work.map(block).join(''),benefits:ben.map(block).join('')};
}
function previewShell(j){
 const base=`https://ws-jobshare.com/${lang}`;
 return `<a class="skip" href="#detail-content">${t.overview}</a><div class="role-bar"><div class="wrap role-intro">${escape(t.intro)}</div><nav class="wrap roles" aria-label="JobShare roles">${t.roles.map((r,i)=>`<a class="role" ${i===0?'aria-current="page"':''} href="${[base,base+'/candidate','https://ws-jobshare.com/business'][i]}">${icon(['users','user','briefcase'][i])}<span><strong>${safe(r[0])}</strong><small>${safe(r[1])}</small></span></a>`).join('')}</nav></div><header class="site-header"><div class="wrap header-inner"><a class="brand" href="${base}" aria-label="JobShare"><img src="${ASSETS}jobshare-logo.png" alt="JobShare" width="1339" height="438"></a><nav class="nav" id="main-nav" aria-label="${t.menu}"><a href="${base}">${t.home}</a><a aria-current="page" href="/${lang}/jobs">${t.jobs}</a><a href="${base}/about-us">${t.about}</a><a href="${base}/blog">${t.blog}</a><a class="nav-login" href="https://ws-jobshare.com/login">${t.login}</a></nav><div class="header-tools"><div class="languages" aria-label="Language">${['vi','en','ja'].map(l=>`<a lang="${l}" hreflang="${l}" href="${location.protocol==='file:'?`../../../${l}/jobs/708/index.html`:`/${l}/jobs/${encodeURIComponent(j.id)}`}" ${l===lang?'aria-current="page"':''}>${l.toUpperCase()}</a>`).join('')}</div><a class="login" href="https://ws-jobshare.com/login">${t.login}</a><a class="header-register" href="https://ws-jobshare.com/register">${t.register}</a><button type="button" class="menu-btn" aria-controls="main-nav" aria-expanded="false" aria-label="${t.menu}">${icon('menu')}</button></div></div></header>`;
}
function secondary(mobile=false){return `<div class="secondary-actions"><button class="action-secondary js-copy" type="button">${icon('copy')}<span>${t.copy}</span></button><div class="file-picker"><button type="button" class="action-secondary js-download" aria-expanded="false" aria-haspopup="true">${icon('download')}<span>${t.download}</span></button><div class="download-menu" hidden></div></div></div>${!mobile?'<p class="action-feedback" aria-live="polite"></p>':''}`;}
function related(j){
 const all=P.jobs.filter(x=>x.id!==j.id),r=findRoot(j.jobCategoryId),filtered=all.filter(x=>findRoot(x.jobCategoryId)?.id===r?.id);
 const chosen=[...filtered,...all.filter(x=>[79,112].includes(findRoot(x.jobCategoryId)?.id)&&!filtered.includes(x))].slice(0,3);
 if(!chosen.length)return '';
 return `<section class="related-section" aria-labelledby="related-heading"><div class="related-head"><h2 id="related-heading"><span class="related-heading-icon">${icon('layers')}</span>${t.related}</h2><a href="/${lang}/jobs">${t.all} ${icon('arrow')}</a></div><div class="related-grid">${chosen.map(x=>{
 const c=categories(x),loc=(x.workingLocations||[]).map(i=>localized(i,'location')).filter(Boolean)[0]||'',sal=money(x,'yearly')||money(x,'monthly');
 return `<article class="related-card tone-${c.tone}"><div class="rel-top"><span class="rel-icon">${icon(c.icon)}</span><span>${safe(c.name)}</span></div><h3><a href="${jobHref(x.id)}">${safe(localized(x,'title'))}</a></h3>${loc?`<p class="rel-meta">${icon('pin')}<span>${safe(loc)}</span></p>`:''}${sal?`<div class="rel-salary">${safe(sal)}</div>`:''}<a class="rel-detail" href="${jobHref(x.id)}">${t.view}${icon('arrow')}</a></article>`;
 }).join('')}</div></section>`;
}
function appMarkup(j,s){
 const c=categories(j),sec=s?.sections||{},meta=s?.metadata||{},annual=money(j,'yearly'),monthly=money(j,'monthly'),company=localized(j.recruitingCompany,'companyName'),loc=meta.loc||(j.workingLocations||[]).map(x=>localized(x,'location')).filter(Boolean).join(' · '),recruit=meta.recruitment||(['',t.employment||''])[j.recruitmentType]||'',catName=meta.category||c.name;
 // Locations have different meanings: workplace (where the job is performed) vs. hiring area (where candidates are recruited).
 const locationCards=[[t.work,loc,'pin','work'],[t.recruitment,meta.region,'users','recruit']].filter(x=>x[1]);
 const supportingMeta=[[t.employment,recruit,'briefcase'],[t.visa,meta.visa,'document']].filter(x=>x[1]);
 const benefit=sec.benefits?workAndBenefits(sec):{work:'',benefits:''};
 const info=[[t.work,loc],[t.employment,recruit],[t.recruitment,meta.region],[t.visa,meta.visa]];
 const conditions=[(annual||monthly)?`<dl class="info-fields">${[[t.salary,period(annual,'yearly')],[t.monthly,period(monthly,'monthly')],...info].filter(x=>x[1]).map(([l,v])=>`<div class="info-row"><dt>${l}</dt><dd>${safe(v)}</dd></div>`).join('')}</dl>`:'',benefit.work].filter(Boolean).join('');
 const comp=sec.company?`${sec.company.info?`<div class="company-info">${safe(sec.company.info)}</div>`:''}${sec.company.text?`<div class="text-paragraphs">${safe(sec.company.text).split(/\n\s*\n/).map(p=>`<p>${p.replace(/\n/g,' ')}</p>`).join('')}</div>`:''}${sec.company.sectors?.length?`<div class="industry-chips">${sec.company.sectors.map(x=>`<span>${safe(x)}</span>`).join('')}</div>`:''}`:'';
 const jobDate=meta.created||(j.createdAt?displayDate(j.createdAt):'');
 return `${previewShell(j)}<div class="detail-band"><div class="wrap"><nav class="breadcrumb" aria-label="Breadcrumb"><a href="/${lang}/jobs">${t.jobs}</a>${icon('chevron')}<strong>${t.detail}</strong></nav></div></div><main id="detail-content"><div class="wrap detail-layout"><div class="detail-main tone-${c.tone}"><article class="overview-card" aria-labelledby="job-title"><div class="overview-top"><span class="cat-icon">${icon(c.icon)}</span><span class="category-pill">${safe(catName)}</span></div><h1 id="job-title">${safe(localized(j,'title'))}</h1>${company?`<div class="company-line">${icon('building')}${safe(company)}</div>`:''}${locationCards.length?`<div class="location-grid ${locationCards.length===1?'location-grid--single':''}">${locationCards.map(([label,val,ico,tone])=>`<div class="location-tile location-tile--${tone}"><span class="location-icon">${icon(ico)}</span><div class="location-copy"><p class="location-label">${label}</p><p class="location-value">${safe(val)}</p></div></div>`).join('')}</div>`:''}${supportingMeta.length?`<div class="overview-meta">${supportingMeta.map(([label,val,ico])=>`<div class="meta"><span class="meta-icon">${icon(ico)}</span><span class="meta-copy"><span class="meta-label">${label}</span><span class="meta-value">${safe(val)}</span></span></div>`).join('')}</div>`:''}${annual||monthly?`<div class="salary-panel"><div class="salary-primary"><span class="salary-orb">${icon('yen')}</span><div class="salary-copy"><p class="salary-kicker">${annual?t.salary:t.monthly}</p><p class="salary-value">${safe(period(annual||monthly,annual?'yearly':'monthly'))}</p></div></div>${annual&&monthly?`<div class="monthly"><p class="salary-kicker">${t.monthly}</p><strong>${safe(period(monthly,'monthly'))}</strong></div>`:''}</div>`:''}<div class="micro-row">${j.jobCode?`<span>${t.jobid}: <b>${safe(j.jobCode)}</b></span>`:''}${jobDate?`<span>${t.created}: <b>${safe(jobDate)}</b></span>`:''}${meta.updated?`<span>${t.updated}: <b>${safe(meta.updated)}</b></span>`:''}</div><div class="mobile-actions">${secondary(true)}</div></article><div id="section-links-slot"></div>${sec.overview?section('overview',`${sec.overview.label?`<h3 class="subheading">${safe(sec.overview.label)}</h3>`:''}${lines(sec.overview.text)}`):''}${sec.requirements?.length?section('requirements',sec.requirements.map(reqList).join('')):''}${conditions?section('conditions',conditions):''}${benefit.benefits?section('benefits',benefit.benefits):''}${sec.process?.text?section('process',`<div class="process-text">${safe(sec.process.text)}</div>`):''}${comp?section('company',comp):''}${related(j)}</div><aside class="detail-side" aria-label="${t.suggest}"><div class="action-card"><p class="side-kicker">${annual?t.salary:t.monthly}</p><p class="side-salary">${safe(period(annual||monthly,annual?'yearly':'monthly'))}</p>${annual&&monthly?`<p class="side-month">${t.monthly}: ${safe(period(monthly,'monthly'))}</p>`:''}<button type="button" class="action-primary js-nominate">${icon('user')}${t.suggest}${icon('arrow')}</button><div class="action-divider"></div>${secondary()}<div class="side-meta">${j.jobCode?`<span>${t.jobid}: <b>${safe(j.jobCode)}</b></span>`:''}</div></div></aside></div></main><footer class="site-footer"><div class="wrap"><div class="footer-grid"><div class="footer-brand"><img src="${ASSETS}jobshare-white.png" alt="JobShare" width="1563" height="468"><p>${t.footer}</p></div><div><h3>${t.explore}</h3><ul><li><a href="/${lang}/jobs">${t.jobs}</a></li><li><a href="https://ws-jobshare.com/${lang}/about-us">${t.about}</a></li><li><a href="https://ws-jobshare.com/${lang}/blog">${t.blog}</a></li></ul></div><div><h3>${t.contact}</h3><address>3F, 82 Tuệ Tĩnh, Hai Bà Trưng,<br>Hanoi, Vietnam, 10000</address><a href="mailto:jobshare@work-station.vn">jobshare@work-station.vn</a></div></div><div class="footer-bottom"><span>© 2026 <span class="no-split">Workstation JobShare</span></span><a href="https://ws-jobshare.com">ws-jobshare.com</a></div></div></footer><div class="mobile-sticky"><button type="button" class="action-primary js-nominate">${icon('user')}${t.suggest}${icon('arrow')}</button></div><div id="toast" role="status" aria-live="polite" hidden></div>`;
}
let toastTimer;
const toast=(message,err=false)=>{const node=document.getElementById('toast');if(!node)return;node.textContent=message;node.style.background=err?'#be1824':'#112f3d';node.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>{node.hidden=true;},3500);};
const API=(window.JOBSHARE_API_BASE||'https://ws-jobshare.com/api_jobshare/api').replace(/\/$/,'');
const authHeaders=()=>{const token=(()=>{try{return localStorage.getItem('token')||'';}catch{return '';}})();return token?{Authorization:`Bearer ${token}`}:{}};
const fetchJob=async(id)=>{
 if(typeof window.JobShareDetailHooks?.loadJob==='function')return window.JobShareDetailHooks.loadJob(id,lang);
 const response=await fetch(`${API}/ctv/jobs/${encodeURIComponent(id)}`,{headers:{...authHeaders(),Accept:'application/json'}});
 if(!response.ok)throw new Error(`${response.status}`);
 const json=await response.json();if(!json?.success)throw new Error(json?.message||t.failedLoad);
 return json?.data?.job||json?.data;
};
// Hooks supply the real host app's nomination guard, download client and candidate link generator.
const candidateUrl=j=>typeof window.JobShareDetailHooks?.candidateUrl==='function'?window.JobShareDetailHooks.candidateUrl(j,lang):`https://ws-jobshare.com/${lang}/candidate/jobs/${encodeURIComponent(j.slug||j.id)}/view`;
const onNominate=()=>{
 if(isBusy)return;
 if(typeof window.JobShareDetailHooks?.onNominate==='function')return window.JobShareDetailHooks.onNominate({jobId:currentJob.id,job:currentJob,lang});
 // Production's existing /nominate route owns login/auth state and actual recommendation form.
 window.location.assign(`https://ws-jobshare.com/${lang}/jobs/${encodeURIComponent(currentJob.id)}/nominate`);
};
const copyURL=async()=>{try{const url=candidateUrl(currentJob);if(navigator.clipboard?.writeText)await navigator.clipboard.writeText(url);else{const field=document.createElement('textarea');field.value=url;field.style.position='fixed';field.style.opacity='0';document.body.append(field);field.select();if(!document.execCommand('copy'))throw new Error('Copy unavailable');field.remove();}toast(t.copied);}catch{toast(t.copyErr,true);}};
const fileOptions=async()=>{
 if(fileFlags)return fileFlags;
 // The archived HTML does not reveal JD-file flags. Check the actual job record first; never invent availability.
 const j=await fetchJob(currentJob.id);fileFlags=existingTypes(j);return fileFlags;
};
const download=async(type,button)=>{
 const hook=window.JobShareDetailHooks?.downloadJobFile;
 button.disabled=true;
 try{
  if(typeof hook==='function'){await hook(currentJob.id,type,'ctv');toast(t.download);return;}
  const path=`${API}/ctv/jobs/${encodeURIComponent(currentJob.id)}`;
  const urlResp=await fetch(`${path}/view-url?fileType=${encodeURIComponent(type)}&purpose=download`,{headers:{...authHeaders(),Accept:'application/json'}});
  if(!urlResp.ok)throw new Error(`${urlResp.status}`);
  const data=await urlResp.json();if(!data?.success)throw new Error(data?.message||t.failedDownload);
  const signed=data?.data?.url;
  const result=await fetch(`${path}/download?fileType=${encodeURIComponent(type)}`,{headers:authHeaders()});
  const res=result.ok?result:(signed?await fetch(signed):result);
  if(!res.ok)throw new Error(`${res.status}`);
  const blob=await res.blob(),temp=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=temp;a.download=(data?.data?.filename||`job-${currentJob.id}-${type}.pdf`).split('/').pop();document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(temp),30000);
 }catch(e){console.warn('JD download:',e);toast(t.failedDownload,true);}finally{button.disabled=false;}
};
function bind(){
 const menuButton=document.querySelector('.menu-btn');
 menuButton?.addEventListener('click',()=>{const open=menuButton.getAttribute('aria-expanded')==='true';menuButton.setAttribute('aria-expanded',String(!open));document.getElementById('main-nav').classList.toggle('open',!open);});
 document.querySelectorAll('.js-nominate').forEach(b=>b.addEventListener('click',onNominate));
 document.querySelectorAll('.js-copy').forEach(b=>b.addEventListener('click',copyURL));
 document.querySelectorAll('.js-download').forEach(button=>button.addEventListener('click',async()=>{
  const box=button.closest('.file-picker').querySelector('.download-menu'),expanded=button.getAttribute('aria-expanded')==='true';
  document.querySelectorAll('.download-menu').forEach(m=>m.hidden=true);document.querySelectorAll('.js-download').forEach(b=>b.setAttribute('aria-expanded','false'));
  if(expanded)return;
  button.disabled=true;
  try{const opts=await fileOptions();if(!opts.length){toast(t.noFile,true);return;}
   box.innerHTML=opts.map(type=>`<button type="button" data-type="${type}">${t.fileNames[fileTypes.indexOf(type)]}</button>`).join('');
   box.hidden=false;button.setAttribute('aria-expanded','true');
   box.querySelectorAll('[data-type]').forEach(opt=>opt.addEventListener('click',()=>{box.hidden=true;button.setAttribute('aria-expanded','false');download(opt.dataset.type,button);}));
  }catch(e){console.warn('Check available JD files:',e);toast(t.checkFile,true);}finally{button.disabled=false;}
 }));
 document.addEventListener('click',e=>{if(e.target.closest('.file-picker'))return;document.querySelectorAll('.download-menu').forEach(m=>m.hidden=true);document.querySelectorAll('.js-download').forEach(b=>b.setAttribute('aria-expanded','false'));});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'){document.querySelectorAll('.download-menu').forEach(m=>m.hidden=true);document.querySelectorAll('.js-download').forEach(b=>b.setAttribute('aria-expanded','false'));}});
 const anchors=[...document.querySelectorAll('.section-links [data-section]')];
 if('IntersectionObserver' in window){const ob=new IntersectionObserver(entries=>{for(const en of entries)if(en.isIntersecting){anchors.forEach(a=>a.setAttribute('aria-current',String(a.dataset.section===en.target.id)));}},{rootMargin:'-118px 0px -68% 0px',threshold:0});document.querySelectorAll('section[id]').forEach(sec=>ob.observe(sec));}
}
function render(job,snapshot){currentJob=job;source=snapshot;document.title=`${localized(job,'title')} | Workstation JobShare`;document.getElementById('app').innerHTML=appMarkup(job,snapshot);document.getElementById('section-links-slot').innerHTML=headings();bind();}
const route=location.pathname.match(/^\/(vi|en|ja)\/jobs\/([^/]+)/),id=route?.[2]||String(P.demoId);
if(String(id)===String(P.demoId))render(currentJob,source);
else{document.getElementById('app').innerHTML=`<div class="wrap loading-state">${t.loading}</div>`;fetchJob(id).then(job=>{if(!job)throw Error('no job');render(job,{metadata:{},sections:sourceSections(job)});}).catch(e=>{console.warn('Job detail:',e);document.getElementById('app').innerHTML=`<div class="wrap loading-state error-state">${t.failedLoad} <a href="/${lang}/jobs">${t.back}</a></div>`;});}
function sourceSections(job){
 // Production integration: prefer the existing normalized detail/sections from the host.
 if(job.jobDetailSections)return job.jobDetailSections;
 const r=(job.requirements||[]).filter(x=>x.content||x.contentEn||x.contentJp);
 const grouped=['required','preferred'].map(status=>({label:status==='required'?t.required:t.preferred,items:r.filter(x=>x.status===status).map(x=>localized(x,'content'))})).filter(g=>g.items.length);
 const overview=localized(job,'jobDescription')||localized(job,'jobContent')||localized(job,'description')||'';
 const ben=Array.isArray(job.benefits)?job.benefits.map(x=>({label:localized(x,'name')||'',text:localized(x,'description')||localized(x,'content')})):[];
 const process=localized(job,'interviewProcess')||localized(job,'recruitmentProcess');
 const companyText=localized(job.recruitingCompany,'description')||'';
 return {overview:overview?{text:overview,label:''}:null,requirements:grouped,benefits:ben,process:process?{text:process}:null,company:companyText?{text:companyText,info:localized(job.recruitingCompany,'companyName'),sectors:[]}:null};
}
})();
