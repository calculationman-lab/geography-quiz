/* Build question charts from source-page data. Run: node tools/build-diagram-charts.cjs */
'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const root=path.join(__dirname,'..'),data=JSON.parse(fs.readFileSync(path.join(__dirname,'diagram-data.json'),'utf8'));
const C={teal:'#079c97',blue:'#328ad4',orange:'#ed8d34',gold:'#f1c64f',purple:'#9873bf',green:'#65ac4b',gray:'#c4c9ce'};
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
const n=x=>Number(x.toFixed(6));
let parts=[];
function text(x,y,s,size=32,anchor='middle',weight=400){parts.push(`<text x="${n(x)}" y="${n(y)}" font-size="${size}" text-anchor="${anchor}" font-weight="${weight}">${esc(s)}</text>`);}
function lines(x,y,ss,size=32,anchor='middle',gap=43){ss.forEach((s,i)=>text(x,y+i*gap,s,size,anchor));}
function line(x1,y1,x2,y2,color='#293747',width=2,attrs=''){parts.push(`<line x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}" stroke="${color}" stroke-width="${width}" ${attrs}/>`);}
function rect(x,y,w,h,fill,attrs=''){parts.push(`<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" fill="${fill}" ${attrs}/>`);}
function dot(x,y,color,r=6){parts.push(`<circle cx="${n(x)}" cy="${n(y)}" r="${r}" fill="${color}"/>`);}
function leader(points,color='#44515d'){parts.push(`<polyline points="${points.map(p=>p.map(n).join(',')).join(' ')}" fill="none" stroke="${color}" stroke-width="2.5"/>`);dot(points[0][0],points[0][1],color,4);}
function legend(x,y,label,color){rect(x,y-28,36,28,color);text(x+50,y,label,30,'start');}
function footer(ss){lines(768,ss.length===1?975:944,ss,26,'middle',35);}
function begin(title){parts=[`<svg xmlns="http://www.w3.org/2000/svg" width="1536" height="1024" viewBox="0 0 1536 1024" role="img"><title>${esc(title)}</title><style>text{font-family:system-ui,"Yu Gothic",Meiryo,sans-serif;fill:#172d3d}*{box-sizing:border-box}</style><rect width="1536" height="1024" fill="white"/>`];text(768,78,title,50,'middle',700);}
function axis(x,y,w,h,min,max,step,unit){
  const yy=v=>y+h-(v-min)/(max-min)*h;
  for(let v=min;v<=max;v+=step){line(x,yy(v),x+w,yy(v),'#dce3e8',1.5);text(x-22,yy(v)+10,String(v),30,'end');line(x-8,yy(v),x,yy(v));}
  line(x,y,x,y+h);line(x,y+h,x+w,y+h);if(unit)text(x,y-30,unit,30,'start');return yy;
}
function scale(x,y,w){line(x,y,x+w,y);for(let v=0;v<=100;v+=20){const xx=x+w*v/100;line(xx,y,xx,y+14);text(xx,y+51,v+'%',30);}}
function band(values,labels,colors,x,y,w,h,row,labelsInside=true){let sum=0;values.forEach((v,i)=>{if(v===0)return;const xx=x+w*sum/100,ww=w*v/100;rect(xx,y,ww,h,colors[i],`data-kind="segment" data-row="${row}" data-value="${v}" data-total-width="${w}" data-category="${esc(labels[i])}"`);if(labelsInside&&ww>=100)text(xx+ww/2,y+h/2+12,v.toFixed(1)+'%',34);sum+=v;});}
function pie(d){
  const cx=768,cy=480,r=285,colors=[C.teal,C.orange,C.blue,C.gold,C.purple];let a=-90;
  const loc=deg=>[cx+r*Math.cos(deg*Math.PI/180),cy+r*Math.sin(deg*Math.PI/180)];
  d.values.forEach((v,i)=>{const b=a+v*3.6,p=loc(a),q=loc(b);parts.push(`<path d="M ${cx} ${cy} L ${p.map(n).join(' ')} A ${r} ${r} 0 ${v>50?1:0} 1 ${q.map(n).join(' ')} Z" fill="${colors[i]}" data-kind="sector" data-value="${v}" data-start-angle="${n(a)}" data-end-angle="${n(b)}"/>`);a=b;});
  const p=deg=>[cx+(r-12)*Math.cos(deg*Math.PI/180),cy+(r-12)*Math.sin(deg*Math.PI/180)];
  const specs=[{xy:[1105,275],tail:[[1075,302],[1090,302]],angle:-19.8},{xy:[1100,718],tail:[[1060,746],[1080,746]],angle:66.6},{xy:[965,850],tail:[[820,830],[945,830]],angle:84.6},{xy:[78,463],tail:[[432,490],[395,490]],angle:167.4},{xy:[240,175],tail:[[600,185],[465,185]],angle:259.2}];
  specs.forEach((s,i)=>{leader([p(s.angle),...s.tail]);lines(...s.xy,[d.labels[i],d.values[i]+'%'],34,'start',47);});
  footer(['日本の森林面積を100%とする']);
}
function power(d){
  const x=220,w=1190,h=105,ys=[290,500,710],colors=[C.blue,C.orange,C.green,C.gold];
  d.labels.forEach((s,i)=>legend(280+i*275,173,s,colors[i]));
  d.values.forEach((vs,i)=>{text(190,ys[i]+67,d.years[i]+'年',35,'end',600);band(vs,d.labels,colors,x,ys[i],w,h,i);});
  leader([[1408.2,552],[1440,475]]);text(1450,453,'0.3%',30);
  const v=d.values[2],centers=[x+w*(v[0]+v[1]+v[2]/2)/100,x+w*(100-v[3]/2)/100];
  leader([[centers[0],742],[1290,671]]);text(1270,650,'3.9%',30);
  leader([[centers[1],742],[1453,671]]);text(1460,650,'3.8%',30);
  scale(x,857,w);footer(['新エネルギーは教材の分類。各年の発電量全体を100%とする']);
}
function crops(d){
  const cmap={'アメリカ合衆国':C.teal,'カナダ':C.blue,'オーストラリア':C.orange,'ブラジル':C.gold,'アルゼンチン':C.purple,'その他':C.gray};
  const lx=[70,455,705,70,455,705],ly=[155,155,155,205,205,205];Object.keys(cmap).forEach((s,i)=>legend(lx[i],ly[i],s,cmap[s]));
  const x=260,w=1140,h=98,ys=[290,490,690];d.values.forEach((vs,i)=>{
    text(232,ys[i]+63,d.labels[i],32,'end',600);band(vs,d.countries[i],d.countries[i].map(s=>cmap[s]),x,ys[i],w,h,i,false);
    let sum=0;vs.forEach((v,k)=>{const xx=x+w*(sum+v/2)/100;
      if(v>=7){text(xx,ys[i]+62,v.toFixed(1)+'%',32);}
      else{const labelX=k===3?1440:xx;leader([[xx,ys[i]+70],[labelX,ys[i]+130]]);text(labelX,ys[i]+165,v.toFixed(1)+'%',29);}
      sum+=v;
    });
  });scale(x,866,w);footer(['教材掲載の2023年版資料。各作物の輸入量を100%とする']);
}
function farmland(d){
  const x=180,w=1200,h=105,upperY=280,lowerY=660;
  text(x,223,'国土全体を100%とする',36,'start',600);
  band(d.upperValues,d.upperLabels,[C.teal,C.gray],x,upperY,w,h,0,false);
  lines(x+72,320,['耕地','12%'],30,'middle',46);lines(x+144+528,320,['森林・住宅地・川など','88%'],34,'middle',50);
  line(x,385,x,660,'#6b7780',2.5,'stroke-dasharray="10 8" data-guide="left"');
  line(x+144,385,x+w,660,'#6b7780',2.5,'stroke-dasharray="10 8" data-guide="right"');
  text(x+40,580,'耕地全体を100%とする',36,'start',600);
  band(d.lowerValues,d.lowerLabels,[C.teal,C.blue,C.gold,C.green],x,lowerY,w,h,1,false);
  lines(x+324,701,['田','54%'],36,'middle',52);lines(x+648+156,701,['畑','26%'],36,'middle',52);
  lines(x+1200-84,701,['牧草地','14%'],31,'middle',49);
  leader([[x+960+36,735],[x+996,825]]);lines(x+996,867,['果樹園・茶畑など','6%'],30,'middle',46);
  text(x,upperY-15,'0%',28);text(x+w,upperY-15,'100%',28);
  text(x,lowerY+h+48,'0%',28);text(x+w,lowerY+h+48,'100%',28);
}
function population(d){
  const x=210,y=260,w=1100,h=555,baseline=y+h,yy=axis(x,y,w,h,0,500,100,''),right=v=>baseline-v/80*h;
  parts.push('<text x="55" y="537.5" transform="rotate(-90 55 537.5)" font-size="30" text-anchor="middle">農業就業人口（万人）</text>');
  text(x+w,y-30,'割合（%）',30,'end');line(x+w,y,x+w,baseline);
  for(let v=0;v<=80;v+=10){line(x+w,right(v),x+w+8,right(v));text(x+w+22,right(v)+10,String(v),29,'start');}
  const xs=d.years.map(v=>x+110+(v-1990)/29*(w-220));
  d.population.forEach((v,i)=>{rect(xs[i]-55,yy(v),110,baseline-yy(v),C.teal,`data-kind="bar" data-value="${v}" data-max="500" data-baseline="${baseline}" data-scale-height="${h}"`);text(xs[i],yy(v)-18,v,36,'middle',600);text(xs[i],baseline+51,d.years[i]+'年',30);});
  const pts=xs.map((xx,i)=>[xx,right(d.percentApproximate[i])]);parts.push(`<polyline points="${pts.map(p=>p.map(n).join(',')).join(' ')}" fill="none" stroke="${C.orange}" stroke-width="6" data-kind="percentage-line"/>`);pts.forEach(p=>dot(...p,C.orange,7));
  legend(245,145,'農業就業人口',C.teal);legend(245,195,'農業人口に占める65歳以上の割合',C.orange);footer(['教材のグラフを再構成。割合の線は概数']);
}
function rice(d){
  const x=185,y=210,w=1230,h=585,yy=axis(x,y,w,h,800,1500,100,'万トン'),xx=v=>x+(v-1960)/(2019-1960)*w;
  legend(445,153,'生産量',C.teal);legend(845,153,'消費量',C.orange);
  for(const [key,color] of [['productionApproximate',C.teal],['consumptionApproximate',C.orange]]){
    const pts=d.years.map((v,i)=>[xx(v),yy(d[key][i])]);parts.push(`<polyline points="${pts.map(p=>p.map(n).join(',')).join(' ')}" fill="none" stroke="${color}" stroke-width="5" stroke-linejoin="round" data-kind="${key}"/>`);pts.forEach(p=>dot(...p,color,5));
  }
  d.years.forEach(v=>{line(xx(v),795,xx(v),808);text(xx(v),v>=2015?879:847,v,27);});
  // Explicit break: chart starts at800, not zero.
  parts.push(`<path d="M 169 815 l 8 -7 l 8 7 l 8 -7 l 8 7 M 169 830 l 8 -7 l 8 7 l 8 -7 l 8 7" fill="none" stroke="#293747" stroke-width="3"/>`);
  footer(['教材のグラフを再構成。線の位置は概数']);
}
function practiceLine(d){
  const x=185,y=200,w=1220,h=620,yy=axis(x,y,w,h,0,35,5,''),xs=d.labels.map((v,i)=>x+i*w/3);
  const pts=xs.map((xx,i)=>[xx,yy(d.values[i])]);parts.push(`<polyline points="${pts.map(p=>p.map(n).join(',')).join(' ')}" fill="none" stroke="${C.teal}" stroke-width="6" data-kind="practice-line"/>`);
  pts.forEach((p,i)=>{dot(...p,C.teal,9);text(p[0],p[1]-24,d.values[i],35);line(p[0],820,p[0],835);text(p[0],890,d.labels[i]+'年',34);});
}
function bars(d,asset){
  const many=d.values.length>6,x=175,y=190,w=1250,h=many?585:580,baseline=y+h,yy=axis(x,y,w,h,0,d.axisMax,d.step,d.unit==='%'?'':d.unit?'水の量（t）':'');
  if(d.unit==='%')text(55,140,'利用率（%）',28,'start');
  const cell=w/d.values.length,bw=cell*.55;
  d.values.forEach((v,i)=>{const cx=x+cell*(i+.5);rect(cx-bw/2,yy(v),bw,baseline-yy(v),C.blue,`data-kind="bar" data-value="${v}" data-max="${d.axisMax}" data-baseline="${baseline}" data-scale-height="${h}"`);text(cx,yy(v)-16,d.unit==='%'?v.toFixed(1)+'%':String(v),many?28:34);
    const s=d.labels[i];let ss=[s];if(asset==='internet-income')ss=s.replace('万円','万円|').split('|');else if(many)ss=s.replace('歳','|歳').split('|');lines(cx,baseline+53,ss,many?27:29,'middle',45);
  });
  if(asset==='internet-income')footer(['対象：6歳以上の個人（無回答を除く）','世帯の年収で分類。利用率は人の割合']);
  else if(asset==='internet-age')footer(['対象：6歳以上の個人（無回答を除く）。教材掲載の2021年調査の値']);
  else if(asset==='meat-virtual-water')footer(['教材掲載の値。肉はいずれも1kgあたり']);
}
function food(d){
  const x=165,y=205,w=1260,h=575,yy=axis(x,y,w,h,0,350,50,'消費量（g）'),cell=w/6,colors=[C.teal,C.orange];
  legend(515,150,'1965年',colors[0]);legend(875,150,'2022年',colors[1]);
  d.values.forEach((row,i)=>{const cx=x+cell*(i+.5);row.forEach((v,k)=>{const bx=cx+(k?7:-62);rect(bx,yy(v),55,y+h-yy(v),colors[k],`data-kind="bar" data-row="${i}" data-value="${v}" data-max="350" data-baseline="${y+h}" data-scale-height="${h}"`);text(bx+27.5,yy(v)-16,v,30);});lines(cx,835,i===5?['牛乳・','乳製品']:[d.labels[i]],30,'middle',42);});footer(['1人1日あたりの消費量。教材掲載の値']);
}
const builders={'forest-composition':pie,'power-composition':power,'crop-import-shares':crops,'farmland-denominators':farmland,'farm-population-age':population,'rice-production-consumption':rice,'line-data':practiceLine,'food-consumption-change':food};
const metadata=[];
for(const [asset,d]of Object.entries(data)){
  if(d.kind==='table')continue;begin(d.title);(builders[asset]||bars)(d,asset);parts.push('</svg>');
  const svg=parts.join('\n')+'\n',file=`assets/diagrams/${asset}.svg`;fs.writeFileSync(path.join(root,file),svg);
  metadata.push({asset,path:file,generator:'source-data SVG',width:1536,height:1024,sourceFile:d.sourceFile||null,sourcePage:d.sourcePage||null,approximate:['dual','dual-line'].includes(d.kind),sha256:crypto.createHash('sha256').update(svg).digest('hex')});
}
fs.writeFileSync(path.join(root,'qa/diagram-audit-20261006/charts.json'),JSON.stringify(metadata,null,2)+'\n');
console.log(`Built ${metadata.length} numerical charts from source data`);
