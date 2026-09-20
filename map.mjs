let placesLayer, mapRoot, quizController, collectionsPanel, quizMode=false, quizRegionHandler=null;
const $ = id => document.getElementById(id);
const status = $('load-status');
let renderer, scene, camera, controls, land, edgeGroup, THREE, config, regions, metadata;
let meshes = [], selected = null, frame = 0, ready = false, fullBounds, renderCount = 0;
let initCamera, initTarget, pointerStart = null;
const regionButtons = new Map();
const errorMessage = '通信を確認して、もう一度お試しください。オフラインでは、先に通信できる場所で地図を一度開いてください。';

async function fetchAsset(url, asJSON = true) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetch(url, {signal: controller.signal});
    if (!response.ok) throw new Error(`地図ファイルを読み込めません（${response.status}）。`);
    return asJSON ? await response.json() : await response.arrayBuffer();
  } finally { clearTimeout(timeout); }
}
function fail(title, detail = errorMessage) {
  ready = false;
  status.hidden = false;
  status.classList.add('error');
  $('load-title').textContent = title;
  $('load-detail').textContent = detail;
  $('retry').hidden = false;
  document.querySelectorAll('.region-button, #focus-region, #height-mode, .toolbar-actions button, .places-panel button, #place-search, .map-pin, #quiz-topic, #quiz-count').forEach(b => b.disabled = true);
  document.body.dataset.mapState = 'error';quizController?.suspend();if(parent!==window&&new URLSearchParams(location.search).get('embedded')==='1')parent.postMessage({channel:'social-master-map-link-v1',type:'error'},location.origin);
}
function render() {
  frame = 0;
  if (!renderer || !scene || !camera) return;
  renderer.render(scene, camera);
  renderCount++;
  placesLayer?.update();
  $('north-arrow').style.transform = `rotate(${-controls.getAzimuthalAngle()}rad)`;
}
function requestRender() { if (!frame) frame = requestAnimationFrame(render); }
function resize() {
  if (!renderer) return;
  const rect = $('map-canvas').getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  renderer.setSize(rect.width, rect.height, false);
  camera.aspect = rect.width / rect.height;
  camera.updateProjectionMatrix();
  if (!ready) return;
  requestRender();
}
function fit(bounds, remember = false) {
  const size = bounds.getSize(new THREE.Vector3());
  const center = bounds.getCenter(new THREE.Vector3());
  // Fit against both viewport dimensions. Keep north upward and islands in place.
  const verticalFov = THREE.MathUtils.degToRad(camera.fov);
  const horizontalFov = 2 * Math.atan(Math.tan(verticalFov/2)*camera.aspect);
  const distance = Math.max(size.x/(2*Math.tan(horizontalFov/2)), size.z/(2*Math.tan(verticalFov/2))) * 1.18 + size.y;
  const direction = new THREE.Vector3(0, 1, .40).normalize();
  controls.target.copy(center);
  camera.position.copy(center).addScaledVector(direction, distance);
  controls.minDistance = quizMode ? .5 : 5;
  controls.maxDistance = 1100;
  camera.near = .05; camera.far = 2500;
  camera.updateProjectionMatrix();
  controls.update();
  if (remember) { initCamera = camera.position.clone(); initTarget = controls.target.clone(); }
  requestRender();
}
function chooseRegion(id){if(quizMode){quizRegionHandler?.(id);}else selectRegion(id);}
function selectRegion(id) {
  if (!ready) return;
  selected = id;
  const region = regions.find(r => r.id === id);
  for (const [key, button] of regionButtons) {
    button.classList.toggle('selected', key === id);
    button.setAttribute('aria-pressed', String(key === id));
  }
  $('all-regions').classList.toggle('selected', id === null);
  $('all-regions').setAttribute('aria-pressed', String(id === null));
  for (const mesh of meshes) {
    const on = !id || mesh.userData.regionId === id;
    mesh.material.color.set(on ? '#ffffff' : '#aab6b5');
    mesh.material.emissive.set(id && on ? region.color : '#000000');
    mesh.material.emissiveIntensity = id && on ? .3 : 0;
    mesh.material.vertexColors = on;
    mesh.material.needsUpdate = true;
  }
  for (const line of edgeGroup.children) {
    const on = line.userData.regionId === id;
    line.material.color.set(on ? region.color : '#50675c');
    line.material.opacity = on ? .8 : .25;
  }
  $('selection-name').textContent = region?.name ?? '日本全国';
  $('view-label').textContent = quizMode?'地図クイズ':region?.name ?? '日本全国';
  $('selection-detail').textContent = region ? metadata.prefectures.filter(p=>p.regionId===id).map(p=>p.name).join('・') : '7つの地方を選んでみよう。';
  $('focus-region').disabled = !region;
  requestRender();
}
function setHeight() {
  if (!ready) return;
  const factor = Number($('height-mode').value);
  land.scale.y = factor;
  edgeGroup.scale.y = factor;
  $('height-caption').textContent = factor === 1 ? '高さの強調なし' : `高さを${factor}倍に強調`;
  land.updateMatrixWorld(true);
  placesLayer?.setHeight(factor);
  requestRender();
}
function zoom(factor) {
  if (!ready) return;
  const offset = camera.position.clone().sub(controls.target);
  const distance = THREE.MathUtils.clamp(offset.length()*factor,controls.minDistance,controls.maxDistance);
  camera.position.copy(controls.target).add(offset.setLength(distance));
  controls.update(); requestRender();
}
function pick(event) {
  if (!ready || !pointerStart || Math.hypot(event.clientX-pointerStart.x,event.clientY-pointerStart.y)>7) return;
  const rect = renderer.domElement.getBoundingClientRect();
  const point = new THREE.Vector2((event.clientX-rect.left)/rect.width*2-1, -(event.clientY-rect.top)/rect.height*2+1);
  const ray = new THREE.Raycaster();ray.setFromCamera(point,camera);
  const hit = ray.intersectObjects(meshes,false)[0];
  if (hit) chooseRegion(hit.object.userData.regionId);
}
async function boot() {
  try {
    [THREE, config, regions, metadata] = await Promise.all([
      import('three'), fetchAsset('./config.json'), fetchAsset('./regions.json'), fetchAsset('./assets/terrain-metadata.json')
    ]);
    const [{OrbitControls}, {GLTFLoader}] = await Promise.all([
      import('./vendor/OrbitControls.js'), import('./vendor/GLTFLoader.js')
    ]);
    const validPrefectures = new Set(regions.flatMap(r=>r.prefectures));
    if (regions.length !== 7 || validPrefectures.size !== 47) throw new Error('地方データを確認してください。');
    for (const region of regions) {
      const button = document.createElement('button');button.type='button';button.className='region-button';button.disabled=true;
      button.dataset.region = region.id;button.setAttribute('aria-pressed','false');
      const dot=document.createElement('span');dot.className='region-dot';dot.style.setProperty('--region-color',region.color);dot.setAttribute('aria-hidden','true');
      button.append(dot,document.createTextNode(region.name));button.addEventListener('click',()=>chooseRegion(region.id));
      $('regions').append(button);regionButtons.set(region.id,button);
    }
    try { renderer = new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'}); }
    catch { fail('この環境では3D地図を表示できません','WebGL 2に対応した新しいSafari、Chrome、Edgeで開いてください。社会マスターの通常学習はそのまま使えます。');return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));
    renderer.outputColorSpace=THREE.SRGBColorSpace;
    renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.10;
    $('map-canvas').append(renderer.domElement);
    renderer.domElement.tabIndex=0;renderer.domElement.setAttribute('aria-label','日本の3D地図。ドラッグで回転、ホイールや指2本で拡大縮小。地方は横のボタンでも選べます。');
    renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();fail('3D表示をいったん停止しました','ほかの画面を閉じて、もう一度読み込んでください。');});
    scene=new THREE.Scene();
    camera=new THREE.PerspectiveCamera(38,1,.05,2500);
    controls=new OrbitControls(camera,renderer.domElement);
    controls.enablePan=false;controls.enableDamping=false;
    controls.minPolarAngle=.08;controls.maxPolarAngle=Math.PI*.45;
    controls.zoomSpeed=.85;controls.rotateSpeed=.65;
    controls.addEventListener('change',requestRender);
    scene.add(new THREE.HemisphereLight('#f4fffa','#4d675a',1.6));
    const sun=new THREE.DirectionalLight('#fff8df',2.0);sun.position.set(-100,250,-100);scene.add(sun);
    resize();
    $('load-detail').textContent='海岸線と山の高さを準備しています。';
    const [buffer,outlines]=await Promise.all([fetchAsset('./assets/japan-terrain.glb',false),fetchAsset('./assets/outlines.json')]);
    const gltf=await new GLTFLoader().parseAsync(buffer,new URL('./assets/',location.href).href);
    land=gltf.scene;
    land.traverse(object=>{
      if (!object.isMesh) return;
      if (!object.userData.prefectureId || !regions.some(r=>r.id===object.userData.regionId)) throw new Error('地形と地方データが一致しません。');
      object.material=object.material.clone();object.material.roughness=1;object.material.metalness=0;
      meshes.push(object);
    });
    if(meshes.length!==47)throw new Error('47都道府県の地形を読み込めませんでした。');
    mapRoot=new THREE.Group();mapRoot.name="japan-map";scene.add(mapRoot);mapRoot.add(land);
    edgeGroup=new THREE.Group();
    for(const feature of outlines){
      const positions=[];
      for(const ring of feature.rings) for(let i=1;i<ring.length;i++)positions.push(...ring[i-1],...ring[i]);
      const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
      const material=new THREE.LineBasicMaterial({color:'#50675c',transparent:true,opacity:.25,depthWrite:false});
      const lines=new THREE.LineSegments(geometry,material);lines.userData.regionId=feature.regionId;edgeGroup.add(lines);
    }
    mapRoot.add(edgeGroup);ready=true;
    setHeight();fullBounds=new THREE.Box3().setFromObject(land);fit(fullBounds,true);
    try {
      const data=await fetchAsset('./places.json');
      const {createPlacesLayer}=await import('./places.mjs');
      placesLayer=createPlacesLayer({data,config,meshes,mapRoot,camera,canvas:renderer.domElement,controls,requestRender});
      try {
        const collections=await fetchAsset('./collections.json');
        const {createCollectionsPanel}=await import('./collections.mjs');
        collectionsPanel=createCollectionsPanel({data:collections,baseData:data,placesLayer});
        try{
          const {createQuizLauncher}=await import('./quiz.mjs');
          quizController=createQuizLauncher({baseData:data,collections,regions,placesLayer,fetchAsset,map:{
            setMode(value){quizMode=value;quizRegionHandler=null;document.body.dataset.quizActive=String(value);controls.minDistance=value?.5:5;selectRegion(null);if(!value)fit(fullBounds);},
            onRegion(fn){quizRegionHandler=fn;},
            highlight(id){selectRegion(id);},
            frame(ids){if(ids?.length)fit(placesLayer.boundsFor(ids));else fit(fullBounds);},
            focusRegion(id){selectRegion(id);const bounds=new THREE.Box3();for(const m of meshes.filter(m=>m.userData.regionId===id))bounds.expandByObject(m);fit(bounds);}
          }});
        }catch(error){console.warn('Quiz unavailable:',error.message);$('quiz-launch-status').textContent='クイズを読み込めませんでした。再読み込みしてお試しください。';document.body.dataset.quizState='error';}
      } catch(error) {
        console.warn('Collections unavailable:',error.message);
        $('collections-status').textContent='ランキングと三大項目を読み込めませんでした。地形の学習は使えます。';
        document.body.dataset.collectionsState='error';
      }
    } catch(error) {
      console.warn('Places unavailable:',error.message);
      $('places-status').textContent='地点を読み込めませんでした。地図は使えます。再読込してお試しください。';
      document.body.dataset.placesState='error';
    }
    status.hidden=true;document.body.dataset.mapState='ready';
    document.querySelectorAll('.region-button, #height-mode, .toolbar-actions button').forEach(b=>b.disabled=false);
    selectRegion(null);
    renderer.domElement.addEventListener('pointerdown',event=>{pointerStart={x:event.clientX,y:event.clientY};});
    renderer.domElement.addEventListener('pointerup',pick);
    renderer.domElement.addEventListener('pointercancel',()=>pointerStart=null);
    new ResizeObserver(()=>{resize();fit(selected?new THREE.Box3().setFromObject(land):fullBounds,true);}).observe($('map-canvas'));
    if(new URLSearchParams(location.search).has('test')) {
      window.__map3d=Object.freeze({snapshot:()=>({ready,selected,regionIds:regions.map(r=>r.id),meshCount:meshes.length,
        selectedMeshIds:meshes.filter(m=>m.userData.regionId===selected).map(m=>m.userData.prefectureId),
        camera:camera.position.toArray(),target:controls.target.toArray(),initialCamera:initCamera.toArray(),initialTarget:initTarget.toArray(),
        heightFactor:land.scale.y,bounds:fullBounds.toArray?.()??{min:fullBounds.min.toArray(),max:fullBounds.max.toArray()},
        quiz:quizController?.snapshot()??null,places:placesLayer?.snapshot()??null,renderCount,triangles:renderer.info.render.triangles,drawCalls:renderer.info.render.calls,
        calibration:land.children.filter(o=>o.userData.calibrationId).map(o=>({id:o.userData.calibrationId,position:o.position.toArray()})),
        screenPoints:meshes.map(m=>{const center=new THREE.Box3().setFromObject(m).getCenter(new THREE.Vector3());const p=center.project(camera);const rect=renderer.domElement.getBoundingClientRect();return{id:m.userData.prefectureId,regionId:m.userData.regionId,x:rect.left+(p.x+1)*rect.width/2,y:rect.top+(1-p.y)*rect.height/2};})})});
    }
    if(new URLSearchParams(location.search).has('fromQuestion')){
      try{const {openLinkedMap}=await import('./linked-map.mjs');await openLinkedMap({quizController,fetchAsset,showPlace:id=>collectionsPanel?.showPlace(id)});}
      catch{document.body.dataset.linkedState='error';$('linked-context').hidden=false;$('linked-source').textContent='地図練習を読み込めませんでした。図鑑は使えます。';if(parent!==window)parent.postMessage({channel:'social-master-map-link-v1',type:'error'},location.origin);}
    }
  } catch(error) { console.error(error);fail('地図を読み込めませんでした',error.message+' '+errorMessage); }
}
$('retry').addEventListener('click',()=>location.reload());
$('all-regions').addEventListener('click',()=>selectRegion(null));
$('focus-region').addEventListener('click',()=>{if(!ready||!selected)return;const bounds=new THREE.Box3();for(const mesh of meshes.filter(m=>m.userData.regionId===selected))bounds.expandByObject(mesh);fit(bounds);});
$('reset-view').addEventListener('click',()=>{if(!ready)return;if(!quizMode){selectRegion(null);placesLayer?.clear();}fit(fullBounds,true);});
$('height-mode').addEventListener('change',setHeight);
$('zoom-in').addEventListener('click',()=>zoom(.78));$('zoom-out').addEventListener('click',()=>zoom(1.28));
boot();
