(function(global){
 'use strict';
 const mounted=new WeakMap();
 function init(root,options={}){
  if(!root)return ()=>{};
  mounted.get(root)?.();
  const ctl=new AbortController(),signal=ctl.signal,frames=new Set(),observers=[],cleanups=[];
  const reduce=global.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const q=(s,el=root)=>[...el.querySelectorAll(s)];
  const on=(el,event,fn)=>el.addEventListener(event,fn,{signal});
  const frame=fn=>{const id=global.requestAnimationFrame(t=>{frames.delete(id);if(!signal.aborted)fn(t)});frames.add(id);return id;};
  const reveal=el=>el.classList.add('is-visible');
  const previousOffset=root.style.getPropertyValue('--host-header-offset');
  if(Number.isFinite(options.headerOffset))root.style.setProperty('--host-header-offset',Math.max(0,options.headerOffset)+'px');
  const counters=q('[data-count]');
  counters.forEach(el=>{const n=options.metrics?.[el.dataset.key];if(Number.isFinite(n)&&n>=0)el.dataset.count=String(n);el.textContent=new Intl.NumberFormat('en-US').format(+el.dataset.count)});
  if(!reduce&&'IntersectionObserver' in global){
   root.classList.add('j6-motion');
   const obs=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){reveal(e.target);obs.unobserve(e.target)}}),{threshold:.06});observers.push(obs);q('[data-reveal]').forEach(el=>obs.observe(el));
   const countObs=new IntersectionObserver(entries=>entries.forEach(e=>{if(!e.isIntersecting)return;countObs.unobserve(e.target);let start;const n=+e.target.dataset.count;function tick(time){start??=time;const p=Math.min(1,(time-start)/1100);e.target.textContent=new Intl.NumberFormat('en-US').format(Math.round(n*(1-(1-p)**3)));if(p<1)frame(tick)}frame(tick)}),{threshold:.5});observers.push(countObs);counters.forEach(el=>countObs.observe(el));
  }else q('[data-reveal]').forEach(reveal);
  // Every panel is visible before enhancement; each group owns its selection and keyboard handling.
  const groups=q('[data-tabs]').map(group=>{
   const list=group.querySelector('[data-tablist]'),tabs=q('[data-tab]',list),panels=q('[data-panel]',group);
   list.setAttribute('role','tablist');tabs.forEach(tab=>tab.setAttribute('role','tab'));panels.forEach(panel=>{panel.setAttribute('role','tabpanel');panel.tabIndex=0});
   const choose=(n,focus=false)=>{
    tabs.forEach((tab,i)=>{tab.setAttribute('aria-selected',String(i===n));tab.tabIndex=i===n?0:-1;if(i===n&&focus)tab.focus()});
    panels.forEach((panel,i)=>{panel.hidden=i!==n;panel.classList.remove('j6-enter');if(i===n&&!reduce){void panel.offsetWidth;panel.classList.add('j6-enter')}});
   };
   tabs.forEach((tab,i)=>{on(tab,'click',()=>choose(i));on(tab,'keydown',e=>{let n=i;if(e.key==='ArrowRight')n=(i+1)%tabs.length;else if(e.key==='ArrowLeft')n=(i+tabs.length-1)%tabs.length;else if(e.key==='Home')n=0;else if(e.key==='End')n=tabs.length-1;else return;e.preventDefault();choose(n,true)})});
   choose(0);cleanups.push(()=>{list.removeAttribute('role');tabs.forEach(tab=>{tab.removeAttribute('role');tab.removeAttribute('aria-selected');tab.removeAttribute('tabindex')});panels.forEach(panel=>{panel.hidden=false;panel.removeAttribute('role');panel.removeAttribute('tabindex');panel.classList.remove('j6-enter')})});return {choose,tabs};
  });
  const filters=q('[data-source]'),rows=q('[data-source-row]'),select=root.querySelector('[data-stage]'),result=root.querySelector('.j6-result'),empty=root.querySelector('.j6-empty');let source='-1';
  function filter(){let count=0;rows.forEach(row=>{row.hidden=(source!=='-1'&&row.dataset.sourceRow!==source)||(select.value!=='-1'&&row.dataset.stageRow!==select.value);if(!row.hidden)count++});empty.hidden=count>0;result.textContent=count+' '+result.dataset.resultLabel;}
  filters.forEach(button=>on(button,'click',()=>{source=button.dataset.source;filters.forEach(b=>b.setAttribute('aria-pressed',String(b===button)));filter()}));on(select,'change',filter);
  const originalLinks=q('[data-register]').map(el=>[el,el.getAttribute('href')]);
  if(options.registerHref)originalLinks.forEach(([el])=>el.href=options.registerHref);
  const navLinks=q('[data-nav]'),sections=navLinks.map(a=>root.querySelector('#'+a.dataset.nav));let scheduled=false;
  function updateScroll(){scheduled=false;const rect=root.getBoundingClientRect();const travel=Math.max(1,root.scrollHeight-global.innerHeight);root.style.setProperty('--progress',String(Math.min(1,Math.max(0,-rect.top/travel))));let index=0;const offset=parseFloat(getComputedStyle(root).getPropertyValue('--host-header-offset'))||0;sections.forEach((section,i)=>{if(section.getBoundingClientRect().top<offset+160)index=i});navLinks.forEach((link,i)=>{if(i===index)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current')})}
  function schedule(){if(!scheduled){scheduled=true;frame(updateScroll)}}on(global,'scroll',schedule);on(global,'resize',schedule);schedule();
  on(root,'click',e=>{
   const a=e.target.closest('a');if(!a||!root.contains(a)||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey||e.button!==0)return;
   if(a.matches('[data-register]')&&options.onRegister){e.preventDefault();options.onRegister();return;}
   const hash=a.getAttribute('href');if(!hash?.startsWith('#'))return;
   const target=q('[id]').find(el=>el.id===hash.slice(1));if(!target)return;e.preventDefault();
   if(a.hasAttribute('data-pick'))groups[0].choose(+a.dataset.pick);
   // Move keyboard focus to the destination without introducing a second scroll.
   const focusTarget=a.hasAttribute('data-pick')?groups[0].tabs[+a.dataset.pick]:target;
   const old=focusTarget.getAttribute('tabindex');if(old===null)focusTarget.setAttribute('tabindex','-1');focusTarget.focus({preventScroll:true});if(old===null)focusTarget.addEventListener('blur',()=>focusTarget.removeAttribute('tabindex'),{once:true,signal});
   target.scrollIntoView({behavior:reduce?'auto':'smooth',block:'start'});
  });
  const cleanup=()=>{ctl.abort();observers.forEach(o=>o.disconnect());frames.forEach(global.cancelAnimationFrame);cleanups.forEach(f=>f());root.classList.remove('j6-motion');q('[data-reveal]').forEach(reveal);counters.forEach(el=>el.textContent=new Intl.NumberFormat('en-US').format(+el.dataset.count));rows.forEach(row=>row.hidden=false);filters.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.source==='-1')));select.value='-1';empty.hidden=true;result.textContent='3 '+result.dataset.resultLabel;originalLinks.forEach(([el,href])=>el.setAttribute('href',href));root.style.removeProperty('--progress');if(previousOffset)root.style.setProperty('--host-header-offset',previousOffset);else root.style.removeProperty('--host-header-offset');navLinks.forEach(a=>a.removeAttribute('aria-current'));mounted.delete(root)};
  mounted.set(root,cleanup);return cleanup;
 }
 global.JobShareBusinessV6={init};
})(window);
