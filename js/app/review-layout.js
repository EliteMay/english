const PAPER_WIDTH=950;
let scheduled=false;

function schedule(){
  if(scheduled)return;
  scheduled=true;
  requestAnimationFrame(()=>{scheduled=false;syncReviewLayout()});
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

export function syncReviewLayout(){fitPaper()}

export function initReviewLayout(){
  const stage=document.querySelector('#paperStage');
  if(stage&&'ResizeObserver'in window)new ResizeObserver(schedule).observe(stage);
  addEventListener('resize',schedule);
  schedule();
}
