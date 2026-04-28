const { test, expect } = require('@playwright/test');
const path = require('path');

const FILE_URL = 'file:///' + path.resolve(__dirname, 'shopping-list.html').replace(/\\/g, '/');

test.beforeEach(async ({ page }) => {
  await page.goto(FILE_URL);
  // localStorage 초기화로 테스트 격리
  await page.evaluate(() => localStorage.removeItem('shoppingList'));
  await page.reload();
});

// ── 1. 아이템 추가 ──────────────────────────────────────────────
test('아이템 추가 - 버튼 클릭', async ({ page }) => {
  await page.fill('#itemInput', '사과');
  await page.click('.btn-add');

  const item = page.locator('.item-text', { hasText: '사과' });
  await expect(item).toBeVisible();
  console.log('✅ 아이템 추가 (버튼 클릭) 성공');
});

test('아이템 추가 - Enter 키', async ({ page }) => {
  await page.fill('#itemInput', '바나나');
  await page.press('#itemInput', 'Enter');

  const item = page.locator('.item-text', { hasText: '바나나' });
  await expect(item).toBeVisible();
  console.log('✅ 아이템 추가 (Enter 키) 성공');
});

test('아이템 추가 - 입력창 초기화 확인', async ({ page }) => {
  await page.fill('#itemInput', '딸기');
  await page.click('.btn-add');

  await expect(page.locator('#itemInput')).toHaveValue('');
  console.log('✅ 추가 후 입력창 초기화 성공');
});

test('아이템 추가 - 빈 입력 무시', async ({ page }) => {
  await page.click('.btn-add');

  await expect(page.locator('#empty')).toBeVisible();
  console.log('✅ 빈 입력 무시 성공');
});

test('아이템 추가 - 여러 개 추가', async ({ page }) => {
  const items = ['우유', '계란', '빵', '버터'];
  for (const name of items) {
    await page.fill('#itemInput', name);
    await page.press('#itemInput', 'Enter');
  }

  const listItems = page.locator('.item-text');
  await expect(listItems).toHaveCount(4);
  console.log('✅ 여러 아이템 추가 성공 (4개)');
});

// ── 2. 아이템 체크 ──────────────────────────────────────────────
test('체크 - 체크박스 클릭 시 완료 표시', async ({ page }) => {
  await page.fill('#itemInput', '오렌지');
  await page.press('#itemInput', 'Enter');

  const li = page.locator('li').first();
  await li.locator('.checkbox').click();

  await expect(li).toHaveClass(/checked/);
  console.log('✅ 체크 기능 성공');
});

test('체크 - 텍스트 클릭으로도 체크 가능', async ({ page }) => {
  await page.fill('#itemInput', '포도');
  await page.press('#itemInput', 'Enter');

  const li = page.locator('li').first();
  await li.locator('.item-text').click();

  await expect(li).toHaveClass(/checked/);
  console.log('✅ 텍스트 클릭 체크 성공');
});

test('체크 - 재클릭 시 체크 해제', async ({ page }) => {
  await page.fill('#itemInput', '망고');
  await page.press('#itemInput', 'Enter');

  const li = page.locator('li').first();
  await li.locator('.checkbox').click(); // 체크
  await li.locator('.checkbox').click(); // 해제

  await expect(li).not.toHaveClass(/checked/);
  console.log('✅ 체크 해제 성공');
});

test('체크 - 완료 카운터 반영', async ({ page }) => {
  const items = ['토마토', '양파'];
  for (const name of items) {
    await page.fill('#itemInput', name);
    await page.press('#itemInput', 'Enter');
  }

  await page.locator('li').first().locator('.checkbox').click();

  await expect(page.locator('.stats .done')).toHaveText('완료 1개');
  console.log('✅ 완료 카운터 반영 성공');
});

// ── 3. 아이템 삭제 ──────────────────────────────────────────────
test('삭제 - 단일 아이템 삭제', async ({ page }) => {
  await page.fill('#itemInput', '참외');
  await page.press('#itemInput', 'Enter');

  await page.locator('li').first().locator('.btn-delete').click();

  await expect(page.locator('#empty')).toBeVisible();
  console.log('✅ 아이템 삭제 성공');
});

test('삭제 - 특정 아이템만 삭제', async ({ page }) => {
  await page.fill('#itemInput', '수박');
  await page.press('#itemInput', 'Enter');
  await page.fill('#itemInput', '메론');
  await page.press('#itemInput', 'Enter');

  // 첫 번째 아이템(메론, 최신 추가됨) 삭제
  await page.locator('li').first().locator('.btn-delete').click();

  await expect(page.locator('.item-text', { hasText: '수박' })).toBeVisible();
  await expect(page.locator('.item-text', { hasText: '메론' })).not.toBeVisible();
  console.log('✅ 특정 아이템 선택 삭제 성공');
});

// ── 4. 완료 항목 일괄 삭제 ─────────────────────────────────────
test('완료 항목 삭제 - 버튼 노출 조건', async ({ page }) => {
  await page.fill('#itemInput', '키위');
  await page.press('#itemInput', 'Enter');

  // 체크 전엔 버튼 숨김
  await expect(page.locator('#btnClear')).toBeHidden();

  await page.locator('li').first().locator('.checkbox').click();

  // 체크 후엔 버튼 노출
  await expect(page.locator('#btnClear')).toBeVisible();
  console.log('✅ 완료 항목 삭제 버튼 노출 조건 성공');
});

test('완료 항목 일괄 삭제', async ({ page }) => {
  const items = ['레몬', '라임', '자몽'];
  for (const name of items) {
    await page.fill('#itemInput', name);
    await page.press('#itemInput', 'Enter');
  }

  // 두 개 체크
  const listItems = page.locator('li');
  await listItems.nth(0).locator('.checkbox').click();
  await listItems.nth(1).locator('.checkbox').click();

  await page.click('#btnClear');

  // 완료 2개 삭제 → 1개 남음
  await expect(page.locator('.item-text')).toHaveCount(1);
  console.log('✅ 완료 항목 일괄 삭제 성공 (2개 삭제, 1개 잔존)');
});

// ── 5. localStorage 영속성 ────────────────────────────────────
test('localStorage - 새로고침 후 데이터 유지', async ({ page }) => {
  await page.fill('#itemInput', '파인애플');
  await page.press('#itemInput', 'Enter');

  await page.reload();

  await expect(page.locator('.item-text', { hasText: '파인애플' })).toBeVisible();
  console.log('✅ localStorage 영속성 성공');
});

// ── 6. XSS 방어 ──────────────────────────────────────────────
test('XSS - 스크립트 태그 이스케이프', async ({ page }) => {
  const xssPayload = '<script>alert("xss")</script>';
  await page.fill('#itemInput', xssPayload);
  await page.press('#itemInput', 'Enter');

  // alert가 뜨지 않았고, 텍스트로 표시됨
  const item = page.locator('.item-text').first();
  await expect(item).toBeVisible();
  const text = await item.textContent();
  expect(text).toContain('<script>');
  console.log('✅ XSS 방어 성공');
});
