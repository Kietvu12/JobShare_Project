import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
const root=new URL('.',import.meta.url).pathname,script=fs.readFileSync(root+'assets/app.js','utf8');
for (const lang of ['vi','en','ja']){
 const html=fs.readFileSync(`${root}${lang}/jobs/708/index.html`,'utf8');
 const m=html.match(/<script id="job-data" type="application\/json">([\s\S]*?)<\/script>/);assert(m,'embedded data found');
 const outputs={app:{innerHTML:''},'section-links-slot':{innerHTML:''},'job-data':{textContent:m[1]}};
 const document={currentScript:{src:`file://${root}assets/app.js`},documentElement:{lang},getElementById:x=>outputs[x]||null,querySelector:(sel)=>sel.startsWith('#')&&outputs.app.innerHTML.includes(`id="${sel.slice(1)}"`)?{}:null,querySelectorAll:()=>[],addEventListener:()=>{}};
 const loc={pathname:`/${lang}/jobs/708/`,protocol:'file:',origin:'file://'};
 const window={location:loc};const sandbox={document,window,location:loc,URL,Intl,console,setTimeout,clearTimeout,navigator:{}};
 vm.runInNewContext(script,sandbox,{filename:'app.js',timeout:1000});
 const rendered=outputs.app.innerHTML+outputs['section-links-slot'].innerHTML;
 assert.equal((rendered.match(/<h1(?:\s|>)/g)||[]).length,1,lang+' exactly one H1');
 assert.equal((rendered.match(/class="section-card section-[a-z]+"/g)||[]).length,6,lang+' 6 JD sections');
 assert(rendered.includes('js-nominate')&&rendered.includes('js-copy')&&rendered.includes('js-download'),lang+' real action controls');
 assert(rendered.includes('tone-it')&&rendered.includes('related-grid'),lang+' category continuity and related jobs');
 assert(rendered.includes('location-tile--work')&&rendered.includes('location-tile--recruit'),lang+' distinct workplace and recruitment region');
 assert(rendered.includes('salary-orb')&&rendered.includes('section-symbol'),lang+' salary and section icon treatments');
 assert(rendered.includes('class="header-register"'),lang+' registration link remains shared header');
 assert(rendered.includes('position')===false || rendered.length>5000);
 assert(!/\bundefined\b|>N\/A<|>null</.test(rendered),lang+' no fake placeholders');
 assert((rendered.match(/<a[^>]*href="#/g)||[]).length>=5,lang+' anchor links');
 if(lang==='vi')assert(rendered.includes('Visa kỹ sư')&&rendered.includes('Công ty Cổ phần Coretech')&&rendered.includes('Địa điểm tuyển dụng'));
 if(lang==='en')assert(rendered.includes('Coretech Co., Ltd.')&&rendered.includes('Requirements'));
 if(lang==='ja')assert(rendered.includes('株式会社コアテック')&&rendered.includes('応募条件')&&rendered.includes('採用対象地域'));
 console.log(lang, 'PASS', 'chars',rendered.length,'h1=1 sections=6 CTAs=3 category=yes related=yes');
}
