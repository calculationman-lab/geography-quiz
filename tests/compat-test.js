const fs=require("fs"),vm=require("vm"),assert=require("assert"),path=require("path");

class ClassList{constructor(){this.values=new Set()}toggle(name,on){on?this.values.add(name):this.values.delete(name)}add(name){this.values.add(name)}remove(name){this.values.delete(name)}contains(name){return this.values.has(name)}}
class Element{
  constructor(id=""){this.id=id;this.dataset={};this.classList=new ClassList();this.style={setProperty(){}};this.children=[];this.textContent="";this.innerHTML="";this.value="";this.checked=false;this.nextElementSibling={textContent:""};this.listeners={}}
  addEventListener(type,fn){this.listeners[type]=fn}
  setAttribute(name,value){this[name]=value}
  replaceChildren(){this.children=[];this.innerHTML=""}
  append(...children){this.children.push(...children)}
  click(){this.listeners.click?.({target:this})}
}
const ids=["home-screen","quiz-screen","result-screen","sound-enabled","sound-volume","sound-volume-value","question-total","all-question-label","written-all-question-label","today-status","history-list","written-history-list","choices","written-panel","written-instruction","reveal-answer-button","written-answer","self-grade-buttons","region","progress","progress-bar","question","feedback","next-button","review-button","result-title","result-score","result-rate","written-result-summary","result-time","wrong-section","home-button","quit-button","clear-history-button","unit-selector","unit-selection-summary","select-all-units","clear-units","unit-options","summer-region-selector","summer-region-selection-summary","select-all-summer-regions","clear-summer-regions","summer-region-options","choice-challenge-options","written-challenge-options","rank-emblem","current-rank","rank-progress","rank-toggle","rank-toggle-icon","rank-details","choice-mastery-count","written-mastery-count","summer-choice-mastery-count","summer-written-mastery-count","next-rank","unit-mastery-grid","summer-mastery-grid","unit-mastery-detail","recent-title","achievement-banner","export-save-button","import-save-button","import-save-file","backup-status","parent-review-button","close-parent-panel","change-parent-pin","parent-review-summary","parent-pin-status","set-parent-pin","settings-parent-review","settings-status","settings-panel","parent-panel-status","parent-review-list","parent-panel","open-settings-button","close-settings-button","settings-export-save-button","settings-import-save-button"];
ids.push(...[...fs.readFileSync(path.join(__dirname,"..","index.html"),"utf8").matchAll(/id="([^"]+)"/g)].map(m=>m[1]).filter(id=>!ids.includes(id)));
const elements=Object.fromEntries(ids.map(id=>[id,new Element(id)]));
elements["rank-details"].classList.add("hidden");
const scopeButtons=["first","summer","second","all"].map(scope=>{const el=new Element();el.dataset.scope=scope;return el});
const countButtons=["20","50","all"].map(count=>{const el=new Element();el.dataset.questionCount=count;return el});
const writtenCountButtons=["10","20","all"].map(count=>{const el=new Element();el.dataset.writtenCount=count;return el});
const typeButtons=["choice","written"].map(type=>{const el=new Element();el.dataset.quizType=type;return el});
const gradeButtons=["correct","partial","wrong"].map(grade=>{const el=new Element();el.dataset.selfGrade=grade;return el});
const scopeCounts=Object.fromEntries(["first","summer","second","all"].map(scope=>[scope,new Element()]));
const oldProgress={version:1,history:[{completedAt:"2026-08-13T12:00:00.000Z",dateKey:"2026-08-13",score:18,total:20,rate:90,durationSeconds:120}]};
const oldSettings={soundEnabled:false,soundVolume:0.35};
const store=new Map([["social-quiz-progress-v1",JSON.stringify(oldProgress)],["social-quiz-settings-v1",JSON.stringify(oldSettings)]]);
const document={
  getElementById:id=>elements[id],createElement:()=>new Element(),
  querySelectorAll:selector=>selector==="[data-scope]"?scopeButtons:selector==="[data-question-count]"?countButtons:selector==="[data-written-count]"?writtenCountButtons:selector==="[data-quiz-type]"?typeButtons:selector==="[data-self-grade]"?gradeButtons:[],
  querySelector:selector=>{const match=selector.match(/data-scope-count="(.*?)"/);return match?scopeCounts[match[1]]:null}
};
const context={window:{scrollTo(){},GEOGRAPHY_QUESTIONS:null,SchoolCountdown:require('../countdown.js')},document,localStorage:{getItem:key=>store.get(key)||null,setItem:(key,value)=>store.set(key,value)},Audio:function(){return{preload:"",pause(){},play(){return{catch(){}}},currentTime:0,volume:0}},confirm:()=>true,prompt:()=>"1234",alert:()=>{},Date,Math,JSON,Number,Set,Array,Object,String,console,setTimeout:()=>1,clearTimeout:()=>{}};
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(__dirname,"..","questions.js"),"utf8"),context);
vm.runInContext(fs.readFileSync(path.join(__dirname,"..","lower-questions.js"),"utf8"),context);
vm.runInContext(fs.readFileSync(path.join(__dirname,"..","weekly-review.js"),"utf8"),context);
const appSource=fs.readFileSync(path.join(__dirname,"..","app.js"),"utf8");
vm.runInContext(appSource.replace(/\}\)\(\);\s*$/, 'window.__test={makeRound,loadMastery,loadSettings,exportSave,importSave};})();'),context);

