import { expect, test } from '@playwright/test';

async function mockCreatePostFlow(page) {
  await page.route('**/social/posts?*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: [
          {
            id: 'post-1',
            title: 'Existing post',
            body: 'Body',
            created: '2025-01-01T00:00:00.000Z',
            author: { name: 'tester' },
            _count: { comments: 0, reactions: 0 },
          },
        ],
        meta: { isLastPage: true },
      }),
    });
  });

  await page.route('**/social/posts', async (route) => {
    const payload = route.request().postDataJSON();

    expect(payload.title).toBe('Created from test');
    expect(payload.body).toBe('Post body from e2e');
    expect(payload.tags).toEqual(['test', 'e2e']);
    expect(payload.media).toEqual({
      url: 'https://example.com/photo.jpg',
      alt: 'Created from test',
    });

    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          id: 'new-post-1',
          ...payload,
        },
      }),
    });
  });
}

test('user can create a post and return to feed', async ({ page }) => {
  await mockCreatePostFlow(page);

  await page.addInitScript(() => {
    localStorage.setItem('accessToken', 'token-123');
    localStorage.setItem('userName', 'tester');
    localStorage.setItem('userEmail', 'tester@stud.noroff.no');
  });

  await page.goto('/#feed');
  await page.getByRole('button', { name: 'Create Post' }).click();

  await expect(page).toHaveURL(/#create/);
  await expect(page.getByRole('heading', { name: 'Create Post' })).toBeVisible();

  await page.getByLabel('Title').fill('Created from test');
  await page.getByLabel('Body').fill('Post body from e2e');
  await page.getByLabel('Tags').fill('test,e2e');
  await page.getByLabel('Media URL').fill('https://example.com/photo.jpg');

  await page.getByRole('button', { name: 'Create Post' }).click();

  await expect(page).toHaveURL(/#feed/);
  await expect(page.getByRole('heading', { name: 'Feed' })).toBeVisible();
});
