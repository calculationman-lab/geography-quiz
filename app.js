(function(){
  "use strict";
  const QUESTIONS=window.GEOGRAPHY_QUESTIONS||[];
  const STORAGE_KEY="social-quiz-progress-v1";
  const SETTINGS_KEY="social-quiz-settings-v1";
  const SCOPE_LABELS={first:"小4前期",summer:"夏期講習",all:"全範囲"};
  const screens={home:document.getElementById("home-screen"),quiz:document.getElementById("quiz-screen"),result:document.getElementById("result-screen")};
  const state={mode:"main",scope:"first",deck:[],index:0,score:0,answers:[],startedAt:0,mainResult:null};
  const $=id=>document.getElementById(id);

  function shuffle(values){const a=[...values];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
  function localDateKey(date=new Date()){const y=date.getFullYear();const m=String(date.getMonth()+1).padStart(2,"0");const d=String(date.getDate()).padStart(2,"0");return `${y}-${m}-${d}`}
  function loadProgress(){try{const value=JSON.parse(localStorage.getItem(STORAGE_KEY));return value&&Array.isArray(value.history)?value:{version:1,history:[]}}catch{return{version:1,history:[]}}}
  function saveProgress(value){localStorage.setItem(STORAGE_KEY,JSON.stringify(value))}
  function loadSettings(){try{const value=JSON.parse(localStorage.getItem(SETTINGS_KEY));return{soundEnabled:value?.soundEnabled!==false,soundVolume:Number.isFinite(value?.soundVolume)?Math.max(0,Math.min(1,value.soundVolume)):0.7,lastScope:SCOPE_LABELS[value?.lastScope]?value.lastScope:"first"}}catch{return{soundEnabled:true,soundVolume:0.7,lastScope:"first"}}}
  function saveSettings(){localStorage.setItem(SETTINGS_KEY,JSON.stringify(settings))}
  const settings=loadSettings();state.scope=settings.lastScope;
  const AUDIO_REVISION="20260814-v6";
  const resultSounds={correct:new Audio(`./se-correct.mp3?v=${AUDIO_REVISION}`),wrong:new Audio(`./se-wrong.mp3?v=${AUDIO_REVISION}`)};
  Object.values(resultSounds).forEach(sound=>{sound.preload="auto"});
  function playResultSound(correct){if(!settings.soundEnabled||settings.soundVolume<=0)return;const sound=correct?resultSounds.correct:resultSounds.wrong;sound.pause();sound.currentTime=0;sound.volume=settings.soundVolume;const playback=sound.play();if(playback?.catch)playback.catch(()=>{})}
  function renderSoundSettings(){$("sound-enabled").checked=settings.soundEnabled;$("sound-enabled").nextElementSibling.textContent=settings.soundEnabled?"効果音 ON":"効果音 OFF";$("sound-volume").value=Math.round(settings.soundVolume*100);$("sound-volume-value").textContent=`${Math.round(settings.soundVolume*100)}%`}
  function showScreen(name){Object.entries(screens).forEach(([key,node])=>node.classList.toggle("hidden",key!==name));window.scrollTo({top:0,behavior:"smooth"})}
  function formatDuration(seconds){const min=Math.floor(seconds/60);const sec=seconds%60;return min?`${min}分${String(sec).padStart(2,"0")}秒`:`${sec}秒`}
  function formatDate(iso){const date=new Date(iso);return `${date.getMonth()+1}/${date.getDate()} ${String(date.getHours()).padStart(2,"0")}:${String(date.getMinutes()).padStart(2,"0")}`}
  function questionsForScope(scope){if(scope==="first")return QUESTIONS.filter(q=>q.source==="小4前期");if(scope==="summer")return QUESTIONS.filter(q=>q.source==="夏期講習");return QUESTIONS}

  function validateQuestions(){
    const ids=new Set();
    QUESTIONS.forEach((q,index)=>{
      if(!q.id||ids.has(q.id))throw new Error(`問題IDが不正です: ${index+1}`);ids.add(q.id);
      if(!q.question||!q.region||!q.source||!Array.isArray(q.choices)||q.choices.length!==4)throw new Error(`問題データが不正です: ${q.id}`);
      if(new Set(q.choices).size!==4||q.answerIndex<0||q.answerIndex>3||q.choices[q.answerIndex]!==q.answer)throw new Error(`選択肢が不正です: ${q.id}`);
      if(q.source==="小4前期"&&(!Number.isInteger(q.unit)||q.unit<1||q.unit>17))throw new Error(`単元番号が不正です: ${q.id}`);
    });
  }

  function renderScope(){
    document.querySelectorAll("[data-scope]").forEach(button=>{const selected=button.dataset.scope===state.scope;button.classList.toggle("selected",selected);button.setAttribute("aria-pressed",String(selected))});
    Object.keys(SCOPE_LABELS).forEach(scope=>{const node=document.querySelector(`[data-scope-count="${scope}"]`);if(node)node.textContent=`${questionsForScope(scope).length}問`});
    const total=questionsForScope(state.scope).length;$("question-total").textContent=total;$("all-question-label").textContent=`${total}問すべて`;
  }
  function selectScope(scope){if(!SCOPE_LABELS[scope])return;state.scope=scope;settings.lastScope=scope;saveSettings();renderScope()}
  function renderHome(){
    renderScope();const progress=loadProgress();const todayResults=progress.history.filter(x=>x.dateKey===localDateKey());const today=todayResults[todayResults.length-1];
    $("today-status").classList.toggle("done",Boolean(today));$("today-status").textContent=today?`今日の社会クイズ：完了　${today.score}/${today.total}点（${today.rate}%）`:`今日の社会クイズ：まだやっていません`;
    const history=$("history-list");history.replaceChildren();if(!progress.history.length){history.innerHTML='<div class="empty">まだ記録はありません</div>';return}
    [...progress.history].reverse().slice(0,20).forEach(item=>{const row=document.createElement("div");row.className="history-row";const scope=item.scopeLabel?`・${item.scopeLabel}`:"";row.innerHTML=`<span>${formatDate(item.completedAt)}${scope}</span><strong>${item.score}/${item.total}点（${item.rate}%）</strong><span class="time">${formatDuration(item.durationSeconds)}</span>`;history.append(row)});
  }
  function makeRound(question){const answer=question.choices[question.answerIndex];const choices=shuffle(question.choices);return{...question,choices,correctIndex:choices.indexOf(answer),answer}}
  function startMain(requestedCount){const pool=questionsForScope(state.scope);const setSize=requestedCount==="all"?pool.length:Number(requestedCount);if(!Number.isInteger(setSize)||setSize<1||!pool.length)return;state.mode="main";state.deck=shuffle(pool).slice(0,Math.min(setSize,pool.length)).map(makeRound);state.index=0;state.score=0;state.answers=[];state.startedAt=Date.now();state.mainResult=null;showScreen("quiz");renderQuestion()}
  function startReview(){if(!state.mainResult?.wrong.length)return;state.mode="review";state.deck=state.mainResult.wrong.map(x=>QUESTIONS.find(q=>q.id===x.id)).filter(Boolean).map(makeRound);state.index=0;state.score=0;state.answers=[];state.startedAt=Date.now();showScreen("quiz");renderQuestion()}
  function questionTag(q){return q.source==="小4前期"?`前期・単元${q.unit}・${q.region}`:`夏期・${q.region}`}
  function renderQuestion(){
    const q=state.deck[state.index];$("region").textContent=state.mode==="review"?`復習・${questionTag(q)}`:questionTag(q);$("progress").textContent=`${state.index+1} / ${state.deck.length}`;$("progress-bar").style.width=`${state.index/state.deck.length*100}%`;$("question").textContent=q.question;$("feedback").className="feedback hidden";$("next-button").classList.add("hidden");
    const choices=$("choices");choices.replaceChildren();q.choices.forEach((choice,index)=>{const button=document.createElement("button");button.className="choice";button.textContent=choice;button.addEventListener("click",()=>answer(index));choices.append(button)});
  }
  function answer(selectedIndex){
    const q=state.deck[state.index];const correct=selectedIndex===q.correctIndex;playResultSound(correct);const buttons=[...$("choices").children];buttons.forEach((button,index)=>{button.disabled=true;if(index===q.correctIndex)button.classList.add("correct");if(index===selectedIndex&&!correct)button.classList.add("wrong")});if(correct)state.score++;
    state.answers.push({id:q.id,question:q.question,selected:q.choices[selectedIndex],correct:q.answer,isCorrect:correct});const feedback=$("feedback");feedback.className=`feedback ${correct?"correct":"wrong"}`;feedback.textContent=correct?"正解！":`残念！ 正解は「${q.answer}」`;$("next-button").textContent=state.index===state.deck.length-1?"結果を見る":"次の問題";$("next-button").classList.remove("hidden");
  }
  function next(){state.index++;if(state.index<state.deck.length)renderQuestion();else finish()}
  function finish(){
    const duration=Math.max(1,Math.round((Date.now()-state.startedAt)/1000));const wrong=state.answers.filter(x=>!x.isCorrect);const result={score:state.score,total:state.deck.length,rate:Math.round(state.score/state.deck.length*100),durationSeconds:duration,wrong};
    if(state.mode==="main"){state.mainResult=result;const progress=loadProgress();progress.history.push({completedAt:new Date().toISOString(),dateKey:localDateKey(),score:result.score,total:result.total,rate:result.rate,durationSeconds:duration,scope:state.scope,scopeLabel:SCOPE_LABELS[state.scope]});progress.history=progress.history.slice(-100);saveProgress(progress)}
    renderResult(result,state.mode);showScreen("result");
  }
  function renderResult(result,mode){
    $("result-title").textContent=mode==="review"?"復習完了！":result.rate===100?"全問正解！":result.rate>=80?"よくできました！":"もう一度がんばろう！";$("result-score").textContent=`${result.score} / ${result.total}`;$("result-rate").textContent=`正答率 ${result.rate}%`;$("result-time").textContent=`所要時間 ${formatDuration(result.durationSeconds)}`;
    const section=$("wrong-section");section.replaceChildren();if(result.wrong.length){const h=document.createElement("h2");h.textContent=`間違えた問題（${result.wrong.length}問）`;section.append(h);result.wrong.forEach(item=>{const div=document.createElement("div");div.className="wrong-item";div.innerHTML=`<strong>${item.question}</strong><p class="wrong-answer">あなたの答え：${item.selected}</p><p class="correct-answer">正解：${item.correct}</p>`;section.append(div)})}else section.innerHTML='<p class="empty">間違えた問題はありません。</p>';
    const review=$("review-button");const canReview=mode==="main"&&result.wrong.length>0;review.classList.toggle("hidden",!canReview);if(canReview)review.textContent=`間違えた${result.wrong.length}問をもう一度`;
  }
  function goHome(){renderHome();showScreen("home")}

  document.querySelectorAll("[data-scope]").forEach(button=>button.addEventListener("click",()=>selectScope(button.dataset.scope)));
  document.querySelectorAll("[data-question-count]").forEach(button=>button.addEventListener("click",()=>startMain(button.dataset.questionCount)));
  $("next-button").addEventListener("click",next);$("review-button").addEventListener("click",startReview);$("home-button").addEventListener("click",goHome);$("quit-button").addEventListener("click",()=>{if(confirm("クイズを途中でやめてTOPへ戻りますか？"))goHome()});$("clear-history-button").addEventListener("click",()=>{if(confirm("これまでの記録をすべて消しますか？")){saveProgress({version:1,history:[]});renderHome()}});$("sound-enabled").addEventListener("change",event=>{settings.soundEnabled=event.target.checked;saveSettings();renderSoundSettings()});$("sound-volume").addEventListener("input",event=>{settings.soundVolume=Number(event.target.value)/100;saveSettings();renderSoundSettings()});
  validateQuestions();renderSoundSettings();renderHome();
})();
