const fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..');
const names={8:'林業',9:'水産業',10:'工業1',11:'工業2',12:'鉱産資源',13:'電力',14:'貿易',15:'通信',16:'統計資料'};
const files=['lower-later.tsv','industry.tsv','resources-power.tsv','trade-communication.tsv','statistics.tsv'];
const rows=files.flatMap(file=>fs.readFileSync(path.join(root,'content',file),'utf8').trim().split(/\r?\n/));
const excluded=['forest-windbreak','forest-sandbreak','forest-shirakami','forest-yakushima','fish-kuroshio','fish-oyashio','fish-tidal-boundary','fish-shelf','percent-point'];
const questions=rows.filter(row=>!excluded.includes(row.split('|')[2])).map((row,index)=>{
  const f=row.split('|');if(f.length!==12)throw new Error(`Row ${index+1}: ${f.length} fields`);
  const [unit,page,objective,answerType,question,answer,...tail]=f,explanation=tail.pop();
  return{id:`second-${String(index+141).padStart(3,'0')}`,source:'小4下期',unit:Number(unit),unitName:names[unit],region:names[unit],question,answer,choices:[answer,...tail],answerIndex:0,explanation,answerType,objective,sourcePage:Number(page),sourcePrintedPage:Number(page)+56,sourceFile:'社会４下期後半スキャン_20261004-0957.pdf'};
});
const output='/* Original questions based on the supplied scan; PDF page references are 1-based. */\n(function(){\n  const added='+JSON.stringify(questions,null,2)+';\n  window.GEOGRAPHY_QUESTIONS=[...window.GEOGRAPHY_QUESTIONS,...added];\n})();\n';
fs.writeFileSync(path.join(root,'lower-later-questions.js'),output);
console.log(JSON.stringify({added:questions.length,units:Object.fromEntries(Object.keys(names).map(n=>[n,questions.filter(q=>q.unit===Number(n)).length]))}));
