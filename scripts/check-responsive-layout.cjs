const {chromium}=require('playwright');
const fs=require('fs');const base=process.cwd()+'/';
(async()=>{const browser=await chromium.launch({headless:true,args:['--no-sandbox']});const page=await browser.newPage();await page.route(/^https?:/,r=>r.abort());
const html=fs.readFileSync(base+'index.html','utf8').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'');
fs.mkdirSync('responsive-checks',{recursive:true});const results=[];
for(const width of [320,360,390,600,768,1024,1440,1920,2560]){
 await page.setViewportSize({width,height:900});await page.setContent(html);await page.evaluate(()=>{document.querySelector('#loginSection').style.display='none';document.body.classList.remove('login-design-visible');document.querySelector('#appContainer').style.display='block';document.querySelector('#adminView').style.display='block';document.querySelector('#adminFilterPanel').classList.remove('is-collapsed');document.querySelector('#adminReportToolbar').hidden=false;document.querySelectorAll('#adminReportToolbar button').forEach(b=>b.hidden=false);});
 const r=await page.evaluate(()=>({page:document.documentElement.scrollWidth,viewport:innerWidth,filter:document.querySelector('#adminFilterPanel').getBoundingClientRect().width,controlHeight:document.querySelector('#filterAdmin').getBoundingClientRect().height}));results.push({view:'portal',width,...r});if(r.page>width+1)throw Error(JSON.stringify(results));if(width===390)await page.screenshot({path:'responsive-checks/hisab-portal-mobile.png'});
}
for(const id of ['loginSection','adminPageBank','adminPageSlipApproval','adminPageNotes','adminPageSettings','dsoPageForm','dsoPageSlip','dsoPageReport','dsoPageSettings']){
 for(const width of [320,390,768,1440,1920]){
  await page.setViewportSize({width,height:900});await page.setContent(html);
  await page.evaluate(id=>{document.querySelector('#loginSection').style.display=id==='loginSection'?'block':'none';document.querySelector('#appContainer').style.display=id==='loginSection'?'none':'block';document.querySelectorAll('#adminView,#dsoView,#adminView>div[id^=adminPage],#dsoView>div[id^=dsoPage]').forEach(e=>e.style.display='none');const el=document.getElementById(id);el.style.display='block';if(id.startsWith('admin'))document.querySelector('#adminView').style.display='block';if(id.startsWith('dso'))document.querySelector('#dsoView').style.display='block';},id);
  const r=await page.evaluate(()=>({page:document.documentElement.scrollWidth,viewport:innerWidth}));results.push({view:id,width,...r});if(r.page>width+1){await page.screenshot({path:'responsive-checks/overflow-'+id+'.png'});throw Error('Page overflow '+JSON.stringify({id,width,...r,offenders:await page.evaluate(()=>[...document.querySelectorAll('body *')].filter(e=>e.getBoundingClientRect().right>innerWidth+1).slice(0,12).map(e=>({tag:e.tagName,id:e.id,cls:e.className,width:e.getBoundingClientRect().width}))) }));}
 }
}
await page.goto('file://'+base+'Investment.html');await page.waitForTimeout(300);
console.log('Investment buttons',await page.locator('#moduleMenu button').evaluateAll(es=>es.map(e=>({id:e.id,text:e.textContent.trim()}))));
for(const id of ['showWorkingCapital','showWorkingCapitalReport','showPettyCashReport','showBankCheque','showBankWithdraw','showBankDeposit','showExpenseTypes','showHeadOfficeReport','showTotalInvestment']){
 if(!await page.locator('#'+id).count())continue;await page.locator('#'+id).evaluate(e=>e.click());await page.waitForTimeout(100);
 for(const width of [320,390,600,768,1024,1440,1920]){await page.setViewportSize({width,height:900});const r=await page.evaluate(()=>({page:document.documentElement.scrollWidth,viewport:innerWidth,filters:[...document.querySelectorAll('.report-filter,.bank-filters')].filter(e=>e.getBoundingClientRect().height).map(e=>({width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height}))}));results.push({view:id,width,...r});if(r.page>width+1)throw Error(JSON.stringify(results));if(width===390)await page.screenshot({path:'responsive-checks/hisab-'+id+'.png'});if(r.filters?.some(f=>f.height>200))throw Error('Oversized filter '+JSON.stringify({id,width,...r}));if(width===390)await page.screenshot({path:'responsive-checks/hisab-'+id+'.png'});}
}
await page.locator('#showBankCheque').evaluate(e=>e.click());await page.setViewportSize({width:390,height:900});await page.waitForTimeout(100);
await page.evaluate(()=>{const host=document.querySelector('#bankList');host.innerHTML='<table><thead><tr><th>Date</th><th>Bank</th><th>Withdraw By</th><th>Cheque</th><th>Amount</th><th>Withdrawer</th></tr></thead><tbody><tr><td>2026-11-10</td><td>Pubali</td><td>Cheque</td><td>8268454</td><td>13,50,000</td><td>Sample</td></tr></tbody></table>';});
const readability=await page.evaluate(()=>{const host=document.querySelector('#bankList');return {scrolls:host.scrollWidth>host.clientWidth,unbroken:[...host.querySelectorAll('td')].every(e=>getComputedStyle(e).whiteSpace==='nowrap'&&e.getBoundingClientRect().height<45),headingOutline:getComputedStyle(document.querySelector('#investmentPageHeading strong')).outlineStyle};});
if(!readability.scrolls||!readability.unbroken||readability.headingOutline!=='none')throw Error('Populated bank report readability failed '+JSON.stringify(readability));
await page.screenshot({path:'responsive-checks/populated-bank-mobile.png'});console.log('Populated report: unbroken dates, banks, cheque IDs and amounts; internal scrolling; no heading focus border.');
const source=fs.readFileSync(base+'index.html','utf8');const sidebar=[...source.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]).find(s=>s.includes("const rail=document.createElement('nav')"));if(!sidebar)throw Error('Missing sidebar source');
for(const width of [390,1440]){
 await page.setViewportSize({width,height:900});await page.setContent(html);
 await page.evaluate(()=>{document.querySelector('#loginSection').style.display='none';document.querySelector('#appContainer').style.display='block';document.querySelector('#adminView').style.display='none';document.querySelector('#dsoView').style.display='block';document.querySelector('#dsoTabNav').style.display='flex';document.querySelector('#adminTabNav').style.display='none';document.body.dataset.portalMenuRole='dso';document.querySelector('#portalTitle').textContent='Admin Control Dashboard';const toolbar=document.querySelector('#adminReportToolbar'),filters=document.querySelector('.slip-approval-filters');const row=document.createElement('div');row.className='report-page-controls';document.querySelector('#appContainer').append(row);row.append(document.querySelector('#adminPageHeading'),toolbar);toolbar.hidden=false;document.querySelector('#adminFilterToggle').hidden=false;filters.id='inlineSlipFilters';filters.hidden=false;toolbar.append(filters);});
 await page.addScriptTag({content:sidebar});await page.waitForTimeout(80);
 const state=await page.evaluate(()=>({railHidden:document.querySelector('#hisabSideMenu').hidden,originalVisible:getComputedStyle(document.querySelector('#dsoTabNav')).display!=='none',adminHidden:getComputedStyle(document.querySelector('#adminTabNav')).display==='none',clones:document.querySelectorAll('#hisabSideMenu .rail-items button').length,adminFieldsHidden:[...document.querySelectorAll('#adminView input,#adminView select,#adminReportToolbar input,#adminReportToolbar select,#adminReportToolbar button')].every(e=>e.getClientRects().length===0),settingsLabelVisible:getComputedStyle(document.querySelector('#tabDsoSettingsBtn .dso-menu-label')).clipPath==='none'&&document.querySelector('#tabDsoSettingsBtn .dso-menu-label').textContent==='Setting'&&document.querySelector('#tabDsoSettingsBtn').getBoundingClientRect().width>44}));
 if(!state.railHidden||!state.originalVisible||!state.adminHidden||state.clones||!state.adminFieldsHidden||!state.settingsLabelVisible)throw Error('DSO menu isolation failed '+JSON.stringify(state));
 await page.evaluate(()=>{document.body.dataset.portalMenuRole='admin';document.querySelector('#adminView').style.display='block';document.querySelector('#dsoView').style.display='none';document.querySelector('#adminTabNav').style.display='flex';document.querySelector('#dsoTabNav').style.display='none';});await page.waitForTimeout(80);
 if(await page.locator('#hisabSideMenu').evaluate(e=>e.hidden))throw Error('Admin menu was not restored');
 await page.evaluate(()=>{document.body.dataset.portalMenuRole='dso';document.querySelector('#adminView').style.display='none';document.querySelector('#dsoView').style.display='block';document.querySelector('#adminTabNav').style.display='none';document.querySelector('#dsoTabNav').style.display='flex';});await page.waitForTimeout(80);
 if(await page.locator('#hisabSideMenu .rail-items button').count())throw Error('Admin clones remained after DSO switch');
}
console.log('DSO original menu only: mobile, desktop, misleading title and Admin-to-DSO session changes passed.');

