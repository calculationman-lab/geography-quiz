const fs=require('fs'),vm=require('vm');
// 既存互換テストと同じ模擬画面を使い、アプリ本体のイベントを検証する。
let harness=fs.readFileSync(__dirname+'/compat-test.js','utf8').split('assert.strictEqual(elements["history-list"]')[0];
harness=harness.replace('makeRound,loadMastery,loadSettings,exportSave,importSave','makeRound,loadMastery,loadSettings,exportSave,importSave,state,renderHome,startMain,answerChoice,answerWritten,next,goHome');
const checks=String.raw`
const api=context.window.__test,weekly=context.window.WeeklyReview,qs=context.window.GEOGRAPHY_QUESTIONS;
const idsBySource=['小4前期','夏期講習','小4下期'].map(source=>qs.find(q=>q.source===source).id);
const now=Date.now(),week=7*24*60*60*1000;
const raw={choice:{[idsBySource[0]]:now-week+1,[idsBySource[1]]:now-week,[idsBySource[2]]:now+1,missing:now},written:{[idsBySource[0]]:'invalid',[idsBySource[1]]:now}};
const clean=weekly.clean(raw,qs,now);
assert.deepStrictEqual(Object.keys(clean.choice),[idsBySource[0]],'168時間境界・未来・削除済みIDを除外');
assert.deepStrictEqual(Object.keys(clean.written),[idsBySource[1]],'不正時刻を除外');
assert.strictEqual(weekly.pool(oldProgress,'choice',qs,now).length,0,'旧点数から誤答を推測しない');
let p=weekly.record(oldProgress,'choice',idsBySource[0],qs,now-1000);
p=weekly.record(p,'choice',idsBySource[0],qs,now);
assert.strictEqual(weekly.pool(p,'choice',qs,now).length,1,'同じIDは重複しない');
assert.strictEqual(p.weeklyMistakes.choice[idsBySource[0]],now,'最後に誤答した時刻へ更新');
assert.strictEqual(weekly.pool(p,'written',qs,now).length,0,'4択・記述は分離');
assert.strictEqual(weekly.pool(p,'choice',qs,now+week).length,0,'正確に7日経過したら対象外');

// 通常学習の誤答を回答直後に保存。途中終了でも残る。
api.startMain(20,'choice');
let round=api.state.deck[0],bad=round.choices.findIndex(c=>c!==round.answer);
api.answerChoice(bad);
assert(JSON.parse(store.get('social-quiz-progress-v1')).weeklyMistakes.choice[round.id]);
elements['quit-button'].click();
assert(JSON.parse(store.get('social-quiz-progress-v1')).weeklyMistakes.choice[round.id]);
assert.strictEqual(JSON.parse(store.get('social-quiz-progress-v1')).history.length,1,'未完了の学習履歴は増やさない');

api.startMain(10,'written');
const partialId=api.state.deck[0].id;
elements['reveal-answer-button'].click();api.answerWritten('partial');api.next();
const wrongId=api.state.deck[1].id;
elements['reveal-answer-button'].click();api.answerWritten('wrong');api.next();
const correctId=api.state.deck[2].id;
elements['reveal-answer-button'].click();api.answerWritten('correct');elements['quit-button'].click();
let saved=JSON.parse(store.get('social-quiz-progress-v1'));
assert(saved.weeklyMistakes.written[partialId]&&saved.weeklyMistakes.written[wrongId]);
assert(!saved.weeklyMistakes.written[correctId],'○は新しい誤答にしない');

// 全範囲から抽出し、通常範囲の単元選択で除外しない。
const seededMastery={version:1,units:{'1':{choiceMastered:true,choiceBest:25,choiceTotal:25,choiceBestRate:100,writtenMastered:true,writtenBestRate:100}},secondUnits:{},summerRegions:{},parentPinHash:'test-pin-hash'};
store.set('social-quiz-mastery-v1',JSON.stringify(seededMastery));
p={...oldProgress,weeklyMistakes:{choice:Object.fromEntries(idsBySource.map(id=>[id,Date.now()])),written:{[partialId]:Date.now()}}};
store.set('social-quiz-progress-v1',JSON.stringify(p));api.state.selectedUnits=[];api.renderHome();
assert.strictEqual(elements['weekly-choice-count'].textContent,'3問');
assert.strictEqual(elements['weekly-written-count'].textContent,'1問');
const masteryBefore=store.get('social-quiz-mastery-v1');
const rankBefore=elements['current-rank'].textContent;
elements['weekly-choice-button'].click();
assert.strictEqual(api.state.sessionMode,'weekly');assert.strictEqual(api.state.deck.length,3);
assert.strictEqual(new Set(api.state.deck.map(q=>q.id)).size,3);assert(elements.region.textContent.startsWith('7日間復習・'));
for(let i=0;i<3;i++){const q=api.state.deck[api.state.index];api.answerChoice(q.correctIndex);api.next()}
saved=JSON.parse(store.get('social-quiz-progress-v1'));
assert.strictEqual(saved.history.at(-1).scope,'weekly');
assert.strictEqual(saved.history.at(-1).scopeLabel,'7日間復習・全範囲');
assert.strictEqual(saved.history.at(-1).units,undefined);
assert.strictEqual(saved.history.at(-1).secondUnits,undefined);
assert.strictEqual(saved.history.at(-1).summerRegions,undefined);
assert.strictEqual(saved.history.at(-1).score,3);
assert.strictEqual(store.get('social-quiz-mastery-v1'),masteryBefore,'復習で称号・PINを書き換えない');
api.goHome();assert.strictEqual(elements['weekly-choice-count'].textContent,'3問','正解後も期間内は再練習できる');
assert.strictEqual(elements['current-rank'].textContent,rankBefore,'既存の攻略ランクを維持');
assert.deepStrictEqual(saved.weeklyMistakes.choice,p.weeklyMistakes.choice,'正解しても最後の誤答時刻を延長しない');

elements['weekly-written-button'].click();
assert.strictEqual(api.state.quizType,'written');assert.strictEqual(api.state.deck.length,1);
elements['reveal-answer-button'].click();api.answerWritten('wrong');api.next();
assert(!elements['review-button'].classList.contains('hidden'),'週間復習の誤答もその場で再練習できる');
elements['review-button'].click();assert.strictEqual(api.state.sessionMode,'review');
elements['reveal-answer-button'].click();api.answerWritten('correct');api.next();api.goHome();
assert.strictEqual(store.get('social-quiz-mastery-v1'),masteryBefore);

// 新旧バックアップと履歴消去。
let exported,reloads=0;context.Blob=Blob;
context.URL={createObjectURL(b){exported=b;return 'blob:test'},revokeObjectURL(){}};
context.setTimeout=fn=>fn();context.location={reload(){reloads++}};
document.body={append(){}};Element.prototype.remove=function(){};
(async()=>{
api.exportSave();const backup=JSON.parse(await exported.text());
assert.strictEqual(Object.keys(backup.progress.weeklyMistakes.choice).length,3);
await api.importSave({text:async()=>JSON.stringify(backup)});
assert.deepStrictEqual(JSON.parse(store.get('social-quiz-progress-v1')).weeklyMistakes,backup.progress.weeklyMistakes,'誤答記録を復元');
await api.importSave({text:async()=>JSON.stringify({...backup,progress:oldProgress})});
assert.strictEqual(weekly.pool(JSON.parse(store.get('social-quiz-progress-v1')),'choice',qs).length,0,'旧バックアップには誤答なし');
await api.importSave({text:async()=>JSON.stringify(backup)});
elements['clear-history-button'].click();
assert.strictEqual(weekly.pool(JSON.parse(store.get('social-quiz-progress-v1')),'choice',qs).length,0);
assert(elements['weekly-choice-button'].disabled&&elements['weekly-written-button'].disabled);
assert.strictEqual(store.get('social-quiz-mastery-v1'),masteryBefore,'履歴消去でも既存の称号・PINを維持');
assert.strictEqual(reloads,3);
console.log('PASS: 7日境界・重複・型別抽出・途中終了・△×記録・全範囲復習・採点・称号不変・バックアップ・履歴消去');
})().catch(e=>{console.error(e);process.exitCode=1});
`;
vm.runInNewContext(harness+'\n'+checks,{require,__dirname,console,Blob,process});
