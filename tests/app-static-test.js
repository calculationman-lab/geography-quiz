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
assert(sw.includes('social-quiz-v8'),"v8キャッシュ");
assert(sw.includes('20260814-v8'),"v8更新識別子");
console.log("PASS: v8記述、単元選択、履歴分離、重複防止、PWA更新を検証");
