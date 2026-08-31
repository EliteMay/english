import {APP,PROJECT} from './meta.js';

const STORAGE_KEY='english-worksheet-diagnostics-v1';
const MAX_EVENTS=120;
const MAX_TEXT=600;
const sessionId=globalThis.crypto?.randomUUID?.()||`session-${Date.now()}-${Math.random().toString(16).slice(2)}`;
let route='boot';
let installed=false;
let memoryEvents=[];

const now=()=>new Date().toISOString();
const store=()=>{try{return globalThis.localStorage||null}catch{return null}};

export function sanitizeDiagnosticText(value,max=MAX_TEXT){
  let text=String(value??'');
  text=text.replace(/https?:\/\/[^\s]+/gi,raw=>{try{const u=new URL(raw);return `${u.origin}${u.pathname}`}catch{return '[url]'}});
  text=text.replace(/\b(?:Bearer\s+)?(?:sk-[A-Za-z0-9_-]{12,}|AIza[0-9A-Za-z_-]{16,}|eyJ[A-Za-z0-9._-]{12,})\b/g,'[redacted]');
  text=text.replace(/((?:token|password|secret|authorization|cookie|api[_-]?key)\s*[:=]\s*)[^\s,;]+/gi,'$1[redacted]');
  return text.length>max?`${text.slice(0,max)}…`:text;
}

export function sanitizeDiagnosticValue(value,depth=0,key=''){
  if(/token|password|secret|authorization|cookie|api[_-]?key/i.test(key))return'[redacted]';
  if(value==null||typeof value==='boolean'||typeof value==='number')return value;
  if(typeof value==='string')return sanitizeDiagnosticText(value);
  if(depth>=3)return'[summary omitted]';
  if(Array.isArray(value))return value.slice(0,20).map(v=>sanitizeDiagnosticValue(v,depth+1));
  if(typeof value==='object'){
    const out={};
    for(const [k,v] of Object.entries(value).slice(0,24))out[k]=sanitizeDiagnosticValue(v,depth+1,k);
    return out;
  }
  return sanitizeDiagnosticText(value);
}

function readEvents(){
  const s=store();
  if(!s)return memoryEvents;
  try{const parsed=JSON.parse(s.getItem(STORAGE_KEY)||'[]');return Array.isArray(parsed)?parsed:[]}catch{return[]}
}

function writeEvents(events){
  memoryEvents=events.slice(-MAX_EVENTS);
  const s=store();
  if(!s)return false;
  try{s.setItem(STORAGE_KEY,JSON.stringify(memoryEvents));return true}catch{return false}
}

export function diagnosticEvent(type,detail={},level='info'){
  const events=readEvents();
  events.push({at:now(),sessionId,type:sanitizeDiagnosticText(type,80),level,route:sanitizeDiagnosticText(route,80),detail:sanitizeDiagnosticValue(detail)});
  writeEvents(events);
}

export function diagnosticBreadcrumb(action,detail={}){diagnosticEvent(`breadcrumb.${action}`,detail,'info')}

export function diagnosticError(kind,error,context={}){
  const e=error instanceof Error?error:new Error(String(error??'Unknown error'));
  diagnosticEvent(`error.${kind}`,{
    name:e.name||'Error',
    message:sanitizeDiagnosticText(e.message||'Unknown error'),
    stack:sanitizeDiagnosticText(e.stack||'',1200),
    context
  },'error');
}

export function setDiagnosticRoute(next){
  if(!next||next===route)return;
  route=String(next);
  diagnosticBreadcrumb('view',{view:route});
}

export function installDiagnostics(){
  if(installed)return;
  installed=true;
  diagnosticEvent('session.start',{appVersion:APP.version,build:APP.build,stateSchema:APP.stateSchema,paperSchema:APP.paperSchema,guideVersion:PROJECT.guideVersion});
  globalThis.addEventListener?.('error',event=>diagnosticError('javascript',event.error||event.message||'window error',{source:event.filename?sanitizeDiagnosticText(event.filename):'',line:event.lineno||null,column:event.colno||null}));
  globalThis.addEventListener?.('unhandledrejection',event=>diagnosticError('unhandled-rejection',event.reason||'Unhandled rejection'));
  globalThis.addEventListener?.('online',()=>diagnosticEvent('network.online'));
  globalThis.addEventListener?.('offline',()=>diagnosticEvent('network.offline',{},'warning'));
}

