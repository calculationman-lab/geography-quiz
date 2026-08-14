const fs=require("fs"),vm=require("vm"),assert=require("assert"),path=require("path");

class ClassList{constructor(){this.values=new Set()}toggle(name,on){on?this.values.add(name):this.values.delete(name)}add(name){this.values.add(name)}remove(name){this.values.delete(name)}contains(name){return this.values.has(name)}}
class Element{
  constructor(id=""){this.id=id;this.dataset={};this.classList=new ClassList();this.style={};this.children=[];this.textContent="";this.innerHTML="";this.value="";this.checked=false;this.nextElementSibling={textContent:""};this.listeners={}}
  addEventListener(type,fn){this.listeners[type]=fn}
  setAttribute(name,value){this[name]=value}
  replaceChildren(){this.children=[];this.innerHTML=""}
  append(...children){this.children.push(...children)}
  click(){this.listeners.click?.({target:this})}
}
const ids=["home-screen","quiz-screen","result-screen","sound-enabled","sound-volume","sound-volume-value","question-total","all-question-label","written-all-question-label","today-status","history-list","written-history-list","choices","written-panel","written-instruction","reveal-answer-button","written-answer","self-grade-buttons","region","progress","progress-bar","question","feedback","next-button","review-button","result-title","result-score","result-rate","written-result-summary","result-time","wrong-section","home-button","quit-button","clear-history-button","unit-selector","unit-selection-summary","select-all-units","clear-units","unit-options","summer-region-selector","summer-region-selection-summary","select-all-summer-regions","clear-summer-regions","summer-region-options","choice-challenge-options","written-challenge-options","rank-emblem","current-rank","rank-progress","rank-toggle","rank-toggle-icon","rank-details","choice-mastery-count","written-mastery-count","summer-choice-mastery-count","summer-written-mastery-count","next-rank","unit-mastery-grid","summer-mastery-grid","unit-mastery-detail","recent-title","achievement-banner","export-save-button","import-save-button","import-save-file","backup-status"];
const elements=Object.fromEntries(ids.map(id=>[id,new Element(id)]));
elements["rank-details"].classList.add("hidden");
const scopeButtons=["first","summer","all"].map(scope=>{const el=new Element();el.dataset.scope=scope;return el});
const countButtons=["20","50","all"].map(count=>{const el=new Element();el.dataset.questionCount=count;return el});
const writtenCountButtons=["10","20","all"].map(count=>{const el=new Element();el.dataset.writtenCount=count;return el});
const typeButtons=["choice","written"].map(type=>{const el=new Element();el.dataset.quizType=type;return el});
const gradeButtons=["correct","partial","wrong"].map(grade=>{const el=new Element();el.dataset.selfGrade=grade;return el});
const scopeCounts=Object.fromEntries(["first","summer","all"].map(scope=>[scope,new Element()]));
const oldProgress={version:1,history:[{completedAt:"2026-08-13T12:00:00.000Z",dateKey:"2026-08-13",score:18,total:20,rate:90,durationSeconds:120}]};
const oldSettings={soundEnabled:false,soundVolume:0.35};
const store=new Map([["social-quiz-progress-v1",JSON.stringify(oldProgress)],["social-quiz-settings-v1",JSON.stringify(oldSettings)]]);
const document={
  getElementById:id=>elements[id],createElement:()=>new Element(),
  querySelectorAll:selector=>selector==="[data-scope]"?scopeButtons:selector==="[data-question-count]"?countButtons:selector==="[data-written-count]"?writtenCountButtons:selector==="[data-quiz-type]"?typeButtons:selector==="[data-self-grade]"?gradeButtons:[],
  querySelector:selector=>{const match=selector.match(/data-scope-count="(.*?)"/);return match?scopeCounts[match[1]]:null}
};
const context={window:{scrollTo(){},GEOGRAPHY_QUESTIONS:null},document,localStorage:{getItem:key=>store.get(key)||null,setItem:(key,value)=>store.set(key,value)},Audio:function(){return{preload:"",pause(){},play(){return{catch(){}}},currentTime:0,volume:0}},confirm:()=>true,Date,Math,JSON,Number,Set,Array,Object,String,console};
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(__dirname,"..","questions.js"),"utf8"),context);
vm.runInContext(fs.readFileSync(path.join(__dirname,"..","app.js"),"utf8"),context);

