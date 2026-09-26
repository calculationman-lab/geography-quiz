const assert=require("node:assert/strict");
const test=require("node:test");
const Countdown=require("../countdown.js");

test("school span runs from enrollment April 1 until the exam date",()=>{
  const first=Countdown.schoolDays(2023,"2029-02-03",new Date(2023,3,1));
  assert.deepEqual({total:first.total,elapsed:first.elapsed,remaining:first.remaining},{total:2135,elapsed:0,remaining:2135});
  const last=Countdown.schoolDays(2023,"2029-02-03",new Date(2029,1,2));
  assert.deepEqual({elapsed:last.elapsed,remaining:last.remaining},{elapsed:2134,remaining:1});
  const examDay=Countdown.schoolDays(2023,"2029-02-03",new Date(2029,1,3));
  assert.deepEqual({elapsed:examDay.elapsed,remaining:examDay.remaining},{elapsed:2135,remaining:0});
});

test("days before enrollment do not exceed the full school span",()=>{
  const result=Countdown.schoolDays(2023,"2029-02-03",new Date(2023,2,31));
  assert.equal(result.elapsed,0);
  assert.equal(result.remaining,result.total);
});

test("exam date must follow enrollment",()=>{
  assert.equal(Countdown.schoolDays(2023,"2023-04-01"),null);
  assert.equal(Countdown.schoolDays(2023,"2023-03-31"),null);
});

test("exam countdown uses calendar days and accepts leap day",()=>{
  assert.equal(Countdown.examDays("2028-02-29",new Date(2028,1,28,23,59)),1);
  assert.equal(Countdown.examDays("2028-02-29",new Date(2028,1,29,0,1)),0);
  assert.equal(Countdown.examDays("2028-02-29",new Date(2028,2,1)),0);
  assert.equal(Countdown.dateValue("2027-02-29"),null);
  assert.equal(Countdown.dateValue("2028-2-9"),null);
});

test("2026 grade four implies the 2029 exam and 2023 enrollment",()=>{
  const today=new Date(2026,8,26);
  assert.equal(Countdown.examDays("2029-02-03",today),861);
  assert.deepEqual(Countdown.schoolDays(2023,"2029-02-03",today),{
    total:2135,elapsed:1274,remaining:861,elapsedPercent:1274/2135*100
  });
});
