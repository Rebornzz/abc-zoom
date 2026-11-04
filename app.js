import {checkStorage,rememberBooking,bookingRight} from './ownership.mjs';
import {t,language,locale,registerStatic,toggleLanguage} from './i18n.js';
import {occurrences} from './recurrence.mjs';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const cfg=window.ABC_CONFIG;
let scheduleMode='gantt';
registerStatic();
const savedTheme=localStorage.getItem('abc-theme');
document.documentElement.dataset.theme=savedTheme||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');
function updateTheme(){const dark=document.documentElement.dataset.theme==='dark';$('#toggle-theme').textContent=dark?'☀':'☾';$('#toggle-theme').setAttribute('aria-label',language==='en'?(dark?'Switch to light theme':'Switch to dark theme'):(dark?'เปลี่ยนเป็นธีมสว่าง':'เปลี่ยนเป็นธีมมืด'));$('#toggle-theme').setAttribute('aria-pressed',String(dark));}
updateTheme();
$('#toggle-theme').onclick=()=>{document.documentElement.dataset.theme=document.documentElement.dataset.theme==='dark'?'light':'dark';localStorage.setItem('abc-theme',document.documentElement.dataset.theme);updateTheme();};
$('#toggle-language').onclick=()=>{toggleLanguage();updateTheme();$$('#weekdays-input label').forEach((el,i)=>{el.lastChild.textContent=t(['อา.','จ.','อ.','พ.','พฤ.','ศ.','ส.'][i]);});render();load();if(!$('#admin-view').hidden)showAdmin();};
const today=()=>new Date(Date.now()+7*3600000).toISOString().slice(0,10);
let selected=today(),month=selected.slice(0,7),accounts=[],bookings=[],admin=false,logs=[],cancelId='',receipt=null,loadId=0;
let session;try{session=JSON.parse(sessionStorage.getItem('abc-admin')||'null');}catch{session=null;}
const fmt=(s,opts={day:'numeric',month:'long',year:'numeric'})=>new Intl.DateTimeFormat(locale(),opts).format(new Date(s+'T12:00:00+07:00'));
const active=a=>['ACTIVE','AVAILABLE','ใช้งาน','พร้อมใช้งาน'].includes(String(a.status).toUpperCase());
const branchName=a=>language==='en'&&a.branch==='บัญชี'?'Accountancy':t(a.branch||'');
const accountName=id=>{const a=accounts.find(a=>a.account_id===id);return a?(branchName(a)+' · '+a.account_id):id;};
const toast=s=>{$('#toast').textContent=t(s);$('#toast').hidden=false;setTimeout(()=>$('#toast').hidden=true,4500);};
function notice(s){$('#notice').textContent=t(s);$('#notice').hidden=!s;}
async function api(action,body={}){
 if(!cfg.connected)throw Error('ยังไม่ได้เชื่อมต่อฐานข้อมูล กรุณาติดต่อผู้ดูแล');
 if(session&&Date.now()>=session.expires_at*1000){session=null;sessionStorage.removeItem('abc-admin');admin=false;}
 const r=await fetch(cfg.supabaseUrl+'/functions/v1/zoom-portal',{method:'POST',headers:{'Content-Type':'application/json',...(cfg.publishableKey?{apikey:cfg.publishableKey}:{}),...(session?{Authorization:'Bearer '+session.access_token}:{})},body:JSON.stringify({action,...body})});
 const j=await r.json();if(!r.ok||j.error)throw Error(t(j.error||'ไม่สามารถเชื่อมต่อระบบได้'));return j.data;
}
function range(){const d=new Date(month+'-01T00:00:00Z');d.setUTCMonth(d.getUTCMonth()+1);d.setUTCDate(0);return {from:month+'-01',to:d.toISOString().slice(0,10)};}
async function load(){
 if(!cfg.connected){accounts=[['Z052','บัณฑิตศึกษา'],['Z053','บัณฑิตศึกษา'],['Z054','WUIC'],['Z055','บัญชี'],['Z056','Bus&Fin'],['Z057','เศรษฐศาสตร์'],['Z058','สำนักงานคณบดี']].map(([account_id,branch])=>({account_id,branch,status:'ACTIVE'}));bookings=[{booking_id:'DEMO-1',account_id:'Z055',booking_date:selected,start_time:'09:00',end_time:'11:00',topic:language==='en'?'Example: committee meeting':'ตัวอย่าง: ประชุมคณะกรรมการ',purpose:language==='en'?'Preview only':'ตัวอย่างเท่านั้น',full_name:language==='en'?'Example booker':'ผู้จองตัวอย่าง',status:'CONFIRMED'},{booking_id:'DEMO-2',account_id:'Z056',booking_date:selected,start_time:'13:00',end_time:'16:00',topic:language==='en'?'Example: teaching session':'ตัวอย่าง: การเรียนการสอน',purpose:'Demo',full_name:language==='en'?'Example booker':'ผู้จองตัวอย่าง',status:'CONFIRMED'}];notice(language==='en'?'PREVIEW ONLY — example data. The new separate database is not connected. Bookings cannot be saved.':'โหมดตัวอย่าง — ข้อมูลสมมติ ยังไม่เชื่อมฐานข้อมูลใหม่ ไม่สามารถบันทึกการจองได้');$('#connection-status').textContent=language==='en'?'Preview':'ตัวอย่าง';render();return;}
 const request=++loadId;
 $('#connection-status').textContent=t('กำลังอัปเดต');
 try{const data=await api('list',range());if(request!==loadId)return;accounts=data.accounts;bookings=data.bookings;admin=data.admin;notice(accounts.filter(active).length?'':'ยังไม่มีบัญชี Zoom ที่เปิดให้จอง กรุณาให้ผู้ดูแลเพิ่มบัญชีในหน้า Admin');$('#connection-status').textContent=t('เชื่อมต่อแล้ว');render();}
 catch(e){if(request!==loadId)return;$('#connection-status').textContent=t('เชื่อมต่อไม่ได้');notice(e.message+' · ข้อมูลบนหน้าจออาจยังไม่เป็นปัจจุบัน');render();}
}
function filtered(){const id=$('#filter-account').value;return bookings.filter(b=>!id||b.account_id===id);}
function card(b){return `<button class="booking-card ${b.status==='CANCELLED'?'cancelled':''}" data-booking="${esc(b.booking_id)}"><small>${esc(b.start_time)}–${esc(b.end_time)} ${language==='en'?'':'น.'} · ${esc(accountName(b.account_id))}</small><b>${esc(t(b.topic))}</b><p>${esc(t(b.full_name))}${b.status==='CANCELLED'?' · '+t('ยกเลิกแล้ว'):''}</p></button>`;}
function empty(s){return `<div class="empty"><div class="empty-icon">▦</div><b>${t(s)}</b>${t('เริ่มต้นการเชื่อมต่อครั้งใหม่ด้วยการจอง Zoom')}</div>`;}
function render(){
 const old=$('#filter-account').value;
 $('#filter-account').innerHTML='<option value="">'+t('ทุกบัญชี')+'</option>'+accounts.map(a=>`<option value="${esc(a.account_id)}">${esc(accountName(a.account_id))}</option>`).join('');$('#filter-account').value=accounts.some(a=>a.account_id===old)?old:'';
 $('#stat-total').textContent=bookings.filter(b=>b.status!=='CANCELLED').length;
 $('#stat-today').textContent=bookings.filter(b=>b.booking_date===today()&&b.status!=='CANCELLED').length;
 // Today count is only valid if the selected month is current.
 if(month!==today().slice(0,7))$('#stat-today').textContent='—';
 $('#stat-accounts').textContent=accounts.filter(active).length;
 $('#month-title').textContent=scheduleMode==='gantt'?fmt(selected,{day:'numeric',month:'short',year:'numeric'}):fmt(month+'-01',{month:'long',year:'numeric'});
 $('#prev').setAttribute('aria-label',language==='en'?(scheduleMode==='gantt'?'Previous day':'Previous month'):(scheduleMode==='gantt'?'วันก่อนหน้า':'เดือนก่อนหน้า'));$('#next').setAttribute('aria-label',language==='en'?(scheduleMode==='gantt'?'Next day':'Next month'):(scheduleMode==='gantt'?'วันถัดไป':'เดือนถัดไป'));
 $('#gantt-view').hidden=scheduleMode!=='gantt';$('#month-view').hidden=scheduleMode!=='month';$('#gantt-mode').classList.toggle('selected',scheduleMode==='gantt');$('#month-mode').classList.toggle('selected',scheduleMode==='month');$('#gantt-date').value=selected;
 renderGantt();
 const d=new Date(month+'-01T00:00:00Z');d.setUTCDate(1-d.getUTCDay());const events=filtered().filter(b=>b.status!=='CANCELLED');let html='';
 for(let i=0;i<42;i++,d.setUTCDate(d.getUTCDate()+1)){
  const date=d.toISOString().slice(0,10),bs=events.filter(b=>b.booking_date===date);
  html+=`<button class="day ${date===selected?'selected':''} ${date===today()?'is-today':''} ${date.slice(0,7)!==month?'other':''}" data-date="${date}" aria-label="${esc(fmt(date))} มี ${bs.length} การจอง"><span class="day-number">${d.getUTCDate()}</span>${bs.slice(0,2).map(b=>`<span class="event-chip">${esc(b.start_time)} ${esc(b.topic)}</span>`).join('')}${bs.length>2?`<span class="event-more">+${bs.length-2} รายการ</span>`:''}</button>`;
 }
 $('#calendar').innerHTML=html;renderDay();renderList();
}
function renderDay(){const bs=filtered().filter(b=>b.booking_date===selected&&b.status!=='CANCELLED');$('#selected-title').textContent=t(selected===today()?'การจองวันนี้':'การจองในวันที่เลือก');$('#selected-date').textContent=fmt(selected,{weekday:'long',day:'numeric',month:'long',year:'numeric'});$('#day-count').textContent=bs.length;$('#day-list').innerHTML=bs.length?bs.map(card).join(''):empty('วันนี้ยังว่างสำหรับคุณ');$('#day-book').textContent=(language==='en'?'＋ Book ':'＋ จองวันที่ ')+fmt(selected,{day:'numeric',month:'short'});$('#day-book').disabled=selected<today();}
function renderList(){const q=$('#search').value.trim().toLowerCase();const bs=filtered().filter(b=>(b.topic+' '+b.full_name).toLowerCase().includes(q));$('#all-list').innerHTML=bs.length?bs.map(b=>`<div><p class="muted">${esc(fmt(b.booking_date))}</p>${card(b)}</div>`).join(''):empty('ไม่พบรายการจอง');}
function show(view){for(const v of ['calendar','list','admin'])$('#'+v+'-view').hidden=v!==view;$$('.nav').forEach(b=>b.classList.toggle('active',b.id==='nav-'+view));if(view==='admin')showAdmin();}
const right=id=>bookingRight(localStorage,id);
const canManage=id=>admin||!!right(id);
function openBooking(repeat=false){
 const form=$('#booking-form');form.reset();form.elements.date.value=selected<today()?today():selected;form.elements.date.min=today();form.elements.until.value=form.elements.date.value;$('#booking-account').innerHTML='<option value="">'+t('เลือกบัญชี Zoom')+'</option>'+accounts.filter(active).map(a=>`<option value="${esc(a.account_id)}">${esc(accountName(a.account_id))}</option>`).join('');if(accounts.filter(active).length===1)form.elements.account_id.value=accounts.filter(active)[0].account_id;
 form.elements.repeat.value=repeat?'weekly':'none';$('#booking-error').textContent='';$('#submit-booking').disabled=!cfg.connected||!accounts.some(active);if(!accounts.some(active))$('#booking-error').textContent=t('ยังไม่มีบัญชีที่เปิดให้จอง กรุณาติดต่อผู้ดูแล');try{checkStorage(localStorage);}catch{$('#submit-booking').disabled=true;$('#booking-error').textContent=t('กรุณาอนุญาตให้เบราว์เซอร์บันทึกข้อมูลก่อนจอง หรือติดต่อผู้ดูแล');}updateRepeat();$('#booking-dialog').showModal();
}
function schedule(){const f=$('#booking-form').elements;return {date:f.date.value,start:f.start.value,end:f.end.value,repeat:f.repeat.value,interval:Number(f.interval.value),until:f.until.value||f.date.value,weekdays:$$('#weekdays-input input:checked').map(x=>Number(x.value))};}
function updateRepeat(){const s=schedule();$('#repeat-options').hidden=s.repeat==='none';$('#weekdays-input').hidden=s.repeat!=='weekly';$('#booking-form').elements.until.required=s.repeat!=='none';try{const dates=occurrences(s);$('#repeat-summary').textContent=`${language==='en'?'Total':'รวม'} ${dates.length} ${language==='en'?'occurrences':'ครั้ง'} · ${fmt(dates[0].date,{day:'numeric',month:'short'})} – ${fmt(dates.at(-1).date,{day:'numeric',month:'short'})}`;}catch(e){$('#repeat-summary').textContent=t(e.message);}}
let credentialId='';
function credentialsHtml(c){return c?'<h3>'+t('ข้อมูลเข้าสู่ระบบ Zoom')+'</h3><span>'+t('อีเมล')+'</span><code>'+esc(c.email)+'</code><span>'+t('รหัสผ่าน')+'</span><code>'+esc(c.password||t('ยังไม่ได้ตั้งรหัสผ่าน'))+'</code>':'';}
function openCredentials(id){credentialId=id;$('#detail-dialog').close();$('#credentials-form').reset();if(!canManage(id)){toast(t('กรุณาใช้เบราว์เซอร์ที่จอง หรือติดต่อผู้ดูแล'));return;}$('#credentials-error').textContent='';$('#credentials-result').hidden=true;$('#credentials-result').innerHTML='';$('#credentials-dialog').showModal();}
$('#credentials-form').onsubmit=e=>{e.preventDefault();submit(e.target,'#credentials-error',async()=>{const c=await api('credentials',{id:credentialId,code:right(credentialId)?.token||'',admin,name:admin?'Admin':right(credentialId)?.name||''});$('#credentials-result').innerHTML=credentialsHtml(c);$('#credentials-result').hidden=false;});};
$('#credentials-dialog').addEventListener('close',()=>{$('#credentials-result').innerHTML='';$('#credentials-form').reset();});
function detail(id){const b=bookings.find(x=>x.booking_id===id);if(!b)return;$('#booking-detail').innerHTML=[['หัวข้อ',b.topic],['ผู้จอง',b.full_name],['การใช้งาน',b.purpose],['บัญชี',accountName(b.account_id)],['วันที่',fmt(b.booking_date)],['เวลา',b.start_time+'–'+b.end_time+' น.'],['สถานะ',b.status==='CANCELLED'?'ยกเลิกแล้ว':'ยืนยันการจอง']].map(([k,v])=>`<div class="detail-row"><span>${t(k)}</span><b>${esc(t(v))}</b></div>`).join('')+(b.status!=='CANCELLED'&&canManage(id)?`<div class="dialog-actions" style="margin-top:20px"><button class="secondary" data-credentials="${esc(id)}">${t('ข้อมูลเข้าสู่ระบบ Zoom')}</button><button class="danger" data-cancel="${esc(id)}">${t('ยกเลิกการจอง')}</button></div>`:b.status!=='CANCELLED'?'<p class="form-notice">'+t('กรุณาใช้เบราว์เซอร์ที่จอง หรือติดต่อผู้ดูแล')+'</p>':'');$('#detail-dialog').showModal();}
function openCancel(id){if(!canManage(id)){toast(t('กรุณาใช้เบราว์เซอร์ที่จอง หรือติดต่อผู้ดูแล'));return;}cancelId=id;$('#detail-dialog').close();$('#cancel-form').reset();$('#cancel-error').textContent='';$('#cancel-form').elements.name.value=right(id)?.name||'';$('#cancel-dialog').showModal();}
async function submit(form,errorId,fn){const b=form.querySelector('button[type="submit"],button.primary:not([type]),button.danger');if(b)b.disabled=true;$(errorId).textContent='';try{await fn();}catch(e){$(errorId).textContent=t(e.message);}finally{if(b)b.disabled=false;}}
$('#booking-form').onsubmit=e=>{e.preventDefault();submit(e.target,'#booking-error',async()=>{
 const f=e.target.elements,s=schedule();occurrences(s);checkStorage(localStorage);const d=await api('book',{name:f.name.value,topic:f.topic.value,purpose:f.purpose.value,account_id:f.account_id.value,schedule:s});
 try{rememberBooking(localStorage,d,f.name.value);}catch{toast(t('บันทึกการจองแล้ว แต่เบราว์เซอร์จำสิทธิ์ไม่ได้ กรุณาติดต่อผู้ดูแลหากต้องการยกเลิก'));}
 receipt={ids:d.ids,series_id:d.series_id,count:d.count,credentials:d.credentials,name:f.name.value,topic:f.topic.value,schedule:s,account:accountName(f.account_id.value),created_at:new Date().toISOString()};$('#booking-dialog').close();$('#receipt-count').textContent=language==='en'?`${d.count} booking(s) confirmed`:`บันทึกการจองเรียบร้อย ${d.count} ครั้ง`;$('#receipt-credentials').innerHTML=credentialsHtml(d.credentials);$('#receipt-dialog').showModal();await load();
 });};
