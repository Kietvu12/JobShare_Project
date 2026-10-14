import assert from 'node:assert/strict';
import fs from 'node:fs';
import {readSelection,writeSelection,toggleCategory,categoryQueryIds,subtreeIds,toggleLocations,locationKey,serializeLocations} from './dist/filter-model.js';
import {queryFor,salary} from './dist/model.js';
import {copy} from './dist/content.js';
const tree=JSON.parse(fs.readFileSync('dist/categories.json')).data.tree;
const master=JSON.parse(fs.readFileSync('dist/location-master.json'));
const root=tree.find(n=>n.id===137),branch=root.children.find(n=>n.children?.length),leaf=branch.children[0];
const empty={fieldIds:[],jobTypeIds:[],locations:[]};
let selected=toggleCategory(empty,root,true);
assert.deepEqual(selected.fieldIds,[137]);assert.deepEqual(selected.jobTypeIds,[]);assert.deepEqual(empty.fieldIds,[]);
assert.deepEqual(categoryQueryIds(selected,tree),subtreeIds(root));
selected=toggleCategory(selected,branch,false);assert(selected.jobTypeIds.includes(leaf.id));assert(selected.fieldIds.includes(137));
assert.deepEqual(categoryQueryIds(selected,tree),subtreeIds(branch));
selected=toggleCategory(selected,leaf,false);assert(!selected.jobTypeIds.includes(leaf.id));assert(selected.jobTypeIds.includes(branch.id));
selected=toggleCategory(selected,root,true);assert.deepEqual(selected,empty);
// Draft operations must leave committed state untouched; discarding means dropping the clone.
const committed={fieldIds:[137],jobTypeIds:[branch.id,leaf.id],locations:[]};
let draft=structuredClone(committed);draft=toggleCategory(draft,tree.find(n=>n.id===79),true);assert.deepEqual(committed.fieldIds,[137]);
draft.fieldIds=[];draft.jobTypeIds=[];assert.equal(committed.jobTypeIds.length,2);
const tokyo=master.japan['13'].find(n=>n.name==='目黒区').entry;
const kanagawa=master.japan['14'].find(n=>n.name==='横浜市');assert(kanagawa.wards.length>1);
const vn={country:'Vietnam',location:'Hà Nội'};
let locations=toggleLocations([],[tokyo,vn]);assert.equal(locations.length,2);
locations=toggleLocations(locations,kanagawa.wards.map(w=>w.entry));assert.equal(locations.length,2+kanagawa.wards.length);
locations=toggleLocations(locations,kanagawa.wards.map(w=>w.entry));assert.equal(locations.length,2);
assert.equal(new Set(locations.map(locationKey)).size,2);
const state=writeSelection(new URLSearchParams(),{...committed,locations});assert.deepEqual(readSelection(new URLSearchParams(state.toString()),tree),{...committed,locations});
const query=queryFor(state,'next-cursor',tree);assert.equal(query.get('jobCategoryIds'),[branch.id,leaf.id].join(','));assert.equal(query.get('locations'),serializeLocations(locations));assert(query.get('locations').split('|||').includes('Meguroku'));assert(query.get('locations').split('|||').includes('Hà Nội'));assert.equal(query.get('cursor'),'next-cursor');assert(!query.has('jobCategoryId'));assert(!query.has('location'));
assert.deepEqual(readSelection(new URLSearchParams('category=137'),tree).fieldIds,[137]);assert.deepEqual(readSelection(new URLSearchParams('locations=%7Bbad'),tree).locations,[]);
assert.equal(Object.keys(master.japan).length,47);assert.equal(master.vietnam.length,63);assert.equal(master.regions.flatMap(r=>r.prefectureCodes).length,47);assert(master.regions.find(r=>r.id==='kinki').prefectureCodes.includes('24'));
const leaves=Object.values(master.japan).flatMap(nodes=>nodes.flatMap(n=>n.wards||[n]));assert.equal(leaves.length,1901);assert.equal(new Set(leaves.map(x=>x.entry.jpId)).size,1901);
for(const lang of ['vi','en','ja']){
 const html=fs.readFileSync(`dist/${lang}/jobs/index.html`,'utf8');assert.equal((html.match(/class="job-card\s/g)||[]).length,18);assert(html.includes('id="location-data"'));assert(html.includes('id="value-picker"'));assert(!html.includes('support-link'));assert(!html.includes('id="category"'));assert(html.includes('class="hero-line"'));assert(html.includes('class="hero-line hero-line-accent"'));assert(!html.includes('data-cat-select'));assert(html.includes(`<html lang="${lang}">`));
 const standalone=fs.readFileSync(`standalone/JobShare_Jobs_${lang.toUpperCase()}_V3.html`,'utf8');assert(!standalone.includes('src="/app.js"'));const script=standalone.match(/<script>\(\(\)=>\{([\s\S]*)\}\)\(\);<\/script>/)[1];new Function(script);
}
const jobs=JSON.parse(fs.readFileSync('dist/initial-jobs.json')).data.jobs;assert.equal(salary(jobs[0],'vi',copy.vi).value,'24,56〜35,08 vạn Yên/tháng');assert.equal(salary(jobs[2],'vi',copy.vi).value,'400〜550 vạn Yên/năm');
console.log('PASS: original root/branch/leaf semantics, isolated draft, category priority, subtree expansion, multi-location toggle, URL roundtrip, exact API serializer, 47 prefectures / 1901 leaves / 63 VN provinces, 18 SSR cards per locale, standalone JS syntax, salary periods.');
