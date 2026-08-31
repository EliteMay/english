import {APP,state,prefs,saveState,setSaveListener,setExternalChangeListener,updatePrefs,initializeMigration,setActivePack,startFreshAttempt,createRecovery,restoreRecovery,wipeAll,esc,stateForExport} from './state.js';
import {loadCatalog,catalog,getCurrentPack,getLegacyPack} from './data.js';
import {initLibrary,renderLibrary} from './library.js';
import {initPractice,renderPractice,flushPracticeTimer} from './practice.js';
import {initReviewLayout} from './review-layout.js';
import {initResults,renderResults,mistakeQuestions} from './results.js';
import {pen,setPenTool,setPenColor,setPenSize,undoInk,redoInk,clearPageInk,resizeInk} from './ink.js';
import {downloadSubmission,analysisPrompt} from './export.js';
import {renderAnalysis,importAnalysis} from './analysis.js';
import {validateBackup} from './validation.js';
import {dbGetAll,dbPut,dbClear,estimateDb} from './db.js';
import {installDiagnostics,diagnosticEvent,diagnosticBreadcrumb,diagnosticError,setDiagnosticRoute,downloadDiagnosticSnapshot,clearDiagnostics,diagnosticSummary} from './diagnostics.js';

const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const stores=['ink','legacyInk','paperSnapshots','archives'];
let currentView='library';

installDiagnostics();

async function main(){
  diagnosticEvent('init.start');
  setSaveListener((ok,err)=>{const el=$('#saveState');el.dataset.status=ok?'ok':'error';el.textContent=ok?`保存済み ${new Date().toLocaleTimeString('ja-JP',{hour:'2-digit',minute:'2-digit'})}`:'保存失敗 — バックアップを確認';if(!ok)diagnosticError('storage.localStorage.write',err||new Error('state save failed'),{store:'state'})});
  setExternalChangeListener(()=>{const el=$('#saveState');el.dataset.status='warning';el.textContent='別タブで更新あり — 再読み込み推奨';diagnosticEvent('storage.external-change',{},'warning');toast('別タブで学習データが更新されました。上書き防止のため、このタブを再読み込みしてください。',6000)});
  diagnosticEvent('init.catalog.start');await loadCatalog();diagnosticEvent('init.catalog.success',{packs:catalog.packs.length});
  await initializeMigration({getCurrentPack,getLegacyPack});diagnosticEvent('init.migration.success');
  applyPrefs();bindShell();await initPractice({onOpenResults:()=>openView('results'),onRenderLibrary:renderLibrary});initReviewLayout();initLibrary({onOpenPractice:()=>openView('practice')});initResults({onPractice:()=>openView('practice')});renderLibrary();await renderPractice();renderResults();renderAnalysis();renderSchema();updateHeader();setDiagnosticRoute(currentView);saveState(true);diagnosticEvent('init.ready',{packs:catalog.packs.length});
}

