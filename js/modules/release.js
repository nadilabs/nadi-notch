import { siteConfig } from '../config.js';

function configureLink(id,url){
  const link=document.getElementById(id);
  if(!link)return;
  if(url){
    link.href=url;
    if(/^https?:\/\//i.test(url)){link.target='_blank';link.rel='noopener noreferrer';}
    link.classList.remove('is-unavailable');link.removeAttribute('aria-disabled');
    link.removeAttribute('tabindex');
  }else{
    link.removeAttribute('href');link.classList.add('is-unavailable');
    link.setAttribute('aria-disabled','true');link.setAttribute('tabindex','-1');
  }
}
export function initializeRelease(){
  configureLink('releaseLink',siteConfig.releaseUrl);
  configureLink('donateLink',siteConfig.supportUrl);
  configureLink('feedbackLink',siteConfig.feedbackUrl);
  if(siteConfig.releaseUrl){document.getElementById('releaseStatus').hidden=true;}
  if(siteConfig.supportUrl){document.getElementById('supportStatus').hidden=true;}
  if(siteConfig.feedbackUrl){document.getElementById('feedbackStatus').hidden=true;}
}
