export const pipSupported=()=>'documentPictureInPicture' in window;
export async function openPip(el,onClose){
 const w=await documentPictureInPicture.requestWindow({width:420,height:720});
 for(const ss of document.styleSheets){try{const st=w.document.createElement('style');st.textContent=[...ss.cssRules].map(r=>r.cssText).join('\n');w.document.head.append(st)}catch{}}
 const r=document.documentElement,d=w.document.documentElement;d.lang=r.lang;d.dir=r.dir;d.setAttribute('style',r.getAttribute('style')||'');
 w.document.body.className='pip '+document.body.className;w.document.body.style.cssText='margin:0;background:#000';
 const parent=el.parentNode,next=el.nextSibling;w.document.body.append(el);
 w.addEventListener('pagehide',()=>{parent.insertBefore(el,next);onClose()});return w}
