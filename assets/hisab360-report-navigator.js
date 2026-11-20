/* Keep each report in one native two-axis scroll container. */
(()=>{
 'use strict';
 document.getElementById('financeReportNavigator')?.remove();
 const bound=new WeakSet(),chromeObserved=new WeakSet(),reportObserved=new Set();
 const setVar=(el,name,value)=>{if(el.style.getPropertyValue(name)!==value)el.style.setProperty(name,value);};
 const chromeResize=typeof ResizeObserver==='function'?new ResizeObserver(()=>schedule()):null;
 const reportResize=typeof ResizeObserver==='function'?new ResizeObserver(()=>schedule()):null;
 const visibleHeight=el=>el&&el.getClientRects().length?el.getBoundingClientRect().height:0;
 function syncChrome(){
  const root=document.documentElement,top=document.querySelector('#appContainer>.portal-sticky-top'),panel=document.getElementById('adminFilterPanel');
  const topHeight=Math.ceil(visibleHeight(top)),panelHeight=panel&&!panel.classList.contains('is-collapsed')?Math.ceil(visibleHeight(panel)):0;
  setVar(root,'--finance-topbar-height',topHeight+'px');let stack=topHeight+panelHeight;
  const heading=document.getElementById('investmentPageHeading');let parentStack=0,embedded=false;
  try{embedded=parent!==window&&parent.location.origin===location.origin;if(embedded)parentStack=parseFloat(parent.getComputedStyle(parent.document.documentElement).getPropertyValue('--finance-global-stack-height'))||0;}catch(_){}
  if(visibleHeight(heading)){
   if(embedded){if(!heading.classList.contains('finance-embedded-header'))heading.classList.add('finance-embedded-header');const old=parseFloat(heading.style.getPropertyValue('--finance-embedded-header-shift'))||0,original=heading.getBoundingClientRect().top-old+window.frameElement.getBoundingClientRect().top;setVar(heading,'--finance-embedded-header-shift',Math.max(0,parentStack-original)+'px');}
   stack+=Math.ceil(visibleHeight(heading))+8;
  }
  for(const el of [top,panel,heading])if(el&&!chromeObserved.has(el)){chromeObserved.add(el);chromeResize?.observe(el);}
  stack+=parentStack;setVar(root,'--finance-global-stack-height',stack+'px');return stack;
 }
 function fitRegion(el){
   if(!el.getBoundingClientRect().width)return;
   let frameTop=0,viewHeight=window.visualViewport?.height||innerHeight;
   try{if(parent!==window&&parent.location.origin===location.origin){frameTop=window.frameElement.getBoundingClientRect().top;viewHeight=parent.visualViewport?.height||parent.innerHeight;}}catch(_){}
   const rect=el.getBoundingClientRect();
   let flowBottom=rect.bottom;
   for(const child of document.body.children){const style=getComputedStyle(child);if(!child.getClientRects().length||['fixed','absolute'].includes(style.position))continue;flowBottom=Math.max(flowBottom,child.getBoundingClientRect().bottom+(parseFloat(style.marginBottom)||0));}
   const reserve=Math.max(12,flowBottom-rect.bottom+(parseFloat(getComputedStyle(document.body).paddingBottom)||0)+4);
   const available=Math.max(160,Math.floor(viewHeight-Math.max(0,rect.top+frameTop)-reserve));
   setVar(el,'--finance-region-height',available+'px');
 }
 function fitReport(el){
   fitRegion(el);
   for(const table of el.querySelectorAll('table')){
    const header=table.tHead;if(!header)continue;
    if(table.classList.contains('finance-short-report'))table.classList.remove('finance-short-report');
    setVar(table,'--finance-page-header-shift','0px');
    let offset=0;for(const row of header.rows){for(const cell of row.cells)setVar(cell,'--finance-header-row-top',offset+'px');offset+=row.getBoundingClientRect().height;}
   }
 }
 function bind(){
  const chromeHeight=syncChrome();
  for(const target of reportObserved)if(!target.isConnected){reportResize?.unobserve(target);reportObserved.delete(target);}
  for(const form of document.querySelectorAll('#content form,#bankContent form,#appContainer form,#dsoPageForm,#dsoPageSlip,#dsoPageSettings')){
   if(form.closest('[role=dialog],.modal-content,.cheque-dialog'))continue;
   if(form.parentElement.closest('.finance-form-scroll')){if(form.classList.contains('finance-form-scroll'))form.classList.remove('finance-form-scroll');continue;}
   if(!form.classList.contains('finance-form-scroll'))form.classList.add('finance-form-scroll');fitRegion(form);
   if(!reportObserved.has(form)){reportObserved.add(form);reportResize?.observe(form);}
  }
  for(const el of document.querySelectorAll('.table-container,.scroll')){
   if(!el.querySelector('table'))continue;
   for(const target of [el,...el.querySelectorAll('table')])if(!reportObserved.has(target)){reportObserved.add(target);reportResize?.observe(target);}
   fitReport(el);if(bound.has(el))continue;bound.add(el);
   el.classList.remove('finance-shared-scroll-target');el.classList.add('finance-native-table-scroll');
   if(!el.hasAttribute('tabindex'))el.tabIndex=0;
   if(!el.hasAttribute('aria-label'))el.setAttribute('aria-label','Report table — scroll for more rows and columns');
   let drag=null;
   const finish=()=>{if(drag){drag=null;el.classList.remove('finance-table-dragging');}};
   el.addEventListener('pointerdown',event=>{
    if(event.pointerType!=='mouse'||event.button!==0||event.target.closest('button,a,input,select,textarea,label,[role=button]')||!event.target.closest('table')||el.scrollWidth<=el.clientWidth+2)return;
    drag={id:event.pointerId,x:event.clientX,y:event.clientY,left:el.scrollLeft,started:false};
   });
   el.addEventListener('pointermove',event=>{
    if(!drag||event.pointerId!==drag.id)return;
    const distance=event.clientX-drag.x;
    if(!drag.started){if(Math.abs(distance)<6||Math.abs(distance)<Math.abs(event.clientY-drag.y))return;drag.started=true;el.setPointerCapture(event.pointerId);el.classList.add('finance-table-dragging');}
    event.preventDefault();el.scrollLeft=drag.left-distance;
   });
   el.addEventListener('pointerup',finish);el.addEventListener('pointercancel',finish);el.addEventListener('lostpointercapture',finish);
   el.addEventListener('pointerleave',()=>{if(drag&&!drag.started)finish();});
  }
 }
 let queued=false;
 const schedule=()=>{if(!queued){queued=true;requestAnimationFrame(()=>{queued=false;bind();});}};
 new MutationObserver(schedule).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden','class']});
 window.visualViewport?.addEventListener('resize',schedule);
 window.addEventListener('resize',schedule);window.addEventListener('scroll',schedule,{passive:true});document.fonts?.ready.then(schedule);
 try{if(parent!==window&&parent.location.origin===location.origin){parent.addEventListener('resize',schedule);parent.addEventListener('scroll',schedule,{passive:true});window.addEventListener('pagehide',()=>{parent.removeEventListener('resize',schedule);parent.removeEventListener('scroll',schedule);},{once:true});}}catch(_){}
 bind();
})();
