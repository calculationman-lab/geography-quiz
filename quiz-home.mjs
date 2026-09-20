import {validateProgress,earnedTitles} from './quiz-model.mjs';
import {STORAGE_KEY} from './quiz-store.mjs';
const host=document.getElementById('map-quiz-home');
let data;
async function render(){
  if(!host)return;
  try{const raw=localStorage.getItem(STORAGE_KEY);host.replaceChildren();if(raw===null)return;
    data??=await fetch('./map3d/quiz.json').then(r=>{if(!r.ok)throw Error('Quiz unavailable');return r.json();});
    const p=validateProgress(JSON.parse(raw),data),heading=document.createElement('strong');heading.textContent=`地図の記録：初回正解 ${p.firstCorrect}問 · 最高連続 ${p.bestStreak}問`;host.append(heading);
    for(const t of earnedTitles(p,data.titles)){const badge=document.createElement('span');badge.textContent=t.name;host.append(badge);}
    if(p.active){const link=document.createElement('a');link.href='./map3d/index.html';link.textContent=' 地図クイズの続きがあります';host.append(link);}
  }catch{host.textContent='地図の記録を読み込めません。地図クイズから確認できます。';}
}
window.addEventListener('map-study-return',render);window.addEventListener('pageshow',render);window.addEventListener('storage',e=>{if(e.key===STORAGE_KEY)render();});render();
