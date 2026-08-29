let exportCssCache='';

function submissionWorkedPages(){
  const out=[];
  for(const [pid,pr] of Object.entries(state.packProgress)){
    const p=packById(pid);if(!p)continue;
    const pages=Math.ceil(p.questions.length/PAGE_SIZE);
    for(let page=0;page<pages;page++){
      const qs=p.questions.slice(page*PAGE_SIZE,(page+1)*PAGE_SIZE);
      const hasInk=(pr.inkPages?.[page]||[]).length>0;
      const hasGrade=qs.some(q=>pr.selfGrades?.[q.id]);
      if(hasInk||hasGrade)out.push({pack:p,progress:pr,page});
    }
  }
  return out;
}

function exportOverlay(show,text='提出ZIPを作成しています…'){
  let el=document.getElementById('exportOverlay');
  if(show){
    if(!el){
      el=document.createElement('div');el.id='exportOverlay';el.className='export-overlay';
      el.innerHTML='<div class="export-dialog"><strong>ChatGPT提出ZIP</strong><span id="exportOverlayText"></span><div class="export-spinner"></div></div>';
      document.body.appendChild(el);
    }
    document.getElementById('exportOverlayText').textContent=text;el.classList.add('show');
  }else if(el)el.classList.remove('show');
}
function exportOverlayText(text){const el=document.getElementById('exportOverlayText');if(el)el.textContent=text}
function nextPaint(){return new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))}
function safeFileName(v){return String(v||'worksheet').replace(/[\\/:*?"<>|]/g,'_').replace(/\s+/g,'_').slice(0,70)}

async function getExportCss(){
  if(exportCssCache)return exportCssCache;
  const base=await fetch('./css/styles.css?v=0.4.0',{cache:'no-store'}),extra=await fetch('./css/paper-v040.css?v=0.4.0',{cache:'no-store'});if(!base.ok||!extra.ok)throw new Error('CSSを読み込めませんでした');
  exportCssCache=(await base.text())+'\n'+(await extra.text());return exportCssCache;
}

function syncFormValues(source,clone){
  const a=[...source.querySelectorAll('input,textarea,select')],b=[...clone.querySelectorAll('input,textarea,select')];
  a.forEach((el,i)=>{const c=b[i];if(!c)return;if(el.tagName==='TEXTAREA')c.textContent=el.value;else if(el.tagName==='SELECT'){[...c.options].forEach((o,j)=>o.selected=j===el.selectedIndex)}else c.setAttribute('value',el.value)});
}

async function paperToPngBlob(){
  const paper=$('#paper'),ink=$('#inkCanvas');if(!paper||!ink)throw new Error('問題用紙が見つかりません');
  await document.fonts?.ready;await nextPaint();resizeCanvas();renderInk();await nextPaint();
  const width=Math.ceil(paper.clientWidth),height=Math.ceil(paper.scrollHeight);
  const clone=paper.cloneNode(true);syncFormValues(paper,clone);clone.removeAttribute('id');clone.style.width=width+'px';clone.style.height=height+'px';clone.style.minHeight=height+'px';clone.classList.add('export-paper');
  const clonedCanvas=clone.querySelector('canvas');if(clonedCanvas){const img=document.createElement('img');img.src=ink.toDataURL('image/png');img.setAttribute('style','position:absolute;inset:0;width:100%;height:100%;z-index:6;pointer-events:none;');clonedCanvas.replaceWith(img)}
  clone.querySelectorAll('.reason-box.hidden').forEach(x=>x.remove());
  const css=await getExportCss();
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('xmlns','http://www.w3.org/2000/svg');svg.setAttribute('width',width);svg.setAttribute('height',height);svg.setAttribute('viewBox',`0 0 ${width} ${height}`);
  const fo=document.createElementNS('http://www.w3.org/2000/svg','foreignObject');fo.setAttribute('width','100%');fo.setAttribute('height','100%');
  const wrap=document.createElementNS('http://www.w3.org/1999/xhtml','div');wrap.setAttribute('xmlns','http://www.w3.org/1999/xhtml');wrap.style.width=width+'px';wrap.style.height=height+'px';
  const style=document.createElementNS('http://www.w3.org/1999/xhtml','style');style.textContent=css+'\nhtml,body{margin:0!important;background:#fff!important}.export-paper{box-shadow:none!important;border-radius:0!important;margin:0!important}';wrap.appendChild(style);wrap.appendChild(clone);fo.appendChild(wrap);svg.appendChild(fo);
  const text=new XMLSerializer().serializeToString(svg),url=URL.createObjectURL(new Blob([text],{type:'image/svg+xml;charset=utf-8'}));
  try{
    const img=await new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(new Error('問題用紙の画像化に失敗しました'));im.src=url});
    const scale=Math.min(2,devicePixelRatio||1.5),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(width*scale));canvas.height=Math.max(1,Math.round(height*scale));const ctx=canvas.getContext('2d');ctx.scale(scale,scale);ctx.fillStyle='#fbfbf8';ctx.fillRect(0,0,width,height);ctx.drawImage(img,0,0,width,height);
    return await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('PNG生成に失敗しました')),'image/png'));
  }finally{URL.revokeObjectURL(url)}
}

