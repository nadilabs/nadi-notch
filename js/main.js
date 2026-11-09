import { initializeLanguage } from './i18n.js';
import { initializeFeatures } from './modules/features.js';
import { initializeFaq } from './modules/faq.js';
import { initializePreview } from './modules/preview.js';
import { initializeNavigation } from './modules/navigation.js';
import { initializeMotion } from './modules/motion.js';
import { initializeRelease } from './modules/release.js';
import { initializeClock } from './modules/clock.js';

function start(){
  document.getElementById('year').textContent=String(new Date().getFullYear());
  initializeLanguage();
  initializeFeatures();
  initializeFaq();
  initializePreview();
  initializeNavigation();
  initializeRelease();
  initializeClock();
  initializeMotion();
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);
else start();
