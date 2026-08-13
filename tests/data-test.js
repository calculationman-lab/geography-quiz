const fs=require("fs"),vm=require("vm"),assert=require("assert"),path=require("path");
const context={window:{}};vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(__dirname,"..","questions.js"),"utf8"),context);
const questions=context.window.GEOGRAPHY_QUESTIONS;assert.strictEqual(questions.length,139,"問題数は139問");const ids=new Set();
for(const q of questions){assert(q.id&&q.question&&q.region,`${q.id||"不明"}: 必須項目`);assert(!ids.has(q.id),`${q.id}: ID重複`);ids.add(q.id);assert.strictEqual(q.choices.length,4,`${q.id}: 4択`);assert.strictEqual(new Set(q.choices).size,4,`${q.id}: 選択肢重複なし`);assert(Number.isInteger(q.answerIndex)&&q.answerIndex>=0&&q.answerIndex<4,`${q.id}: 正答位置`);assert(q.choices[q.answerIndex],`${q.id}: 正答あり`)}
for(const q of questions){assert(!/(2つ|二つ|すべて答|全て答|すべて選|全て選)/.test(q.question),`${q.id}: 複数回答を要求しない`)}
console.log(`PASS: ${questions.length}問、全問4択、ID・選択肢重複なし`);
