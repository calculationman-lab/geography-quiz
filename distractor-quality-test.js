const fs = require("fs");
const vm = require("vm");
const assert = require("assert");
const path = require("path");

const context = { window: {} };
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(__dirname, "..", "questions.js"), "utf8"), context);
const questions = context.window.GEOGRAPHY_QUESTIONS;

const checks = [
  [q => /工業地帯|工業地域/.test(q.question) && /(工業地帯|工業地域)$/.test(q.answer), x => /(工業地帯|工業地域)$/.test(x), "工業地帯・地域"],
  [q => /(?:何|どの)村/.test(q.question), x => /村$/.test(x), "村名"],
  [q => /何工場/.test(q.question), x => /(工場|製鉄所|造船所)$/.test(x), "工場名"],
  [q => /何時間/.test(q.question), x => /^[0-9.]+時間$/.test(x), "時間"],
  [q => /何km/.test(q.question), x => /^約?[0-9,.]+(?:万[0-9,.]*)?km$/.test(x), "km"],
  [q => /何m/.test(q.question), x => /^約?[0-9,.]+(?:万[0-9,.]*)?m$/.test(x), "m"],
  [q => /時間帯/.test(q.question), x => /^(早朝|朝|午前|正午|午後|夕方|夜|深夜)$/.test(x), "時間帯"],
  [q => /季節はいつ/.test(q.question), x => /^(春|夏|秋|冬|梅雨|初夏|晩秋|真冬)$/.test(x), "季節"],
];
for (const q of questions) {
  for (const [applies, valid, label] of checks) {
    if (!applies(q)) continue;
    q.choices.forEach(choice => assert(valid(choice), `${q.id}: ${label}の回答形式に合わない「${choice}」`));
  }
}

const exactGroups = {
  "summer-034": /焼$/,
  "summer-037": /焼$/,
  "summer-060": /(塗|漆器)$/,
  "summer-105": /(丈|紬|織|絣)$/,
  "summer-113": /(丈|紬|織|絣)$/,
  "summer-129": /(ハウス|温室|トンネル|施設|選果場)$/,
  "first-291": /(室|倉庫|貯蔵庫|保冷庫)$/,
  "first-393": /(場|市場|施設|倉庫)$/,
};
for (const [id, pattern] of Object.entries(exactGroups)) {
  const q = questions.find(item => item.id === id);
  assert(q, `${id}: 対象問題`);
  q.choices.forEach(choice => assert(pattern.test(choice), `${id}: 設問趣旨に合わない「${choice}」`));
}

function shuffle(values) {
  const a = [...values];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
for (const q of questions) {
  assert.strictEqual(q.choices.length, 6, `${q.id}: 正答1＋誤答5`);
  assert.strictEqual(new Set(q.choices).size, 6, `${q.id}: 候補重複なし`);
  assert.strictEqual(q.choices.filter(x => x === q.answer).length, 1, `${q.id}: 正答は1個`);
  for (let i = 0; i < 100; i++) {
    const displayed = shuffle([q.answer, ...shuffle(q.choices.filter(x => x !== q.answer)).slice(0, 3)]);
    assert.strictEqual(displayed.length, 4, `${q.id}: 表示は4択`);
    assert.strictEqual(new Set(displayed).size, 4, `${q.id}: 表示重複なし`);
    assert(displayed.includes(q.answer), `${q.id}: 正答を必ず表示`);
  }
}

console.log("PASS: 全589問・誤答2,945個の回答形式と、589問×100回の正答混入を検証");
