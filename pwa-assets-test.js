const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const root=path.join(__dirname,'..'),html=fs.readFileSync(path.join(root,'index.html'),'utf8'),events={},deleted=[],cached=new Map();
let addedAssets=[];const ctx={self:{addEventListener:(name,fn)=>events[name]=fn,skipWaiting:async()=>{},clients:{claim:async()=>{}}},caches:{open:async()=>({addAll:async assets=>{addedAssets=[...assets];for(const asset of assets){const p=path.join(root,asset.split('?')[0]==='./'?'index.html':asset.split('?')[0]);assert(fs.existsSync(p),`オフライン資産が存在: ${asset}`);cached.set(asset,true)}}}),keys:async()=>['social-quiz-v9-10','social-quiz-v11-0','social-quiz-v11-1','social-quiz-v11-2','another-app-cache'],delete:async key=>deleted.push(key)},URL,console};
vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(root,'sw.js'),'utf8'),ctx);
(async()=>{
  let pending;events.install({waitUntil:p=>pending=p});await pending;
  for(const m of html.matchAll(/<script src="([^"]+)"/g))assert(cached.has(m[1]),`HTMLとキャッシュのURL一致: ${m[1]}`);
  const scripts=[...html.matchAll(/<script src="([^"]+)"/g)].map(m=>m[1]);
  const weeklyIndex=scripts.findIndex(src=>src.startsWith('./weekly-review.js?'));
  assert(weeklyIndex>=0&&weeklyIndex<scripts.findIndex(src=>src.startsWith('./app.js?')),'復習スクリプトをapp.jsより先に読み込む');
  for(const m of html.matchAll(/<link rel="(?:stylesheet|apple-touch-icon)" href="([^"]+)"/g))assert(cached.has(m[1]),`CSS・アイコンとキャッシュのURL一致: ${m[1]}`);
  for(const asset of addedAssets.filter(x=>x.includes('?v=')))assert(asset.endsWith('?v=20260920-v11-2'),`資産の版を統一: ${asset}`);
  for(const icon of JSON.parse(fs.readFileSync(path.join(root,'manifest.webmanifest'),'utf8')).icons)assert(cached.has(icon.src));
  assert(addedAssets.some(x=>x.includes('lower-questions.js')));
  events.activate({waitUntil:p=>pending=p});await pending;
  assert.deepStrictEqual(deleted,['social-quiz-v9-10','social-quiz-v11-0','social-quiz-v11-1'],'このアプリの旧キャッシュだけ削除');
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.strictEqual(new Set(ids).size,ids.length,'DOM ID重複なし');
  console.log('PASS: PWA資産の存在・HTML/manifestとのURL一致・旧キャッシュ更新対象（実ブラウザーのオフライン動作は未検証）');
})().catch(e=>{console.error(e);process.exitCode=1});
