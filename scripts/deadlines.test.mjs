import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {exportCatalog,fetchCatalog} from './export-deadlines.mjs';
import {validateExport} from './validate-deadlines.mjs';
import {publishBatch} from './publish-deadlines.mjs';
import {canonical,DATA_DIR,DATA_FILES,normalizeRecord,PUBLISH_FILES,sha,validateCatalog} from './deadlines-contract.mjs';

const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const old=JSON.parse(fs.readFileSync(path.join(repo,DATA_DIR,'deadlines.json'))),at=old.exported_at;
const baseline=name=>fs.readFileSync(path.join(repo,name));
function catalog(){return {version:old.catalog_version,recordsUpdatedAt:old.records_updated_at,generatedAt:old.catalog_generated_at,serverTime:at,providers:[...new Set(old.records.map(r=>r.provider))].map(id=>({id})),records:structuredClone(old.records)};}
function temporary(){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'kingy-deadlines-'));for(const name of new Set([...PUBLISH_FILES,...DATA_FILES.map(f=>`${DATA_DIR}/${f}`)])){fs.mkdirSync(path.dirname(path.join(dir,name)),{recursive:true});fs.copyFileSync(path.join(repo,name),path.join(dir,name));}return dir;}
function snapshot(dir){return PUBLISH_FILES.map(name=>[name,sha(fs.readFileSync(path.join(dir,name)))]);}
function run(dir,input,time=at){return exportCatalog(dir,input,JSON.stringify(input),time);}

