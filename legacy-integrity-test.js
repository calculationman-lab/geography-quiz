const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto'),assert=require('assert');
const context={window:{}};vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(__dirname,'..','questions.js'),'utf8'),context);
const old=context.window.GEOGRAPHY_QUESTIONS;assert.strictEqual(old.length,589);
// 復元したv9.10のquestions.jsで、変更許可対象first-320を除いて算出したハッシュ。
const digest=crypto.createHash('sha256').update(JSON.stringify(old.filter(q=>q.id!=='first-320'))).digest('hex');
assert.strictEqual(digest,'1435ded430c8b176818e3674a1f7a2ed167dd9407da3207fea18ebe06b761602');
console.log('PASS: 旧589問のうち木曽三川の1問以外、588問のデータと順序がv9.10と一致');
