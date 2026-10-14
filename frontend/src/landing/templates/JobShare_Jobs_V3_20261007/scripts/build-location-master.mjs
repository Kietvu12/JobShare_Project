import fs from 'node:fs';
import {Fw} from '../dist/romaji.js';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../dist/',import.meta.url)),prefs=JSON.parse(fs.readFileSync(root+'prefectures.json'));
const japan={};
for(const code of Object.keys(prefs)){
 const raw=JSON.parse(fs.readFileSync(root+`japan/${code}.json`)),seen=new Set(),groups=new Map(),leaves=[];
 for(const [jis,v] of Object.entries(raw)){const name=v.city||v.name;if(!name||seen.has(name))continue;seen.add(name);
 const kana=v.city_kana||v.prefecture_kana||'',m=name.match(/^(.+市)(.+区)$/);
 const entry={country:'Japan',location:`${prefs[code].en} ${Fw(kana)||name}`.trim(),locationJp:`${prefs[code].ja} ${name}`.trim(),jpId:`${code}|${name}`};
 const leaf={name,en:Fw(kana)||name,code:jis,entry};
 if(m){if(!groups.has(m[1]))groups.set(m[1],[]);groups.get(m[1]).push({...leaf,wardName:m[2]});}else leaves.push(leaf);
 }
 const nodes=leaves.filter(l=>!groups.has(l.name));
 for(const [name,wards] of groups){const named=leaves.find(l=>l.name===name);nodes.push({name,en:named?.en||name,wards:wards.sort((a,b)=>a.name.localeCompare(b.name,'ja'))});}
 japan[code]=nodes.sort((a,b)=>a.name.localeCompare(b.name,'ja'));
}
fs.writeFileSync(root+'location-master.json',JSON.stringify({countries:['Vietnam','Japan'],vietnam:JSON.parse(fs.readFileSync(root+'vietnam.json')),regions:JSON.parse(fs.readFileSync(root+'regions.json')),prefs,japan}));
console.log('Master built:',Object.keys(japan).length,'prefectures,',Object.values(japan).flatMap(x=>x.flatMap(n=>n.wards||[n])).length,'municipality/ward leaves');
