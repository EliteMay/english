const PREF_KEY_V050='english-worksheet-prefs-v1';
let prefsV050={compact:false,reduceMotion:false,paperZoom:1,penSize:'normal'},storageCheckTimerV050=null;
function readPrefsV050(){try{const v=JSON.parse(localStorage.getItem(PREF_KEY_V050)||'null');if(v&&typeof v==='object')prefsV050={...prefsV050,...v}}catch{}}
function savePreferenceV050(key,value){prefsV050[key]=value;try{localStorage.setItem(PREF_KEY_V050,JSON.stringify(prefsV050))}catch{}applyPreferencesV050()}
function applyPreferencesV050(){document.documentElement.dataset.density=prefsV050.compact?'compact':'comfortable';document.documentElement.dataset.reduceMotion=prefsV050.reduceMotion?'1':'0';pen.size=['thin','normal','thick'].includes(prefsV050.penSize)?prefsV050.penSize:'normal';$$('.pen-size').forEach(b=>b.classList.toggle('active',b.dataset.penSize===pen.size));setPaperZoomV050(Number(prefsV050.paperZoom)||1,false)}
function setPaperZoomV050(value,persist=false){const v=[.85,1,1.15,1.3].includes(value)?value:1;document.documentElement.style.setProperty('--paper-scale',String(v));if($('#paperZoom'))$('#paperZoom').value=String(v);if(persist){prefsV050.paperZoom=v;try{localStorage.setItem(PREF_KEY_V050,JSON.stringify(prefsV050))}catch{}}setTimeout(()=>{resizeCanvas?.();renderInk?.()},30)}
function togglePaperFocusV050(force){const next=typeof force==='boolean'?force:!document.body.classList.contains('paper-focus');document.body.classList.toggle('paper-focus',next);let hint=$('#focusExitHint');if(next&&!hint){hint=document.createElement('div');hint.id='focusExitHint';hint.className='focus-exit-hint';hint.textContent='Esc または F で集中モード終了';document.body.append(hint)}if(!next)hint?.remove();setTimeout(()=>{resizeCanvas?.();renderInk?.()},40)}
function stateByteSizeV050(){try{return new Blob([JSON.stringify(state)]).size}catch{return 0}}
function setStorageWarningV050(message){const el=$('#storageWarning');if(!el)return;el.textContent=message||'';el.classList.toggle('hidden',!message)}
function scheduleStorageCheckV050(){clearTimeout(storageCheckTimerV050);storageCheckTimerV050=setTimeout(checkStorageV050,700)}
async function checkStorageV050(){const bytes=stateByteSizeV050();let warning='';if(bytes>4.2*1024*1024)warning=`学習データが約 ${(bytes/1024/1024).toFixed(1)}MB あります。保存上限に近いため、提出ZIP/バックアップを書き出してください。`;try{const est=await navigator.storage?.estimate?.();if(est?.quota&&est.usage/est.quota>.85)warning=warning||'このサイトのブラウザ保存領域が85%を超えています。バックアップを推奨します。'}catch{}setStorageWarningV050(warning)}
function shortcutsV050(e){const tag=document.activeElement?.tagName||'',editing=/INPUT|TEXTAREA|SELECT/.test(tag)||document.activeElement?.isContentEditable;if(e.key==='Escape'){if(document.body.classList.contains('paper-focus'))togglePaperFocusV050(false);document.querySelectorAll('dialog[open]').forEach(d=>d.close());return}if(editing)return;if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();e.shiftKey?redoInk():undoInk();return}if(e.ctrlKey||e.metaKey||e.altKey)return;if(e.key==='/'){e.preventDefault();openView('library');setTimeout(()=>$('#packSearch')?.focus(),30)}if(e.key==='?'){e.preventDefault();helpDialogV050?.showModal()}if(e.key.toLowerCase()==='f'&&state.activePackId){e.preventDefault();openView('practice');togglePaperFocusV050()}if(e.key==='['&&state.activePackId){e.preventDefault();changePage(-1)}if(e.key===']'&&state.activePackId){e.preventDefault();changePage(1)}}

// v0.5.1: 未着手(ungraded)を理解度・ミス復習へ混ぜない。
function latestResultMap(){const map=new Map();for(const s of state.sessions||[]){for(const r of s.results||[]){const key=canonicalQuestionId(r);if(!map.has(key)&&['correct','partial','wrong'].includes(r.selfGrade))map.set(key,{...r,session:s})}}return map}
function repairPartialSessionsV051(){
  let changed=false;
  for(const s of state.sessions||[]){
    if(!Array.isArray(s.results)||!s.results.some(r=>r.selfGrade==='ungraded'))continue;
    const scored=s.results.filter(r=>['correct','partial','wrong'].includes(r.selfGrade));
    if(!scored.length)continue;
    const points=scored.reduce((n,r)=>n+(r.selfGrade==='correct'?1:r.selfGrade==='partial'?.5:0),0),manual=s.results.filter(r=>r.selfGrade==='manual'),manualDone=manual.filter(r=>(r.inkStrokeCount||0)>0).length;
    s.score=Math.round(points/scored.length*100);s.autoCorrect=scored.filter(r=>r.selfGrade==='correct').length;s.autoPartial=scored.filter(r=>r.selfGrade==='partial').length;s.autoWrong=scored.filter(r=>r.selfGrade==='wrong').length;s.autoTotal=scored.length;s.ungradedCount=s.results.filter(r=>r.selfGrade==='ungraded').length;s.coverageDone=scored.length+manualDone;s.coverageTotal=s.results.length;s.coveragePercent=Math.round(s.coverageDone/s.coverageTotal*100);s.completedPack=s.ungradedCount===0&&manualDone===manual.length;changed=true;
    const pr=state.packProgress?.[s.packId];if(pr&&!s.completedPack&&pr.completedAt===s.finishedAt)pr.completedAt=null;
  }
  if(changed)save();
}
repairPartialSessionsV051();
