const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.join(__dirname,'..'),ctx={window:{}};vm.createContext(ctx);
for(const file of ['questions.js','lower-questions.js','lower-later-questions.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),ctx);
const all=ctx.window.GEOGRAPHY_QUESTIONS,added=all.filter(q=>q.objective),old=all.filter(q=>!q.objective);
const norm=s=>s.normalize('NFKC').replace(/[\s・（）()「」、。？?]/g,'');
const grams=s=>new Set(Array.from(norm(s)).slice(0,-1).map((_,i)=>norm(s).slice(i,i+2)));
function similarity(a,b){const x=grams(a),y=grams(b);return [...x].filter(v=>y.has(v)).length/(x.size+y.size-[...x].filter(v=>y.has(v)).length)}
const pairs=added.flatMap(q=>old.map(p=>({id:q.id,objective:q.objective,question:q.question,answer:q.answer,oldId:p.id,oldQuestion:p.question,oldAnswer:p.answer,score:similarity(q.question,p.question)})).filter(p=>norm(p.answer)===norm(p.oldAnswer)||p.score>.32)).sort((a,b)=>b.score-a.score);
const internal=added.flatMap((q,i)=>added.slice(i+1).map(p=>({id:q.id,objective:q.objective,question:q.question,answer:q.answer,otherId:p.id,otherObjective:p.objective,otherQuestion:p.question,otherAnswer:p.answer,score:similarity(q.question,p.question)})).filter(p=>norm(p.answer)===norm(p.otherAnswer)||p.score>.4)).sort((a,b)=>b.score-a.score);
fs.mkdirSync(path.join(root,'qa/lower-complete'),{recursive:true});fs.writeFileSync(path.join(root,'qa/lower-complete/duplicate-candidates.json'),JSON.stringify(pairs,null,2));
fs.writeFileSync(path.join(root,'qa/lower-complete/internal-candidates.json'),JSON.stringify(internal,null,2));
console.log(JSON.stringify({oldCandidates:pairs.length,newCandidates:internal.length}));
console.log(JSON.stringify(internal.map(p=>[p.objective,p.question,p.otherObjective,p.otherQuestion]),null,2));
