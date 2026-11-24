const {chromium}=require(require.resolve("playwright",{paths:[require("node:path").resolve("../night-circuit")]}));
const fs=require("node:fs"),assert=require("node:assert/strict"),path=require("node:path");
(async()=>{const b=await chromium.launch({channel:"chrome",args:["--enable-unsafe-swiftshader"]});try{
const results=[];
for(const remedy of ["carry","condone","returnClan","renew","share"]){
 const p=await b.newPage({viewport:{width:1366,height:768}});await p.goto((process.env.EPOCHE_QA_BASE || "http://127.0.0.1:5277/") + "?studio=inverno");
 const slot=p.locator(".save-slot").first(),s=JSON.parse(fs.readFileSync("artifacts/revisione-gameplay/prove/registro-bronzo.json"));
 Object.assign(s.campaign,{rules:"winterStudy",crises:[],marks:remedy==="share"?{barter:3,hut:3}:{table:3,clan:3},chain:[]});s.savedAt=Date.now();s.speed=0;s.campaign.core.influence=25;
 await slot.locator("input").setInputFiles({name:"registro.json",mimeType:"application/json",buffer:Buffer.from(JSON.stringify(s))});await slot.getByRole("button",{name:"Continua",exact:true}).click();
 await p.locator(".winter-cards button").nth(1).click();const options=p.locator(".hearing-options button");await options.first().waitFor();
 const names=JSON.parse(fs.readFileSync("src/i18n/campaign-it.json"));
 if(remedy==="renew"||remedy==="share")await p.screenshot({path:path.join(process.env.EPOCHE_QA_DIR || __dirname,"registro-"+remedy+".png")});
 await options.filter({hasText:names[remedy==="carry"?"hearing.collect":"remedy."+remedy]}).click();
 await p.getByText("Prova conclusa",{exact:true}).waitFor();const download=p.waitForEvent("download");await p.getByRole("button",{name:"Esporta il diario della prova"}).click();const diary=JSON.parse(fs.readFileSync(await (await download).path()));assert(diary.some(x=>x.remedy===remedy && x.offered.includes(remedy) && typeof x.target==="number"));results.push(remedy);
 await p.close();
}
fs.writeFileSync(path.join(process.env.EPOCHE_QA_DIR || __dirname,"registro.json"),JSON.stringify(results));}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
