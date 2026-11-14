// Run with: node scripts/verify-preview-motion.mjs
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const start=html.lastIndexOf('<script>');
const end=html.lastIndexOf('</script>');
assert.ok(start>=0&&end>start,'inline application script missing');
const js=html.slice(start+'<script>'.length,end);
new vm.Script(js,{filename:'index.html inline script'});

assert.ok(html.includes('.mn.nadi-curve-shell {'),'one-shell class missing');
assert.ok(html.includes('transition:none !important'),'legacy transition must be disabled');
assert.ok(html.includes('nadiShell.frame=requestAnimationFrame(nadiShellTick)'));
assert.ok(html.includes('mn.style.transform = mn.classList.contains("nadi-morphing")'));
assert.ok(!html.includes('function nadiShellSpring('),'old spring must not race the tween');
assert.ok(html.includes('.mn.nadi-curve-shell.nadi-morphing .nadi-visual-viewport,'),'active content must be hidden while changing dimensions');
assert.ok(html.includes('.mn.nadi-curve-shell.nadi-morphing > .ly'),'legacy feature layers must follow the staging rule');
assert.ok(html.includes('get("notchMotion")==="off"'),'diagnostic no-motion URL switch missing');
assert.ok(html.includes('if(dw<.001&&dh<.001||nadiNoMorph||'),'no-motion switch must bypass geometry animation');
assert.ok(html.includes('mn.classList.remove("nadi-morphing")'),'content must be revealed when geometry settles');
const stableSvgCss=html.match(/\.mn\.nadi-curve-shell \.nadi-compact-live,\s*\.mn\.nadi-curve-shell \.nadi-music-live \{([^}]*)\}/)?.[1];
assert.ok(stableSvgCss,'native content stabilization CSS missing');
assert.match(stableSvgCss,/left:\s*0\s*;/,'native SVG origins must stay fixed');
assert.match(stableSvgCss,/transform:\s*none\s*;/,'native SVG must have no second centering transform');
assert.match(stableSvgCss,/transition:\s*none\s*!important/,'only the viewport should crossfade');
assert.ok(html.includes('#nadi-closed-clock, #nadi-music-header-clock,'));
assert.ok(html.includes('font-variant-numeric:tabular-nums;'),'time labels require tabular digits');
const anchor=html.match(/\.mn-holder\s*\{([^}]*)\}/)?.[1];
const shell=html.match(/\.mn\s*\{([^}]*)\}/)?.[1];
assert.ok(anchor&&shell,'notch anchor/shell CSS missing');
assert.match(anchor,/width:\s*156px/,'outer notch anchor must have a fixed width');
assert.match(anchor,/height:\s*30px/,'outer notch anchor must have a fixed height');
assert.match(shell,/position:\s*absolute/,'animated shell must not resize its parent');
assert.match(shell,/left:\s*50%/,'animated shell must use centered positioning');
assert.match(shell,/translate:\s*-50%\s+0/,'animated shell must offset its own center');

const suppliedLyrics=readFileSync(new URL('../assets/nadi-lyrics-expanded-560x144.svg',import.meta.url),'utf8');
assert.match(suppliedLyrics,/viewBox="0 0 560 144"/,'uploaded expanded lyric dimensions changed');
assert.ok(suppliedLyrics.includes('id="Lyric_Expanded"'),'uploaded native artwork must stay intact');
assert.ok(html.includes('id="nadi-lyrics-live"'),'native Expanded Lyrics svg not mounted');
assert.ok(html.includes('viewBox="0 0 560 144"'),'expanded lyrics viewBox wrong');
assert.ok(html.includes('.mn[data-s="lyrics"] { --w: 560px; --h: 144px;'),'live shell dimensions do not match supplied asset');
assert.ok(html.includes('lyrics: 560 * 144'),'state area check must use native dimensions');
assert.ok(html.includes('.mn .nadi-lyrics-live .nadi-lyrics-st0{fill:transparent!important}'),'duplicate SVG black shell would cause two silhouettes');
assert.ok(html.includes('.mn[data-s="lyrics"] > .l-lyrics{display:none!important}'),'old legacy lyrics would overlap native design');
assert.ok(html.includes('id="nadi-lyrics-header-clock"'),'native lyrics timestamp must be editable');
assert.ok(html.includes('function nadiLyricsSeek('),'native lyrics progress control not wired');
assert.ok(html.includes('if(state==="music"||state==="lyrics")nadiMusicResume();'),'native Lyrics mode does not share media playback engine');