function setPressed(el,on){el?.setAttribute('aria-pressed',String(!!on));el?.classList.toggle('active',!!on)}
function bindShell(){
  $$('.nav-btn').forEach(b=>b.onclick=()=>openView(b.dataset.view));$('#menuBtn').onclick=()=>{const open=$('#sidebar').classList.toggle('open');$('#menuBtn').setAttribute('aria-expanded',String(open));diagnosticBreadcrumb('menu.toggle',{open})};
  $$('.color-btn').forEach(b=>{setPressed(b,b.classList.contains('active'));b.onclick=()=>{setPenColor(b.dataset.color);$$('.color-btn').forEach(x=>setPressed(x,x===b));setPressed($('#eraserBtn'),false);setPressed($('#markerBtn'),false)}});
  setPressed($('#markerBtn'),pen.tool==='marker');setPressed($('#eraserBtn'),pen.tool==='eraser');
  $('#markerBtn').onclick=()=>{setPenTool('marker');setPressed($('#markerBtn'),pen.tool==='marker');setPressed($('#eraserBtn'),false)};$('#eraserBtn').onclick=()=>{setPenTool(pen.tool==='eraser'?'pen':'eraser');setPressed($('#eraserBtn'),pen.tool==='eraser');setPressed($('#markerBtn'),false)};
  $$('.pen-size').forEach(b=>{setPressed(b,b.dataset.penSize===pen.size);b.onclick=()=>{setPenSize(b.dataset.penSize);$$('.pen-size').forEach(x=>setPressed(x,x===b))}});$('#undoInkBtn').onclick=async()=>{if(!await undoInk())toast('戻せる新しい線がありません')};$('#redoInkBtn').onclick=async()=>{if(!await redoInk())toast('やり直せる線がありません')};$('#clearInkBtn').onclick=async()=>{if(confirm('このページでv0.6以降に書いた線を消しますか？')){diagnosticBreadcrumb('ink.clear-page',{packId:state.activePackId});await clearPageInk()}};
  $('#paperZoom').value=String(prefs.paperZoom);$('#paperZoom').onchange=e=>{updatePrefs({paperZoom:Number(e.target.value)});applyPrefs();resizeInk()};$('#focusPaperBtn').onclick=toggleFocus;$('#focusPaperTopBtn').onclick=toggleFocus;syncFocusPressed();
  $('#quickExportBtn').onclick=()=>{diagnosticBreadcrumb('submission.export',{scope:$('#exportScope').value});downloadSubmission($('#exportScope').value)};$('#downloadSubmissionZipBtn').onclick=()=>{diagnosticBreadcrumb('submission.export',{scope:$('#exportScope').value});downloadSubmission($('#exportScope').value)};$('#exportScope').value=prefs.exportScope;$('#exportScope').onchange=e=>updatePrefs({exportScope:e.target.value});$('#copyAnalysisPromptBtn').onclick=async()=>{await navigator.clipboard.writeText(analysisPrompt());toast('依頼文をコピーしました')};$('#analysisImport').onchange=async e=>{const res=await importAnalysis(e.target.files?.[0]);diagnosticEvent(res.ok?'analysis.import.success':'analysis.import.failure',{ok:res.ok},res.ok?'info':'warning');toast(res.message,res.ok?2200:5000);e.target.value=''};
  $('#helpBtn').onclick=()=>$('#helpDialog').showModal();$('#settingsBtn').onclick=()=>$('#settingsDialog').showModal();$('#dataBtn').onclick=()=>openDataDialog();$$('[data-close-dialog]').forEach(b=>b.onclick=()=>b.closest('dialog').close());$('#reduceMotion').checked=prefs.reduceMotion;$('#reduceMotion').onchange=e=>{updatePrefs({reduceMotion:e.target.checked});applyPrefs()};$('#density').value=prefs.density;$('#density').onchange=e=>{updatePrefs({density:e.target.value});applyPrefs()};
  $('#backupBtn').onclick=downloadBackup;$('#restoreBackupInput').onchange=importBackup;$('#recoveryBtn').onclick=()=>{const ok=createRecovery('manual');diagnosticEvent(ok?'recovery.create.success':'recovery.create.failure',{},ok?'info':'warning');toast(ok?'復元スナップショットを作りました':'作成できませんでした')};$('#restoreRecoveryBtn').onclick=()=>{if(confirm('復元スナップショットへ戻しますか？')&&restoreRecovery()){diagnosticBreadcrumb('recovery.restore');location.reload()}};$('#resetAllBtn').onclick=async()=>{if(prompt('全データ削除。実行するには DELETE と入力')!=='DELETE')return;diagnosticEvent('data.reset.confirmed',{},'warning');createRecovery('before-delete');await wipeAll();for(const s of stores)await dbClear(s);location.reload()};$('#diagnoseBtn').onclick=runDiagnostics;$('#downloadDiagnosticsBtn').onclick=downloadDiagnostics;$('#clearDiagnosticsBtn').onclick=()=>{if(confirm('開発診断ログだけを消しますか？ 学習データは消えません。')){clearDiagnostics();refreshDiagnosticsSummary();toast('開発診断ログを消しました')}};
  $('#startMistakeReviewBtn').onclick=startMistakeReview;addEventListener('resize',resizeInk);document.addEventListener('keydown',e=>{if(e.key==='/'&&document.activeElement?.tagName!=='INPUT'){e.preventDefault();openView('library');$('#packSearch').focus()}if(e.key==='Escape'&&document.body.classList.contains('paper-focus'))toggleFocus()});
}

