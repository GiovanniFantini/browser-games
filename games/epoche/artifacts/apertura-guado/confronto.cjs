const {chromium}=require(require.resolve("playwright",{paths:[require("node:path").resolve("../night-circuit")]}));const fs=require("node:fs"),path=require("node:path");
(async()=>{const b=await chromium.launch({channel:"chrome"});try{const rows=[];
for(const [version,url] of [["pubblicata","https://giovannifantini.github.io/browser-games/epoche-campagna/"],["candidata","http://127.0.0.1:5285/"]]){
const p=await b.newPage();await p.goto(url+"?valle");const panel=p.locator(".v-story");await panel.waitFor();const count=async()=>(await panel.innerText()).trim().split(/\s+/).length;const prima=await count();await p.locator('[data-order="shelter"]').click();await p.locator('[data-job="gather"]').click();rows.push({version,prima,squadreAssegnate:await count()});await p.close();}
fs.writeFileSync(path.join(__dirname,"parole.json"),JSON.stringify(rows,null,2));console.log(rows);}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1});
