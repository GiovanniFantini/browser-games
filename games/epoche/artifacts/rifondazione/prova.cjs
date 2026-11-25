const {chromium}=require(require.resolve("playwright",{paths:[require("node:path").resolve("../night-circuit")]}));
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const output=process.env.VALLEY_QA_DIR || __dirname;
const cases=[
 {name:"ospite",lang:"it",seed:2,ending:"Il primo raccolto",steps:[["shelter","gather"],["forage","mend"],["common","gather"],["fell","shelterGuest"],["sow","together"]]},
 {name:"barca",lang:"en",seed:1,ending:"A new shore",steps:[["haul","together"],["pledge","mend"],["private","trade"],["eat","gather"],["cross","together"]]},
 {name:"rottura",lang:"it",seed:1,ending:"Il primo raccolto",steps:[["shelter","guard"],["pledge","mend"],["common","mend"],["fell","shelterGuest"],["sow","together"]]},
 {name:"dispersione",lang:"it",seed:1,ending:"I fuochi si dividono",steps:[["shelter","gather"],["forage","gather"],["private","gather"],["fell","gather"],["stay","together"]]},
];
async function main(){
 const b=await chromium.launch({channel:"chrome"});const results=[];
 try{for(const c of cases){
 const p=await b.newPage({viewport:{width:1366,height:768}});const errors=[];
 p.on("pageerror",e=>errors.push(e.message));
 const id="test-"+c.name;
 await p.addInitScript(({id,seed})=>{const key="epoche.valley.v1."+id;if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify({version:1,seed,turns:[]}));},{id,seed:c.seed});
 await p.goto((process.env.VALLEY_BASE||"http://127.0.0.1:5285/")+"?valle="+id);
 await p.locator(".v-tools select").selectOption(c.lang);
 await p.locator("footer select").selectOption("25");
 const snap=file=>p.screenshot({path:path.join(output,file+".jpg"),type:"jpeg",quality:82});
 const gameUrl=p.url();
 for(let i=0;i<c.steps.length;i++){
   const [o,j]=c.steps[i];await p.locator(".v-choices button").first().waitFor();
   if(i===0){await p.locator(".v-pin").nth(0).click();await p.locator(".v-undo").click();}
   if(i===0 || (c.name==="rottura" && (i===1 || i===2))){
     const loc=i===0?(o==="haul"?0:2):i===1?3:1;
     const pin=p.locator(".v-pin").nth(loc);await pin.focus();await p.keyboard.press("Enter");
     assert.equal(await p.locator('[data-order="'+o+'"]').getAttribute("aria-pressed"),"true");
   }else await p.locator('[data-order="'+o+'"]').click();
   if(c.name==="rottura" && j!=="together"){const pin=p.locator(".v-pin").nth({guard:2,mend:1,shelterGuest:1}[j]);await pin.focus();await p.keyboard.press("Enter");}
   else await p.locator('[data-job="'+j+'"]').click();
   assert.equal(await p.locator('[data-job="'+j+'"]').getAttribute("aria-pressed"),"true");
   if(c.name==="ospite" && i===0)await snap("01-piena");
   if(c.name==="barca" && i===2)await snap("02-patto");
   await p.locator(".v-go").click();await p.locator(".v-report").waitFor();
   if(c.name==="rottura" && i===0)await snap("04-piena-alta");
   if(i<4){await p.locator(".v-report .v-go").click();if(i===2){await p.reload();await p.locator(".v-choices button").first().waitFor();await p.locator("footer select").selectOption("25");}}
 }
 const final=await p.locator(".v-report h1").innerText();assert.equal(final,c.ending);
 await snap("03-"+c.name);await p.locator(".v-tools button").nth(1).click();
 assert.equal(await p.locator(".v-log li").count(),5);
 await p.locator(".v-drawer button").first().click();await p.locator(".v-report .v-go").click();
 assert.notEqual(p.url(),gameUrl);assert.equal(await p.locator(".v-kicker").count(),1);
 assert.deepEqual(errors,[]);results.push({name:c.name,seed:c.seed,final,errors});
 await p.close();
 }
 fs.writeFileSync(path.join(output,"browser.json"),JSON.stringify(results,null,2));
 }finally{await b.close();}
}main().catch(e=>{console.error(e);process.exitCode=1;});
