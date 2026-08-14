const fs=require("fs"),vm=require("vm"),assert=require("assert"),path=require("path");
const context={window:{}};vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(__dirname,"..","questions.js"),"utf8"),context);
const questions=context.window.GEOGRAPHY_QUESTIONS;
assert.strictEqual(questions.length,589,"問題数は589問");
assert.strictEqual(questions.filter(q=>q.source==="夏期講習").length,139,"夏期講習は139問");
assert.strictEqual(questions.filter(q=>q.source==="小4前期").length,450,"小4前期は450問");
const ids=new Set();
for(const q of questions){
  assert(q.id&&q.question&&q.region&&q.source,`${q.id||"不明"}: 必須項目`);
  assert(!ids.has(q.id),`${q.id}: ID重複`);ids.add(q.id);
  assert.strictEqual(q.choices.length,6,`${q.id}: 正答1＋誤答5`);
  assert.strictEqual(new Set(q.choices).size,6,`${q.id}: 選択肢重複なし`);
  assert(Number.isInteger(q.answerIndex)&&q.answerIndex>=0&&q.answerIndex<6,`${q.id}: 正答位置`);
  assert.strictEqual(q.choices[q.answerIndex],q.answer,`${q.id}: 正答整合`);
  if(q.source==="小4前期")assert(Number.isInteger(q.unit)&&q.unit>=1&&q.unit<=17,`${q.id}: 単元番号`);
  assert(!/(?:2つ|二つ).*(?:答え|選び)|すべて答|全て答|すべて選|全て選/.test(q.question),`${q.id}: 複数回答を要求しない`);
}
console.log("PASS: 589問（夏期139・前期450）、教材・単元タグ、正答1＋誤答5を検証");