await page.setViewportSize({width:390,height:900});await page.setContent(html);
await page.evaluate(()=>{document.querySelector('#loginSection').style.display='none';document.querySelector('#appContainer').style.display='block';document.querySelector('#adminView').style.display='block';document.querySelector('#adminPageInvestment').style.display='block';});
const fitter=source.match(/<script id="investment-content-height">([\s\S]*?)<\/script>/)?.[1];if(!fitter)throw Error('Content frame sizing missing');
await page.addScriptTag({content:fitter});await page.locator('#investmentFrame').evaluate(frame=>frame.srcdoc='<body style="margin:0;padding:8px"><main style="height:160px">Short report fixture</main></body>');await page.waitForTimeout(150);
let size=await page.locator('#investmentFrame').evaluate(e=>e.getBoundingClientRect().height);if(size>190||size<160)throw Error('Empty report space persisted '+size);
await page.locator('#investmentFrame').evaluate(e=>e.contentDocument.querySelector('main').style.height='650px');await page.waitForTimeout(150);
size=await page.locator('#investmentFrame').evaluate(e=>e.getBoundingClientRect().height);if(size<650)throw Error('Long report clipped '+size);
await page.locator('#investmentFrame').evaluate(e=>e.contentDocument.querySelector('main').style.height='90px');await page.waitForTimeout(150);
size=await page.locator('#investmentFrame').evaluate(e=>e.getBoundingClientRect().height);if(size>120)throw Error('Report did not shrink '+size);
console.log('Embedded report grows and shrinks to content without viewport blank space.');