async function openView(view){if(currentView==='practice'&&view!=='practice')flushPracticeTimer();currentView=view;setDiagnosticRoute(view);$$('.view').forEach(v=>v.classList.toggle('active',v.id===`view-${view}`));$$('.nav-btn').forEach(b=>{const active=b.dataset.view===view;b.classList.toggle('active',active);b.setAttribute('aria-current',active?'page':'false')});const meta={library:['WORKSHEETS','問題を選ぶ'],practice:['PRACTICE','問題を解く'],results:['RESULT','結果・復習'],weakness:['CHATGPT','弱点・ChatGPT分析']}[view];$('#viewEyebrow').textContent=meta[0];$('#viewTitle').textContent=meta[1];if(view==='practice')await renderPractice();if(view==='results')renderResults();if(view==='weakness')renderAnalysis();if(innerWidth<760){$('#sidebar').classList.remove('open');$('#menuBtn').setAttribute('aria-expanded','false')}updateHeader();scrollTo({top:0,behavior:prefs.reduceMotion?'auto':'smooth'})}
function updateHeader(){const total=Object.values(state.packProgress).reduce((n,p)=>n+(p.touchedQuestions?.length||0),0);$('#answeredTotal').textContent=total;$('#appVersion').textContent=APP.version}
function applyPrefs(){document.documentElement.style.setProperty('--paper-scale',prefs.paperZoom);document.documentElement.dataset.reduceMotion=prefs.reduceMotion?'1':'0';document.documentElement.dataset.density=prefs.density}
function syncFocusPressed(){const on=document.body.classList.contains('paper-focus');setPressed($('#focusPaperBtn'),on);setPressed($('#focusPaperTopBtn'),on)}
function toggleFocus(){document.body.classList.toggle('paper-focus');syncFocusPressed();resizeInk();diagnosticBreadcrumb('focus.toggle',{enabled:document.body.classList.contains('paper-focus')})}
function toast(msg,duration=2200){const el=$('#toast');el.textContent=msg;el.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.remove('show'),duration)}
function renderSchema(){$('#analysisSchema').textContent=JSON.stringify({weaknessAnalysisVersion:2,generatedAt:'ISO8601',summary:'全体所見',weaknesses:[{id:'w1',title:'弱点',severity:'high',confidence:.9,cause:'原因',evidence:['papers/...'],recommendedPackIds:['pack-id']}],strengths:[],nextTargets:[],skillProfile:[],readingHabits:[],siteRecommendations:[]},null,2)}

async function runDiagnostics(){const host=$('#diagnosticBody'),expected=catalog.manifest.expectedCounts||{},packs=catalog.packs,questions=packs.flatMap(p=>p.questions),ids=questions.map(q=>q.id),estimate=await estimateDb(),checks=[['問題セット',!expected.packs||packs.length===expected.packs,`${packs.length}${expected.packs?` / ${expected.packs}`:''}`],['問題数',!expected.questions||questions.length===expected.questions,`${questions.length}${expected.questions?` / ${expected.questions}`:''}`],['問題ID重複',new Set(ids).size===ids.length,'重複なし'],['paper schema',APP.paperSchema===catalog.manifest.paperSchemaVersion,`v${APP.paperSchema}`],['IndexedDB',!!window.indexedDB,'利用可能'],['保存容量',true,`${((estimate.usage||0)/1024/1024).toFixed(2)}MB / ${((estimate.quota||0)/1024/1024).toFixed(0)}MB`],['旧Version Runtime',!document.querySelector('script[src*="/v0"],link[href*="app-v0"]'),'実行時に未読込']];host.innerHTML=checks.map(([label,ok,detail])=>`<div class="diagnostic-row ${ok?'ok':'bad'}"><b>${ok?'✓':'!'}</b><div><strong>${label}</strong><span>${detail}</span></div></div>`).join('');diagnosticBreadcrumb('data.integrity-check',{failed:checks.filter(x=>!x[1]).length});refreshDiagnosticsSummary()}
async function refreshDiagnosticsSummary(){const el=$('#runtimeDiagnosticsSummary');if(!el)return;const s=diagnosticSummary();el.textContent=`開発診断: ${s.events}件 / エラー ${s.errors}件${s.lastAt?` / 最終 ${new Date(s.lastAt).toLocaleTimeString('ja-JP',{hour:'2-digit',minute:'2-digit'})}`:''}`}
async function openDataDialog(){$('#dataDialog').showModal();const e=await estimateDb();$('#dataStats').innerHTML=`<div><span>問題セット</span><strong>${catalog.packs.length}</strong></div><div><span>結果履歴</span><strong>${state.sessions.length}</strong></div><div><span>IndexedDB使用</span><strong>${((e.usage||0)/1024/1024).toFixed(2)}MB</strong></div>`;await refreshDiagnosticsSummary();diagnosticBreadcrumb('data-dialog.open')}
async function downloadDiagnostics(){const e=await estimateDb(),summary={packs:catalog.packs.length,sessions:state.sessions.length,activePack:state.activePackId?1:0};const snapshot=downloadDiagnosticSnapshot({usage:e.usage,quota:e.quota,summary});toast(`診断JSONを保存しました（${snapshot.handoff.payloadBytes} bytes）`);refreshDiagnosticsSummary()}

