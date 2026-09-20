import {resolveQuestionLinks,resolveMapLink} from './question-links-model.mjs';
const channel='social-master-map-link-v1';
export async function openLinkedMap({quizController,fetchAsset,showPlace}){
  const params=new URLSearchParams(location.search),embedded=params.get('embedded')==='1'&&parent!==window,$=id=>document.getElementById(id);
  const tell=type=>{if(embedded)parent.postMessage({channel,type},location.origin);};
  $('linked-context').hidden=false;document.body.dataset.linkedMap='true';
  if(embedded){document.body.dataset.embedded='true';$('linked-return').hidden=true;document.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();tell('close');}});}
  $('linked-return').addEventListener('click',()=>{location.href='../index.html';});
  $('linked-repeat').hidden=true;
  try{
    if(!quizController)throw Error('Quiz unavailable');
    const [data,quiz]=await Promise.all([fetchAsset('./question-links.json'),fetchAsset('./quiz.json')]);
    await import('../questions.js?v=20260920-v11-2');await import('../lower-questions.js?v=20260920-v11-2');
    const link=resolveMapLink(resolveQuestionLinks(data,window.GEOGRAPHY_QUESTIONS,quiz),params.get('fromQuestion'),params.get('target'));
    if(!link)throw Error('Link unavailable');
    $('linked-source').textContent=`通常問題：${link.question.question}`;
    $('linked-note').textContent=(link.relation==='answer'?'答えの場所を地図で探します。':'問題に出てきた場所を地図で探します。')+(link.note?' '+link.note:'');
    $('linked-credit').textContent='関連する場所の練習です。記録や称号には加算しません。';
    const start=async()=>{$('linked-repeat').disabled=true;try{await quizController.startLinked({questionId:link.mapQuestionId,onExplore(){requestAnimationFrame(()=>requestAnimationFrame(()=>showPlace(link.placeId)));$('linked-repeat').hidden=false;document.body.dataset.linkedState='study';}});document.body.dataset.linkedState='quiz';tell('ready');}catch{document.body.dataset.linkedState='error';$('linked-note').textContent='地図練習を読み込めませんでした。図鑑や元の問題はそのまま使えます。';tell('error');}finally{$('linked-repeat').disabled=false;}};
    $('linked-repeat').addEventListener('click',start);await start();
  }catch{document.body.dataset.linkedState='error';$('linked-source').textContent='この問題と地図の関連を確認できませんでした。';$('linked-note').textContent='図鑑はそのまま使えます。元の問題からもう一度開いてください。';tell('error');}
}
