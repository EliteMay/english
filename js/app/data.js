import {APP,clone} from './state.js';
import {getPaperSnapshot} from './db.js';
import {diagnosticEvent} from './diagnostics.js';

export let catalog={manifest:null,curriculum:null,pedagogy:null,packs:[],packMap:new Map(),legacyMap:new Map()};

async function getJson(url){
  try{
    const r=await fetch(`${url}${url.includes('?')?'&':'?'}b=${encodeURIComponent(APP.build)}`,{cache:'no-store'});
    if(!r.ok)throw new Error(`${url} を読み込めません (${r.status})`);
    return await r.json();
  }catch(err){
    diagnosticEvent('network.failure',{resource:url,message:err?.message||'fetch failed'},'error');
    throw err;
  }
}

export async function loadCatalog(){
  const manifest=await getJson('./data/packs/index.json');
  const [groups,curriculum,pedagogy,legacyFoundation,legacyBoundary]=await Promise.all([
    Promise.all((manifest.files||[]).map(f=>getJson(`./data/packs/${f}`))),
    getJson(`./data/${manifest.catalog||'curriculum.json'}`),
    getJson('./data/pedagogy.json'),
    getJson('./data/legacy/foundation-sv-v051.json').catch(()=>null),
    getJson('./data/legacy/sv-phrase-boundary-v051.json').catch(()=>null)
  ]);
  const packs=groups.flat();
  catalog={manifest,curriculum,pedagogy,packs,packMap:new Map(packs.map(p=>[p.id,p])),legacyMap:new Map()};
  if(legacyFoundation)catalog.legacyMap.set(legacyFoundation.id,legacyFoundation);
  if(legacyBoundary)catalog.legacyMap.set(legacyBoundary.id,legacyBoundary);
  return catalog;
}

export const getCurrentPack=id=>catalog.packMap.get(id)||null;
export const getLegacyPack=async id=>catalog.legacyMap.get(id)||null;
export const packMeta=id=>catalog.curriculum?.packs?.[id]||{order:999,phase:'その他',minutes:null,skills:[],tags:[]};
export const skillLabel=id=>catalog.curriculum?.skills?.[id]?.label||id;

export async function getAttemptPack(pr){
  if(pr?.paperSnapshotId){const snap=await getPaperSnapshot(pr.paperSnapshotId);if(snap?.pack)return clone(snap.pack)}
  return clone(getCurrentPack(pr?.packId));
}

export function questionMode(q,pack){
  if(q?.studyMode&&catalog.pedagogy?.modes?.[q.studyMode])return q.studyMode;
  if(pack?.defaultStudyMode&&catalog.pedagogy?.modes?.[pack.defaultStudyMode])return pack.defaultStudyMode;
  const t=`${q?.prompt||''} ${q?.note||''}`;
  if(/範囲問題|S全体|主語.*全体/.test(t))return'range';
  if(/S・V・O|S・V・C|文型|構造分解|O=C/.test(t))return'structure';
  return catalog.pedagogy?.defaultMode||'skeleton';
}

export function answerBasis(q){
  if(q.reviewAnswer)return q.reviewAnswer;
  if(q.type==='choice')return q.answer||'';
  if(q.type==='fields')return(q.fields||[]).map(f=>`${f.label}: ${(f.answers||[]).join(' / ')}`).join(' ｜ ');
  if(q.type==='reorder')return q.answer||q.guide||'';
  if(q.type==='passage')return(q.answers||[]).map((a,i)=>`${i+1}. ${a}`).join(' ｜ ')||q.guide||'ChatGPT確認';
  return q.guide||'自由記述（ChatGPT確認）';
}
