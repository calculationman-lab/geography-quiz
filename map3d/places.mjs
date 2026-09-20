import * as THREE from 'three';
import {toWorld} from './projection.mjs';
import {validateCatalog,filterPlaces,clusterScreenPoints} from './places-model.mjs';

export function createPlacesLayer({data,config,meshes,mapRoot,camera,canvas,controls,requestRender}) {
  validateCatalog(data);
  const terrainPlaces=data.places;
  let collection=null,collectionRows=[],quizView=null;
  const $=id=>document.getElementById(id),group=new THREE.Group();group.name='place-anchors';mapRoot.add(group);
  const categoryMap=new Map(data.categories.map(c=>[c.id,c])),anchors=new Map(),buttons=new Map();
  let selected=null,category='all',query='',visible=[],factor=Number($('height-mode').value),screen=[],clusters=[];
  const ray=new THREE.Raycaster(),down=new THREE.Vector3(0,-1,0);
  mapRoot.updateMatrixWorld(true);
  function addAnchor(place){
    if(anchors.has(place.id))return;
    mapRoot.updateMatrixWorld(true);
    const p=toWorld({...place,heightMeters:0},config,1);
    ray.set(new THREE.Vector3(p.x,1000,p.z),down);
    const hit=ray.intersectObjects(meshes,false)[0];
    const water=place.waterSurfaceMeters===null?null:place.waterSurfaceMeters*config.metersToWorld;
    if(!hit && water===null)throw new Error(`${place.name}の表示地表を確認できません。`);
    const ground=hit?hit.point.y/factor:null;
    const surface=water===null?ground:Math.max(ground??water,water);
    const anchor=new THREE.Object3D();anchor.position.set(p.x,surface,p.z);
    anchor.userData={placeId:place.id,surfaceY:surface,terrainY:ground,method:hit?'rendered-terrain': 'source-water-level'};
    group.add(anchor);anchors.set(place.id,anchor);
  }
  for(const place of data.places)addAnchor(place);
  group.scale.y=factor;
  function choose(id){if(quizView){quizView.onChoose(id);$('overlap-picker').hidden=true;}else select(id);}
  const quizLabel=id=>quizView?String.fromCharCode(65+quizView.ids.indexOf(id)):'';
  function select(id,{focus=false}={}){
    selected=id;const place=data.places.find(p=>p.id===id);
    $('place-empty').hidden=Boolean(place);$('place-detail').hidden=!place;
    for(const button of $('place-list').children)button.setAttribute('aria-pressed',String(button.dataset.place===id));
    if(place){
      const cat=categoryMap.get(place.category);
      $('place-name').textContent=place.name;$('place-reading').textContent=place.reading;
      $('place-kind').textContent=cat.name+' · '+place.locationLabel;
      $('place-description').textContent=place.description;
      $('place-collection').textContent=collection?`${collection.title} · ${collectionRows.find(r=>r.placeId===id)?.label||'順不同'}`:'';
      $('place-height').textContent=place.heightMeters===null?'':`標高 ${place.heightMeters.toLocaleString('ja-JP')} m（出典値）`;
      $('place-anchor-note').textContent=place.anchorKind==='summit'?'ピンの高さは、その位置の地形に合わせています。':`ピンは代表地点です（${place.anchorLabel}）。地形・庭園・景勝地・都市圏・工業地帯の全域を示すものではありません。`;
      if(place.category==='scenic'&&anchors.get(id).userData.terrainY===null)$('place-anchor-note').textContent+=' 海岸を省略した部分は海面の高さに配置しています。';
      $('place-source').href=data.sources.find(s=>s.id===place.coordinateSourceId).url;
      $('place-source-map').href=place.sourceMapUrl;
      $('selected-place-caption').textContent=place.name;
      if(focus)focusPlace();
      else if(matchMedia('(max-width:800px)').matches)$('place-detail').scrollIntoView({block:'nearest'});
    }
    $('selected-place-caption').hidden=!place;
    $('overlap-picker').hidden=true;requestRender();
  }
  function focusPlace(){
    if(!selected)return;
    const target=anchors.get(selected).getWorldPosition(new THREE.Vector3());
    const offset=camera.position.clone().sub(controls.target).normalize().multiplyScalar(34);
    controls.target.copy(target);camera.position.copy(target).add(offset);controls.update();requestRender();
    if(matchMedia('(max-width:800px)').matches)canvas.scrollIntoView({block:'center'});
  }
  function refresh(){
    visible=collection?collectionRows.map(r=>data.places.find(p=>p.id===r.placeId)):(category==='none'?[]:filterPlaces(terrainPlaces,category,query));
    if(selected&&!visible.some(p=>p.id===selected))select(null);
    $('place-list').replaceChildren();
    $('place-empty').textContent=collection?'一覧やピンから場所を選ぼう。「＋数字」のピンを押すと、重なった地点の候補が開きます。':'ピンの数字は、近くにある地点の数です。一覧からも選べます。';
    for(const place of visible){const button=document.createElement('button');button.type='button';button.dataset.place=place.id;button.className='place-row';button.setAttribute('aria-pressed',String(place.id===selected));
      const cat=categoryMap.get(place.category),symbol=document.createElement('span');symbol.textContent=cat.symbol;symbol.style.color=cat.color;symbol.setAttribute('aria-hidden','true');
      const label=document.createElement('span');label.textContent=place.name;
      if(collection?.kind==='ranking'){const value=document.createElement('small');value.className='rank-value';value.textContent=collectionRows.find(r=>r.placeId===place.id).label;label.append(value);}
      button.append(symbol,label);button.addEventListener('click',()=>select(place.id));$('place-list').append(button);}
    $('place-count').textContent=!collection&&category==='none'?'ピンを非表示':`${visible.length}地点`;
    $('place-no-results').hidden=visible.length>0;$('place-no-results').textContent=category==='none'?'分類を選ぶとピンが表示されます。':'見つかりません。分類や名前を変えてみよう。';
    for(const [id,button]of buttons)button.setAttribute('aria-pressed',String(id===category));
    $('overlap-picker').hidden=true;requestRender();
  }
  for(const c of [{id:'all',name:'すべて'},...data.categories,{id:'none',name:'非表示'}]){
    const button=document.createElement('button');button.type='button';button.dataset.category=c.id;button.textContent=c.name;button.setAttribute('aria-pressed',String(c.id==='all'));
    button.addEventListener('click',()=>{category=c.id;refresh();});$('place-categories').append(button);buttons.set(c.id,button);
  }
  $('place-search').addEventListener('input',event=>{query=event.target.value;refresh();});
  $('focus-place').addEventListener('click',focusPlace);$('clear-place').addEventListener('click',()=>select(null));
  $('close-overlap').addEventListener('click',()=>{$('overlap-picker').hidden=true;});
  function chooseCluster(members){
    if(members.length===1){choose(members[0].id);return;}
    $('overlap-list').replaceChildren();
    for(const p of members){const place=data.places.find(x=>x.id===p.id),b=document.createElement('button');b.type='button';b.dataset.candidate=p.id;b.textContent=quizView?('地点'+quizLabel(p.id)+(quizView.revealed?'：'+place.name:'')):place.name+'（'+categoryMap.get(place.category).name+'）';b.addEventListener('click',()=>{choose(p.id);if(!quizView)$('place-name').focus({preventScroll:true});});$('overlap-list').append(b);}
    $('overlap-picker').hidden=false;$('overlap-list').firstElementChild.focus({preventScroll:true});
    if(matchMedia('(max-width:800px)').matches)$('overlap-picker').scrollIntoView({block:'nearest'});
  }
  let lastSignature='';
  function update(){
    group.updateMatrixWorld(true);const rect=canvas.getBoundingClientRect();
    screen=visible.map(place=>{const world=anchors.get(place.id).getWorldPosition(new THREE.Vector3()),p=world.clone().project(camera);return{id:place.id,x:(p.x+1)*rect.width/2,y:(1-p.y)*rect.height/2,depth:p.z,world:world.toArray()};}).filter(p=>p.depth>-1&&p.depth<1&&p.x>=0&&p.x<=rect.width&&p.y>=0&&p.y<=rect.height);
    clusters=clusterScreenPoints(screen);
    const signature=JSON.stringify([clusters.map(c=>c.members.map(p=>p.id)),selected,collection?.id,quizView&&[quizView.key,quizView.revealed,quizView.selectedId]]);
    if(signature!==lastSignature){
      $('pin-buttons').replaceChildren();
      for(const c of clusters){
        const b=document.createElement('button');b.type='button';b.className='map-pin';b.dataset.placeIds=c.members.map(p=>p.id).join(' ');
        const place=data.places.find(p=>p.id===c.members[0].id),cat=categoryMap.get(place.category),mark=document.createElement('span');
        const row=collectionRows.find(r=>r.placeId===place.id);
        mark.className='pin-mark';mark.textContent=c.members.length>1?(collection?'＋':'')+c.members.length:!quizView&&collection?.kind==='ranking'?String(row.rank):cat.symbol;mark.style.setProperty('--pin-color',c.members.length>1?'#325c51':cat.color);
        b.append(mark);b.setAttribute('aria-label',c.members.length>1?`${c.members.length}地点の候補を開く`:place.name);b.title=c.members.map(p=>data.places.find(x=>x.id===p.id).name).join('・');
        b.setAttribute('aria-pressed',String(c.members.some(p=>p.id===selected)));b.addEventListener('click',()=>chooseCluster(c.members));$('pin-buttons').append(b);
        if(!quizView&&c.members.length===1&&collection?.kind==='ranking')b.setAttribute('aria-label',place.name+' '+row.label);
        if(quizView){
          mark.textContent=c.members.length>1?'＋'+c.members.length:quizLabel(place.id);
          const correct=quizView.revealed&&c.members.some(p=>quizView.correctIds.includes(p.id));
          mark.style.setProperty('--pin-color',correct?'#267557':c.members.some(p=>p.id===quizView.selectedId)?'#a4543f':'#426c86');
          b.title=c.members.map(p=>'地点'+quizLabel(p.id)+(quizView.revealed?'：'+data.places.find(x=>x.id===p.id).name:'')).join('・');
          b.setAttribute('aria-label',c.members.length>1?c.members.length+'地点の回答候補を開く':b.title+(quizView.revealed?'':'を回答'));
        }
      }
      lastSignature=signature;
    }
    const ns='http://www.w3.org/2000/svg';$('pin-lines').replaceChildren();$('pin-lines').setAttribute('viewBox',`0 0 ${rect.width} ${rect.height}`);
    clusters.forEach((c,i)=>{
      const button=$('pin-buttons').children[i];button.style.left=c.x+'px';button.style.top=(c.y-22)+'px';
      for(const p of c.members){const line=document.createElementNS(ns,'line');line.setAttribute('x1',p.x);line.setAttribute('y1',p.y);line.setAttribute('x2',c.x);line.setAttribute('y2',c.y-22);$('pin-lines').append(line);
        const dot=document.createElementNS(ns,'circle');dot.setAttribute('cx',p.x);dot.setAttribute('cy',p.y);dot.setAttribute('r',p.id===selected?4:2.5);$('pin-lines').append(dot);}
    });
  }
  refresh();$('places-status').hidden=true;$('place-search').disabled=false;document.body.dataset.placesState='ready';
  return {update,
    showStudyPlace(id){const place=data.places.find(p=>p.id===id);if(!place||quizView)return;if(!collection){category=place.category;query='';$('place-search').value='';refresh();}if(visible.some(p=>p.id===id)){select(id,{focus:true});$('place-name').focus({preventScroll:true});}},
    setQuizView(view){
      if(view)for(const id of view.ids)addAnchor(data.places.find(p=>p.id===id));
      quizView=view;selected=view?.selectedId??null;$('place-detail').hidden=true;$('place-empty').hidden=Boolean(view);$('selected-place-caption').hidden=true;$('overlap-picker').hidden=true;
      if(view){visible=view.ids.map(id=>data.places.find(p=>p.id===id));requestRender();}else refresh();
    },
    focusId(id){const target=anchors.get(id)?.getWorldPosition(new THREE.Vector3());if(!target)return;if(quizView)selected=id;const offset=camera.position.clone().sub(controls.target).normalize().multiplyScalar(quizView&&!quizView.revealed?3:34);controls.target.copy(target);camera.position.copy(target).add(offset);controls.update();requestRender();},
    boundsFor(ids){const bounds=new THREE.Box3();for(const id of ids){addAnchor(data.places.find(p=>p.id===id));bounds.expandByPoint(anchors.get(id).getWorldPosition(new THREE.Vector3()));}return bounds.expandByScalar(5);},
    addCatalog(merged){validateCatalog(merged);data=merged;for(const c of data.categories)categoryMap.set(c.id,c);},
    setCollection(next,rows){for(const row of rows)addAnchor(data.places.find(p=>p.id===row.placeId));collection=next;collectionRows=rows;select(null);refresh();},
    setHeight(value){factor=value;group.scale.y=value;requestRender();},clear(){if(!quizView)select(null);},
    snapshot:()=>({selected,category,quiz:quizView?{ids:quizView.ids,revealed:quizView.revealed}:null,collectionId:collection?.id??null,collectionRows,visibleIds:visible.map(p=>p.id),anchors:[...anchors].map(([id,a])=>({id,position:a.position.toArray(),world:a.getWorldPosition(new THREE.Vector3()).toArray(),...a.userData})),screen,clusters:clusters.map(c=>({x:c.x,y:c.y,ids:c.members.map(p=>p.id)}))})};
}
