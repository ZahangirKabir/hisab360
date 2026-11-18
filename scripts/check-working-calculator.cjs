const fs=require('fs'),vm=require('vm'),assert=require('assert');const html=fs.readFileSync(require('node:path').join(__dirname,'../Investment.html'),'utf8');const c={window:{},bridge:{getAllowedDsoIds:()=>['801','802']},banks:['Islami','City'],console};vm.createContext(c);vm.runInContext(html.slice(html.indexOf('function selectedDateDsoTotals('),html.indexOf('function cashHeadOfficeRows(')),c);const report={date:'2026-11-14',userId:'801',emReturn:100,emReceived:80,cashReceived:20,cashDeposit:10,slips:[{requestKey:'approved',bankName:'Islami',amt:30},{requestKey:'pending',bankName:'Islami',amt:40},{requestKey:'rejected',bankName:'City',amt:50},{bankName:'City',amt:5},{bankName:'City',amt:7,status:'pending'}]};let totals=c.selectedDateDsoTotals({}, {a:{date:report.date,userId:'801',report,requests:{approved:{status:'approved'},pending:{status:'pending'},rejected:{status:'rejected'}}}},report.date);assert.equal(totals.bankDeposits.reduce((s,x)=>s+x.amount,0),132);assert.equal(totals.receive,100);assert.equal(totals.send,80);assert.equal(Object.values(totals.marketCash).reduce((s,x)=>s+x,0),10);assert.equal(c.window.investmentMATotal({opening:100,cashCalculation:{cashDepositLifting:20}}),120);assert.equal(c.window.investmentCashTotals({openingCash:100,cashDepositLifting:20}).netCash,80);assert.equal(c.window.investmentCashTotals({openingCash:100,cashDepositLifting:20}).cashInHand,100,'Lifting must leave Cash In Hand unchanged');const liftingCase={openingCash:100,cashReceivedFromBank:30,cashIssueDso:10,cashDepositLifting:20,marketCash:{total:5}};assert.equal(c.window.investmentCashTotals(liftingCase).cashInHand,120);assert.equal(c.window.investmentCashTotals(liftingCase).netCash,105);assert.equal(c.window.investmentMATotal({opening:100,cashCalculation:{transfers:{petty:10,pettySource:'MA'}}}),90);assert.equal(c.window.investmentCashTotals({openingCash:100,transfers:{petty:10,pettySource:'MA'}}).netCash,100);

// Bank Details uses submitted report slips, including pending linked slips.
const requestOnly={date:report.date,userId:'801',requests:{one:{status:'approved',slips:[{bankName:'Islami',amt:100}]}}};
assert.equal(c.selectedDateDsoTotals({}, {a:requestOnly},report.date).bankDeposits.length,0,'Unsubmitted requests are not Bank Details reports');
const copy=JSON.parse(JSON.stringify(requestOnly));
copy.report={date:report.date,userId:'801',slips:[{bankName:'Islami',amt:580000},{bankName:'City',amt:650000},{bankName:'Pubali',amt:983000}]};
assert.equal(c.selectedDateDsoTotals({}, {a:copy},report.date).bankDeposits.reduce((n,x)=>n+x.amount,0),2213000,'Calculator matches Bank Details total');
copy.report={date:report.date,userId:'801',bankName:'City',bankDeposit:'২,২১,৩০০'};
assert.equal(c.selectedDateDsoTotals({}, {a:copy},report.date).bankDeposits[0].amount,221300,'Legacy report fallback remains included even with requests');
copy.date='2026-11-13';assert.equal(c.selectedDateDsoTotals({}, {a:copy},report.date).bankDeposits.length,0,'Other dates excluded');