/* Native lyric timeline must animate the visible SVG, not the old HTML mock. */
const cuesMatch=js.match(/const nadiLyricsCues=\[([\s\S]*?)\];/);
assert.ok(cuesMatch,"Expanded Lyrics cue timeline missing");
const cues=vm.runInNewContext("["+cuesMatch[1]+"]");
assert.ok(cues.length>=10,"need enough demo lyric changes to preview scrolling");
assert.ok(cues.every((cue,i)=>typeof cue.at==="number"&&
  typeof cue.text==="string"&&cue.text.length>0&&
  (i===0||cue.at>cues[i-1].at)),"cue timestamps must strictly ascend");
const currentAt=(t)=>cues.reduce((idx,cue,i)=>cue.at<=t?i:idx,0);
assert.equal(cues[currentAt(193)].text,"when the quiet sky turns blue",
  "initial 03:13 demo position should match user-provided SVG");
assert.equal(cues[currentAt(198)].text,"to find you by the sea",
  "the next visible lyric must change at the cue boundary");
assert.ok(html.includes('id="nadi-lyrics-lines"'),'native lyric scrolling track missing');
assert.ok(html.includes('id="nadi-lyrics-equalizer"'),'native lyric equalizer missing');
assert.ok(html.includes('function nadiLyricsPaint(now=performance.now())'),
  'native lyrics animation driver missing');
assert.ok(html.includes('nadiLyricsPaint(now);'),'shared media clock must repaint lyrics');
assert.ok(html.includes('nadiLyricsUI.svg.classList.toggle("is-playing"'),
  'equalizer playing state must follow media state');
assert.ok(!js.includes('setInterval(() => { if (mn.dataset.s === "lyrics") lyric()'),
  'legacy hidden HTML animation must never run independently');
assert.ok(html.includes('const focus=Math.max(0,1-Math.abs(rel));'),
  'active lyric must crossfade weights rather than snap');
assert.ok(html.includes('const y=82.6776+rel*25.4;'),
  'lyric track must scroll vertically at the supplied SVG row spacing');
assert.ok(html.includes('const canAnimate=visible&&nadiMusicPlaying&&!nadiLyricsReducedMotion.matches;'),
  'lyric motion must pause with playback and respect reduced-motion');
/* Exercise the exact inline lyric animator in a no-browser DOM stub. */
const lyricFunctionStart=js.indexOf('function nadiLyricsCueIndex(seconds){');
const lyricFunctionEnd=js.indexOf('const nadiMusicDuration=256;',lyricFunctionStart);
assert.ok(lyricFunctionStart>=0&&lyricFunctionEnd>lyricFunctionStart,
  'cannot locate native lyric animator in inline script');
const lyricMotionCode=js.slice(lyricFunctionStart,lyricFunctionEnd);
const reduced={matches:false};
const rows=cues.map(()=>({
 row:{lastTransform:null,setAttribute(name,value){if(name==='transform')this.lastTransform=value;}},
 muted:{style:{}},active:{style:{}}
}));
const lyricContext=vm.createContext({
 nadiLyricsCues:cues,nadiLyricsRows:rows,
 nadiLyricsReducedMotion:reduced,
 nadiMusicElapsed:193,nadiMusicPlaying:true,nadiMusicInView:true,
 mn:{dataset:{s:'lyrics'}},document:{hidden:false},performance:{now:()=>1000}
});
vm.runInContext(lyricMotionCode,lyricContext);
vm.runInContext('nadiLyricsPaint(1000)',lyricContext);
assert.equal(vm.runInContext('nadiLyricsPosition',lyricContext),7);
assert.equal(rows[7].active.style.opacity,'1.000');
assert.ok(rows[7].row.lastTransform.startsWith('translate(0 '));
vm.runInContext('nadiMusicElapsed=198;nadiLyricsPaint(2000)',lyricContext);
assert.equal(vm.runInContext('nadiLyricsPosition',lyricContext),7,
  'new line should start from previously rendered position');
