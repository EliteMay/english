const isObject=v=>!!v&&typeof v==='object'&&!Array.isArray(v);
const isString=v=>typeof v==='string';
const isArray=v=>Array.isArray(v);

function result(ok,error='',value=null){return ok?{ok:true,value}:{ok:false,error}}
function rowsHaveIds(rows){return rows.every(row=>isObject(row)&&isString(row.id)&&row.id.length>0)}

export function validateBackup(input){
  if(!isObject(input))return result(false,'バックアップのルートがObjectではありません');
  if(input.schema!=='english-worksheet-backup-v2')return result(false,'対応していないバックアップ形式です');
  if(!isObject(input.state))return result(false,'stateがありません');
  if(!isObject(input.state.packProgress)||!isArray(input.state.sessions))return result(false,'stateの必須項目が不正です');
  if(!isObject(input.prefs))return result(false,'prefsが不正です');
  if(!isObject(input.stores))return result(false,'IndexedDBデータがありません');

  const required=['ink','legacyInk','paperSnapshots','archives'];
  for(const name of required){
    const rows=input.stores[name];
    if(!isArray(rows))return result(false,`${name}が配列ではありません`);
    if(!rowsHaveIds(rows))return result(false,`${name}にIDのないデータがあります`);
  }
  for(const row of input.stores.ink){
    if(!isString(row.attemptId)||!isString(row.questionId)||!isArray(row.strokes))return result(false,'inkデータが不正です');
  }
  for(const row of input.stores.legacyInk){
    if(!isString(row.attemptId)||!Number.isFinite(Number(row.page))||!isArray(row.strokes))return result(false,'legacyInkデータが不正です');
  }
  for(const row of input.stores.paperSnapshots){
    if(!isString(row.attemptId)||!isString(row.packId)||!isObject(row.pack))return result(false,'paperSnapshotsデータが不正です');
  }
  for(const row of input.stores.archives){
    if(!isString(row.attemptId)||!isString(row.packId)||!isObject(row.progress))return result(false,'archivesデータが不正です');
  }
  return result(true,'',input);
}

export function validateAnalysis(input){
  if(!isObject(input))return result(false,'分析JSONのルートがObjectではありません');
  if(input.weaknessAnalysisVersion!==2)return result(false,'weaknessAnalysisVersion 2 のJSONだけ読み込めます');
  if(!isString(input.summary))return result(false,'summaryがありません');
  const arrayFields=['weaknesses','strengths','nextTargets','skillProfile','readingHabits','siteRecommendations'];
  for(const key of arrayFields)if(!isArray(input[key]))return result(false,`${key}が配列ではありません`);
  for(const item of input.weaknesses){
    if(!isObject(item)||!isString(item.title))return result(false,'weaknessesの項目が不正です');
    if(item.evidence!==undefined&&!isArray(item.evidence))return result(false,'weakness evidenceが配列ではありません');
    if(item.recommendedPackIds!==undefined&&!isArray(item.recommendedPackIds))return result(false,'recommendedPackIdsが配列ではありません');
  }
  return result(true,'',input);
}
