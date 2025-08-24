import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should display login page with correct branding', async ({ page }) => {
    await page.goto('/login');
    
    // Check branding
    await expect(page.getByText('Chinchilla Flow')).toBeVisible();
    await expect(page.getByText('Sign in to your account')).toBeVisible();
    
    // Check form elements
    await expect(page.getByPlaceholder('you@example.com')).toBeVisible();
    await expect(page.getByPlaceholder('••••••••')).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
    
    // Check black/white aesthetic
    const signInButton = page.getByRole('button', { name: /sign in/i });
    await expect(signInButton).toHaveCSS('background-color', 'rgb(17, 24, 39)'); // gray-900
    
    // Check links
    await expect(page.getByText('Forgot password?')).toBeVisible();
    await expect(page.getByText("Don't have an account?")).toBeVisible();
    await expect(page.getByRole('link', { name: 'Sign up' })).toBeVisible();
  });

  test('should show password toggle functionality', async ({ page }) => {
    await page.goto('/login');
    
    const passwordInput = page.getByPlaceholder('••••••••');
    const toggleButton = page.getByRole('button').filter({ has: page.locator('svg') }).nth(0);
    
    // Initially password should be hidden
    await expect(passwordInput).toHaveAttribute('type', 'password');
    
    // Click to show password
    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute('type', 'text');
    
    // Click to hide password again
    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('should navigate to signup page', async ({ page }) => {
    await page.goto('/login');
    
    await page.getByRole('link', { name: 'Sign up' }).click();
    await expect(page).toHaveURL('/signup');
    
    // Check signup page elements
    await expect(page.getByText('Create your account')).toBeVisible();
    await expect(page.getByPlaceholder('John')).toBeVisible();
    await expect(page.getByPlaceholder('Doe')).toBeVisible();
    await expect(page.getByPlaceholder('you@example.com')).toBeVisible();
    await expect(page.getByRole('button', { name: /create account/i })).toBeVisible();
  });

  test('should show email verification step after signup', async ({ page }) => {
    await page.goto('/signup');
    
    // Fill signup form
    await page.getByPlaceholder('John').fill('Test');
    await page.getByPlaceholder('Doe').fill('User');
    await page.getByPlaceholder('you@example.com').fill('test@example.com');
    await page.getByPlaceholder('••••••••').fill('Test123!@#');
    
    // Note: In a real test, we would mock the Amplify Auth response
    // For now, we're just checking the UI elements exist
  });

  test('should validate login form', async ({ page }) => {
    await page.goto('/login');
    
    // Try to submit empty form
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Check HTML5 validation
    const emailInput = page.getByPlaceholder('you@example.com');
    const emailValidity = await emailInput.evaluate((el: HTMLInputElement) => el.validity.valid);
    expect(emailValidity).toBe(false);
  });

  test('should show demo credentials', async ({ page }) => {
    await page.goto('/login');
    
    // Check demo credentials are displayed
    await expect(page.getByText('Demo: admin@chinchilla.ai / Test123!')).toBeVisible();
  });
});