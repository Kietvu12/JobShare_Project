(function(global){
  'use strict';
  const posts=global.JOBSHARE_NEWS_POSTS, translations=global.JOBSHARE_NEWS_TRANSLATIONS, i18n=global.JOBSHARE_NEWS_I18N;
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const plain=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').toLowerCase();
  const title=(p,l)=> l==='vi' ? p.title : ((l==='ja' ? p.titleJp||p.titleJa : p.titleEn)||translations[p.id]?.[l]||p.title);
  const origin='https://ws-jobshare.com';
  const href=(p,l)=>`${(global.JobShareNewsConfig&&global.JobShareNewsConfig.blogBase)||(origin+'/'+l+'/business/blog')}/${encodeURIComponent(p.slug)}`;
  const date=(p,l)=>new Intl.DateTimeFormat(l==='ja'?'ja-JP':l==='vi'?'vi-VN':'en-US',{year:'numeric',month:l==='ja'?'2-digit':'short',day:'numeric',timeZone:'Asia/Ho_Chi_Minh'}).format(new Date(p.publishedAt));
  const bodyInVi=p=>Boolean(translations[p.id]);
  function querySnapshot({page=1,categoryId='',search=''}={}){
    const filtered=posts.filter(p=>(!categoryId||String(p.categoryId)===String(categoryId))&&(!search||plain([p.title,p.titleEn,p.titleJp,...Object.values(translations[p.id]||{})].join(' ')).includes(plain(search))));
    const totalPages=Math.max(1,Math.ceil(filtered.length/10));page=Math.max(1,Math.min(totalPages,Number(page)||1));
    return {posts:filtered.slice((page-1)*10,page*10),pagination:{page,total:filtered.length,totalPages,limit:10}};
  }
  function phrase(s,l){let text=esc(s);if(l==='ja')for(const token of ['外国人材採用','共催セミナー','技術人材','採用情報','JobShare Business'])text=text.split(token).join(`<span class="jp-token">${token}</span>`);return text;}
  function meta(p,l){return `<div class="article-meta"><span class="category-badge">${esc(i18n[l].cats[String(p.categoryId)]||p.category?.name||i18n[l].cats['2'])}</span><time datetime="${esc(p.date||p.publishedAt)}">${esc(date(p,l))}</time></div>`;}
  function languageNote(p,l){return bodyInVi(p)&&l!=='vi'?`<p class="article-language">${esc(i18n[l].vietnamese)}</p>`:'';}
  function picture(p,l,base,featured=false){
    const raw=p.asset||posts?.find(x=>x.id===p.id)?.asset||'assets/news-thumb-recruitment-01.webp';
    const asset=/^(https?:|\/)/.test(raw)?raw:(base+String(raw).replace(/^assets\//,''));
    const fallback=base+'news-thumb-recruitment-01.webp';
    return `<a href="${href(p,l)}" class="${featured?'featured-media':'card-thumb'}" tabindex="-1" aria-hidden="true"><img src="${esc(asset)}" data-fallback="${esc(fallback)}" onerror="if(this.src!==this.dataset.fallback&&!this.dataset.failed){this.dataset.failed='1';this.src=this.dataset.fallback;}" width="1200" height="800" alt="" ${featured?'fetchpriority="high"':'loading="lazy"'} decoding="async"></a>`;
  }
  function feature(p,l,base){const t=i18n[l];return `<p class="feature-label">${t.featured}</p><article class="featured-card" data-post-id="${p.id}">${picture(p,l,base,true)}<div class="featured-copy">${meta(p,l)}<h2 class="article-title"><a href="${href(p,l)}">${phrase(title(p,l),l)}</a></h2>${p.id===28?`<p class="feature-excerpt">${esc(t.featuredIntro)}</p>`:''}${languageNote(p,l)}<a class="text-link" href="${href(p,l)}">${t.read}<span aria-hidden="true">→</span></a></div></article>`;}
  function card(p,l,base){const t=i18n[l];return `<article class="news-card" data-post-id="${p.id}">${picture(p,l,base)}<div class="card-copy">${meta(p,l)}<h3 class="article-title"><a href="${href(p,l)}">${phrase(title(p,l),l)}</a></h3>${languageNote(p,l)}</div><a class="card-arrow" href="${href(p,l)}" aria-label="${esc(t.read+': '+title(p,l))}" tabindex="-1"><span aria-hidden="true">→</span></a></article>`;}
  function pagination(page,total,l){const t=i18n[l];if(total<=1)return '';let nums=[];for(let n=1;n<=total;n++)if(n===1||n===total||Math.abs(n-page)<=2)nums.push(n);let prev=0;return `<button type="button" data-page="${page-1}" ${page===1?'disabled':''} aria-label="${t.prev}">← <span>${t.prev}</span></button>`+nums.map(n=>{const gap=n-prev>1?'<span aria-hidden="true">…</span>':'';prev=n;return gap+`<button type="button" data-page="${n}" ${n===page?'aria-current="page"':''} aria-label="${t.page} ${n}">${n}</button>`;}).join('')+`<button type="button" data-page="${page+1}" ${page===total?'disabled':''} aria-label="${t.next}"><span>${t.next}</span> →</button>`;}
  function render(data,state,l,base=''){
    const t=i18n[l],pg=data.pagination,featured=pg.page===1&&!state.categoryId&&!state.search&&data.posts.length>0;
    return {featured:featured?feature(data.posts[0],l,base):'',list:data.posts.slice(featured?1:0).map(p=>card(p,l,base)).join('')||`<div class="news-state"><h3>${t.empty}</h3><p>${t.emptyHelp}</p><button class="btn btn-blue" data-reset>${t.reset}</button></div>`,pagination:pagination(pg.page,pg.totalPages,l),count:pg.total?t.count((pg.page-1)*10+1,Math.min(pg.page*10,pg.total),pg.total):t.count(0,0,0)};
  }
  global.JobShareNews={querySnapshot,render,title,href,date};
  global.initJobShareNews=function(root){
  if(!root||root.dataset.newsBound==='true') return function(){};
  root.dataset.newsBound='true';
  const l=root.lang,t=i18n[l],base=root.dataset.assetBase||'',state={page:1,categoryId:'',search:''};let request=0;
  const config=global.JobShareNewsConfig||{};
  // Preview: complete verified snapshot. Original host: original API/query contract.
  const apiBase=config.apiBase||(['test.ws-jobshare.com','ws-jobshare.com'].includes(location.hostname)?`${location.origin}/api_jobshare/api`:'');
  function readURL(){const p=new URLSearchParams(location.search);state.categoryId=['1','5','2'].includes(p.get('categoryId'))?p.get('categoryId'):'';state.search=p.get('search')||'';state.page=Math.max(1,Number(p.get('page'))||1);}
  function writeURL(){const u=new URL(location.href);['page','categoryId','search'].forEach(k=>u.searchParams.delete(k));if(state.page>1)u.searchParams.set('page',state.page);if(state.categoryId)u.searchParams.set('categoryId',state.categoryId);if(state.search)u.searchParams.set('search',state.search);history.replaceState({},'',u);document.querySelectorAll('.languages a').forEach(a=>{const u=new URL(a.href);u.search=location.search;a.href=u.href;});}
  async function getData(){
    if(config.provider)return config.provider({page:state.page,limit:10,sortBy:'publishedAt',sortOrder:'DESC',surface:'business',...(state.categoryId?{categoryId:state.categoryId}:{}),...(state.search?{search:state.search}:{})});
    if(!apiBase)return querySnapshot(state);
    const params=new URLSearchParams({page:state.page,limit:10,sortBy:'publishedAt',sortOrder:'DESC',surface:'business'});if(state.categoryId)params.set('categoryId',state.categoryId);if(state.search)params.set('search',state.search);
    const response=await fetch(`${apiBase.replace(/\/$/,'')}/public/posts?${params}`,{signal:AbortSignal.timeout(15000)});if(!response.ok)throw new Error('news-request');const data=await response.json();if(data.success===false||!Array.isArray(data.data?.posts))throw new Error('news-data');return data.data;
  }
  async function update(scroll=false){const id=++request;const list=root.querySelector('#news-results'),feat=root.querySelector('#featured-news');if(!list||!feat)return;
    root.querySelectorAll('[data-category]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.category===state.categoryId)));const searchInput=root.querySelector('#news-search');if(searchInput)searchInput.value=state.search;
    list.setAttribute('aria-busy','true');document.getElementById('news-status').textContent=apiBase?t.loading:'';
    try{const data=await getData();if(id!==request)return;state.page=data.pagination.page||state.page;const ui=render(data,state,l,base);feat.innerHTML=ui.featured;feat.hidden=!ui.featured;list.innerHTML=ui.list;document.getElementById('news-pagination').innerHTML=ui.pagination;document.getElementById('news-count').textContent=ui.count;document.getElementById('news-status').textContent='';writeURL();}
    catch(e){if(id!==request)return;feat.hidden=true;list.innerHTML=`<div class="news-state" role="alert"><p>${t.error}</p><button class="btn btn-blue" data-retry>${t.retry}</button></div>`;document.getElementById('news-pagination').innerHTML='';document.getElementById('news-count').textContent='';document.getElementById('news-status').textContent='';}
    finally{if(id===request){list.setAttribute('aria-busy','false');if(scroll)document.getElementById('articles').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}}
  }
  const onDocClick=e=>{const b=e.target.closest('button');if(!b||!root.contains(b))return;if(b.hasAttribute('data-category')){state.categoryId=b.dataset.category;state.page=1;update();}if(b.hasAttribute('data-page')){state.page=Number(b.dataset.page);update(true);}if(b.hasAttribute('data-reset')){state.categoryId='';state.search='';state.page=1;update();}if(b.hasAttribute('data-retry'))update();};
  document.addEventListener('click', onDocClick);
  let timer;const search=document.getElementById('news-search');const form=document.getElementById('news-search-form');
  const onInput=e=>{clearTimeout(timer);timer=setTimeout(()=>{state.search=e.target.value.trim();state.page=1;update();},300);};
  const onSubmit=e=>{e.preventDefault();clearTimeout(timer);state.search=search.value.trim();state.page=1;update();};
  if(search) search.addEventListener('input', onInput);
  if(form) form.addEventListener('submit', onSubmit);
  const onPop=()=>{readURL();update();};
  window.addEventListener('popstate', onPop);
  readURL();update();
  return function cleanup(){root.dataset.newsBound='false';clearTimeout(timer);document.removeEventListener('click', onDocClick);if(search) search.removeEventListener('input', onInput);if(form) form.removeEventListener('submit', onSubmit);window.removeEventListener('popstate', onPop);};
};
})(typeof window==='undefined'?globalThis:window);
