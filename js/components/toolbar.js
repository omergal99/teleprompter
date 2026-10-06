export function bindSettings(store){
 document.querySelectorAll('[data-s]').forEach(el=>{const k=el.dataset.s,sync=()=>{const v=store.get()[k];el.type==='checkbox'?el.checked=!!v:el.value=v};sync();store.subscribe((_,p)=>k in p&&sync());
  el.addEventListener('input',()=>{const v=el.type==='checkbox'?el.checked:(el.type==='range'||el.hasAttribute('data-num'))?Number(el.value):el.value;store.set({[k]:v})})});
 document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>b.closest('dialog').close())}
