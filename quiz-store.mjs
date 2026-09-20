import {emptyProgress,validateProgress} from './quiz-model.mjs';
export const STORAGE_KEY='social-quiz-map3d-v1';
export function createQuizStore(data,storage=()=>globalThis.localStorage){
  let expected=null,writable=true,message='';
  function load(){try{expected=storage().getItem(STORAGE_KEY);return expected===null?emptyProgress():validateProgress(JSON.parse(expected),data);}catch{writable=false;message='保存記録を読み込めません。元の記録を保ち、今回はこの画面内だけで練習します。';return emptyProgress();}}
  function write(progress){
    if(!writable)return {status:'temporary',message};
    try{if(storage().getItem(STORAGE_KEY)!==expected)return {status:'conflict',message:'別の画面で地図の記録が更新されました。再読み込みして続けてください。'};
      const raw=JSON.stringify(progress);storage().setItem(STORAGE_KEY,raw);expected=raw;return {status:'saved',message:''};
    }catch{writable=false;message='記録を保存できません。今回はこの画面内だけで練習します。';return {status:'temporary',message};}
  }
  return {load,write,get message(){return message;}};
}
