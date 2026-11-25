const {chromium}=require(require.resolve("playwright",{paths:[require("node:path").resolve("../night-circuit")]}));
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
(async()=>{const b=await chromium.launch({channel:"chrome"});try{
 const base=process.env.VALLEY_BASE||"http://127.0.0.1:5286/epoche-campagna/";
 const results=[];
 for(const [width,height] of [[1093,614],[390,844]]){
 const p=await b.newPage({viewport:{width,height},reducedMotion:"reduce"});
 const errors=[];p.on("pageerror",e=>errors.push(e.message));p.on("response",r=>{if(r.status()>=400)errors.push(r.url());});
 await p.goto(base);await p.locator('a[href="?valle"]').click();
 await p.locator(".v-pin").first().click();await p.locator(".v-go").focus();await p.keyboard.press("Enter");await p.locator(".v-report").waitFor();
 const first=p.url();
 await p.locator(".v-tools button").first().click();
 const out=p.waitForEvent("download");await p.locator(".v-drawer > button").last().click();const f=await (await out).path();
 const book=JSON.parse(fs.readFileSync(f));assert.equal(book.turns.length,1);
 await p.locator("input[type=file]").setInputFiles({name:"copy.json",mimeType:"application/json",buffer:Buffer.from(JSON.stringify(book))});
 await p.waitForFunction(orig=>location.href!==orig,first);
 await p.locator(".v-choices button").first().waitFor();
 const layout=await p.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth);
 assert(layout);assert.deepEqual(errors,[]);
 for(const img of ["valle-guado.jpg","valle-terreno.jpg"]){const r=await p.request.get(base+"art/"+img);assert.equal(r.status(),200);assert((await r.body())[0]===0xff);}
 results.push({width,height,exportImport:true,horizontalOverflow:!layout,errors});await p.close();
 }
 fs.writeFileSync(path.join(__dirname,"ripresa.json"),JSON.stringify(results,null,2));
 }finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
