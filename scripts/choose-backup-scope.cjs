'use strict';
const fs=require('node:fs');
const {accessToken,requestJSON}=require('./financial-backup.cjs');
function age(value,now){const date=Date.parse(value||'');return Number.isFinite(date)&&date<=now+300000?Math.max(0,now-date):Infinity;}
function day(value){const d=new Date(value);return Number.isFinite(d.getTime())?new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Dhaka',year:'numeric',month:'2-digit',day:'2-digit'}).format(d):'';}
function choose(status={},now=Date.now(),force=false){
 const successAge=age(status.lastSuccessAt,now),fullAge=age(status.lastFullAt,now),time=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Dhaka',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date(now));
 const fullDue=fullAge>=26*3600000||(time>='01:17'&&day(status.lastFullAt)!==day(now));
 if(force||fullDue)return{run:true,scope:'full-rtdb',reason:force?'requested-full':'missing-daily-full'};
 const newerFailure=Date.parse(status.lastFailureAt||'')>Date.parse(status.lastSuccessAt||'');
 if(status.restoreVerified===true&&successAge<45*60000&&!newerFailure)return{run:false,scope:'financial-metadata',reason:'recent-verified-backup'};
 return{run:true,scope:'financial-metadata',reason:'financial-backup-due'};
}
async function main(){
 const account=JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON||'{}');if(account.project_id!=='collection-app-479e0')throw Error();
 const token=await accessToken(account),status=await requestJSON('https://collection-app-479e0-default-rtdb.firebaseio.com/appConfig/backupStatus.json',{headers:{Authorization:'Bearer '+token}});
 const plan=choose(status||{},Date.now(),process.env.GITHUB_EVENT_NAME!=='schedule');
 if(process.env.GITHUB_OUTPUT)fs.appendFileSync(process.env.GITHUB_OUTPUT,'should_run='+plan.run+'\n');
 if(process.env.GITHUB_ENV)fs.appendFileSync(process.env.GITHUB_ENV,'BACKUP_SCOPE='+plan.scope+'\n');
 console.log('Backup plan: '+plan.reason+'; scope='+plan.scope+'; run='+plan.run+'. No financial records changed.');
}
module.exports={choose,day};if(require.main===module)main().catch(()=>{console.error('Backup planning failed; no backup was marked successful.');process.exitCode=1;});
