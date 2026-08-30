import {getQuestionInk,setQuestionInk,getLegacyPageInk} from './db.js';
import {state,progress,markTouched,saveState,updatePrefs,prefs,uid} from './state.js';

const SIZE={thin:.65,normal:1,thick:1.5};
export const pen={color:'#1f2937',tool:'pen',size:prefs.penSize||'normal',drawing:false,current:null,lastInput:{type:'未検出',pressure:0}};
const cache=new Map(),undoStack=[],redoStack=[];
let renderToken=0;

const key=(attemptId,qid)=>`${attemptId}:${qid}`;
function dpr(){return Math.min(2,devicePixelRatio||1)}
function fitCanvas(canvas,host){const ratio=dpr(),w=Math.max(1,host.clientWidth),h=Math.max(1,host.clientHeight);if(canvas.width!==Math.floor(w*ratio)||canvas.height!==Math.floor(h*ratio)){canvas.width=Math.floor(w*ratio);canvas.height=Math.floor(h*ratio);canvas.style.width=w+'px';canvas.style.height=h+'px';canvas.getContext('2d').setTransform(ratio,0,0,ratio,0,0)}return{w,h}}
function pointFromEvent(e,canvas){const r=canvas.getBoundingClientRect();return{x:Math.max(0,Math.min(1,(e.clientX-r.left)/r.width)),y:Math.max(0,Math.min(1,(e.clientY-r.top)/r.height)),p:e.pointerType==='pen'?Math.max(.05,e.pressure||.35):.45,t:performance.now()}}
function compact(p,start){return{x:+p.x.toFixed(5),y:+p.y.toFixed(5),p:+p.p.toFixed(3),dt:Math.max(0,Math.round(p.t-start))}}
function shouldAppend(a,b){if(!a)return true;const dx=a.x-b.x,dy=a.y-b.y;return dx*dx+dy*dy>0.0000006||b.t-(a.t||0)>18}

export function drawStroke(ctx,stroke,w,h){const pts=stroke.points||[];if(pts.length<2)return;ctx.save();ctx.lineCap='round';ctx.lineJoin='round';if(stroke.tool==='eraser'){ctx.globalCompositeOperation='destination-out';ctx.globalAlpha=1}else{ctx.globalCompositeOperation='source-over';ctx.strokeStyle=stroke.color||'#1f2937';ctx.globalAlpha=stroke.tool==='marker'?.25:1}const factor=SIZE[stroke.size]||1;for(let i=1;i<pts.length;i++){const a=pts[i-1],b=pts[i];ctx.beginPath();ctx.lineWidth=stroke.tool==='eraser'?20:stroke.tool==='marker'?14:factor*(1.1+4.2*(b.p||.4));ctx.moveTo(a.x*w,a.y*h);ctx.lineTo(b.x*w,b.y*h);ctx.stroke()}ctx.restore()}

async function loadQuestion(attemptId,qid){const k=key(attemptId,qid);if(cache.has(k))return cache.get(k);const strokes=await getQuestionInk(attemptId,qid);cache.set(k,strokes);return strokes}
export async function renderQuestionCanvas(canvas){const qid=canvas.dataset.questionId,pr=progress();if(!qid||!pr)return;const host=canvas.closest('.question'),{w,h}=fitCanvas(canvas,host),ctx=canvas.getContext('2d');ctx.clearRect(0,0,w,h);const strokes=await loadQuestion(pr.attemptId,qid);for(const s of strokes)drawStroke(ctx,s,w,h)}

export async function renderLegacyOverlay(){const canvas=document.querySelector('#legacyInkCanvas'),paper=document.querySelector('#paper'),pr=progress();if(!canvas||!paper||!pr)return;const {w,h}=fitCanvas(canvas,paper),ctx=canvas.getContext('2d');ctx.clearRect(0,0,w,h);if(!pr.legacyLayout)return;const strokes=await getLegacyPageInk(pr.attemptId,pr.currentPage||0);for(const s of strokes)drawStroke(ctx,s,w,h)}

export async function renderAllInk(){const token=++renderToken;await Promise.all([...document.querySelectorAll('.question-ink')].map(renderQuestionCanvas));if(token===renderToken)await renderLegacyOverlay()}

