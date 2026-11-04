export function occurrences(input, now = new Date()) {
 const {date,start,end,repeat='none',interval=1,until=date,weekdays=[]}=input;
 const validDate=s=>/^\d{4}-\d{2}-\d{2}$/.test(s)&&!isNaN(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s;
 if(!validDate(date)||!validDate(until)) throw Error('วันที่ไม่ถูกต้อง');
 if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(start)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(end)||start<'00:01'||end>'23:59'||end<=start) throw Error('เวลาใช้งานต้องอยู่ระหว่าง 00:01–23:59 และเวลาสิ้นสุดต้องหลังเวลาเริ่ม');
 if(!['none','daily','weekly','monthly'].includes(repeat)||!Number.isInteger(interval)||interval<1||interval>12) throw Error('รูปแบบการจองซ้ำไม่ถูกต้อง');
 const first=new Date(date+'T00:00:00Z'),last=new Date((repeat==='none'?date:until)+'T00:00:00Z');
 const today=new Date(now.getTime()+7*3600000).toISOString().slice(0,10);
 if(date<today||first>last||last-first>180*86400000) throw Error('จองตั้งแต่วันนี้ และจองซ้ำได้ไม่เกิน 180 วัน');
 if(repeat==='weekly'&&(!Array.isArray(weekdays)||!weekdays.length||weekdays.some(d=>!Number.isInteger(d)||d<0||d>6))) throw Error('กรุณาเลือกวันในสัปดาห์');
 const rows=[];
 for(let d=new Date(first);d<=last;d.setUTCDate(d.getUTCDate()+1)) {
  const days=Math.round((d-first)/86400000), months=(d.getUTCFullYear()-first.getUTCFullYear())*12+d.getUTCMonth()-first.getUTCMonth();
  const match=repeat==='none'||(repeat==='daily'&&days%interval===0)||(repeat==='weekly'&&Math.floor(days/7)%interval===0&&weekdays.includes(d.getUTCDay()))||(repeat==='monthly'&&months%interval===0&&d.getUTCDate()===first.getUTCDate());
  if(match) {
   const day=d.toISOString().slice(0,10), starts_at=day+'T'+start+':00+07:00';
   if(Date.parse(starts_at)<=now.getTime()) throw Error('เวลาเริ่มจองต้องอยู่ในอนาคต');
   rows.push({date:day,start,end,starts_at,ends_at:day+'T'+end+':00+07:00'});
  }
  if(rows.length>100)throw Error('จองซ้ำได้สูงสุด 100 ครั้งต่อชุด');
 }
 if(!rows.length)throw Error('ไม่พบวันที่ตรงกับเงื่อนไข');
 return rows;
}
