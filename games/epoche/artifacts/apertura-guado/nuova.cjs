const {chromium}=require(require.resolve("playwright",{paths:[require("node:path").resolve("../night-circuit")]}));const assert=require("node:assert/strict");
(async()=>{const b=await chromium.launch({channel:"chrome"});try{
 const p=await b.newPage(),base=process.env.VALLEY_BASE||"http://127.0.0.1:5286/epoche-campagna/";
 await p.goto(base+"?valle");await p.locator(".v-story").waitFor();await p.waitForFunction(()=>new URL(location.href).searchParams.get("valle")?.length>0);
 const a=p.url(),old=await p.evaluate(()=>localStorage.getItem("epoche.valley.v1."+new URL(location.href).searchParams.get("valle")));
 await p.goto(base+"?valle=nuova");await p.waitForFunction(()=>new URL(location.href).searchParams.get("valle")!=="nuova");const current=p.url();assert.notEqual(current,a);
 assert.equal(await p.locator(".v-opening-choices button").count(),2);assert.equal(await p.locator('[role="alert"]').count(),0);assert.equal(await p.evaluate(url=>localStorage.getItem("epoche.valley.v1."+new URL(url).searchParams.get("valle")),a),old);
 await p.reload();await p.locator(".v-opening-choices").waitFor();assert.equal(p.url(),current);console.log("Nuovo slot, precedente conservato, riapertura verificata.");
 }finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1;});
