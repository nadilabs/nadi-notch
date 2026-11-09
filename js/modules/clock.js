/** Desktop simulation only. It never reads personal data or location. */
import { getLanguage } from '../i18n.js';

export function initializeClock(){
  const time=document.querySelector('.clock-time');
  const date=document.querySelector('.clock-date');
  if(!time||!date)return;
  const render=()=>{
    const now=new Date();
    const locale=getLanguage()==='id'?'id-ID':'en-US';
    time.textContent=new Intl.DateTimeFormat(locale,{hour:'2-digit',minute:'2-digit',hour12:false}).format(now);
    date.textContent=new Intl.DateTimeFormat(locale,{weekday:'long',month:'short',day:'numeric'}).format(now).toUpperCase();
  };
  render();
  window.setInterval(render,60_000);
  document.addEventListener('nadi:languagechange',render);
}
