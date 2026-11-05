import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {canonical,DATA_DIR,DATA_FILES,parseCsv,sha,validateRecords} from './deadlines-contract.mjs';

export function validateExport(repo,baseline){
  const dir=path.join(repo,DATA_DIR),data=JSON.parse(fs.readFileSync(path.join(dir,'deadlines.json'))),records=data.records;
  validateRecords(records,data.exported_at);assert.equal(data.count,records.length);
  const table=parseCsv(fs.readFileSync(path.join(dir,'deadlines.csv'),'utf8')),fields=table.shift();assert.equal(table.length,records.length);assert.equal(new Set(fields).size,fields.length);
  for(const r of records)for(const key of Object.keys(r))assert(fields.includes(key),`JSON field omitted from CSV: ${key}`);
  for(let i=0;i<records.length;i++){assert.equal(table[i].length,fields.length);for(let j=0;j<fields.length;j++){const v=records[i][fields[j]],expected=v==null?'':typeof v==='object'?JSON.stringify(v):String(v);assert.equal(table[i][j],expected,`${records[i].id} ${fields[j]}`);}}
  assert.equal(data.dated_count,records.filter(r=>r.date).length);assert.equal(data.undated_count,records.filter(r=>!r.date).length);
  const checksums=fs.readFileSync(path.join(dir,'MANIFEST.sha256'),'utf8').trim().split('\n');assert.equal(checksums.length,DATA_FILES.length);
  const seen=new Set();for(const line of checksums){const[expected,file]=line.split('  ');assert(DATA_FILES.includes(file)&&!seen.has(file),'Invalid manifest path');seen.add(file);assert.equal(sha(fs.readFileSync(path.join(dir,file))),expected,`${file} checksum`);}
  const stats=JSON.parse(fs.readFileSync(path.join(repo,'datasets/stats.json'))),fig=stats.sections.shutdowns_deadlines.figures;
  assert.equal(fig.deadlines_tracked.value,records.length);assert.equal(fig.deadlines_undated.value,data.undated_count);assert.equal(Object.values(fig.deadline_providers.value).reduce((a,b)=>a+b,0),records.length);
  assert.equal(fig.deadlines_upcoming.value,records.filter(r=>r.date&&r.date>=data.as_of).length);assert.equal(fig.deadlines_past.value,records.filter(r=>r.date&&r.date<data.as_of).length);
  const ids=new Map(records.map(r=>[r.id,r]));for(const r of fig.next_deadlines.value)assert(records.some(x=>x.date===r.date&&x.name===r.name&&x.provider===r.provider&&!x.needsReview),'Held/untracked next-deadline entry');
  if(baseline){
    const before=JSON.parse(baseline(`${DATA_DIR}/deadlines.json`));for(const r of before.records)assert(ids.has(r.id),`Deleted record ${r.id}`);
    if(before.records_updated_at)assert(Date.parse(data.records_updated_at)>=Date.parse(before.records_updated_at),'Record-change clock regressed');
    for(const name of ['shutdowns.csv','shutdowns.json'])assert.equal(sha(fs.readFileSync(path.join(dir,name))),sha(baseline(`${DATA_DIR}/${name}`)),`Historical archive changed: ${name}`);
    const oldStats=JSON.parse(baseline('datasets/stats.json'));for(const[key,value]of Object.entries(oldStats.sections))if(key!=='shutdowns_deadlines')assert.equal(canonical(stats.sections[key]),canonical(value),`Unrelated statistics changed: ${key}`);
  }
  return {records:records.length,held:records.filter(r=>r.needsReview).length,checksums:seen.size,all_csv_columns:true};
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===path.resolve(process.argv[1])){
  const repo=process.argv[2]||'.',baseline=name=>execFileSync('git',['show',`HEAD:${name}`],{cwd:repo,maxBuffer:10*1024*1024});console.log(JSON.stringify({validated:true,...validateExport(repo,baseline)}));
}
