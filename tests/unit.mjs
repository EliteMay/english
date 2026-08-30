import assert from 'node:assert/strict';
import {validateBackup,validateAnalysis} from '../js/app/validation.js';
import {APP,PROJECT} from '../js/app/meta.js';

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
assert.equal(PROJECT.guideVersion,'1.1.0');
assert.deepEqual(PROJECT.profiles,['STATIC','DATA','MEDIA','AI-HANDOFF','TOOL']);

console.log('OK unit: import validation and project metadata');
