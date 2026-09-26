(function(root,factory){
  const api=factory();
  if(typeof module==="object"&&module.exports)module.exports=api;
  if(root)root.SchoolCountdown=api;
})(typeof window!=="undefined"?window:undefined,function(){
  "use strict";
  const DAY=24*60*60*1000;
  function dateValue(value){
    if(typeof value!=="string"||!/^\d{4}-\d{2}-\d{2}$/.test(value))return null;
    const [year,month,day]=value.split("-").map(Number);
    const date=new Date(Date.UTC(year,month-1,day));
    return date.getUTCFullYear()===year&&date.getUTCMonth()===month-1&&date.getUTCDate()===day?date.getTime():null;
  }
  function yearValue(value){
    const year=Number(value);
    return Number.isInteger(year)&&year>=1900&&year<=2100?year:null;
  }
  function todayValue(date=new Date()){
    return Date.UTC(date.getFullYear(),date.getMonth(),date.getDate());
  }
  function daysBetween(start,end){return Math.round((end-start)/DAY)}
  function schoolDays(enrollmentYear,today=new Date()){
    const year=yearValue(enrollmentYear);
    if(year===null)return null;
    const start=Date.UTC(year,3,1),endExclusive=Date.UTC(year+6,3,1);
    const total=daysBetween(start,endExclusive);
    const elapsed=Math.max(0,Math.min(total,daysBetween(start,todayValue(today))));
    return{total,elapsed,remaining:total-elapsed,elapsedPercent:elapsed/total*100};
  }
  function examDays(examDate,today=new Date()){
    const exam=dateValue(examDate);
    return exam===null?null:Math.max(0,daysBetween(todayValue(today),exam));
  }
  return{dateValue,yearValue,todayValue,schoolDays,examDays};
});