assert.strictEqual(elements["history-list"].children.length,1,"v5履歴を表示");
assert.strictEqual(elements["sound-enabled"].checked,false,"v5効果音設定を維持");
assert.strictEqual(elements["sound-volume"].value,35,"v5音量設定を維持");
assert.strictEqual(context.window.__test.loadSettings().examDate,"2029-02-03","旧設定でも入試日を初期表示");
assert.strictEqual(context.window.__test.loadSettings().enrollmentYear,2023,"旧設定でも入学年度を初期表示");
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
assert.strictEqual(elements.progress.textContent,"1 / 729","全範囲729問を開始");
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
assert.strictEqual(mastery.units["1"].writtenPending,true,"単元1の記述全問○は親の承認待ち");
elements["parent-review-button"].click();
elements["parent-review-list"].children[0].children[0].children[0].click();
mastery=JSON.parse(store.get("social-quiz-mastery-v1"));
assert.strictEqual(mastery.units["1"].writtenMastered,true,"単元1の記述全問○で制覇");
assert.strictEqual(mastery.units["1"].writtenBestRate,100,"記述最高○率");
assert(elements["parent-panel-status"].textContent.includes("極・"),"親承認後に極称号を表示");

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
assert.strictEqual(mastery.summerRegions["北海道・東北"].writtenPending,true,"夏期地域の記述全問○は親の承認待ち");
elements["parent-review-list"].replaceChildren();elements["parent-review-button"].click();
const pendingSummer=elements["parent-review-list"].children.find(x=>x.innerHTML.includes("北海道・東北"));
pendingSummer.children[0].children[0].click();
mastery=JSON.parse(store.get("social-quiz-mastery-v1"));
assert.strictEqual(mastery.summerRegions["北海道・東北"].writtenMastered,true,"夏期地域の記述全問○で制覇");
assert(elements["parent-panel-status"].textContent.includes("極・七地方の覇者"),"親承認後に夏期7地域の極称号を表示");
for(let unit=2;unit<=17;unit++)mastery.units[String(unit)]={choiceMastered:true,writtenMastered:true,choiceMasteredAt:"2026-08-14T02:00:00.000Z",writtenMasteredAt:"2026-08-14T02:01:00.000Z",fullMasteredAt:"2026-08-14T02:01:00.000Z"};
store.set("social-quiz-mastery-v1",JSON.stringify(mastery));elements["home-button"].click();
assert.strictEqual(elements["current-rank"].textContent,"真・社会マスター","前期17単元と夏期7地域の完全制覇で最高位");
console.log("PASS: 旧版互換、前期・夏期の4択／記述制覇、称号・極称号・ランクを検証");

// v11: 下期の記録は前期・夏期と別に保存する。
const legacyUnits=JSON.stringify(mastery.units),legacySummer=JSON.stringify(mastery.summerRegions),legacyPin=mastery.parentPinHash;
scopeButtons.find(x=>x.dataset.scope==="second").click();
assert.strictEqual(elements["question-total"].textContent,140);
assert.strictEqual(elements["second-unit-options"].children.length,7);
assert(!elements["second-unit-selector"].classList.contains("hidden"));
assert(elements["unit-selector"].classList.contains("hidden"));
elements["clear-second-units"].click();
assert(countButtons.every(b=>b.disabled));
assert(writtenCountButtons.every(b=>b.disabled));
elements["second-unit-options"].children[0].click();
assert.strictEqual(elements["question-total"].textContent,20);
typeButtons.find(x=>x.dataset.quizType==="choice").click();

