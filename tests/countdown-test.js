const assert=require("node:assert/strict");
const test=require("node:test");
const Countdown=require("../countdown.js");

test("school span includes every day from enrollment April 1 through graduation March 31",()=>{
  const first=Countdown.schoolDays(2023,new Date(2023,3,1));
  assert.deepEqual({total:first.total,elapsed:first.elapsed,remaining:first.remaining},{total:2192,elapsed:0,remaining:2192});
  const last=Countdown.schoolDays(2023,new Date(2029,2,31));
  assert.deepEqual({elapsed:last.elapsed,remaining:last.remaining},{elapsed:2191,remaining:1});
  const after=Countdown.schoolDays(2023,new Date(2029,3,1));
  assert.deepEqual({elapsed:after.elapsed,remaining:after.remaining},{elapsed:2192,remaining:0});
});

test("days before enrollment do not exceed the full school span",()=>{
  const result=Countdown.schoolDays(2023,new Date(2023,2,31));
  assert.equal(result.elapsed,0);
  assert.equal(result.remaining,result.total);
});

test("exam countdown uses calendar days and accepts leap day",()=>{
  assert.equal(Countdown.examDays("2028-02-29",new Date(2028,1,28,23,59)),1);
  assert.equal(Countdown.examDays("2028-02-29",new Date(2028,1,29,0,1)),0);
  assert.equal(Countdown.examDays("2028-02-29",new Date(2028,2,1)),0);
  assert.equal(Countdown.dateValue("2027-02-29"),null);
  assert.equal(Countdown.dateValue("2028-2-9"),null);
});
