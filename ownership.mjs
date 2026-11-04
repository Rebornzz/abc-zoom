const KEY='abc-booking-rights-v1';
export function readRights(storage){try{const x=JSON.parse(storage.getItem(KEY)||'{}');return x&&typeof x==='object'&&!Array.isArray(x)?x:{};}catch{return {};}}
export function checkStorage(storage){const key=KEY+'-check';storage.setItem(key,'1');storage.removeItem(key);}
export function rememberBooking(storage,result,name){
 if(!Array.isArray(result.ids)||typeof result.code!=='string'||!result.code)throw Error('Missing booking permission');
 const rights=readRights(storage);
 for(const id of result.ids)rights[id]={token:result.code,name,seriesId:result.series_id};
 storage.setItem(KEY,JSON.stringify(rights));
}
export function bookingRight(storage,id){const r=readRights(storage)[id];return r&&typeof r.token==='string'&&r.token? r:null;}
