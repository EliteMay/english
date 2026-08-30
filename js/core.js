const APP_BUILD=window.EnglishWorksheetBuild||{version:'v0.5.0',build:'20260830-2',dataSchema:4,analysisSchema:2,submissionPackage:2};
const STORAGE_KEY='english-worksheet-lab-v4',LEGACY_KEYS=['english-worksheet-lab-v3','english-worksheet-lab-v2'];
const PAGE_SIZE=10;
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const makeState=()=>({version:4,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),activePackId:null,packProgress:{},paperArchives:{},sessions:[],analysis:null,analysisHistory:[],totalAnswerEvents:0});
let state=loadState(),bank={packs:[],policy:{}},curriculum={phases:[],packs:{},skills:{}},activeSource='all',activeLevel='all',activeStatus='all',packSearchText='',currentPage=0,mode='pen';
let pen={drawing:false,color:'#1f2937',eraser:false,tool:'pen',size:'normal',stroke:null};

function parseJsonSafe(raw){try{return raw?JSON.parse(raw):null}catch{return null}}
function normalizeState(input){const base=makeState(),s=input&&typeof input==='object'?{...base,...input}:base;s.version=4;s.packProgress=s.packProgress&&typeof s.packProgress==='object'?s.packProgress:{};s.paperArchives=s.paperArchives&&typeof s.paperArchives==='object'?s.paperArchives:{};s.sessions=Array.isArray(s.sessions)?s.sessions:[];s.analysisHistory=Array.isArray(s.analysisHistory)?s.analysisHistory:[];return s}
function loadState(){
  try{const cur=parseJsonSafe(localStorage.getItem(STORAGE_KEY));if(cur)return normalizeState(cur)}catch{}
  for(const key of LEGACY_KEYS){try{const old=parseJsonSafe(localStorage.getItem(key));if(old)return normalizeState({createdAt:old.createdAt,activePackId:old.activePackId,packProgress:old.packProgress||{},sessions:old.sessions||[],analysis:old.analysis||null,analysisHistory:old.analysisHistory||[]})}catch{}}
  return makeState();
}
function save(){
  state.updatedAt=new Date().toISOString();state.version=4;const pr=state.activePackId?state.packProgress[state.activePackId]:null;if(pr)pr.lastTouchedAt=state.updatedAt;
  try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));setStorageWarningV050?.('')}catch(err){console.error(err);setStorageWarningV050?.('保存容量が不足しています。ChatGPT提出ZIPまたはバックアップJSONを書き出してから、古い紙面を整理してください。')}
  const el=$('#saveState');if(el)el.textContent='保存済み '+new Date().toLocaleTimeString('ja-JP',{hour:'2-digit',minute:'2-digit'});updateTopStats();scheduleStorageCheckV050?.();
}
function toast(msg){const el=$('#toast');if(!el)return;el.textContent=msg;el.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.remove('show'),2100)}
function id(){return crypto.randomUUID?.()||`${Date.now()}-${Math.random()}`}
function esc(v=''){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function packById(pid){return bank.packs.find(p=>p.id===pid)}
function freshProgress(){return {startedAt:new Date().toISOString(),lastTouchedAt:new Date().toISOString(),attemptId:id(),answers:{},answerHistory:[],memos:{},confidence:{},inkPages:{},redoPages:{},clearHistory:{},snapshots:[],currentPage:0,lastScore:null,completedAt:null,selfGrades:{},reviewTags:{},reviewNotes:{},reviewMode:false,pageTimeMs:{}}}
function progress(pid=state.activePackId){if(!pid)return null;if(!state.packProgress[pid])state.packProgress[pid]=freshProgress();const pr=state.packProgress[pid];for(const [k,v] of Object.entries(freshProgress()))if(pr[k]==null)pr[k]=Array.isArray(v)?[]:typeof v==='object'?{}:v;return pr}
function questionTouched(pr,qid){return Object.values(pr?.inkPages||{}).some(strokes=>strokes.some(s=>s.questionId===qid))||!!pr?.selfGrades?.[qid]}
function answerCount(pid){const p=packById(pid),pr=state.packProgress[pid];return p&&pr?p.questions.filter(q=>questionTouched(pr,q.id)).length:0}
function completionPercent(pid){const p=packById(pid);return p?Math.round(answerCount(pid)/p.questions.length*100):0}
function updateTopStats(){const total=Object.entries(state.packProgress).reduce((n,[pid,pr])=>{const p=packById(pid);return n+(p?p.questions.filter(q=>questionTouched(pr,q.id)).length:0)},0);if($('#answeredTotal'))$('#answeredTotal').textContent=total}
function packMeta(pid){return curriculum.packs?.[pid]||{order:999,phase:'その他',minutes:null,skills:[],tags:[]}}
function packStatus(pid){const pr=state.packProgress[pid];if(!pr)return'unstarted';if(pr.completedAt)return'completed';return answerCount(pid)>0||pr.startedAt?'active':'unstarted'}
function recommendedPackIds(){const ids=[];for(const w of state.analysis?.weaknesses||[])for(const pid of w.recommendedPackIds||[])if(packById(pid)&&!ids.includes(pid))ids.push(pid);return ids}
function latestTouchedPack(){return Object.entries(state.packProgress).filter(([pid,pr])=>packById(pid)&&pid!=='mistake-review'&&(answerCount(pid)>0||pr.completedAt)).sort((a,b)=>Date.parse(b[1].lastTouchedAt||b[1].startedAt||0)-Date.parse(a[1].lastTouchedAt||a[1].startedAt||0))[0]?.[0]||null}

async function init(){
  const build=encodeURIComponent(APP_BUILD.build||Date.now()),manifest=await fetch(`./data/packs/index.json?b=${build}`,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('問題データ一覧を読み込めません');return r.json()});
  const [groups,cur]=await Promise.all([Promise.all(manifest.files.map(f=>fetch(`./data/packs/${f}?b=${build}`,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error(f+' を読み込めません');return r.json()}))),fetch(`./data/${manifest.catalog||'curriculum.json'}?b=${build}`,{cache:'no-store'}).then(r=>r.ok?r.json():({phases:[],packs:{},skills:{}}))]);
  bank={policy:manifest.policy||{},packs:groups.flat()};curriculum=cur||{phases:[],packs:{},skills:{}};state=normalizeState(state);state.activePackId=packById(state.activePackId)?state.activePackId:null;
  initProductV050?.();bindGlobal();renderLibrary();renderPractice();renderResults();renderAnalysis();renderSchema();updateTopStats();setMode('pen',false);save();
}
function bindGlobal(){
  $$('.nav-btn').forEach(b=>b.onclick=()=>openView(b.dataset.view));$$('[data-jump]').forEach(b=>b.onclick=()=>openView(b.dataset.jump));$('#menuBtn').onclick=()=>$('#sidebar').classList.toggle('open');
  $('#levelFilter').onchange=e=>{activeLevel=e.target.value;renderPackGrid()};$('#statusFilter').onchange=e=>{activeStatus=e.target.value;renderPackGrid()};$('#packSearch').oninput=e=>{packSearchText=e.target.value.trim().toLocaleLowerCase('ja');renderPackGrid()};
  $('#quickExportBtn').onclick=()=>downloadSubmissionZip();$('#downloadSubmissionZipBtn').onclick=()=>downloadSubmissionZip();$('#downloadAnalysisInputBtn').onclick=downloadAnalysisInput;$('#copyAnalysisPromptBtn').onclick=copyAnalysisPrompt;$('#analysisImport').onchange=importAnalysis;
  $$('.color-btn').forEach(b=>b.onclick=()=>{pen.color=b.dataset.color;pen.eraser=false;pen.tool='pen';$$('.color-btn').forEach(x=>x.classList.toggle('active',x===b));$('#eraserBtn').classList.remove('active');$('#markerBtn').classList.remove('active');setMode('pen')});
  $('#markerBtn').onclick=()=>{pen.eraser=false;pen.tool='marker';pen.color='#eab308';$('#markerBtn').classList.add('active');$('#eraserBtn').classList.remove('active');$$('.color-btn').forEach(x=>x.classList.remove('active'));setMode('pen')};
  $('#eraserBtn').onclick=()=>{pen.eraser=!pen.eraser;pen.tool=pen.eraser?'eraser':'pen';$('#eraserBtn').classList.toggle('active',pen.eraser);if(pen.eraser)$('#markerBtn').classList.remove('active');setMode('pen')};
  $$('.pen-size').forEach(b=>b.onclick=()=>{pen.size=b.dataset.penSize;$$('.pen-size').forEach(x=>x.classList.toggle('active',x===b));savePreferenceV050?.('penSize',pen.size)});
  $('#undoInkBtn').onclick=undoInk;$('#redoInkBtn').onclick=redoInk;$('#clearInkBtn').onclick=clearInk;$('#prevPageBtn').onclick=()=>changePage(-1);$('#nextPageBtn').onclick=()=>changePage(1);$('#finishBtn').onclick=finishPackAction;$('#saveSnapshotBtn').onclick=saveSnapshot;
  $('#paperZoom').onchange=e=>setPaperZoomV050?.(Number(e.target.value),true);$('#focusPaperBtn').onclick=()=>togglePaperFocusV050?.();$('#focusPaperTopBtn').onclick=()=>togglePaperFocusV050?.();$('#startMistakeReviewBtn').onclick=()=>startMistakeReviewV050?.();
  addEventListener('resize',()=>requestAnimationFrame(()=>{resizeCanvas();renderInk()}));setupCanvas();bindProductEventsV050?.();
}
function openView(name){
  if(name!=='practice')flushPageTimer?.();$$('.view').forEach(v=>v.classList.toggle('active',v.id===`view-${name}`));$$('.nav-btn').forEach(b=>b.classList.toggle('active',b.dataset.view===name));
  const meta={library:['WORKSHEETS','問題を選ぶ'],practice:['PRACTICE','問題を解く'],results:['RESULT & REVIEW','結果・復習'],weakness:['CHATGPT ANALYSIS','弱点・ChatGPT分析']}[name];$('#viewEyebrow').textContent=meta[0];$('#viewTitle').textContent=meta[1];
  if(name==='practice'){renderPractice();setTimeout(()=>{resizeCanvas();renderInk()},30)}if(name==='results')renderResults();if(name==='weakness')renderAnalysis();if(innerWidth<760)$('#sidebar').classList.remove('open');scrollTo({top:0,behavior:'smooth'});
}
function renderLibrary(){
  const visible=bank.packs.filter(p=>p.id!=='mistake-review');$('#packCount').textContent=visible.length;$('#questionCount').textContent=visible.reduce((n,p)=>n+p.questions.length,0);$('#finishedCount').textContent=Object.entries(state.packProgress).filter(([pid,p])=>pid!=='mistake-review'&&p.completedAt&&packById(pid)).length;
  renderLibraryQuick();const sources=['all',...new Set(visible.map(p=>p.source))];$('#sourceFilters').innerHTML=sources.map(s=>`<button class="chip ${s===activeSource?'active':''}" data-source="${esc(s)}">${s==='all'?'すべて':esc(s)}</button>`).join('');$$('#sourceFilters .chip').forEach(b=>b.onclick=()=>{activeSource=b.dataset.source;renderLibrary()});
  const levels=[...new Set(visible.map(p=>p.level))];$('#levelFilter').innerHTML='<option value="all">難易度すべて</option>'+levels.map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('');$('#levelFilter').value=activeLevel;renderCurriculumGuide();renderPackGrid();
}
function renderLibraryQuick(){
  const cont=latestTouchedPack(),rec=recommendedPackIds().find(pid=>packStatus(pid)!=='completed')||recommendedPackIds()[0]||bank.packs.filter(p=>p.id!=='mistake-review').sort((a,b)=>packMeta(a.id).order-packMeta(b.id).order).find(p=>packStatus(p.id)!=='completed')?.id,mistakes=mistakeQuestionCountV050?.()||0;
  const cp=packById(cont),rp=packById(rec);$('#libraryQuick').innerHTML=`<article class="quick-card primary-quick"><span class="eyebrow">CONTINUE</span><h3>${cp?esc(cp.title):'最初の問題から始める'}</h3><p>${cp?'前回の紙面・ページからそのまま続けます。':'S/Vから始めて、判断が安定している所は早めに先へ進めます。'}</p><div class="quick-actions"><button class="primary compact" data-quick-pack="${cp?.id||bank.packs[0]?.id||''}">${cp?'続きから':'始める'}</button></div></article><article class="quick-card"><span class="eyebrow">NEXT TARGET</span><h3>${rp?esc(rp.title):'分析待ち'}</h3><p>${state.analysis?'ChatGPT分析の推奨を優先表示しています。':'未完了の学習順から次候補を表示しています。'}</p>${rp?`<div class="quick-actions"><button class="secondary compact" data-quick-pack="${rp.id}">開く</button></div>`:''}</article><article class="quick-card"><span class="eyebrow">MISTAKE REVIEW</span><div class="quick-metric">${mistakes}<small> 問</small></div><p>過去の△・×のうち、現在も復習対象になっている問題です。</p><div class="quick-actions"><button class="secondary compact" data-mistake-review ${mistakes?'':'disabled'}>ミス復習</button></div></article>`;$$('[data-quick-pack]').forEach(b=>b.onclick=()=>b.dataset.quickPack&&startPack(b.dataset.quickPack));$('[data-mistake-review]')?.addEventListener('click',()=>startMistakeReviewV050?.());
}
function renderCurriculumGuide(){
  const phases=curriculum.phases||[],current=phases.find(ph=>(ph.packIds||[]).some(pid=>packStatus(pid)!=='completed'))?.id;$('#curriculumGuide').innerHTML=phases.map((ph,i)=>`<button class="phase-chip ${ph.id===current?'current':''}" data-phase="${esc(ph.id)}" title="${esc(ph.summary||'')}"><strong>${i+1}</strong>${esc(ph.title)}</button>`).join('');$$('[data-phase]').forEach(b=>b.onclick=()=>{const ph=phases.find(x=>x.id===b.dataset.phase),pid=ph?.packIds?.find(x=>packById(x));if(pid){activeSource='all';activeLevel='all';packSearchText='';$('#packSearch').value='';document.querySelector(`[data-start-pack="${pid}"]`)?.scrollIntoView({behavior:'smooth',block:'center'})}})
}
function renderPackGrid(){
  const recs=new Set(recommendedPackIds()),q=packSearchText;let list=bank.packs.filter(p=>p.id!=='mistake-review').filter(p=>(activeSource==='all'||p.source===activeSource)&&(activeLevel==='all'||p.level===activeLevel)&&(activeStatus==='all'||packStatus(p.id)===activeStatus));
  if(q)list=list.filter(p=>[p.title,p.description,p.focus,p.source,...(packMeta(p.id).tags||[])].join(' ').toLocaleLowerCase('ja').includes(q));list.sort((a,b)=>packMeta(a.id).order-packMeta(b.id).order);
  $('#packGrid').innerHTML=list.map(p=>{const pr=state.packProgress[p.id],pct=completionPercent(p.id),done=!!pr?.completedAt,meta=packMeta(p.id),recommended=recs.has(p.id);return `<article class="pack-card ${recommended?'is-recommended':''}"><div class="pack-top"><span class="pack-source">${esc(p.source)}</span><span class="level-badge">${esc(p.level)}</span></div><h3>${esc(p.title)}</h3><p>${esc(p.description)}</p><div class="pack-badges">${meta.phase?`<span class="pack-badge">${esc(meta.phase)}</span>`:''}${meta.minutes?`<span class="pack-badge">目安 ${meta.minutes}分</span>`:''}${recommended?'<span class="pack-badge ai">AI推奨</span>':''}</div><div class="pack-meta"><span>${p.questions.length}問</span><span>${esc(p.focus)}</span><span>${done?'完了':'書込 '+pct+'%'}</span></div><div class="pack-progress"><span style="width:${pct}%"></span></div><div class="pack-actions"><small>${pr?.lastScore!=null?'前回 '+pr.lastScore+'%':pr?'書き込み途中':'未開始'}</small><div>${done?`<button class="ghost-pack" data-restart-pack="${p.id}">新しく解く</button>`:''}<button class="primary compact" data-start-pack="${p.id}">${done?'紙を開く':pr?'続きから':'解く'}</button></div></div></article>`}).join('')||'<div class="empty-card"><h2>一致する問題がありません</h2><p>検索語や絞り込みを変えてください。</p></div>';$$('[data-start-pack]').forEach(b=>b.onclick=()=>startPack(b.dataset.startPack));$$('[data-restart-pack]').forEach(b=>b.onclick=()=>restartPack(b.dataset.restartPack));
}
function startPack(pid){if(!packById(pid))return;state.activePackId=pid;const pr=progress(pid);currentPage=pr.currentPage||0;pr.reviewMode=false;save();openView('practice')}
function restartPack(pid){const p=packById(pid),old=state.packProgress[pid];if(!p||!old)return;if(!confirm(`「${p.title}」を新しい紙で解き直しますか？\n今の紙面はアーカイブに残します。`))return;createRecoverySnapshotV050?.('restart-'+pid);state.paperArchives[pid]??=[];state.paperArchives[pid].unshift({archivedAt:new Date().toISOString(),progress:structuredClone(old)});state.paperArchives[pid]=state.paperArchives[pid].slice(0,3);state.packProgress[pid]=freshProgress();state.activePackId=pid;currentPage=0;save();openView('practice');toast('新しい問題用紙を作りました')}
