const {chromium}=require('playwright');
const fs=require('fs');const base=process.cwd()+'/';
(async()=>{const browser=await chromium.launch({headless:true,args:['--no-sandbox']});const page=await browser.newPage();await page.route(/^https?:/,r=>r.abort());
const html=fs.readFileSync(base+'index.html','utf8').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'');
fs.mkdirSync('responsive-checks',{recursive:true});const results=[];
for(const width of [320,360,390,600,768,1024,1440]){
 await page.setViewportSize({width,height:900});await page.setContent(html);await page.evaluate(()=>{document.querySelector('#loginSection').style.display='none';document.body.classList.remove('login-design-visible');document.querySelector('#appContainer').style.display='block';document.querySelector('#adminView').style.display='block';document.querySelector('#adminFilterPanel').classList.remove('is-collapsed');document.querySelector('#adminReportToolbar').hidden=false;document.querySelectorAll('#adminReportToolbar button').forEach(b=>b.hidden=false);});
 const r=await page.evaluate(()=>({page:document.documentElement.scrollWidth,viewport:innerWidth,filter:document.querySelector('#adminFilterPanel').getBoundingClientRect().width,controlHeight:document.querySelector('#filterAdmin').getBoundingClientRect().height}));results.push({view:'portal',width,...r});if(r.page>width+1)throw Error(JSON.stringify(results));if(r.filters.some(f=>f.height>200))throw Error('Oversized filter '+JSON.stringify({id,width,...r}));if(width===390)await page.screenshot({path:'responsive-checks/hisab-portal-mobile.png'});
}
for(const id of ['loginSection','adminPageBank','adminPageSlipApproval','adminPageNotes','adminPageSettings','dsoPageForm','dsoPageSlip','dsoPageReport','dsoPageSettings']){
 for(const width of [320,390,768,1440]){
  await page.setViewportSize({width,height:900});await page.setContent(html);
  await page.evaluate(id=>{document.querySelector('#loginSection').style.display=id==='loginSection'?'block':'none';document.querySelector('#appContainer').style.display=id==='loginSection'?'none':'block';document.querySelectorAll('#adminView,#dsoView,#adminView>div[id^=adminPage],#dsoView>div[id^=dsoPage]').forEach(e=>e.style.display='none');const el=document.getElementById(id);el.style.display='block';if(id.startsWith('admin'))document.querySelector('#adminView').style.display='block';if(id.startsWith('dso'))document.querySelector('#dsoView').style.display='block';},id);
  const r=await page.evaluate(()=>({page:document.documentElement.scrollWidth,viewport:innerWidth}));results.push({view:id,width,...r});if(r.page>width+1)throw Error('Page overflow '+JSON.stringify({id,width,...r}));
 }
}
await page.goto('file://'+base+'Investment.html');await page.waitForTimeout(300);
console.log('Investment buttons',await page.locator('#moduleMenu button').evaluateAll(es=>es.map(e=>({id:e.id,text:e.textContent.trim()}))));
for(const id of ['showWorkingCapital','showWorkingCapitalReport','showPettyCashReport','showBankCheque','showBankWithdraw','showBankDeposit','showExpenseTypes','showHeadOfficeReport','showTotalInvestment']){
 if(!await page.locator('#'+id).count())continue;await page.locator('#'+id).evaluate(e=>e.click());await page.waitForTimeout(100);
 for(const width of [320,390,600,768,1024,1440]){await page.setViewportSize({width,height:900});const r=await page.evaluate(()=>({page:document.documentElement.scrollWidth,viewport:innerWidth,filters:[...document.querySelectorAll('.report-filter,.bank-filters')].filter(e=>e.getBoundingClientRect().height).map(e=>({width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height}))}));results.push({view:id,width,...r});if(r.page>width+1)throw Error(JSON.stringify(results));if(r.filters.some(f=>f.height>200))throw Error('Oversized filter '+JSON.stringify({id,width,...r}));if(width===390)await page.screenshot({path:'responsive-checks/hisab-'+id+'.png'});}
}
console.log(JSON.stringify(results));await browser.close();})().catch(e=>{console.error(e);process.exit(1)});
