const fs=require("fs"),vm=require("vm"),assert=require("assert"),path=require("path");

class ClassList{constructor(){this.values=new Set()}toggle(name,on){on?this.values.add(name):this.values.delete(name)}add(name){this.values.add(name)}remove(name){this.values.delete(name)}}
class Element{
  constructor(id=""){this.id=id;this.dataset={};this.classList=new ClassList();this.style={};this.children=[];this.textContent="";this.innerHTML="";this.value="";this.checked=false;this.nextElementSibling={textContent:""};this.listeners={}}
  addEventListener(type,fn){this.listeners[type]=fn}
  setAttribute(name,value){this[name]=value}
  replaceChildren(){this.children=[];this.innerHTML=""}
  append(child){this.children.push(child)}
  click(){this.listeners.click?.({target:this})}
}
const ids=["home-screen","quiz-screen","result-screen","sound-enabled","sound-volume","sound-volume-value","question-total","all-question-label","written-all-question-label","today-status","history-list","written-history-list","choices","written-panel","written-instruction","reveal-answer-button","written-answer","self-grade-buttons","region","progress","progress-bar","question","feedback","next-button","review-button","result-title","result-score","result-rate","written-result-summary","result-time","wrong-section","home-button","quit-button","clear-history-button","unit-selector","unit-selection-summary","select-all-units","clear-units","unit-options","choice-challenge-options","written-challenge-options"];
const elements=Object.fromEntries(ids.map(id=>[id,new Element(id)]));
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
assert.strictEqual(savedProgress.history[1].scopeLabel,"夏期講習","履歴へ範囲名を保存");
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
console.log("PASS: v5/v6/v7互換、4択、記述○△×、履歴分離、全範囲を検証");
