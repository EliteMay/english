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

test('runtime no longer loads patch stack',async({page})=>{
  await page.goto('/');const srcs=await page.locator('script[src]').evaluateAll(xs=>xs.map(x=>x.getAttribute('src')));expect(srcs).toHaveLength(1);expect(srcs[0]).toContain('js/v060/app.js');
});
