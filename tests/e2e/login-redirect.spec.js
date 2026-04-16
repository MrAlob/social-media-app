import { expect, test } from '@playwright/test';

async function mockAuthAndFeed(page) {
  await page.route('**/auth/login', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          accessToken: 'token-123',
          name: 'tester',
          email: 'tester@stud.noroff.no',
        },
      }),
    });
  });

  await page.route('**/social/posts?*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: [
          {
            id: 'post-1',
            title: 'Hello',
            body: 'Post body',
            created: '2025-01-01T00:00:00.000Z',
            author: { name: 'tester' },
            _count: { comments: 1, reactions: 1 },
          },
        ],
        meta: { isLastPage: true },
      }),
    });
  });
}

test('login redirects to feed', async ({ page }) => {
  await mockAuthAndFeed(page);
  await page.goto('/');

  await page.getByLabel('Email').fill('tester@stud.noroff.no');
  await page.getByLabel('Password').fill('password123');
  await page.getByRole('button', { name: 'Log In' }).click();

  await expect(page).toHaveURL(/#feed/);
  await expect(page.getByRole('heading', { name: 'Feed' })).toBeVisible();
});