assert.strictEqual(elements["history-list"].children.length,1,"v5履歴を表示");
assert.strictEqual(elements["sound-enabled"].checked,false,"v5効果音設定を維持");
assert.strictEqual(elements["sound-volume"].value,35,"v5音量設定を維持");
assert.strictEqual(elements["question-total"].textContent,450,"初期範囲は前期");
assert.strictEqual(elements["unit-options"].children.length,17,"前期17単元を表示");
assert(elements["rank-details"].classList.contains("hidden"),"攻略詳細は初期状態で閉じる");
elements["rank-toggle"].click();
assert(!elements["rank-details"].classList.contains("hidden"),"攻略ランクを押すと詳細を開く");
assert.strictEqual(elements["rank-toggle-icon"].textContent,"▲","展開中の矢印");
elements["rank-toggle"].click();
assert(elements["rank-details"].classList.contains("hidden"),"もう一度押すと詳細を閉じる");
elements["clear-units"].click();
assert.strictEqual(elements["question-total"].textContent,0,"全解除で0問");
assert.strictEqual(countButtons.every(button=>button.disabled),true,"0問では開始不可");
elements["unit-options"].children[0].click();
assert.strictEqual(elements["question-total"].textContent,25,"単元1だけを選択");
assert.strictEqual(countButtons.find(x=>x.dataset.questionCount==="50").disabled,true,"不足時は50問を無効化");
elements["select-all-units"].click();
assert.strictEqual(elements["question-total"].textContent,450,"全17単元を再選択");
scopeButtons.find(x=>x.dataset.scope==="summer").click();
assert.strictEqual(elements["question-total"].textContent,139,"夏期範囲へ切替");
const savedSettings=JSON.parse(store.get("social-quiz-settings-v1"));
assert.strictEqual(savedSettings.soundEnabled,false,"設定保存後も効果音を維持");
assert.strictEqual(savedSettings.soundVolume,0.35,"設定保存後も音量を維持");
assert.strictEqual(savedSettings.lastScope,"summer","v6範囲設定を追加");
assert.strictEqual(savedSettings.selectedUnits.length,17,"v7単元設定を追加");
assert.strictEqual(savedSettings.lastQuizType,"choice","旧設定は4択を初期値にする");
countButtons.find(x=>x.dataset.questionCount==="20").click();
assert.strictEqual(elements.progress.textContent,"1 / 20","夏期20問を開始");
assert(elements.region.textContent.startsWith("夏期・"),"夏期タグを表示");
assert.strictEqual(elements.choices.children.length,4,"4択を表示");
assert.deepStrictEqual(JSON.parse(store.get("social-quiz-progress-v1")),oldProgress,"開始時に旧履歴を書き換えない");
for(let index=0;index<20;index++){
  const source=context.window.GEOGRAPHY_QUESTIONS.find(q=>q.question===elements.question.textContent);
  const wrong=elements.choices.children.find(choice=>choice.textContent!==source.answer);
  wrong.click();elements["next-button"].click();
}
const savedProgress=JSON.parse(store.get("social-quiz-progress-v1"));
assert.strictEqual(savedProgress.history.length,2,"旧履歴へv7結果を追記");
assert.strictEqual(savedProgress.history[1].scopeLabel,"夏期講習・全地域","履歴へ範囲名を保存");
assert(!elements["review-button"].classList.values.has("hidden"),"誤答復習を表示");
elements["review-button"].click();
assert.strictEqual(elements.progress.textContent,"1 / 20","誤答20問の復習を開始");
assert(elements.region.textContent.startsWith("復習・夏期・"),"復習タグを表示");
elements["quit-button"].click();
scopeButtons.find(x=>x.dataset.scope==="all").click();
countButtons.find(x=>x.dataset.questionCount==="all").click();
assert.strictEqual(elements.progress.textContent,"1 / 589","全範囲589問を開始");
elements["quit-button"].click();
typeButtons.find(x=>x.dataset.quizType==="written").click();
writtenCountButtons.find(x=>x.dataset.writtenCount==="10").click();
assert.strictEqual(elements.progress.textContent,"1 / 10","記述10問を開始");
assert(elements.choices.classList.values.has("hidden"),"記述では選択肢を隠す");
for(let index=0;index<10;index++){
  elements["reveal-answer-button"].click();
  assert(elements["written-answer"].textContent.startsWith("正解："),"答えを見るまで正解を分離");
  gradeButtons[index===0?0:index===1?1:2].click();elements["next-button"].click();
}
const afterWritten=JSON.parse(store.get("social-quiz-progress-v1"));
const writtenRecord=afterWritten.history.at(-1);
assert.strictEqual(writtenRecord.quizType,"written","記述履歴を分離");
assert.strictEqual(writtenRecord.correctCount,1,"○を記録");
assert.strictEqual(writtenRecord.partialCount,1,"△を独立記録");
assert.strictEqual(writtenRecord.wrongCount,8,"×を記録");
assert.strictEqual(elements["written-history-list"].children.length,0,"結果画面では履歴未再描画");
elements["home-button"].click();
assert.strictEqual(elements["written-history-list"].children.length,1,"TOPで記述履歴を別表示");

