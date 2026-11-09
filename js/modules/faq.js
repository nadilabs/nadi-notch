import { questions } from '../data.js';
import { getLanguage } from '../i18n.js';

function renderFaq(){
  const list=document.getElementById('faqList');
  if(!list)return;
  const opened=Number(list.querySelector('[aria-expanded="true"]')?.dataset.index ?? -1);
  list.replaceChildren(...questions.map((item,index)=>{
    const [question,answer]=getLanguage()==='id'?item.idn:item.en;
    const wrapper=document.createElement('article');wrapper.className='faq-item';
    const button=document.createElement('button');button.className='faq-question';button.type='button';
    button.dataset.index=String(index);button.setAttribute('aria-expanded',String(index===opened));
    button.setAttribute('aria-controls',`faq-answer-${index}`);
    const heading=document.createElement('span');heading.textContent=question;
    const plus=document.createElement('span');plus.setAttribute('aria-hidden','true');plus.textContent='+';
    button.append(heading,plus);
    const text=document.createElement('p');text.id=`faq-answer-${index}`;text.className='faq-answer';
    text.hidden=index!==opened;text.textContent=answer;
    wrapper.append(button,text);return wrapper;
  }));
}
export function initializeFaq(){
  renderFaq();
  document.getElementById('faqList')?.addEventListener('click',event=>{
    const button=event.target.closest('.faq-question');if(!button)return;
    const willOpen=button.getAttribute('aria-expanded')!=='true';
    const list=button.closest('.faq-list');
    list.querySelectorAll('.faq-question').forEach(b=>b.setAttribute('aria-expanded','false'));
    list.querySelectorAll('.faq-answer').forEach(a=>a.hidden=true);
    button.setAttribute('aria-expanded',String(willOpen));
    document.getElementById(button.getAttribute('aria-controls')).hidden=!willOpen;
  });
  document.addEventListener('nadi:languagechange',renderFaq);
}
