
(function(){
 const initialGroups=Object.fromEntries(Object.entries(SUB_ADMIN_GROUPS).map(([id,ids])=>[id,[...ids]]));
 function applyRegistry(value){
  const previous=JSON.stringify(portalDsoRegistry);portalDsoRegistry=value&&typeof value==='object'?value:{};
  for(const [id,ids]of Object.entries(initialGroups))SUB_ADMIN_GROUPS[id]=new Set(ids);
  for(const [id,record]of Object.entries(portalDsoRegistry)){
   if(!/^\d{3,6}$/.test(id)||!Object.hasOwn(SUB_ADMIN_GROUPS,record?.assignedAdmin))continue;
   for(const group of Object.values(SUB_ADMIN_GROUPS))group.delete(id);
   if(record.enabled!==false)SUB_ADMIN_GROUPS[record.assignedAdmin].add(id);
  }
  if(previous!==JSON.stringify(portalDsoRegistry)&&currentUser){
   try{populateDsoDropdown({});}catch(_){}
   const end=document.getElementById('filterDsoEnd');if(end&&Number(end.value)<Number(portalDsoIds().at(-1)))end.value=portalDsoIds().at(-1);
   if(isGroupAdmin(currentUser))refreshCurrentData().catch(()=>{});
  }
 }
 try{firebase.app().database().ref('appConfig/dsoAssignments').on('value',snapshot=>applyRegistry(snapshot.val()),()=>{});}catch(_){}
 window.changePortalNewUserRole=function(){const viewer=document.getElementById('newPortalUserRole').value==='report_viewer';document.getElementById('newUserAssignedAdminField').hidden=viewer;const input=document.getElementById('newDsoUserId');input.removeAttribute('pattern');input.inputMode=viewer?'text':'numeric';if(viewer&&/^\d+$/.test(input.value))input.value='';};
 window.createPortalDsoUser=async function(event){
  event.preventDefault();if(currentUser!=='admin')return;
  const form=document.getElementById('portalNewUserForm'),button=document.getElementById('createDsoUserButton'),status=document.getElementById('newDsoUserStatus'),help=document.getElementById('userManagementRulesHelp');
  if(button.disabled||!form.reportValidity())return;
  const role=document.getElementById('newPortalUserRole').value,viewer=role==='report_viewer',id=document.getElementById('newDsoUserId').value.trim().toLowerCase(),assignedAdmin=document.getElementById('newDsoAssignedAdmin').value,password=document.getElementById('newDsoTemporaryPassword').value,confirmPassword=document.getElementById('newDsoConfirmPassword').value,ownPassword=document.getElementById('newDsoAdminPassword').value;
  status.textContent='';help.hidden=true;
  if(viewer?!/^[a-z][a-z0-9_]{2,31}$/.test(id)||['admin',...Object.keys(SUB_ADMIN_GROUPS).map(x=>x.toLowerCase())].includes(id):!/^\d{3,6}$/.test(id)||Number(id)<801||String(Number(id))!==id){status.textContent='সঠিক User ID দিন। DSO-এর জন্য ৮০১ বা বেশি সংখ্যা; Report Viewer-এর জন্য selim-এর মতো নাম দিন।';return;}
  if(!viewer&&!Object.hasOwn(SUB_ADMIN_GROUPS,assignedAdmin)){status.textContent='Assigned Admin নির্বাচন করুন।';return;}
  if(password.length<8||password.length>128||password.trim()!==password||password!==confirmPassword){status.textContent='কমপক্ষে ৮ অক্ষরের একই password দুবার দিন; শুরু/শেষে space নয়।';return;}
  button.disabled=true;status.textContent='Admin যাচাই হচ্ছে…';
  let secondary=null,createdUser=null,saved=false;
  try{
   if(!credentialAuth.currentUser||credentialAuth.currentUser.email!==accountEmail('admin')||!portalFinancialApp?.auth().currentUser)throw Error('মূল Admin দিয়ে আবার login করুন।');
   await credentialAuth.currentUser.reauthenticateWithCredential(firebase.auth.EmailAuthProvider.credential(accountEmail('admin'),ownPassword));
   const financialDb=portalFinancialApp.database(),snapshot=await financialDb.ref('accountMeta').once('value'),metadata=snapshot.val()||{};
   if(currentUser!=='admin')throw Error('Admin login প্রয়োজন।');
   if(Object.values(metadata).some(row=>String(row?.userId)===id))throw Error('এই User ID আগে থেকেই আছে।');
   const assigned=Object.entries(metadata).filter(([,row])=>row?.userId===assignedAdmin&&row.enabled===true);if(!viewer&&assigned.length!==1)throw Error('Assigned Admin-এর সক্রিয় account পাওয়া যায়নি।');
   status.textContent='নতুন DSO তৈরি হচ্ছে…';
   const suffix=crypto.getRandomValues(new Uint32Array(2)).join('-');secondary=firebase.initializeApp(firebaseConfig,'portal-create-user-'+suffix);
   await secondary.auth().setPersistence(firebase.auth.Auth.Persistence.NONE);
   const result=await secondary.auth().createUserWithEmailAndPassword(accountEmail(id),password);createdUser=result.user;
   if(currentUser!=='admin')throw Error('Admin login প্রয়োজন।');
   const assignedUid=assigned[0]?.[0],timestamp=firebase.database.ServerValue.TIMESTAMP,updates={};
   updates['accountMeta/'+createdUser.uid]={userId:id,role,enabled:true,forceChange:true,...(!viewer?{assignedAdmin}:{}),createdBy:'admin',createdAt:timestamp};
   if(!viewer){updates['accountMeta/'+assignedUid+'/allowedDso/'+id]=true;
   updates['appConfig/dsoAssignments/'+id]={assignedAdmin,enabled:true};}
   await financialDb.ref().update(updates);saved=true;
   document.getElementById('newDsoTemporaryPassword').value='';document.getElementById('newDsoConfirmPassword').value='';
   status.textContent='✅ '+(viewer?'Report Viewer':'DSO')+' '+id+' তৈরি হয়েছে।'+(viewer?'':'\nAssigned Admin: '+assignedAdmin)+'\nপ্রথম login-এ password পরিবর্তন করতে হবে। নতুন device হলে Device Permission দিন।';
   document.getElementById('newDsoUserId').value=viewer?'':String(Number(id)+1);
  }catch(error){
   if(createdUser&&!saved){try{await createdUser.delete();}catch(_){status.textContent='অ্যাকাউন্টের setup অসম্পূর্ণ। একই ID আবার তৈরির আগে Admin-কে দিয়ে যাচাই করুন।\n';}}
   const denied=/permission.denied|PERMISSION_DENIED/i.test(String(error.code||'')+' '+String(error.message||''));
   if(denied){help.hidden=false;status.textContent+='Firebase Rules একবার আপডেট করুন। তারপর আবার Create User চাপুন।';}
   else if(error.code==='auth/email-already-in-use')status.textContent+='এই User ID-এর login account আগে থেকেই আছে। আগের account ব্যবহার করুন।';
   else status.textContent+=error.code?.startsWith('auth/')?loginErrorMessage(error):error.message;
  }finally{
   document.getElementById('newDsoAdminPassword').value='';button.disabled=false;
   if(secondary){try{await secondary.auth().signOut();await secondary.delete();}catch(_){}}
  }
 };
})();
