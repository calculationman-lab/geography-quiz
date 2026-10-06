// Check the actual shipped SVG geometry against independently transcribed source values.
const fs=require('fs'),path=require('path'),assert=require('assert'),vm=require('vm'),crypto=require('crypto');
const root=path.join(__dirname,'..');
const svg=asset=>fs.readFileSync(path.join(root,'assets/diagrams',asset+'.svg'),'utf8');
const attrs=s=>Object.fromEntries([...s.matchAll(/([\w-]+)="([^"]*)"/g)].map(m=>[m[1],m[2]]));
const elements=(s,tag,kind)=>[...s.matchAll(new RegExp('<'+tag+'\\b[^>]*>','g'))].map(m=>attrs(m[0])).filter(a=>a['data-kind']===kind);
const close=(a,b,msg)=>assert(Math.abs(Number(a)-b)<.00001,msg+': '+a+' != '+b);
function checkBands(asset,rows,x,w){
 const all=elements(svg(asset),'rect','segment');
 rows.forEach((row,r)=>{const seg=all.filter(a=>Number(a['data-row'])===r);assert.strictEqual(seg.length,row.filter(v=>v>0).length);let cumulative=0;
 row.filter(v=>v>0).forEach((v,i)=>{close(seg[i].x,x+w*cumulative/100,asset+' segment starts');close(seg[i].width,w*v/100,asset+' segment width');close(seg[i]['data-value'],v,asset+' label mapping');cumulative+=v;});close(cumulative,100,asset+' whole');
 });
}
checkBands('power-composition',[[81.7,18.3,0,0],[8.9,61.3,29.5,.3],[9.1,83.2,3.9,3.8]],220,1190);
checkBands('crop-import-shares',[[44.2,35.1,20.6,.1],[75.9,15.1,8.3,.7],[72.8,15.4,7.3,4.5]],260,1140);
checkBands('farmland-denominators',[[12,88],[54,26,6,14]],180,1200);
const farmland=svg('farmland-denominators'),guides=[...farmland.matchAll(/<line\b[^>]*data-guide="(?:left|right)"[^>]*>/g)].map(m=>attrs(m[0]));
assert.deepStrictEqual(guides.map(g=>[+g.x1,+g.y1,+g.x2,+g.y2]),[[180,385,180,660],[324,385,1380,660]],'拡大する上の区分の両端を、下の全体の両端へつなぐ');
const sectors=elements(svg('forest-composition'),'path','sector');assert.strictEqual(sectors.length,5);
const shares=[39,9,1,45,6];let totalAngle=0;
sectors.forEach((s,i)=>{const numbers=s.d.match(/-?\d+(?:\.\d+)?/g).map(Number);const [cx,cy,px,py,rx,ry,rotation,large,sweep,qx,qy]=numbers;
 close(rx,285,'pie radius');close(ry,285,'pie radius');close(Math.hypot(px-cx,py-cy),285,'pie circle');close(Math.hypot(qx-cx,qy-cy),285,'pie circle');
 const start=Math.atan2(py-cy,px-cx)*180/Math.PI,end=Math.atan2(qy-cy,qx-cx)*180/Math.PI,angle=(end-start+360)%360;
 close(angle,shares[i]*3.6,'扇形の実際の角度');totalAngle+=angle;
});close(totalAngle,360,'円の全体');
function checkBars(asset,values,max,baseline,h){
 const bars=elements(svg(asset),'rect','bar');assert.strictEqual(bars.length,values.length);
 values.forEach((v,i)=>{close(bars[i].height,h*v/max,asset+' height');close(bars[i].y,baseline-h*v/max,asset+' top');close(+bars[i].y + +bars[i].height,baseline,asset+' zero baseline');});
}
checkBars('bar-data',[20,35,15],40,770,580);
checkBars('internet-age',[84.7,98.7,98.4,97.9,97.7,95.2,84.4,59.4,27.6],100,775,585);
checkBars('internet-income',[55.8,72.9,86,92.6,92,93.4],100,770,580);
checkBars('meat-virtual-water',[20.6,5.9,4.5],25,770,580);
checkBars('farm-population-age',[482,389,261,168],500,815,555);
checkBars('food-consumption-change',[306,139,79,87,24,93,78,91,249,241,103,257],350,780,575);
const points=(asset,kind)=>elements(svg(asset),'polyline',kind)[0].points.split(' ').map(p=>p.split(',').map(Number));
const linePoints=points('line-data','practice-line');
[10,20,15,30].forEach((v,i)=>{close(linePoints[i][0],185+i*1220/3,'年の等間隔');close(linePoints[i][1],820-v/35*620,'折れ線の高さ');});
const years=[1960,1965,1970,1975,1980,1985,1990,1995,2000,2005,2010,2015,2019];
const production=points('rice-production-consumption','productionApproximate'),consumption=points('rice-production-consumption','consumptionApproximate');
for(const pts of[production,consumption])years.forEach((year,i)=>close(pts[i][0],185+(year-1960)/59*1230,'米の実年数に比例する横軸'));
assert(production[3][1]<consumption[3][1]&&production[4][1]>consumption[4][1],'原図の1975年・1980年の大小関係');
assert(svg('rice-production-consumption').includes('線の位置は概数'));assert(svg('farm-population-age').includes('割合の線は概数'));
assert(svg('farm-population-age').includes('農業人口に占める65歳以上の割合'));
assert(svg('internet-income').includes('対象：6歳以上の個人（無回答を除く）'));
const c={window:{},self:{addEventListener(){}}};vm.createContext(c);for(const f of['questions.js','lower-questions.js','lower-later-questions.js','lower-reading-questions.js','question-diagrams.js'])vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),c);
vm.runInContext(fs.readFileSync(path.join(root,'sw.js'),'utf8')+';this.auditAssets=ASSETS;',c);
const diagrams=Object.values(c.window.QuestionDiagrams.registry);assert.strictEqual(new Set(diagrams.map(d=>d.asset)).size,19);
for(const d of diagrams){assert(c.auditAssets.includes(d.src),'図の実ファイルをPWA先読み: '+d.src);assert(fs.existsSync(path.join(root,d.src)));}
const q=c.window.GEOGRAPHY_QUESTIONS.find(q=>q.id==='second-434');assert.strictEqual(q.answer,'729人');assert(q.question.includes('1000人'));
const manifest=JSON.parse(fs.readFileSync(path.join(root,'qa/diagram-audit-20261006/charts.json'),'utf8'));assert.strictEqual(manifest.length,12);
for(const m of manifest)assert.strictEqual(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,m.path))).digest('hex'),m.sha256);
console.log('PASS: 12グラフの扇形角度・帯幅・棒高・折れ線座標・年の間隔・分母・19図のPWA参照を原資料の値から独立検証');
