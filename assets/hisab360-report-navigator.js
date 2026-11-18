/* Keep each report in one native two-axis scroll container. */
(()=>{
 'use strict';
 document.getElementById('financeReportNavigator')?.remove();
 const bound=new WeakSet();
 function fitReport(el){
   const rect=el.getBoundingClientRect();if(!rect.width||!rect.height)return;
   let top=rect.top,view=innerHeight;try{if(parent!==window&&parent.location.origin===location.origin){top+=window.frameElement.getBoundingClientRect().top;view=parent.innerHeight;}}catch(_){}
   const available=Math.max(120,Math.floor(view-Math.max(0,top)-14));
   if(el.style.getPropertyValue('--finance-report-available-height')!==available+'px')el.style.setProperty('--finance-report-available-height',available+'px');
   for(const table of el.querySelectorAll('table')){let offset=0;for(const row of table.tHead?.rows||[]){for(const cell of row.cells)if(cell.style.getPropertyValue('--finance-header-row-top')!==offset+'px')cell.style.setProperty('--finance-header-row-top',offset+'px');offset+=row.getBoundingClientRect().height;}}
 }
 function bind(){
  for(const el of document.querySelectorAll('.table-container,.scroll')){
   if(!el.querySelector('table'))continue;fitReport(el);if(bound.has(el))continue;bound.add(el);
   el.classList.remove('finance-shared-scroll-target');el.classList.add('finance-native-table-scroll');
   if(!el.hasAttribute('tabindex'))el.tabIndex=0;
   if(!el.hasAttribute('aria-label'))el.setAttribute('aria-label','Report table — scroll up, down, left or right');
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
 new MutationObserver(schedule).observe(document.body,{subtree:true,childList:true});
 window.addEventListener('resize',schedule);window.addEventListener('scroll',schedule,{passive:true});document.fonts?.ready.then(schedule);
 try{if(parent!==window&&parent.location.origin===location.origin){parent.addEventListener('resize',schedule);parent.addEventListener('scroll',schedule,{passive:true});window.addEventListener('pagehide',()=>{parent.removeEventListener('resize',schedule);parent.removeEventListener('scroll',schedule);},{once:true});}}catch(_){}
 bind();
})();
