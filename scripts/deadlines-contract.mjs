import assert from 'node:assert/strict';
import crypto from 'node:crypto';

export const SOURCE_URL='https://kingy.ai/wp-json/kingy-deadlines/v1/catalog';
export const DATA_DIR='datasets/kingy-ai-shutdowns-and-deadlines';
export const DATA_FILES=['README.md','deadlines.csv','deadlines.json','schema.json','shutdowns.csv','shutdowns.json'];
export const PUBLISH_FILES=['README.md','datasets/stats.json',...['README.md','deadlines.csv','deadlines.json','schema.json','MANIFEST.sha256'].map(f=>`${DATA_DIR}/${f}`)];
export const EXPORT_CONTRACT=2;
export const sha=value=>crypto.createHash('sha256').update(value).digest('hex');
export function stable(value){
  if(Array.isArray(value))return value.map(stable);
  if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(k=>[k,stable(value[k])]));
  return value;
}
export const canonical=value=>JSON.stringify(stable(value));
export function normalizeRecord(source){
  const r=structuredClone(source);delete r.legacyFingerprint;
  if(r.manualReview?.method==='manual-official-source-review'){delete r.manualReview.sourceUrl;delete r.manualReview.sha256;}
  r.source_license=r.provider==='Amazon Bedrock'?'CC BY-SA 4.0 (AWS-derived summary)':'See official source; Kingy factual compilation CC BY 4.0';
  return r;
}
export function validDay(value){return typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(value))&&new Date(value).toISOString().slice(0,10)===value;}
function timestamp(value,label,now){
  assert(typeof value==='string'&&Number.isFinite(Date.parse(value)),`Invalid ${label}`);
  assert(Date.parse(value)<=now+300000,`Future ${label}`);
}
export function validateRecords(records,exportedAt){
  const ids=new Set(),now=Date.parse(exportedAt);assert(Number.isFinite(now));
  for(const r of records){
    assert(r&&typeof r.id==='string'&&r.id.length>0&&r.id.length<=1024&&!ids.has(r.id),'Missing/duplicate record ID');ids.add(r.id);
    assert(typeof r.provider==='string'&&r.provider,'Missing provider');
    assert(r.date===null||validDay(r.date),`Invalid date ${r.id}`);
    assert(typeof r.source==='string'&&new URL(r.source).protocol==='https:',`Missing HTTPS source ${r.id}`);
    assert(typeof r.needsReview==='boolean'&&typeof r.sourceCurrent==='boolean',`Missing review state ${r.id}`);
    assert(r.sourceCurrent||r.needsReview,`Stale source without hold ${r.id}`);
    if(r.replacementConflict)assert(r.needsReview,`Replacement conflict without hold ${r.id}`);
    if(r.dateType==='minimum-lifetime'||r.dateType==='withdrawn retirement')assert.equal(r.date,null,`Invented scheduled day ${r.id}`);
    if(r.provider.startsWith('Azure')||['Amazon Bedrock','Google Vertex AI'].includes(r.provider))assert(typeof r.route==='string'&&r.route,`Missing cloud route ${r.id}`);
    for(const key of ['checkedAt','reviewedAt','sourceFetchedAt','lastVerified'])if(r[key])timestamp(r[key],`${key} ${r.id}`,now);
    if(r.manualReview?.expiresAt&&Date.parse(r.manualReview.expiresAt)<=now){
      const laterCheck=r.sourceCurrent&&Number.isFinite(Date.parse(r.manualReview.checkedAt))&&Date.parse(r.checkedAt)>Date.parse(r.manualReview.expiresAt)&&Date.parse(r.checkedAt)>Date.parse(r.manualReview.checkedAt);
      assert(r.needsReview||laterCheck,`Expired manual review without hold or later source check ${r.id}`);
    }
    if(r.provider==='Amazon Bedrock')assert(r.source_license.includes('CC BY-SA'),'Missing AWS attribution');
  }
}
const observationFields=new Set(['checkedAt','lastVerified','reviewedAt','sourceFetchedAt','evidenceSnapshot','evidenceSha256','sourceEvidence','sourceProjection','manualReview','sourceCurrent','needsReview','reviewReason','status','fingerprint','legacyFingerprint','history','revision','checkAnchor','checkText','reviewedSourceHash','source_license']);
export function factualRecord(record){return Object.fromEntries(Object.entries(record).filter(([key])=>!observationFields.has(key)));}
export function validateCatalog(catalog,prior,now){
  const time=Date.parse(now);assert(Number.isFinite(time));
  assert(Array.isArray(catalog.records)&&catalog.records.length>0,'Incomplete catalog');
  assert(typeof catalog.version==='string'&&catalog.version,'Missing source catalog version');
  timestamp(catalog.serverTime,'source server time',time);assert(time-Date.parse(catalog.serverTime)<15*60000,'Catalog response is older than 15 minutes');
  timestamp(catalog.recordsUpdatedAt,'source record-change date',time);
  assert(Array.isArray(catalog.providers)&&catalog.providers.length>0,'Missing providers');
  const providers=new Set(catalog.providers.map(p=>p.id));assert.equal(providers.size,catalog.providers.length,'Duplicate providers');
  const records=catalog.records.map(normalizeRecord);validateRecords(records,now);
  for(const r of records)assert(providers.has(r.provider),`Unknown provider ${r.provider}`);
  const ids=new Map(records.map(r=>[r.id,r]));for(const old of prior.records)assert(ids.has(old.id),`Export would delete ${old.id}`);
  if(prior.records_updated_at){
    assert(Date.parse(catalog.recordsUpdatedAt)>=Date.parse(prior.records_updated_at),'Source record-change date regressed');
    if(catalog.recordsUpdatedAt===prior.records_updated_at){
      assert.equal(records.length,prior.records.length,'New facts require a new source record-change date');
      for(const old of prior.records)assert.equal(canonical(factualRecord(ids.get(old.id))),canonical(factualRecord(old)),`Facts changed without a source record-change date: ${old.id}`);
    }
  }
  return records;
}
export function figures(records,providers,today){return {
  deadlines_tracked:records.length,deadlines_upcoming:records.filter(r=>r.date&&r.date>=today).length,deadlines_past:records.filter(r=>r.date&&r.date<today).length,deadlines_undated:records.filter(r=>!r.date).length,
  next_deadlines:records.filter(r=>r.date&&r.date>=today&&!r.needsReview).sort((a,b)=>a.date.localeCompare(b.date)||a.id.localeCompare(b.id)).slice(0,5).map(r=>({date:r.date,name:r.name,provider:r.provider,route:r.route||r.scope,url:r.recordUrl||r.source})),
  deadline_providers:Object.fromEntries(providers.map(p=>[p.id,records.filter(r=>r.provider===p.id).length]))};}
