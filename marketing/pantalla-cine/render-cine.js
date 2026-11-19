// Exporta la animación a fotogramas: node render-cine.js [fps] [lista,de,tiempos]
const { chromium } = require('playwright'); const fs=require('fs'), path=require('path');
const DIR=__dirname, OUT=process.env.OUT||path.join(DIR,'frames'), FPS=+(process.argv[2]||60), only=process.argv[3], DUR=16.4;
(async()=>{fs.mkdirSync(OUT,{recursive:true});const b=await chromium.launch();const p=await b.newPage({viewport:{width:1920,height:1080}});
 await p.goto('file://'+path.join(DIR,'obraweb-cine.html')+'?export');await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(1000);
 const ts= only? only.split(',').map(Number) : [...Array(Math.round(DUR*FPS)).keys()].map(i=>i/FPS);
 let i=0; for(const t of ts){await p.evaluate(t=>render(t),t);const c=await p.$('#c');
   await c.screenshot({path: only? path.join(OUT,'prev_'+t+'.jpg') : path.join(OUT,String(i).padStart(5,'0')+'.jpg'),type:'jpeg',quality:93}); i++;}
 await b.close();console.log('frames',i);})();
