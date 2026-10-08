(() => {
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 if('IntersectionObserver' in window&&!reduced){
  document.body.classList.add('motion');
  const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('is-visible');observer.unobserve(e.target)}}),{threshold:.05});
  document.querySelectorAll('[data-reveal]').forEach(e=>observer.observe(e));
 }
 const toggle=document.querySelector('.menu-btn'),nav=document.querySelector('.nav');
 function closeMenu(){nav.classList.remove('open');toggle.setAttribute('aria-expanded','false')}
 toggle.addEventListener('click',()=>{const open=toggle.getAttribute('aria-expanded')==='true';toggle.setAttribute('aria-expanded',String(!open));nav.classList.toggle('open',!open)});
 nav.addEventListener('click',e=>{if(e.target.closest('a'))closeMenu()});
 document.addEventListener('click',e=>{if(!e.target.closest('.site-header'))closeMenu()});
 const up=document.querySelector('.back-top');
 function update(){up.classList.toggle('show',window.scrollY>650)}
 window.addEventListener('scroll',update,{passive:true});update();
 const contact=document.querySelector('.contact-dialog');
 document.querySelectorAll('[data-action=contact]').forEach(b=>b.addEventListener('click',()=>contact.showModal()));
 contact.addEventListener('click',e=>{if(e.target===contact){const r=contact.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)contact.close()}});

 const launcher=document.querySelector('.support-launcher'),panel=document.querySelector('.support-panel'),close=document.querySelector('.support-close');
 const home=document.querySelector('#support-home'),messages=document.querySelector('#support-messages'),tabs=[...document.querySelectorAll('.support-tabs [role=tab]')];
 const config=JSON.parse(document.querySelector('#chat-config').textContent),form=document.querySelector('#support-form'),input=document.querySelector('#chat-body'),name=document.querySelector('#visitor-name'),send=form.querySelector('button'),error=document.querySelector('.chat-error'),history=document.querySelector('.chat-history');
 let session='',stream=null,busy=false,chatMessages=[],priorFocus=null;
 try{session=sessionStorage.getItem('jobshare_candidate_chat_session')||'';name.value=sessionStorage.getItem('jobshare_candidate_visitor_name')||''}catch{}
 function closeStream(){if(stream){stream.close();stream=null}}
 function setTab(which){const isMessages=which==='messages';home.hidden=isMessages;messages.hidden=!isMessages;tabs.forEach((t,i)=>{t.setAttribute('aria-selected',String(i===(isMessages?1:0)));t.tabIndex=i===(isMessages?1:0)?0:-1});if(isMessages&&session)loadMessages().then(startStream).catch(()=>error.hidden=false)}
 function openChat(which='home'){closeMenu();priorFocus=document.activeElement;panel.hidden=false;launcher.setAttribute('aria-expanded','true');setTab(which);close.focus()}
 function closeChat(){panel.hidden=true;launcher.setAttribute('aria-expanded','false');closeStream();(priorFocus||launcher).focus()}
 launcher.addEventListener('click',()=>panel.hidden?openChat():closeChat());close.addEventListener('click',closeChat);
 tabs.forEach((t,i)=>t.addEventListener('click',()=>setTab(i===0?'home':'messages')));
 document.querySelector('.support-tabs').addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();const i=tabs.indexOf(document.activeElement)===0?1:0;setTab(i?'messages':'home');tabs[i].focus()}});
 window.addEventListener('jobshare:open-candidate-chat',e=>openChat(e.detail?.tab||'home'));
 document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeMenu();if(!panel.hidden&&!contact.open)closeChat()}});
 function render(){history.replaceChildren();for(const m of chatMessages){const bubble=document.createElement('div');bubble.className='chat-bubble'+(m.senderType==='visitor'?' visitor':'');bubble.textContent=m.body||'';if(m.createdAt||m.created_at){const time=document.createElement('small');time.textContent=new Date(m.createdAt||m.created_at).toLocaleTimeString(document.documentElement.lang,{hour:'2-digit',minute:'2-digit'});bubble.append(time)}history.append(bubble)}history.scrollTop=history.scrollHeight;if(session){send.textContent=config.send;document.querySelector('.name-label').hidden=true;document.querySelector('.chat-hint').hidden=true}}
 async function api(path,options={}){const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);try{const r=await fetch(config.api+path,{...options,signal:controller.signal,headers:{'Content-Type':'application/json',...(options.headers||{})}});const data=await r.json();if(!r.ok||!data.success)throw Error(data.message||'Request failed');return data.data}finally{clearTimeout(timer)}}
 async function loadMessages(){const data=await api('/public/candidate-chat/messages?'+new URLSearchParams({sessionToken:session}));chatMessages=data.messages||[];render()}
 function startStream(){closeStream();if(panel.hidden||!session)return;stream=new EventSource(config.api+'/public/candidate-chat/stream?'+new URLSearchParams({sessionToken:session}));stream.addEventListener('chat',e=>{try{const v=JSON.parse(e.data);if(v.type==='message'&&v.message){const ix=chatMessages.findIndex(m=>m.id===v.message.id);if(ix<0)chatMessages.push(v.message);else chatMessages[ix]=v.message;render()}}catch{}})}
 form.addEventListener('submit',async e=>{e.preventDefault();if(busy||!input.value.trim())return;busy=true;send.disabled=true;send.textContent=config.connecting;error.hidden=true;try{if(!session){const data=await api('/public/candidate-chat/sessions',{method:'POST',body:JSON.stringify({visitorLabel:name.value.trim()||undefined})});if(!data.sessionToken)throw Error('No session');session=data.sessionToken;try{sessionStorage.setItem('jobshare_candidate_chat_session',session);sessionStorage.setItem('jobshare_candidate_visitor_name',name.value.trim())}catch{}}
  const sent=await api('/public/candidate-chat/messages',{method:'POST',body:JSON.stringify({sessionToken:session,body:input.value.trim()})});if(sent.message){chatMessages.push(sent.message);render()}input.value='';await loadMessages();startStream();input.focus();
 }catch{error.hidden=false}finally{busy=false;send.disabled=false;send.textContent=session?config.send:config.start}});
 window.addEventListener('pagehide',closeStream);

 // Preserve V3's overlap avoidance for the yellow support control and back-to-top button.
 const controls=document.querySelector('.floating-controls');
 function avoidOverlap(){
  const r=controls.getBoundingClientRect(),base=innerWidth<=720?12:20;
  let y=innerHeight-base-r.height;const x=r.left;
  if(panel.hidden){
   const targets=[...document.querySelectorAll('main h1,main h2,main h3,main .actions,.nav.open,.roles')].map(e=>e.getBoundingClientRect()).filter(t=>t.width&&t.bottom>0&&t.top<innerHeight&&t.right>x&&t.left<r.right);
   for(let i=0;i<8;i++){const hit=targets.find(t=>t.top<y+r.height&&t.bottom>y);if(!hit)break;y=hit.top-r.height-10;}
  }
  controls.style.bottom=Math.max(base,Math.min(innerHeight-r.height-100,innerHeight-y-r.height))+'px';
 }
 let queued=false;function scheduleAvoid(){if(!queued){queued=true;requestAnimationFrame(()=>{queued=false;avoidOverlap()})}}
 window.addEventListener('scroll',scheduleAvoid,{passive:true});window.addEventListener('resize',scheduleAvoid);document.fonts.ready.then(scheduleAvoid);scheduleAvoid();
})();
