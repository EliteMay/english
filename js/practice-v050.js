// v0.5.1 patch: 未着手問題を誤答にしない。解いた範囲のスコアと全体進捗を分離する。
function finalizeReview(){
  flushPageTimer();
  const p=packById(state.activePackId),pr=ensureProgressExtras();
  if(!p)return;
  const manualQuestions=p.questions.filter(q=>q.type==='manual'||(q.type==='passage'&&q.manualReview));
  const gradable=p.questions.filter(q=>!manualQuestions.includes(q));
  const missing=gradable.filter(q=>!['correct','partial','wrong'].includes(pr.selfGrades[q.id]));
  if(missing.length&&!confirm(`${missing.length}問はまだ未採点です。\n未採点は0点にせず、今回のスコア対象外として保存しますか？`)){startPageTimer();return}
  const results=p.questions.map(q=>{
    const manual=manualQuestions.includes(q),grade=manual?'manual':(pr.selfGrades[q.id]||'ungraded'),points=grade==='correct'?1:grade==='partial'?.5:0;
    return {questionId:q.id,originQuestionId:q.originQuestionId||null,originPackId:q.originPackId||null,type:q.type,skill:q.skill,prompt:q.prompt,sentence:q.sentence||q.passage||'',correctAnswer:answerBasis(q),selfGrade:grade,points,correct:grade==='correct'?true:grade==='wrong'?false:null,reviewTags:[...(pr.reviewTags[q.id]||[])],reviewNote:pr.reviewNotes[q.id]||'',inkStrokeCount:inkCountForQuestion(pr,q.id)};
  });
  const scored=results.filter(r=>['correct','partial','wrong'].includes(r.selfGrade));
  const pointTotal=scored.reduce((n,r)=>n+r.points,0),score=scored.length?Math.round(pointTotal/scored.length*100):0,skills={};
  for(const r of scored){skills[r.skill]??={points:0,total:0};skills[r.skill].total++;skills[r.skill].points+=r.points}
  const manualDone=manualQuestions.filter(q=>questionTouched(pr,q.id)).length;
  const coverageTotal=gradable.length+manualQuestions.length,coverageDone=scored.length+manualDone,coveragePercent=coverageTotal?Math.round(coverageDone/coverageTotal*100):0;
  const isComplete=missing.length===0&&manualDone===manualQuestions.length;
  const durationMs=Object.values(pr.pageTimeMs||{}).reduce((n,v)=>n+v,0),session={id:id(),attemptId:pr.attemptId,finishedAt:new Date().toISOString(),startedAt:pr.startedAt,packId:p.id,packTitle:p.title,source:p.source,score,autoCorrect:scored.filter(r=>r.selfGrade==='correct').length,autoPartial:scored.filter(r=>r.selfGrade==='partial').length,autoWrong:scored.filter(r=>r.selfGrade==='wrong').length,autoTotal:scored.length,availableGradable:gradable.length,ungradedCount:missing.length,manualCount:manualQuestions.length,manualDone,coverageDone,coverageTotal,coveragePercent,completedPack:isComplete,results,skillScores:Object.fromEntries(Object.entries(skills).map(([k,v])=>[k,Math.round(v.points/v.total*100)])),snapshots:pr.snapshots.length,totalInk:Object.values(pr.inkPages||{}).reduce((n,a)=>n+a.length,0),pageTimeMs:structuredClone(pr.pageTimeMs),durationMs,paperBased:true,appVersion:APP_BUILD.version,build:APP_BUILD.build};
  state.sessions.unshift(session);if(state.sessions.length>120)state.sessions=state.sessions.slice(0,120);
  pr.completedAt=isComplete?session.finishedAt:null;pr.lastScore=score;pr.reviewMode=false;save();renderLibrary();openView('results');toast(isComplete?'自己採点結果を保存しました':'途中結果を保存しました。未着手は0点にしていません');
}