const input=()=>({value:'stale',dataset:{}});for(const n of ['commissionReceived','cashLifting','cashSalary','cashRoute','cashPetty','pettySource','lifting','maRefund','maOpening','cashOpening','cashBankReceived','cashIssue','marketTeam'])c[n]=input();c.pettySource.value='Cash';c.inputMoney=x=>String(x||0);c.Event=function(){};c.headOfficeRows={children:[{querySelector:()=>({value:'stale',dispatchEvent:()=>{}})}]};c.date={value:'2026-11-14'};c.withdrawalRows=[];c.refundTotal=()=>2;c.previous={closing:{}};c.bankDrafts={Islami:{opening:101,depositDso:202,fundTransfer:303,bankCharge:4},City:{opening:0}};c.maOpening.value='101';c.cashOpening.value='102';c.cashBankReceived.value='103';c.cashIssue.value='104';c.marketTeam.value='105';const start=html.indexOf(' function restoreSavedCalculator('),end=html.indexOf(' async function source',start);vm.runInContext(html.slice(start,end),c);c.restoreSavedCalculator({opening:1,lifting:8,refund:9,commissionReceived:3,cashCalculation:{openingCash:2,cashReceivedFromBank:3,cashIssueDso:4,marketCash:{total:5}},bankCalculations:{Islami:{opening:6,depositDso:7}}},false);assert.equal(c.maOpening.value,'101');assert.equal(c.cashOpening.value,'102');assert.equal(c.cashBankReceived.value,'103');assert.equal(c.bankDrafts.Islami.depositDso,202);assert.equal(c.bankDrafts.Islami.fundTransfer,303);assert.equal(c.lifting.value,'8');assert.equal(c.maRefund.value,'9');assert.equal(c.commissionReceived.value,'3');c.restoreSavedCalculator({},true);assert.equal(c.commissionReceived.value,'0');assert.equal(c.cashLifting.value,'0');assert.equal(c.cashPetty.value,'0');c.previous=null;c.restoreSavedCalculator({opening:500,cashCalculation:{openingCash:600},bankCalculations:{Islami:{opening:700}}},false);assert.equal(c.maOpening.value,'500');assert.equal(c.cashOpening.value,'600');assert.equal(c.bankDrafts.Islami.opening,700);let n=0;for(const m of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)){new vm.Script(m[1]);n++;}console.log('Calculator checks passed: approved/pending/rejected deposits; DSO totals; MA/cash lifting; petty source; fresh source preservation; date reset; first-day opening seed; '+n+' scripts parsed.');

