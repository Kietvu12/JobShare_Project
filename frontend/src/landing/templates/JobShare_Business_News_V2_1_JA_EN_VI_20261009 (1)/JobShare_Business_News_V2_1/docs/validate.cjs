const fs=require('fs'),vm=require('vm'),assert=require('assert');const path=require('path');const d=path.resolve(__dirname,'../dist');global.window=global;for(const n of ['news-data.js','news-i18n.js','news.js'])vm.runInThisContext(fs.readFileSync(path.join(d,n),'utf8'));
const model=JobShareNews;
assert.equal(JOBSHARE_NEWS_POSTS.length,14);assert.equal(new Set(JOBSHARE_NEWS_POSTS.map(p=>p.id)).size,14);
assert.deepEqual(model.querySnapshot().posts.map(p=>p.id),[28,29,30,31,32,33,34,35,36,37]);
assert.deepEqual(model.querySnapshot({page:2}).posts.map(p=>p.id),[22,21,20,19]);
for(const [category,count] of [['1',2],['5',10],['2',2]]){const q=model.querySnapshot({categoryId:category});assert.equal(q.pagination.total,count);assert(q.posts.every(p=>String(p.categoryId)===category));}
assert.equal(model.querySnapshot({search:'not-a-real-keyword-123'}).pagination.total,0);assert(model.querySnapshot({search:'ky su'}).pagination.total>0);assert.equal(model.querySnapshot({page:999}).pagination.page,2);
for(const l of ['ja','en','vi']) {
 const ui=model.render(model.querySnapshot(),{},l);assert.equal((ui.featured.match(/data-post-id=/g)||[]).length,1);assert.equal((ui.list.match(/data-post-id=/g)||[]).length,9);
 const p2=model.render(model.querySnapshot({page:2}),{page:2},l);assert.equal(p2.featured,'');assert.equal((p2.list.match(/data-post-id=/g)||[]).length,4);
 assert(ui.featured.includes(model.href(JOBSHARE_NEWS_POSTS[0],l)));assert(!ui.featured.includes('<br'));assert(ui.pagination.includes('data-page="2"'));assert(ui.pagination.includes('aria-current="page"'));
 for(const p of JOBSHARE_NEWS_POSTS){assert(model.title(p,l));assert(fs.existsSync(path.join(d,p.asset)));}
}
assert.equal(model.date(JOBSHARE_NEWS_POSTS[0],'en'),'Aug 21, 2026');
console.log('PASS: 14 source posts; 10+4 pagination; category IDs/counts; no duplicates; search; localized titles; featured/list split; asset paths; date timezone.');
