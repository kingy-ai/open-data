import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {DATA_DIR,PUBLISH_FILES,sha} from './deadlines-contract.mjs';
import {validateExport} from './validate-deadlines.mjs';

export async function publishBatch({base,baseTree,changes,api,message}){
  assert(changes.length>0&&changes.every(f=>PUBLISH_FILES.includes(f.path)),'Unexpected publish path');
  assert.equal(new Set(changes.map(f=>f.path)).size,changes.length,'Duplicate publish path');
  const current=await api('GET','/git/ref/heads/main');
  assert.equal(current.object.sha,base,'Main advanced during sync; leave it unchanged and retry next schedule');
  const tree=[];
  for(const file of changes){const blob=await api('POST','/git/blobs',{content:file.content.toString('base64'),encoding:'base64'});tree.push({path:file.path,mode:'100644',type:'blob',sha:blob.sha});}
  const createdTree=await api('POST','/git/trees',{base_tree:baseTree,tree});
  const commit=await api('POST','/git/commits',{message,tree:createdTree.sha,parents:[base],author:{name:'github-actions[bot]',email:'41898282+github-actions[bot]@users.noreply.github.com'}});
  // Ordinary fast-forward only. A concurrent maintainer update cannot be overwritten.
  await api('PATCH','/git/refs/heads/main',{sha:commit.sha,force:false});
  const published=await api('GET','/git/ref/heads/main');assert.equal(published.object.sha,commit.sha,'Main advanced before publication readback');
  return {commit:commit.sha,paths:changes.map(f=>f.path)};
}
export async function publish(repo='.'){
  assert.equal(process.env.GITHUB_ACTIONS,'true','Publishing requires GitHub Actions');
  assert.equal(process.env.GITHUB_REPOSITORY,'kingy-ai/open-data','Unexpected repository');
  assert.equal(process.env.GITHUB_REF,'refs/heads/main','Publishing is limited to main');
  assert(['schedule','workflow_dispatch'].includes(process.env.GITHUB_EVENT_NAME),'Unsupported publishing event');
  assert(process.env.GH_TOKEN,'Ephemeral GitHub token missing');
  const git=args=>execFileSync('git',args,{cwd:repo,maxBuffer:10*1024*1024});
  const baseline=name=>git(['show',`HEAD:${name}`]);
  const validation=validateExport(repo,baseline),base=git(['rev-parse','HEAD']).toString().trim(),baseTree=git(['rev-parse','HEAD^{tree}']).toString().trim();
  const changed=git(['diff','--name-only','-z','HEAD','--']).toString().split('\0').filter(Boolean);
  const untracked=git(['ls-files','--others','--exclude-standard','-z']).toString().split('\0').filter(Boolean);
  assert.equal(untracked.length,0,'Unexpected untracked files in runner');
  if(!changed.length)return {decision:'unchanged',base,...validation};
  assert(changed.every(f=>PUBLISH_FILES.includes(f)),'Changes outside lifecycle publish allowlist');
  const api=async(method,endpoint,body)=>{
    const r=await fetch(`https://api.github.com/repos/kingy-ai/open-data${endpoint}`,{method,headers:{Accept:'application/vnd.github+json',Authorization:`Bearer ${process.env.GH_TOKEN}`,'X-GitHub-Api-Version':'2022-11-28','Content-Type':'application/json','User-Agent':'Kingy-Open-Data-Sync/2.0'},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(30000)});
    const json=await r.json();if(!r.ok)throw Error(`GitHub ${method} ${endpoint}: HTTP ${r.status}; ${json.message||'request failed'}`);return json;
  };
  const data=JSON.parse(fs.readFileSync(path.join(repo,DATA_DIR,'deadlines.json')));
  const result=await publishBatch({base,baseTree,changes:changed.map(file=>({path:file,content:fs.readFileSync(path.join(repo,file))})),api,
    message:`Sync AI Deadlines (${validation.records} records; ${validation.held} held)\n\nSource record-change date: ${data.records_updated_at}\nCatalog response SHA-256: ${data.source_catalog_sha256}\nPreserve review holds and route/date qualifiers.`});
  const rawUrl=`https://raw.githubusercontent.com/kingy-ai/open-data/${result.commit}/${DATA_DIR}/deadlines.json`;
  const readback=await fetch(rawUrl,{signal:AbortSignal.timeout(30000)});assert(readback.ok,'Published raw snapshot readback failed');
  assert.equal(sha(Buffer.from(await readback.arrayBuffer())),sha(fs.readFileSync(path.join(repo,DATA_DIR,'deadlines.json'))),'Published raw snapshot differs');
  const receipt={decision:'published',event:process.env.GITHUB_EVENT_NAME,...result,...validation,records_updated_at:data.records_updated_at,raw_snapshot_verified:true};
  if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,`\nPublished [${result.commit.slice(0,12)}](https://github.com/kingy-ai/open-data/commit/${result.commit}) from **${process.env.GITHUB_EVENT_NAME}**. Raw snapshot readback matched. All ${validation.checksums} checksums and every JSON/CSV value passed.\n`);
  if(process.env.DEADLINES_SYNC_RECEIPT){const prior=JSON.parse(fs.readFileSync(process.env.DEADLINES_SYNC_RECEIPT));fs.writeFileSync(process.env.DEADLINES_SYNC_RECEIPT,JSON.stringify({...prior,publication:receipt},null,2)+'\n');}
  return receipt;
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===path.resolve(process.argv[1]))console.log(JSON.stringify(await publish(process.argv[2]||'.')));