async function downloadBackup(){const backupStores={};for(const s of stores)backupStores[s]=await dbGetAll(s);const obj={schema:'english-worksheet-backup-v2',createdAt:new Date().toISOString(),app:APP,state:stateForExport(),prefs,stores:backupStores},blob=new Blob([JSON.stringify(obj)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`english_backup_${new Date().toISOString().slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);diagnosticBreadcrumb('backup.export',{stores:stores.length})}
async function restoreStoreSnapshot(snapshot){for(const s of stores){await dbClear(s);for(const row of snapshot[s]||[])await dbPut(s,row)}}
async function importBackup(e){
  const f=e.target.files?.[0];if(!f)return;
  let previousStores=null;
  try{
    const parsed=JSON.parse(await f.text()),checked=validateBackup(parsed);
    if(!checked.ok)throw new Error(checked.error);
    diagnosticEvent('backup.import.validated',{stores:stores.length});
    if(!confirm('検証済みバックアップで現在のデータを置き換えますか？'))return;
    previousStores={};for(const s of stores)previousStores[s]=await dbGetAll(s);
    createRecovery('before-import');
    await restoreStoreSnapshot(checked.value.stores);
    localStorage.setItem('english-worksheet-lab-v6',JSON.stringify(checked.value.state));
    localStorage.setItem('english-worksheet-prefs-v2',JSON.stringify(checked.value.prefs));
    diagnosticEvent('backup.import.success',{stores:stores.length});
    location.reload();
  }catch(err){
    console.error(err);diagnosticError('backup.import',err,{rollbackAvailable:!!previousStores});
    if(previousStores){try{await restoreStoreSnapshot(previousStores);restoreRecovery();diagnosticEvent('backup.rollback.success')}catch(rollbackErr){console.error('rollback failed',rollbackErr);diagnosticError('backup.rollback',rollbackErr)}}
    toast(`バックアップを読み込めません: ${err.message||'形式エラー'}`,6000);
  }finally{e.target.value=''}
}

async function startMistakeReview(){const miss=mistakeQuestions();if(!miss.length)return toast('現在の△・×はありません');const pack={id:`mistake-review-${Date.now()}`,title:'ミス復習｜△・×だけ',source:'自動復習',level:'弱点復習',focus:'直近の不安定な判断',description:'最新結果で△・×になった問題だけを集めた一時問題用紙。',questions:miss.slice(0,30).map((x,i)=>({...structuredClone(x.q),id:`mr${i}-${x.q.id}`,originQuestionId:x.q.id,originPackId:x.pack.id,note:[x.q.note,x.prior.reviewNote?`前回: ${x.prior.reviewNote}`:''].filter(Boolean).join(' ｜ ')}))};catalog.packs.unshift(pack);catalog.packMap.set(pack.id,pack);diagnosticBreadcrumb('mistake-review.start',{questions:pack.questions.length});await startFreshAttempt(pack);setActivePack(pack.id);await openView('practice')}

main().catch(err=>{console.error(err);diagnosticError('initialization',err);document.body.innerHTML=`<div class="fatal"><h1>読み込みに失敗しました</h1><pre>${esc(err.stack||err.message)}</pre></div>`});
