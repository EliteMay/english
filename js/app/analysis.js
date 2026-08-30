import {state,saveState,esc} from './state.js';
import {catalog} from './data.js';
import {validateAnalysis} from './validation.js';

export function renderAnalysis(){const empty=document.querySelector('#analysisEmpty'),dash=document.querySelector('#analysisDashboard'),a=state.analysis;if(!a){empty.classList.remove('hidden');dash.classList.add('hidden');return}empty.classList.add('hidden');dash.classList.remove('hidden');document.querySelector('#analysisSummary').textContent=a.summary||'';document.querySelector('#analysisDate').textContent=a.generatedAt?new Date(a.generatedAt).toLocaleString('ja-JP'):'';document.querySelector('#nextTargets').innerHTML=(a.nextTargets||[]).map(x=>`<div class="target-item">${esc(x)}</div>`).join('');document.querySelector('#analysisSkillProfile').innerHTML=(a.skillProfile||[]).map(x=>`<article class="analysis-skill"><div><strong>${esc(x.label||x.skill)}</strong><span>${esc(x.note||'')}</span></div><b>${Math.round(x.score||0)}%</b><i><span style="width:${Math.max(0,Math.min(100,x.score||0))}%"></span></i></article>`).join('');document.querySelector('#weaknessGrid').innerHTML=(a.weaknesses||[]).map(w=>`<article class="weakness-card"><span class="severity ${esc(w.severity||'medium')}">${esc(w.severity||'')}</span><h3>${esc(w.title)}</h3><p>${esc(w.cause||'')}</p>${(w.evidence||[]).length?`<details><summary>根拠</summary><ul>${w.evidence.map(e=>`<li>${esc(e)}</li>`).join('')}</ul></details>`:''}${(w.recommendedPackIds||[]).length?`<div class="recommend-packs">${w.recommendedPackIds.map(id=>catalog.packMap.has(id)?`<span>${esc(catalog.packMap.get(id).title)}</span>`:'').join('')}</div>`:''}</article>`).join('');document.querySelector('#readingHabits').innerHTML=(a.readingHabits||[]).map(h=>`<article><strong>${esc(h.title)}</strong><p>${esc(h.impact||'')}</p></article>`).join('');document.querySelector('#strengthGrid').innerHTML=(a.strengths||[]).map(s=>`<article><strong>${esc(s.title)}</strong><p>${esc(s.note||'')}</p></article>`).join('');document.querySelector('#analysisHistoryCount').textContent=`${state.analysisHistory.length}件`;document.querySelector('#analysisHistory').innerHTML=state.analysisHistory.map((x,i)=>`<button data-history="${i}"><strong>${esc(x.summary?.slice(0,70)||'分析')}</strong><span>${x.generatedAt?new Date(x.generatedAt).toLocaleString('ja-JP'):''}</span></button>`).join('');document.querySelectorAll('[data-history]').forEach(b=>b.onclick=()=>{state.analysis=state.analysisHistory[Number(b.dataset.history)];saveState(true);renderAnalysis()})}

export async function importAnalysis(file){
  if(!file)return {ok:false,message:'分析JSONが選択されていません'};
  try{
    const parsed=JSON.parse(await file.text()),checked=validateAnalysis(parsed);
    if(!checked.ok)return {ok:false,message:checked.error};
    const x=checked.value;
    state.analysis=x;
    state.analysisHistory=[x,...state.analysisHistory.filter(a=>a.generatedAt!==x.generatedAt)].slice(0,20);
    saveState(true);renderAnalysis();
    return {ok:true,message:'分析JSONを読み込みました'};
  }catch(err){
    console.error(err);
    return {ok:false,message:'JSONとして読み込めませんでした'};
  }
}
