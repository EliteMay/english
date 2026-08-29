function renderPractice(){
  const p=packById(state.activePackId);if(!p){$('#practiceEmpty').classList.remove('hidden');$('#practiceArea').classList.add('hidden');return}
  $('#practiceEmpty').classList.add('hidden');$('#practiceArea').classList.remove('hidden');const pr=progress();currentPage=Math.min(pr.currentPage||currentPage,Math.max(0,Math.ceil(p.questions.length/PAGE_SIZE)-1));pr.currentPage=currentPage;
  $('#practiceSource').textContent=`${p.source} · ${p.level} · ${p.focus}`;$('#practiceTitle').textContent=p.title;$('#practiceDesc').textContent=p.description;$('#paperTitle').textContent=p.title;
  const totalPages=Math.ceil(p.questions.length/PAGE_SIZE);$('#pageNow').textContent=currentPage+1;$('#pageTotal').textContent=totalPages;$('#paperPageLabel').textContent=`Page ${currentPage+1} / ${totalPages}`;$('#prevPageBtn').disabled=currentPage===0;$('#nextPageBtn').disabled=currentPage>=totalPages-1;
  const qs=p.questions.slice(currentPage*PAGE_SIZE,(currentPage+1)*PAGE_SIZE);$('#questionList').innerHTML=qs.map((q,i)=>renderQuestion(q,currentPage*PAGE_SIZE+i+1)).join('');bindQuestions(qs);updatePracticeProgress();setMode(mode,false);save();setTimeout(()=>{resizeCanvas();renderInk()},20)
}
function renderQuestion(q,num){
  const pr=progress(),a=pr.answers[q.id];let answer='';
  if(q.type==='fields')answer=`<div class="field-row">${q.fields.map(f=>`<div class="field"><label>${esc(f.label)}</label><input data-qid="${q.id}" data-field="${f.id}" value="${esc(a?.[f.id]??'')}"></div>`).join('')}</div>`;
  if(q.type==='choice')answer=`<div class="choice-row">${q.choices.map(c=>`<button class="choice-btn ${a===c?'selected':''}" data-choice-qid="${q.id}" data-choice="${esc(c)}">${esc(c)}</button>`).join('')}</div>`;
  if(q.type==='manual')answer=`<div class="manual-box"><textarea data-manual-qid="${q.id}" placeholder="ここは自分の言葉で書く。ペンで直接書いてもOK。">${esc(a??'')}</textarea>${q.guide?`<div class="manual-guide">考える軸：${esc(q.guide)}</div>`:''}</div>`;
  const conf=pr.confidence[q.id]||3,memo=pr.memos[q.id]||'',changes=pr.answerHistory.filter(x=>x.questionId===q.id).length,inkCount=(pr.inkPages[currentPage]||[]).filter(s=>s.questionId===q.id).length;
  return `<section class="question ${inkCount?'ink-present':''}" data-question-id="${q.id}"><span class="q-num">${num}.</span><div class="q-prompt">${esc(q.prompt)}</div>${q.sentence?`<div class="q-sentence">${esc(q.sentence)}</div>`:''}${answer}${q.note?`<div class="q-note">${esc(q.note)}</div>`:''}<div class="q-meta-row"><button class="memo-toggle" data-memo-toggle="${q.id}">途中メモ ${memo?'●':''}</button><span class="q-status">変更 ${changes}回 / ペン ${inkCount}本</span><div class="confidence"><span>自信</span>${[1,2,3,4,5].map(n=>`<button class="${conf===n?'active':''}" data-conf-qid="${q.id}" data-conf="${n}">${n}</button>`).join('')}</div></div><div class="reason-box ${memo?'':'hidden'}" data-memo-box="${q.id}"><textarea data-memo-qid="${q.id}" placeholder="最初どう考えたか、迷った点、答えを変えた理由など">${esc(memo)}</textarea></div></section>`;
}
function bindQuestions(qs){
  $$('input[data-qid]').forEach(el=>el.onchange=()=>setFieldAnswer(el.dataset.qid,el.dataset.field,el.value));
  $$('[data-choice-qid]').forEach(b=>b.onclick=()=>setChoiceAnswer(b.dataset.choiceQid,b.dataset.choice));
  $$('[data-manual-qid]').forEach(el=>el.onchange=()=>setManualAnswer(el.dataset.manualQid,el.value));
  $$('[data-memo-toggle]').forEach(b=>b.onclick=()=>{const box=$(`[data-memo-box="${b.dataset.memoToggle}"]`);box.classList.toggle('hidden');if(!box.classList.contains('hidden'))$('textarea',box).focus()});
  $$('[data-memo-qid]').forEach(el=>el.onchange=()=>{progress().memos[el.dataset.memoQid]=el.value;save();updatePracticeProgress()});
  $$('[data-conf-qid]').forEach(b=>b.onclick=()=>{progress().confidence[b.dataset.confQid]=+b.dataset.conf;save();renderPractice()});
}
function recordChange(qid,field,oldValue,newValue){if(norm(oldValue)===norm(newValue))return;progress().answerHistory.push({id:id(),time:new Date().toISOString(),questionId:qid,field,from:oldValue??'',to:newValue??''});state.totalAnswerEvents++;}
function setFieldAnswer(qid,field,value){const pr=progress();pr.answers[qid]??={};const old=pr.answers[qid][field]??'';recordChange(qid,field,old,value);pr.answers[qid][field]=value;save();updatePracticeProgress()}
function setChoiceAnswer(qid,value){const pr=progress(),old=pr.answers[qid]??'';recordChange(qid,'choice',old,value);pr.answers[qid]=value;save();renderPractice()}
function setManualAnswer(qid,value){const pr=progress(),old=pr.answers[qid]??'';recordChange(qid,'manual',old,value);pr.answers[qid]=value;save();updatePracticeProgress()}
function updatePracticeProgress(){const p=packById(state.activePackId),n=answerCount(p.id);$('#practiceProgress').textContent=`${n}/${p.questions.length}`}
function changePage(d){const p=packById(state.activePackId),pages=Math.ceil(p.questions.length/PAGE_SIZE),next=Math.max(0,Math.min(pages-1,currentPage+d));if(next===currentPage)return;currentPage=next;progress().currentPage=currentPage;save();renderPractice();scrollTo({top:0,behavior:'smooth'})}
function saveSnapshot(){const pr=progress();pr.snapshots.push({time:new Date().toISOString(),page:currentPage,answers:structuredClone(pr.answers),memos:structuredClone(pr.memos),confidence:structuredClone(pr.confidence),answerHistoryLength:pr.answerHistory.length,inkStrokeCount:Object.values(pr.inkPages).reduce((n,a)=>n+a.length,0)});save();toast('途中経過を記録しました')}

