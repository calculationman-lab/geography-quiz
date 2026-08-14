const fs=require("fs"),assert=require("assert"),path=require("path");
const root=path.join(__dirname,"..");
const html=fs.readFileSync(path.join(root,"index.html"),"utf8");
const app=fs.readFileSync(path.join(root,"app.js"),"utf8");
const sw=fs.readFileSync(path.join(root,"sw.js"),"utf8");

for(const scope of ["first","summer","all"]){
  assert(html.includes(`data-scope="${scope}"`),`${scope}: 範囲ボタン`);
  assert(html.includes(`data-scope-count="${scope}"`),`${scope}: 件数表示`);
}
for(const count of ["20","50","all"]){assert(html.includes(`data-question-count="${count}"`),`${count}: 問題数ボタン`)}
assert(app.includes('q.source==="小4前期"'),"前期フィルター");
assert(app.includes('q.source==="夏期講習"'),"夏期講習フィルター");
assert(app.includes('state.selectedUnits.includes(q.unit)'),"選択単元フィルター");
assert(html.includes('id="unit-options"'),"単元選択画面");
assert(html.includes('id="select-all-units"'),"全単元選択");
assert(html.includes('id="clear-units"'),"単元選択解除");
assert(html.includes("社会マスター"),"表示名");
assert(app.includes('shuffle(pool).slice(0,Math.min(size,pool.length))'),"同一回の重複出題防止");
assert(app.includes('scopeLabel:scopeLabel()'),"履歴へ単元範囲を保存");
assert(app.includes('social-quiz-progress-v1'),"旧履歴キーを維持");
assert(app.includes('social-quiz-settings-v1'),"旧設定キーを維持");
assert(html.includes('data-quiz-type="written"'),"記述モード選択");
for(const count of ["10","20","all"]){assert(html.includes(`data-written-count="${count}"`),`${count}: 記述問題数`)}
for(const grade of ["correct","partial","wrong"]){assert(html.includes(`data-self-grade="${grade}"`),`${grade}: 自己判定`)}
assert(app.includes('quizType:state.quizType'),"4択と記述を履歴で分離");
assert(app.includes('partialCount'),"漢字・表記ミスを独立記録");
assert(app.includes('social-quiz-mastery-v1'),"v9攻略データを分離保存");
assert(app.includes('requested==="all"&&state.scope==="first"&&state.selectedUnits.length===1'),"1単元全問だけを制覇判定");
assert(app.includes('requested==="all"&&state.scope==="summer"&&state.selectedSummerRegions.length===1'),"夏期1地域全問だけを制覇判定");
assert(app.includes('choiceMastered')&&app.includes('writtenMastered'),"4択と記述を別々に制覇判定");
assert(app.includes('UNIT_TITLES')&&app.includes('SUMMER_TITLES')&&app.includes('RANKS'),"前期・夏期称号と総合ランク");
assert(app.includes('mastery:loadMastery()'),"攻略データをバックアップ");
for(const id of ["current-rank","unit-mastery-grid","summer-mastery-grid","summer-region-selector","achievement-banner","rank-toggle","rank-details"]){assert(html.includes(`id="${id}"`),`${id}: v9表示`)}
assert(html.includes('id="rank-details" class="rank-details hidden"'),"ランク詳細は初期状態で閉じる");
assert(app.includes('function toggleRankDetails()'),"ランク詳細の開閉処理");
assert(sw.includes('social-quiz-v9-9'),"v9.9キャッシュ");
assert(sw.includes('20260815-v9-9'),"v9.9更新識別子");
console.log("PASS: v9.9ランク折りたたみ、前期・夏期称号、バックアップ、PWA更新を検証");
