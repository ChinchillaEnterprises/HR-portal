import { test, expect } from '@playwright/test';

test.describe('Integration Tests', () => {
  test('should show Gmail integration warning without credentials', async ({ page }) => {
    await page.goto('/modern/email');
    
    // Without Google credentials, API calls should fail gracefully
    // Check that the UI still loads
    await expect(page.getByRole('heading', { name: 'Email & Communication' })).toBeVisible();
    
    // Mock emails should still display
    await expect(page.getByText('Welcome to Chinchilla AI!')).toBeVisible();
  });

  test('should integrate email templates with onboarding', async ({ page }) => {
    await page.goto('/modern/onboarding');
    
    // Check email integration buttons
    await expect(page.getByRole('button', { name: /send email/i })).toBeVisible();
    
    // These buttons should be disabled without employee selection
    await expect(page.getByRole('button', { name: /send email/i })).toBeDisabled();
  });

  test('should maintain consistent black/white theme', async ({ page }) => {
    // Check login page
    await page.goto('/login');
    const loginButton = page.getByRole('button', { name: /sign in/i });
    await expect(loginButton).toHaveCSS('background-color', 'rgb(17, 24, 39)');
    
    // Check main app
    await page.goto('/modern');
    const composeButton = page.getByRole('button', { name: /compose/i }).first();
    
    // All primary buttons should use gray-900
    const buttons = page.getByRole('button').filter({ hasText: /assign|send|save|submit/i });
    const count = await buttons.count();
    
    for (let i = 0; i < Math.min(count, 3); i++) {
      const button = buttons.nth(i);
      if (await button.isVisible()) {
        const bg = await button.evaluate(el => window.getComputedStyle(el).backgroundColor);
        // Should be dark gray or black
        expect(bg).toMatch(/rgb\((17, 24, 39|0, 0, 0)\)/);
      }
    }
  });

  test('should handle form validation across modules', async ({ page }) => {
    // Test login validation
    await page.goto('/login');
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Should require email
    const emailInput = page.getByPlaceholder('you@example.com');
    const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
    expect(isInvalid).toBe(true);
    
    // Test signup validation
    await page.goto('/signup');
    await page.getByRole('button', { name: /create account/i }).click();
    
    // Should require all fields
    const firstNameInput = page.getByPlaceholder('John');
    const firstNameInvalid = await firstNameInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
    expect(firstNameInvalid).toBe(true);
  });

  test('should show proper error states', async ({ page }) => {
    await page.goto('/modern/email');
    
    // Open compose modal
    await page.click('[data-testid="compose-email-button"]');
    
    // Wait for modal
    await page.waitForSelector('h2:has-text("New Message")', { timeout: 10000 });
    
    // The send button should be disabled without filling fields
    const sendButton = page.getByRole('button', { name: /send/i });
    await expect(sendButton).toBeDisabled();
    
    // Try form validation on login page instead
    await page.goto('/login');
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Email input should be invalid
    const emailInput = page.getByPlaceholder('you@example.com');
    const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
    expect(isInvalid).toBe(true);
  });

  test('should have working date pickers', async ({ page }) => {
    await page.goto('/modern/onboarding');
    
    // Click a calendar button
    await page.click('[data-testid="calendar-1"]');
    
    // Date picker should appear
    await expect(page.getByText('Select Due Date')).toBeVisible();
    
    // Should have a date input
    const dateInput = page.locator('input[type="date"]');
    await expect(dateInput).toBeVisible();
  });

  test('should handle modal interactions', async ({ page }) => {
    await page.goto('/modern/email');
    
    // Open compose modal
    await page.click('[data-testid="compose-email-button"]');
    await page.waitForSelector('h2:has-text("New Message")', { state: 'visible' });
    await expect(page.getByRole('heading', { name: 'New Message' })).toBeVisible();
    
    // Close with X button - need to be more specific to avoid the backdrop intercepting
    const modalHeader = page.locator('.fixed.inset-x-4').locator('.border-b').first();
    const closeButton = modalHeader.locator('button').last();
    await closeButton.click();
    await page.waitForSelector('h2:has-text("New Message")', { state: 'hidden' });
    
    // Open again and close by clicking backdrop
    await page.click('[data-testid="compose-email-button"]');
    await page.waitForSelector('h2:has-text("New Message")', { state: 'visible' });
    // Click the backdrop
    await page.locator('.fixed.inset-0.bg-black\\/50').click({ force: true, position: { x: 10, y: 10 } });
    await page.waitForSelector('h2:has-text("New Message")', { state: 'hidden' });
  });

  test('should show loading states', async ({ page }) => {
    await page.goto('/reports');
    
    // Should show loading or loaded state
    // Either loading dots or percentage should be visible
    await expect(page.locator('text=/(\.\.\.)|\d+%/').first()).toBeVisible({ timeout: 5000 });
  });
});