export function contentDigest(catalog,records,values){return sha(canonical({version:catalog.version,recordsUpdatedAt:catalog.recordsUpdatedAt,generatedAt:catalog.generatedAt,providers:catalog.providers,records:[...records].sort((a,b)=>a.id.localeCompare(b.id)),figures:values}));}
export function parseCsv(text){
  const out=[];let row=[],s='',quoted=false;
  for(let i=0;i<text.length;i++){const c=text[i];if(quoted){if(c==='"'&&text[i+1]==='"'){s+='"';i++;}else if(c==='"')quoted=false;else s+=c;}else if(c==='"')quoted=true;else if(c===','){row.push(s);s='';}else if(c==='\n'){row.push(s.replace(/\r$/,''));out.push(row);row=[];s='';}else s+=c;}
  assert(!quoted,'Unterminated CSV');assert(row.length===0&&s==='','CSV needs a trailing newline');return out;
}
export function makeCsv(records){
  const first=['id','name','provider','date','precision','certainty','scope','action','replacement','source','recordUrl','reviewedAt','checkedAt','revision','status','confirmedRetired','sourceCurrent','needsReview','reviewReason','history'];
  const fields=[...new Set([...first,...records.flatMap(Object.keys)])];
  const cell=value=>{const s=value==null?'':typeof value==='object'?JSON.stringify(value):String(value);return /[",\r\n]/.test(s)?'"'+s.replaceAll('"','""')+'"':s;};
  return {fields,text:[fields.join(','),...records.map(r=>fields.map(f=>cell(r[f])).join(','))].join('\r\n')+'\r\n'};
}

