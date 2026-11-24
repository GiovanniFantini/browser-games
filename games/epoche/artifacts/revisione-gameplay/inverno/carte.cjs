const {chromium}=require(require.resolve("playwright",{paths:[require("node:path").resolve("../night-circuit")]}));
const fs=require("node:fs"),assert=require("node:assert/strict"),path=require("node:path");
(async()=>{const b=await chromium.launch({channel:"chrome",args:["--enable-unsafe-swiftshader"]});try{
 const report=[];
 for(const [era,id,heritage,count] of [["near-neolithic","winter",[],5],["future","habitatWorkshop",[],4],["future","habitatWorkshop",["nightSchool","wheel"],6]]){
  const p=await b.newPage({viewport:{width:1366,height:768}});await p.goto("http://127.0.0.1:5277/?rimedi");
  const slot=p.locator(".save-slot").first(),save=JSON.parse(fs.readFileSync("artifacts/qa/"+era+".json"));
  Object.assign(save.campaign,{rules:"winter",pending:{id,openedAt:save.campaign.core.tick},chain:[],heritage,renewedIn:heritage.includes("nightSchool")?{nightSchool:8}:{},deferred:[],crises:[]});save.campaign.core.influence=25;save.savedAt=Date.now();save.speed=0;
  await slot.locator("input").setInputFiles({name:"cards.json",mimeType:"application/json",buffer:Buffer.from(JSON.stringify(save))});await slot.getByRole("button",{name:"Continua",exact:true}).click();
  const options=p.locator(".winter-cards button");await options.first().waitFor();assert.equal(await options.count(),count);
  const rects=await options.evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect();return {x:r.x,y:r.y,bottom:r.bottom};}));
  if(count===4){assert.equal(new Set(rects.map(r=>r.y)).size,2);assert(rects.every(r=>r.bottom<=768));}
  await p.screenshot({path:path.join(__dirname,"carte-"+count+".png")});await options.last().focus();await p.keyboard.press("Enter");report.push({count,rects});await p.close();
 }fs.writeFileSync(path.join(__dirname,"carte.json"),JSON.stringify(report,null,2));
 }finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
