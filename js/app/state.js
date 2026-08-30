import {setLegacyPageInk,putPaperSnapshot,putArchive,clearAttemptInk} from './db.js';
import {APP} from './meta.js';

export {APP};
const STATE_KEY='english-worksheet-lab-v6';
const OLD_KEYS=['english-worksheet-lab-v4','english-worksheet-lab-v3','english-worksheet-lab-v2'];
const PREF_KEY='english-worksheet-prefs-v2';
const RECOVERY_KEY='english-worksheet-recovery-v2';

const now=()=>new Date().toISOString();
export const uid=()=>crypto.randomUUID?.()||`${Date.now()}-${Math.random().toString(16).slice(2)}`;
export const esc=(v='')=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]));
export const clone=v=>structuredClone(v);

function blankState(){return {version:6,createdAt:now(),updatedAt:now(),activePackId:null,packProgress:{},sessions:[],analysis:null,analysisHistory:[],migration:{from:null,completedAt:null}}}
function safeParse(raw){try{return raw?JSON.parse(raw):null}catch{return null}}

export let state=loadInitialState();
export let prefs=loadPrefs();
let saveTimer=0;
let onSave=null;
let onExternalChange=null;

function loadPrefs(){
  const p=safeParse(localStorage.getItem(PREF_KEY))||{};
  return {paperZoom:Number(p.paperZoom)||1,density:p.density||'comfortable',reduceMotion:!!p.reduceMotion,penSize:p.penSize||'normal',exportScope:p.exportScope||'current'};
}

function normalizeState(input){
  const s=input&&typeof input==='object'?{...blankState(),...input}:blankState();
  s.version=6;s.packProgress=s.packProgress&&typeof s.packProgress==='object'?s.packProgress:{};
  s.sessions=Array.isArray(s.sessions)?s.sessions:[];s.analysisHistory=Array.isArray(s.analysisHistory)?s.analysisHistory:[];
  for(const [pid,pr] of Object.entries(s.packProgress))s.packProgress[pid]=normalizeProgress(pr,pid);
  return s;
}

function normalizeProgress(pr={},packId=''){
  return {
    attemptId:pr.attemptId||uid(),packId,startedAt:pr.startedAt||now(),lastTouchedAt:pr.lastTouchedAt||now(),currentPage:Number(pr.currentPage)||0,
    paperSnapshotId:pr.paperSnapshotId||null,paperRevision:pr.paperRevision||null,legacyLayout:!!pr.legacyLayout,
    selfGrades:pr.selfGrades&&typeof pr.selfGrades==='object'?pr.selfGrades:{},reviewTags:pr.reviewTags&&typeof pr.reviewTags==='object'?pr.reviewTags:{},reviewNotes:pr.reviewNotes&&typeof pr.reviewNotes==='object'?pr.reviewNotes:{},
    reviewMode:!!pr.reviewMode,pageTimeMs:pr.pageTimeMs&&typeof pr.pageTimeMs==='object'?pr.pageTimeMs:{},completedAt:pr.completedAt||null,lastScore:Number.isFinite(pr.lastScore)?pr.lastScore:null,
    touchedQuestions:Array.isArray(pr.touchedQuestions)?pr.touchedQuestions:[],snapshots:Array.isArray(pr.snapshots)?pr.snapshots:[],inkMigrated:!!pr.inkMigrated,
    legacySourceVersion:pr.legacySourceVersion||null
  };
}

function loadInitialState(){
  const cur=safeParse(localStorage.getItem(STATE_KEY));if(cur)return normalizeState(cur);
  for(const key of OLD_KEYS){const old=safeParse(localStorage.getItem(key));if(old)return migrateStateObject(old,key)}
  return blankState();
}

function migrateStateObject(old,key){
  const s=blankState();s.createdAt=old.createdAt||s.createdAt;s.activePackId=old.activePackId||null;s.sessions=Array.isArray(old.sessions)?old.sessions:[];s.analysis=old.analysis||null;s.analysisHistory=Array.isArray(old.analysisHistory)?old.analysisHistory:[];s.migration={from:key,completedAt:null};
  for(const [pid,pr] of Object.entries(old.packProgress||{})){
    const np=normalizeProgress(pr,pid);np._legacyInkPages=pr.inkPages||{};np._legacySnapshots=pr.snapshots||[];np.legacySourceVersion=key;np.inkMigrated=false;s.packProgress[pid]=np;
  }
  return s;
}

export function setSaveListener(fn){onSave=fn}
export function setExternalChangeListener(fn){onExternalChange=fn}
export function saveState(immediate=false){
  state.updatedAt=now();
  clearTimeout(saveTimer);
  const run=()=>{try{localStorage.setItem(STATE_KEY,JSON.stringify(state));onSave?.(true)}catch(err){console.error(err);onSave?.(false,err)}};
  if(immediate)run();else saveTimer=setTimeout(run,120);
}
export function savePrefs(){try{localStorage.setItem(PREF_KEY,JSON.stringify(prefs));return true}catch(err){console.error(err);onSave?.(false,err);return false}}
export function updatePrefs(patch){prefs={...prefs,...patch};savePrefs()}

