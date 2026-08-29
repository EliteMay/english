function inkCountForQuestion(pr,qid){return Object.values(pr.inkPages||{}).flat().filter(s=>s.questionId===qid&&!s.eraser).length}
function renderPractice(){
  const p=packById(state.activePackId);if(!p){$('#practiceEmpty').classList.remove('hidden');$('#practiceArea').classList.add('hidden');return}
  $('#practiceEmpty').classList.add('hidden');$('#practiceArea').classList.remove('hidden');const pr=progress();currentPage=Math.min(pr.currentPage||currentPage,Math.max(0,Math.ceil(p.questions.length/PAGE_SIZE)-1));pr.currentPage=currentPage;
  $('#practiceSource').textContent=`${p.source} · ${p.level} · ${p.focus}`;$('#practiceTitle').textContent=p.title+(pr.reviewMode?'｜答え合わせ':'');$('#practiceDesc').textContent=pr.reviewMode?'正答を確認して、各問題を ○ / △ / × で自己採点してください。手書き自体はそのまま残ります。':p.description;$('#paperTitle').textContent=p.title;
  const totalPages=Math.ceil(p.questions.length/PAGE_SIZE);$('#pageNow').textContent=currentPage+1;$('#pageTotal').textContent=totalPages;$('#paperPageLabel').textContent=`Page ${currentPage+1} / ${totalPages}`;$('#prevPageBtn').disabled=currentPage===0;$('#nextPageBtn').disabled=currentPage>=totalPages-1;
  const qs=p.questions.slice(currentPage*PAGE_SIZE,(currentPage+1)*PAGE_SIZE);$('#questionList').innerHTML=qs.map((q,i)=>renderQuestion(q,currentPage*PAGE_SIZE+i+1)).join('');bindQuestions();updatePracticeProgress();updateFinishButton();setMode('pen',false);save();setTimeout(()=>{resizeCanvas();renderInk()},20)
}
function renderQuestion(q,num){
  const pr=progress(),inkCount=inkCountForQuestion(pr,q.id);let answer='';
  if(q.type==='fields')answer=`<div class="paper-answer-lines">${q.fields.map(f=>`<div class="paper-line-field"><span>${esc(f.label)}</span><i></i></div>`).join('')}</div>`;
  if(q.type==='choice')answer=`<div class="paper-choice-list">${q.choices.map((c,i)=>`<div><b>${String.fromCharCode(65+i)}.</b><span>${esc(c)}</span></div>`).join('')}</div>`;
  if(q.type==='manual')answer=`<div class="paper-writing-lines">${'<i></i>'.repeat(q.lines||4)}</div>`;
  const grade=pr.selfGrades[q.id]||'';
  const review=pr.reviewMode?`<div class="answer-key"><strong>${q.type==='manual'?'ChatGPT確認用':'正答'}</strong><span>${esc(correctAnswerText(q))}</span>${q.guide?`<small>確認ポイント：${esc(q.guide)}</small>`:''}${q.type!=='manual'?`<div class="grade-row"><em>自己採点</em>${[['correct','○'],['partial','△'],['wrong','×']].map(([v,l])=>`<button class="grade-btn ${grade===v?'active '+v:''}" data-grade-qid="${q.id}" data-grade="${v}">${l}</button>`).join('')}</div>`:'<small>この記述は提出ZIPの紙面をChatGPTに見せて分析します。</small>'}</div>`:'';
  return `<section class="question ${inkCount?'ink-present':''}" data-question-id="${q.id}"><span class="q-num">${num}.</span><div class="q-prompt">${esc(q.prompt)}</div>${q.sentence?`<div class="q-sentence">${esc(q.sentence)}</div>`:''}${answer}${q.note?`<div class="q-note">${esc(q.note)}</div>`:''}<div class="q-meta-row"><span class="q-status">手書き ${inkCount}ストローク${grade?' / 採点 '+({correct:'○',partial:'△',wrong:'×'}[grade]):''}</span></div>${review}</section>`;
}
function bindQuestions(){$$('[data-grade-qid]').forEach(b=>b.onclick=()=>{const pr=progress();pr.selfGrades[b.dataset.gradeQid]=b.dataset.grade;save();renderPractice()})}
function updatePracticeProgress(){const p=packById(state.activePackId),n=answerCount(p.id);$('#practiceProgress').textContent=`${n}/${p.questions.length}`;$('#practiceProgress').nextElementSibling.textContent=progress().reviewMode?'自己採点済み/書込':'書き込みあり'}
function updateFinishButton(){if(!$('#finishBtn'))return;$('#finishBtn').textContent=progress().reviewMode?'自己採点を保存して結果へ':'答え合わせへ'}
function changePage(d){const p=packById(state.activePackId),pages=Math.ceil(p.questions.length/PAGE_SIZE),next=Math.max(0,Math.min(pages-1,currentPage+d));if(next===currentPage)return;currentPage=next;progress().currentPage=currentPage;save();renderPractice();scrollTo({top:0,behavior:'smooth'})}
function saveSnapshot(){const pr=progress();pr.snapshots.push({time:new Date().toISOString(),page:currentPage,selfGrades:structuredClone(pr.selfGrades),inkStrokeCount:Object.values(pr.inkPages).reduce((n,a)=>n+a.length,0)});save();toast('現在の手書き状態を記録しました')}
function correctAnswerText(q){if(q.type==='choice')return q.answer;if(q.type==='fields')return q.fields.map(f=>`${f.label}: ${(f.answers||[])[0]??''}`).join(' / ');return q.guide||'自由記述（ChatGPT確認）'}
function finishPackAction(){const pr=progress();if(!pr.reviewMode){pr.reviewMode=true;save();renderPractice();scrollTo({top:0,behavior:'smooth'});toast('答え合わせモードに入りました');return}finalizeReview()}
function finalizeReview(){
  const p=packById(state.activePackId),pr=progress();if(!p)return;const gradable=p.questions.filter(q=>q.type!=='manual'),missing=gradable.filter(q=>!pr.selfGrades[q.id]);
  if(missing.length&&!confirm(`${missing.length}問が未採点です。未採点は0点として結果を保存しますか？`))return;
  const results=p.questions.map(q=>{const grade=q.type==='manual'?'manual':(pr.selfGrades[q.id]||'ungraded'),points=grade==='correct'?1:grade==='partial'?.5:0;return {questionId:q.id,type:q.type,skill:q.skill,prompt:q.prompt,sentence:q.sentence||'',userAnswer:'手書き回答（提出ZIPのPNGを参照）',correctAnswer:correctAnswerText(q),selfGrade:grade,points,correct:grade==='correct'?true:grade==='wrong'||grade==='ungraded'?false:null,memo:'',confidence:null,answerChanges:[],inkStrokeCount:inkCountForQuestion(pr,q.id)}});
  const auto=results.filter(r=>r.selfGrade!=='manual'),pointTotal=auto.reduce((n,r)=>n+r.points,0),score=auto.length?Math.round(pointTotal/auto.length*100):0;
  const skills={};for(const r of auto){skills[r.skill]??={points:0,total:0};skills[r.skill].total++;skills[r.skill].points+=r.points}
  const session={id:id(),finishedAt:new Date().toISOString(),startedAt:pr.startedAt,packId:p.id,packTitle:p.title,source:p.source,score,autoCorrect:auto.filter(r=>r.selfGrade==='correct').length,autoPartial:auto.filter(r=>r.selfGrade==='partial').length,autoTotal:auto.length,manualCount:results.filter(r=>r.selfGrade==='manual').length,results,skillScores:Object.fromEntries(Object.entries(skills).map(([k,v])=>[k,Math.round(v.points/v.total*100)])),snapshots:pr.snapshots.length,totalChanges:0,totalInk:Object.values(pr.inkPages).reduce((n,a)=>n+a.length,0),paperBased:true};
  state.sessions.unshift(session);pr.completedAt=session.finishedAt;pr.lastScore=score;pr.reviewMode=false;save();renderLibrary();openView('results');toast('自己採点結果を保存しました')
}
