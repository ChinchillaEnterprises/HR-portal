import { test, expect } from '@playwright/test';

test.describe('Onboarding Tracker', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/modern/onboarding');
  });

  test('should display onboarding tracker page', async ({ page }) => {
    // Check page header
    await expect(page.getByRole('heading', { name: 'Onboarding Tracker' })).toBeVisible();
    await expect(page.getByText('Checklists with status, assigned dates, and file uploads')).toBeVisible();
  });

  test('should show employee selection section', async ({ page }) => {
    // Check employee selection
    await expect(page.getByRole('heading', { name: 'Select Employee' })).toBeVisible();
    await expect(page.getByRole('button', { name: /assign dates/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /send email/i })).toBeVisible();
    
    // Check select dropdown
    const selectEmployee = page.getByRole('combobox');
    await expect(selectEmployee).toBeVisible();
  });

  test('should display progress overview', async ({ page }) => {
    // Check progress section
    await expect(page.getByRole('heading', { name: 'Progress Overview' })).toBeVisible();
    await expect(page.getByText('Overall Progress')).toBeVisible();
    await expect(page.getByText('%')).toBeVisible();
    
    // Check stats
    await expect(page.getByText('Completed')).toBeVisible();
    await expect(page.getByText('In Progress')).toBeVisible();
    await expect(page.getByText('Pending')).toBeVisible();
  });

  test('should show onboarding checklist items', async ({ page }) => {
    // Check checklist section
    await expect(page.getByRole('heading', { name: 'Onboarding Checklist' })).toBeVisible();
    
    // Check default checklist items
    const checklistItems = [
      'Sign Offer Letter',
      'Complete NDA',
      'Submit Tax Forms',
      'Set Up Workstation',
      'Complete HR Training',
      'Meet Your Team',
      'Meet Your Mentor',
      'Review Employee Handbook'
    ];
    
    for (const item of checklistItems) {
      await expect(page.getByText(item)).toBeVisible();
    }
  });

  test('should show task categories', async ({ page }) => {
    // Check task categories are visible
    await expect(page.getByTestId('category-1')).toBeVisible();
    await expect(page.getByTestId('category-1')).toHaveText('documentation');
    await expect(page.getByTestId('category-4')).toHaveText('setup');
    await expect(page.getByTestId('category-5')).toHaveText('training');
    await expect(page.getByTestId('category-6')).toHaveText('meeting');
  });

  test('should allow clicking task status', async ({ page }) => {
    // Click first task status button
    await page.click('[data-testid="task-status-1"]');
    
    // Should open form modal - use the h2 element specifically
    await expect(page.locator('h2').filter({ hasText: 'Sign Offer Letter' })).toBeVisible();
  });

  test('should show date assignment buttons', async ({ page }) => {
    // Check calendar buttons for each task
    for (let i = 1; i <= 8; i++) {
      await expect(page.getByTestId(`calendar-${i}`)).toBeVisible();
    }
  });

  test('should open date picker modal', async ({ page }) => {
    // Click first calendar button
    await page.click('[data-testid="calendar-1"]');
    
    // Check date picker modal - the header shows "Set Due Date for: [task]"
    await expect(page.getByRole('heading', { name: 'Set Due Date for: Sign Offer Letter' })).toBeVisible();
    await expect(page.getByText('Select Due Date')).toBeVisible();
    await expect(page.getByRole('button', { name: /save date/i })).toBeVisible();
  });

  test('should show file upload section', async ({ page }) => {
    // Check file upload area
    await expect(page.getByRole('heading', { name: 'File Uploads' })).toBeVisible();
    await expect(page.getByText('Drag and drop files here or click to browse')).toBeVisible();
    await expect(page.getByText('Supported formats: PDF, DOC, DOCX')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Select Files' })).toBeVisible();
  });

  test('should disable action buttons without employee selection', async ({ page }) => {
    // Check buttons are disabled initially
    const assignDatesButton = page.getByRole('button', { name: /assign dates/i });
    const sendEmailButton = page.getByRole('button', { name: /send email/i });
    
    await expect(assignDatesButton).toBeDisabled();
    await expect(sendEmailButton).toBeDisabled();
  });

  test('should show upload buttons for documentation tasks', async ({ page }) => {
    // Check upload buttons for documentation tasks
    await expect(page.getByTestId('upload-1')).toBeVisible(); // Offer Letter
    await expect(page.getByTestId('upload-2')).toBeVisible(); // NDA
    await expect(page.getByTestId('upload-3')).toBeVisible(); // Tax Forms
    await expect(page.getByTestId('upload-8')).toBeVisible(); // Employee Handbook
  });

  test('should show task descriptions', async ({ page }) => {
    // Check task descriptions
    await expect(page.getByText('Review and sign the employment offer letter')).toBeVisible();
    await expect(page.getByText('Sign non-disclosure agreement')).toBeVisible();
    await expect(page.getByText('W-4 and state tax withholding forms')).toBeVisible();
  });

  test('should display form modal for different task types', async ({ page }) => {
    // Test offer letter form
    const offerLetterTask = page.locator('.flex.items-center.gap-4').filter({ hasText: 'Sign Offer Letter' });
    await offerLetterTask.locator('button').first().click();
    
    // Should show specific form fields
    await expect(page.getByText('I acknowledge that I have read')).toBeVisible();
    await expect(page.getByPlaceholder('Type your full name')).toBeVisible();
    
    // Close modal
    await page.getByRole('button', { name: 'Cancel' }).click();
  });
});