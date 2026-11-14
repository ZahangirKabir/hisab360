'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {accessToken,requestJSON}=require('./financial-backup.cjs'),{build}=require('./build-protection-rules.cjs');
(async()=>{
 let source,sourceKind='live';
 try{
  const account=JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  if(account.project_id!=='collection-app-479e0')throw Error('Project mismatch');
  const token=await accessToken(account);
  source=await requestJSON('https://collection-app-479e0-default-rtdb.firebaseio.com/.settings/rules.json',{headers:{Authorization:'Bearer '+token}});
 }catch(error){
  if(process.env.ALLOW_VERSIONED_RULES_TEST!=='true')throw error;
  source=JSON.parse(fs.readFileSync(path.join(__dirname,'../Firebase_User_Management_Rules.json'),'utf8'));
  sourceKind='versioned-policy';
  console.warn('Live Rules unavailable. Testing repository policy only; deployed Rules unverified.');
 }
 const dir=process.env.RUNNER_TEMP;
 const alreadyProtected=!!source.rules?.financialHistory&&!!source.rules?.financialRevisions&&['ledgerAccounts','investmentEntries','bankTrackerEntries'].every(root=>source.rules[root]?.['.write']===false&&Object.entries(source.rules[root]).some(([key,value])=>key.startsWith('$')&&String(value?.['.write']||'').includes('financialHistory/'+root)));
 const protectedRules=alreadyProtected?source:build(source),stagedRules=alreadyProtected?source:build(source,{enforce:false});
 fs.writeFileSync(path.join(dir,'rules-source.txt'),sourceKind);
 fs.writeFileSync(path.join(dir,'original-rules.json'),JSON.stringify(source),{mode:0o600});
 fs.writeFileSync(path.join(dir,'protected-rules.json'),JSON.stringify(protectedRules),{mode:0o600});
 fs.writeFileSync(path.join(dir,'staged-rules.json'),JSON.stringify(stagedRules),{mode:0o600});
 fs.writeFileSync('firebase.protection-test.json',JSON.stringify({database:{rules:path.join(dir,'protected-rules.json')},emulators:{database:{port:9000},ui:{enabled:false},singleProjectMode:true}}));
 fs.writeFileSync(path.join(dir,'rules-fingerprint.txt'),crypto.createHash('sha256').update(JSON.stringify(source)).digest('hex'));
 console.log('Rules copied for isolated emulator tests; source='+sourceKind+'. Production unchanged.');
})().catch(error=>{console.error('Protection test preparation failed. Production unchanged. '+(/^(Unexpected|Financial root)/.test(error.message)?error.message:error.name));process.exitCode=1;});