$('#cancel-form').onsubmit=e=>{e.preventDefault();submit(e.target,'#cancel-error',async()=>{const f=e.target.elements;const r=await api('cancel',{id:cancelId,name:f.name.value,reason:f.reason.value,code:right(cancelId)?.token||'',scope:f.scope.value,admin});$('#cancel-dialog').close();toast(language==='en'?`Cancelled ${r.count} booking(s)`:`ยกเลิก ${r.count} รายการแล้ว`);await load();});};
function download(name,data){const u=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json;charset=utf-8'}));const a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),5000);}
$('#download-receipt').onclick=()=>{if(receipt)download('zoom-receipt-'+receipt.series_id+'.json',receipt);};
async function showAdmin(){
 if(!cfg.connected){$('#login-form').hidden=true;$('#admin-content').hidden=false;$('#logout').hidden=true;$('#account-list').innerHTML=accounts.map(a=>'<button class="booking-card" data-demo-account="'+a.account_id+'"><b>'+esc(accountName(a.account_id))+'</b><p>'+a.account_id.toLowerCase().replace('z','zoom')+'@wu.ac.th</p></button>').join('');$('#account-list').onclick=e=>{const b=e.target.closest('[data-demo-account]');if(!b)return;const a=accounts.find(x=>x.account_id===b.dataset.demoAccount);const f=$('#account-form').elements;f.account_id.value=a.account_id;f.branch.value=a.branch;f.email.value=a.account_id.toLowerCase().replace('z','zoom')+'@wu.ac.th';f.status.value='ACTIVE';};$('#account-form').querySelector('button').disabled=true;$('#audit-list').innerHTML='<p class="muted">'+(language==='en'?'Preview only. Real activity records will appear after connecting your database.':'ตัวอย่างหลังบ้าน บันทึกและดูประวัติจริงได้หลังเชื่อมฐานข้อมูลใหม่')+'</p>';return;}

 $('#login-form').hidden=!!session;$('#admin-content').hidden=true;$('#logout').hidden=!session;
 if(!session)return;
 try{const d=await api('admin');admin=true;logs=d.logs;$('#admin-content').hidden=false;
 $('#account-list').innerHTML=d.accounts.map(a=>`<button class="booking-card" data-edit-account="${esc(a.account_id)}"><b>${esc(a.branch)}</b><p>${esc(a.email)} · ${esc(a.status)}</p></button>`).join('')||'<p class="muted">ยังไม่มีบัญชี เพิ่มบัญชีแรกด้านล่าง</p>';
 $('#account-list').onclick=e=>{const b=e.target.closest('[data-edit-account]');if(!b)return;const a=d.accounts.find(x=>x.account_id===b.dataset.editAccount);for(const k of ['account_id','branch','email','status'])$('#account-form').elements[k].value=a[k]||'';};
 $('#audit-list').innerHTML=logs.length?logs.map(l=>`<article class="log"><b>${esc(l.action)} · ${esc(l.actor_name||'ไม่ระบุชื่อ')}</b><p>${t(l.verified?'ยืนยันบัญชีผู้ดูแลแล้ว':'ชื่อที่กรอกเอง / ไม่ยืนยันตัวตน')}${l.actor_user_id?' · '+esc(l.actor_user_id):''}</p><p>${esc(l.booking_id||'')} ${esc(l.details?.reason||'')}</p><small>${new Date(l.created_at).toLocaleString(locale(),{timeZone:'Asia/Bangkok'})}</small></article>`).join(''):'<p class="muted">ยังไม่มีประวัติ</p>';
 }catch(e){notice(e.message);$('#login-form').hidden=false;}
}
$('#login-form').onsubmit=async e=>{e.preventDefault();const b=e.target.querySelector('button');b.disabled=true;try{
 if(!cfg.publishableKey)throw Error('ยังไม่ได้ตั้งค่า Supabase publishable key');
 const f=e.target.elements,r=await fetch(cfg.supabaseUrl+'/auth/v1/token?grant_type=password',{method:'POST',headers:{apikey:cfg.publishableKey,'Content-Type':'application/json'},body:JSON.stringify({email:f.email.value,password:f.password.value})}),d=await r.json();
 if(!r.ok)throw Error(t('อีเมลหรือรหัสผ่านไม่ถูกต้อง'));
 session=d;session.expires_at=d.expires_at||Math.floor(Date.now()/1000)+d.expires_in;
 await api('admin');sessionStorage.setItem('abc-admin',JSON.stringify({access_token:session.access_token,expires_at:session.expires_at}));f.password.value='';notice('');await showAdmin();await load();
 }catch(e){session=null;sessionStorage.removeItem('abc-admin');toast(e.message);}finally{b.disabled=false;}};
$('#logout').onclick=async()=>{bookings=[];$('#all-list').innerHTML='';$('#booking-detail').innerHTML='';const token=session?.access_token;session=null;admin=false;sessionStorage.removeItem('abc-admin');if(token)try{await fetch(cfg.supabaseUrl+'/auth/v1/logout',{method:'POST',headers:{apikey:cfg.publishableKey,Authorization:'Bearer '+token}});}catch{}await showAdmin();await load();toast('ออกจากระบบแล้ว');};
$('#account-form').onsubmit=async e=>{e.preventDefault();const b=e.target.querySelector('button');b.disabled=true;try{const account=Object.fromEntries(new FormData(e.target));await api('account',{account});e.target.reset();await showAdmin();await load();toast('บันทึกบัญชีแล้ว');}catch(e){toast(e.message);}finally{b.disabled=false;}};
$('#export-logs').onclick=()=>download('zoom-audit-'+today()+'.json',logs);
$('#weekdays-input').innerHTML=['อา.','จ.','อ.','พ.','พฤ.','ศ.','ส.'].map((d,i)=>`<label><input type="checkbox" value="${i}" ${i===new Date(selected).getUTCDay()?'checked':''}>${t(d)}</label>`).join('');
$('#booking-form').addEventListener('input',updateRepeat);
$('#filter-account').onchange=render;$('#search').oninput=renderList;
$('#new-booking').onclick=()=>openBooking();$('#day-book').onclick=()=>openBooking();$('#repeat-book').onclick=()=>openBooking(true);
$('#nav-calendar').onclick=()=>show('calendar');$('#nav-list').onclick=()=>show('list');$('#nav-admin').onclick=()=>show('admin');$('#admin-shortcut').onclick=()=>show('admin');$('#list-mode').onclick=()=>show('list');$('#month-mode').onclick=()=>{scheduleMode='month';show('calendar');render();};$('#gantt-mode').onclick=()=>{scheduleMode='gantt';show('calendar');render();};$('#gantt-date').onchange=e=>{if(!e.target.value)return;selected=e.target.value;month=selected.slice(0,7);load();};
function changeMonth(step){const d=new Date((scheduleMode==='gantt'?selected:month+'-01')+'T00:00:00Z');if(scheduleMode==='gantt')d.setUTCDate(d.getUTCDate()+step);else d.setUTCMonth(d.getUTCMonth()+step);selected=d.toISOString().slice(0,10);month=selected.slice(0,7);load();}
$('#prev').onclick=()=>changeMonth(-1);$('#next').onclick=()=>changeMonth(1);$('#today').onclick=()=>{selected=today();month=selected.slice(0,7);load();};
document.addEventListener('click',e=>{const c=e.target.closest('[data-close]');if(c){c.closest('dialog').close();return;}const date=e.target.closest('[data-date]');if(date){selected=date.dataset.date;if(selected.slice(0,7)!==month){month=selected.slice(0,7);load();}else render();}const b=e.target.closest('[data-booking]');if(b)detail(b.dataset.booking);const cred=e.target.closest('[data-credentials]');if(cred)openCredentials(cred.dataset.credentials);const cancel=e.target.closest('[data-cancel]');if(cancel)openCancel(cancel.dataset.cancel);});
$('#receipt-dialog').addEventListener('close',()=>{receipt=null;$('#receipt-credentials').innerHTML='';});
function renderGantt(){
 const id=$('#filter-account').value, aa=accounts.filter(a=>!id||a.account_id===id);
 const ticks=Array.from({length:13},(_,i)=>'<span style="left:'+i/12*100+'%">'+(i===0?'00:01':i===12?'23:59':String(i*2).padStart(2,'0')+':00')+'</span>').join('');
 let html='<div class="gantt-head"><div class="gantt-account-head">'+t('บัญชี Zoom')+'</div><div class="gantt-hours">'+ticks+'</div></div>';
 const minutes=s=>Number(s.slice(0,2))*60+Number(s.slice(3,5));
 for(const a of aa){const bs=bookings.filter(b=>b.account_id===a.account_id&&b.booking_date===selected);const current=new Date(Date.now()+7*3600000);const now=(current.getUTCHours()*60+current.getUTCMinutes())/1440*100;
 html+='<div class="gantt-row"><div class="gantt-account"><b>'+esc(a.account_id)+'</b><span>'+esc(branchName(a))+'</span><small class="'+(active(a)?'':'closed')+'">'+t(active(a)?'เปิดให้จอง':'บัญชีปิดให้จอง')+'</small></div><div class="gantt-track">'+(selected===today()?'<div class="now-line" style="left:'+now+'%" aria-label="'+(language==='en'?'Current time':'เวลาปัจจุบัน')+'"></div>':'')+bs.map(b=>'<button data-booking="'+esc(b.booking_id)+'" class="gantt-bar '+(b.status==='CANCELLED'?'is-cancelled':'')+'" style="left:'+minutes(b.start_time)/1440*100+'%;width:'+Math.max(.5,(minutes(b.end_time)-minutes(b.start_time))/1440*100)+'%" title="'+esc(b.start_time+'–'+b.end_time+' '+t(b.topic))+'" aria-label="'+esc(accountName(b.account_id)+' '+b.start_time+'–'+b.end_time+' '+t(b.status==='CANCELLED'?'ยกเลิกแล้ว':'ยืนยันแล้ว'))+'"><span>'+esc(b.start_time+'–'+b.end_time)+'</span></button>').join('')+'</div></div>';
 }
 $('#gantt').innerHTML=aa.length?html:empty('ยังไม่มีบัญชีที่เปิดให้จอง กรุณาติดต่อผู้ดูแล');
}
render();load();
