(function(){
'use strict';
const host=document.getElementById('adminPageSettings');if(!host)return;
const context=window.portalInvestmentContext;if(!context)return;
const button=document.createElement('button');button.type='button';button.className='btn';button.style.cssText='width:auto;margin:10px 0';button.textContent='পরিবর্তনের ইতিহাস';
const panel=document.createElement('section');panel.hidden=true;panel.style.cssText='padding:12px;border:1px solid #c8ddd5;border-radius:10px;margin:8px 0;overflow:auto;max-height:65vh';
host.append(button,panel);
const text=(tag,value)=>{const node=document.createElement(tag);node.textContent=String(value??'');return node;};
button.onclick=async()=>{
 if(context.getUser()!=='admin')return;
 panel.hidden=false;panel.replaceChildren(text('p','সাম্প্রতিক পরিবর্তন লোড হচ্ছে…'));button.disabled=true;
 try{
  const roots=['ledgerAccounts','investmentEntries','bankTrackerEntries'],rows=[];
  const snapshots=await Promise.all(roots.map(root=>context.database.ref('financialHistory/'+root).orderByChild('version').limitToLast(20).once('value')));
  snapshots.forEach((snapshot,i)=>{for(const item of Object.values(snapshot.val()||{}))rows.push({...item,root:roots[i]});});
  const actors=[...new Set(rows.map(row=>row.actor).filter(Boolean))],names={};
  await Promise.all(actors.map(async actor=>{try{const snapshot=await context.database.ref('deviceAccess/'+actor+'/userId').once('value');names[actor]=snapshot.val()||actor;}catch{names[actor]=actor;}}));
  if(context.getUser()!=='admin'){panel.replaceChildren();panel.hidden=true;return;}
  panel.replaceChildren(text('h3','সাম্প্রতিক হিসাব পরিবর্তন'),text('p','কোন অ্যাকাউন্ট থেকে পরিবর্তন হয়েছে তা দেখায়; অ্যাকাউন্টের নাম দিয়ে নির্দিষ্ট ব্যক্তির পরিচয় নিশ্চিত হয় না।'));
  const table=document.createElement('table'),head=document.createElement('tr');['সময়','অ্যাকাউন্ট','হিসাবের ধরন','পরিবর্তিত রেকর্ড'].forEach(label=>head.append(text('th',label)));table.append(head);
  for(const row of rows.sort((a,b)=>(Number(b.at)||0)-(Number(a.at)||0))){
   const line=document.createElement('tr'),keys=Object.keys(row.changes||{}),at=Number(row.at);
   [Number.isFinite(at)?new Date(at).toLocaleString('bn-BD',{timeZone:'Asia/Dhaka'}):'—',names[row.actor]||row.actor,({ledgerAccounts:'DSO হিসাব / Bank Slip',investmentEntries:'Working Capital / Expense',bankTrackerEntries:'Bank Tracker'})[row.root],keys.slice(0,8).join(', ')+(keys.length>8?' … ('+keys.length+')':'')].forEach(value=>line.append(text('td',value)));table.append(line);
  }
  panel.append(rows.length?table:text('p','পরিবর্তনের ইতিহাস পাওয়া যায়নি।'));
 }catch{panel.replaceChildren(text('p','ইতিহাস লোড হয়নি। Admin Login ও সংযোগ যাচাই করে আবার চেষ্টা করুন।'));}
 finally{button.disabled=false;}
};
})();
