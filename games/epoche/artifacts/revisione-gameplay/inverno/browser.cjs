const {chromium}=require(require.resolve("playwright",{paths:[require("node:path").resolve("../night-circuit")]}));
const fs=require("node:fs"),assert=require("node:assert/strict"),path=require("node:path");
async function main(){
 const browser=await chromium.launch({channel:"chrome",args:["--enable-unsafe-swiftshader"]});
 const issues=[],result=[];
 try {
 for(const lang of ["it","en"]) for(const [id,food] of [["seeds",53],["departure",43],["carry",100],["isolate",28],["care",46]]) {
  const p=await browser.newPage({viewport:{width:1366,height:768}});p.setDefaultTimeout(25000);
  p.on("pageerror",e=>{issues.push(e.message);console.error(e.message)});
  await p.goto((process.env.EPOCHE_QA_BASE || "http://127.0.0.1:5277/") + "?rimedi");
  await p.locator(".language select").selectOption(lang);
  const slot=p.locator(".save-slot").first();
  const save=JSON.parse(fs.readFileSync("artifacts/qa/near-neolithic.json"));
  const a=["seeds","departure","carry"].includes(id);
  Object.assign(save.campaign,{rules:"winter",pending:null,chain:[],crises:[{family:a?"food":"health",severity:a?12:24}],
   deferred:[{due:1,source:"response.winter.0",family:"food",points:a?101:28}],marks:a?{table:3}:{barter:3}});
  save.speed=0;save.savedAt=Date.now();
  await slot.locator("input").setInputFiles({name:"winter.json",mimeType:"application/json",buffer:Buffer.from(JSON.stringify(save))});
  await slot.getByRole("button",{name:lang==="it"?"Continua":"Continue",exact:true}).click();
  await p.locator(".diorama-canvas[data-rendered=true]").waitFor();
  await p.locator(".progress-panel button").first().click();
  const options=p.locator(".hearing-options button");await options.first().waitFor();
  const strings=JSON.parse(fs.readFileSync("src/i18n/campaign-"+lang+".json"));
  const chosen=options.filter({hasText:strings["remedy."+id]});assert((await chosen.innerText()).includes(food+"/100"));
  if(id==="seeds" || id==="isolate")await p.screenshot({path:path.join(process.env.EPOCHE_QA_DIR || __dirname,"disgelo-"+lang+"-"+id+".png")});
  await chosen.focus();await p.keyboard.press("Enter");
  if(food===100){await p.getByRole("button",{name:strings["hearing.replay"]}).click();await p.getByText(strings["hearing.pickSlot"]).waitFor();}
  else{await p.locator(".date-block").getByText(lang==="it"?"Neolitico":"Neolithic",{exact:true}).waitFor();await p.locator(".winter-marks").getByRole("button").first().waitFor();
   if(id==="departure")await p.screenshot({path:path.join(process.env.EPOCHE_QA_DIR || __dirname,"villaggio-"+lang+".png")});}
  result.push({lang,id,food});await p.close();
 }
 assert.deepEqual(issues,[]);fs.writeFileSync(path.join(process.env.EPOCHE_QA_DIR || __dirname,"browser.json"),JSON.stringify(result,null,2));
 }finally{await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
