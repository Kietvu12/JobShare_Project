(function(global){
  function initJobShareHomeV2(root, options){
    if(!root || root.dataset.v2Bound==='true') return function(){};
    root.dataset.v2Bound='true';
    root.classList.add('v2-motion');
    options=options||{};
    var reduce=global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var observers=[], timers=[];
    var q=function(sel,ctx){return Array.prototype.slice.call((ctx||root).querySelectorAll(sel));};

    var originals=[];
    q('[data-route]').forEach(function(a){originals.push([a,a.getAttribute('href')]);var key=a.dataset.route;if(options.routes&&options.routes[key])a.setAttribute('href',options.routes[key]);});

    // stagger delays, like the richer reference LPs
    q('[data-stagger]').forEach(function(group){Array.prototype.slice.call(group.children).forEach(function(el,i){if(el && el.hasAttribute && el.hasAttribute('data-reveal')){el.style.transitionDelay=(Math.min(i,7)*75)+'ms';}});});

    // reveal once on entry
    var reveal=q('[data-reveal]');
    if(reduce || !('IntersectionObserver' in global)) reveal.forEach(function(el){el.classList.add('is-visible');});
    else{
      var ro=new IntersectionObserver(function(entries,obs){entries.forEach(function(entry){if(!entry.isIntersecting)return;entry.target.classList.add('is-visible');obs.unobserve(entry.target);});},{threshold:.08,rootMargin:'0px 0px -35px 0px'});
      observers.push(ro);reveal.forEach(function(el){ro.observe(el);});
    }

    // fail-safe: keep editorial images visible even if reveal observation misses them
    q('.image-reveal').forEach(function(el){el.classList.add('is-visible');});

    // number count-up in the hero proof chips
    q('[data-count]').forEach(function(el){
      var target=parseInt(el.dataset.count||'0',10),suffix=el.dataset.suffix||'';
      if(reduce||!('IntersectionObserver'in global)){el.textContent=target.toLocaleString()+suffix;return;}
      var done=false;var io=new IntersectionObserver(function(es,obs){if(done||!es.some(function(e){return e.isIntersecting;}))return;done=true;obs.disconnect();var start=performance.now(),dur=850;function tick(now){var p=Math.min(1,(now-start)/dur),e=1-Math.pow(1-p,3);el.textContent=Math.round(target*e).toLocaleString()+suffix;if(p<1)requestAnimationFrame(tick);}requestAnimationFrame(tick);},{threshold:.6});
      observers.push(io);io.observe(el);
    });

    // bounded pointer spotlight on cards/panels
    q('[data-spotlight]').forEach(function(el){
      el.addEventListener('pointermove',function(e){var r=el.getBoundingClientRect();el.style.setProperty('--mx',(((e.clientX-r.left)/r.width)*100)+'%');el.style.setProperty('--my',(((e.clientY-r.top)/r.height)*100)+'%');});
    });

    // press feedback for keyboard/click
    q('[data-press]').forEach(function(el){var press=function(){el.classList.add('is-pressed');timers.push(setTimeout(function(){el.classList.remove('is-pressed');},180));};el.addEventListener('click',press);el.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();press();}});});

    // flow steps animate in sequence once the process block is visible
    var flow=root.querySelector('[data-flow-sequence]');
    if(flow){var steps=q('.flow-step',flow);var playFlow=function(){steps.forEach(function(s,i){timers.push(setTimeout(function(){s.classList.add('sequence-active');timers.push(setTimeout(function(){s.classList.remove('sequence-active');},700));},i*260));});};
      if(reduce) steps.forEach(function(s){s.classList.add('is-visible');});
      else if('IntersectionObserver'in global){var fio=new IntersectionObserver(function(es,obs){if(es.some(function(e){return e.isIntersecting;})){playFlow();obs.disconnect();}},{threshold:.35});observers.push(fio);fio.observe(flow);}
    }

    // FAQ accordion
    var details=q('.faq details');details.forEach(function(d){d.addEventListener('toggle',function(){if(!d.open)return;details.forEach(function(o){if(o!==d)o.open=false;});});});


    // Subtle image parallax on editorial visuals, inspired by the Seta/BIM-DX motion rhythm
    var parallaxMedia=q('[data-image-parallax]');
    var syncMedia=function(){
      if(reduce) return;
      var vh=global.innerHeight||document.documentElement.clientHeight;
      parallaxMedia.forEach(function(fig){
        var img=fig.querySelector('img'); if(!img)return;
        var rr=fig.getBoundingClientRect();
        if(rr.bottom<0||rr.top>vh)return;
        var n=((rr.top+rr.height/2)-vh/2)/Math.max(vh,1);
        img.style.setProperty('--media-y',Math.max(-10,Math.min(10,-n*12))+'px');
        img.style.transform='translateY('+Math.max(-10,Math.min(10,-n*12))+'px) scale(1.035)';
      });
    };
    // scoped reading progress + subtle image parallax
    var progress=root.querySelector('.read-progress'),hero=root.querySelector('.hero'),heroPerson=root.querySelector('.hero-person'),final=root.querySelector('.final'),finalPerson=root.querySelector('.final-person'),mobileCta=root.querySelector('.mobile-cta');
    var ticking=false;
    var sync=function(){ticking=false;var r=root.getBoundingClientRect(),viewport=global.innerHeight||document.documentElement.clientHeight,total=Math.max(root.offsetHeight-viewport,1),moved=Math.min(Math.max(-r.top,0),total),p=(moved/total)*100;root.style.setProperty('--progress',p+'%');if(progress)progress.style.width=p+'%';syncMedia();
      if(!reduce&&global.matchMedia('(pointer:fine)').matches){if(hero&&heroPerson){var hr=hero.getBoundingClientRect();var hp=Math.max(-1,Math.min(1,-hr.top/Math.max(hr.height,1)));heroPerson.style.marginTop=(hp*10)+'px';}if(final&&finalPerson){var fr=final.getBoundingClientRect();var fp=Math.max(-1,Math.min(1,(global.innerHeight-fr.top)/Math.max(fr.height,1)));finalPerson.style.marginTop=(-fp*8)+'px';}}
      if(floatCta&&hero&&final){floatCta.classList.toggle('show',hero.getBoundingClientRect().bottom<0&&final.getBoundingClientRect().top>global.innerHeight*.75);}if(mobileCta&&hero&&final){mobileCta.classList.toggle('show',hero.getBoundingClientRect().bottom<global.innerHeight*.22&&final.getBoundingClientRect().top>global.innerHeight*.78);}
    };
    var onScroll=function(){if(!ticking){ticking=true;requestAnimationFrame(sync);}};global.addEventListener('scroll',onScroll,{passive:true});global.addEventListener('resize',onScroll,{passive:true});

    // hero chips subtle pointer parallax
    var chips=q('.hero-chip'),onMove=null;if(hero&&chips.length&&!reduce&&global.matchMedia('(pointer:fine)').matches){onMove=function(e){var rect=hero.getBoundingClientRect(),x=(e.clientX-rect.left)/rect.width-.5,y=(e.clientY-rect.top)/rect.height-.5;chips.forEach(function(c,i){var k=i?7:10;c.style.marginLeft=(x*k)+'px';c.style.marginTop=(y*k)+'px';});};hero.addEventListener('mousemove',onMove);hero.addEventListener('mouseleave',function(){chips.forEach(function(c){c.style.marginLeft='';c.style.marginTop='';});});}

    // Desktop floating CTA between hero and final CTA
    var floatCta=document.createElement('aside');floatCta.className='floating-cta-v4';floatCta.setAttribute('aria-label','Quick actions');
    var doc=root.querySelector('[data-route="documents"]'),reg=root.querySelector('[data-route="register"]'),contact=root.querySelector('[data-route="contact"]');
    if(doc&&reg&&contact){var a1=doc.cloneNode(true),a2=reg.cloneNode(true),a3=contact.cloneNode(true);a1.className='';a2.className='';a3.className='';floatCta.append(a1,a2,a3);root.append(floatCta);}else floatCta=null;
    sync();

    return function cleanup(){observers.forEach(function(o){o.disconnect();});timers.forEach(clearTimeout);global.removeEventListener('scroll',onScroll);global.removeEventListener('resize',onScroll);if(hero&&onMove)hero.removeEventListener('mousemove',onMove);originals.forEach(function(pair){pair[0].setAttribute('href',pair[1]);});parallaxMedia.forEach(function(fig){var img=fig.querySelector('img');if(img)img.style.transform='';});if(floatCta&&floatCta.parentNode)floatCta.parentNode.removeChild(floatCta);if(mobileCta)mobileCta.classList.remove('show');root.classList.remove('v2-motion');root.dataset.v2Bound='false';root.style.removeProperty('--progress');reveal.forEach(function(el){el.classList.add('is-visible');el.style.transitionDelay='';});};
  }
  global.initJobShareHomeV2=initJobShareHomeV2;
})(window);
