import {validateCollections} from './collections-model.mjs';
import {validateQuiz,emptyProgress,startSession,currentQuestion,answer,reveal,nextQuestion,abandon,earnedTitles} from './quiz-model.mjs';
import {createQuizStore,STORAGE_KEY} from './quiz-store.mjs';

export function createQuizLauncher({baseData,collections,regions,placesLayer,fetchAsset,map}){
  const $=id=>document.getElementById(id),catalog=validateCollections(collections,baseData);
  let data,merged,store,progress,open=false,busy=false,blocked=false,summary=null,initialTitles=[],linked=null;
  const names=new Map([...catalog.places,...regions].map(p=>[p.id,p.name]));
  const letter=(id,ids)=>String.fromCharCode(65+ids.indexOf(id));
  const mobile=()=>matchMedia('(max-width:800px)').matches;
  function saveMessage(message,conflict=false){$('quiz-save-status').textContent=message;$('quiz-reload').hidden=!conflict;}
  async function commit(action){
    if(busy||blocked)return null;busy=true;
    try{
      const draft=structuredClone(progress),result=action(draft);
      if(result?.status==='ignored')return result;
      draft.revision++;
      const save=()=>store.write(draft);
      const persisted=!linked&&navigator.locks?await navigator.locks.request(STORAGE_KEY,save):save();
      if(persisted.status==='conflict'){blocked=true;saveMessage(persisted.message,true);lockControls();return null;}
      progress=draft;saveMessage(persisted.message);renderAchievements();return result??{status:'saved'};
    }finally{busy=false;}
  }
  function lockControls(){for(const b of $('quiz-panel').querySelectorAll('button,select'))b.disabled=!['quiz-close','quiz-reload','quiz-export'].includes(b.id);}
  function renderAchievements(){
    if(linked)return;
    const titles=earnedTitles(progress,data.titles);$('quiz-totals').textContent=`初回正解 ${progress.firstCorrect}／回答 ${progress.answered}問 · 最高連続 ${progress.bestStreak}問 · 称号 ${titles.length}／${data.titles.length}`;
    $('quiz-titles').replaceChildren();for(const t of data.titles){const p=document.createElement('p'),detail=document.createElement('small'),earned=titles.some(x=>x.id===t.id);p.className=earned?'earned':'';p.textContent=(earned?'獲得：':'目標：')+t.name;detail.textContent=t.description;p.append(detail);$('quiz-titles').append(p);}
  }
  function lobby(){
    summary=null;$('quiz-lobby').hidden=false;$('quiz-play').hidden=true;$('quiz-result').hidden=true;$('quiz-map-strip').hidden=true;
    $('quiz-start').hidden=Boolean(progress.active);$('quiz-resume').hidden=!progress.active;$('quiz-discard').hidden=!progress.active;
    $('quiz-topic').disabled=Boolean(progress.active);$('quiz-count').disabled=Boolean(progress.active);
    placesLayer.setQuizView({key:'lobby',ids:[],correctIds:[],revealed:false,onChoose:()=>{}});map.onRegion(null);map.highlight(null);
    renderAchievements();
  }
  function showResult(result){
    summary=result;$('quiz-play').hidden=true;$('quiz-lobby').hidden=true;$('quiz-result').hidden=false;$('quiz-map-strip').hidden=true;
    placesLayer.setQuizView({key:'results',ids:[],correctIds:[],revealed:false,onChoose:()=>{}});map.onRegion(null);map.highlight(null);
    const first=result.results.filter(r=>r.firstCorrect).length,solved=result.results.filter(r=>r.solved).length,shown=result.results.filter(r=>r.revealed).length;
    $('quiz-result-summary').textContent=`${result.completed?'挑戦完了':'途中で終了'}。初回正解 ${first}／${result.total}問。再挑戦を含めて解けた問題 ${solved}問、答えを見た問題 ${shown}問。`;
    const added=earnedTitles(progress,data.titles).filter(t=>!initialTitles.includes(t.id));$('quiz-new-titles').textContent=added.length?'新しい称号：'+added.map(t=>t.name).join('・'):'';
    $('quiz-result').focus({preventScroll:true});if(mobile())$('quiz-result').scrollIntoView({block:'nearest'});
  }
  function preview(id){const q=currentQuestion(progress,data);if(!q)return;if(q.targetType==='region')map.focusRegion(id);else placesLayer.focusId(id);if(mobile())$('quiz-map-strip').scrollIntoView({block:'start'});}
  async function choose(id){const result=await commit(p=>answer(p,data,id));if(!result||result.status==='ignored')return;renderQuestion(false);if(mobile())$('quiz-feedback').scrollIntoView({block:'nearest'});}
  function renderQuestion(frame){
    const a=progress.active,q=currentQuestion(progress,data);if(!q)return;
    const ids=a.choices[a.index],done=a.phase==='feedback',last=a.attemptIds.at(-1),result=a.results[a.index];
    $('quiz-lobby').hidden=true;$('quiz-result').hidden=true;$('quiz-play').hidden=false;$('quiz-map-strip').hidden=false;
    $('quiz-counter').textContent=$('quiz-map-counter').textContent=`${a.index+1}／${a.questionIds.length}問`;
    $('quiz-prompt').textContent=$('quiz-map-prompt').textContent=q.prompt;$('quiz-context-text').textContent=q.context;
    $('quiz-streak').textContent=`初回正解の連続：${a.streak}問`;
    let feedback='地図を回転・拡大して、1つ選ぼう。';
    if(done)feedback=result.revealed?'答えを確認しました。初回正解には数えません。':result.firstCorrect?'正解！ 初回正解です。':'正解！ 再挑戦で解けました。';
    else if(a.attemptIds.length)feedback='惜しい！ もう一度選んでみよう。初回正解には数えません。';
    if(linked){$('quiz-streak').hidden=true;$('quiz-quit').hidden=true;if(done)feedback=result.revealed?'答えの場所を確認しました。':result.firstCorrect?'正解！ 場所を見つけました。':'正解！ 再挑戦で場所を見つけました。';else if(a.attemptIds.length)feedback='惜しい！ もう一度選んでみよう。';}
    $('quiz-feedback').textContent=$('quiz-map-feedback').textContent=feedback;
    $('quiz-reveal').hidden=done;$('quiz-next').hidden=!done;$('quiz-next').textContent=a.index+1===a.questionIds.length?'結果を見る':'次の問題';
    if(linked)$('quiz-next').textContent='図鑑で位置関係を見る';
    $('quiz-explanation').hidden=!done;$('quiz-answer-names').textContent=done?'正解：'+q.correctIds.map(id=>names.get(id)).join('・'):'';
    $('quiz-explanation-text').textContent=done?q.explanation:'';$('quiz-sources').replaceChildren();
    if(done)for(const id of q.sourceIds){const s=merged.sources.find(s=>s.id===id),link=document.createElement('a');link.textContent=s.title;link.href=s.url;link.target='_blank';link.rel='noopener';$('quiz-sources').append(link);}
    $('quiz-choices').replaceChildren();for(const id of ids){const row=document.createElement('div'),pick=document.createElement('button'),focus=document.createElement('button');row.className='quiz-choice';pick.type=focus.type='button';pick.dataset.answer=id;focus.dataset.preview=id;pick.textContent=letter(id,ids)+'で回答'+(done?'：'+names.get(id):'');pick.setAttribute('aria-label',pick.textContent);pick.disabled=done;pick.dataset.correct=String(done&&q.correctIds.includes(id));pick.addEventListener('click',()=>choose(id));focus.textContent=letter(id,ids)+'を見る';focus.addEventListener('click',()=>preview(id));row.append(pick,focus);$('quiz-choices').append(row);}
    map.onRegion(q.targetType==='region'&&!done?choose:null);map.highlight(q.targetType==='region'&&done?q.correctIds[0]:null);
    placesLayer.setQuizView({key:q.id,ids:q.targetType==='place'?ids:[],correctIds:q.targetType==='place'?q.correctIds:[],revealed:done,selectedId:done?q.correctIds[0]:last,onChoose:done?preview:choose});
    document.querySelector('#quiz-play .quiz-help').textContent=q.targetType==='region'?'陸地をタップして回答。「Aを見る」などで範囲を確かめてから、同じ記号で回答することもできます。':'ピンと同じ記号で回答できます。「見る」は場所の確認だけです。';
    if(frame){$('quiz-context').open=false;$('quiz-panel').closest('.places-panel').scrollTop=0;requestAnimationFrame(()=>requestAnimationFrame(()=>{map.frame(q.targetType==='place'?ids:null);if(mobile())$('quiz-map-strip').scrollIntoView({block:'start'});}));}
  }
  async function close(){if(!open||busy)return;if(progress.active&&!blocked){const result=await commit(p=>abandon(p,data));if(!result)return;}open=false;map.setMode(false);placesLayer.setQuizView(null);$('quiz-panel').hidden=true;$('study-panel').hidden=false;$('quiz-launch').hidden=Boolean(linked);$('quiz-map-strip').hidden=true;if(linked)linked.onExplore();else $('quiz-launch').focus({preventScroll:true});}
  async function launch(){
    $('quiz-launch').disabled=true;$('quiz-launch-status').textContent='クイズを準備しています。';
    try{
      if(!data){const loaded=await fetchAsset('./quiz.json');const all=validateQuiz(loaded,catalog,collections.collections,regions);placesLayer.addCatalog(all);data=loaded;merged=all;for(const p of data.places)names.set(p.id,p.name);for(const t of data.topics){const option=document.createElement('option');option.value=t.id;option.textContent=t.name;$('quiz-topic').append(option);}}
      store=linked?{load:emptyProgress,write:()=>({status:'practice',message:''}),message:''}:createQuizStore(data);progress=store.load();blocked=false;initialTitles=earnedTitles(progress,data.titles).map(t=>t.id);open=true;
      for(const b of $('quiz-panel').querySelectorAll('button,select'))b.disabled=false;
      $('quiz-panel').hidden=false;$('study-panel').hidden=true;$('quiz-launch').hidden=true;$('quiz-launch-status').textContent='';saveMessage(store.message);map.setMode(true);lobby();document.body.dataset.quizState='ready';
      $('quiz-achievements').hidden=Boolean(linked);$('quiz-close').textContent=linked?'図鑑で位置関係を見る':'終了して図鑑へ';
      if(linked){const q=data.questions.find(q=>q.id===linked.questionId);if(!q)throw Error('Linked question unavailable');await commit(p=>startSession(p,{...data,questions:[q]},'mix',1));renderQuestion(true);}
      if(mobile())$('quiz-panel').scrollIntoView({block:'start'});
      return true;
    }catch(error){console.warn('Quiz data unavailable:',error.message);$('quiz-launch-status').textContent='クイズを読み込めませんでした。もう一度「地図クイズに挑戦」を押してください。図鑑は使えます。';document.body.dataset.quizState='error';}
    finally{$('quiz-launch').disabled=false;}
  }
  $('quiz-launch').addEventListener('click',launch);$('quiz-close').addEventListener('click',close);$('quiz-reload').addEventListener('click',()=>location.reload());
  $('quiz-start').addEventListener('click',async()=>{initialTitles=earnedTitles(progress,data.titles).map(t=>t.id);const count=$('quiz-count').value;const result=await commit(p=>startSession(p,data,$('quiz-topic').value,count==='all'?'all':Number(count)));if(result)renderQuestion(true);});
  $('quiz-resume').addEventListener('click',()=>renderQuestion(true));
  $('quiz-reveal').addEventListener('click',async()=>{const result=await commit(p=>reveal(p,data));if(result&&result.status!=='ignored')renderQuestion(false);});
  $('quiz-next').addEventListener('click',async()=>{if(linked){await close();return;}let ended;const result=await commit(p=>{ended=nextQuestion(p);});if(result){if(ended)showResult(ended);else renderQuestion(true);}});
  for(const id of ['quiz-quit','quiz-discard'])$(id).addEventListener('click',async()=>{let ended;const result=await commit(p=>{ended=abandon(p,data);});if(result&&ended)showResult(ended);});
  $('quiz-again').addEventListener('click',lobby);$('quiz-focus').addEventListener('click',()=>preview(currentQuestion(progress,data).correctIds[0]));
  $('quiz-export').addEventListener('click',()=>{const blob=new Blob([JSON.stringify({kind:'social-master-map3d-progress',exportedAt:new Date().toISOString(),progress},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='social-master-map3d-progress.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
  $('quiz-launch').disabled=false;document.body.dataset.quizState='idle';
  return {async startLinked(context){if(busy)return;linked=context;if(!await launch())throw Error('地図練習を開始できません。');},snapshot:()=>open?{practice:Boolean(linked),active:progress.active,totals:{firstCorrect:progress.firstCorrect,bestStreak:progress.bestStreak},titleIds:linked?[]:earnedTitles(progress,data.titles).map(t=>t.id),blocked,summary}:null,suspend(){blocked=true;map.onRegion(null);lockControls();saveMessage(linked?'3D表示が停止しました。再読み込みで地図練習をやり直せます。':'3D表示が停止しました。保存済みの続きから再開するには、ページを再読み込みしてください。',true);}};
}
