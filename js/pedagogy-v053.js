(()=>{
  const MODE_META={
    skeleton:{label:'骨格読み',short:'必要な中心を先に',help:'修飾は一旦後回し。主節のS側の中心とVを先に取ります。'},
    range:{label:'範囲問題',short:'端まで取る',help:'「S全体」「範囲」と指定された問題だけ、主語として働く句・節の端まで示します。'},
    structure:{label:'構造分解',short:'S/V/O/Cを分ける',help:'文型・O/C・節などを役割ごとに厳密に分けます。'}
  };

  function studyMode(q,pack){
    if(q?.studyMode&&MODE_META[q.studyMode])return q.studyMode;
    const text=`${q?.prompt||''} ${q?.note||''}`;
    if(/【範囲問題】|S全体|主語.*全体|全体をS|厳密な範囲/.test(text))return'range';
    if(/【骨格問題】|主節|骨格|いったん外|一旦外|修飾を外|中心S\/V/.test(text))return'skeleton';
    if(/S・V・O|S・V・C|S・V・O1|O=C|文型|構造を説明|構造分解/.test(text))return'structure';
    if(pack?.defaultStudyMode&&MODE_META[pack.defaultStudyMode])return pack.defaultStudyMode;
    if(pack?.id==='foundation-sv')return'skeleton';
    return'';
  }

  function ensureRuleBanner(){
    const rule=document.querySelector('#paper .paper-rule');
    if(!rule||rule.dataset.v053)return;
    rule.dataset.v053='1';
    rule.innerHTML='<strong>基本は「骨格読み」</strong><span>修飾は一旦後回しにして、主節の中心を先に取る。</span><span><b>Sの核</b>は読解の第一段階で残す中心で、文法上の<b>S全体</b>とは別。</span><span><b>V</b>は助動詞・be/have＋分詞などの動詞グループ。O/C・副詞はVへ入れない。</span><span>「範囲問題」と書かれた時だけ、S全体を端まで取る。</span>';
  }

  function modeBadge(mode){
    const meta=MODE_META[mode];if(!meta)return null;
    const el=document.createElement('span');el.className=`study-mode-badge ${mode}`;el.textContent=meta.label;el.title=meta.help;return el;
  }

  function currentPageQuestions(){
    const pack=typeof packById==='function'?packById(state.activePackId):null;
    if(!pack)return{pack:null,questions:[]};
    return{pack,questions:pack.questions.slice(currentPage*PAGE_SIZE,(currentPage+1)*PAGE_SIZE)};
  }

  function focusQuestionOnPaper(qid){
    const stage=document.querySelector('#paperStage'),paper=document.querySelector('#paper'),target=document.querySelector(`.question[data-question-id="${qid}"]`);
    if(!stage||!paper||!target)return;
    const targetBox=target.getBoundingClientRect(),paperBox=paper.getBoundingClientRect();
    const relative=(targetBox.top-paperBox.top)+stage.scrollTop;
    stage.scrollTo({top:Math.max(0,relative-36),behavior:document.documentElement.dataset.reduceMotion==='1'?'auto':'smooth'});
    document.querySelectorAll('.question.review-focus').forEach(el=>el.classList.remove('review-focus'));
    target.classList.add('review-focus');
    clearTimeout(focusQuestionOnPaper.t);focusQuestionOnPaper.t=setTimeout(()=>target.classList.remove('review-focus'),1800);
  }

  function decoratePracticeV053(){
    ensureRuleBanner();
    const {pack,questions}=currentPageQuestions();if(!pack)return;
    document.querySelectorAll('#questionList .question').forEach((el,i)=>{
      const q=questions[i];if(!q)return;
      const mode=studyMode(q,pack);el.dataset.studyMode=mode||'';
      if(!mode||el.querySelector('.q-mode-row'))return;
      const row=document.createElement('div');row.className='q-mode-row';const badge=modeBadge(mode);if(badge)row.append(badge);
      const meta=MODE_META[mode];const hint=document.createElement('span');hint.className='q-mode-hint';hint.textContent=meta.short;row.append(hint);
      const prompt=el.querySelector('.q-prompt');prompt?.before(row);
    });

    document.querySelectorAll('#reviewPanel .review-answer-item').forEach((el,i)=>{
      const q=questions[i];if(!q)return;
      el.dataset.questionId=q.id;
      const content=el.children[1];if(!content)return;
      const mode=studyMode(q,pack);
      if(!content.querySelector('.review-question-tools')){
        const tools=document.createElement('div');tools.className='review-question-tools';
        const jump=document.createElement('button');jump.type='button';jump.className='review-jump-btn';jump.textContent=`← 問${currentPage*PAGE_SIZE+i+1}を見る`;jump.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();focusQuestionOnPaper(q.id)});tools.append(jump);
        const badge=modeBadge(mode);if(badge)tools.append(badge);
        content.prepend(tools);
      }
    });
  }

  function addHelpV053(){
    const dialog=document.querySelector('#helpDialogV050 .dialog-grid');if(!dialog||dialog.querySelector('[data-v053-help]'))return;
    const section=document.createElement('section');section.className='dialog-section';section.dataset.v053Help='1';section.innerHTML='<h3>Sを見るときの3段階</h3><p><b>骨格読み:</b> 最初に必要な中心だけ残す。例: <code>Reading ... helps</code> なら最初は <code>Reading / helps</code> まで取れればよい。</p><p><b>範囲問題:</b> 「S全体」と指定された時だけ <code>Reading difficult sentences slowly</code> のように端まで取る。</p><p><b>構造分解:</b> S/V/O/Cや節を厳密に分ける。<code>has been absent</code> なら V=<code>has been</code>、C=<code>absent</code>。</p>';
    dialog.prepend(section);
  }

  if(typeof renderPractice==='function'){
    const baseRenderPractice=renderPractice;
    renderPractice=function(){const out=baseRenderPractice.apply(this,arguments);requestAnimationFrame(()=>requestAnimationFrame(()=>{decoratePracticeV053();addHelpV053()}));return out};
  }

  if(typeof analysisPrompt==='function'){
    const baseAnalysisPrompt=analysisPrompt;
    analysisPrompt=function(){return baseAnalysisPrompt()+`\n\n【このサイトのS/V判定ルール】\n- 問題文・questions.json の studyMode を確認する。\n- skeleton / 骨格読み: 修飾語を省いて中心を取る学習。slowly・of句・関係詞節などを省いたこと自体を弱点扱いしない。\n- range / 範囲問題: S全体など端まで要求された場合だけ、句・節の範囲不足を評価する。\n- structure / 構造分解: S/V/O/Cや節を厳密に分ける。\n- Vは動詞グループ。副詞は含めない。例: has already been checked のVは has been checked。\n- SVCではCをVへ含めない。例: has been absent のVは has been、absentはC。\n- 『骨格S』は読解用の中心ラベルであり、文法上のS全体と同一とは限らない。\nこの区別を無視して、骨格読みで省いた修飾語を誤答・弱点と判定しないでください。`};
  }

  window.EnglishPedagogyV053={studyMode,decorate:decoratePracticeV053,focusQuestion:focusQuestionOnPaper};
})();
