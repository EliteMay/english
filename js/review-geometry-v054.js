/* v0.5.4 — keep solved-paper geometry stable while answer panel is shown. */
(()=>{
  let resizeTimer=0, syncRaf=0;

  function pr(){
    try{return typeof progress==='function'?progress():null}catch{return null}
  }

  function clearInlineGeometry(paper,stage){
    if(!paper)return;
    paper.classList.remove('review-paper-frozen');
    paper.style.removeProperty('width');
    paper.style.removeProperty('min-width');
    paper.style.removeProperty('max-width');
    paper.style.removeProperty('zoom');
    paper.style.removeProperty('transform');
    paper.style.removeProperty('transform-origin');
    paper.style.removeProperty('margin-bottom');
    if(stage){
      stage.classList.remove('review-paper-stage-frozen');
      stage.style.removeProperty('--review-paper-fit');
    }
  }

  function normalPaperWidth(){
    const area=document.querySelector('#practiceArea');
    if(!area)return 950;
    // In normal single-paper mode #paper is width:min(100%,950px).
    return Math.max(320,Math.min(950,Math.floor(area.clientWidth||950)));
  }

  function rememberSolvedGeometry(paper,progressState){
    if(!paper||!progressState)return;
    const width=Math.round(paper.clientWidth||0);
    if(width<320)return;
    progressState.paperGeometry??={};
    // Width is the important invariant: keeping it prevents field wrapping and text reflow.
    if(progressState.paperGeometry.width!==width){
      progressState.paperGeometry.width=width;
      progressState.paperGeometry.capturedAt=new Date().toISOString();
      progressState.paperGeometry.layout='paper-v053';
      try{save()}catch{}
    }
  }

  function fitFrozenPaper(paper,stage,naturalWidth){
    if(!paper||!stage)return;
    const available=Math.max(260,stage.clientWidth-4);
    const fit=Math.min(1,available/naturalWidth);
    stage.style.setProperty('--review-paper-fit',String(fit));

    // CSS zoom changes the outer layout size but does not reflow the paper's internal width.
    // Firefox 154+ and current Chromium support it. Fallback keeps the exact width and scrolls.
    if(window.CSS?.supports?.('zoom','1')){
      paper.style.zoom=String(fit);
      paper.style.transform='none';
      paper.style.marginBottom='0';
    }else{
      paper.style.zoom='1';
      paper.style.transformOrigin='top left';
      paper.style.transform=`scale(${fit})`;
      paper.style.marginBottom=`calc((${fit} - 1) * ${Math.max(1,paper.scrollHeight)}px)`;
    }
  }

  function syncReviewGeometry(){
    const paper=document.querySelector('#paper'),stage=document.querySelector('#paperStage'),area=document.querySelector('#practiceArea'),statePr=pr();
    if(!paper||!stage||!area||!statePr)return;

    if(!statePr.reviewMode){
      clearInlineGeometry(paper,stage);
      // Run after the normal render so this is the actual width the user writes on.
      rememberSolvedGeometry(paper,statePr);
      try{resizeCanvas();renderInk()}catch{}
      return;
    }

    const stored=Number(statePr.paperGeometry?.width)||normalPaperWidth();
    const naturalWidth=Math.max(320,Math.min(1200,stored));
    paper.classList.add('review-paper-frozen');
    stage.classList.add('review-paper-stage-frozen');
    paper.style.width=`${naturalWidth}px`;
    paper.style.minWidth=`${naturalWidth}px`;
    paper.style.maxWidth='none';
    fitFrozenPaper(paper,stage,naturalWidth);

    // Canvas is resized only after the paper geometry is frozen, so saved normalized strokes
    // are drawn against the same layout that existed while solving.
    requestAnimationFrame(()=>{
      try{resizeCanvas();renderInk()}catch{}
    });
  }

  function schedule(){
    cancelAnimationFrame(syncRaf);
    syncRaf=requestAnimationFrame(()=>requestAnimationFrame(()=>requestAnimationFrame(syncReviewGeometry)));
  }

  if(typeof renderPractice==='function'){
    const base=renderPractice;
    renderPractice=function(){
      const out=base.apply(this,arguments);
      schedule();
      return out;
    };
  }

  addEventListener('resize',()=>{
    clearTimeout(resizeTimer);
    resizeTimer=setTimeout(schedule,100);
  });

  window.EnglishReviewGeometryV054={sync:syncReviewGeometry};
})();
