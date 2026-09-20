import {validateCatalog} from './places-model.mjs';

// Compare adopted decimal source values exactly; UI rounding never determines ties.
function scaledInteger(value,decimals) {
  if(typeof value!=='string'||!/^\d+(?:\.\d+)?$/.test(value))throw new Error('数値の形式を確認してください。');
  const [whole,fraction='']=value.split('.');
  if(fraction.length>decimals)throw new Error('出典の精度と数値が一致しません。');
  return BigInt(whole)*10n**BigInt(decimals)+BigInt(fraction.padEnd(decimals,'0'));
}
function precisionDecimals(precision) {
  if(!/^1$|^0\.0*1$/.test(precision))throw new Error('採用精度を確認してください。');
  return precision==='1'?0:precision.length-2;
}
export function rankingRows(collection) {
  const decimals=precisionDecimals(collection.precision);
  const ordered=collection.entries.map(e=>({...e,integer:scaledInteger(e.value,decimals)})).sort((a,b)=>a.integer>b.integer?-1:a.integer<b.integer?1:0);
  let previous=null,rank=0;
  const rows=ordered.map((e,i)=>{if(e.integer!==previous)rank=i+1;previous=e.integer;return {placeId:e.placeId,value:e.value,rank};});
  return rows.filter(e=>e.rank<=collection.topRank).map(e=>({...e,tied:rows.filter(x=>x.rank===e.rank).length>1}));
}
export function collectionRows(collection) {
  return collection.kind==='ranking'?rankingRows(collection):collection.entries.map(e=>({placeId:e.placeId}));
}
export function rowLabel(collection,row) {
  if(collection.kind!=='ranking')return '';
  return `${row.tied?'同率':''}${row.rank}位 · ${Number(row.value).toLocaleString('ja-JP',{minimumFractionDigits:collection.displayDecimals,maximumFractionDigits:collection.displayDecimals})} ${collection.unit}`;
}
export function validateCollections(extra,base) {
  if(extra?.schemaVersion!==1||!Array.isArray(extra.collections)||!extra.collections.length)throw new Error('学習テーマの形式を確認してください。');
  const merged={...base,categories:[...base.categories,...extra.categories],sources:[...base.sources,...extra.sources],places:[...base.places,...extra.places]};
  for(const field of ['categories','sources'])if(new Set(merged[field].map(x=>x.id)).size!==merged[field].length)throw new Error('分類・出典IDが重複しています。');
  validateCatalog(merged);
  const ids=new Set(merged.places.map(p=>p.id)),sources=new Set(merged.sources.map(s=>s.id)),seen=new Set();
  for(const c of extra.collections){
    if(!c.id||seen.has(c.id)||!c.title||!c.scope||!c.referenceDate||!c.note||!c.sourceIds?.length||c.sourceIds.some(s=>!sources.has(s)))throw new Error('テーマの対象・基準日・出典を確認してください。');
    seen.add(c.id);
    if(!Array.isArray(c.entries)||!c.entries.length||new Set(c.entries.map(e=>e.placeId)).size!==c.entries.length||c.entries.some(e=>!ids.has(e.placeId)))throw new Error('テーマの地点IDを確認してください。');
    if(c.kind==='ranking'){
      if(!c.metric||!c.unit||c.tieRule!=='competition'||c.order!=='descending'||!Number.isInteger(c.topRank)||c.topRank<1||!Number.isInteger(c.displayDecimals)||c.displayDecimals<0||c.displayDecimals>6)throw new Error('順位の条件を確認してください。');
      rankingRows(c);
    }else if(c.kind==='representative-set'){
      if(c.entries.length!==3||c.entries.some(e=>'value'in e||'rank'in e)||['metric','unit','precision','topRank','order','tieRule'].some(k=>k in c))throw new Error('三大項目に順位や数値は付けません。');
    }else throw new Error('テーマの種類を確認してください。');
  }
  return merged;
}