vm.runInContext('nadiLyricsPaint(2315)',lyricContext);
const halfway=vm.runInContext('nadiLyricsPosition',lyricContext);
assert.ok(halfway>7&&halfway<8,'lyric line must interpolate smoothly mid-transition');
vm.runInContext('nadiLyricsPaint(2700)',lyricContext);
assert.equal(vm.runInContext('nadiLyricsPosition',lyricContext),8);
assert.equal(rows[8].active.style.opacity,'1.000',
  'new active line should be bold and completely visible');
vm.runInContext('nadiMusicPlaying=false;nadiMusicElapsed=205;nadiLyricsPaint(3000)',lyricContext);
assert.equal(vm.runInContext('nadiLyricsPosition',lyricContext),9,
  'paused lyric preview must be stationary');
reduced.matches=true;
vm.runInContext('nadiMusicPlaying=true;nadiMusicElapsed=212;nadiLyricsPaint(4000)',lyricContext);
assert.equal(vm.runInContext('nadiLyricsPosition',lyricContext),10,
  'reduced-motion setting should not animate lyric rows');
assert.ok(rows.every(row=>row.row.lastTransform.startsWith('translate(0 ')),
  'lyric x positions must remain fixed during animation');


/* Two authentic uploaded Pomodoro themes must be live, not flattened PNGs.
   Their 440x144 geometry shares one source-driven timer and stays independent
   of the native Windows application and its event scheduler. */
const pomoAssets=[
 ['timeline','nadi-pomo-t','nadi-pomodoro-timeline-ready-440x144.svg'],
 ['classic','nadi-pomo-c','nadi-pomodoro-classic-440x144.svg']
];
for(const [kind,prefix,source] of pomoAssets){
 const original=readFileSync(new URL('../assets/'+source,import.meta.url),'utf8');
 assert.ok(original.includes('viewBox="0 0 440 144"'),'uploaded '+kind+' dimensions changed');
 assert.ok(original.includes('id="Shell_Outline"'),'uploaded '+kind+' silhouette lost');
 assert.ok(html.includes('id="'+prefix+'-live"'),'native '+kind+' vector missing from preview');
 assert.ok(html.includes('id="'+prefix+'-Shell_Outline"'),'native '+kind+' shell path missing');
 assert.ok(html.includes('.'+prefix+'-native #'+prefix+'-Shell_Outline'),
   'native '+kind+' must participate in transparent single-shell CSS');
 assert.ok(html.includes('#nadi-pomo-c-Shell_Outline{fill:transparent!important}'),
   'the original native shell must be transparent in the shared preview');
 assert.ok(html.includes('id="'+prefix+'-time"'),'native '+kind+' countdown text missing');
 assert.ok(html.includes('id="'+prefix+'-header"'),'native '+kind+' header clock missing');
 assert.ok(html.includes('class="nadi-pomo-native '+prefix+'-native"'),
   'SVG theme must retain stable 0,0 origin');
}
assert.ok(html.includes('data-s="pomo">Pomodoro Timeline</button>'));
assert.ok(html.includes('data-s="pomoClassic">Pomodoro Classic</button>'));
assert.ok(html.includes('pomo: 440 * 144, pomoClassic: 440 * 144'));
assert.ok(html.includes('.mn[data-s="pomo"],.mn[data-s="pomoClassic"]{--w:440px;--h:144px;'),
  'both SVG designs require exact native shell geometry');