await page.setViewportSize({width:1280,height:900});await page.setContent(html);
await page.evaluate(()=>{document.querySelector('#loginSection').style.display='none';document.querySelector('#appContainer').style.display='block';document.querySelector('#adminView').style.display='block';document.querySelector('#adminPageReport').style.display='block';document.body.dataset.portalMenuRole='admin';const table=document.querySelector('#dataTable');table.tBodies[0].innerHTML=Array.from({length:46},(_,i)=>'<tr>'+Array.from({length:16},(_,j)=>'<td>'+(j===0?'2026-11-11':j===1?'DSO '+(801+i):'1,000')+'</td>').join('')+'</tr>').join('');});
const dailyFit=source.match(/<script id="daily-report-fit">([\s\S]*?)<\/script>/)?.[1];if(!dailyFit)throw Error('Daily report sizing missing');await page.addScriptTag({content:dailyFit});await page.waitForTimeout(200);
const filled=await page.evaluate(()=>({bottom:document.querySelector('body>.portal-footer').getBoundingClientRect().bottom,height:innerHeight}));if(Math.abs(filled.height-filled.bottom)>14)throw Error('Daily report wasted screen space '+JSON.stringify(filled));
await page.screenshot({path:'responsive-checks/daily-report-fills-screen.png'});
await page.evaluate(()=>{const body=document.querySelector('#dataTable tbody');while(body.rows.length>2)body.deleteRow(-1);});await page.waitForTimeout(150);
const shortGap=await page.evaluate(()=>document.querySelector('body>.portal-footer').getBoundingClientRect().top-document.querySelector('#dataTable').getBoundingClientRect().bottom);if(shortGap>14)throw Error('Short daily report has footer gap '+shortGap);
console.log('Daily report uses remaining screen height; short reports keep footer next to table.');

