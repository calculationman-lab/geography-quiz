import {project} from './projection.mjs';

export function validateCatalog(data) {
  if(data?.schemaVersion!==1 || !Array.isArray(data.places) || !Array.isArray(data.categories) || !Array.isArray(data.sources)) throw new Error('地点データの形式を確認してください。');
  const categories=new Set(data.categories.map(c=>c.id)), sources=new Set(data.sources.map(s=>s.id)), ids=new Set();
  for(const s of data.sources) if(new URL(s.url).protocol!=='https:') throw new Error('出典URLを確認してください。');
  for(const p of data.places){
    if(!p.id || ids.has(p.id) || !categories.has(p.category) || !p.name || !p.reading || !['summit','representative'].includes(p.anchorKind)) throw new Error('地点ID・分類・名称を確認してください。');
    ids.add(p.id);project(p);
    if(!p.sourceIds?.length || p.sourceIds.some(id=>!sources.has(id)) || !sources.has(p.coordinateSourceId)) throw new Error('地点の出典を確認してください。');
    if(new URL(p.sourceMapUrl).origin!=='https://maps.gsi.go.jp') throw new Error('地点の地図出典を確認してください。');
    for(const key of ['heightMeters','waterSurfaceMeters'])if(p[key]!==null&&!Number.isFinite(p[key]))throw new Error('地点の標高を確認してください。');
  }
  return data;
}
const normalize=text=>text.normalize('NFKC').toLowerCase().replace(/\s/g,'');
export function filterPlaces(places,category='all',query='') {
  const needle=normalize(query);
  return places.filter(p=>(category==='all'||p.category===category)&&normalize([p.name,p.reading,...p.aliases,p.locationLabel].join(' ')).includes(needle));
}
// Union overlapping 44px targets transitively. No geographic coordinates change.
export function clusterScreenPoints(points,minimumDistance=48) {
  const parent=points.map((_,i)=>i);
  function root(i){while(parent[i]!==i){parent[i]=parent[parent[i]];i=parent[i];}return i;}
  for(let i=0;i<points.length;i++)for(let j=i+1;j<points.length;j++)if(Math.hypot(points[i].x-points[j].x,points[i].y-points[j].y)<minimumDistance)parent[root(j)]=root(i);
  const groups=new Map();points.forEach((p,i)=>{const key=root(i);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(p);});
  return [...groups.values()].map(members=>({members,x:members.reduce((n,p)=>n+p.x,0)/members.length,y:members.reduce((n,p)=>n+p.y,0)/members.length}));
}