// v9: 1単元の全問チャレンジだけが制覇対象
scopeButtons.find(x=>x.dataset.scope==="first").click();
elements["clear-units"].click();elements["unit-options"].children[0].click();
typeButtons.find(x=>x.dataset.quizType==="choice").click();
countButtons.find(x=>x.dataset.questionCount==="20").click();
for(let index=0;index<20;index++){
  const source=context.window.GEOGRAPHY_QUESTIONS.find(q=>q.question===elements.question.textContent);
  elements.choices.children.find(choice=>choice.textContent===source.answer).click();elements["next-button"].click();
}
assert.strictEqual(store.has("social-quiz-mastery-v1"),false,"20問では制覇判定しない");
elements["home-button"].click();countButtons.find(x=>x.dataset.questionCount==="all").click();
for(let index=0;index<25;index++){
  const source=context.window.GEOGRAPHY_QUESTIONS.find(q=>q.question===elements.question.textContent);
  elements.choices.children.find(choice=>choice.textContent===source.answer).click();elements["next-button"].click();
}
let mastery=JSON.parse(store.get("social-quiz-mastery-v1"));
assert.strictEqual(mastery.units["1"].choiceMastered,true,"単元1の4択全問正解で制覇");
assert.strictEqual(mastery.units["1"].choiceBest,25,"4択最高正解数");
assert.strictEqual(mastery.units["1"].choiceBestRate,100,"4択最高正答率");
assert(!elements["achievement-banner"].classList.values.has("hidden"),"称号獲得演出を表示");
elements["home-button"].click();
assert.strictEqual(elements["current-rank"].textContent,"知識の冒険者","1単元制覇でランクアップ");
typeButtons.find(x=>x.dataset.quizType==="written").click();writtenCountButtons.find(x=>x.dataset.writtenCount==="all").click();
for(let index=0;index<25;index++){elements["reveal-answer-button"].click();gradeButtons[0].click();elements["next-button"].click()}
mastery=JSON.parse(store.get("social-quiz-mastery-v1"));
assert.strictEqual(mastery.units["1"].writtenMastered,true,"単元1の記述全問○で制覇");
assert.strictEqual(mastery.units["1"].writtenBestRate,100,"記述最高○率");
assert(elements["achievement-banner"].children.some(x=>x.textContent.includes("極称号獲得")),"極称号獲得演出を表示");