await page.evaluate(()=>{document.querySelector('#adminPageReport').style.display='none';document.querySelector('#adminPageBank').style.display='block';document.querySelector('#bankDetailsTableHead').innerHTML='<tr><th>Date</th><th>DSO</th><th>Bank</th><th>Amount</th></tr>';document.querySelector('#bankDetailsTableBody').innerHTML=Array.from({length:60},()=>'<tr><td>2026-11-11</td><td>DSO 801</td><td>Sample Bank</td><td>1,000</td></tr>').join('');});await page.waitForTimeout(200);
const bankScroll=await page.evaluate(()=>{const box=document.querySelector('#adminPageBank .table-container');return{pageScroll:document.documentElement.scrollHeight>innerHeight+1,tableScroll:box.scrollHeight>box.clientHeight,fillsWidth:box.querySelector('table').getBoundingClientRect().width>=box.clientWidth-2};});if(bankScroll.pageScroll||!bankScroll.tableScroll||!bankScroll.fillsWidth)throw Error('Bank Details scroll layout failed '+JSON.stringify(bankScroll));console.log('Bank Details: table scrolls, whole page does not.');

await page.setContent(html);await page.evaluate(()=>{document.querySelector('#loginSection').style.display='none';document.querySelector('#appContainer').style.display='block';document.querySelector('#adminView').style.display='block';document.querySelector('#adminPageReport').style.display='none';document.querySelector('#adminPageSlipApproval').style.display='block';const heading=document.querySelector('#adminPageHeading'),toolbar=document.querySelector('#adminReportToolbar');heading.hidden=false;toolbar.hidden=false;document.querySelector('#adminFilterToggle').hidden=false;document.querySelector('#adminPageTitle').textContent='Bank Slip Approval';const row=document.createElement('div');row.className='report-page-controls';heading.before(row);row.append(heading,toolbar);const filters=document.querySelector('.slip-approval-filters');filters.id='inlineSlipFilters';filters.hidden=false;toolbar.append(filters);});
for(const width of [320,390,1280]){await page.setViewportSize({width,height:900});const layout=await page.evaluate(()=>[document.querySelector('#adminFilterToggle'),document.querySelector('#slipApprovalStatus'),document.querySelector('#slipApprovalBank')].map(e=>{const r=e.getBoundingClientRect();return{left:r.left,right:r.right,top:r.top,width:r.width,height:r.height};}));if(layout.some((r,i)=>r.left<0||r.right>width||r.width<(i?75:40))||Math.abs(layout[1].top-layout[2].top)>2)throw Error('Inline filters clipped '+JSON.stringify({width,layout}));await page.locator('#slipApprovalStatus').selectOption('approved');if(await page.locator('#slipApprovalStatus').evaluate(e=>e.value)!=='approved')throw Error('Status selection failed');if(width===390)await page.screenshot({path:'responsive-checks/inline-filters-mobile.png'});}
console.log('Status and Bank Name fields visible side by side at 320, 390 and 1280 pixels.');

await page.evaluate(()=>document.querySelector('#inlineSlipFilters').hidden=true);
if(await page.locator('#inlineSlipFilters').isVisible())throw Error('Slip filters leaked into another report despite hidden state');
console.log('Hidden slip filters stay invisible on other reports.');

