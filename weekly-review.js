/* 直近168時間の誤答。正解しても期間内は再練習できる。 */
(function(){
  "use strict";
  const WINDOW_MS=7*24*60*60*1000;
  function clean(raw,questions,now=Date.now()){
    const valid=new Set(questions.map(q=>q.id)),result={version:1,choice:{},written:{}};
    for(const type of ["choice","written"]){
      const records=raw?.[type];
      if(!records||typeof records!=="object"||Array.isArray(records))continue;
      for(const [id,at] of Object.entries(records)){
        if(valid.has(id)&&Number.isFinite(at)&&at>now-WINDOW_MS&&at<=now)result[type][id]=at;
      }
    }
    return result;
  }
  function record(progress,type,id,questions,now=Date.now()){
    const records=clean(progress.weeklyMistakes,questions,now);
    if(["choice","written"].includes(type)&&questions.some(q=>q.id===id))records[type][id]=now;
    return {...progress,weeklyMistakes:records};
  }
  function pool(progress,type,questions,now=Date.now()){
    const records=clean(progress.weeklyMistakes,questions,now)[type]||{};
    return questions.filter(q=>Object.prototype.hasOwnProperty.call(records,q.id));
  }
  window.WeeklyReview={clean,record,pool};
})();