export function clearDiagnostics(){memoryEvents=[];try{store()?.removeItem(STORAGE_KEY);return true}catch{return false}}
export function diagnosticEvents(){return readEvents().map(x=>structuredClone(x))}
export function diagnosticSummary(){const events=readEvents();return{events:events.length,errors:events.filter(e=>e.level==='error').length,lastAt:events.at(-1)?.at||null}}

function browserSummary(){
  const ua=globalThis.navigator?.userAgent||'';
  const match=ua.match(/(Firefox|Edg|Chrome)\/(\d+)/)||ua.match(/Version\/(\d+).*(Safari)/);
  return match?`${match[1]==='Version'?match[2]:match[1]} ${match[1]==='Version'?match[1]:match[2]}`:'unknown';
}

export function buildDiagnosticSnapshot(storageSummary={}){
  const events=readEvents();
  const errors=events.filter(e=>e.level==='error');
  const networkFailures=events.filter(e=>e.type.startsWith('network.failure'));
  const snapshot={
    schemaVersion:2,
    project:{name:'English Worksheet Lab',projectKey:'english-worksheet-lab',appVersion:APP.version,build:APP.build,dataSchemaVersion:APP.stateSchema},
    capture:{capturedAt:now(),sessionId,snapshotId:globalThis.crypto?.randomUUID?.()||`snapshot-${Date.now()}`,route,reason:'manual',severity:errors.length?'error':'info'},
    environment:{
      viewport:{width:globalThis.innerWidth??null,height:globalThis.innerHeight??null,devicePixelRatio:globalThis.devicePixelRatio??null},
      language:globalThis.navigator?.language||'',online:globalThis.navigator?.onLine??null,platformSummary:sanitizeDiagnosticText(globalThis.navigator?.userAgentData?.platform||globalThis.navigator?.platform||''),
      browserSummary:browserSummary(),
      features:{indexedDB:!!globalThis.indexedDB,pointerEvent:!!globalThis.PointerEvent,clipboard:!!globalThis.navigator?.clipboard,storageEstimate:!!globalThis.navigator?.storage?.estimate}
    },
    runtime:{initialization:events.filter(e=>e.type.startsWith('init.')).slice(-20),featureFlags:{remoteDiagnostics:false},serviceWorker:!!globalThis.navigator?.serviceWorker?.controller},
    breadcrumbs:events.filter(e=>e.level!=='error'&&!e.type.startsWith('network.failure')).slice(-80),
    errors:errors.slice(-30),networkFailures:networkFailures.slice(-20),
    storage:{available:!!store(),types:['localStorage','IndexedDB'],estimatedUsageBytes:Number(storageSummary.usage)||null,estimatedQuotaBytes:Number(storageSummary.quota)||null,summary:sanitizeDiagnosticValue(storageSummary.summary||{})},
    performance:{summary:{}},
    handoff:{sanitized:true,remoteEligible:false,payloadBytes:null,retentionClass:errors.length?'error':'normal',containsBinary:false,containsSecrets:false},
    notes:['Local-first development diagnostics. No learning answer text, pen strokes, file bodies, tokens, cookies, or binary data are intentionally included.']
  };
  try{snapshot.handoff.payloadBytes=new TextEncoder().encode(JSON.stringify(snapshot)).byteLength}catch{snapshot.handoff.payloadBytes=JSON.stringify(snapshot).length}
  return snapshot;
}

export function downloadDiagnosticSnapshot(storageSummary={}){
  const snapshot=buildDiagnosticSnapshot(storageSummary),blob=new Blob([JSON.stringify(snapshot,null,2)],{type:'application/json'}),a=document.createElement('a');
  a.href=URL.createObjectURL(blob);a.download=`english_diagnostics_${new Date().toISOString().replace(/[:.]/g,'-')}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  diagnosticBreadcrumb('diagnostics.export',{payloadBytes:snapshot.handoff.payloadBytes});
  return snapshot;
}
