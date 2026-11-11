'use strict';
const clone=x=>JSON.parse(JSON.stringify(x));
function build(source,{enforce=true}={}){
 const result=clone(source),rules=result.rules;if(!rules||rules['.write']===true)throw Error('Unexpected root permissions');
 const targets=['ledgerAccounts','investmentEntries','bankTrackerEntries'];
 const expr=value=>value===undefined||value===false?'false':value===true?'true':String(value);
 const admin=expr(rules.bankTrackerEntries?.['.write']);if(admin==='false'||admin==='true'||admin.includes('$'))throw Error('Unexpected bank permissions');
 const approved="auth != null && root.child('deviceAccess').child(auth.uid).child('status').val() == 'approved' && root.child('deviceSessions').child(auth.uid).child('active').val() == true && root.child('deviceSessions').child(auth.uid).child('expiresAt').val() > now && root.child('accountMeta').child(root.child('deviceAccess').child(auth.uid).child('credentialUid').val()).child('enabled').val() == true";
 const nextVersion=root=>"(root.child('financialRevisions/"+root+"/version').isNumber() ? root.child('financialRevisions/"+root+"/version').val() + 1 : 1)";
 rules.financialHistory={'.read':admin,'.write':false};rules.financialRevisions={'.read':approved,'.write':false};
 for(const root of targets){
  const next=nextVersion(root),future="newData.parent().parent().child('financialHistory/"+root+"').child(newData.child('_auditId').val())";
  rules.financialHistory[root]={'.write':false,'$audit':{'.write':approved+" && !data.exists() && newData.exists() && newData.child('actor').val() == auth.uid && newData.child('version').val() == "+next+" && newData.parent().parent().parent().child('financialRevisions/"+root+"/version').val() == newData.child('version').val() && newData.parent().parent().parent().child('financialRevisions/"+root+"/auditId').val() == $audit",'.validate':"newData.hasChildren(['actor','version','at','changes']) && newData.child('at').isNumber() && newData.child('changes').hasChildren()"}};
  rules.financialRevisions[root]={'.write':approved+" && newData.hasChildren(['version','auditId']) && newData.child('version').isNumber() && newData.child('version').val() == "+next+" && newData.parent().parent().child('financialHistory/"+root+"').child(newData.child('auditId').val()).child('actor').val() == auth.uid && newData.parent().parent().child('financialHistory/"+root+"').child(newData.child('auditId').val()).child('version').val() == newData.child('version').val()"};
  if(!enforce)continue;
  const section=rules[root];if(!section)throw Error('Financial root absent');const wildcards=Object.keys(section).filter(k=>k.startsWith('$'));if(wildcards.length>1)throw Error('Unexpected financial schema');const wildcard=wildcards[0]||'$record',record=section[wildcard]||{};
  const nestedWrite=node=>Object.entries(node).some(([key,value])=>key==='.write'||(value&&typeof value==='object'&&nestedWrite(value)));
  for(const [key,value]of Object.entries(record))if(key!=='.write'&&value&&typeof value==='object'&&nestedWrite(value))throw Error('Unexpected descendant write grant');
  const allowed='('+expr(section['.write'])+') || ('+expr(record['.write'])+')';
  section['.write']=false;record['.write']='('+allowed+") && newData.exists() && newData.child('_writeRevision').val() == "+next+" && newData.parent().parent().child('financialRevisions/"+root+"/version').val() == newData.child('_writeRevision').val() && newData.parent().parent().child('financialRevisions/"+root+"/auditId').val() == newData.child('_auditId').val() && "+future+".child('actor').val() == auth.uid && "+future+".child('changes').child("+wildcard+").child('after/_writeRevision').val() == newData.child('_writeRevision').val()";section[wildcard]=record;
 }
 if(enforce){
  if(rules.slipImages){const section=rules.slipImages,wildcard=Object.keys(section).find(key=>key.startsWith('$'))||'$image',record=section[wildcard]||{},allowed='('+expr(section['.write'])+') || ('+expr(record['.write'])+')';section['.write']=false;record['.write']='('+allowed+") && newData.exists() && (!data.exists() || newData.child('data').val() == data.child('data').val())";section[wildcard]=record;}
  const freeze=node=>{if(!node||typeof node!=='object')return;node['.write']=false;for(const [key,value]of Object.entries(node))if(!key.startsWith('.'))freeze(value);};
  for(const archived of ['collections','bankSlipRequests'])if(rules[archived])freeze(rules[archived]);
 }
 return result;
}
module.exports={build};