// v9.1: 夏期講習も1地域の全問チャレンジで称号対象
elements["home-button"].click();scopeButtons.find(x=>x.dataset.scope==="summer").click();
assert.strictEqual(elements["summer-region-options"].children.length,7,"夏期7地域を表示");
elements["clear-summer-regions"].click();elements["summer-region-options"].children[0].click();
assert.strictEqual(elements["question-total"].textContent,19,"北海道・東北だけを選択");
mastery=JSON.parse(store.get("social-quiz-mastery-v1"));
for(const region of ["関東","中部","近畿","中国","四国","九州・沖縄"]){mastery.summerRegions[region]={choiceMastered:true,writtenMastered:true,choiceMasteredAt:"2026-08-14T01:00:00.000Z",writtenMasteredAt:"2026-08-14T01:01:00.000Z",fullMasteredAt:"2026-08-14T01:01:00.000Z"}}
store.set("social-quiz-mastery-v1",JSON.stringify(mastery));
typeButtons.find(x=>x.dataset.quizType==="choice").click();countButtons.find(x=>x.dataset.questionCount==="all").click();
for(let index=0;index<19;index++){
  const source=context.window.GEOGRAPHY_QUESTIONS.find(q=>q.question===elements.question.textContent);
  elements.choices.children.find(choice=>choice.textContent===source.answer).click();elements["next-button"].click();
}
mastery=JSON.parse(store.get("social-quiz-mastery-v1"));
assert.strictEqual(mastery.summerRegions["北海道・東北"].choiceMastered,true,"夏期地域の4択全問正解で制覇");
assert(elements["achievement-banner"].children.some(x=>x.textContent.includes("北国の覇者")),"夏期地域称号を表示");
assert(elements["achievement-banner"].children.some(x=>x.textContent.includes("七地方の覇者")),"夏期7地域制覇称号を表示");
elements["home-button"].click();
assert.strictEqual(elements["summer-choice-mastery-count"].textContent,"夏期4択 7／7","夏期4択制覇数をTOP表示");
assert.strictEqual(elements["summer-written-mastery-count"].textContent,"夏期記述 6／7","夏期記述制覇数をTOP表示");
typeButtons.find(x=>x.dataset.quizType==="written").click();writtenCountButtons.find(x=>x.dataset.writtenCount==="all").click();
for(let index=0;index<19;index++){elements["reveal-answer-button"].click();gradeButtons[0].click();elements["next-button"].click()}
mastery=JSON.parse(store.get("social-quiz-mastery-v1"));
assert.strictEqual(mastery.summerRegions["北海道・東北"].writtenMastered,true,"夏期地域の記述全問○で制覇");
assert(elements["achievement-banner"].children.some(x=>x.textContent.includes("極・北国の覇者")),"夏期地域の極称号を表示");
assert(elements["achievement-banner"].children.some(x=>x.textContent.includes("極・七地方の覇者")),"夏期7地域の極称号を表示");
for(let unit=2;unit<=17;unit++)mastery.units[String(unit)]={choiceMastered:true,writtenMastered:true,choiceMasteredAt:"2026-08-14T02:00:00.000Z",writtenMasteredAt:"2026-08-14T02:01:00.000Z",fullMasteredAt:"2026-08-14T02:01:00.000Z"};
store.set("social-quiz-mastery-v1",JSON.stringify(mastery));elements["home-button"].click();
assert.strictEqual(elements["current-rank"].textContent,"真・社会マスター","前期17単元と夏期7地域の完全制覇で最高位");
console.log("PASS: 旧版互換、前期・夏期の4択／記述制覇、称号・極称号・ランクを検証");
