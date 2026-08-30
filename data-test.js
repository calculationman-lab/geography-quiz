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
const revisedUniqueQuestions={
  "summer-040":"岡山県倉敷市の水島地区を中心に工業が発達した都市はどこですか。",
  "summer-082":"北海道の洞爺湖の南側にあり、2000年にも噴火した火山は何ですか。",
  "first-146":"日本の西側に位置し、首都がソウルである国はどこですか。",
  "first-196":"県庁所在地が横浜市である県はどこですか。",
  "first-277":"生乳から分離した脂肪分を練り固めて作る乳製品は何ですか。",
  "first-281":"十勝平野で、じゃがいも・小麦・豆類などを栽培する農業は何ですか。",
  "first-310":"雪の斜面を滑るスポーツを観光に利用する取り組みはどれですか。",
  "first-332":"木曽三川のうち、最も東側を流れる川は何ですか。",
  "first-397":"長野県川上村が全国有数の産地として知られる高原野菜は何ですか。",
  "first-401":"高原でテントを張って宿泊や野外活動を楽しむ施設は何ですか。",
  "first-420":"2本の細長い板を両足につけて雪の斜面を滑るスポーツは何ですか。"
};
for(const [id,question] of Object.entries(revisedUniqueQuestions)){
  assert.strictEqual(questions.find(q=>q.id===id)?.question,question,`${id}: 唯一正解になる問題文`);
}
console.log("PASS: 589問（夏期139・前期450）、教材・単元タグ、正答1＋誤答5を検証");
