export function resolveQuestionLinks(data,questions,mapQuiz){
  if(data?.schemaVersion!==1||!Array.isArray(data.links)||!Array.isArray(questions)||!Array.isArray(mapQuiz?.questions))throw Error('関連データの形式が異なります。');
  const bank=new Map(questions.map(q=>[q.id,q])),quiz=new Map(mapQuiz.questions.map(q=>[q.id,q])),seen=new Set(),links=new Map(),skipped=[];
  for(const entry of data.links){
    if(!entry?.questionId||seen.has(entry.questionId))throw Error('問題IDが重複しています。');seen.add(entry.questionId);
    const q=bank.get(entry.questionId);
    const valid=q&&entry.expected&&['question','answer','source','unit','region'].every(k=>q[k]===entry.expected[k])&&Array.isArray(entry.targets)&&entry.targets.length>0&&new Set(entry.targets.map(t=>t.placeId)).size===entry.targets.length;
    if(!valid){skipped.push(entry.questionId);continue;}
    const targets=entry.targets.filter(t=>{const m=quiz.get(t.mapQuestionId);return typeof t.label==='string'&&t.label.length>0&&typeof t.note==='string'&&['answer','context'].includes(t.relation)&&m?.targetType==='place'&&m.answerFormat==='map-any-one'&&m.correctIds.length===1&&m.correctIds[0]===t.placeId&&m.candidateIds.includes(t.placeId);});
    if(targets.length!==entry.targets.length){skipped.push(entry.questionId);continue;}
    links.set(entry.questionId,{question:q,targets});
  }
  return {links,skipped};
}
export function resolveMapLink(index,questionId,placeId){const link=index.links.get(questionId);if(!link)return null;const target=placeId?link.targets.find(t=>t.placeId===placeId):link.targets[0];return target?{question:link.question,...target}:null;}
export function linkedMapURL(base,target){const url=new URL('./map3d/index.html',base);url.searchParams.set('fromQuestion',target.question.id);url.searchParams.set('target',target.placeId);url.searchParams.set('embedded','1');return url;}
export function acceptsMapMessage(event,frame,origin){return event.source===frame&&event.origin===origin&&event.data?.channel==='social-master-map-link-v1'&&['ready','error','close'].includes(event.data.type);}
