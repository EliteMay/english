const DB_NAME='english-worksheet-lab-v6';
const DB_VERSION=1;
let dbPromise=null;

function openDb(){
  if(dbPromise)return dbPromise;
  dbPromise=new Promise((resolve,reject)=>{
    const req=indexedDB.open(DB_NAME,DB_VERSION);
    req.onupgradeneeded=()=>{
      const db=req.result;
      if(!db.objectStoreNames.contains('ink'))db.createObjectStore('ink',{keyPath:'id'});
      if(!db.objectStoreNames.contains('legacyInk'))db.createObjectStore('legacyInk',{keyPath:'id'});
      if(!db.objectStoreNames.contains('paperSnapshots'))db.createObjectStore('paperSnapshots',{keyPath:'id'});
      if(!db.objectStoreNames.contains('archives'))db.createObjectStore('archives',{keyPath:'id'});
    };
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>reject(req.error||new Error('IndexedDBを開けません'));
  });
  return dbPromise;
}

async function tx(storeName,mode,fn){
  const db=await openDb();
  return new Promise((resolve,reject)=>{
    const tr=db.transaction(storeName,mode),store=tr.objectStore(storeName);
    let value;
    try{value=fn(store)}catch(err){reject(err);return}
    tr.oncomplete=()=>resolve(value);
    tr.onerror=()=>reject(tr.error||new Error('IndexedDB transaction failed'));
    tr.onabort=()=>reject(tr.error||new Error('IndexedDB transaction aborted'));
  });
}

function reqResult(req){return new Promise((resolve,reject)=>{req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)})}

export async function dbGet(store,id){
  const db=await openDb();
  const tr=db.transaction(store,'readonly');
  return reqResult(tr.objectStore(store).get(id));
}
export async function dbPut(store,value){return tx(store,'readwrite',s=>s.put(value))}
export async function dbDelete(store,id){return tx(store,'readwrite',s=>s.delete(id))}
export async function dbClear(store){return tx(store,'readwrite',s=>s.clear())}
export async function dbGetAll(store){
  const db=await openDb();
  const tr=db.transaction(store,'readonly');
  return reqResult(tr.objectStore(store).getAll());
}

export async function getQuestionInk(attemptId,questionId){
  return (await dbGet('ink',`${attemptId}:${questionId}`))?.strokes||[];
}
export async function setQuestionInk(attemptId,questionId,strokes){
  return dbPut('ink',{id:`${attemptId}:${questionId}`,attemptId,questionId,strokes,updatedAt:new Date().toISOString()});
}
export async function getLegacyPageInk(attemptId,page){
  return (await dbGet('legacyInk',`${attemptId}:${page}`))?.strokes||[];
}
export async function setLegacyPageInk(attemptId,page,strokes){
  return dbPut('legacyInk',{id:`${attemptId}:${page}`,attemptId,page,strokes,updatedAt:new Date().toISOString()});
}
export async function putPaperSnapshot(snapshot){return dbPut('paperSnapshots',snapshot)}
export async function getPaperSnapshot(id){return dbGet('paperSnapshots',id)}
export async function putArchive(archive){return dbPut('archives',archive)}

export async function estimateDb(){
  try{return await navigator.storage?.estimate?.()||{usage:0,quota:0}}catch{return{usage:0,quota:0}}
}

export async function clearAttemptInk(attemptId){
  const all=await dbGetAll('ink');
  await Promise.all(all.filter(x=>x.attemptId===attemptId).map(x=>dbDelete('ink',x.id)));
  const legacy=await dbGetAll('legacyInk');
  await Promise.all(legacy.filter(x=>x.attemptId===attemptId).map(x=>dbDelete('legacyInk',x.id)));
}

export async function exportAttemptInk(attemptIds){
  const wanted=new Set(attemptIds),all=await dbGetAll('ink'),legacy=await dbGetAll('legacyInk');
  return {
    questionInk:all.filter(x=>wanted.has(x.attemptId)),
    legacyPageInk:legacy.filter(x=>wanted.has(x.attemptId))
  };
}
