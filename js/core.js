const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const KEY='english-worksheet-lab-v2';
const PAGE_SIZE=10;
const makeState=()=>({version:2,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),activePackId:null,packProgress:{},sessions:[],analysis:null,totalAnswerEvents:0});
let state=loadState();
let bank={packs:[],policy:{}},activeSource='all',activeLevel='all',currentPage=0,mode='answer';
let pen={drawing:false,color:'#1f2937',eraser:false,stroke:null};

function loadState(){try{return {...makeState(),...JSON.parse(localStorage.getItem(KEY)||'null')}}catch{return makeState()}}
function save(){state.updatedAt=new Date().toISOString();localStorage.setItem(KEY,JSON.stringify(state));const el=$('#saveState');if(el)el.textContent='保存済み '+new Date().toLocaleTimeString('ja-JP',{hour:'2-digit',minute:'2-digit'});updateTopStats()}
function toast(msg){const el=$('#toast');el.textContent=msg;el.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.remove('show'),1800)}
function id(){return crypto.randomUUID?.()||`${Date.now()}-${Math.random()}`}
function norm(v){return String(v??'').trim().toLowerCase().replace(/[’']/g,"'").replace(/\s+/g,' ')}
function esc(v=''){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function packById(pid){return bank.packs.find(p=>p.id===pid)}
function progress(pid=state.activePackId){
  if(!pid)return null;
  if(!state.packProgress[pid])state.packProgress[pid]={startedAt:new Date().toISOString(),answers:{},answerHistory:[],memos:{},confidence:{},inkPages:{},snapshots:[],currentPage:0,lastScore:null,completedAt:null};
  return state.packProgress[pid];
}
function questionAnswered(q,a){
  if(q.type==='choice')return typeof a==='string'&&a.length>0;
  if(q.type==='manual')return typeof a==='string'&&a.trim().length>0;
  if(q.type==='fields')return q.fields.some(f=>String(a?.[f.id]??'').trim().length>0);
  return false;
}
function questionComplete(q,a){
  if(q.type==='choice'||q.type==='manual')return questionAnswered(q,a);
  if(q.type==='fields')return q.fields.every(f=>String(a?.[f.id]??'').trim().length>0 || (f.answers||[]).includes(''));
  return false;
}
function answerCount(pid){const p=packById(pid),pr=state.packProgress[pid];return p&&pr?p.questions.filter(q=>questionAnswered(q,pr.answers[q.id])).length:0}
function completionPercent(pid){const p=packById(pid);return p?Math.round(answerCount(pid)/p.questions.length*100):0}
function updateTopStats(){
  const total=Object.entries(state.packProgress).reduce((n,[pid,pr])=>{const p=packById(pid);return n+(p?p.questions.filter(q=>questionAnswered(q,pr.answers[q.id])).length:0)},0);
  if($('#answeredTotal'))$('#answeredTotal').textContent=total;
}

async function init(){
  const manifest=await fetch('./data/packs/index.json').then(r=>{if(!r.ok)throw new Error('問題データ一覧を読み込めません');return r.json()}); const groups=await Promise.all(manifest.files.map(f=>fetch('./data/packs/'+f).then(r=>{if(!r.ok)throw new Error(f+' を読み込めません');return r.json()}))); bank={policy:manifest.policy||{},packs:groups.flat()};
  bindGlobal();renderLibrary();renderPractice();renderResults();renderAnalysis();renderSchema();updateTopStats();
}
function bindGlobal(){
  $$('.nav-btn').forEach(b=>b.onclick=()=>openView(b.dataset.view));$$('[data-jump]').forEach(b=>b.onclick=()=>openView(b.dataset.jump));
  $('#menuBtn').onclick=()=>$('#sidebar').classList.toggle('open');
  $('#levelFilter').onchange=e=>{activeLevel=e.target.value;renderPackGrid()};
  $('#quickExportBtn').onclick=downloadAnalysisInput;$('#downloadAnalysisInputBtn').onclick=downloadAnalysisInput;$('#copyAnalysisPromptBtn').onclick=copyAnalysisPrompt;$('#analysisImport').onchange=importAnalysis;
  $('#answerModeBtn').onclick=()=>setMode('answer');$('#penModeBtn').onclick=()=>setMode('pen');
  $$('.color-btn').forEach(b=>b.onclick=()=>{pen.color=b.dataset.color;pen.eraser=false;$$('.color-btn').forEach(x=>x.classList.toggle('active',x===b));$('#eraserBtn').classList.remove('active');setMode('pen')});
  $('#eraserBtn').onclick=()=>{pen.eraser=!pen.eraser;$('#eraserBtn').classList.toggle('active',pen.eraser);setMode('pen')};
  $('#undoInkBtn').onclick=undoInk;$('#clearInkBtn').onclick=clearInk;
  $('#prevPageBtn').onclick=()=>changePage(-1);$('#nextPageBtn').onclick=()=>changePage(1);$('#finishBtn').onclick=finishPack;$('#saveSnapshotBtn').onclick=saveSnapshot;
  addEventListener('resize',()=>requestAnimationFrame(()=>{resizeCanvas();renderInk()}));
  setupCanvas();
}
function openView(name){
  $$('.view').forEach(v=>v.classList.toggle('active',v.id===`view-${name}`));$$('.nav-btn').forEach(b=>b.classList.toggle('active',b.dataset.view===name));
  const meta={library:['WORKSHEETS','問題を選ぶ'],practice:['PRACTICE','問題を解く'],results:['RESULTS','結果'],weakness:['CHATGPT ANALYSIS','弱点・ChatGPT分析']}[name];
  $('#viewEyebrow').textContent=meta[0];$('#viewTitle').textContent=meta[1];
  if(name==='practice'){renderPractice();setTimeout(()=>{resizeCanvas();renderInk()},30)}if(name==='results')renderResults();if(name==='weakness')renderAnalysis();
  if(innerWidth<760)$('#sidebar').classList.remove('open');scrollTo({top:0,behavior:'smooth'});
}

function renderLibrary(){
  $('#packCount').textContent=bank.packs.length;$('#questionCount').textContent=bank.packs.reduce((n,p)=>n+p.questions.length,0);$('#finishedCount').textContent=Object.values(state.packProgress).filter(p=>p.completedAt).length;
  const sources=['all',...new Set(bank.packs.map(p=>p.source))];$('#sourceFilters').innerHTML=sources.map(s=>`<button class="chip ${s===activeSource?'active':''}" data-source="${esc(s)}">${s==='all'?'すべて':esc(s)}</button>`).join('');
  $$('#sourceFilters .chip').forEach(b=>b.onclick=()=>{activeSource=b.dataset.source;renderLibrary()});
  const levels=[...new Set(bank.packs.map(p=>p.level))];$('#levelFilter').innerHTML='<option value="all">難易度すべて</option>'+levels.map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('');$('#levelFilter').value=activeLevel;
  renderPackGrid();
}
function renderPackGrid(){
  const list=bank.packs.filter(p=>(activeSource==='all'||p.source===activeSource)&&(activeLevel==='all'||p.level===activeLevel));
  $('#packGrid').innerHTML=list.map(p=>{const pr=state.packProgress[p.id],pct=completionPercent(p.id),done=!!pr?.completedAt;return `<article class="pack-card"><div class="pack-top"><span class="pack-source">${esc(p.source)}</span><span class="level-badge">${esc(p.level)}</span></div><h3>${esc(p.title)}</h3><p>${esc(p.description)}</p><div class="pack-meta"><span>${p.questions.length}問</span><span>${esc(p.focus)}</span><span>${done?'完了':'進行 '+pct+'%'}</span></div><div class="pack-progress"><span style="width:${pct}%"></span></div><div class="pack-actions"><small>${pr?.lastScore!=null?'前回 '+pr.lastScore+'%':pr?'途中保存あり':'未開始'}</small><button class="primary compact" data-start-pack="${p.id}">${pr&&!done?'続きから':'解く'}</button></div></article>`}).join('');
  $$('[data-start-pack]').forEach(b=>b.onclick=()=>startPack(b.dataset.startPack));
}
function startPack(pid){state.activePackId=pid;const pr=progress(pid);currentPage=pr.currentPage||0;save();openView('practice')}
