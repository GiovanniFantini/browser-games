const {chromium}=require(require.resolve("playwright",{paths:[require("node:path").resolve("../night-circuit")]}));
const fs=require("node:fs"),assert=require("node:assert/strict");
(async()=>{const b=await chromium.launch({channel:"chrome",args:["--enable-unsafe-swiftshader"]});
try{const results=[];
for(const port of [5277,5278]){
 const p=await b.newPage({viewport:{width:1366,height:768}});await p.goto("http://127.0.0.1:"+port+"/?studio");
 const save=JSON.parse(fs.readFileSync("artifacts/qa/near-neolithic.json"));
 save.savedAt=Date.now();save.speed=0;Object.assign(save.campaign,{rules:"trial",pending:{id:"shell",openedAt:save.campaign.core.tick},chain:[],heritage:[],crises:[]});save.campaign.chronicle=[];save.campaign.core.influence=25;
 const slot=p.locator(".save-slot").first();await slot.locator("input").setInputFiles({name:"studio.json",mimeType:"application/json",buffer:Buffer.from(JSON.stringify(save))});await slot.getByRole("button",{name:"Continua",exact:true}).click();
 const key="epoche.study."+save.campaign.id;
 const entries=()=>p.evaluate(k=>JSON.parse(sessionStorage.getItem(k)||"[]"),key);
 await p.locator(".decision-return").waitFor();assert(!(await entries()).some(x=>x.action==="open"));
 await p.keyboard.press("Space");await p.waitForFunction(k=>JSON.parse(sessionStorage.getItem(k)||"[]").some(e=>e.action==="running"),key);
 await p.locator(".decision-return").click();
 await p.getByRole("button",{name:"Pausa per decidere"}).click();await p.waitForFunction(k=>JSON.parse(sessionStorage.getItem(k)||"[]").at(-1)?.action==="pause",key);
 await p.getByRole("button",{name:"Riprendi il tempo"}).click();
 await p.waitForFunction(k=>JSON.parse(sessionStorage.getItem(k)||"[]").at(-1)?.action==="running",key);
 await p.locator('.event-option[data-choice="2"]').click();
 const trace=await entries();assert(trace.some(e=>e.action==="choice"&&e.choice===2));results.push(trace.map(({action,choice})=>[action,choice]));
 await p.close();
}
assert.deepEqual(results[0],results[1]);fs.writeFileSync(__dirname+"/diario.json",JSON.stringify(results[0]));}
finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