function utf8(s){return new TextEncoder().encode(s)}
let crcTable=null;
function crc32(bytes){
  if(!crcTable){crcTable=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=(c&1)?0xedb88320^(c>>>1):c>>>1;crcTable[n]=c>>>0}}
  let c=0xffffffff;for(const b of bytes)c=crcTable[(c^b)&255]^(c>>>8);return (c^0xffffffff)>>>0;
}
function dosTimeDate(date=new Date()){let y=Math.max(1980,date.getFullYear());return {time:(date.getHours()<<11)|(date.getMinutes()<<5)|(date.getSeconds()>>1),date:((y-1980)<<9)|((date.getMonth()+1)<<5)|date.getDate()}}
function u16(v){return [v&255,(v>>>8)&255]}
function u32(v){return [v&255,(v>>>8)&255,(v>>>16)&255,(v>>>24)&255]}
async function zipFileEntry(name,data){
  const bytes=data instanceof Uint8Array?data:new Uint8Array(await data.arrayBuffer?.()||utf8(String(data)).buffer);return {name,bytes,crc:crc32(bytes)};
}
async function createStoredZip(files){
  const entries=[];for(const f of files)entries.push(await zipFileEntry(f.name,f.data));
  const chunks=[],central=[];let offset=0;const td=dosTimeDate();
  for(const e of entries){
    const n=utf8(e.name),size=e.bytes.length;
    const local=new Uint8Array([80,75,3,4,...u16(20),...u16(0x0800),...u16(0),...u16(td.time),...u16(td.date),...u32(e.crc),...u32(size),...u32(size),...u16(n.length),...u16(0),...n]);
    chunks.push(local,e.bytes);
    const c=new Uint8Array([80,75,1,2,...u16(20),...u16(20),...u16(0x0800),...u16(0),...u16(td.time),...u16(td.date),...u32(e.crc),...u32(size),...u32(size),...u16(n.length),...u16(0),...u16(0),...u16(0),...u16(0),...u32(0),...u32(offset),...n]);
    central.push(c);offset+=local.length+size;
  }
  const centralSize=central.reduce((n,c)=>n+c.length,0),end=new Uint8Array([80,75,5,6,...u16(0),...u16(0),...u16(entries.length),...u16(entries.length),...u32(centralSize),...u32(offset),...u16(0)]);
  return new Blob([...chunks,...central,end],{type:'application/zip'});
}

function workedQuestionsJson(worked){
  const ids=[...new Set(worked.map(x=>x.pack.id))];return {exportedAt:new Date().toISOString(),packs:ids.map(pid=>packById(pid)).filter(Boolean)};
}
function submissionReadme(worked){
  const pages=worked.length,packs=new Set(worked.map(x=>x.pack.id)).size;
  return `このZIPは English Worksheet Lab で実際に解いた問題用紙です。\n\n優先して見てほしいもの:\n1. papers/ のPNG。手書きのS/V、丸、下線、括弧、矢印、書き直しを見て、最終回答だけでなく途中の読み方を分析してください。\n2. learning-data.json。自己採点・過去結果・どの問題に書き込んだかなど、画像だけでは分からない補助情報です。\n3. questions.json。出題内容と正答基準です。\n\n収録: ${packs}セット / ${pages}ページ\n\n${analysisPrompt()}\n`;
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
      const w=worked[i];state.activePackId=w.pack.id;currentPage=w.page;const pr=progress(w.pack.id);if(!reviewBackup.has(w.pack.id))reviewBackup.set(w.pack.id,pr.reviewMode);pr.reviewMode=false;pr.currentPage=w.page;renderPractice();setMode('pen',false);await nextPaint();
      exportOverlayText(`問題用紙を画像化しています… ${i+1} / ${worked.length}`);
      const png=await paperToPngBlob(),name=`papers/${safeFileName(w.pack.title)}_page${String(w.page+1).padStart(2,'0')}.png`;files.push({name,data:png});
    }
    exportOverlayText('学習履歴とZIPをまとめています…');
    files.push({name:'learning-data.json',data:utf8(JSON.stringify(exportLearningData(),null,2))});
    files.push({name:'questions.json',data:utf8(JSON.stringify(workedQuestionsJson(worked),null,2))});
    files.push({name:'ChatGPTに見てほしいこと.txt',data:utf8(submissionReadme(worked))});
    const zip=await createStoredZip(files),a=document.createElement('a');a.href=URL.createObjectURL(zip);a.download=`english_submission_${new Date().toISOString().slice(0,10)}.zip`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);toast('ChatGPT提出ZIPを作成しました');
  }catch(err){console.error(err);toast('ZIP作成に失敗しました: '+err.message)}finally{
    reviewBackup.forEach((v,pid)=>progress(pid).reviewMode=v);state.activePackId=original.packId;currentPage=original.page;if(original.packId)progress(original.packId).currentPage=original.page;save();openView(original.view);setMode('pen',false);exportOverlay(false);
  }
}