test('all source fields and review holds survive JSON/CSV export',()=>{
  const dir=temporary(),input=catalog();run(dir,input);const output=JSON.parse(fs.readFileSync(path.join(dir,DATA_DIR,'deadlines.json')));
  assert.deepEqual(output.records,input.records.map(normalizeRecord));assert.equal(output.records_updated_at,input.recordsUpdatedAt);
  assert.deepEqual(output.records.filter(r=>r.needsReview).map(r=>r.id),input.records.filter(r=>r.needsReview).map(r=>r.id));
  assert.equal(validateExport(dir,baseline).checksums,6);
});
test('server clock and JSON key/order changes alone do not rewrite any file',()=>{
  const dir=temporary(),input=catalog();run(dir,input);const before=snapshot(dir),exported=JSON.parse(fs.readFileSync(path.join(dir,DATA_DIR,'deadlines.json'))).exported_at;
  input.serverTime=new Date(Date.parse(at)+60000).toISOString();input.records.reverse();input.records=input.records.map(r=>Object.fromEntries(Object.entries(r).reverse()));
  assert.equal(run(dir,input,input.serverTime).decision,'unchanged');assert.deepEqual(snapshot(dir),before);
  assert.equal(JSON.parse(fs.readFileSync(path.join(dir,DATA_DIR,'deadlines.json'))).exported_at,exported);
});
test('a real source check updates evidence while retaining the record-change clock',()=>{
  const dir=temporary(),input=catalog();run(dir,input);const time=new Date(Date.parse(at)+60000).toISOString();input.serverTime=time;input.records[0].checkedAt=time;
  assert.equal(run(dir,input,time).decision,'changed');const output=JSON.parse(fs.readFileSync(path.join(dir,DATA_DIR,'deadlines.json')));
  assert.equal(output.records[0].checkedAt,time);assert.equal(output.records_updated_at,old.records_updated_at);
});
test('source review expiry is mirrored and held rows stay out of next deadlines',()=>{
  const dir=temporary(),input=catalog();const item=input.records.find(r=>r.date&&r.date>=at.slice(0,10));item.sourceCurrent=false;item.needsReview=true;item.reviewReason='Source requires re-review';
  run(dir,input);const output=JSON.parse(fs.readFileSync(path.join(dir,DATA_DIR,'deadlines.json')));assert(output.records.find(r=>r.id===item.id).needsReview);
  const next=JSON.parse(fs.readFileSync(path.join(dir,'datasets/stats.json'))).sections.shutdowns_deadlines.figures.next_deadlines.value;
  assert(!next.some(r=>r.name===item.name&&r.date===item.date));validateExport(dir,baseline);
});
for(const [name,change]of [
  ['record deletion',c=>c.records.pop()],['duplicate identities',c=>c.records.push(c.records[0])],
  ['stale response',c=>c.serverTime='2020-01-01T00:00:00Z'],['regressed record clock',c=>c.recordsUpdatedAt='2020-01-01T00:00:00Z'],
  ['stale source without hold',c=>{c.records[0].sourceCurrent=false;c.records[0].needsReview=false;}],
  ['replacement conflict without hold',c=>{c.records[0].replacementConflict=true;c.records[0].needsReview=false;}],
  ['cloud route omission',c=>delete c.records.find(r=>r.provider.startsWith('Azure')).route],
  ['invented minimum-lifetime day',c=>c.records.find(r=>r.dateType==='minimum-lifetime').date='2027-01-01'],
  ['invalid day',c=>c.records[0].date='2027-02-30'],
  ['facts changed without Updated',c=>c.records[0].replacement='Unsupported change'],
  ['expired review without hold',c=>{c.records[0].manualReview={expiresAt:'2020-01-01T00:00:00Z'};c.records[0].needsReview=false;}]
])test(`${name} fails before files change`,()=>{const dir=temporary(),input=catalog(),before=snapshot(dir);change(input);assert.throws(()=>run(dir,input));assert.deepEqual(snapshot(dir),before);});
test('facts can change when the source supplies a later Updated date',()=>{
  const input=catalog(),time=new Date(Date.parse(at)+60000).toISOString();input.serverTime=time;input.recordsUpdatedAt=time;input.records[0].replacement='Documented replacement fixture';
  assert.equal(validateCatalog(input,old,time)[0].replacement,'Documented replacement fixture');
});
test('elapsed date does not change service state or confirmedRetired',()=>{
  const dir=temporary(),input=catalog();const item=input.records.find(r=>r.date&&r.date>at.slice(0,10)&&r.confirmedRetired===false);
  const time=new Date(Date.parse(item.date)+86400000).toISOString();input.serverTime=time;
  for(const r of input.records){r.sourceCurrent=false;r.needsReview=true;}
  run(dir,input,time);const output=JSON.parse(fs.readFileSync(path.join(dir,DATA_DIR,'deadlines.json'))).records.find(r=>r.id===item.id);
  assert.equal(output.confirmedRetired,false);assert.equal(output.status,item.status);assert.equal(output.date,item.date);
});
test('network errors, HTML and oversized bodies fail closed',async()=>{
  await assert.rejects(()=>fetchCatalog(async()=>new Response('unavailable',{status:503})),/HTTP 503/);
  await assert.rejects(()=>fetchCatalog(async()=>new Response('<html>',{headers:{'content-type':'text/html'}})),/not JSON/);
  await assert.rejects(()=>fetchCatalog(async()=>new Response('x'.repeat(5*1024*1024+1),{headers:{'content-type':'application/json'}})),/exceeds/);
});
test('publisher rejects unexpected paths before requesting any access',async()=>{
  await assert.rejects(()=>publishBatch({base:'base',baseTree:'tree',changes:[{path:'.github/workflows/other.yml',content:Buffer.from('bad')}],api:()=>{throw Error('must not call');}}),/Unexpected publish path/);
});
test('publication keeps one parent and a non-forced atomic main update',async()=>{
  const calls=[];let published=false;
  const api=async(method,url,body)=>{calls.push({method,url,body});if(method==='GET')return {object:{sha:published?'commit':'base'}};if(url==='/git/blobs')return {sha:'blob'};if(url==='/git/trees')return {sha:'tree'};if(url==='/git/commits')return {sha:'commit'};if(method==='PATCH'){published=true;return {};}};
  const result=await publishBatch({base:'base',baseTree:'old-tree',changes:[{path:'README.md',content:Buffer.from('fixture')}],api,message:'fixture'});
  assert.equal(result.commit,'commit');assert.deepEqual(calls.find(c=>c.url==='/git/commits').body.parents,['base']);assert.deepEqual(calls.find(c=>c.method==='PATCH').body,{sha:'commit',force:false});
});
test('a concurrent main update is never overwritten',async()=>{
  const calls=[];await assert.rejects(()=>publishBatch({base:'base',baseTree:'tree',changes:[{path:'README.md',content:Buffer.from('fixture')}],api:async(method)=>{calls.push(method);return {object:{sha:'maintainer-update'}};}}),/Main advanced/);assert.deepEqual(calls,['GET']);
});