function completeChoice(count,wrongFirst=false){
  for(let i=0;i<count;i++){
    const q=context.window.GEOGRAPHY_QUESTIONS.find(q=>q.question===elements.question.textContent);
    assert(q,"表示した問題はデータに存在する");
    const button=elements.choices.children.find(b=>wrongFirst&&i===0?b.textContent!==q.answer:b.textContent===q.answer);
    button.click();
    if(q.source==="小4下期")assert(elements.feedback.textContent.includes(q.explanation),"下期は解説表示");
    elements["next-button"].click();
  }
}
countButtons.find(x=>x.dataset.questionCount==="20").click();completeChoice(20);
assert.strictEqual(context.window.__test.loadMastery().secondUnits["1"],undefined,"20問ボタンでは称号判定しない");
elements["home-button"].click();
countButtons.find(x=>x.dataset.questionCount==="all").click();completeChoice(20,true);
assert(!context.window.__test.loadMastery().secondUnits["1"].choiceMastered,"1問不正解では称号なし");
elements["review-button"].click();assert.strictEqual(elements.progress.textContent,"1 / 1");completeChoice(1);
assert(!context.window.__test.loadMastery().secondUnits["1"].choiceMastered,"復習の正解で称号にしない");
elements["home-button"].click();

for(let unit=1;unit<=7;unit++){
  elements["clear-second-units"].click();elements["second-unit-options"].children[unit-1].click();
  typeButtons.find(x=>x.dataset.quizType==="choice").click();
  countButtons.find(x=>x.dataset.questionCount==="all").click();
  assert(elements.region.textContent.startsWith(`下期・単元${unit}・教材p.`));
  completeChoice(20);
  assert.strictEqual(context.window.__test.loadMastery().secondUnits[String(unit)].choiceMastered,true);
  let h=JSON.parse(store.get("social-quiz-progress-v1")).history.at(-1);
  assert.strictEqual(h.scope,"second");assert.deepStrictEqual(h.secondUnits,[unit]);
  assert(h.scopeLabel.includes(`単元${unit}`));
  elements["home-button"].click();
  assert.strictEqual(elements["current-rank"].textContent,"真・社会マスター","下期追加で旧最高ランクを失わない");
  elements["second-mastery-grid"].children[unit-1].click();
  assert(elements["unit-mastery-detail"].textContent.includes(`下期 単元${unit}`));
  typeButtons.find(x=>x.dataset.quizType==="written").click();
  writtenCountButtons.find(x=>x.dataset.writtenCount==="all").click();
  for(let i=0;i<20;i++){elements["reveal-answer-button"].click();assert(elements["written-answer"].textContent.includes("\n"),"記述の答えにも解説");gradeButtons[0].click();elements["next-button"].click()}
  let r=context.window.__test.loadMastery().secondUnits[String(unit)];
  assert(r.writtenPending&&!r.writtenMastered,"自己判定だけでは記述制覇しない");
  elements["home-button"].click();assert(elements["parent-review-summary"].textContent.includes("1件"));
  elements["parent-review-button"].click();
  const box=elements["parent-review-list"].children.find(x=>x.innerHTML.includes(`下期 単元${unit} `));
  assert(box,"下期の承認待ちを表示");box.children[0].children[0].click();
  r=context.window.__test.loadMastery().secondUnits[String(unit)];
  assert(r.writtenMastered&&!r.writtenPending&&r.fullMasteredAt);
  assert(elements["parent-panel-status"].textContent.includes("極・"));
  elements["home-button"].click();
}
mastery=context.window.__test.loadMastery();
assert.strictEqual(JSON.stringify(mastery.units),legacyUnits);
assert.strictEqual(JSON.stringify(mastery.summerRegions),legacySummer);
assert.strictEqual(mastery.parentPinHash,legacyPin);
assert.strictEqual(elements["second-mastery-count"].textContent,"下期4択 7／7・記述 7／7");
assert.strictEqual(elements["summer-mastery-grid"].children.length,8,"夏期の総合アイコンも残る");
elements["summer-mastery-grid"].children[7].click();assert(elements["unit-mastery-detail"].innerHTML.includes("極・七地方の覇者"));

