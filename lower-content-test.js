const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const root=path.join(__dirname,'..'),ctx={window:{}};vm.createContext(ctx);
for(const file of ['questions.js','lower-questions.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),ctx);
const all=ctx.window.GEOGRAPHY_QUESTIONS,lower=all.filter(q=>q.source==='小4下期');
const texts=new Set();
for(const q of all){assert(!texts.has(q.question),`${q.id}: 問題文完全重複`);texts.add(q.question)}
for(const q of lower){
  assert(q.sourceFile==='スキャン_20260909-1959.pdf');
  assert(q.sourcePage>=(q.unit-1)*8+1&&q.sourcePage<=q.unit*8,`${q.id}: 出典が単元の範囲内`);
  assert(q.answerType&&q.explanation.trim().length>0,`${q.id}: 回答分類と解説が存在`);
  assert(!q.choices.some(c=>/[<>|\n]/.test(c)),`${q.id}: 不要な区切りやHTMLなし`);
  if(q.answerType==='都道府県名')assert(q.choices.every(c=>/(都|道|府|県)$/.test(c)),q.id);
  if(q.answerType==='平野名')assert(q.choices.every(c=>c.endsWith('平野')),q.id);
  if(q.answerType==='盆地名')assert(q.choices.every(c=>c.endsWith('盆地')),q.id);
  if(q.answerType==='川名')assert(q.choices.every(c=>c.endsWith('川')),q.id);
  if(q.answerType==='村名')assert(q.choices.every(c=>c.endsWith('村')),q.id);
  if(q.answerType==='台地名')assert(q.choices.every(c=>c.endsWith('台地')),q.id);
  if(q.question.includes('何％'))assert(q.choices.every(c=>/^\d+(?:\.\d+)?％$/.test(c)),q.id);
  if(q.question.includes('何ポイント'))assert(q.choices.every(c=>/^\d+ポイント$/.test(c)),q.id);
  if(q.question.includes('何g'))assert(q.choices.every(c=>/^\d+g$/.test(c)),q.id);
  if(q.question.includes('何万人'))assert(q.choices.every(c=>/^\d+万人$/.test(c)),q.id);
  if(q.question.includes('何t・km'))assert(q.choices.every(c=>/^\d+t・km$/.test(c)),q.id);
  if(q.question.includes('何tです'))assert(q.choices.every(c=>/^\d+(?:\.\d+)?t$/.test(c)),q.id);
  if(q.question.includes('何倍'))assert(q.choices.every(c=>/^\d+倍$/.test(c)),q.id);
  if(/教材.*(最も多い|自給率は何％)/.test(q.question))assert(/20\d{2}年/.test(q.question),`${q.id}: 統計の年`);
}
// 機械で確かめられる計算・並べ替えの正答を別に固定する。
const expected={20:'120％',78:'41.2t',99:'314万人',106:'600t・km',107:'500t・km',114:'大豆→小麦→米',115:'10ポイント',118:'10倍',130:'12％',133:'167g',134:'69g',135:'154g',139:'150％'};
for(const [id,answer]of Object.entries(expected))assert.strictEqual(lower.find(q=>q.id===`second-${id.padStart(3,'0')}`).answer,answer);
console.log('PASS: 下期140問の出典ページ・解説・指定回答形式・統計年・計算値（意味や難易度の自動保証ではない）');
