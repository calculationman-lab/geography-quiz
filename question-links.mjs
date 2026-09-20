import {resolveQuestionLinks,resolveMapLink,linkedMapURL,acceptsMapMessage} from './question-links-model.mjs';
const $=id=>document.getElementById(id),host=$('map-linked-actions'),screen=$('quiz-screen'),dialog=$('map-learning-dialog'),frame=$('map-learning-frame');
let index,failed=false,opener,timeout;
function render(){
  host.replaceChildren();host.hidden=true;
  if(screen.classList.contains('hidden')||screen.dataset.mapAnswered!=='true')return;
  const id=screen.dataset.mapQuestionId,entry=index?.links.get(id);
  if(!entry){if(failed||index?.skipped.includes(id)){host.hidden=false;host.textContent='地図との関連を読み込めませんでした。通常の問題はそのまま続けられます。';}return;}
  host.hidden=false;const heading=document.createElement('strong');heading.textContent='地図でも確かめよう';host.append(heading);
  for(const t of entry.targets){const row=document.createElement('div'),button=document.createElement('button'),note=document.createElement('small');row.className='map-linked-row';button.type='button';button.dataset.mapTarget=t.placeId;button.textContent=`地図で${t.label}を探す`;note.textContent=t.relation==='answer'?'答えの場所を探します。':'問題に出てきた場所を探します。';button.addEventListener('click',()=>open(resolveMapLink(index,id,t.placeId),button));row.append(button,note);host.append(row);}
}
function close(){clearTimeout(timeout);if(dialog.open)dialog.close();frame.src='about:blank';frame.hidden=true;document.body.classList.remove('map-learning-open');opener?.focus({preventScroll:true});window.dispatchEvent(new Event('map-study-return'));}
function open(target,button){
  if(!target)return;opener=button;const url=linkedMapURL(location.href,target);if(new URLSearchParams(location.search).has('test'))url.searchParams.set('test','1');
  $('map-learning-title').textContent='地図で場所を探す';$('map-learning-status').textContent='地図を準備しています。';frame.hidden=false;frame.src=url.href;dialog.showModal();document.body.classList.add('map-learning-open');
  clearTimeout(timeout);timeout=setTimeout(()=>{$('map-learning-status').textContent='地図の準備に時間がかかっています。「元の問題へ戻る」で学習を続けられます。';},35000);
}
$('map-learning-close').addEventListener('click',close);dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
window.addEventListener('message',e=>{if(!dialog.open||!acceptsMapMessage(e,frame.contentWindow,location.origin))return;clearTimeout(timeout);if(e.data.type==='close')close();else $('map-learning-status').textContent=e.data.type==='ready'?'':'地図を開けませんでした。元の問題へ戻って続けられます。';});
new MutationObserver(render).observe(screen,{attributes:true,attributeFilter:['data-map-question-id','data-map-answered','class']});
try{const fetchJSON=async url=>{const r=await fetch(url,{signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error('Unavailable');return r.json();};const [data,quiz]=await Promise.all([fetchJSON('./map3d/question-links.json'),fetchJSON('./map3d/quiz.json')]);index=resolveQuestionLinks(data,window.GEOGRAPHY_QUESTIONS,quiz);document.body.dataset.questionLinksState='ready';}
catch{failed=true;document.body.dataset.questionLinksState='error';}
render();