// 全問が同じ単元でも通常20問や複数単元選択は制覇判定しない。
const secondSnapshot=JSON.stringify(mastery.secondUnits);
elements["select-all-second-units"].click();typeButtons.find(x=>x.dataset.quizType==="choice").click();
countButtons.find(x=>x.dataset.questionCount==="all").click();completeChoice(140);
assert.strictEqual(JSON.stringify(context.window.__test.loadMastery().secondUnits),secondSnapshot);
elements["home-button"].click();

// 下期の親承認を取り消しても前期・夏期の承認を変更しない。
elements["parent-review-button"].click();
elements["parent-review-list"].children.find(x=>x.innerHTML.includes("下期 単元1 ")).children[0].children[0].click();
assert.strictEqual(context.window.__test.loadMastery().secondUnits["1"].writtenMastered,false);
assert.strictEqual(JSON.stringify(context.window.__test.loadMastery().units),legacyUnits);
assert.strictEqual(JSON.stringify(context.window.__test.loadMastery().summerRegions),legacySummer);

// アプリ本体の makeRound を全729問で100回ずつ検査する。
for(const q of context.window.GEOGRAPHY_QUESTIONS){
  for(let i=0;i<100;i++){
    const round=context.window.__test.makeRound(q);
    assert.strictEqual(round.choices.length,4);assert.strictEqual(new Set(round.choices).size,4);
    assert.strictEqual(round.choices[round.correctIndex],q.answer);
    assert.strictEqual(round.choices.filter(c=>c===q.answer).length,1);
    assert(round.choices.every(c=>q.choices.includes(c)));
  }
}

// 実際のバックアップ関数を使う。ダウンロード・再読み込みはモック化。
let exportedBlob,reloaded=0;
context.Blob=Blob;context.URL={createObjectURL(blob){exportedBlob=blob;return"blob:test"},revokeObjectURL(){}};
context.setTimeout=fn=>fn();context.location={reload(){reloaded++}};
document.body={append(){}};Element.prototype.remove=function(){};
(async()=>{
  context.window.__test.exportSave();
  const backup=JSON.parse(await exportedBlob.text());
  assert.strictEqual(backup.mastery.parentPinHash,legacyPin);
  assert.strictEqual(Object.keys(backup.mastery.secondUnits).length,7);
  assert.strictEqual(backup.settings.selectedSecondUnits.length,7);
  const oldBackup={...backup,progress:oldProgress,settings:oldSettings,mastery:{version:1,units:backup.mastery.units,summerRegions:backup.mastery.summerRegions,parentPinHash:legacyPin}};
  await context.window.__test.importSave({text:async()=>JSON.stringify(oldBackup)});
  assert.strictEqual(reloaded,1);
  assert.deepStrictEqual(JSON.parse(store.get("social-quiz-progress-v1")),oldProgress);
  assert.strictEqual(context.window.__test.loadSettings().selectedSecondUnits.length,7,"旧バックアップには下期全選択を補完");
  assert.strictEqual(Object.keys(context.window.__test.loadMastery().secondUnits).length,0,"旧バックアップに下期制覇を捏造しない");
  await context.window.__test.importSave({text:async()=>JSON.stringify(backup)});
  assert.strictEqual(reloaded,2);
  assert.deepStrictEqual(JSON.parse(store.get("social-quiz-mastery-v1")),backup.mastery);
  assert.deepStrictEqual(JSON.parse(store.get("social-quiz-settings-v1")),backup.settings);
  assert.deepStrictEqual(JSON.parse(store.get("social-quiz-progress-v1")),backup.progress);
  const saved=JSON.stringify([...store]);
  await context.window.__test.importSave({text:async()=>"not json"});
  assert.strictEqual(JSON.stringify([...store]),saved,"壊れたバックアップは保存データを変えない");
  console.log("PASS: 下期7単元の4択・記述・承認・取消・履歴、旧記録/PIN維持、旧新バックアップ復元、本体72,900回抽出");
})().catch(error=>{console.error(error);process.exitCode=1});