// Regression coverage for missing deposits and unverified calculator saves.
(()=>{
async function run(){
 const c={window:{},setTimeout,clearTimeout,Error,Promise};vm.createContext(c);
 const start=html.indexOf('window.investmentVerifiedCalculatorRead=');
 vm.runInContext(html.slice(start,html.indexOf('window.investmentReadSnapshot=',start)),c);
 const data={verified:true};assert.equal(await c.window.investmentVerifiedCalculatorRead({readInvestmentData:async()=>data},'ledgerAccounts','2026-11-15'),data);
 await assert.rejects(c.window.investmentVerifiedCalculatorRead({},'ledgerAccounts','2026-11-15'),/Server verification/);
 await assert.rejects(c.window.investmentVerifiedCalculatorRead({readInvestmentData:async()=>{throw Error('offline');}},'ledgerAccounts','2026-11-15'),/offline/);
 let timeout; c.setTimeout=fn=>{timeout=fn;return 1;};c.clearTimeout=()=>{};
 const pending=c.window.investmentVerifiedCalculatorRead({readInvestmentData:()=>new Promise(()=>{})},'ledgerAccounts','2026-11-15');timeout();await assert.rejects(pending,/timeout/);
 const formStart=html.indexOf('function balanceCalculator('),submitStart=html.indexOf(' form.onsubmit=async event=>',formStart),end=html.indexOf('   const headOfficeMovements=',submitStart);
 const handler=html.slice(submitStart,end)+"return 'verified';}catch(e){return e.message;}finally{busy=false;date.disabled=false;paint();}};";
 Object.assign(c,{busy:false,loaded:true,loading:false,dsoSyncError:false,bankSyncError:false,preview:false,owner:'admin',bridge:{getUser:()=> 'admin'},date:{value:'2026-11-15'},sourceEpoch:1,form:{isConnected:true,reportValidity:()=>true},paint:()=>{},status:{textContent:''},numeric:x=>Number(x.value)||0,banks:['Islami'],bankDrafts:{Islami:{depositDso:0}},receive:{value:0},send:{value:0},cashIssue:{value:0},marketTeam:{value:0},choice:{onchange:()=>{}},selectedDateDsoTotals:(_,value)=>value});
 c.applyDsoTotals=t=>{c.receive.value=t.receive;c.send.value=t.send;c.cashIssue.value=t.cashIssueDso;c.marketTeam.value=t.marketCash;c.bankDrafts.Islami.depositDso=t.deposit;};
 const totals={receive:0,send:0,cashIssueDso:0,marketCash:0,deposit:3696500};
 c.calculatorSourceSignature=()=>JSON.stringify({deposit:c.bankDrafts.Islami.depositDso,receive:c.receive.value,bank:c.cashBankReceived?.value||0});
 c.applyWithdrawalRows=()=>{};c.window.investmentVerifiedCalculatorRead=async()=>totals;vm.runInContext(handler,c);
 assert.match(await c.form.onsubmit({preventDefault(){}}),/আবার Submit/,'Stale zero must block saving');assert.equal(c.bankDrafts.Islami.depositDso,3696500,'Fresh deposit must replace stale zero');
 assert.equal(await c.form.onsubmit({preventDefault(){}}),'verified','Unchanged server totals pass verification');
 c.cashBankReceived={value:0};c.applyWithdrawalRows=()=>{c.cashBankReceived.value=3640000;};
 assert.match(await c.form.onsubmit({preventDefault(){}}),/আবার Submit/,'Changed bank source must block save');assert.equal(c.cashBankReceived.value,3640000);
 c.window.investmentVerifiedCalculatorRead=async()=>{throw Error('offline');};
 assert.equal(await c.form.onsubmit({preventDefault(){}}),'offline');assert.equal(c.bankDrafts.Islami.depositDso,3696500,'Offline read must retain prior amount');assert.equal(c.busy,false);assert.equal(c.date.disabled,false);
 // A stale SDK bank snapshot must be verified before replacing displayed money.
 Object.assign(c,{selectedDate:'2026-11-15',epoch:1,bankRevision:0,bankSyncError:false,cashBankReceived:{value:3640000},status:{textContent:''},stop:()=>{},failedBank:e=>{c.bankSyncError=true;c.status.textContent=e.message;}});
 c.applyWithdrawalRows=value=>{c.cashBankReceived.value=value.cash;};
 c.window.investmentVerifiedCalculatorRead=async()=>({cash:3640000});
 const watchStart=html.indexOf('  const handler=async snap=>',html.indexOf(' function watchWithdrawals(')),watchEnd=html.indexOf('  let cancel=',watchStart);
 vm.runInContext(html.slice(watchStart,watchEnd).replace('const handler=','handler='),c);
 await c.handler({val:()=>({})});assert.equal(c.cashBankReceived.value,3640000,'Empty cached bank snapshot must not clear server amount');assert.equal(c.bankSyncError,false);
 c.window.investmentVerifiedCalculatorRead=async()=>{throw Error('bank offline');};await c.handler({val:()=>({})});assert.equal(c.cashBankReceived.value,3640000);assert.equal(c.bankSyncError,true,'Unverified bank data must disable saving');
 c.window.investmentVerifiedCalculatorRead=async()=>({cash:120});await c.handler({val:()=>({})});assert.equal(c.cashBankReceived.value,120);assert.equal(c.bankSyncError,false,'Successful verification must restore saving');
 console.log('Calculator verification passed: authenticated read; missing bridge; offline; timeout; stale deposit blocks save; corrected retry; amount retained on failure.');
}
run().catch(e=>{console.error(e);process.exitCode=1;});

})();

