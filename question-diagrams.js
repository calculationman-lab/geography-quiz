(function(){
  'use strict';
  const entries=[];
  const exactCharts=new Set(['bar-data','line-data','forest-composition','power-composition','internet-age','internet-income','rice-production-consumption','crop-import-shares','meat-virtual-water','farmland-denominators','farm-population-age','food-consumption-change']);
  function add(asset,alt,skill,objectives=[],ids=[],sourcePage=null){
    const format=exactCharts.has(asset)?'svg':'webp';
    for(const key of [...objectives,...ids])entries.push([key,{asset,phase:'question',alt,skill,sourcePage,src:`./assets/diagrams/${asset}.${format}`}]);
  }
  // Register only questions whose missing evidence must be read from the figure.
  add('forest-leaves','Aは細長い葉、Bは幅の広い葉を持つ樹木。','葉の形を見分ける',['forest-leaf-identify','forest-broad-species']);
  add('forest-jobs','Aは苗木を植える人、Bは苗木の周りの草を刈る人、Cは立った幹の枝を切る人、Dは一部の木を切った林。','作業の様子を見分け、順序を考える',['forest-planting-scene','forest-weeding-scene','forest-pruning-scene','forest-thinning-scene','forest-work-order']);
  add('fish-methods','Aは海のいかだから貝の付いたロープを下げる様子、Bは陸上で育てた小魚を海へ放す様子。','育てる場所と放流の工程を読み取る',['fish-ranching','fish-method-compare']);
  add('farm-machines','Aは土をならす機械、Bは苗を列に植える機械、Cは稲を刈り取る機械。','機械の働きを図から見分ける',[],['second-005']);
  add('farm-land','Aは小さく不規則な田の区画と狭い道、Bは大きな長方形の田と広い道。','区画と道の変化を比較する',[],['second-096','second-098']);
  add('bar-data','仮の棒グラフ。A20、B35、C15。縦軸は0から40まで5刻み。','棒の値から差・合計・割合を求める',['bar-figure-difference','bar-figure-total','bar-figure-share']);
  add('line-data','仮の折れ線グラフ。2020年10、2021年20、2022年15、2023年30。年の間隔は同じ。','区間の変化と全体の変化を区別する',['line-figure-decrease','line-figure-net','line-figure-claim']);
  add('forest-composition','2017年の日本の森林構成の円グラフ。針葉樹の人工林39%、針葉樹の天然林9%、広葉樹の人工林1%、広葉樹の天然林45%、その他6%。森林面積全体を100%とする。','区分をまとめ、分母・倍率・差を考える',['forest-artificial-share','forest-type-compare','forest-natural-total','forest-within-artificial','forest-classified-total','forest-natural-broad-ratio','forest-top-gap'],[],1);
  add('auto-production-table','日本のメーカーの海外自動車生産の表。単位は千台。1995・2000・2005・2010・2021年の順に、アジア1883・1674・3964・7127・10049、北アメリカ2595・2992・4081・3390・3443、ヨーロッパ642・953・1545・1356・1232。3地域だけの抜粋。','行・列・単位を対応させ、順位と変化を比較する',['cars-unit-conversion','cars-asia-increase','cars-nonmonotonic','cars-ranking-transition','sample-v-total','cars-two-region-gap','cars-europe-decline','cars-three-sum','cars-increase-contribution'],[],66);
  add('power-composition','各年の発電量全体を100%とする帯グラフ。水力・火力・原子力・新エネルギーの順に、1950年81.7・18.3・0・0%、2000年8.9・61.3・29.5・0.3%、2020年9.1・83.2・3.9・3.8%。新エネルギーは教材の分類。','凡例と帯を対応させ、割合と量の違いを考える',['percent-v-amount','power-gap-year','power-nuclear-point-drop','power-nonthermal-total','power-largest-point-rise'],[],41);
  add('internet-age','2021年の年齢別インターネット利用率。6〜12歳84.7%、13〜19歳98.7%、20〜29歳98.4%、30〜39歳97.9%、40〜49歳97.7%、50〜59歳95.2%、60〜69歳84.4%、70〜79歳59.4%、80歳以上27.6%。','最大・最小、条件に合う区分、全体の形を読む',['internet-threshold-age','internet-age-not-users','internet-age-range','internet-age-ninety-count','internet-age-shape','internet-oldest-nonusers'],[],71);
  add('internet-income','2021年の所属世帯年収別インターネット利用率。対象は6歳以上の個人（無回答を除く）で、世帯の年収で分類した人の割合。200万円未満55.8%、200〜400万円未満72.9%、400〜600万円未満86.0%、600〜800万円未満92.6%、800〜1000万円未満92.0%、1000万円以上93.4%。','例外・条件に合う区分を見つけ、割合を人数に直す',['internet-income','internet-income-exception','internet-income-count-estimate','internet-income-nearest-ninety'],[],71);
  add('rice-production-consumption','米の生産量と消費量の折れ線。生産量は上下し、消費量は長期的に下がる。数量の線は教材から概数で再構成。','同じ年の2本の線を比較する',['agri-rice-line-compare'],[],2);
  add('crop-import-shares','小麦・大豆・とうもろこしの輸入先の帯グラフ。各作物の輸入量を100%とする。アメリカ合衆国の割合は順に44.2%、75.9%、72.8%。','同じ国の区分を複数の帯で比較する',['agri-import-dependence'],[],9);
  add('meat-virtual-water','肉1kgあたりに必要な水。牛肉20.6t、豚肉5.9t、鶏肉4.5t。','肉の重さと1kgあたりの値を組み合わせる',['agri-water-mass-compare'],[],26);
  add('farmland-denominators','国土全体の耕地12%、それ以外88%。耕地全体の田54%、畑26%、果樹園・茶畑など6%、牧草地14%。上と下の帯で全体が異なる。','2段階の割合と分母を読む',['agri-land-nested-share'],[],33);
  add('farm-population-age','棒は左軸の農業就業人口（万人）：1990年482、2000年389、2010年261、2019年168。線は右軸の農業人口に占める65歳以上の割合で、教材から概数で再構成。','対象の表記と万人・%の2つの縦軸を読み分ける',['agri-workforce-dual-axes'],['second-099'],40);
  add('food-self-sufficiency-table','1960年・2021年の食料自給率（%）。米102・98、小麦39・17、大豆28・7、野菜100・79、果実100・39。','年の列を対応させ、順序・差・残りを比較する',['agri-self-sufficiency-decline'],['second-114','second-115','second-132'],45);
  add('food-consumption-change','1人1日あたりの消費量（g）、1965年・2022年の順に、米306・139、小麦79・87、肉類24・93、果物78・91、野菜249・241、牛乳・乳製品103・257。','凡例・品目・年を対応させ、増減量と倍率を区別する',['agri-consumption-threefold','agri-consumption-max-increase'],['second-133','second-134','second-135','second-136'],55);
  const registry=Object.fromEntries(entries);
  window.QuestionDiagrams={registry,get(q){return registry[q?.objective]||registry[q?.id]||null;}};
})();
