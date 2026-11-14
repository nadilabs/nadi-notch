// Browser-level regression test for Nadi preview animations.
// Runs the ACTUAL index.html in installed system Chrome via Chrome DevTools
// Protocol, without npm installs, snapshots, or GitHub artifact uploads.
import assert from "node:assert/strict";
import {spawn,execFileSync} from "node:child_process";
import {existsSync,mkdtempSync,readFileSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {pathToFileURL} from "node:url";

const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const binaries=[process.env.CHROME_BIN,"google-chrome","google-chrome-stable","chromium","chromium-browser"].filter(Boolean);
let chromeBinary=null;
for(const bin of binaries){
 try{chromeBinary=execFileSync("which",[bin],{encoding:"utf8"}).trim();break;}
 catch{if(existsSync(bin)){chromeBinary=bin;break;}}
}
assert.ok(chromeBinary,"No installed Chrome/Chromium browser available for rendered motion smoke test");
const profile=mkdtempSync(join(tmpdir(),"nadi-preview-chrome-"));
const chrome=spawn(chromeBinary,[
 "--headless=new","--no-sandbox","--disable-gpu",
 "--disable-dev-shm-usage","--no-first-run","--no-default-browser-check",
 "--disable-background-timer-throttling","--disable-renderer-backgrounding",
 "--disable-backgrounding-occluded-windows","--disable-extensions",
 "--disable-background-networking","--no-proxy-server",
 "--window-size=1400,900","--remote-debugging-port=0",
 "--user-data-dir="+profile,"about:blank"
],{stdio:"ignore"});
let socket=null;
try{
 const portFile=join(profile,"DevToolsActivePort");
 for(let n=0;n<130&&!existsSync(portFile);n++){
  assert.equal(chrome.exitCode,null,"Chrome terminated before debugging endpoint became available");
  await sleep(75);
 }
 assert.ok(existsSync(portFile),"Chrome did not open the DevTools endpoint");
 const [port]=readFileSync(portFile,"utf8").trim().split("\n");
 const tabs=await fetch("http://127.0.0.1:"+port+"/json/list").then(x=>x.json());
 const page=tabs.find(x=>x.type==="page");
 assert.ok(page?.webSocketDebuggerUrl,"No Chrome page debugging target");
 socket=new WebSocket(page.webSocketDebuggerUrl);
 await new Promise((resolve,reject)=>{
  socket.addEventListener("open",resolve,{once:true});
  socket.addEventListener("error",reject,{once:true});
 });
 let nextId=0;
 const requests=new Map();
 socket.addEventListener("message",event=>{
  const msg=JSON.parse(event.data);
  if(!msg.id||!requests.has(msg.id))return;
  const {resolve,reject}=requests.get(msg.id);requests.delete(msg.id);
  if(msg.error)reject(new Error(JSON.stringify(msg.error)));
  else resolve(msg.result);
 });
 function send(method,params={}){
  return new Promise((resolve,reject)=>{
   const messageId=++nextId;
   requests.set(messageId,{resolve,reject});
   socket.send(JSON.stringify({id:messageId,method,params}));
  });
 }
 async function evaluate(expression){
  const result=await send("Runtime.evaluate",{
   expression,returnByValue:true,awaitPromise:true,timeout:12000
  });
  if(result.exceptionDetails)throw new Error(
   result.exceptionDetails.text+" "+
   (result.exceptionDetails.exception?.description||""));
  return result.result?.value;
 }
 await send("Page.enable");
 await send("Runtime.enable");
 await send("Emulation.setEmulatedMedia",{
  features:[{name:"prefers-reduced-motion",value:"no-preference"}]
 });
 const pageURL=pathToFileURL(join(process.cwd(),"index.html")).href+"?pomoSpeed=30#preview";
 await send("Page.navigate",{url:pageURL});
 let loaded=false;
 for(let i=0;i<150;i++){
  try{loaded=await evaluate('typeof show==="function"&&document.getElementById("mn")!==null');}
  catch{}
  if(loaded)break;
  await sleep(80);
 }
 assert.ok(loaded,"Nadi inline browser app never initialized");
 // The test explicitly enters preview and scrolls it into the real viewport.
 await evaluate('document.getElementById("laptop").scrollIntoView(); document.querySelector(\'button[data-s="pomo"]\').click()');
 await sleep(170);
 const timeline=await evaluate(`(()=>{
  const svg=document.getElementById("nadi-pomo-t-live");
  const bar=svg.querySelector("[data-pomo-eq]");
  const intro=document.getElementById("nadi-pomo-t-intro-trace");
  return {state:mn.dataset.s,running:svg.dataset.running,audio:svg.dataset.audioActive,
   barState:getComputedStyle(bar).animationPlayState,
   barName:getComputedStyle(bar).animationName,
   barTransform:getComputedStyle(bar).transform,
   introName:getComputedStyle(intro).animationName};
 })()`);
 assert.equal(timeline.state,"pomo");
 assert.equal(timeline.running,"false","Focus timer should initially be Ready");
 assert.equal(timeline.audio,"true","Audio is independent of focus timer Start");
 assert.equal(timeline.barState,"running","Pomodoro audio bars must animate while timer is Ready");
 assert.equal(timeline.barName,"nadi-music-equalizer","Pomodoro must reuse Music waveform");
 assert.equal(timeline.introName,"nadi-pomo-intro-trace","Timeline intro sweep must start on mode entry");
 await sleep(255);
 const barLater=await evaluate('getComputedStyle(document.querySelector("#nadi-pomo-t-live [data-pomo-eq]")).transform');
 assert.notEqual(timeline.barTransform,barLater,"Rendered Pomodoro equalizer did not move between actual Chrome frames");

 await evaluate('show("pomoClassic")');
 await sleep(130);
 const classic=await evaluate(`(()=>{
  const svg=document.getElementById("nadi-pomo-c-live");
  const eq=svg.querySelector("[data-pomo-eq]");
  const ring=document.getElementById("nadi-pomo-c-ring-orbit");
  return {running:svg.dataset.running,audio:svg.dataset.audioActive,
    eqState:getComputedStyle(eq).animationPlayState,
    eqName:getComputedStyle(eq).animationName,
    orbitState:getComputedStyle(ring).animationPlayState,
    orbitName:getComputedStyle(ring).animationName};
 })()`);
 assert.equal(classic.running,"false");
 assert.equal(classic.audio,"true");
 assert.equal(classic.eqState,"running","Classic waveform must move before Start");
 assert.equal(classic.eqName,"nadi-music-equalizer");
 assert.equal(classic.orbitState,"running","Classic orbit must move when Ready");
 assert.equal(classic.orbitName,"nadi-pomo-ring-orbit");

 // Mode changes must preserve the visible viewport, not black it out for
 // the entire shell resize. Outgoing/incoming SVGs fade inside ONE notch.
 await evaluate('show("lyrics")');
 await sleep(540);
 await evaluate('show("music")');
 const transition=await evaluate(`(()=>{
  const viewport=document.querySelector(".nadi-visual-viewport");
  return {
   from:document.getElementById("nadi-lyrics-live").classList.contains("nadi-native-exit"),
   to:document.getElementById("nadi-music-live").classList.contains("nadi-native-enter"),
   cross:mn.classList.contains("nadi-native-crossfade"),
   viewportOpacity:getComputedStyle(viewport).opacity,
   viewportVisibility:getComputedStyle(viewport).visibility,
   exitingVisibility:getComputedStyle(document.getElementById("nadi-lyrics-live")).visibility
  };
 })()`);
 assert.equal(transition.from,true,"Lyrics outgoing content must remain rendered during fade");
 assert.equal(transition.to,true,"Music incoming content must fade in");
 assert.equal(transition.cross,true);
 assert.equal(transition.viewportVisibility,"visible");
 assert.ok(Number(transition.viewportOpacity)>.9,
  "Root viewport must not be fully blacked out while resizing expanded modes");
 assert.equal(transition.exitingVisibility,"visible",
  "Old native SVG must remain visible during exit animation");
 // Sample actual computed opacity over the crossfade, not just CSS class
 // presence. Also verify the animated shell keeps its center fixed in CSS
 // pixels while shrinking 560px -> 440px.
 const fadeSamples=[];
 for(let i=0;i<5;i++){
  fadeSamples.push(await evaluate(`(()=>{
   const shell=document.getElementById("mn").getBoundingClientRect();
   return {
    outgoing:Number(getComputedStyle(document.getElementById("nadi-lyrics-live")).opacity),
    incoming:Number(getComputedStyle(document.getElementById("nadi-music-live")).opacity),
    viewport:Number(getComputedStyle(document.querySelector(".nadi-visual-viewport")).opacity),
    center:shell.left+shell.width/2
   };
  })()`));
  if(i<4)await sleep(65);
 }
 assert.ok(fadeSamples[0].outgoing>fadeSamples[4].outgoing+.25,
  "Actual outgoing Lyrics SVG opacity must decrease, not snap invisible");
 assert.ok(fadeSamples[4].incoming>fadeSamples[0].incoming+.14,
  "Actual incoming Music SVG opacity must increase smoothly");
 assert.ok(fadeSamples.every(x=>x.viewport>.9),
  "Root viewport must stay visible for the entire Lyrics-to-Music blend");
 for(let i=1;i<fadeSamples.length;i++){
  assert.ok(fadeSamples[i].outgoing<=fadeSamples[i-1].outgoing+.06,
   "Lyrics opacity must not oscillate or reverse");
  assert.ok(fadeSamples[i].incoming>=fadeSamples[i-1].incoming-.06,
   "Music opacity must not oscillate or reverse");
  assert.ok(Math.abs(fadeSamples[i].center-fadeSamples[0].center)<1.1,
   "The notch center must not wobble while crossfading 560 to 440px");
 }
 await sleep(310);
 const settled=await evaluate(`({
  mode:mn.dataset.s,
  cross:mn.classList.contains("nadi-native-crossfade"),
  morph:mn.classList.contains("nadi-morphing"),
  musicOpacity:getComputedStyle(document.getElementById("nadi-music-live")).opacity,
  musicVisibility:getComputedStyle(document.getElementById("nadi-music-live")).visibility
 })`);
 assert.equal(settled.mode,"music");
 assert.equal(settled.cross,false);
 assert.equal(settled.morph,false);
 assert.equal(settled.musicVisibility,"visible");
 assert.ok(Number(settled.musicOpacity)>.99);

 // Same-size Music -> Pomodoro must have an intentional crossfade, not a snap.
 await evaluate('show("pomo")');
 const equalSize=await evaluate(`({
  cross:mn.classList.contains("nadi-native-crossfade"),
  musicOut:document.getElementById("nadi-music-live").classList.contains("nadi-native-exit"),
  pomoIn:document.getElementById("nadi-pomo-t-live").classList.contains("nadi-native-enter")
 })`);
 assert.equal(equalSize.cross,true);
 assert.equal(equalSize.musicOut,true);
 assert.equal(equalSize.pomoIn,true);
 await sleep(510);
 assert.equal(await evaluate('mn.classList.contains("nadi-native-crossfade")'),false);

 // Transition from Expanded Lyrics to Pomodoro also must stay visible.
 await evaluate('show("lyrics")');await sleep(540);
 await evaluate('show("pomoClassic")');
 assert.equal(await evaluate('mn.classList.contains("nadi-native-crossfade")'),true);
 assert.ok(Number(await evaluate('getComputedStyle(document.querySelector(".nadi-visual-viewport")).opacity'))>.9);
 await sleep(515);
 assert.equal(await evaluate('mn.dataset.s'),"pomoClassic");
 console.log("PASS browser: Pomodoro EQ genuinely moves in Chrome while Ready, Classic orbit runs, Timeline entry animation plays, Lyrics/Music/Pomodoro crossfade without viewport blackout");
}finally{
 if(socket)try{socket.close()}catch{}
 chrome.kill("SIGTERM");
 await sleep(100);
 rmSync(profile,{recursive:true,force:true});
}
