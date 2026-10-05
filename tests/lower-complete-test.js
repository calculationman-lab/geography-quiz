const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert'),crypto=require('crypto');
const root=path.join(__dirname,'..'),c={window:{}};vm.createContext(c);
for(const file of ['questions.js','lower-questions.js','lower-later-questions.js','lower-reading-questions.js','question-diagrams.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),c);
const qs=c.window.GEOGRAPHY_QUESTIONS,added=qs.filter(q=>q.objective&&q.unit>=8),diagrams=c.window.QuestionDiagrams;
assert.strictEqual(added.length,295);
assert.strictEqual(new Set(qs.map(q=>q.question.normalize('NFKC').replace(/\s/g,''))).size,qs.length,'正規化した問題文が完全重複しない');
assert.strictEqual(new Set(added.map(q=>q.objective)).size,added.length,'追加した学習内容の識別子が重複しない');
for(let unit=8;unit<=16;unit++)assert(added.filter(q=>q.unit===unit).length>=28,'後半全単元を収録');
for(const q of added){
 assert(q.sourcePage>=(q.unit-8)*8+1&&q.sourcePage<=(q.unit-7)*8,`${q.id}: 出典ページ`);
 assert.strictEqual(q.sourcePrintedPage,q.sourcePage+56);
 assert.strictEqual(q.sourceFile,'社会４下期後半スキャン_20261004-0957.pdf');
 assert(q.explanation&&q.answerType);
 const d=diagrams.get(q,false);
 if(q.question.includes('図の'))assert(d,`${q.id}: 図を必要とする設問は解答前に資料を表示`);
 if(d){assert(q.question.includes('図'),`${q.id}: 図を読む設問`);assert(d.skill,`${q.id}: 読む内容を指定`);assert.strictEqual(d.phase,'question');assert(!/正解|計算結果|答えは/.test(d.alt),`${q.id}: 資料の代替文に解答を書かない`);}
}
const expected={'forest-artificial-share':'40％','forest-type-compare':'針葉樹が2ポイント多い','forest-workers-change':'4.4万人','fish-nori-share':'47.0％','fish-pearl-gap':'9.7ポイント','fish-scallop-remaining':'31.9％','shipment-structure-read':'71.0%','chukyo-machine-read':'68.1%','crude-import-read':'83.7%','yen-import-calculation':'200円','yen-export-price':'1万2000ドル','trade-balance-calc':'15兆円の貿易赤字','cars-unit-conversion':'1004.9万台','cars-asia-increase':'229万台','bar-figure-difference':'15','bar-figure-total':'70','bar-figure-share':'50%','line-figure-net':'20'};
for(const [key,value]of Object.entries(expected))assert.strictEqual(added.find(q=>q.objective===key).answer,value,key);
const metadata=[...JSON.parse(fs.readFileSync(path.join(root,'qa/lower-complete/imagegen.json'),'utf8')),...JSON.parse(fs.readFileSync(path.join(root,'qa/question-figures/imagegen.json'),'utf8')),...JSON.parse(fs.readFileSync(path.join(root,'qa/firsthalf-reading/imagegen.json'),'utf8'))];
assert.strictEqual(metadata.length,26,'最初の14図と後半5・前半7の資料図');
for(const m of metadata){const data=fs.readFileSync(path.join(root,m.path));assert.strictEqual(data.toString('ascii',0,4),'RIFF');assert.strictEqual(data.toString('ascii',8,12),'WEBP');assert.strictEqual(crypto.createHash('sha256').update(data).digest('hex'),m.sha256);assert(m.width>=1500&&m.height>=700);assert(m.prompt&&m.generator==='built-in image_gen');}
let before=0,after=0;
for(const q of qs){const pre=diagrams.get(q,false),post=diagrams.get(q,true);if(pre)before++;else if(post)after++;if(post){assert(metadata.some(m=>m.asset===post.asset));if(post.phase==='explanation')assert.strictEqual(pre,null,'解説図は解答前に返さない');}}
assert.strictEqual(before,65,'図を読む65問で、解答前に図を返す');
assert.strictEqual(after,0,'解答後だけの図をなくす');
assert.strictEqual(new Set(Object.values(diagrams.registry).map(d=>d.asset)).size,19,'使用する図は19種類');
for(const q of qs){const d=diagrams.get(q,false);if(!d)continue;assert.strictEqual(d.phase,'question');assert.strictEqual(diagrams.get(q,true),d);assert(!/解説|正解/.test(d.alt),`${q.id}: 問題図の代替文`);}
assert.strictEqual(diagrams.get(added.find(q=>q.objective==='forest-thinning-purpose'),false),null,'文章だけで解ける問題に図を添えない');
assert.strictEqual(diagrams.get(added.find(q=>q.objective==='urban-recovery-reason'),false),null,'結果を疑問符にしただけの無意味な図を使わない');
console.log(`PASS: 追加${added.length}問、出典・計算値・重複文なし、19種類の資料図を全${before}問で解答前に表示`);

let harness=fs.readFileSync(path.join(__dirname,'compat-test.js'),'utf8').split('assert.strictEqual(elements["history-list"]')[0];
harness=harness.replace('makeRound,loadMastery,loadSettings,exportSave,importSave','makeRound,loadMastery,loadSettings,exportSave,importSave,state,renderQuestion,renderDiagram,answerChoice,revealWrittenAnswer');
const checks=String.raw`
const api=context.window.__test,bank=context.window.GEOGRAPHY_QUESTIONS;
const old=store.get('social-quiz-settings-v1');
store.set('social-quiz-settings-v1',JSON.stringify({selectedSecondUnits:[1,2,3,4,5,6,7]}));
assert.strictEqual(api.loadSettings().selectedSecondUnits.length,16,'旧全選択は後半も含む');
store.set('social-quiz-settings-v1',JSON.stringify({selectedSecondUnits:[2,5]}));
assert.strictEqual(JSON.stringify(api.loadSettings().selectedSecondUnits),'[2,5]','旧一部選択は維持');
store.set('social-quiz-settings-v1',JSON.stringify({selectedSecondUnits:[1,2,3,4,5,6,7],secondCatalogVersion:1}));
assert.strictEqual(api.loadSettings().selectedSecondUnits.length,7,'更新後に選んだ前半のみの指定は維持');
store.set('social-quiz-settings-v1',old);
for(const q of bank){
 const post=context.window.QuestionDiagrams.get(q,true);if(!post)continue;
 api.state.deck=[api.makeRound(q)];api.state.index=0;api.state.answers=[];api.state.quizType='choice';api.renderQuestion();
 const before=context.window.QuestionDiagrams.get(q,false);
 assert.strictEqual(elements['question-figure'].classList.contains('hidden'),!before);
 if(!before)assert.strictEqual(elements['question-figure-image'].getAttribute('src'),null,'前問の画像URLを除去');
 api.answerChoice(api.state.deck[0].correctIndex);
 assert(!elements['question-figure'].classList.contains('hidden'));
 assert(elements['question-figure-image'].src.includes(post.asset));
 api.state.quizType='written';api.renderQuestion();
 assert.strictEqual(elements['question-figure'].classList.contains('hidden'),!before);
 api.revealWrittenAnswer();assert(!elements['question-figure'].classList.contains('hidden'),'記述の答えを見るで解説図を表示');
 elements['question-figure-open'].click();assert(elements['figure-zoom-dialog'].open);elements['figure-zoom-close'].click();assert(!elements['figure-zoom-dialog'].open);
}
api.state.deck=[api.makeRound(bank.find(q=>!context.window.QuestionDiagrams.get(q,true)))];api.state.index=0;api.renderQuestion();
assert(elements['question-figure'].classList.contains('hidden'));assert.strictEqual(elements['question-figure-image'].getAttribute('src'),null);
console.log('PASS: 全図の4択・記述の表示時期、前問の消去、拡大・閉じる、旧単元選択の移行');
`;
new Function('require','__dirname',harness+checks)(require,__dirname);
