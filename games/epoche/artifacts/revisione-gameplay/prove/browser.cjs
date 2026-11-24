const { chromium } = require(require.resolve("playwright", { paths: [require("node:path").resolve("../night-circuit")] }));
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const out=__dirname,qa=path.resolve("artifacts/qa");
async function main(){
  const browser=await chromium.launch({channel:"chrome",args:["--enable-unsafe-swiftshader"]});
  const issues=[], measurements=[];
  const expected=JSON.parse(fs.readFileSync(path.join(out,"genesi.json"),"utf8"));
  try {
    for (const width of [1366,1920]) for(const language of ["it","en"]) {
      const page=await browser.newPage({viewport:{width,height:width===1366?768:1080}});
      page.on("pageerror",e=>issues.push(e.message));
      await page.goto("http://127.0.0.1:5277/");
      await page.locator(".language select").selectOption(language);
      const slot=page.locator(".save-slot").first();
      await slot.getByRole("button").first().click();
      await page.locator(".genesis details summary").click();
      await page.locator(".genesis-seed input").fill("23");
      for(let step=0;step<4;step++){
        const slider=page.locator('input[type="range"]');
        for(const value of [50,0,100]){
          await slider.focus();
          if(value!==50) await slider.press(value===0?"Home":"End");
          const text=await page.locator(".genesis-effect").innerText();
          const values=Array.from(text.replaceAll(",",".").matchAll(/[+-]?\d+(?:\.\d+)?/g),m=>Number(m[0]));
          assert.deepEqual(values,expected.find(row=>row.stage===step&&row.value===value).expect);
        }
        if(step===0)await page.screenshot({path:path.join(out,"genesi-"+language+"-"+width+".png")});
        if(step<3)await page.locator(".gate-actions button").last().click();
      }
      await page.goto("http://127.0.0.1:5277/");
      const save=JSON.parse(fs.readFileSync(path.join(qa,"future.json")));
      save.savedAt=Date.now();save.speed=0;save.campaign.pending=null;save.campaign.crises=[{family:"health",severity:24}];
      await slot.locator("input[type=file]").setInputFiles({name:"save.json",mimeType:"application/json",buffer:Buffer.from(JSON.stringify(save))});
      await slot.getByRole("button",{name:language==="it"?"Continua":"Continue",exact:true}).click();
      await page.locator(".diorama-canvas[data-rendered=true]").waitFor();
      assert(await page.locator(".progress-reforms").evaluate(e=>e.open));
      const health=page.locator(".crisis-list span").filter({hasText:"24%"});await health.waitFor();
      const exposed=await health.evaluate(e=>{const r=e.getBoundingClientRect();return e.contains(document.elementFromPoint(r.left+r.width/2,r.top+r.height/2));});assert(exposed);
      const box=await page.evaluate(()=>{const lang=document.querySelector(".game-header .language").getBoundingClientRect();const name=document.querySelector(".resources > div:last-child dd");const range=document.createRange();range.selectNodeContents(name);return {right:range.getBoundingClientRect().right,left:lang.left,width:document.documentElement.scrollWidth};});
      measurements.push({language,width,...box});assert(box.right<=box.left+1);assert(box.width<=width);
      await page.screenshot({path:path.join(out,"futuro-"+language+"-"+width+".png")});await page.close();
    }
    for(const port of [5277,5278]){
      const p=await browser.newPage({viewport:{width:1366,height:768}});
      await p.goto("http://127.0.0.1:"+port+"/?studio");const slot=p.locator(".save-slot").first();
      const save=JSON.parse(fs.readFileSync(path.join(out,"registro-bronzo.json")));save.savedAt=Date.now();
      await slot.locator("input[type=file]").setInputFiles({name:"study.json",mimeType:"application/json",buffer:Buffer.from(JSON.stringify(save))});
      await slot.getByRole("button",{name:"Continua",exact:true}).click();
      const button=p.getByRole("button",{name:"Esporta il diario della prova"});await button.waitFor(); const exporting=p.waitForEvent("download");await button.click();
      const entry=JSON.parse(fs.readFileSync(await (await exporting).path())).find(x=>x.event==="ledger" && x.action==="open");
      assert.equal(entry.action,"open");
      await p.goto("http://127.0.0.1:"+port+"/");await p.locator(".save-slot").first().waitFor();assert.equal(await p.getByRole("button",{name:"Continua",exact:true}).count(),0);
      await p.locator(".save-slot").first().locator("input").setInputFiles({name:"study.json",mimeType:"application/json",buffer:Buffer.from(JSON.stringify(save))});
      await p.getByText(/modalità di origine/).waitFor();
      assert.equal(await p.getByRole("button",{name:"Continua",exact:true}).count(),0);await p.close();
    }
    assert.deepEqual(issues,[]);fs.writeFileSync(path.join(out,"browser.json"),JSON.stringify(measurements,null,2));
  }finally{await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
