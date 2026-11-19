const { chromium } = require('playwright');
const V='/tmp/claude-0/-home-user-OBRAWEB/65b4e977-7bf8-58b0-9c74-d8350284510e/scratchpad/video/';
const fs=require('fs'); const FPS=30, DUR=13.6, only=process.argv[2];
(async()=>{fs.mkdirSync(V+'frames',{recursive:true});
 const b=await chromium.launch();const p=await b.newPage({viewport:{width:1080,height:1920},deviceScaleFactor:1});
 await p.goto('file://'+V+'stage.html');await p.waitForLoadState('networkidle');await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(800);
 const times= only? only.split(',').map(Number) : [...Array(Math.round(DUR*FPS)).keys()].map(i=>i/FPS);
 let i=0; for(const t of times){await p.evaluate(t=>render(t),t); await p.screenshot({path: only? V+'prev_'+t+'.jpg' : V+'frames/'+String(i).padStart(4,'0')+'.jpg',type:'jpeg',quality:92}); i++;}
 await b.close(); console.log('frames',i);})();