for(const [width,height] of [[640,360],[844,390],[1024,600]]){
 await page.setViewportSize({width,height});await page.setContent(html);await page.evaluate(()=>{document.querySelector('#loginSection').style.display='none';document.querySelector('#appContainer').style.display='block';document.querySelector('#adminView').style.display='block';document.querySelector('#adminFilterPanel').classList.remove('is-collapsed');});const extent=await page.evaluate(()=>document.documentElement.scrollWidth);if(extent>width+1)throw Error('Landscape page overflow '+JSON.stringify({width,height,extent}));
}
console.log('Responsive audit covers 320–2560px widths and landscape phones/tablets.');

await page.goto('about:blank');await page.setViewportSize({width:390,height:900});await page.setContent('<html><head></head><body><label>Status<select id="dropdownFixture"><option value="">All Status</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option></select></label><button id="outsideFixture" style="position:fixed;bottom:10px;right:10px">Outside</button></body></html>');
await page.evaluate(()=>{window.changed=0;document.querySelector('select').onchange=()=>window.changed++;});await page.addScriptTag({content:fs.readFileSync('assets/hisab360-select-menus.js','utf8')});await page.waitForTimeout(80);
await page.locator('.h360-select').click();await page.getByRole('option',{name:'Pending',exact:true}).click();
const customState=await page.evaluate(()=>({value:document.querySelector('select').value,changes:window.changed,text:document.querySelector('.h360-select span').textContent,closed:!document.querySelector('.h360-options')}));if(customState.value!=='pending'||customState.changes!==1||customState.text!=='Pending'||!customState.closed)throw Error('Custom dropdown selection failed '+JSON.stringify(customState));
await page.locator('.h360-select').click();const popup=await page.locator('.h360-options').evaluate(e=>{const r=e.getBoundingClientRect();return{left:r.left,right:r.right,bottom:r.bottom,height:r.height,bg:getComputedStyle(e).backgroundColor};});if(popup.left<0||popup.right>390||popup.bottom>900||popup.height>300||popup.bg!=='rgb(255, 255, 255)')throw Error('Custom dropdown bounds failed '+JSON.stringify(popup));await page.screenshot({path:'responsive-checks/compact-dropdown-mobile.png'});await page.locator('#outsideFixture').click();if(await page.locator('.h360-options').count())throw Error('Outside tap did not close dropdown');
await page.locator('.h360-select').press('ArrowDown');await page.keyboard.press('Escape');
await page.evaluate(()=>{const s=document.querySelector('select');s.append(new Option('City Bank','city'));s.value='city';s.dispatchEvent(new Event('change',{bubbles:true}));});await page.waitForTimeout(80);if(await page.locator('.h360-select span').innerText()!=='City Bank')throw Error('Dynamic options not synchronized');
console.log('Compact dropdown selection, native change handlers, positioning, outside tap and dynamic options passed.');

