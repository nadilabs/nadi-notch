import { previewModes } from '../data.js';
import { getLanguage, t } from '../i18n.js';
import { siteConfig } from '../config.js';

/** Browser presentation of Nadi: Nusa-style shell morph + native Nadi frames.
 * The notch contents are real screenshots; neither the geometry nor the type
 * inside those frames is reimplemented or stretched to a different ratio. */
const $ = id => document.getElementById(id);
const state = { index: 0, autoplay: true, timer: null, transitionTimer: null, token: 0 };
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const modeText = mode => getLanguage()==='id' ? mode.idn : mode.en;
const previewUrl = mode => `./assets/previews/${mode.image}`;

function renderModeButtons() {
  const root = $('previewModes');
  const buttons = previewModes.map((mode, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.index = String(index);
    button.textContent = modeText(mode).name;
    button.setAttribute('aria-pressed', String(index === state.index));
    return button;
  });
  root.replaceChildren(...buttons);
}

function displayScale() {
  const viewport = $('desktopScreen').clientWidth;
  // Nusa-like scaling: logical Windows pixels to laptop preview pixels.
  // Kept uniform in both axes so UI proportions never change.
  return Math.min(1.32, Math.max(0.48, (viewport - 32) / 570));
}

function sizeShell(mode) {
  const scale = displayScale();
  const zone = $('notchZone');
  const shell = $('notchShell');
  zone.style.setProperty('--stage-notch-width', `${(mode.width * scale).toFixed(2)}px`);
  zone.style.setProperty('--stage-notch-height', `${(mode.height * scale).toFixed(2)}px`);
  shell.style.setProperty('--notch-scale', String(scale));
  shell.style.setProperty('--native-width', `${mode.width}px`);
  shell.style.setProperty('--native-height', `${mode.height}px`);
  shell.style.borderBottomLeftRadius = `${Math.min(43, mode.height * .24)}px`;
  shell.style.borderBottomRightRadius = `${Math.min(43, mode.height * .24)}px`;
}

function updateDescription() {
  const mode = previewModes[state.index];
  $('previewName').textContent = modeText(mode).name;
  $('previewDescription').textContent = modeText(mode).desc;
  $('previewIndex').textContent = `${String(state.index + 1).padStart(2, '0')} / ${String(previewModes.length).padStart(2, '0')}`;
  $('previewModes').querySelectorAll('button').forEach(button => {
    button.setAttribute('aria-pressed', String(Number(button.dataset.index) === state.index));
  });
}

function showFrame(mode) {
  const image = $('notchImage');
  image.src = previewUrl(mode);
  image.width = mode.width;
  image.height = mode.height;
  image.alt = `Nadi ${mode.en.name} interface rendered on Windows`;
  image.classList.remove('is-changing');
  $('notchShell').classList.remove('is-morphing');
}

function select(index, { userInitiated = true, animated = true } = {}) {
  state.index = (index + previewModes.length) % previewModes.length;
  state.token++;
  const token = state.token;
  const target = previewModes[state.index];
  const image = $('notchImage');
  const shell = $('notchShell');
  clearTimeout(state.transitionTimer);
  updateDescription();

  if (animated && !reducedMotion.matches) {
    image.classList.add('is-changing');
    shell.classList.add('is-morphing');
    // Force style flush to maintain transitions on fast sequential clicks.
    shell.getBoundingClientRect();
    sizeShell(target);
    state.transitionTimer = setTimeout(() => {
      if (token === state.token) showFrame(target);
    }, 580);
  } else {
    sizeShell(target);
    showFrame(target);
  }
  if (userInitiated) { state.autoplay = false; syncPlayButton(); resetAutoplay(); }
}

function clearAutoplay() { if(state.timer != null) { clearInterval(state.timer); state.timer=null; } }
function resetAutoplay() {
  clearAutoplay();
  if (!state.autoplay || document.hidden || reducedMotion.matches) return;
  state.timer = setInterval(() => select(state.index+1,{userInitiated:false}), siteConfig.cycleSeconds * 1000);
}
function syncPlayButton() {
  const button = $('autoplayToggle');
  button.setAttribute('aria-pressed', String(state.autoplay));
  const icon = state.autoplay ? 'pause' : 'play';
  button.innerHTML = `<svg class="icon" aria-hidden="true"><use href="#i-${icon}"/></svg><span>${t(state.autoplay ? 'preview.pause' : 'preview.play')}</span>`;
}
function updateClock() {
  const clock = $('previewClock');
  if(clock) clock.textContent = new Intl.DateTimeFormat(getLanguage() === 'id' ? 'id-ID' : 'en-GB', {hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date());
}

export function initializePreview() {
  renderModeButtons();
  previewModes.forEach(mode => { const img=new Image(); img.src=previewUrl(mode); });
  select(0,{userInitiated:false,animated:false});
  syncPlayButton(); updateClock();
  const root = $('previewModes');
  root.addEventListener('click', event => {
    const button = event.target.closest('[data-index]');
    if(button) select(Number(button.dataset.index));
  });
  $('notchZone').addEventListener('click', () => select(state.index+1));
  $('previewPrevious').addEventListener('click', () => select(state.index-1));
  $('previewNext').addEventListener('click', () => select(state.index+1));
  $('autoplayToggle').addEventListener('click', () => {
    state.autoplay = !state.autoplay;
    syncPlayButton(); resetAutoplay();
  });
  document.addEventListener('keydown', event => {
    if(!['ArrowLeft','ArrowRight'].includes(event.key)) return;
    const active = document.activeElement;
    const inPreview = active?.closest('#preview');
    if(!inPreview) return;
    event.preventDefault();
    select(state.index + (event.key==='ArrowLeft'?-1:1));
  });
  window.addEventListener('resize', () => sizeShell(previewModes[state.index]));
  document.addEventListener('visibilitychange', resetAutoplay);
  document.addEventListener('nadi:languagechange', () => {
    renderModeButtons(); updateDescription(); syncPlayButton(); updateClock();
  });
  reducedMotion.addEventListener?.('change', resetAutoplay);
  resetAutoplay();
  // From compact mascot into the first Expanded view, like the Nusa site's
  // introductory motion. Any user selection takes precedence over this demo.
  const introToken = state.token;
  if (reducedMotion.matches) {
    select(2, { userInitiated:false, animated:false });
  } else {
    setTimeout(() => {
      if (state.token === introToken && state.autoplay && !document.hidden) {
        select(2, { userInitiated:false });
        resetAutoplay();
      }
    }, 1500);
  }
}
