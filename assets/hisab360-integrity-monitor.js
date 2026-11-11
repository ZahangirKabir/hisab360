(function(global){'use strict';
 const cents=value=>Math.round((Number(value)||0)*100);
 function analyze(ledger,investment,bank){
  const findings=[],seen=new Map(),entries=Object.values(investment||{});const add=(kind,row,key,detail)=>findings.push({kind,date:row?.date||'',userId:row?.userId||'',key,detail});
  for(const [key,account]of Object.entries(ledger||{})){
   const report=account.report;if(report?.approvalStatus==='approved'&&global.PortalLedger.balance(report)!==0)add('অনুমোদিত রিপোর্টের হিসাব মিলছে না',account,key,'Received ও Return আবার যাচাই করুন।');
   for(const request of Object.values(account.requests||{})){if(['rejected','rejecting'].includes(request.status))continue;for(const slip of request.slips||[]){const normalized=String(slip.transactionId||'').replace(/[০-৯]/g,c=>'০১২৩৪৫৬৭৮৯'.indexOf(c)).toUpperCase().replace(/[^A-Z0-9]/g,'');if(normalized.length<6||!/[0-9]/.test(normalized))continue;const id=String(slip.bankName||'').trim().toUpperCase()+':'+normalized,previous=seen.get(id);if(previous&&previous!==key)add('একই Slip ID একাধিক হিসাবে আছে',account,key,'অন্য হিসাব: '+previous+'। ছবি ও মূল ব্যাংক রেফারেন্স যাচাই করুন।');else seen.set(id,key);}}
  }
  for(const [key,row]of Object.entries(investment||{})){
   if(row.type==='capital'&&cents(row.openingTotal)!==cents(row.closingTotal))add('Working Capital মিলছে না',row,key,'Opening Total ও Closing Total যাচাই করুন।');
   if(row.type==='calculator'){
    const cash=row.cashCalculation||{},expected=cents(row.opening)+cents(row.lifting)+cents(cash.cashDepositLifting)+cents(row.commissionReceived)+cents(row.b2bReceive)-cents(row.b2bSend)-cents(row.refund)-((cash.transfers?.pettySource||'Cash')==='MA'?cents(cash.transfers?.petty):0);
    if(cents(row.netMA)!==expected)add('Calculator-এর Net MA মিলছে না',row,key,'সেভ করা অঙ্ক ও বর্তমান সূত্র যাচাই করুন।');
    const capital=entries.find(x=>x.type==='capital'&&x.scope===row.scope&&x.date===row.date&&x.closingSource==='calculator');
    if(capital&&cents(capital.closing?.maWallet)!==cents(row.netMA))add('Calculator ও Working Capital-এর MA মিলছে না',row,key,'এই তারিখের দুই রিপোর্ট পাশাপাশি যাচাই করুন।');
   }
  }
  for(const [key,row]of Object.entries(bank||{}))if(row.type==='withdrawal'&&row.reasonAmounts?.length&&row.reasonAmounts.reduce((n,x)=>n+cents(x.amount),0)!==cents(row.amount))add('Withdraw-এর Reason Amount মিলছে না',row,key,'Reason অনুযায়ী Amount ও Total যাচাই করুন।');
  return {counts:[Object.keys(ledger||{}).length,Object.keys(investment||{}).length,Object.keys(bank||{}).length],findings};
 }
 global.Hisab360Integrity={analyze};if(!global.document)return;
 const el=(tag,text)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;return node;};
 function install(){const host=document.getElementById('adminPageSettings'),bridge=global.portalInvestmentContext;if(!host||!bridge||bridge.getUser()!=='admin'||document.getElementById('financialIntegrityPanel'))return;
  const panel=el('section');panel.id='financialIntegrityPanel';panel.className='backup-settings-card';const heading=el('h3','ডাটা যাচাই'),button=el('button','সব হিসাব যাচাই করুন'),result=el('div');button.type='button';result.setAttribute('role','status');panel.append(heading,el('p','হিসাবের অমিল ও একই Slip ID খুঁজে দেখুন। এই পরীক্ষা কোনো হিসাব পরিবর্তন করে না।'),button,result);host.append(panel);
  button.onclick=async()=>{if(bridge.getUser()!=='admin')return;button.disabled=true;result.textContent='সার্ভারের হিসাব যাচাই হচ্ছে…';try{const values=await Promise.all(['ledgerAccounts','investmentEntries','bankTrackerEntries'].map(root=>bridge.readInvestmentData(root)));if(bridge.getUser()!=='admin')return;const report=analyze(...values);result.replaceChildren(el('p','যাচাই হয়েছে: Daily '+report.counts[0]+' · Investment '+report.counts[1]+' · Bank '+report.counts[2]));if(!report.findings.length)result.append(el('p','এই পরীক্ষাগুলোতে কোনো অমিল পাওয়া যায়নি।'));else{result.append(el('p',report.findings.length+'টি বিষয় যাচাই প্রয়োজন। পুরোনো টাকার অঙ্ক নিজে থেকে পরিবর্তন করা হয়নি।'));const list=el('ul');for(const finding of report.findings){const item=el('li');item.append(el('strong',finding.date+(finding.userId?' · DSO '+finding.userId:'')+' — '+finding.kind),el('p',finding.detail));list.append(item);}result.append(list);}}catch(_){result.textContent='সব ডাটা পাওয়া যায়নি; পরীক্ষা সম্পূর্ণ হয়নি। সংযোগ ও Admin Login যাচাই করে আবার চেষ্টা করুন।';}finally{button.disabled=false;}};
 }
 let queued=false;const schedule=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;install();});};new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['style','hidden']});install();
})(typeof window!=='undefined'?window:globalThis);
