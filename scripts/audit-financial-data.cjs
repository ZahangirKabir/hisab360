'use strict';
const fs=require('node:fs'),path=require('node:path');
const {accessToken,requestJSON,unseal}=require('./financial-backup.cjs');require('../ledger.js');
(async()=>{
 const account=JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);if(account.project_id!=='collection-app-479e0')throw Error();
 const token=await accessToken(account),headers={Authorization:'Bearer '+token},base='https://collection-app-479e0-default-rtdb.firebaseio.com';
 const roots=['ledgerAccounts','investmentEntries','bankTrackerEntries'];
 const values=await Promise.all(roots.map(root=>requestJSON(base+'/'+root+'.json',{headers})));const live=Object.fromEntries(roots.map((root,i)=>[root,values[i]||{}]));
 const images=await requestJSON(base+'/slipImages.json?shallow=true',{headers})||{};
 const rules=(await requestJSON(base+'/.settings/rules.json',{headers})).rules;
 const files=fs.readdirSync(process.env.OLD_BACKUP_DIR,{recursive:true}).filter(x=>String(x).endsWith('.hisabbackup'));if(files.length!==1)throw Error();
 const old=unseal(JSON.parse(fs.readFileSync(path.join(process.env.OLD_BACKUP_DIR,files[0]),'utf8')),process.env.BACKUP_PASSPHRASE).database;
 const out={counts:Object.fromEntries(roots.map(root=>[root,Object.keys(live[root]).length])),missingSinceBackup:Object.fromEntries(roots.map(root=>[root,Object.keys(old[root]||{}).filter(k=>!Object.hasOwn(live[root],k)).length])),checks:{accountKeyMismatch:0,approvedUnbalanced:0,approvedWithPendingSlip:0,bankSlipTotalMismatch:0,missingSlipImages:0,duplicateSlipIdentityAcrossAccounts:0,withdrawalReasonTotalMismatch:0,capitalTotalMismatch:0,calculatorMATotalMismatch:0,calculatorCapitalLinkMismatch:0},serverDeleteGuard:{}};
 const c=n=>Math.round((Number(n)||0)*100),ids=new Map();
 for(const [key,a]of Object.entries(live.ledgerAccounts)){
  if(a.date+'_'+a.userId!==key)out.checks.accountKeyMismatch++;
  const r=a.report;if(r){if(r.approvalStatus==='approved'&&globalThis.PortalLedger.balance(r)!==0)out.checks.approvedUnbalanced++;if(r.approvalStatus==='approved'&&Object.values(a.requests||{}).some(q=>!['approved','rejected'].includes(q.status)))out.checks.approvedWithPendingSlip++;const aligned=globalThis.PortalLedger.sync(JSON.parse(JSON.stringify(a)));if(c(aligned.report.bankDeposit)!==c(r.bankDeposit))out.checks.bankSlipTotalMismatch++;}
  for(const q of Object.values(a.requests||{}))for(const s of q.slips||[]){if(String(s.img||'').startsWith('rtdb:')&&!Object.hasOwn(images,s.img.slice(5)))out.checks.missingSlipImages++;if(q.status==='rejected')continue;const id=String(s.bankName||'').trim().toUpperCase()+':'+String(s.transactionId||'').trim().toUpperCase();if(s.transactionId){if(ids.has(id)&&ids.get(id)!==key)out.checks.duplicateSlipIdentityAcrossAccounts++;else ids.set(id,key);}}
 }
 for(const r of Object.values(live.bankTrackerEntries))if(r.type==='withdrawal'&&Array.isArray(r.reasonAmounts)&&r.reasonAmounts.length&&r.reasonAmounts.reduce((n,x)=>n+c(x.amount),0)!==c(r.amount))out.checks.withdrawalReasonTotalMismatch++;
 const investment=Object.values(live.investmentEntries);
 for(const r of investment){
  if(r.type==='capital'&&c(r.openingTotal)!==c(r.closingTotal))out.checks.capitalTotalMismatch++;
  if(r.type==='calculator'){const expected=c(r.opening)+c(r.lifting)+c(r.cashCalculation?.cashDepositLifting)+c(r.commissionReceived)+c(r.b2bReceive)-c(r.b2bSend)-c(r.refund)-((r.cashCalculation?.transfers?.pettySource||'Cash')==='MA'?c(r.cashCalculation?.transfers?.petty):0);if(expected!==c(r.netMA))out.checks.calculatorMATotalMismatch++;const capital=investment.find(x=>x.type==='capital'&&x.scope===r.scope&&x.date===r.date&&x.closingSource==='calculator');if(capital&&c(capital.closing?.maWallet)!==c(r.netMA))out.checks.calculatorCapitalLinkMismatch++;}
 }
 for(const root of roots){const write=String(rules?.[root]?.['.write']||'');out.serverDeleteGuard[root]=/numChildren|newData.exists\(\)/.test(write);}
 fs.writeFileSync(process.env.RUNNER_TEMP+'/financial-audit-result.json',JSON.stringify(out,null,2));console.log('Read-only financial integrity audit completed. No records or rules changed.');
})().catch(()=>{console.error('Financial audit failed. No database changes.');process.exitCode=1;});
