'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),vm=require('node:vm');
const {accessToken,requestJSON,seal,unseal}=require('./financial-backup.cjs');
(async()=>{
 const account=JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON||'{}');if(account.project_id!=='collection-app-479e0')throw Error();
 const token=await accessToken(account),headers={Authorization:'Bearer '+token},base='https://collection-app-479e0-default-rtdb.firebaseio.com',roots=['ledgerAccounts','investmentEntries','bankTrackerEntries'];let values=null;
 for(let attempt=0;attempt<4;attempt++){const before=await requestJSON(base+'/financialRevisions.json',{headers}),read=await Promise.all(roots.map(root=>requestJSON(base+'/'+root+'.json',{headers}))),after=await requestJSON(base+'/financialRevisions.json',{headers});if(JSON.stringify(before)===JSON.stringify(after)){values=read;break;}}
 if(!values)throw Error();
 const context=vm.createContext({});vm.runInContext(fs.readFileSync(path.join(__dirname,'../ledger.js'),'utf8'),context);vm.runInContext(fs.readFileSync(path.join(__dirname,'../assets/hisab360-integrity-monitor.js'),'utf8'),context);
 const report=context.Hisab360Integrity.analyze(...values.map(x=>x||{})),summary={};for(const finding of report.findings)summary[finding.kind]=(summary[finding.kind]||0)+1;
 const payload={format:'Hisab360FinancialAudit',createdAt:new Date().toISOString(),productionChanged:false,counts:report.counts,findings:report.findings};
 const encrypted=seal(payload,process.env.BACKUP_PASSPHRASE);if(JSON.stringify(unseal(encrypted,process.env.BACKUP_PASSPHRASE))!==JSON.stringify(payload))throw Error();
 const dir=process.env.AUDIT_OUTPUT_DIR||path.join(process.env.RUNNER_TEMP||'.','hisab360-audit');fs.mkdirSync(dir,{recursive:true,mode:0o700});const name='Hisab360_AUDIT_'+new Date().toISOString().replace(/[:.]/g,'-')+'.hisabaudit',body=JSON.stringify(encrypted);fs.writeFileSync(path.join(dir,name),body,{mode:0o600});fs.writeFileSync(path.join(dir,name+'.sha256'),crypto.createHash('sha256').update(body).digest('hex')+'  '+name+'\n',{mode:0o600});
 console.log('Live financial audit complete. Findings: '+report.findings.length+'. '+JSON.stringify(summary)+'. Financial records unchanged; details encrypted.');
})().catch(()=>{console.error('Financial audit incomplete. No financial records changed.');process.exitCode=1;});
