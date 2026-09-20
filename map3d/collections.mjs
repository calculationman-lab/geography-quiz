import {validateCollections,collectionRows,rowLabel} from './collections-model.mjs';

export function createCollectionsPanel({data,baseData,placesLayer}) {
  const merged=validateCollections(data,baseData),$=id=>document.getElementById(id);
  placesLayer.addCatalog(merged);
  let mode='terrain';
  const sourceMap=new Map(merged.sources.map(s=>[s.id,s]));
  function openCollection(c) {
    const rows=collectionRows(c).map(r=>({...r,label:rowLabel(c,r)}));
    try{placesLayer.setCollection(c,rows);}catch(error){$('collections-status').hidden=false;$('collections-status').textContent='このテーマの地点を表示できませんでした。地形の学習は使えます。';return;}
    $('collection-title').textContent=c.title;
    document.querySelector('.collection-legend').textContent=c.kind==='ranking'?'順位の数字はランキングの単独ピンに表示。「＋数字」は重なった地点数です。':'単独のピンは分類の文字で表示。「＋数字」は重なった地点数です。';
    $('collection-note').textContent=(c.kind==='ranking'?'数値で比べる · 同率を含む':'順不同 · 代表的な3項目')+'。'+c.note;
    $('collection-scope').textContent=c.scope;$('collection-date').textContent=c.referenceDate;
    $('collection-metric').textContent=c.kind==='ranking'?`${c.metric}（${c.unit}）／採用精度 ${c.precision} ${c.unit}／同率の次は人数分を飛ばす順位`:'数値による順位なし';
    $('collection-sources').replaceChildren();
    for(const id of c.sourceIds){const source=sourceMap.get(id),link=document.createElement('a');link.href=source.url;link.target='_blank';link.rel='noopener';link.textContent=source.title;$('collection-sources').append(link);}
    for(const b of $('collection-choices').children)b.setAttribute('aria-pressed',String(b.dataset.collection===c.id));
    $('collections-status').hidden=true;
  }
  function setMode(next) {
    mode=next;const terrain=mode==='terrain';
    $('terrain-controls').hidden=!terrain;$('collection-controls').hidden=terrain;
    for(const b of $('study-modes').children)b.setAttribute('aria-pressed',String(b.dataset.mode===mode));
    if(terrain){placesLayer.setCollection(null,[]);return;}
    $('collection-choices').replaceChildren();
    const collections=data.collections.filter(c=>c.kind===(mode==='ranking'?'ranking':'representative-set'));
    for(const c of collections){const b=document.createElement('button');b.type='button';b.dataset.collection=c.id;b.textContent=c.title;b.addEventListener('click',()=>openCollection(c));$('collection-choices').append(b);}
    openCollection(collections[0]);
  }
  for(const b of $('study-modes').children){b.disabled=false;b.addEventListener('click',()=>setMode(b.dataset.mode));}
  $('collections-status').hidden=true;document.body.dataset.collectionsState='ready';
  return {showPlace(id){
    if(baseData.places.some(p=>p.id===id))setMode('terrain');
    else{const c=data.collections.find(c=>c.entries.some(e=>e.placeId===id));if(!c)return;setMode(c.kind==='ranking'?'ranking':'sets');openCollection(c);}
    placesLayer.showStudyPlace(id);
  }};
}
