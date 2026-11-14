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
console.log('PASS: verified lyric scroll/active-weight/pause/reduced-motion, native 560x144 SVG, inline JS syntax, fixed center anchor, one-clock shell, 144 mode/FPS pairs, '+checks+' monotonic frames');
