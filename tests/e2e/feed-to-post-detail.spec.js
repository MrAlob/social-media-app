import { expect, test } from '@playwright/test';

async function mockFeedAndPostDetail(page) {
  await page.route('**/social/posts?*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: [
          {
            id: 'post-1',
            title: 'Feed Title',
            body: 'Feed body',
            created: '2025-01-01T00:00:00.000Z',
            author: { name: 'tester' },
            _count: { comments: 2, reactions: 4 },
          },
        ],
        meta: { isLastPage: true },
      }),
    });
  });

  await page.route('**/social/posts/*?*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          id: 'post-1',
          title: 'Detail Title',
          body: 'Detail body',
          created: '2025-01-01T00:00:00.000Z',
          author: { name: 'tester', email: 'tester@stud.noroff.no' },
          tags: ['sample'],
          comments: [
            { owner: { name: 'reader' }, body: 'Nice!', created: '2025-01-01T01:00:00.000Z' },
          ],
          reactions: [{ symbol: '👍', count: 1 }],
          _count: { comments: 1, reactions: 1 },
        },
      }),
    });
  });
}

test('feed item opens post detail', async ({ page }) => {
  await mockFeedAndPostDetail(page);

  // Start authenticated to land directly on feed.
  await page.addInitScript(() => {
    localStorage.setItem('accessToken', 'token-123');
    localStorage.setItem('userName', 'tester');
    localStorage.setItem('userEmail', 'tester@stud.noroff.no');
  });

  await page.goto('/#feed');
  await expect(page.getByRole('heading', { name: 'Feed', exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Open post' }).first().click();

  await expect(page).toHaveURL(/#post\?id=post-1/);
  await expect(page.getByRole('heading', { name: 'Detail Title' })).toBeVisible();
});
