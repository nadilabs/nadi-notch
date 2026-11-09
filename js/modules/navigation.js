export function initializeNavigation(){
  const menu=document.querySelector('.main-nav');
  const toggle=document.querySelector('.menu-toggle');
  toggle?.addEventListener('click',()=>{
    const opening=toggle.getAttribute('aria-expanded')!=='true';
    toggle.setAttribute('aria-expanded',String(opening));
    toggle.setAttribute('aria-label',opening?'Close menu':'Open menu');
    menu?.classList.toggle('is-open',opening);
  });
  menu?.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>{
    menu.classList.remove('is-open');toggle.setAttribute('aria-expanded','false');
    toggle.setAttribute('aria-label','Open menu');
  }));
  window.addEventListener('keydown',event=>{
    if(event.key==='Escape' && menu?.classList.contains('is-open')){
      menu.classList.remove('is-open');toggle.setAttribute('aria-expanded','false');toggle.focus();
    }
  });
}
