const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert');
const root=path.join(__dirname,'..'),c={window:{}};vm.createContext(c);
for(const f of ['questions.js','lower-questions.js','lower-later-questions.js','lower-reading-questions.js','question-diagrams.js'])vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),c);
const qs=c.window.GEOGRAPHY_QUESTIONS,reg=c.window.QuestionDiagrams;
const byObjective=k=>qs.find(q=>q.objective===k);
const rounded=n=>Math.round(n*10)/10;
const expect=(key,value)=>assert.strictEqual(byObjective(key)?.answer,String(value),key);
// Independent data transcribed from visually checked source pages 1, 41, 66, 71.
const forest=[39,9,1,45,6],asia=[1883,1674,3964,7127,10049],north=[2595,2992,4081,3390,3443],europe=[642,953,1545,1356,1232];
const power=[[81.7,18.3,0,0],[8.9,61.3,29.5,.3],[9.1,83.2,3.9,3.8]];
const age=[84.7,98.7,98.4,97.9,97.7,95.2,84.4,59.4,27.6],income=[55.8,72.9,86,92.6,92,93.4];
expect('forest-natural-total',(forest[1]+forest[3])+'％');
expect('forest-within-artificial',forest[0]/(forest[0]+forest[2])*100+'％');
expect('forest-classified-total',100-forest[4]+'％');
expect('forest-natural-broad-ratio',forest[3]/forest[2]+'倍');
expect('forest-top-gap',forest[3]-forest[0]+'ポイント');
expect('cars-two-region-gap',asia[4]-north[4]+'千台');
expect('cars-europe-decline',europe[3]-europe[4]+'千台');
expect('cars-three-sum',asia[4]+north[4]+europe[4]+'千台');
const increments=[asia,north,europe].map(row=>row[2]-row[1]);
assert(increments[0]>increments.reduce((a,b)=>a+b,0)/2);assert(increments.slice(1).every(n=>n<increments.reduce((a,b)=>a+b,0)/2));
expect('cars-increase-contribution','アジア');
const gaps=power.map(row=>rounded(Math.abs(row[0]-row[1])));
expect('power-gap-year',['1950年','2000年','2020年'][gaps.indexOf(Math.min(...gaps))]);
expect('power-nuclear-point-drop',rounded(power[1][2]-power[2][2])+'ポイント');
expect('power-nonthermal-total',rounded(100-power[2][1])+'％');
expect('power-largest-point-rise','火力・'+rounded(power[2][1]-power[1][1])+'ポイント');
expect('internet-age-range',rounded(Math.max(...age)-Math.min(...age))+'ポイント');
expect('internet-age-ninety-count',age.filter(x=>x>90).length+'区分');
assert(age[1]>age[0]&&age.slice(2).every((n,i)=>n<age[i+1]));
expect('internet-age-shape','初めは上がり、13〜19歳を頂点にその後は下がる');
expect('internet-oldest-nonusers',rounded(100-age.at(-1))+'％');
const drops=income.slice(1).flatMap((n,i)=>n<income[i]?[i]:[]);assert.deepStrictEqual(drops,[3]);
expect('internet-income-exception','600〜800万円未満→800〜1000万円未満');
expect('internet-income-count-estimate',1000*income[1]/100+'人');
assert(byObjective('internet-income-count-estimate').question.includes('6歳以上の人が1000人'));
assert(!byObjective('internet-income-count-estimate').choices.some(x=>x.includes('世帯')),'個人の利用率を世帯数に換算しない');
assert.strictEqual(Math.max(...income.filter(n=>n<90)),income[2]);
expect('internet-income-nearest-ninety','400〜600万円未満');
// Figures supply the missing data; stems must not duplicate their numerical inputs.
for(const key of ['forest-artificial-share','forest-type-compare','cars-unit-conversion','cars-asia-increase','cars-nonmonotonic','cars-ranking-transition','internet-threshold-age','internet-age-not-users','internet-income',...qs.filter(q=>/^second-4(?:1[6-9]|[23][0-9]|35)$/.test(q.id)).map(q=>q.objective)]){
 const q=byObjective(key),d=reg.get(q);assert(d&&d.phase==='question',key);
 assert(!/39[%％]|45[%％]|10049|1674|3964|59\.4|27\.6|55\.8|98\.7|98\.4/.test(q.question),'数値の入力は図から読む: '+key);
}
const decorative=['forest-thinning-purpose','forest-thinned-use','forest-machinery','chemical-products','pipeline-benefit','rare-metals','urban-mine','urban-recovery-reason','hydro-location','solar-weather','geothermal-steady','radio-start','communication-order','machine-count-limit','yield-v-time'];
for(const key of decorative)assert.strictEqual(reg.get(byObjective(key)),null,key+': 文だけで解ける問題の挿絵をなくす');
for(const id of ['second-003','second-083','second-084','second-100','second-140'])assert.strictEqual(reg.get(qs.find(q=>q.id===id)),null,id);
console.log('PASS: 新20問の計算・比較・例外の読み取りを原資料の値から独立検算。装飾図を除外');
