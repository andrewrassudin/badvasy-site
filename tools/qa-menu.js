/* Dropdown menu check for v3: sweeps across all menu items both ways, goes down into every panel, leaves. Usage: node tools/qa-menu.js (server on :8123). Prints MENU OK or MENU FAIL. */
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();let fail=0;
for(const w of [1440,1280]){const p=await b.newPage({viewport:{width:w,height:900}});await p.goto('http://localhost:8123/v3/?'+Date.now(),{waitUntil:'networkidle'});
 for(const sc of [0,2500]){await p.evaluate(y=>scrollTo(0,y),sc);await p.waitForTimeout(500);
 const st=()=>p.evaluate(()=>[...document.querySelectorAll('.dd')].map(d=>d.classList.contains('is-open')?1:0).join(''));
 const n=await p.locator('.dd .nl').count();
 // sweep left→right across all items, pausing on each
 for(let i=0;i<n;i++){const bb=await p.locator('.dd .nl').nth(i).boundingBox();await p.mouse.move(bb.x+bb.width/2,bb.y+bb.height/2,{steps:10});await p.waitForTimeout(450);const s=await st();const exp='0'.repeat(i)+'1'+'0'.repeat(n-i-1);if(s!==exp){fail++;console.log(w,sc,'sweep item',i,'state',s,'expected',exp)}}
 // back right→left
 for(let i=n-1;i>=0;i--){const bb=await p.locator('.dd .nl').nth(i).boundingBox();await p.mouse.move(bb.x+bb.width/2,bb.y+bb.height/2,{steps:10});await p.waitForTimeout(450);const s=await st();if(s[i]!=='1'){fail++;console.log(w,sc,'back item',i,s)}}
 // into panel of each and onto last item
 for(let i=0;i<n;i++){const bb=await p.locator('.dd .nl').nth(i).boundingBox();await p.mouse.move(bb.x+bb.width/2,bb.y+bb.height/2,{steps:6});await p.waitForTimeout(300);const it=p.locator('.dd').nth(i).locator('.dd-i').last();const ib=await it.boundingBox();await p.mouse.move(ib.x+30,ib.y+ib.height/2,{steps:14});await p.waitForTimeout(500);const s=await st();if(s[i]!=='1'){fail++;console.log(w,sc,'panel item',i,s)}}
 await p.mouse.move(700,850,{steps:8});await p.waitForTimeout(500);if((await st()).includes('1')){fail++;console.log(w,sc,'did not close')}}
 await p.close()}
console.log(fail?'MENU FAIL '+fail:'MENU OK');await b.close()})();
