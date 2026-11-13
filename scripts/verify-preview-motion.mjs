// Run with: node scripts/verify-preview-motion.mjs
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const scripts=[...html.matchAll(/<script(?:\\s[^>]*)?>([\\s\\S]*?)<\\/script>/g)];
assert.ok(scripts.length>0,'no inline script found');
for(const [,js] of scripts)new vm.Script(js,{filename:'index.html inline script'});

assert.match(html,/\\.mn\\.nadi-curve-shell\\s*\\{[^}]*transition:none !important/);
assert.match(html,/nadiShell\\.frame=requestAnimationFrame\\(nadiShellTick\\)/);
assert.match(html,/mn\\.style\\.transform = mn\\.classList\\.contains\\("nadi-morphing"\\)/);
assert.ok(!html.includes('function nadiShellSpring('),'old spring must not race the tween');
const code=scripts.map(m=>m[1]).join('\\n');
const expr=code.match(/const progress=([^;]+);/);
assert.ok(expr,'single-clock easing expression missing');
const ease=vm.runInNewContext('(t)=>('+expr[1]+')');

const sizes=[[156,30],[44,4],[440,144],[520,140],[420,140],[310,60]];
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
console.log('PASS: inline JS syntax, one-clock shell, 144 mode/FPS pairs, '+checks+' monotonic frames');
