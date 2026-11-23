/* Opt-in experimentation only: ?motionLab=1#preview.
   Never replaces native SVGs or Nadi's own mode-selection handlers. */
(() => {
  'use strict';
  const preview = document.getElementById('preview');
  const cap = document.getElementById('cap');
  if (!preview || !cap) return;
  const url = new URL(window.location.href);
  const enabled = url.searchParams.get('motionLab') === '1';
  url.searchParams.set('motionLab', enabled ? '0' : '1');
  url.hash = 'preview';
  const entry = document.createElement('a');
  entry.className = 'ml-entry';
  entry.href = url.pathname + url.search + url.hash;
  entry.textContent = enabled ? 'Close Motion Lab' : 'Try Motion Lab (experimental)';
  cap.insertAdjacentElement('afterend', entry);
  if (!enabled) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const principleList = [
    ['easing','Easing','Speed changes create natural motion.','pet','music'],
    ['offset','Offset & Delay','A sequence communicates hierarchy.','idle','notif'],
    ['parenting','Parenting','Related elements move as one.','pet','music'],
    ['transformation','Transformation','One object continuously changes form.','minimal','music'],
    ['value','Value Change','Values and progress are updated over time.','pomo','pomoClassic'],
    ['masking','Masking','A changing boundary reveals the next view.','idle','lyrics'],
    ['overlay','Overlay','A foreground layer provides context.','idle','notif'],
    ['cloning','Cloning','A duplicate preserves the source relationship.','idle','shelf'],
    ['obscuration','Obscuration','Selective covering guides attention.','pet','notif'],
    ['parallax','Parallax','Different layer speeds express depth.','minimal','music'],
    ['dimensionality','Dimensionality','Depth cues clarify spatial relationships.','pet','widgets'],
    ['dolly','Dolly & Zoom','A shift in perceived distance directs focus.','minimal','lyrics']
  ];
  const demos = [
    ['compact','Resting → Music',['pet','music']],
    ['expanded','Music → Lyrics',['music','lyrics']],
    ['notification','Closed → Notification',['idle','notif']],
    ['tiny','Minimal → Resting',['minimal','pet']]
  ];
  const profiles = {
    native: {label:'Native baseline',factor:1,easing:'quintic-smootherstep'},
    fluid: {label:'Fluid',factor:1.18,easing:'sine-in-out'},
    quick: {label:'Responsive',factor:.78,easing:'cubic-out'}
  };
  const clamp = x => Math.max(0, Math.min(1, Number.isFinite(x) ? x : 0));
  let profile = 'native', tempo = 1, scenario = 'compact', sequenceId = 0;
  let dispatching = false;
  const lab = {
    enabled: true,
    get profile() { return profile; },
    get durationMultiplier() { return profiles[profile].factor / tempo; },
    ease(t) {
      const x = clamp(t);
      if (profile === 'fluid') return (1 - Math.cos(Math.PI * x)) / 2;
      if (profile === 'quick') return 1 - (1 - x) ** 3;
      return x*x*x*(x*(x*6-15)+10);
    }
  };
  window.NadiMotionLab = lab;

  const holder = preview.querySelector('.wrap:last-child');
  if (!holder) return;
  const section = document.createElement('section');
  section.className = 'nadi-motion-lab';
  section.id = 'motion-lab';
  section.setAttribute('aria-label', 'Nadi Motion Lab');
  section.innerHTML = `
    <div class="ml-heading">
      <div><span class="ml-kicker">WEB EXPERIMENT · RUST HANDOFF</span><h3>Motion Lab</h3>
      <p>Test the real Nadi notch states. Original SVG geometry and artwork remain unchanged.</p></div>
      <span class="ml-version">Opt-in / no production changes</span>
    </div>
    <div class="ml-control-layout">
      <fieldset class="ml-fieldset"><legend>Motion profile</legend>
        <div class="ml-options" id="ml-profiles"></div>
        <label class="ml-tempo" for="ml-tempo">Playback speed <output id="ml-tempo-value">1.0×</output></label>
        <input id="ml-tempo" type="range" min=".5" max="1.5" step=".1" value="1" aria-label="Playback speed">
      </fieldset>
      <fieldset class="ml-fieldset"><legend>Live notch sequence</legend>
        <div class="ml-scenarios" id="ml-scenarios"></div>
        <div class="ml-actions"><button type="button" id="ml-replay">Replay sequence</button>
        <button type="button" class="ml-secondary" id="ml-compare">Compare baseline A/B</button></div>
      </fieldset>
    </div>
    <p class="ml-status" id="ml-status" role="status">Choose a profile and replay a transition.</p>
    <details class="ml-gallery"><summary>12 UX motion principles <span>Explore the concepts from your reference video</span></summary>
      <p class="ml-note">Easing, Transformation and Masking are exercised by the live notch morph.
      Other tiles are concept demonstrations, not claims that Nadi's Rust UI already implements them.</p>
      <div class="ml-tiles" id="ml-tiles"></div>
      <p class="ml-note" id="ml-principle-detail" aria-live="polite">Select a principle to see its behavior.</p>
    </details>
    <div class="ml-export"><div><h4>Rust motion handoff</h4>
      <p>Copy reproducible timing, easing, interruption and reduced-motion rules.</p></div>
      <button type="button" id="ml-copy">Copy motion spec (JSON)</button>
    </div>
    <pre id="ml-spec" class="ml-spec" aria-label="Current motion specification"></pre>
  `;
  holder.append(section);
  const $ = id => section.querySelector('#' + id);
  const profileButtons = Object.entries(profiles).map(([key, data]) =>
    `<button type="button" data-profile="${key}" aria-pressed="${key === profile}">${data.label}</button>`).join('');
  $('ml-profiles').innerHTML = profileButtons;
  $('ml-scenarios').innerHTML = demos.map(([key,label]) =>
    `<button type="button" data-scenario="${key}" aria-pressed="${key === scenario}">${label}</button>`).join('');
  $('ml-tiles').innerHTML = principleList.map(([key,name],index) =>
    `<button type="button" class="ml-tile" data-principle="${key}" aria-pressed="false">
       <span class="ml-visual" aria-hidden="true"><i class="ml-a"></i><i class="ml-b"></i><i class="ml-c"></i></span>
       <span class="ml-tile-caption"><small>${String(index+1).padStart(2,'0')}</small>${name}</span>
     </button>`).join('');

  const wait = duration => new Promise(resolve => setTimeout(resolve, duration));
  const activeScenario = () => demos.find(x => x[0] === scenario)[2];
  const modeButton = name => preview.querySelector('.try button[data-s="' + name + '"]');
  const output = (message) => { $('ml-status').textContent = message; };
  const spec = () => ({
    version: 1, target: 'Nadi native Rust/Win32', profile,
    easing: profiles[profile].easing,
    duration: {
      base_ms: 280, extra_max_ms: 260,
      extra_rule: 'min(260, max(abs(dw)/284, abs(dh)/114) * 260)',
      multiplier: Number(lab.durationMultiplier.toFixed(3)),
      speed: tempo
    },
    geometry: 'native SVG silhouette; monotonic width/height; same origin',
    interruption: 'retarget from currently rendered dimensions',
    visibility: 'finish immediately when tab/window becomes hidden',
    reduced_motion: 'instant when prefers-reduced-motion is enabled',
    sample_interval: 'requestAnimationFrame; no constant idle repaint',
    note: 'Web test only; browser CSS effects are not automatically ported to Rust'
  });
  function renderSpec() {
    $('ml-tempo-value').textContent = tempo.toFixed(1) + '×';
    $('ml-spec').textContent = JSON.stringify(spec(), null, 2);
    $('ml-profiles').querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.profile === profile)));
    $('ml-scenarios').querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.scenario === scenario)));
    section.style.setProperty('--ml-tempo', (1 / tempo).toFixed(3));
    document.getElementById('mn')?.style.setProperty('--nadi-motion-factor', String(lab.durationMultiplier));
  }
  const allNativeButtons = preview.querySelectorAll('.try button[data-s]');
  allNativeButtons.forEach(button => button.addEventListener('click', () => {
    if (!dispatching) sequenceId++;
  }, {capture:true}));
  function triggerMode(name) {
    const button = modeButton(name);
    if (!button) return false;
    dispatching = true;
    try { button.click(); } finally { dispatching = false; }
    return true;
  }
  async function runModes(modes, prefix, ticket) {
    for (const [index, name] of modes.entries()) {
      if (ticket !== sequenceId || document.hidden) return false;
      if (!triggerMode(name)) { output('Mode missing: ' + name); return false; }
      output(prefix + ': ' + name + (index + 1 < modes.length ? ' → ...' : ' · settled'));
      await wait((760 * lab.durationMultiplier) + 100);
    }
    return ticket === sequenceId;
  }
  async function replay() {
    const ticket = ++sequenceId;
    const savedProfile = profile;
    output('Replaying ' + demos.find(x => x[0] === scenario)[1] + '...');
    const ok = await runModes(activeScenario(), profiles[savedProfile].label, ticket);
    if (ok) output(profiles[savedProfile].label + ' · ' + demos.find(x => x[0] === scenario)[1] + ' complete');
  }
  async function compare() {
    const ticket = ++sequenceId, savedProfile = profile;
    profile = 'native'; renderSpec();
    let ok = await runModes(activeScenario(), 'A / Native baseline', ticket);
    if (!ok) { profile = savedProfile; renderSpec(); return; }
    await wait(400);
    if (ticket !== sequenceId) { profile = savedProfile; renderSpec(); return; }
    profile = savedProfile; renderSpec();
    ok = await runModes(activeScenario(), 'B / ' + profiles[profile].label, ticket);
    if (ok) output('A/B finished: Native baseline vs ' + profiles[savedProfile].label);
  }
  $('ml-profiles').addEventListener('click', e => {
    const b = e.target.closest('button[data-profile]');
    if (!b) return; sequenceId++; profile = b.dataset.profile;
    renderSpec(); output('Profile set to ' + profiles[profile].label + '. Press Replay to test.');
  });
  $('ml-scenarios').addEventListener('click', e => {
    const b = e.target.closest('button[data-scenario]');
    if (!b) return; sequenceId++; scenario = b.dataset.scenario;
    renderSpec(); output('Sequence: ' + demos.find(x => x[0] === scenario)[1]);
  });
  $('ml-tempo').addEventListener('input', e => {
    sequenceId++; tempo = Number(e.target.value); renderSpec();
    output('Speed set to ' + tempo.toFixed(1) + '×. Press Replay to test.');
  });
  $('ml-replay').addEventListener('click', replay);
  $('ml-compare').addEventListener('click', compare);
  $('ml-tiles').addEventListener('click', e => {
    const card = e.target.closest('button[data-principle]');
    if (!card) return;
    $('ml-tiles').querySelectorAll('.ml-tile').forEach(el => {
      const current = el === card;
      el.classList.toggle('is-active', current);
      el.setAttribute('aria-pressed', String(current));
    });
    const item = principleList.find(x => x[0] === card.dataset.principle);
    $('ml-principle-detail').textContent = item[1] + ' — ' + item[2] + ' Example on the real notch: ' + item[3] + ' → ' + item[4] + '.';
    // Demonstrate the related native Nadi transition; the tile itself is only
    // a conceptual illustration for principles not yet implemented in Rust.
    const ticket = ++sequenceId;
    runModes([item[3],item[4]], item[1], ticket);
  });
  $('ml-copy').addEventListener('click', async () => {
    const data = $('ml-spec').textContent;
    try {
      await navigator.clipboard.writeText(data);
      output('Motion spec copied. Ready for a native implementation ticket.');
    } catch {
      $('ml-spec').focus();
      output('Clipboard not available. Select the JSON below and copy it manually.');
    }
  });
  $('ml-spec').tabIndex = 0;
  if (reducedMotion.matches) output('Reduced motion enabled on this device. Nadi transitions will switch instantly.');
  reducedMotion.addEventListener?.('change', e => {
    output(e.matches ? 'Reduced motion enabled: transitions will be instant.' : 'Reduced motion disabled: animation testing available.');
  });
  document.addEventListener('visibilitychange', () => { if(document.hidden) sequenceId++; });
  renderSpec();
})();