function checkQuestion(q,a){
  if(q.type==='manual')return null;
  if(q.type==='choice')return norm(a)===norm(q.answer);
  if(q.type==='fields')return q.fields.every(f=>(f.answers||[]).some(ans=>norm(a?.[f.id]??'')===norm(ans)));
  return null;
}
function correctAnswerText(q){if(q.type==='choice')return q.answer;if(q.type==='fields')return q.fields.map(f=>`${f.label}: ${(f.answers||[])[0]??''}`).join(' / ');return 'ChatGPT分析対象'}
function userAnswerText(q,a){if(q.type==='fields')return q.fields.map(f=>`${f.label}: ${a?.[f.id]??''}`).join(' / ');return a??''}
function finishPack(){
  const p=packById(state.activePackId),pr=progress();if(!p)return;
  const results=p.questions.map(q=>{const a=pr.answers[q.id],correct=checkQuestion(q,a),changes=pr.answerHistory.filter(x=>x.questionId===q.id);return {questionId:q.id,type:q.type,skill:q.skill,prompt:q.prompt,sentence:q.sentence,userAnswer:userAnswerText(q,a),correctAnswer:correctAnswerText(q),correct,memo:pr.memos[q.id]||'',confidence:pr.confidence[q.id]||3,answerChanges:changes,inkStrokeCount:Object.values(pr.inkPages).flat().filter(s=>s.questionId===q.id).length}});
  const auto=results.filter(r=>r.correct!==null),correct=auto.filter(r=>r.correct).length,score=auto.length?Math.round(correct/auto.length*100):0;
  const skills={};for(const r of auto){skills[r.skill]??={correct:0,total:0};skills[r.skill].total++;if(r.correct)skills[r.skill].correct++}
  const session={id:id(),finishedAt:new Date().toISOString(),startedAt:pr.startedAt,packId:p.id,packTitle:p.title,source:p.source,score,autoCorrect:correct,autoTotal:auto.length,manualCount:results.filter(r=>r.correct===null).length,results,skillScores:Object.fromEntries(Object.entries(skills).map(([k,v])=>[k,Math.round(v.correct/v.total*100)])),snapshots:pr.snapshots.length,totalChanges:pr.answerHistory.length,totalInk:Object.values(pr.inkPages).reduce((n,a)=>n+a.length,0)};
  state.sessions.unshift(session);pr.completedAt=session.finishedAt;pr.lastScore=score;save();renderLibrary();openView('results');toast('採点結果を保存しました')
}