await page.goto('about:blank');await page.setContent(html);
await page.evaluate(()=>{
 document.body.dataset.portalMenuRole='dso';
 document.querySelector('#loginSection').style.display='none';
 document.querySelector('#appContainer').style.display='block';
 document.querySelector('#adminView').style.display='none';
 document.querySelector('#dsoView').style.display='block';
 document.querySelector('#dsoPageForm').style.display='block';
 for(const [id,kind] of [['dsoReceivedContainer','rec'],['dsoTransferContainer','trans']]){
  document.getElementById(id).innerHTML='<div class="dynamic-row"><select class="dso-'+kind+'-id"><option value="">Select DSO</option><option value="801">DSO 801</option></select><input type="text" class="amt-field dso-'+kind+'-amt" placeholder="Amount" value="1,20,000"><button type="button" class="btn-remove-row">×</button></div>';
 }
});
await page.addScriptTag({content:fs.readFileSync('assets/hisab360-select-menus.js','utf8')});
await page.waitForTimeout(100);
for(const width of [320,360,390,610,768,1280]){
 await page.setViewportSize({width,height:900});
 const sizes=await page.locator('#dsoReceivedContainer .dynamic-row,#dsoTransferContainer .dynamic-row').evaluateAll(rows=>rows.map(row=>{
  const select=row.querySelector('.h360-select').getBoundingClientRect(),amount=row.querySelector('input').getBoundingClientRect(),remove=row.querySelector('.btn-remove-row').getBoundingClientRect();
  return {selectWidth:select.width,amountWidth:amount.width,selectHeight:select.height,amountHeight:amount.height,overlap:select.right>amount.left+.5,overflow:remove.right>innerWidth};
 }));
 if(sizes.some(r=>r.amountWidth<100||r.selectWidth<80||Math.abs(r.selectHeight-r.amountHeight)>1||r.overlap||r.overflow))throw Error('DSO breakdown layout '+JSON.stringify({width,sizes}));
 if(width===390)await page.screenshot({path:'responsive-checks/dso-received-transfer-mobile.png'});
}
console.log('DSO received and transfer: equal-height controls, usable amounts, no overlap at 320–1280px.');


const adminUIStart=source.indexOf('let adminSlipUploadContext='),adminUIEnd=source.indexOf('async function submitBankSlips()',adminUIStart);
if(adminUIStart<0||adminUIEnd<0)throw Error('Admin slip upload UI missing');
await page.goto('about:blank');await page.setContent(html);
await page.evaluate(code=>{
 window.currentUser='admin';window.bankSlipSubmitInProgress=false;window.adminEditOriginal={date:'2026-11-10',userId:'801'};
 document.getElementById('editKey').value='daily_2026-11-10_801';document.getElementById('editChangePreview').replaceChildren();
 window.updateEditChangePreview=()=>{};window.cleanupSlipPreview=()=>{};window.isKnownPortalDsoId=id=>id==='801';
 window.addSlipRow=()=>{const row=document.createElement('div');row.className='slip-box-item';row.textContent='Slip upload form';document.getElementById('slipsContainer').append(row);};
 (0,eval)(code+';window.testAdminUploadOpen=openAdminSlipUpload;window.testAdminUploadClose=closeAdminSlipUpload;');
},source.slice(adminUIStart,adminUIEnd));

await page.evaluate(code=>{
 window.slipCounter=0;window.validateFormAndSubmitBtn=()=>{};
 window.getBankOptionsHTML=()=>'<option value="">-- Select Bank --</option><option>Pubali Bank</option>';
 window.getApprovedAccountOptionsHTML=()=>'<option value="">-- OCR থেকে অনুমোদিত অ্যাকাউন্ট আসবে --</option><option>Pubali Bank · 1231901053446 · M/S. Mostafa</option>';
 (0,eval)(code);
},source.slice(source.indexOf('function addSlipRow()'),source.indexOf('function removeSlipRow(')));
await page.evaluate(()=>{window.currentUser='823';window.testAdminUploadOpen();});
if(await page.locator('#adminSlipUploadModal').count())throw Error('DSO opened Admin upload');
await page.evaluate(()=>{window.currentUser='admin';window.testAdminUploadOpen();});
if(!await page.locator('#adminSlipUploadModal #dsoPageSlip').count())throw Error('Admin upload form did not open');
await page.addScriptTag({content:fs.readFileSync('assets/hisab360-select-menus.js','utf8')});await page.waitForTimeout(80);
if(!await page.locator('#adminSlipUploadTitle').innerText().then(x=>x.includes('801')&&x.includes('2026-11-10')))throw Error('Admin upload target missing');
for(const width of [320,390,768,1440]){
 await page.setViewportSize({width,height:900});
 const bounds=await page.locator('#adminSlipUploadModal .modal-content').evaluate(e=>{const r=e.getBoundingClientRect();return {left:r.left,right:r.right,scrollWidth:e.scrollWidth,width:e.clientWidth};});
 if(bounds.left<0||bounds.right>width+1||bounds.scrollWidth>bounds.width+1)throw Error('Admin upload modal overflow '+JSON.stringify({width,bounds}));
}
await page.evaluate(()=>window.testAdminUploadClose(true));
if(!await page.locator('#dsoView #dsoPageSlip').count())throw Error('Shared DSO upload form not restored');
if(await page.locator('#adminSlipUploadModal').isVisible())throw Error('Admin upload modal failed to close');
console.log('Admin upload role guard, selected DSO/date, responsive dialog and DSO form restoration passed.');

