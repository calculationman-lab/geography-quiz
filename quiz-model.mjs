import {validateCatalog} from './places-model.mjs';
import {rankingRows} from './collections-model.mjs';

export function validateQuiz(data,catalog,collections,regions) {
  if(data?.schemaVersion!==1||!Array.isArray(data.questions)||!data.questions.length)throw Error('クイズの形式を確認してください。');
  const merged={...catalog,places:[...catalog.places,...data.places],sources:[...catalog.sources,...data.sources]};validateCatalog(merged);
  const places=new Map(merged.places.map(p=>[p.id,p])),regionIds=new Set(regions.map(r=>r.id)),sources=new Set(merged.sources.map(s=>s.id)),questionIds=new Set(),topics=new Set(data.topics.map(t=>t.id));
  for(const q of data.questions){
    const ids=q.targetType==='place'?new Set(places.keys()):q.targetType==='region'?regionIds:null;
    if(!ids||!q.id||questionIds.has(q.id)||!q.prompt||!q.explanation||!topics.has(q.topic)||q.answerFormat!=='map-any-one')throw Error('クイズの設問を確認してください。');
    questionIds.add(q.id);
    for(const list of [q.candidateIds,q.correctIds])if(!Array.isArray(list)||!list.length||new Set(list).size!==list.length||list.some(id=>!ids.has(id)))throw Error('回答のIDを確認してください。');
    if(q.correctIds.some(id=>!q.candidateIds.includes(id))||q.candidateIds.length<=q.correctIds.length)throw Error('正解と候補を確認してください。');
    if(q.targetType==='place'&&(!q.sourceIds.length||q.candidateIds.some(id=>places.get(id).category!==q.candidateCategory)))throw Error('候補の種類と出典を確認してください。');
    if(q.sourceIds.some(id=>!sources.has(id)))throw Error('出典が見つかりません。');
    if(q.rankingId){const c=collections.find(c=>c.id===q.rankingId);if(!c||!sameIds(q.correctIds,rankingRows(c).filter(r=>r.rank===q.rank).map(r=>r.placeId)))throw Error('同率の正解集合が一致しません。');}
    if(q.setId){const c=collections.find(c=>c.id===q.setId);if(!c||!sameIds(q.correctIds,c.entries.map(e=>e.placeId)))throw Error('代表セットの正解集合が一致しません。');}
  }
  const titles=new Set();for(const t of data.titles){if(!t.id?.startsWith('map-')||titles.has(t.id)||!t.name||!t.description)throw Error('地図称号を確認してください。');titles.add(t.id);if(t.requiredQuestionIds?.some(id=>!questionIds.has(id))||(!t.requiredQuestionIds?.length&&t.requiredStreak!==10))throw Error('称号条件を確認してください。');}
  return merged;
}
export const sameIds=(a,b)=>a.length===b.length&&a.every(id=>b.includes(id));
export function shuffle(items,random=Math.random){const result=[...items];for(let i=result.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[result[i],result[j]]=[result[j],result[i]];}return result;}
export function emptyProgress(){return {version:1,revision:0,answered:0,firstCorrect:0,solved:0,revealed:0,bestStreak:0,masteredIds:[],active:null,history:[]};}
export function earnedTitles(progress,titles){return titles.filter(t=>t.requiredQuestionIds?t.requiredQuestionIds.every(id=>progress.masteredIds.includes(id)):progress.bestStreak>=t.requiredStreak);}
export function startSession(progress,data,topic,count,random=Math.random,id=globalThis.crypto.randomUUID()){
  if(progress.active)throw Error('続きの挑戦があります。');
  const pool=data.questions.filter(q=>topic==='mix'||q.topic===topic);if(!pool.length)throw Error('このテーマは出題できません。');
  const questions=shuffle(pool,random).slice(0,count==='all'?pool.length:Math.min(count,pool.length));
  progress.active={id,topic,questionIds:questions.map(q=>q.id),choices:questions.map(q=>shuffle(q.candidateIds,random)),index:0,phase:'asking',attemptIds:[],revealed:false,streak:0,results:[]};return progress.active;
}
export function currentQuestion(progress,data){return progress.active?data.questions.find(q=>q.id===progress.active.questionIds[progress.active.index]):null;}
function complete(progress,q,kind){
  const a=progress.active,firstCorrect=kind==='correct'&&a.attemptIds.length===1&&!a.revealed;
  const result={questionId:q.id,selectedId:a.attemptIds.at(-1)??null,attempts:a.attemptIds.length,firstCorrect,solved:kind==='correct',revealed:kind==='revealed',abandoned:kind==='abandoned'};
  a.results.push(result);a.phase='feedback';progress.answered++;
  if(result.solved)progress.solved++;if(result.revealed)progress.revealed++;
  if(firstCorrect){progress.firstCorrect++;a.streak++;progress.bestStreak=Math.max(progress.bestStreak,a.streak);if(!progress.masteredIds.includes(q.id))progress.masteredIds.push(q.id);}else a.streak=0;
  return result;
}
export function answer(progress,data,id){
  const a=progress.active,q=currentQuestion(progress,data);if(!a||a.phase!=='asking'||!q.candidateIds.includes(id)||a.attemptIds.length>=100)return {status:'ignored'};
  a.attemptIds.push(id);
  if(!q.correctIds.includes(id)){a.streak=0;return {status:'wrong'};}
  return {status:'correct',result:complete(progress,q,'correct')};
}
export function reveal(progress,data){const a=progress.active;if(!a||a.phase!=='asking')return {status:'ignored'};a.revealed=true;a.streak=0;return {status:'revealed',result:complete(progress,currentQuestion(progress,data),'revealed')};}
function archive(progress,completed){const a=progress.active;const summary={id:a.id,topic:a.topic,total:a.questionIds.length,completed,results:a.results};progress.history.push(summary);progress.history=progress.history.slice(-20);progress.active=null;return summary;}
export function nextQuestion(progress){const a=progress.active;if(!a||a.phase!=='feedback')return null;if(a.index+1===a.questionIds.length)return archive(progress,true);a.index++;a.phase='asking';a.attemptIds=[];a.revealed=false;return null;}
export function abandon(progress,data){if(!progress.active)return null;if(progress.active.phase==='asking')complete(progress,currentQuestion(progress,data),'abandoned');return archive(progress,false);}
export function validateProgress(p,data){
  if(!p||p.version!==1)throw Error('保存形式が異なります。');
  for(const key of ['revision','answered','firstCorrect','solved','revealed','bestStreak'])if(!Number.isSafeInteger(p[key])||p[key]<0)throw Error('保存値が不正です。');
  const ids=new Set(data.questions.map(q=>q.id));
  if(!Array.isArray(p.masteredIds)||p.masteredIds.some(id=>!ids.has(id))||new Set(p.masteredIds).size!==p.masteredIds.length||!Array.isArray(p.history)||p.history.length>20)throw Error('保存履歴が不正です。');
  if(p.firstCorrect>p.solved||p.solved+p.revealed>p.answered||p.bestStreak>p.firstCorrect)throw Error('保存集計が不正です。');
  const checkResult=r=>{const q=data.questions.find(q=>q.id===r.questionId);if(!q||!Number.isInteger(r.attempts)||r.attempts<0||r.attempts>100||['firstCorrect','solved','revealed','abandoned'].some(k=>typeof r[k]!=='boolean')||[r.solved,r.revealed,r.abandoned].filter(Boolean).length!==1||r.firstCorrect&&(!r.solved||r.attempts!==1)||r.solved&&!q.correctIds.includes(r.selectedId)||r.selectedId!==null&&!q.candidateIds.includes(r.selectedId))throw Error('回答履歴が不正です。');};
  for(const h of p.history){if(!h.id||typeof h.completed!=='boolean'||!Number.isInteger(h.total)||h.total<1||!Array.isArray(h.results)||h.results.length>h.total||h.completed&&h.results.length!==h.total)throw Error('挑戦履歴が不正です。');h.results.forEach(checkResult);}
  const a=p.active;if(a!==null){
    if(!a||!a.id||!Array.isArray(a.questionIds)||!a.questionIds.length||new Set(a.questionIds).size!==a.questionIds.length||a.questionIds.some(id=>!ids.has(id))||!Number.isInteger(a.index)||a.index<0||a.index>=a.questionIds.length||!['asking','feedback'].includes(a.phase)||!Array.isArray(a.choices)||a.choices.length!==a.questionIds.length||!Array.isArray(a.results)||a.results.length!==a.index+(a.phase==='feedback'?1:0)||!Number.isInteger(a.streak)||a.streak<0||a.streak>a.results.length||typeof a.revealed!=='boolean')throw Error('続きの保存が不正です。');
    a.choices.forEach((choices,i)=>{if(!Array.isArray(choices)||!sameIds(choices,data.questions.find(q=>q.id===a.questionIds[i]).candidateIds)||new Set(choices).size!==choices.length)throw Error('保存された候補が不正です。');});
    if(!Array.isArray(a.attemptIds)||a.attemptIds.length>100||a.attemptIds.some(id=>!currentQuestion(p,data).candidateIds.includes(id)))throw Error('再挑戦履歴が不正です。');
    if(a.phase==='asking'&&(a.revealed||a.attemptIds.some(id=>currentQuestion(p,data).correctIds.includes(id))))throw Error('回答状態が不正です。');
    a.results.forEach((r,i)=>{checkResult(r);if(r.questionId!==a.questionIds[i])throw Error('問題順が不正です。');});
  }
  return p;
}
