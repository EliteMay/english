import {state,progress,setActivePack,startFreshAttempt,esc,saveState} from './state.js';
import {catalog,getCurrentPack,packMeta} from './data.js';

let source='all',level='all',status='all',query='';
let openPractice=null;

function touchedCount(pid){const p=getCurrentPack(pid),pr=progress(pid);if(!p||!pr)return 0;return p.questions.filter(q=>pr.touchedQuestions?.includes(q.id)||pr.selfGrades?.[q.id]).length}
function completion(pid){const p=getCurrentPack(pid);return p?Math.round(touchedCount(pid)/p.questions.length*100):0}
function packStatus(pid){const pr=progress(pid);if(!pr)return'unstarted';if(pr.completedAt)return'completed';return touchedCount(pid)>0?'active':'unstarted'}
function latestTouched(){return Object.values(state.packProgress).filter(pr=>getCurrentPack(pr.packId)&&touchedCount(pr.packId)>0).sort((a,b)=>Date.parse(b.lastTouchedAt||0)-Date.parse(a.lastTouchedAt||0))[0]?.packId||null}
function recommended(){const ids=[];for(const w of state.analysis?.weaknesses||[])for(const id of w.recommendedPackIds||[])if(getCurrentPack(id)&&!ids.includes(id))ids.push(id);return ids}

export function initLibrary({onOpenPractice}){openPractice=onOpenPractice;document.querySelector('#packSearch')?.addEventListener('input',e=>{query=e.target.value.trim().toLowerCase();renderLibrary()});document.querySelector('#levelFilter')?.addEventListener('change',e=>{level=e.target.value;renderLibrary()});document.querySelector('#statusFilter')?.addEventListener('change',e=>{status=e.target.value;renderLibrary()})}

export function renderLibrary(){
  const packs=catalog.packs;
  const $=s=>document.querySelector(s);
  $('#packCount').textContent=packs.length;$('#questionCount').textContent=packs.reduce((n,p)=>n+p.questions.length,0);$('#finishedCount').textContent=packs.filter(p=>progress(p.id)?.completedAt).length;
  const sources=['all',...new Set(packs.map(p=>p.source))];$('#sourceFilters').innerHTML=sources.map(x=>`<button class="chip ${x===source?'active':''}" data-source="${esc(x)}">${x==='all'?'すべて':esc(x)}</button>`).join('');document.querySelectorAll('[data-source]').forEach(b=>b.onclick=()=>{source=b.dataset.source;renderLibrary()});
  const levels=[...new Set(packs.map(p=>p.level))];$('#levelFilter').innerHTML='<option value="all">難易度すべて</option>'+levels.map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('');$('#levelFilter').value=level;$('#statusFilter').value=status;
  renderQuick();renderPhases();renderGrid();
}

function renderQuick(){
  const cont=latestTouched(),rec=recommended().find(id=>packStatus(id)!=='completed')||catalog.packs.find(p=>packStatus(p.id)!=='completed')?.id;
  const cp=getCurrentPack(cont),rp=getCurrentPack(rec);const host=document.querySelector('#libraryQuick');
  host.innerHTML=`<article class="quick-card primary-quick"><span>CONTINUE</span><h3>${cp?esc(cp.title):'最初の問題から始める'}</h3><p>${cp?'前回の紙面Revisionから続けます。':'骨格から順に始めます。'}</p><button class="primary" data-quick="${cp?.id||catalog.packs[0]?.id||''}">${cp?'続きから':'始める'}</button></article><article class="quick-card"><span>NEXT</span><h3>${rp?esc(rp.title):'分析待ち'}</h3><p>${state.analysis?'ChatGPT分析の推奨を優先しています。':'学習順の次候補です。'}</p>${rp?`<button class="secondary" data-quick="${rp.id}">開く</button>`:''}</article><article class="quick-card"><span>DATA</span><h3>紙面Revision固定</h3><p>一度始めた問題は、その時の問題用紙を保存して後から教材が変わっても形を変えません。</p></article>`;
  host.querySelectorAll('[data-quick]').forEach(b=>b.onclick=()=>startPack(b.dataset.quick));
}

function renderPhases(){const host=document.querySelector('#curriculumGuide');host.innerHTML=(catalog.curriculum.phases||[]).map((p,i)=>`<div class="phase-chip"><strong>${i+1}</strong>${esc(p.title)}</div>`).join('')}
function renderGrid(){
  const recs=new Set(recommended());let list=catalog.packs.filter(p=>(source==='all'||p.source===source)&&(level==='all'||p.level===level)&&(status==='all'||packStatus(p.id)===status));
  if(query)list=list.filter(p=>[p.title,p.description,p.focus,p.source,...(packMeta(p.id).tags||[])].join(' ').toLowerCase().includes(query));list.sort((a,b)=>packMeta(a.id).order-packMeta(b.id).order);
  const host=document.querySelector('#packGrid');host.innerHTML=list.map(p=>{const pr=progress(p.id),pct=completion(p.id),meta=packMeta(p.id);return `<article class="pack-card ${recs.has(p.id)?'recommended':''}"><div class="pack-top"><span>${esc(p.source)}</span><span>${esc(p.level)}</span></div><h3>${esc(p.title)}</h3><p>${esc(p.description)}</p><div class="pack-meta"><span>${p.questions.length}問</span>${meta.minutes?`<span>約${meta.minutes}分</span>`:''}${pr?.paperRevision?`<span>${esc(pr.paperRevision)}</span>`:''}</div><div class="progress-line"><i style="width:${pct}%"></i></div><div class="pack-actions"><button class="primary" data-start-pack="${p.id}">${pr&&touchedCount(p.id)?'続き':'始める'}</button>${pr?`<button class="ghost" data-new-pack="${p.id}">新しい紙</button>`:''}</div></article>`}).join('')||'<div class="empty-card">条件に合う問題がありません。</div>';
  host.querySelectorAll('[data-start-pack]').forEach(b=>b.onclick=()=>startPack(b.dataset.startPack));host.querySelectorAll('[data-new-pack]').forEach(b=>b.onclick=()=>newPaper(b.dataset.newPack));
}

async function startPack(pid){const pack=getCurrentPack(pid);if(!pack)return;let pr=progress(pid);if(!pr)pr=await startFreshAttempt(pack);setActivePack(pid);openPractice?.(pid)}
async function newPaper(pid){const pack=getCurrentPack(pid);if(!pack)return;if(!confirm('現在の紙面をアーカイブして、新しい問題用紙を始めますか？'))return;await startFreshAttempt(pack);saveState(true);renderLibrary();openPractice?.(pid)}

export function libraryStats(){return{touchedCount,completion,packStatus,recommended}}
