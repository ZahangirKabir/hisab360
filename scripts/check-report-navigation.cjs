'use strict';
const {chromium}=require('playwright');
const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const page=await browser.newPage();await page.route(/^https?:/,r=>r.abort());
 const html=fs.readFileSync('index.html','utf8').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'');
 const css=fs.readFileSync('assets/hisab360-compact-workspace.css','utf8');
 const js=fs.readFileSync('assets/hisab360-report-navigator.js','utf8');
 let checked=0;
 for(const width of [320,390,768,1280])for(const id of ['adminPageReport','adminPageBank','adminPageSlipApproval','adminPageNotes','dsoPageReport','dsoPageSlip']){
  await page.setViewportSize({width,height:900});await page.setContent(html);
  await page.addStyleTag({content:css});
  await page.evaluate(id=>{
   document.querySelector('#loginSection').style.display='none';document.body.classList.remove('login-design-visible');document.querySelector('#appContainer').style.display='block';
   document.querySelectorAll('#adminView,#dsoView,#adminView>div[id^=adminPage],#dsoView>div[id^=dsoPage]').forEach(e=>e.style.display='none');
   document.getElementById(id.startsWith('dso')?'dsoView':'adminView').style.display='block';document.getElementById(id).style.display='block';document.body.dataset.portalMenuRole=id.startsWith('dso')?'dso':'admin';
   document.querySelector('#adminFilterPanel').classList.add('is-collapsed');
   for(const table of document.getElementById(id).querySelectorAll('table')){
    if(!table.tHead?.rows.length){const h=table.tHead||table.createTHead();h.innerHTML='<tr><th>Date</th><th>DSO</th><th>Bank</th><th>Amount</th></tr>';}
    const count=[...table.tHead.rows[table.tHead.rows.length-1].cells].reduce((n,c)=>n+c.colSpan,0),body=table.tBodies[0]||table.createTBody();
    body.innerHTML=Array.from({length:60},(_,i)=>'<tr>'+Array.from({length:count},(_,j)=>'<td class="'+(j===0?'sticky-col-1':j===1?'sticky-col-2':'')+'">'+(j===0?'18/11/26':j===1?'DSO '+(801+i%46):'1,20,000')+'</td>').join('')+'</tr>').join('');
   }
  },id);
  await page.addScriptTag({content:js});await page.waitForTimeout(100);
  await page.evaluate(()=>document.querySelectorAll('.finance-native-table-scroll').forEach(b=>b.scrollTop=450));await page.waitForTimeout(100);
  const state=await page.evaluate(id=>{
   const tables=[...document.getElementById(id).querySelectorAll('table')].filter(t=>t.getBoundingClientRect().width);
   return {overflow:document.documentElement.scrollWidth>innerWidth+1,tables:tables.map(t=>{
    const box=t.closest('.table-container'),rows=[...t.tHead.rows];return {bound:box.classList.contains('finance-native-table-scroll'),nested:box.scrollHeight>box.clientHeight+2,insideForm:!!box.closest('.finance-form-scroll'),gaps:rows.slice(1).map((r,i)=>r.cells[0].getBoundingClientRect().top-rows[i].cells[0].getBoundingClientRect().bottom),headerTop:rows[0].cells[0].getBoundingClientRect().top,expectedTop:box.getBoundingClientRect().top+box.clientTop};
   })};
  },id);
  if(state.overflow||state.tables.some(t=>!t.bound||(!t.nested&&!t.insideForm)||t.gaps.some(g=>Math.abs(g)>1)||(!t.insideForm&&Math.abs(t.headerTop-t.expectedTop)>2)))throw Error('Report scroll/header failure '+JSON.stringify({width,id,state}));
  if(id==='adminPageReport'){
   // Visibility and dimensions change without a scroll/resize event.
   await page.evaluate(()=>{const p=document.getElementById('adminFilterPanel');p.classList.remove('is-collapsed');p.style.display='grid';});await page.waitForTimeout(100);
   const gap=await page.evaluate(()=>{const t=document.getElementById('dataTable');return t.tHead.rows[1].cells[0].getBoundingClientRect().top-t.tHead.rows[0].cells[0].getBoundingClientRect().bottom;});
   if(Math.abs(gap)>1)throw Error('Expanded filter separates header rows '+JSON.stringify({width,gap}));
  }
  checked++;
 }
 // Fitting content has no scroll range; adding rows creates a local range.
 await page.setContent('<div class="table-container"><table><thead><tr><th>Header</th></tr></thead><tbody><tr><td>1,000</td></tr></tbody></table></div>');
 await page.addStyleTag({content:css});await page.addScriptTag({content:js});await page.waitForTimeout(100);
 let range=await page.locator('.table-container').evaluate(e=>e.scrollHeight-e.clientHeight);if(range>1)throw Error('Short report has an unnecessary scrollbar');
 await page.evaluate(()=>document.querySelector('tbody').innerHTML=Array.from({length:100},()=>'<tr><td style="padding:12px">1,000</td></tr>').join(''));await page.waitForTimeout(100);
 range=await page.locator('.table-container').evaluate(e=>e.scrollHeight-e.clientHeight);if(range<100)throw Error('Long report has no local scrollbar');
 // Use the actual Investment runtime to detect cascade conflicts in title controls.
 await page.goto('file://'+process.cwd()+'/Investment.html');
 for(const width of [390,1280]){
  await page.setViewportSize({width,height:900});await page.evaluate(()=>window.openInvestmentPage('capitalReport'));await page.waitForTimeout(120);
  const title=await page.evaluate(()=>({caption:getComputedStyle(document.querySelector('#investmentPageHeading .report-filter'),'::before').content,emptyCard:getComputedStyle(document.querySelector('#content>.capital-filter-in-heading')).display,overflow:document.documentElement.scrollWidth>innerWidth+1}));
  if(!['none','normal','""'].includes(title.caption)||title.emptyCard!=='none'||title.overflow)throw Error('Working Capital title layout regressed '+JSON.stringify({width,title}));
 }
 await page.goto('file://'+process.cwd()+'/Investment.html');await page.waitForTimeout(120);
 for(const width of [390,1280]){
  await page.setViewportSize({width,height:900});await page.evaluate(()=>window.openInvestmentPage('capitalReport'));await page.waitForTimeout(100);
  const layout=await page.evaluate(()=>({caption:getComputedStyle(document.querySelector('#investmentPageHeading .capital-header-period'),'::before').content,emptyHeading:getComputedStyle(document.querySelector('#content>.capital-filter-in-heading')).display,exportReady:typeof window.exportWorkingCapital}));
  if(!['none','normal'].includes(layout.caption)||layout.emptyHeading!=='none'||layout.exportReady!=='function')throw Error('Capital report title/period/export failed '+JSON.stringify({width,layout}));
 }
 await page.evaluate(()=>window.openInvestmentPage('calculator'));await page.waitForTimeout(100);
 const form=await page.locator('#balanceCalculatorForm').evaluate(e=>({bounded:parseFloat(getComputedStyle(e).maxHeight)<innerHeight,overflow:getComputedStyle(e).overflowY,range:e.scrollHeight-e.clientHeight}));
 if(!form.bounded||form.overflow!=='auto'||form.range<1)throw Error('Calculator form scroll missing '+JSON.stringify(form));
 console.log(checked+' populated report/viewport combinations: conditional local scrolling, contiguous grouped headers, sticky positions and filter toggles passed.');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
