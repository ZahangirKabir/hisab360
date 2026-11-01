'use strict';
const admin=require('firebase-admin');
const fs=require('node:fs');
const crypto=require('node:crypto');
(async()=>{
 const projectId='collection-app-479e0',databaseURL='https://collection-app-479e0-default-rtdb.firebaseio.com';
 admin.initializeApp({credential:admin.credential.applicationDefault(),projectId,databaseURL});
 const db=admin.database(),auth=admin.auth();
 const metadata=(await db.ref('accountMeta').once('value')).val()||{};
 const admins=Object.entries(metadata).filter(([,m])=>m?.userId==='adminSaturia');
 if(admins.length!==1)throw Error('adminSaturia accountMeta পাওয়া যায়নি বা একাধিক আছে। কোনো পরিবর্তন করা হয়নি।');
 const [adminUid,adminMeta]=admins[0];
 const oldRules=await db.getRules();
 const rules=JSON.parse(oldRules);let changed=0;
 function walk(x){if(typeof x==='string'){
  let next=x;
  if(!next.includes("query.equalTo == '846'"))next=next.replaceAll("query.equalTo == '823'","query.equalTo == '823' || query.equalTo == '846'");
  if(!next.includes("$key.endsWith('_846')"))next=next.replaceAll("$key.endsWith('_823')","$key.endsWith('_823') || $key.endsWith('_846')");
  if(!next.includes("$user == '846'"))next=next.replaceAll("$user == '823'","$user == '823' || $user == '846'");
  if(next!==x)changed++;return next;
 }if(Array.isArray(x))return x.map(walk);if(x&&typeof x==='object')return Object.fromEntries(Object.entries(x).map(([k,v])=>[k,walk(v)]));return x;}
 const nextRules=walk(rules);
 const backup='DSO846_SETUP_BACKUP_'+Date.now()+'.json';
 fs.writeFileSync(backup,JSON.stringify({projectId,accountMeta:metadata,rules},null,2),{mode:0o600});
 const email='portal-846@collection-app-479e0.invalid';let user,tempPassword='';
 try{user=await auth.getUserByEmail(email);}catch(error){if(error.code!=='auth/user-not-found')throw error;tempPassword=crypto.randomBytes(12).toString('base64url');fs.writeFileSync('DSO846_INITIAL_PASSWORD.txt',tempPassword+'\n',{mode:0o600});console.log('Temporary password saved privately in DSO846_INITIAL_PASSWORD.txt');user=await auth.createUser({email,password:tempPassword,displayName:'DSO 846'});}
 const prior=metadata[user.uid];
 if(prior?.userId&&prior.userId!=='846')throw Error('Existing account identity mismatch.');
 if(user.disabled||prior?.enabled===false)throw Error('846 account blocked আছে। Admin দিয়ে unblock করুন। Existing password পরিবর্তন হয়নি।');
 if(changed)await db.setRules(JSON.stringify(nextRules));
 const record={...(prior||{}),userId:'846',role:'dso',enabled:true,assignedAdmin:'adminSaturia',forceChange:tempPassword?true:prior?.forceChange!==false};
 await db.ref().update({['accountMeta/'+user.uid]:record,['accountMeta/'+adminUid+'/allowedDso/846']:true});
 const saved=(await db.ref('accountMeta/'+user.uid).once('value')).val();
 const allowed=(await db.ref('accountMeta/'+adminUid+'/allowedDso/846').once('value')).val();
 if(saved?.userId!=='846'||allowed!==true)throw Error('Setup verification failed.');
 console.log('SUCCESS: DSO 846 added under adminSaturia.');
 console.log('User ID: 846');
 if(tempPassword)console.log('Temporary password: '+tempPassword+'\nFirst login: password change required.');
 else console.log('Existing password unchanged.');
 console.log('New device: approve through Device Permission.');
 console.log('Backup: '+backup);
})().catch(error=>{console.error('Setup incomplete: '+error.message);process.exitCode=1;});
