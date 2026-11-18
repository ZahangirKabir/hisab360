/* One native horizontal scrollbar follows the visible report, including Investment. */
(()=>{
 'use strict';
 let host=window;try{if(parent!==window&&parent.location.origin===location.origin)host=parent;}catch(_){}
 if(host!==window){host.dispatchEvent(new Event('finance-report-layout'));return;}
 if(window.financeReportNavigator)return;window.financeReportNavigator=true;
 const bar=document.createElement('div');bar.id='financeReportNavigator';bar.hidden=true;
 const track=document.createElement('div');track.className='finance-report-track';track.tabIndex=0;track.setAttribute('role','region');track.setAttribute('aria-label','Scroll visible report left or right');
 const size=document.createElement('div');track.append(size);bar.append(track);document.body.append(bar);
 let active=null,preferred=null,queued=false,copying=false;const bound=new WeakSet();
 const visible=r=>r.width>0&&r.height>0&&r.bottom>0&&r.top<innerHeight-28;
 function scan(doc,offset={left:0,top:0},out=[]){
  for(const el of doc.querySelectorAll('.table-container,.scroll')){
   if(el.scrollWidth<=el.clientWidth+2||!el.querySelector('table'))continue;
   const r=el.getBoundingClientRect(),rect={left:r.left+offset.left,top:r.top+offset.top,width:r.width,height:r.height,bottom:r.bottom+offset.top};
   if(!visible(rect))continue;
   if(!bound.has(el)){bound.add(el);el.addEventListener('pointerenter',()=>{preferred=el;schedule();},{passive:true});el.addEventListener('focusin',()=>{preferred=el;schedule();});el.addEventListener('scroll',()=>{if(el===active&&!copying)track.scrollLeft=el.scrollLeft;},{passive:true});}
   out.push({el,rect});
  }
  for(const frame of doc.querySelectorAll('iframe')){const r=frame.getBoundingClientRect();if(!visible(r))continue;try{if(frame.contentDocument?.body)scan(frame.contentDocument,{left:offset.left+r.left,top:offset.top+r.top},out);}catch(_){} }
  return out;
 }
 function update(){queued=false;const entries=scan(document),chosen=entries.find(x=>x.el===preferred)||entries.sort((a,b)=>Math.max(0,a.rect.top)-Math.max(0,b.rect.top))[0];
  if(!chosen){bar.hidden=true;active=null;return;}
  active=chosen.el;if(!active.classList.contains('finance-shared-scroll-target'))active.classList.add('finance-shared-scroll-target');
  const left=Math.max(4,chosen.rect.left),width=Math.max(0,Math.min(innerWidth-4,chosen.rect.left+chosen.rect.width)-left);
  if(width<50){bar.hidden=true;return;}
  bar.hidden=false;bar.style.left=left+'px';bar.style.width=width+'px';
  const range=active.scrollWidth-active.clientWidth;size.style.width=(track.clientWidth+range)+'px';track.scrollLeft=active.scrollLeft;
 }
 function schedule(){if(!queued){queued=true;requestAnimationFrame(update);}}
 track.addEventListener('scroll',()=>{if(active){copying=true;active.scrollLeft=track.scrollLeft;copying=false;}},{passive:true});
 window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule);window.addEventListener('finance-report-layout',schedule);
 const observe=doc=>{if(bound.has(doc))return;bound.add(doc);new MutationObserver(records=>{if(records.some(x=>!bar.contains(x.target)))schedule();}).observe(doc.body,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden','style','class']});doc.addEventListener('scroll',schedule,{capture:true,passive:true});for(const frame of doc.querySelectorAll('iframe')){frame.addEventListener('load',()=>{try{observe(frame.contentDocument);schedule();}catch(_){}});try{if(frame.contentDocument?.body)observe(frame.contentDocument);}catch(_){}}};
 observe(document);schedule();
})();