assert.ok(html.includes('nadiPomoShow(s,prev);'),'mode transition must stop/resume shared timer');
assert.ok(html.includes('const nadiPomoText=(el,value)=>{if(el.textContent!==value)'),
  'per-frame text changes can reintroduce horizontal shimmer');
assert.ok(html.includes('now-nadiPomoClock.lastPaint>=90'),
  'timer UI must not repaint SVG labels every animation frame');
assert.ok(html.includes('nadi-pomo-c-ring-progress'),'classic countdown ring must animate');
assert.ok(html.includes('nadi-pomo-t-stage-fill-4'),'timeline must render four focus stages');
assert.ok(html.includes('nadi-pomo-c-pause-icon'),'classic play/pause icon must toggle');
assert.ok(html.includes('data-pomo-eq="1"'),'both SVGs need six animating bars');

const pomoBegin=js.indexOf('const nadiPomoUI={');
const pomoEnd=js.indexOf('const captions = {',pomoBegin);
assert.ok(pomoBegin>=0&&pomoEnd>pomoBegin,'Pomodoro shared runtime missing');
const pomoCode=js.slice(pomoBegin,pomoEnd);
const elements=new Map();
const handlers=new Map();
function pomoElement(name){
 if(elements.has(name))return elements.get(name);
 const attrs=new Map(),controls=[];
 const element={
  name,style:{},dataset:{},textContent:'',
  getAttribute:(n)=>attrs.has(n)?attrs.get(n):null,
  setAttribute:(n,v)=>{attrs.set(n,String(v));},
  querySelectorAll:(selector)=>{
   if(selector==='[data-pomo-action="toggle"]')return controls.filter(x=>x.kind==='toggle');
   return controls;
  },
  addEventListener:(type,fn)=>{handlers.set(name+'_'+type,fn);},
  get controls(){return controls;}
 };
 elements.set(name,element);
 return element;
}
for(const n of ['nadi-pomo-t-live','nadi-pomo-c-live']){
 const node=pomoElement(n);
 for(const kind of ['toggle','reset','theme']){
  const control=pomoElement(n+'-'+kind);
  control.kind=kind;control.dataset.pomoAction=kind;
  node.controls.push(control);
 }
}
let animationSequence=0,shows=[];
const pomoContext=vm.createContext({
 document:{
  hidden:false,
  getElementById:pomoElement,
  addEventListener:()=>{}
 },
 mn:{dataset:{s:'pomo'}},
 requestAnimationFrame:()=>++animationSequence,
 cancelAnimationFrame:()=>{},
 performance:{now:()=>1000},
 show:(s)=>{shows.push(s)}
});
vm.runInContext(pomoCode,pomoContext);
assert.equal(vm.runInContext('nadiPomoFormatted(1500)',pomoContext),'25:00');
assert.equal(vm.runInContext('nadiPomoFormatted(299.3)',pomoContext),'05:00');
assert.equal(pomoElement('nadi-pomo-t-time').textContent,'25:00');
assert.equal(pomoElement('nadi-pomo-c-time').textContent,'25:00');
assert.equal(pomoElement('nadi-pomo-t-stage-fill-1').getAttribute('width'),'23.660');
assert.equal(pomoElement('nadi-pomo-t-stage-fill-2').getAttribute('width'),'0.000');
assert.equal(pomoElement('nadi-pomo-c-ring-progress').getAttribute('stroke-dashoffset'),'0.000');
assert.equal(vm.runInContext('nadiPomoClock.running',pomoContext),false);
vm.runInContext('nadiPomoAction("toggle")',pomoContext);
assert.equal(vm.runInContext('nadiPomoClock.running',pomoContext),true);
assert.equal(pomoElement('nadi-pomo-t-live').dataset.running,'true');
assert.equal(pomoElement('nadi-pomo-c-live').dataset.running,'true');
vm.runInContext('nadiPomoTick(1250)',pomoContext);
assert.ok(Math.abs(vm.runInContext('nadiPomoClock.remaining',pomoContext)-1499.75)<1e-8);
assert.equal(pomoElement('nadi-pomo-t-time').textContent,'25:00',
  'countdown should display ceil seconds and avoid text shimmer');