const checkSlip=async(label)=>{
 const result=await page.locator('#slipsContainer .slip-field').evaluateAll(fields=>fields.map(field=>{
  const r=field.getBoundingClientRect(),control=field.querySelector('button.h360-select,input:not([type=file]),.slip-file-label'),c=control?.getBoundingClientRect(),caption=field.querySelector('.slip-field-label')?.getBoundingClientRect();
  return {width:r.width,fieldRight:r.right,controlRight:c?.right||0,controlTop:c?.top||0,labelBottom:caption?.bottom||0};
 }));
 if(result.length!==7||result.some(r=>r.width<100||r.controlRight>r.fieldRight+1||r.controlTop<r.labelBottom-1))throw Error('Slip controls overlap '+JSON.stringify({label,result}));
};
for(const width of [320,390,768,1024,1440,2560]){
 await page.setViewportSize({width,height:900});
 await page.evaluate(()=>{window.currentUser='admin';window.testAdminUploadOpen();});
 await page.waitForTimeout(60);await checkSlip('admin '+width);
 if(width===1024)await page.screenshot({path:'responsive-checks/admin-real-slip-dialog.png'});
 await page.evaluate(()=>window.testAdminUploadClose(true));
}
await page.evaluate(()=>{
 document.body.dataset.portalMenuRole='dso';document.querySelector('#loginSection').style.display='none';document.querySelector('#appContainer').style.display='block';document.querySelector('#adminView').style.display='none';document.querySelector('#dsoView').style.display='block';document.querySelector('#dsoPageForm').style.display='none';document.querySelector('#dsoPageSlip').style.display='block';
});
for(const width of [320,390,768,1440]){
 await page.setViewportSize({width,height:900});await checkSlip('dso '+width);
 if(width===390)await page.screenshot({path:'responsive-checks/dso-real-slip-mobile.png'});
}
console.log('Real seven-field slip form fits both narrow Admin dialogs and DSO pages at 320–2560px.');



await page.goto('about:blank');await page.setContent('<section id="adminPageSettings"></section>');
await page.evaluate(()=>{
 window.historyRole='823';window.historyReads=0;
 window.portalInvestmentContext={getUser:()=>window.historyRole,database:{ref(path){
  const query={orderByChild(){return query},limitToLast(){return query},async once(){window.historyReads++;return {val:()=>path.startsWith('deviceAccess/')?'admin':{event:{actor:'device-test',at:1700000000000,changes:{sample:{before:{amount:1},after:{amount:2}}}}}};}};return query;
 }}};
});
await page.addScriptTag({content:fs.readFileSync('assets/hisab360-change-history.js','utf8')});
await page.locator('#adminPageSettings button').click();
if(await page.evaluate(()=>window.historyReads)!==0)throw Error('DSO read financial history');
await page.evaluate(()=>window.historyRole='admin');await page.locator('#adminPageSettings button').click();
await page.waitForFunction(()=>document.querySelectorAll('#adminPageSettings table tr').length===4);
if(await page.locator('#adminPageSettings table').innerText().then(x=>!x.includes('admin')||!x.includes('sample')))throw Error('History account or change keys missing');
console.log('Change history is read-only, restricted to Admin, and displays account/time/record keys.');

console.log(JSON.stringify(results));await browser.close();})().catch(e=>{console.error(e);process.exit(1)});
