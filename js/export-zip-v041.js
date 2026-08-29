function getExportCss(){
  if(exportCssCache)return Promise.resolve(exportCssCache);
  return Promise.all([
    fetch('./css/styles.css?v=0.4.1',{cache:'no-store'}),
    fetch('./css/paper-v041.css?v=0.4.1',{cache:'no-store'})
  ]).then(async([base,extra])=>{
    if(!base.ok||!extra.ok)throw new Error('CSSを読み込めませんでした');
    exportCssCache=(await base.text())+'\n'+(await extra.text());return exportCssCache;
  });
}

function inkHistoryJson(worked){
  const packIds=[...new Set(worked.map(x=>x.pack.id))],packs={};
  for(const pid of packIds){
    const p=packById(pid),pr=progress(pid);if(!p||!pr)continue;
    packs[pid]={
      packTitle:p.title,
      note:'points は問題用紙に対する0〜1の相対座標。eraser:true は消しゴム。time と配列順で、書いた・消した順番を追えます。',
      pages:pr.inkPages||{}
    };
  }
  return {schema:'english-worksheet-ink-history',schemaVersion:1,exportedAt:new Date().toISOString(),packs};
}

function submissionReadme(worked){
  const pages=worked.length,packs=new Set(worked.map(x=>x.pack.id)).size;
  return `このZIPは English Worksheet Lab で実際に解いた問題用紙です。\n\n【優先して見てほしい順】\n1. papers/ のPNG\n   実際の問題文と、手書きのS/V、丸、下線、括弧、矢印、最終的に残った書き込みが見えます。\n2. ink-history.json\n   ペンの生データです。eraser:true のストロークも残るため、最終PNGでは消えている途中の書き直しや、どの順番で考えたかを推測する補助になります。\n3. learning-data.json\n   自己採点、過去結果、書き込み数などの補助情報です。\n4. questions.json\n   出題内容と正答・確認基準です。\n\n最終的な正誤だけでなく、途中の読み方・構造の取り方を優先して分析してください。\n収録: ${packs}セット / ${pages}ページ\n\n${analysisPrompt()}\n`;
}

async function downloadSubmissionZip(){
  const worked=submissionWorkedPages();if(!worked.length){toast('まだ書き込んだ問題用紙がありません');return}
  const original={packId:state.activePackId,page:currentPage,mode,view:$$('.view').find(v=>v.classList.contains('active'))?.id?.replace('view-','')||'library'};
  const reviewBackup=new Map();
  exportOverlay(true,`解いた紙を準備しています… 0 / ${worked.length}`);
  const files=[];
  try{
    openView('practice');
    for(let i=0;i<worked.length;i++){
      const w=worked[i];state.activePackId=w.pack.id;currentPage=w.page;const pr=progress(w.pack.id);
      if(!reviewBackup.has(w.pack.id))reviewBackup.set(w.pack.id,pr.reviewMode);pr.reviewMode=false;pr.currentPage=w.page;
      renderPractice();setMode('pen',false);await nextPaint();
      exportOverlayText(`問題用紙を画像化しています… ${i+1} / ${worked.length}`);
      const png=await paperToPngBlob(),name=`papers/${safeFileName(w.pack.title)}_page${String(w.page+1).padStart(2,'0')}.png`;files.push({name,data:png});
    }
    exportOverlayText('学習履歴とZIPをまとめています…');
    files.push({name:'learning-data.json',data:utf8(JSON.stringify(exportLearningData(),null,2))});
    files.push({name:'ink-history.json',data:utf8(JSON.stringify(inkHistoryJson(worked),null,2))});
    files.push({name:'questions.json',data:utf8(JSON.stringify(workedQuestionsJson(worked),null,2))});
    files.push({name:'ChatGPTに見てほしいこと.txt',data:utf8(submissionReadme(worked))});
    const zip=await createStoredZip(files),a=document.createElement('a');a.href=URL.createObjectURL(zip);a.download=`english_submission_${new Date().toISOString().slice(0,10)}.zip`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);toast('ChatGPT提出ZIPを作成しました');
  }catch(err){console.error(err);toast('ZIP作成に失敗しました: '+err.message)}finally{
    reviewBackup.forEach((v,pid)=>progress(pid).reviewMode=v);state.activePackId=original.packId;currentPage=original.page;
    if(original.packId)progress(original.packId).currentPage=original.page;save();openView(original.view);setMode('pen',false);exportOverlay(false);
  }
}
