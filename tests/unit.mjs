import assert from 'node:assert/strict';
import {validateBackup,validateAnalysis} from '../js/app/validation.js';
import {APP,PROJECT} from '../js/app/meta.js';
import {sanitizeDiagnosticText,sanitizeDiagnosticValue,buildDiagnosticSnapshot,clearDiagnostics,diagnosticEvent,diagnosticSummary} from '../js/app/diagnostics.js';

const backup={schema:'english-worksheet-backup-v2',state:{packProgress:{},sessions:[]},prefs:{},stores:{ink:[],legacyInk:[],paperSnapshots:[],archives:[]}};
assert.equal(validateBackup(backup).ok,true);
assert.equal(validateBackup({...backup,stores:{}}).ok,false);
assert.equal(validateBackup({...backup,state:null}).ok,false);

const analysis={weaknessAnalysisVersion:2,summary:'ok',weaknesses:[],strengths:[],nextTargets:[],skillProfile:[],readingHabits:[],siteRecommendations:[]};
assert.equal(validateAnalysis(analysis).ok,true);
assert.equal(validateAnalysis({...analysis,weaknessAnalysisVersion:1}).ok,false);
assert.equal(validateAnalysis({...analysis,weaknesses:{}}).ok,false);

assert.match(APP.version,/^v\d+\.\d+\.\d+$/);
assert.ok(APP.build);
assert.equal(PROJECT.guideVersion,'1.10.0');
assert.equal(PROJECT.remoteDiagnostics,false);
assert.deepEqual(PROJECT.profiles,['STATIC','DATA','MEDIA','AI-HANDOFF','TOOL']);

assert.equal(sanitizeDiagnosticText('https://example.com/path?token=SECRET#x'),'https://example.com/path');
assert.match(sanitizeDiagnosticText('Authorization=Bearer sk-abcdefghijklmnopqrstuvwxyz'),/\[redacted\]/);
const safe=sanitizeDiagnosticValue({apiKey:'SECRET',message:'ok',nested:{password:'hidden'}});
assert.equal(safe.apiKey,'[redacted]');
assert.equal(safe.nested.password,'[redacted]');
clearDiagnostics();
for(let i=0;i<140;i++)diagnosticEvent('test.event',{i});
const summary=diagnosticSummary();
assert.equal(summary.events,120);
const snapshot=buildDiagnosticSnapshot({usage:1234,quota:5678,summary:{sessions:2}});
assert.equal(snapshot.schemaVersion,2);
assert.equal(snapshot.project.projectKey,'english-worksheet-lab');
assert.equal(snapshot.handoff.sanitized,true);
assert.equal(snapshot.handoff.remoteEligible,false);
assert.equal(snapshot.handoff.containsBinary,false);
assert.equal(snapshot.handoff.containsSecrets,false);
assert.equal(snapshot.storage.estimatedUsageBytes,1234);

console.log('OK unit: import validation, project metadata, and local diagnostics');
