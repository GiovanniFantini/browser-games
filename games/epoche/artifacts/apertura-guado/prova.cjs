const {chromium}=require(require.resolve("playwright",{paths:[require("node:path").resolve("../night-circuit")]}));
const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict");
const base=process.env.VALLEY_BASE || "http://127.0.0.1:5286/epoche-campagna/";
const out=process.env.VALLEY_QA_DIR || __dirname;
(async()=>{const b=await chromium.launch({channel:"chrome"});try{
 const rows=[];
 for(const [order,job,seed,viewport,reduced] of [
 ["haul","together",1,[1366,768],false],["shelter","gather",1,[1366,768],false],
 ["shelter","guard",1,[1093,614],false],["shelter","gather",2,[390,844],true]]){
 const p=await b.newPage({viewport:{width:viewport[0],height:viewport[1]},reducedMotion:reduced?"reduce":"no-preference"});
 const errors=[];p.on("pageerror",e=>errors.push(e.message));
 const id="opening-"+job+seed;
 await p.addInitScript(({id,seed})=>{localStorage.setItem("epoche.valley.v1."+id,JSON.stringify({version:1,seed,turns:[]}))},{id,seed});
 await p.goto(base+"?valle="+id);await p.locator(".v-opening-choices").waitFor();
 const frames=[];const frame=async(label)=>frames.push({label,src:"data:image/jpeg;base64,"+(await p.screenshot({type:"jpeg",quality:78})).toString("base64")});
 const count=(await p.locator(".v-story").innerText()).trim().split(/\s+/).length;
 await frame("1 · Prima della scelta");
 const pin=p.locator(".v-pin").nth(order==="haul"?0:2);await pin.focus();await p.keyboard.press("Enter");
 if(job==="guard")await p.locator('[data-job="guard"]').click();
 if(job!=="together")assert.equal(await p.locator('[data-job="'+job+'"]').getAttribute("aria-pressed"),"true");
 if(viewport[0]===390){const rect=await p.locator(".v-go").boundingBox();assert(rect.y>=0 && rect.y+rect.height<=844);assert.notEqual(await p.locator(".v-atlas").evaluate(el=>getComputedStyle(el).transform),"none");}
 await frame("2 · Ordine pronto");const go=p.locator(".v-go");await go.click();
 if(!reduced){await p.waitForTimeout(650);await frame("3 · Squadre al lavoro");}
 await p.locator(".v-report").waitFor();
 if(!reduced){await p.waitForTimeout(520);await frame("4 · Passaggio della piena");await p.waitForTimeout(1450);}
 await frame("5 · Scorte dopo la piena");assert.equal(await p.locator(".v-drifting-log").count(),seed===1&&order==="shelter"?(job==="guard"?1:2):0);
 const book=await p.evaluate(id=>JSON.parse(localStorage.getItem("epoche.valley.v1."+id)),id);assert.equal(book.turns.length,1);
 const info={order,job,seed,width:viewport[0],reduced,words:count,result:await p.locator(".v-report").innerText(),errors};assert.deepEqual(errors,[]);rows.push(info);
 const img=await p.evaluate(async frames=>{const can=document.createElement("canvas"),w=500,h=300;can.width=w*2;can.height=(h+24)*Math.ceil(frames.length/2);const c=can.getContext("2d");c.fillStyle="#ece9dc";c.fillRect(0,0,can.width,can.height);
 for(let i=0;i<frames.length;i++){const im=new Image();im.src=frames[i].src;await im.decode();const x=i%2*w,y=Math.floor(i/2)*(h+24),k=Math.min(w/im.width,h/im.height);c.drawImage(im,x,y,im.width*k,im.height*k);c.fillStyle="#193d31";c.font="16px sans-serif";c.fillText(frames[i].label,x+6,y+h+18);}
 return can.toDataURL("image/jpeg",.88).split(",")[1];},frames);
 fs.writeFileSync(path.join(out,id+".jpg"),Buffer.from(img,"base64"));await p.close();
 }fs.writeFileSync(path.join(out,"esiti.json"),JSON.stringify(rows,null,2));
}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