(async()=>{
 const timers=new Map(),callbacks={},values=[],errors=[];let seq=0,server={verified:100},reads=0;
 const context={window:{},document:{hidden:false,addEventListener(){},removeEventListener(){}},setTimeout:fn=>{timers.set(++seq,fn);return seq;},clearTimeout:id=>timers.delete(id),console};
 context.window.addEventListener=()=>{};context.window.removeEventListener=()=>{};
 vm.createContext(context);
 const begin=html.indexOf('window.investmentWatchData='),end=html.indexOf(' // Calculator money',begin);
 vm.runInContext(html.slice(begin,end),context);
 const query={on:(event,fn)=>{callbacks.value=fn;},off(){},orderByChild(){return this;},equalTo(){return this;}};
 const connection={on:(event,fn)=>{callbacks.connection=fn;},off(){}};
 const bridge={database:{ref:path=>path==='.info/connected'?connection:query},readInvestmentData:async()=>{reads++;if(server instanceof Error)throw server;return server;}};
 const stop=context.window.investmentWatchData(bridge,'investmentEntries',snap=>values.push(snap.val()),error=>errors.push(error),'2026-11-15');
 const tick=async()=>{const entry=[...timers.entries()].at(-1);assert(entry,'Expected verification timer');timers.delete(entry[0]);await entry[1]();};
 callbacks.connection({val:()=>true});callbacks.value({val:()=>({cached:0})});assert.equal(values.length,0,'Initial SDK cache must not be published');
 await tick();assert.equal(values.at(-1).verified,100);assert.equal(reads,1);
 callbacks.value({val:()=>({verified:200})});assert.equal(values.at(-1).verified,200,'Verified live connection keeps realtime updates');
 callbacks.connection({val:()=>false});callbacks.value({val:()=>({cached:0})});assert.equal(values.at(-1).verified,200,'Disconnected cache cannot clear displayed data');
 server={verified:300};callbacks.connection({val:()=>true});await tick();assert.equal(values.at(-1).verified,300,'Reconnect verifies server first');
 callbacks.connection({val:()=>false});server=Error('offline');await tick();assert.equal(values.at(-1).verified,300);assert.equal(errors.length,1);
 stop();assert.equal(timers.size,0);console.log('Initial financial snapshot, realtime updates, reconnect verification, offline retention and cleanup checks passed.');
})().catch(error=>{console.error(error);process.exitCode=1;});

(()=>{
 const source=fs.readFileSync(require('path').join(__dirname,'../assets/hisab360-user-management-v3.js'),'utf8');
 let registryCallback,reloads=0,reattached=0;
 const context={window:{},SUB_ADMIN_GROUPS:{adminSadar:new Set(['801']),adminSaturia:new Set(['802'])},portalDsoRegistry:{},currentUser:'adminSadar',realtimeListenerAttached:true,refreshPortalDsoTransferOptions(){},populateDsoDropdown(){},portalDsoIds:()=>['801','802','846'],isGroupAdmin:id=>id==='adminSadar',listenRealtimeData:()=>reattached++,refreshCurrentData:()=>{reloads++;return Promise.resolve();},document:{getElementById:()=>null},firebase:{app:()=>({database:()=>({ref:()=>({on:(event,fn)=>registryCallback=fn})})})}};
 vm.createContext(context);vm.runInContext(source,context);
 const assignments={'846':{assignedAdmin:'adminSadar',enabled:true}};
 registryCallback({val:()=>assignments});assert.equal(reloads,0,'Assignment sync must never navigate/reload');assert.equal(reattached,1);assert(context.SUB_ADMIN_GROUPS.adminSadar.has('846'));
 registryCallback({val:()=>assignments});assert.equal(reattached,1,'Unchanged registry must not restart listeners');
 console.log('Group assignment sync updates scoped data without reloading; unchanged registry does not restart listeners.');
})();

(()=>{
 const path=require('path');let count=0;
 for(const directory of ['assets','scripts','setup'])for(const name of fs.readdirSync(path.join(__dirname,'..',directory)).filter(name=>/\.(js|cjs)$/.test(name))){
  if(directory==='assets'&&name==='vendor')continue;
  new vm.Script(fs.readFileSync(path.join(__dirname,'..',directory,name),'utf8'),{filename:directory+'/'+name});count++;
 }
 const source=fs.readFileSync(path.join(__dirname,'apply-data-protection.cjs'),'utf8'),start=source.indexOf('function recentProtectionBackup('),end=source.indexOf('const expectedRelease=',start),ctx={Date,Number};vm.createContext(ctx);vm.runInContext(source.slice(start,end),ctx);
 const now=Date.parse('2026-11-15T12:00:00Z');
 assert.equal(ctx.recentProtectionBackup({restoreVerified:true,lastFullAt:'2026-11-15T11:00:00Z'},now),true);
 for(const backup of [{restoreVerified:true},{restoreVerified:true,lastFullAt:'invalid'},{restoreVerified:true,lastFullAt:'2026-11-14T11:00:00Z'},{restoreVerified:true,lastFullAt:'2026-11-16T11:00:00Z'},{restoreVerified:false,lastFullAt:'2026-11-15T11:00:00Z'}])assert.equal(ctx.recentProtectionBackup(backup,now),false);
 console.log(count+' standalone scripts parse; missing, invalid, stale, future and unverified protection backups rejected.');
})();
