import { features } from '../data.js';
import { getLanguage } from '../i18n.js';

export function renderFeatures(){
  const root=document.getElementById('featureGrid');
  if(!root)return;
  root.replaceChildren(...features.map(item=>{
    const [title,description]=getLanguage()==='id'?item.idn:item.en;
    const article=document.createElement('article');article.className='feature-card';
    article.style.setProperty('--accent',item.color);
    const iconWrap=document.createElement('div');iconWrap.className='feature-icon';
    iconWrap.innerHTML=`<svg class="icon" aria-hidden="true"><use href="#i-${item.icon}"/></svg>`;
    const content=document.createElement('div');
    const name=document.createElement('h3');name.textContent=title;
    const copy=document.createElement('p');copy.textContent=description;
    content.append(name,copy);article.append(iconWrap,content);
    return article;
  }));
}
export function initializeFeatures(){
  renderFeatures();
  document.addEventListener('nadi:languagechange',renderFeatures);
}