function onDown(e){if(e.pointerType==='touch')return;if(e.pointerType==='mouse'&&e.button!==0)return;const canvas=e.currentTarget,qid=canvas.dataset.questionId,pr=progress();if(!qid||!pr)return;e.preventDefault();canvas.setPointerCapture?.(e.pointerId);const p=pointFromEvent(e,canvas),start=performance.now();pen.drawing=true;pen.lastInput={type:e.pointerType||'mouse',pressure:p.p};updateInputBadge();pen.current={id:uid(),questionId:qid,time:new Date().toISOString(),started:start,color:pen.color,tool:pen.tool,size:pen.size,pointerType:e.pointerType,points:[p]}}
function onMove(e){if(!pen.drawing||!pen.current||e.currentTarget.dataset.questionId!==pen.current.questionId)return;e.preventDefault();const events=e.getCoalescedEvents?.()||[e];for(const ev of events){const p=pointFromEvent(ev,e.currentTarget),last=pen.current.points.at(-1);if(shouldAppend(last,p))pen.current.points.push(p)}const host=e.currentTarget.closest('.question'),{w,h}=fitCanvas(e.currentTarget,host);const ctx=e.currentTarget.getContext('2d');renderQuestionCanvas(e.currentTarget).then(()=>drawStroke(ctx,pen.current,w,h));}
async function onUp(e){if(!pen.drawing||!pen.current)return;e.preventDefault();pen.drawing=false;const s=pen.current;pen.current=null;if(s.points.length<2)return;s.points=s.points.map(p=>compact(p,s.started));delete s.started;const pr=progress(),k=key(pr.attemptId,s.questionId),arr=await loadQuestion(pr.attemptId,s.questionId);arr.push(s);cache.set(k,arr);await setQuestionInk(pr.attemptId,s.questionId,arr);undoStack.push({attemptId:pr.attemptId,questionId:s.questionId,stroke:s});redoStack.length=0;markTouched(state.activePackId,s.questionId);await renderQuestionCanvas(e.currentTarget)}

export function bindInkCanvases(){document.querySelectorAll('.question-ink').forEach(c=>{c.onpointerdown=onDown;c.onpointermove=onMove;c.onpointerup=onUp;c.onpointercancel=onUp;c.oncontextmenu=e=>e.preventDefault()});renderAllInk()}

export function setPenTool(tool){pen.tool=tool;document.body.dataset.penTool=tool}
export function setPenColor(color){pen.color=color;pen.tool='pen';document.body.dataset.penTool='pen'}
export function setPenSize(size){pen.size=size;updatePrefs({penSize:size})}
export async function undoInk(){const pr=progress();let action;while(undoStack.length){const a=undoStack.pop();if(a.attemptId===pr?.attemptId){action=a;break}}if(!action)return false;const arr=await loadQuestion(action.attemptId,action.questionId),idx=arr.findIndex(x=>x.id===action.stroke.id);if(idx>=0)arr.splice(idx,1);await setQuestionInk(action.attemptId,action.questionId,arr);redoStack.push(action);await renderAllInk();return true}
export async function redoInk(){const pr=progress();let action;while(redoStack.length){const a=redoStack.pop();if(a.attemptId===pr?.attemptId){action=a;break}}if(!action)return false;const k=key(action.attemptId,action.questionId),arr=await loadQuestion(action.attemptId,action.questionId);arr.push(action.stroke);cache.set(k,arr);await setQuestionInk(action.attemptId,action.questionId,arr);undoStack.push(action);await renderAllInk();return true}
export async function clearPageInk(){const pr=progress();if(!pr)return;const qids=[...document.querySelectorAll('.question')].map(q=>q.dataset.questionId);for(const qid of qids){cache.set(key(pr.attemptId,qid),[]);await setQuestionInk(pr.attemptId,qid,[])}saveState();await renderAllInk()}
export function resizeInk(){requestAnimationFrame(()=>renderAllInk())}
function updateInputBadge(){const el=document.querySelector('#inputDeviceBadge');if(el)el.textContent=`入力: ${pen.lastInput.type} / 筆圧 ${pen.lastInput.pressure.toFixed(2)}`}

export async function getQuestionStrokesForExport(attemptId,qid){return loadQuestion(attemptId,qid)}
