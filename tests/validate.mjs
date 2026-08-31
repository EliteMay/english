import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {APP,PROJECT} from '../js/app/meta.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const json=p=>JSON.parse(read(p));
const assert=(x,m)=>{if(!x)throw new Error(m)};
const walk=dir=>fs.readdirSync(path.join(root,dir),{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);
const GUIDE_BASELINE_SHA='c526f3fc37c89972480b69b249ace017437f6813';

const manifest=json('data/packs/index.json'),pedagogy=json('data/pedagogy.json'),pkg=json('package.json'),diagnosticSchema=json('data/diagnostics.schema.json');
assert(pkg.version===APP.version.replace(/^v/,''),'package version must match js/app/meta.js');
assert(PROJECT.guideVersion==='1.10.0','guide adoption version mismatch');
assert(PROJECT.profiles.join('+')==='STATIC+DATA+MEDIA+AI-HANDOFF+TOOL','project profiles mismatch');
assert(PROJECT.remoteDiagnostics===false,'remote diagnostics must remain opt-in/disabled');
assert(manifest.paperSchemaVersion===APP.paperSchema,'paperSchemaVersion must match APP.paperSchema');
assert(manifest.expectedCounts?.packs&&manifest.expectedCounts?.questions,'expectedCounts missing');
assert(pedagogy.modes?.skeleton&&pedagogy.modes?.range&&pedagogy.modes?.structure,'pedagogy modes missing');
assert(diagnosticSchema.schemaVersion===2,'diagnostics schema must be v2');
assert(diagnosticSchema.project?.projectKey===PROJECT.key,'diagnostics projectKey mismatch');
assert(diagnosticSchema.handoff?.remoteEligible===false,'diagnostics schema remoteEligible must default false');
assert(diagnosticSchema.handoff?.containsBinary===false&&diagnosticSchema.handoff?.containsSecrets===false,'diagnostics safe defaults missing');

const packs=manifest.files.flatMap(f=>json('data/packs/'+f)),questions=packs.flatMap(p=>p.questions.map(q=>({p,q})));
assert(packs.length===manifest.expectedCounts.packs,`pack count ${packs.length}`);
assert(questions.length===manifest.expectedCounts.questions,`question count ${questions.length}`);
const pids=packs.map(p=>p.id),qids=questions.map(x=>x.q.id);
assert(new Set(pids).size===pids.length,'duplicate pack id');
assert(new Set(qids).size===qids.length,'duplicate question id');

const types=new Set(['fields','choice','manual','reorder','passage']),modes=new Set(Object.keys(pedagogy.modes));
for(const{p,q}of questions){
  assert(q.id&&q.prompt&&q.skill,`${p.id}: missing fields ${q.id}`);
  assert(types.has(q.type),`${q.id}: unsupported type`);
  if(q.studyMode)assert(modes.has(q.studyMode),`${q.id}: invalid studyMode`);
  if(q.type==='choice')assert(Array.isArray(q.choices)&&q.choices.includes(q.answer),`${q.id}: bad choice`);
  if(q.type==='fields')for(const f of q.fields||[])assert(f.id&&f.label&&Array.isArray(f.answers)&&f.answers.length,`${q.id}: bad field`);
}

const curriculum=json('data/curriculum.json');
assert(pids.every(id=>curriculum.packs?.[id]),'pack missing in curriculum');
json('data/analysis-return.schema.json');json('data/legacy/foundation-sv-v051.json');json('data/legacy/sv-phrase-boundary-v051.json');

for(const requiredRoot of['README.md','CHANGELOG.md','PROJECT_LEARNINGS.md','AGENTS.md','作業報告書.md'])assert(fs.existsSync(path.join(root,requiredRoot)),`missing project memory/router file: ${requiredRoot}`);

const html=read('index.html'),refs=[...html.matchAll(/(?:src|href)="\.\/([^"?#]+)(?:\?[^"#]*)?"/g)].map(m=>m[1]);
for(const r of refs)assert(fs.existsSync(path.join(root,r)),`broken ref ${r}`);
for(const required of['js/app/app.js','css/app.css','css/review.css','css/accessibility.css'])assert(refs.includes(required),`runtime ref missing: ${required}`);
assert(!html.includes('?b='),'manual cache-bust version remains in HTML');
assert(!refs.some(r=>/(^|\/)v\d{3}(\/|$)|app-v\d/i.test(r)),'versioned runtime path is loaded');
assert(!fs.existsSync(path.join(root,'js/v060')),'old versioned runtime directory remains');
assert(!fs.existsSync(path.join(root,'css/app-v060.css')),'old versioned CSS remains');
assert(html.includes('id="dataStats" class="data-stats"'),'data dialog styling hook missing');
assert(html.includes('id="downloadDiagnosticsBtn"'),'diagnostic export control missing');
assert(html.includes('id="clearDiagnosticsBtn"'),'diagnostic clear control missing');

for(const f of['meta.js','validation.js','diagnostics.js','db.js','state.js','data.js','library.js','practice.js','review-layout.js','ink.js','results.js','analysis.js','export.js','app.js'])assert(fs.existsSync(path.join(root,'js/app',f)),`missing js/app/${f}`);
const app=read('js/app/app.js'),ink=read('js/app/ink.js'),state=read('js/app/state.js'),practice=read('js/app/practice.js'),reviewLayout=read('js/app/review-layout.js'),diagnostics=read('js/app/diagnostics.js');
assert(ink.includes('getQuestionInk')&&ink.includes('questionId'),'question-local ink missing');
assert(state.includes('paperSnapshotId')&&state.includes('paperRevision'),'paper snapshot missing');
assert(app.includes('expectedCounts')&&!app.includes('===14')&&!app.includes('===188'),'diagnostic hardcode remains');
assert(app.includes('validateBackup'),'backup import validation missing');
assert(read('js/app/analysis.js').includes('validateAnalysis'),'analysis import validation missing');
assert(!reviewLayout.includes('MutationObserver'),'review layout must not patch renderer with MutationObserver');
assert(practice.includes('class="review-finish-proxy"'),'review finish action must be rendered by practice renderer');
assert(practice.includes('appVersion:APP.version'),'session version must use metadata source');
assert(!/appVersion:\s*['"]v\d/.test(practice),'hardcoded session appVersion remains');
assert(diagnostics.includes('MAX_EVENTS=120'),'bounded diagnostic ring buffer missing');
assert(diagnostics.includes('remoteEligible:false'),'local-first diagnostic handoff default missing');
assert(!/fetch\s*\(|supabase/i.test(diagnostics),'diagnostics module must not auto-upload remotely');
assert(diagnostics.includes('containsBinary:false')&&diagnostics.includes('containsSecrets:false'),'diagnostic safe handoff metadata missing');

const workflow=read('.github/workflows/validate.yml'),dependabot=read('.github/dependabot.yml');
const pinnedBaseline=`EliteMay/web-project-guide/.github/workflows/reusable-web-baseline.yml@${GUIDE_BASELINE_SHA}`;
assert(workflow.includes(pinnedBaseline),'shared reusable baseline must be pinned to reviewed guide commit SHA');
assert(!/reusable-web-baseline\.yml@(main|master)\b/.test(workflow),'shared reusable baseline must not track a moving branch');
assert(workflow.includes('needs: baseline'),'project-specific validation must depend on common baseline');
assert(workflow.includes('Firefox UI test'),'English-specific Firefox E2E must remain local');
assert(workflow.includes('node tests/validate.mjs'),'English-specific validator must remain local');
assert(dependabot.includes('package-ecosystem: npm'),'npm Dependabot missing');
assert(dependabot.includes('package-ecosystem: github-actions'),'GitHub Actions Dependabot missing');
assert((dependabot.match(/interval:\s*weekly/g)||[]).length>=2,'Dependabot should use low-noise weekly schedules');
assert(!/auto.?merge/i.test(dependabot),'Dependabot config must not enable unconditional auto merge');

const publicText=['index.html',...walk('js/app').filter(f=>f.endsWith('.js')),...walk('data').filter(f=>f.endsWith('.json'))].map(read).join('\n');
assert(!/localhost|127\.0\.0\.1|[A-Za-z]:\\\\/.test(publicText),'localhost or PC absolute path found in public runtime/data');
assert(!/(sk-[A-Za-z0-9_-]{16,}|AIza[0-9A-Za-z_-]{20,}|SUPABASE_SERVICE_ROLE)/.test(publicText),'possible secret found in public files');
for(const f of walk('data').filter(f=>f.endsWith('.json')))assert(!/"data:[^"\s]+;base64,/i.test(read(f)),`Data URL found in public JSON: ${f}`);

const readme=read('README.md'),learnings=read('PROJECT_LEARNINGS.md'),agents=read('AGENTS.md');
assert(!/^##\s+v\d/m.test(readme),'README is becoming a version history dump; move history to CHANGELOG');
assert(readme.includes('STATIC + DATA + MEDIA + AI-HANDOFF + TOOL'),'README project profiles missing');
assert(readme.includes('1.10.0'),'README guide version stale');
assert(readme.includes('PROJECT_LEARNINGS.md'),'README project learnings route missing');
assert(/PL-F-\d{3}/.test(learnings)&&/PL-S-\d{3}/.test(learnings),'PROJECT_LEARNINGS lacks durable entries');
assert(agents.includes('Remote handoff: disabled'),'AGENTS remote diagnostics fallback missing');
assert(agents.includes('js/app/diagnostics.js'),'AGENTS diagnostics ownership missing');
assert(agents.includes('1.10.0'),'AGENTS guide version stale');

console.log(`OK ${APP.version} build ${APP.build}: ${packs.length} packs / ${questions.length} questions / ${refs.length} runtime refs / Guide ${PROJECT.guideVersion}`);
