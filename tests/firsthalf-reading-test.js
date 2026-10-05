const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert');
const root=path.join(__dirname,'..'),c={window:{}};vm.createContext(c);
for(const f of ['questions.js','lower-questions.js','lower-later-questions.js','lower-reading-questions.js','question-diagrams.js'])vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),c);
const bank=c.window.GEOGRAPHY_QUESTIONS,first=bank.filter(q=>q.sourceFile==='スキャン_20260909-1959.pdf'),newQs=first.filter(q=>q.objective),reg=c.window.QuestionDiagrams;
assert.strictEqual(first.length,148);assert.strictEqual(newQs.length,8);
const byId=n=>bank.find(q=>q.id==='second-'+String(n).padStart(3,'0'));
const expect=(id,value)=>assert.strictEqual(byId(id).answer,value,'原資料から検算: '+id);
// Values independently transcribed from visually reviewed PDF pages 9,26,33,40,45,55.
const us=[44.2,75.9,72.8],crops=['小麦','大豆','とうもろこし'];
expect(437,crops[us.indexOf(Math.max(...us))]);
const cowWater=20.6,chickenWater=4.5;
expect(438,`牛肉1kgの方が${Math.round((cowWater-2*chickenWater)*10)/10}t多い`);
expect(439,10000*12/100*54/100+'km²');
const population=[482,389,261,168];assert(population.slice(1).every((n,i)=>n<population[i]));
expect(99,population[0]-population[3]+'万人');
expect(440,'農業就業人口は減り、65歳以上の割合は上がった');
// Qualitative source line relation, not measurements inferred from generated pixels.
expect(436,'1975年は生産量が多く、1980年は消費量が多い');
const foods=['米','小麦','大豆','野菜','果実'],oldRates=[102,39,28,100,100],newRates=[98,17,7,79,39];
const declines=oldRates.map((v,i)=>v-newRates[i]),biggest=declines.indexOf(Math.max(...declines));
expect(441,foods[biggest]+'・'+declines[biggest]+'ポイント');
expect(114,[0,1,2].sort((a,b)=>newRates[a]-newRates[b]).map(i=>foods[i]).join('→'));
expect(115,newRates[1]-newRates[2]+'ポイント');
expect(132,100-newRates[2]>100-newRates[1]?foods[2]:foods[1]);
const labels=['米','小麦','肉類','果物','野菜','牛乳・乳製品'],earlier=[306,79,24,78,249,103],later=[139,87,93,91,241,257];
const triple=labels.filter((_,i)=>later[i]>3*earlier[i]);assert.strictEqual(triple.length,1);expect(442,triple[0]);
const increases=later.map((v,i)=>v-earlier[i]);expect(443,labels[increases.indexOf(Math.max(...increases))]);
expect(133,earlier[0]-later[0]+'g');expect(134,later[2]-earlier[2]+'g');expect(135,later[5]-earlier[5]+'g');
expect(136,'米は減り、肉類は増えた');
const rewritten=[99,114,115,132,133,134,135,136].map(byId),changed=[...rewritten,...newQs];
assert.strictEqual(first.filter(q=>reg.get(q)).length,19);assert.strictEqual(bank.filter(q=>reg.get(q)).length,65);
assert.strictEqual(bank.filter(q=>q.sourceFile==='社会４下期後半スキャン_20261004-0957.pdf'&&reg.get(q)).length,46);
for(let unit=1;unit<=7;unit++)assert.strictEqual(first.filter(q=>q.unit===unit).length,[21,21,20,21,22,21,22][unit-1]);
for(const q of changed){
 const d=reg.get(q);assert(d&&d.phase==='question');assert(q.question.includes('図'));
 assert(!/482|168|306|139g|24g|93g|103g|257g|20\.6|4\.5|75\.9|44\.2|72\.8|54[%％]|12[%％]|98[%％]|17[%％]|7[%％]/.test(q.question),q.id+': 図中の入力値を問題文で教えない');
 assert(!/答え|正解|計算結果/.test(d.alt));assert.strictEqual(new Set(q.choices).size,6);
 assert.strictEqual(q.choices[q.answerIndex],q.answer);
}
for(const q of newQs){assert(q.id.startsWith('second-4'));assert(q.sourcePage>=(q.unit-1)*8+1&&q.sourcePage<=q.unit*8);assert.strictEqual(q.sourcePrintedPage,q.sourcePage);}
assert.strictEqual(new Set(bank.map(q=>q.objective).filter(Boolean)).size,303,'前後半の新規学習目的が重複しない');
console.log('PASS: 前半148問・図19問、新規8問と既存8問を原資料から独立検算。入力値は図から読み、後半図46問を維持');
