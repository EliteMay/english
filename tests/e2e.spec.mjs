import {test,expect} from '@playwright/test';

test('paper geometry and question-local ink survive answer check',async({page})=>{
  await page.goto('/');
  await expect(page.locator('#packGrid .pack-card').first()).toBeVisible();
  await page.locator('[data-start-pack]').first().click();
  await expect(page.locator('#paper .question').first()).toBeVisible();
  const before=await page.locator('#paper .question').evaluateAll(qs=>qs.slice(0,3).map(q=>({top:q.offsetTop,height:q.offsetHeight,width:q.offsetWidth})));
  const canvas=page.locator('.question-ink').nth(1);const box=await canvas.boundingBox();
  await page.mouse.move(box.x+80,box.y+45);await page.mouse.down();await page.mouse.move(box.x+180,box.y+55,{steps:8});await page.mouse.up();
  await page.locator('#finishBtn').click();
  await expect(page.locator('#reviewPanel')).toBeVisible();
  const after=await page.locator('#paper .question').evaluateAll(qs=>qs.slice(0,3).map(q=>({top:q.offsetTop,height:q.offsetHeight,width:q.offsetWidth})));
  for(let i=0;i<before.length;i++){
    expect(after[i].height).toBe(before[i].height);
    expect(after[i].width).toBe(before[i].width);
    expect(Math.abs(after[i].top-before[i].top)).toBeLessThanOrEqual(2);
  }
  const q2=page.locator('#paper .question').nth(1),c2=page.locator('.question-ink').nth(1);
  const sizes=await Promise.all([q2.evaluate(q=>[q.clientWidth,q.clientHeight]),c2.evaluate(c=>[parseFloat(c.style.width),parseFloat(c.style.height)])]);
  expect(sizes[1][0]).toBeCloseTo(sizes[0][0],0);expect(sizes[1][1]).toBeCloseTo(sizes[0][1],0);
});

test('answer check stays two-pane without page overflow or floating footer',async({page})=>{
  await page.goto('/');
  await page.locator('[data-start-pack]').first().click();
  await page.locator('#finishBtn').click();
  await expect(page.locator('#reviewPanel')).toBeVisible();
  await expect(page.locator('.review-finish-proxy')).toBeVisible();
  await expect(page.locator('.practice-footer')).toBeHidden();
  const metrics=await page.evaluate(()=>({
    viewport:innerWidth,
    pageWidth:document.documentElement.scrollWidth,
    paperWidth:document.querySelector('#paper')?.getBoundingClientRect().width||0,
    paperPaneWidth:document.querySelector('.paper-pane')?.getBoundingClientRect().width||0,
    reviewWidth:document.querySelector('#reviewPanel')?.getBoundingClientRect().width||0,
    zoom:parseFloat(getComputedStyle(document.querySelector('#paper')).zoom||'1')
  }));
  expect(metrics.pageWidth).toBeLessThanOrEqual(metrics.viewport+2);
  expect(metrics.paperPaneWidth).toBeGreaterThan(360);
  expect(metrics.reviewWidth).toBeGreaterThan(320);
  expect(metrics.paperWidth).toBeGreaterThan(360);
  expect(metrics.zoom).toBeGreaterThanOrEqual(.45);
  expect(metrics.zoom).toBeLessThanOrEqual(1);
});

test('low-height review keeps finish action visible without covering the first answer',async({page})=>{
  await page.setViewportSize({width:1280,height:640});
  await page.goto('/');
  await page.locator('[data-start-pack]').first().click();
  await page.locator('#finishBtn').click();
  const action=page.locator('.review-finish-proxy'),first=page.locator('.review-item').first();
  await expect(action).toBeVisible();await expect(first).toBeVisible();
  const [a,f]=await Promise.all([action.boundingBox(),first.boundingBox()]);
  expect(a.y+a.height).toBeLessThanOrEqual(f.y+2);
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
  expect(overflow).toBeLessThanOrEqual(2);
});

test('small viewport keeps primary navigation and library usable without page overflow',async({page})=>{
  await page.setViewportSize({width:390,height:780});
  await page.goto('/');
  await expect(page.locator('#menuBtn')).toBeVisible();
  await expect(page.locator('#packGrid .pack-card').first()).toBeVisible();
  await expect(page.locator('[data-start-pack]').first()).toBeVisible();
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
  expect(overflow).toBeLessThanOrEqual(2);
});

test('data dialog exposes bounded local diagnostics and download handoff',async({page})=>{
  await page.goto('/');
  await page.locator('#dataBtn').click();
  await expect(page.locator('#dataDialog')).toBeVisible();
  await expect(page.locator('#dataStats.data-stats')).toBeVisible();
  await expect(page.locator('#backupBtn')).toBeVisible();
  await expect(page.locator('#restoreRecoveryBtn')).toBeVisible();
  await expect(page.locator('#diagnoseBtn')).toBeVisible();
  await expect(page.locator('#downloadDiagnosticsBtn')).toBeVisible();
  await expect(page.locator('#clearDiagnosticsBtn')).toBeVisible();
  await expect(page.locator('#runtimeDiagnosticsSummary')).toContainText('開発診断:');
  const downloadPromise=page.waitForEvent('download');
  await page.locator('#downloadDiagnosticsBtn').click();
  const download=await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^english_diagnostics_.*\.json$/);
});

test('runtime uses stable non-versioned paths',async({page})=>{
  await page.goto('/');
  const srcs=await page.locator('script[src]').evaluateAll(xs=>xs.map(x=>x.getAttribute('src')));
  expect(srcs).toHaveLength(1);expect(srcs[0]).toBe('./js/app/app.js');
  const styles=await page.locator('link[rel="stylesheet"]').evaluateAll(xs=>xs.map(x=>x.getAttribute('href')));
  expect(styles).toContain('./css/app.css');
  expect(styles.some(x=>/v\d{3}|\?b=/.test(x))).toBe(false);
});
