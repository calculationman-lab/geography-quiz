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
assert(app.includes('shuffle(pool).slice(0,Math.min(setSize,pool.length))'),"同一回の重複出題防止");
assert(app.includes('scopeLabel:SCOPE_LABELS[state.scope]'),"履歴へ範囲を保存");
assert(app.includes('social-quiz-progress-v1'),"旧履歴キーを維持");
assert(app.includes('social-quiz-settings-v1'),"旧設定キーを維持");
assert(sw.includes('social-quiz-v6'),"v6キャッシュ");
assert(sw.includes('20260814-v6'),"v6更新識別子");
console.log("PASS: v6範囲選択、問題数選択、履歴互換、重複防止、PWA更新を検証");
