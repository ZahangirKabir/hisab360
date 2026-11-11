(function(global){'use strict';
 const roots=new Set(['ledgerAccounts','investmentEntries','bankTrackerEntries']);
 const clone=value=>value==null?value:JSON.parse(JSON.stringify(value));
 const stable=value=>Array.isArray(value)?'['+value.map(stable).join(',')+']':value&&typeof value==='object'?'{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+stable(value[k])).join(',')+'}':JSON.stringify(value);
 const clean=value=>{const result=clone(value);if(result&&typeof result==='object'){delete result._writeRevision;delete result._auditId;}return result;};
 const snapshot=(key,value)=>({key,val:()=>clone(value),exists:()=>value!=null,child(path){let result=value;for(const part of path.split('/'))result=result?.[part];return snapshot(path.split('/').at(-1),result??null);}});
 const token=()=>Array.from(global.crypto.getRandomValues(new Uint8Array(16))).map(x=>x.toString(16).padStart(2,'0')).join('');
 function create(getDatabase,getActor){
  const database=()=>getDatabase(),read=async path=>{const ref=database().ref(path);return (await (typeof ref.get==='function'?ref.get():ref.once('value'))).val();};
  async function commit(path,modify){
   const parts=path.split('/').filter(Boolean),root=parts[0];if(!roots.has(root)||parts.length>2)throw Error('সুরক্ষিত হিসাবের পথ সঠিক নয়।');
   for(let attempt=0;attempt<8;attempt++){
    const actor=getActor();if(!actor)throw Error('আবার Login করুন।');
    const first=await read('financialRevisions/'+root),current=await read(path),last=await read('financialRevisions/'+root);
    if(stable(first)!==stable(last))continue;
    const changed=modify(clone(current));if(changed===undefined)return {committed:false,snapshot:snapshot(parts.at(-1),current)};
    if(changed===null)throw Error('সেভ করা আর্থিক হিসাব মোছা বন্ধ আছে।');
    if(!changed||typeof changed!=='object'||Array.isArray(changed))throw Error('হিসাবের গঠন সঠিক নয়।');
    const before=parts.length===1?current||{}:{[parts[1]]:current},after=parts.length===1?changed:{[parts[1]]:changed};
    for(const key of Object.keys(before))if(!Object.hasOwn(after,key)||after[key]===null)throw Error('পুরোনো হিসাব বা তারিখ সরানো বন্ধ আছে। একই তারিখে সংশোধন করুন।');
    const changes={},patch={},version=(Number(last?.version)||0)+1,id=token();
    for(const [key,value]of Object.entries(after)){
     if(!value||typeof value!=='object'||Array.isArray(value))throw Error('হিসাবের গঠন সঠিক নয়।');
     if(stable(clean(before[key]))===stable(clean(value)))continue;
     const next={...clone(value),_writeRevision:version,_auditId:id};patch[root+'/'+key]=next;changes[key]={before:before[key]??null,after:next};
    }
    if(!Object.keys(changes).length)return {committed:true,snapshot:snapshot(parts.at(-1),current)};
    patch['financialRevisions/'+root]={version,auditId:id};
    patch['financialHistory/'+root+'/'+id]={version,actor,at:{'.sv':'timestamp'},changes};
    if(new TextEncoder().encode(JSON.stringify(patch)).byteLength>8*1024*1024)throw Error('সুরক্ষিত পরিবর্তন অনেক বড়। কোনো হিসাব সেভ হয়নি।');
    if(getActor()!==actor)throw Error('Login session বদলেছে। আবার চেষ্টা করুন।');
    try{
     await database().ref().update(patch);
     const next=parts.length===1?{...clone(current||{}),...Object.fromEntries(Object.keys(changes).map(k=>[k,changes[k].after]))}:changes[parts[1]].after;
     return {committed:true,snapshot:snapshot(parts.at(-1),next)};
    }catch(error){
     const revision=await read('financialRevisions/'+root).catch(()=>last);
     if(stable(revision)!==stable(last)){await new Promise(resolve=>setTimeout(resolve,30+attempt*35));continue;}
     throw error;
    }
   }
   throw Error('একই সময়ে অন্য হিসাব সেভ হয়েছে। নতুন তথ্য দেখে আবার Submit করুন।');
  }
  function ref(path=''){
   const target=path?database().ref(path):database().ref(),parts=String(path).split('/').filter(Boolean),protectedPath=roots.has(parts[0]);
   return new Proxy(target,{get(object,key){
    if(key==='child')return child=>ref([path,child].filter(Boolean).join('/'));
    if(protectedPath&&key==='remove')return async()=>{throw Error('আর্থিক হিসাব মোছা বন্ধ আছে।');};
    if(protectedPath&&key==='transaction')return async(update,complete)=>{try{const result=await commit(parts.join('/'),update);complete?.(null,result.committed,result.snapshot);return result;}catch(error){complete?.(error,false,null);throw error;}};
    if(protectedPath&&key==='set')return value=>commit(parts.join('/'),()=>value);
    if(protectedPath&&key==='update')return values=>commit(parts.join('/'),current=>{const next=clone(current)||{};for(const [name,value]of Object.entries(values)){if(value===null)throw Error('আর্থিক হিসাব মোছা বন্ধ আছে।');let row=next;const names=name.split('/');for(const part of names.slice(0,-1))row=row[part]||(row[part]={});row[names.at(-1)]=value;}return next;});
    const value=Reflect.get(object,key,object);return typeof value==='function'?value.bind(object):value;
   }});
  }
  return {ref};
 }
 global.Hisab360ProtectedWrites={create,stable};
})(typeof window!=='undefined'?window:globalThis);