vm.runInContext('nadiPomoTick(2250)',pomoContext);
assert.ok(Math.abs(vm.runInContext('nadiPomoClock.remaining',pomoContext)-1499.5)<1e-8,
 'large throttled frame should cap jump after suspension');
assert.equal(pomoElement('nadi-pomo-t-time').textContent,'25:00');
vm.runInContext('nadiPomoAction("theme")',pomoContext);
assert.deepEqual(shows,['pomoClassic']);
assert.equal(vm.runInContext('nadiPomoClock.running',pomoContext),true,
 'switching Pomodoro SVG should preserve timer');
vm.runInContext('nadiPomoAction("short")',pomoContext);
assert.equal(vm.runInContext('nadiPomoClock.remaining',pomoContext),300);
assert.equal(vm.runInContext('nadiPomoClock.phase',pomoContext),'short');
assert.equal(vm.runInContext('nadiPomoClock.running',pomoContext),false);
assert.equal(pomoElement('nadi-pomo-c-time').textContent,'05:00');
vm.runInContext('nadiPomoAction("session-4")',pomoContext);
assert.equal(vm.runInContext('nadiPomoClock.session',pomoContext),4);
assert.equal(vm.runInContext('nadiPomoClock.remaining',pomoContext),1500);
vm.runInContext('nadiPomoNextPhase()',pomoContext);
assert.equal(vm.runInContext('nadiPomoClock.phase',pomoContext),'long');
assert.equal(vm.runInContext('nadiPomoClock.remaining',pomoContext),900);
vm.runInContext('nadiPomoNextPhase()',pomoContext);
assert.equal(vm.runInContext('nadiPomoClock.phase',pomoContext),'focus');
assert.equal(vm.runInContext('nadiPomoClock.session',pomoContext),1);
vm.runInContext('nadiPomoAction("reset")',pomoContext);
assert.equal(vm.runInContext('nadiPomoClock.remaining',pomoContext),1500);
assert.equal(vm.runInContext('nadiPomoClock.running',pomoContext),false);
assert.equal(pomoElement('nadi-pomo-c-ring-progress').getAttribute('stroke-dashoffset'),'0.000');

const expr=js.match(/const progress=([^;]+);/);
assert.ok(expr,'single-clock easing expression missing');
const ease=vm.runInNewContext('(t)=>('+expr[1]+')');

const sizes=[[156,30],[44,4],[440,144],[560,144],[420,140],[310,60]];
let checks=0;
for(const fps of [20,30,60,120]){
 for(const from of sizes)for(const to of sizes){
  const dw=Math.abs(from[0]-to[0]),dh=Math.abs(from[1]-to[1]);
  const duration=280+Math.min(260,Math.max(dw/284,dh/114)*260);
  let previous=[...from];
  for(let step=0;step<=Math.ceil(duration/(1000/fps));step++){
   const t=Math.min(1,step*(1000/fps)/duration),k=ease(t);
   assert.ok(k>=-1e-8&&k<=1+1e-8,'easing left its endpoints');
   const actual=from.map((v,i)=>v+(to[i]-v)*k);
   for(let axis=0;axis<2;axis++){
    assert.ok(actual[axis]>=Math.min(from[axis],to[axis])-1e-8);
    assert.ok(actual[axis]<=Math.max(from[axis],to[axis])+1e-8);
    assert.ok((actual[axis]-previous[axis])*(to[axis]-from[axis])>=-1e-8,
      'geometry reversed direction');
   }
   previous=actual;checks++;
  }
 }
}
assert.equal(ease(0),0);
assert.equal(ease(1),1);
console.log('PASS: two interactive 440x144 Pomodoro themes + real countdown, verified lyric scroll/active-weight/pause/reduced-motion, native 560x144 SVG, inline JS syntax, fixed center anchor, one-clock shell, 144 mode/FPS pairs, '+checks+' monotonic frames');
