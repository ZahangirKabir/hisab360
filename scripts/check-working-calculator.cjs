const fs=require('fs'),vm=require('vm'),assert=require('assert');const html=fs.readFileSync(require('node:path').join(__dirname,'../Investment.html'),'utf8');const c={window:{},bridge:{getAllowedDsoIds:()=>['801','802']},banks:['Islami','City'],console};vm.createContext(c);vm.runInContext(html.slice(html.indexOf('function selectedDateDsoTotals('),html.indexOf('function cashHeadOfficeRows(')),c);const report={date:'2026-11-14',userId:'801',emReturn:100,emReceived:80,cashReceived:20,cashDeposit:10,slips:[{requestKey:'approved',bankName:'Islami',amt:30},{requestKey:'pending',bankName:'Islami',amt:40},{requestKey:'rejected',bankName:'City',amt:50},{bankName:'City',amt:5},{bankName:'City',amt:7,status:'pending'}]};let totals=c.selectedDateDsoTotals({}, {a:{date:report.date,userId:'801',report,requests:{approved:{status:'approved'},pending:{status:'pending'},rejected:{status:'rejected'}}}},report.date);assert.equal(totals.bankDeposits.reduce((s,x)=>s+x.amount,0),35);assert.equal(totals.receive,100);assert.equal(totals.send,80);assert.equal(Object.values(totals.marketCash).reduce((s,x)=>s+x,0),10);assert.equal(c.window.investmentMATotal({opening:100,cashCalculation:{cashDepositLifting:20}}),120);assert.equal(c.window.investmentCashTotals({openingCash:100,cashDepositLifting:20}).netCash,80);assert.equal(c.window.investmentMATotal({opening:100,cashCalculation:{transfers:{petty:10,pettySource:'MA'}}}),90);assert.equal(c.window.investmentCashTotals({openingCash:100,transfers:{petty:10,pettySource:'MA'}}).netCash,100);

const requestOnly={date:report.date,userId:'801',requests:{one:{status:'approved',slips:[{bankName:'Islami',amt:100,transactionId:'ABC123456'}]},two:{status:'pending',slips:[{bankName:'Islami',amt:200}]},three:{status:'rejected',slips:[{bankName:'Islami',amt:300}]}}};
let approvedOnly=c.selectedDateDsoTotals({}, {a:requestOnly},report.date);
assert.equal(approvedOnly.bankDeposits.reduce((n,x)=>n+x.amount,0),100,'Approved slip without daily report must fund bank');
assert.equal(approvedOnly.count,0,'Request-only account must not create a daily report');
const copy=JSON.parse(JSON.stringify(requestOnly));copy.report={date:report.date,userId:'801',slips:[{requestKey:'one',bankName:'Islami',amt:100,transactionId:'ABC123456'}]};copy.requests.duplicate={status:'approved',slips:[{bankName:'Islami Bank',amt:100,transactionId:'ABC-123456'}]};
assert.equal(c.selectedDateDsoTotals({}, {a:copy},report.date).bankDeposits.reduce((n,x)=>n+x.amount,0),100,'Request/report copies and same bank transaction count once');
copy.requests.other={status:'approved',slips:[{bankName:'Islami',amt:100,transactionId:'ABC123457'}]};
assert.equal(c.selectedDateDsoTotals({}, {a:copy},report.date).bankDeposits.reduce((n,x)=>n+x.amount,0),200,'Different transaction with same bank and amount remains distinct');
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