globalThis.addEventListener?.('storage',event=>{
  if(event.key!==STATE_KEY||!event.newValue)return;
  const incoming=safeParse(event.newValue);
  if(!incoming?.updatedAt)return;
  const incomingTime=Date.parse(incoming.updatedAt),currentTime=Date.parse(state.updatedAt||0);
  if(Number.isFinite(incomingTime)&&incomingTime>currentTime)onExternalChange?.(incoming);
});

export function progress(packId=state.activePackId){return packId?state.packProgress[packId]||null:null}
export function ensureProgress(packId){
  if(!state.packProgress[packId])state.packProgress[packId]=normalizeProgress({},packId);
  return state.packProgress[packId];
}
export function markTouched(packId,qid){const pr=ensureProgress(packId);if(!pr.touchedQuestions.includes(qid))pr.touchedQuestions.push(qid);pr.lastTouchedAt=now();saveState()}
export function setActivePack(pid){state.activePackId=pid;saveState()}

export async function initializeMigration({getCurrentPack,getLegacyPack}){
  let changed=false;
  for(const [pid,pr] of Object.entries(state.packProgress)){
    if(!pr.paperSnapshotId){
      let pack=null,legacy=false;
      if((pr._legacyInkPages&&Object.keys(pr._legacyInkPages).length)||pr.legacySourceVersion){pack=await getLegacyPack(pid);legacy=!!pack}
      if(!pack)pack=getCurrentPack(pid);
      if(pack){
        const snapshotId=`paper:${pr.attemptId}`;
        await putPaperSnapshot({id:snapshotId,attemptId:pr.attemptId,packId:pid,revision:legacy?'legacy-v051':`paper-${APP.paperSchema}`,createdAt:pr.startedAt||now(),pack:clone(pack)});
        pr.paperSnapshotId=snapshotId;pr.paperRevision=legacy?'legacy-v051':`paper-${APP.paperSchema}`;pr.legacyLayout=legacy;changed=true;
      }
    }
    if(!pr.inkMigrated&&pr._legacyInkPages){
      const linked=new Set(pr.touchedQuestions||[]);
      for(const [page,strokes] of Object.entries(pr._legacyInkPages)){
        for(const stroke of strokes||[])if(stroke?.questionId)linked.add(stroke.questionId);
        await setLegacyPageInk(pr.attemptId,Number(page),strokes||[]);
      }
      pr.touchedQuestions=[...linked];
      delete pr._legacyInkPages;delete pr._legacySnapshots;pr.inkMigrated=true;changed=true;
    }
  }
  if(state.migration.from&&!state.migration.completedAt){state.migration.completedAt=now();changed=true}
  if(changed)saveState(true);
}

export async function startFreshAttempt(pack){
  const old=state.packProgress[pack.id];
  if(old){
    await putArchive({id:`archive:${old.attemptId}:${Date.now()}`,attemptId:old.attemptId,packId:pack.id,archivedAt:now(),progress:clone(old)});
  }
  const pr=normalizeProgress({},pack.id);pr.paperRevision=`paper-${APP.paperSchema}`;pr.paperSnapshotId=`paper:${pr.attemptId}`;
  await putPaperSnapshot({id:pr.paperSnapshotId,attemptId:pr.attemptId,packId:pack.id,revision:pr.paperRevision,createdAt:now(),pack:clone(pack)});
  state.packProgress[pack.id]=pr;state.activePackId=pack.id;saveState(true);return pr;
}

export async function resetAttempt(pack){
  const old=progress(pack.id);if(old){await putArchive({id:`archive:${old.attemptId}:${Date.now()}`,attemptId:old.attemptId,packId:pack.id,archivedAt:now(),progress:clone(old)});}
  return startFreshAttempt(pack);
}

export function createRecovery(reason='manual'){
  try{localStorage.setItem(RECOVERY_KEY,JSON.stringify({schema:'english-worksheet-recovery-v2',createdAt:now(),reason,state:clone(state),prefs:clone(prefs)}));return true}catch{return false}
}
export function restoreRecovery(){const x=safeParse(localStorage.getItem(RECOVERY_KEY));if(!x?.state)return false;state=normalizeState(x.state);prefs={...prefs,...(x.prefs||{})};saveState(true);savePrefs();return true}

export async function wipeAll(){
  for(const pr of Object.values(state.packProgress))await clearAttemptInk(pr.attemptId);
  state=blankState();saveState(true);
}

export function stateForExport(){return clone(state)}
