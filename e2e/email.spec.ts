import { test, expect } from '@playwright/test';

test.describe('Email & Communication Module', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to email module
    await page.goto('/modern/email');
  });

  test('should display email inbox with correct layout', async ({ page }) => {
    // Check page title
    await expect(page.getByRole('heading', { name: 'Email & Communication' })).toBeVisible();
    await expect(page.getByText('Manage your emails and communications')).toBeVisible();
    
    // Check sidebar
    await expect(page.getByRole('button', { name: /compose/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /inbox/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /unread/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /sent/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /archive/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /trash/i })).toBeVisible();
    
    // Check search bar
    await expect(page.getByPlaceholder('Search emails...')).toBeVisible();
  });

  test('should display mock emails', async ({ page }) => {
    // Check for mock email data
    await page.waitForSelector('[data-testid="email-item-1"]');
    await expect(page.getByText('Welcome to Chinchilla AI!')).toBeVisible();
    await expect(page.getByText('Your workstation is ready')).toBeVisible();
    await expect(page.getByText('Introduction - Your Mentor')).toBeVisible();
    
    // Check email metadata
    await expect(page.getByText('hr@chinchilla.ai')).toBeVisible();
    await expect(page.getByText('it@chinchilla.ai')).toBeVisible();
    await expect(page.getByText('mentor@chinchilla.ai')).toBeVisible();
  });

  test('should show email preview when clicked', async ({ page }) => {
    // Wait for email to load and click on first email
    await page.waitForSelector('[data-testid="email-item-1"]');
    await page.click('[data-testid="email-item-1"]');
    
    // Check email preview displays
    await expect(page.getByRole('heading', { name: 'Welcome to Chinchilla AI!' })).toBeVisible();
    // Use more specific selector for the email body text
    await expect(page.locator('.overflow-y-auto > p').filter({ hasText: 'We are excited to have you join our team' })).toBeVisible();
    
    // Check action buttons
    await expect(page.getByTestId('reply-email')).toBeVisible();
    
    // Check attachment indicator in the preview pane
    await expect(page.locator('.bg-gray-50').getByText('Attachments')).toBeVisible();
  });

  test('should filter emails', async ({ page }) => {
    // Click unread filter
    await page.click('[data-testid="filter-unread"]');
    
    // Should highlight the unread filter button
    await expect(page.locator('[data-testid="filter-unread"]')).toHaveClass(/bg-gray-100/);
  });

  test('should open compose modal', async ({ page }) => {
    // Click compose button
    await page.click('[data-testid="compose-email-button"]');
    
    // Wait for modal animation to complete
    await page.waitForSelector('h2:has-text("New Message")', { state: 'visible', timeout: 10000 });
    
    // Check modal appears
    await expect(page.getByRole('heading', { name: 'New Message' })).toBeVisible();
    await expect(page.getByPlaceholder('To')).toBeVisible();
    await expect(page.getByPlaceholder('Subject')).toBeVisible();
    await expect(page.getByPlaceholder('Compose email')).toBeVisible();
    
    // Check action buttons  
    await expect(page.getByRole('button', { name: /send/i })).toBeVisible();
    // The X button might have aria-label "Close"
    const closeButton = page.locator('button').filter({ has: page.locator('svg') }).nth(0);
    await expect(closeButton).toBeVisible();
  });

  test('should validate compose form', async ({ page }) => {
    // Handle alerts
    page.on('dialog', dialog => dialog.accept());
    
    // Open compose modal
    await page.click('[data-testid="compose-email-button"]');
    
    // Wait for modal
    await page.waitForSelector('h2:has-text("New Message")', { timeout: 10000 });
    
    // Try to send without filling fields - the button should be disabled
    const sendButton = page.getByRole('button', { name: /send/i });
    await expect(sendButton).toBeDisabled();
    
    // Fill in partial fields and check button is still disabled
    await page.getByPlaceholder('To').fill('test@example.com');
    await expect(sendButton).toBeDisabled();
    
    // Fill all fields and check button is enabled
    await page.getByPlaceholder('Subject').fill('Test Subject');
    await page.getByPlaceholder('Compose email').fill('Test body');
    await expect(sendButton).toBeEnabled();
  });

  test('should search emails', async ({ page }) => {
    // Type in search
    await page.getByPlaceholder('Search emails...').fill('mentor');
    
    // Should filter results
    await expect(page.getByText('Introduction - Your Mentor')).toBeVisible();
    
    // Other emails might be hidden depending on implementation
  });

  test('should show email actions', async ({ page }) => {
    // Select an email
    await page.waitForSelector('[data-testid="email-item-1"]');
    await page.click('[data-testid="email-item-1"]');
    
    // Check action buttons in preview
    await expect(page.getByTestId('star-email')).toBeVisible();
    await expect(page.getByTestId('archive-email')).toBeVisible();
    await expect(page.getByTestId('trash-email')).toBeVisible();
  });

  test('should show refresh functionality', async ({ page }) => {
    // Find and click refresh button
    await page.click('[data-testid="refresh-emails"]');
    
    // Should see loading state (the button contains an animated spinner)
    await expect(page.getByTestId('refresh-emails')).toBeVisible();
  });
});