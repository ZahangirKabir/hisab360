/* Keep each report in one native two-axis scroll container. */
(()=>{
 'use strict';
 document.getElementById('financeReportNavigator')?.remove();
 const bound=new WeakSet();
 function bind(){
  for(const el of document.querySelectorAll('.table-container,.scroll')){
   if(bound.has(el)||!el.querySelector('table'))continue;bound.add(el);
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
 bind();
})();
