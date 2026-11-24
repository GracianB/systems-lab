/* Systems Lab product showroom.
   Static cards are the SEO and no-JS fallback; enhancements never own navigation. */
(() => {
  "use strict";
  const root=document.querySelector("#products");
  if(!root)return;
  const cards=[...root.querySelectorAll(".product-tile")];
  const buttons=[...root.querySelectorAll("[data-product-filter]")];
  const input=root.querySelector("[data-product-search]");
  const status=root.querySelector("[data-product-results]");
  const labels={
    es:{placeholder:"Buscar un producto o tecnología…",search:"Buscar productos",one:"producto",many:"productos",all:"de",empty:"Ningún producto coincide. Prueba otra categoría o búsqueda."},
    en:{placeholder:"Search products or technologies…",search:"Search products",one:"product",many:"products",all:"of",empty:"No matching products. Try a different search or category."}
  };
  let filter="all";
  const language=()=>document.documentElement.getAttribute("data-lang")==="en"?"en":"es";
  const normalized=text=>String(text||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase();
  function render(){
    const l=language(),t=labels[l],query=normalized(input.value.trim());
    let shown=0;
    for(const card of cards){
      const category=card.dataset.productCategory||"";
      const haystack=normalized([card.dataset.productKeywords,card.textContent].join(" "));
      const match=(filter==="all"||category===filter)&&(!query||haystack.includes(query));
      card.hidden=!match;
      if(match)shown++;
    }
    for(const button of buttons)button.setAttribute("aria-pressed",String(button.dataset.productFilter===filter));
    status.textContent=shown===0?t.empty:`${shown} ${shown===1?t.one:t.many} ${t.all} ${cards.length}`;
  }
  function localize(){
    const t=labels[language()];
    input.placeholder=t.placeholder;
    input.setAttribute("aria-label",t.search);
    render();
  }
  for(const button of buttons){
    button.addEventListener("click",()=>{
      filter=button.dataset.productFilter;
      render();
    });
  }
  input.addEventListener("input",render);
  input.addEventListener("keydown",event=>{
    if(event.key==="Escape"&&input.value){
      event.preventDefault();
      input.value="";
      render();
    }
  });
  document.addEventListener("click",event=>{
    if(event.target.closest?.("[data-set-lang]"))localize();
  });
  window.addEventListener("popstate",localize);
  // The section remains fully usable with scripts disabled: all cards are real HTML.
  localize();
})();
