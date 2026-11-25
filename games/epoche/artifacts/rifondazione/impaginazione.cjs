const {chromium}=require(require.resolve("playwright",{paths:[require("node:path").resolve("../night-circuit")]}));
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
(async()=>{const b=await chromium.launch({channel:"chrome"});try{
 const base=process.env.VALLEY_BASE||"http://127.0.0.1:5286/epoche-campagna/";
 const data=[];
 for(const [width,height] of [[1366,768],[1093,614],[390,844]]){
 const p=await b.newPage({viewport:{width,height}});
 const book={version:1,seed:1,turns:[{order:"haul",job:"together",deliver:false},{order:"pledge",job:"mend",deliver:false}]};
 await p.addInitScript(book=>{if(!localStorage.getItem("epoche.valley.v1.layout"))localStorage.setItem("epoche.valley.v1.layout",JSON.stringify(book));},book);
 await p.goto(base+"?valle=layout");const pins=p.locator(".v-pin");await pins.first().waitFor();
 const before=await pins.first().boundingBox();await pins.first().click();await pins.nth(3).click();
 const after=await pins.first().boundingBox(), confirm=await p.locator(".v-go").boundingBox();
 if(width>800){
  assert(Math.abs(before.y-after.y)<1 && Math.abs(before.x-after.x)<1,"map shifts "+JSON.stringify({width,before,after}));
  assert(confirm.y>=0 && confirm.y+confirm.height<=height,"confirm below fold "+JSON.stringify({width,confirm}));
 }
 await p.screenshot({type:"jpeg",path:path.join(__dirname,"05-patto-"+width+".jpg")});
 await p.locator(".v-go").click();
 if(width===1366){
   await p.locator(".moving").waitFor();await p.screenshot({type:"jpeg",path:path.join(__dirname,"06-movimento.jpg")});
   const places=await p.locator(".v-people").evaluateAll(els=>els.map(e=>e.getAttribute("style")));assert.equal(new Set(places).size,2);
 }
 await p.locator(".v-report").waitFor();
 await p.screenshot({type:"jpeg",path:path.join(__dirname,"07-granaio-"+width+".jpg")});
 data.push({width,height,deltaY:after.y-before.y,confirmBottom:confirm.y+confirm.height,reachable:true});
 await p.close();
 }fs.writeFileSync(path.join(__dirname,"impaginazione.json"),JSON.stringify(data,null,2));
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
