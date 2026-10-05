(function(){
  'use strict';
  const entries=[];
  function add(asset,phase,alt,objectives=[],ids=[]){for(const key of [...objectives,...ids])entries.push([key,{asset,phase,alt,src:`./assets/diagrams/${asset}.webp`}]);}
  add('forest-leaves','question','Aは細長い葉、Bは幅の広い葉を持つ樹木の図。',['forest-leaf-identify','forest-broad-species']);
  add('forest-jobs','question','Aは苗木を植える人、Bは苗木の周りの草を刈る人、Cは立った幹の枝を切る人、Dは一部の木を切った林。',['forest-planting-scene','forest-weeding-scene','forest-pruning-scene','forest-thinning-scene']);
  add('forest-care','explanation','密集した林と、木の間隔が広がり地面に光が届く林の比較。',['forest-thinning-purpose','forest-thinned-use','forest-work-order','forest-long-cycle','forest-successor','forest-machinery']);
  add('fish-methods','explanation','Aは海のいかだから貝の付いたロープを下げる様子、Bは陸上で育てた小魚を海へ放す様子。',['fish-ranching','fish-method-compare','fish-diagram-methods','fish-aquaculture-risk','fish-catch-rule','fish-small-fish']);
  add('industry-coast','explanation','港の船、タンク、複数の工場がパイプでつながっている図。',['chemical-products','naphtha','complex-name','pipeline-benefit','coastal-heavy-location','keiyo-reclaimed','setouchi-land-history','thermal-location','tanker']);
  add('urban-mine','explanation','使用済みの小型機器を集め、内部の部品を分別し、金属を回収する模式図。',['rare-metals','urban-mine','urban-recovery-reason','olympic-recycled-metals','mineral-finite']);
  add('power-options','explanation','Aは山のダム、Bは海上の風車、Cは屋根のパネル。',['hydro-method','hydro-location','hydro-rainfall','dam-environment','wind-method','wind-location','offshore-wind','wind-problems','solar-method','solar-weather','mega-solar','solar-land-care','renewables-group','mix-diversification']);
  add('geothermal-site','explanation','地下の温かい水を井戸から取り出し、建物で利用した後に別の井戸へ戻す模式図。',['geothermal-method','geothermal-steady','geothermal-cost']);
  add('trade-flow','explanation','船で原料を運び、工場で加工し、製品を別の船で運ぶ流れ。',['processing-trade','trade-structure-historical','trade-share-raw-v-finished']);
  add('communication-history','explanation','Aは山の上のたき火の煙、Bは荷物を運んで走る人、CとDは音声や映像を受け取る機器。',['smoke-signals','courier-edo','radio-start','radio-feature','television-start','television-feature','communication-order']);
  add('bar-data','question','仮の棒グラフ。A20、B35、C15。縦軸は0から40まで5刻み。',['bar-figure-difference','bar-figure-total','bar-figure-share']);
  add('line-data','question','仮の折れ線グラフ。2020年10、2021年20、2022年15、2023年30。年の間隔は同じ。',['line-figure-decrease','line-figure-net','line-figure-claim']);
  add('farm-machines','explanation','Aは土をならす機械、Bは苗を列に植える機械、Cは稲を刈り取る機械。',[],['second-003','second-005','second-083','second-084','second-100','second-140']);
  add('farm-land','explanation','小さく不規則な田の区画Aと、大きな長方形の田や広い道がある区画Bの比較。',['machine-count-limit','yield-v-time'],['second-096','second-098']);
  const registry=Object.fromEntries(entries);
  window.QuestionDiagrams={registry,get(q,answered=false){const d=registry[q?.objective]||registry[q?.id];return d&&(d.phase==='question'||answered)?d:null;}};
})();
