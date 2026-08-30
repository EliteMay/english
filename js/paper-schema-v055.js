/* v0.5.5 — immutable paper schema.
   Existing handwritten paper keeps the exact worksheet geometry it was written on.
   New pedagogy revisions must not silently reshape an old paper. */
(()=>{
  const LEGACY_PACK_ID='sv-phrase-boundary';
  const LEGACY_REV='v051-paper';
  const CURRENT_REV='v2-paper';
  const LEGACY_RULE='骨格S/V：Sは主語として働く語句・節の範囲全体、Vは進行・受動・完了・助動詞を含む動詞のまとまりとして書く。修飾の節・句は必要に応じて括弧で外す。';
  const DISPLAY_RULE='骨格読み：まずS側の中心とV。修飾は後回し。「S全体」「範囲」と指定された問題だけ、端まで確認する。';

  const LEGACY_PACK={
    id:'sv-phrase-boundary',
    title:'補強｜S/Vを1語ではなく『かたまり』で取る',
    source:'ChatGPT弱点補強',
    level:'基礎→標準',
    focus:'主語句の範囲・動詞のまとまり',
    description:'実際の解答で見えた「S/Vを1語だけで切る」癖を直す専用セット。Sは主語として働く語句全体、Vは進行・受動・完了・助動詞を含むまとまりとして取る。',
    paperRevision:LEGACY_REV,
    questions:[
      {id:'pb01',type:'fields',prompt:'Sは名詞1語ではなく、主語として働く範囲全体を書いてください。',sentence:'A group of students from my class is waiting outside.',fields:[{id:'s',label:'S全体',answers:['A group of students from my class']},{id:'v',label:'V全体',answers:['is waiting']}],skill:'phrase-boundary',note:'中心語は group だが、Sとして働く範囲は A group of students from my class 全体。',reviewAnswer:'範囲問題: S全体 = A group of students from my class ｜ V = is waiting。通常の骨格読みなら group / is waiting を先に見ればよい。'},
      {id:'pb02',type:'choice',prompt:'この文のVを「まとまり」で取るならどれ？',sentence:'The old bridge was repaired last month.',choices:['was','repaired','was repaired','last month'],answer:'was repaired',skill:'verb-group',note:'受動態 be + 過去分詞を分けない。'},
      {id:'pb03',type:'fields',prompt:'動名詞句全体をSとして書いてください。',sentence:'Reading difficult sentences slowly helps me notice the structure.',fields:[{id:'s',label:'S全体',answers:['Reading difficult sentences slowly']},{id:'v',label:'V全体',answers:['helps']}],skill:'phrase-boundary',note:'Reading だけで切らず、その動作の中身までSに含める。',reviewAnswer:'この設問は「範囲問題」。文法上のS全体 = Reading difficult sentences slowly ｜ V = helps。普段の骨格読みでは Reading / helps を先に取ればよく、slowly は後回しでよい。'},
      {id:'pb04',type:'fields',prompt:'to不定詞句全体をSとして書いてください。',sentence:'To separate the main clause from the modifiers takes practice.',fields:[{id:'s',label:'S全体',answers:['To separate the main clause from the modifiers']},{id:'v',label:'V全体',answers:['takes']}],skill:'phrase-boundary',note:'To separate だけでなく、その目的語・修飾まで含めて1つのS。',reviewAnswer:'範囲問題: S全体 = To separate the main clause from the modifiers ｜ V = takes。骨格読みでは To separate / takes を先に取ればよい。'},
      {id:'pb05',type:'choice',prompt:'進行形のVをまとまりで選んでください。',sentence:'The students near the window are talking quietly.',choices:['are','talking','are talking','quietly'],answer:'are talking',skill:'verb-group',note:'are は時制・一致、talking は動作内容。2語でVのまとまり。'},
      {id:'pb06',type:'choice',prompt:'現在完了のVをまとまりで選んでください。',sentence:'My sister has finished the report already.',choices:['has','finished','has finished','has finished the report'],answer:'has finished',skill:'verb-group',note:'has だけでは完了の意味を作れない。'},
      {id:'pb07',type:'choice',prompt:'完了＋受動のVをまとまりで選んでください。',sentence:'The final schedule has been changed twice.',choices:['has','been','changed','has been changed'],answer:'has been changed',skill:'verb-group',note:'has + been + changed が1つの動詞グループ。'},
      {id:'pb08',type:'fields',prompt:'関係詞節を外して、主節S/Vを「範囲」で書いてください。',sentence:'The student who sits behind me has been absent this week.',fields:[{id:'s',label:'主節S全体',answers:['The student']},{id:'v',label:'主節V全体',answers:['has been absent']}],skill:'clauses',note:'who sits behind me は student の説明。主節Vは has だけではなく has been absent まで。',reviewAnswer:'構造分解すると 主節S = The student ｜ V = has been ｜ C = absent。who sits behind me は修飾節、this week は修飾。'},
      {id:'pb09',type:'fields',prompt:'前置詞句にある名詞をSと誤認しないでください。',sentence:'A box of letters from my grandfather was sitting on the desk.',fields:[{id:'s',label:'S全体',answers:['A box of letters from my grandfather']},{id:'v',label:'V全体',answers:['was sitting']}],skill:'phrase-boundary',note:'letters / grandfather はS内部の名詞。文全体のSは A box ... 全体。',reviewAnswer:'範囲問題: S全体 = A box of letters from my grandfather ｜ V = was sitting。骨格読みでは box / was sitting を先に取ればよい。'},
      {id:'pb10',type:'choice',prompt:'助動詞を含むVのまとまりはどれ？',sentence:'The plan might have changed by tomorrow.',choices:['might','have','changed','might have changed'],answer:'might have changed',skill:'verb-group',note:'助動詞 + have + 過去分詞を1つのVとして見る。'},
      {id:'pb11',type:'fields',prompt:'主語の中心語とS全体を区別してください。',sentence:'The color of these old photographs has faded over time.',fields:[{id:'head',label:'Sの中心語',answers:['color','The color']},{id:'s',label:'S全体',answers:['The color of these old photographs']},{id:'v',label:'V全体',answers:['has faded']}],skill:'phrase-boundary',note:'photographs は動詞の直前に近くてもSの中心語ではない。'},
      {id:'pb12',type:'manual',prompt:'自分用ルールとして「SとVをどこまで書くか」を2行でまとめてください。',sentence:'',skill:'phrase-boundary',guide:'骨格読みではS側の中心とVを先に取る。S全体を問われた時だけ修飾を含む端まで確認する。Vは助動詞・be/have・分詞などの動詞グループで、O/Cや副詞は含めない。',lines:4,note:''}
    ]
  };

  function rawProgress(){return state?.packProgress?.[LEGACY_PACK_ID]||null}
  function hasPriorWork(pr){
    if(!pr)return false;
    const ink=Object.values(pr.inkPages||{}).some(a=>Array.isArray(a)&&a.length);
    const grades=Object.keys(pr.selfGrades||{}).length>0;
    const snaps=Array.isArray(pr.snapshots)&&pr.snapshots.length>0;
    return ink||grades||snaps;
  }
  function ensureRevision(){
    const pr=rawProgress();if(!pr)return null;
    if(!pr.paperRevision)pr.paperRevision=hasPriorWork(pr)?LEGACY_REV:CURRENT_REV;
    return pr.paperRevision;
  }
  function isLegacy(){return ensureRevision()===LEGACY_REV}

  if(typeof packById==='function'){
    const basePackById=packById;
    packById=function(pid){
      if(pid===LEGACY_PACK_ID&&isLegacy())return LEGACY_PACK;
      return basePackById(pid);
    };
  }

  if(typeof answerBasis==='function'){
    const baseAnswerBasis=answerBasis;
    answerBasis=function(q){return q?.reviewAnswer||baseAnswerBasis(q)};
  }

  function fixedText(el,text){
    if(!el)return;
    const h=Math.ceil(el.getBoundingClientRect().height||el.offsetHeight||0);
    if(h>0){el.style.boxSizing='border-box';el.style.height=h+'px';el.style.minHeight=h+'px';el.style.maxHeight=h+'px';}
    el.textContent=text;
  }

  function legacyNotice(){
    const stage=document.querySelector('#paperStage');if(!stage)return;
    let n=document.querySelector('#legacyPaperNotice');
    if(!isLegacy()){n?.remove();return}
    if(!n){n=document.createElement('div');n.id='legacyPaperNotice';n.className='legacy-paper-notice';stage.before(n)}
    n.innerHTML='<strong>旧紙面をそのまま復元中</strong>：この紙には既存の手書きがあるため、問題文・回答欄・高さを当時のまま固定しています。新しい骨格読みルールは答え合わせ側で補足します。';
  }

  function restoreLegacyGeometry(){
    const paper=document.querySelector('#paper'),rule=paper?.querySelector('.paper-rule');
    if(!paper)return;
    const legacy=state.activePackId===LEGACY_PACK_ID&&isLegacy();
    paper.classList.toggle('paper-schema-v051',legacy);
    legacyNotice();
    if(!legacy)return;

    // pedagogy-v053 may rewrite this node after render. Reset it to the old box size first,
    // then show a corrected short rule inside that same fixed-height box.
    if(rule){
      rule.removeAttribute('data-v053');
      rule.style.removeProperty('display');
      rule.style.removeProperty('grid-template-columns');
      if(rule.dataset.paperSchema!=='v051'){
        rule.textContent=LEGACY_RULE;
        const h=Math.ceil(rule.getBoundingClientRect().height||rule.offsetHeight||0);
        if(h>0){rule.style.boxSizing='border-box';rule.style.height=h+'px';rule.style.minHeight=h+'px';rule.style.maxHeight=h+'px'}
        rule.dataset.paperSchema='v051';
      }
      rule.textContent=DISPLAY_RULE;
    }

    // Keep the historical q08 note box height but replace the now-corrected explanation.
    const q8=paper.querySelector('.question[data-question-id="pb08"] .q-note');
    if(q8&&q8.dataset.legacyFixedNote!=='1'){
      fixedText(q8,'who sits behind me は修飾節。構造分解では V=has been、absent=C。');
      q8.dataset.legacyFixedNote='1';
    }

    try{resizeCanvas();renderInk()}catch{}
  }

  function scheduleRestore(){
    restoreLegacyGeometry();
    let n=0;const tick=()=>{restoreLegacyGeometry();if(++n<6)requestAnimationFrame(tick)};requestAnimationFrame(tick);
    setTimeout(restoreLegacyGeometry,120);
  }

  if(typeof renderPractice==='function'){
    const baseRender=renderPractice;
    renderPractice=function(){
      if(state.activePackId===LEGACY_PACK_ID)ensureRevision();
      const out=baseRender.apply(this,arguments);
      scheduleRestore();
      return out;
    };
  }

  // When a fresh paper is reset, it uses the current schema instead of inheriting the old one.
  if(typeof resetCurrentPaperV050==='function'){
    const baseReset=resetCurrentPaperV050;
    resetCurrentPaperV050=function(){
      const pid=state.activePackId;
      const out=baseReset.apply(this,arguments);
      if(pid===LEGACY_PACK_ID&&state.packProgress?.[pid])state.packProgress[pid].paperRevision=CURRENT_REV;
      return out;
    };
  }

  window.EnglishPaperSchemaV055={legacyRevision:LEGACY_REV,currentRevision:CURRENT_REV,isLegacy,restore:restoreLegacyGeometry};
})();
