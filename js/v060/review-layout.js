const PAPER_WIDTH=950;
let scheduled=false;

function schedule(){
  if(scheduled)return;
  scheduled=true;
  requestAnimationFrame(()=>{scheduled=false;syncReviewLayout()});
}

function ensureFinishProxy(){
  const panel=document.querySelector('#reviewPanel');
  const head=panel?.querySelector('.review-head');
  const real=document.querySelector('#finishBtn');
  if(!head||!real)return;
  let actions=head.querySelector('.review-head-actions');
  if(!actions){actions=document.createElement('div');actions.className='review-head-actions';head.appendChild(actions)}
  let proxy=actions.querySelector('.review-finish-proxy');
  if(!proxy){
    proxy=document.createElement('button');
    proxy.type='button';
    proxy.className='review-finish-proxy';
    proxy.textContent='採点を保存して結果へ';
    proxy.onclick=()=>real.click();
    actions.appendChild(proxy);
  }
}

function fitPaper(){
  const paper=document.querySelector('#paper');
  const stage=document.querySelector('#paperStage');
  if(!paper||!stage)return;
  if(!document.body.classList.contains('reviewing')){
    paper.style.removeProperty('zoom');
    paper.removeAttribute('data-review-zoom');
    return;
  }
  const available=Math.max(300,stage.clientWidth-24);
  const scale=Math.max(.45,Math.min(1,available/PAPER_WIDTH));
  paper.style.zoom=String(scale);
  paper.dataset.reviewZoom=scale.toFixed(3);
}

export function syncReviewLayout(){
  const reviewing=document.body.classList.contains('reviewing');
  if(reviewing)ensureFinishProxy();
  fitPaper();
}

export function initReviewLayout(){
  const bodyObserver=new MutationObserver(schedule);
  bodyObserver.observe(document.body,{attributes:true,attributeFilter:['class']});
  const panel=document.querySelector('#reviewPanel');
  if(panel)new MutationObserver(schedule).observe(panel,{childList:true,subtree:false});
  const stage=document.querySelector('#paperStage');
  if(stage&&'ResizeObserver'in window)new ResizeObserver(schedule).observe(stage);
  addEventListener('resize',schedule);
  schedule();
}
