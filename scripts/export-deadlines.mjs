import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {contentDigest,DATA_DIR,DATA_FILES,EXPORT_CONTRACT,figures,makeCsv,sha,SOURCE_URL,validateCatalog} from './deadlines-contract.mjs';

export async function fetchCatalog(fetcher=fetch){
  const response=await fetcher(SOURCE_URL,{redirect:'error',signal:AbortSignal.timeout(30000),headers:{Accept:'application/json','User-Agent':'Kingy-Open-Data-Sync/2.0'}});
  if(!response.ok)throw Error(`Catalog HTTP ${response.status}`);
  if(!(response.headers.get('content-type')||'').includes('application/json'))throw Error('Catalog is not JSON');
  let bytes=0,chunks=[];for await(const chunk of response.body){bytes+=chunk.length;if(bytes>5*1024*1024)throw Error('Catalog exceeds 5 MiB');chunks.push(chunk);}
  const raw=Buffer.concat(chunks).toString('utf8');return {catalog:JSON.parse(raw),raw};
}
export function exportCatalog(repo,catalog,raw,at=new Date().toISOString()){
  const dir=path.join(repo,DATA_DIR),prior=JSON.parse(fs.readFileSync(path.join(dir,'deadlines.json')));
  const records=validateCatalog(catalog,prior,at),today=catalog.serverTime.slice(0,10),values=figures(records,catalog.providers,today),digest=contentDigest(catalog,records,values);
  const result={decision:'unchanged',source_fetched_at:at,source_server_time:catalog.serverTime,source_url:SOURCE_URL,source_response_sha256:sha(raw),content_sha256:digest,records:records.length,dated:records.filter(r=>r.date).length,undated:records.filter(r=>!r.date).length,held:records.filter(r=>r.needsReview).length,providers:catalog.providers.length,records_updated_at:catalog.recordsUpdatedAt,previous_exported_at:prior.exported_at};
  if(prior.export_contract===EXPORT_CONTRACT&&prior.content_sha256===digest)return result;
  const shutdowns=JSON.parse(fs.readFileSync(path.join(dir,'shutdowns.json'))),shutdownCount=shutdowns.count??shutdowns.records.length;
  const output={...prior,as_of:today,exported_at:at,export_contract:EXPORT_CONTRACT,content_sha256:digest,licence:'CC BY 4.0 for Kingy compilation; AWS-derived record summaries CC BY-SA 4.0',catalog_version:catalog.version,catalog_generated_at:catalog.generatedAt,records_updated_at:catalog.recordsUpdatedAt,source_catalog_url:SOURCE_URL,source_catalog_sha256:sha(raw),methodology:prior.methodology,count:records.length,dated_count:result.dated,undated_count:result.undated,records};
  const csv=makeCsv(records),schema=JSON.parse(fs.readFileSync(path.join(dir,'schema.json')));
  schema.as_of=today;schema.licence=output.licence;schema.fields['deadlines.*']=csv.fields.join(', ');
  schema.sync_contract='Scheduled mirror of the reviewed AI Deadlines catalog. Preserve source record-change dates and every review hold; no-op runs do not rewrite dataset files.';
  const statsPath=path.join(repo,'datasets/stats.json'),stats=JSON.parse(fs.readFileSync(statsPath)),section=stats.sections.shutdowns_deadlines.figures;
  for(const[key,value]of Object.entries(values))section[key]={...section[key],value,as_of:today,source_url:SOURCE_URL};
  section.deadlines_undated.how='Catalog records without a scheduled day, including minimum-lifetime and withdrawn notices.';
  section.next_deadlines.how='Next five eligible dated records, excluding source-review holds; routes remain explicit.';stats.generated_at=at;
  let card=fs.readFileSync(path.join(dir,'README.md'),'utf8');
  card=card.replace(/^Exported .*$/m,`Exported ${at}. Catalog **${catalog.version}**; records changed ${catalog.recordsUpdatedAt}.`)
    .replace(/- Deadlines: \*\*.*\*\*, across .*\./,`- Deadlines: **${records.length} notices: ${result.dated} dated and ${result.undated} undated**, across ${catalog.providers.length} provider/route choices.`)
    .replace(/response SHA-256: `[^`]+`/,`response SHA-256: \`${sha(raw)}\``);
  const reproduction='## Reproduction and publishing\n\nGitHub Actions checks the canonical catalog every 15 minutes (UTC minutes 11, 26, 41 and 56). Only validated changes are committed to main. Unchanged runs leave dataset timestamps and Git history untouched. Source-review holds and records_updated_at are copied from AI Deadlines; a sync never performs a source review or invents a retirement date.\n\nRun `node scripts/export-deadlines.mjs`, then `node scripts/validate-deadlines.mjs` locally. See [AUTOMATION.md](../../AUTOMATION.md) for checks, failure behavior and run evidence. The November 4 archived release/DOI remains a historical snapshot; main/raw contains later catalog updates.\n';
  card=card.replace(/## Reproduction and publishing[\s\S]*$/,reproduction);
  let readme=fs.readFileSync(path.join(repo,'README.md'),'utf8');
  readme=readme.replace(/\d+ retained shutdown facts plus \d+ lifecycle notices[^|]+/,`${shutdownCount} retained shutdown facts plus ${records.length} lifecycle notices (${result.dated} dated, ${result.undated} undated), with separate direct/cloud routes, source evidence and review holds. `)
    .replace(/The current lifecycle files track \d+ notices\./,`The current lifecycle files track ${records.length} notices.`);
  const writes=new Map([['deadlines.json',JSON.stringify(output)+'\n'],['deadlines.csv',csv.text],['schema.json',JSON.stringify(schema,null,2)+'\n'],['README.md',card]]);
  for(const[name,body]of writes)fs.writeFileSync(path.join(dir,name),body);
  fs.writeFileSync(statsPath,JSON.stringify(stats,null,2)+'\n');fs.writeFileSync(path.join(repo,'README.md'),readme);
  fs.writeFileSync(path.join(dir,'MANIFEST.sha256'),DATA_FILES.map(f=>sha(fs.readFileSync(path.join(dir,f)))+'  '+f).join('\n')+'\n');
  return {...result,decision:'changed',exported_at:at,dataset_sha256:sha(fs.readFileSync(path.join(dir,'deadlines.json')))};
}
function receipt(result){
  if(process.env.DEADLINES_SYNC_RECEIPT)fs.writeFileSync(process.env.DEADLINES_SYNC_RECEIPT,JSON.stringify(result,null,2)+'\n');
  if(process.env.GITHUB_OUTPUT)fs.appendFileSync(process.env.GITHUB_OUTPUT,`changed=${result.decision==='changed'}\n`);
  if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,`## Lifecycle catalog sync\n\nDecision: **${result.decision}**. ${result.records} records, ${result.held} held, ${result.undated} undated.\n\nCatalog fetched: ${result.source_fetched_at}. Source record-change date: **${result.records_updated_at}**.\n\nContent SHA-256: \`${result.content_sha256}\`.\n\nNo vendor source review, calendar operation or email is performed by this sync.\n`);
  console.log(JSON.stringify(result));
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===path.resolve(process.argv[1])){const {catalog,raw}=await fetchCatalog();receipt(exportCatalog(process.argv[2]||'.',catalog,raw));}
