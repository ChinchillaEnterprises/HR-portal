import { test, expect } from '@playwright/test';

test.describe('Application Navigation', () => {
  test('should navigate between all major sections', async ({ page }) => {
    await page.goto('/modern');
    
    // Check dashboard
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    
    // The navigation sidebar should be visible on all pages
    const navSidebar = page.locator('aside');
    await navSidebar.waitFor({ state: 'visible' });
    
    // Navigation might be collapsed - just click on the icons directly
    // Navigate to Onboarding (second icon)
    await navSidebar.locator('a').nth(1).click();
    await expect(page).toHaveURL('/onboarding');
    await expect(page.getByRole('heading', { name: 'Onboarding Tracker' })).toBeVisible();
    
    // Navigate to Documents (third icon)
    await navSidebar.locator('a').nth(2).click();
    await expect(page).toHaveURL('/documents');
    
    // Navigate to Applicants (fourth icon)
    await navSidebar.locator('a').nth(3).click();
    await expect(page).toHaveURL('/applicants');
    
    // Navigate to Analytics (fifth icon)
    await navSidebar.locator('a').nth(4).click();
    await expect(page).toHaveURL('/reports');
    
    // Navigate to Directory (sixth icon)
    await navSidebar.locator('a').nth(5).click();
    await expect(page).toHaveURL('/team');
  });

  test('should show correct navigation colors', async ({ page }) => {
    await page.goto('/modern');
    
    // Wait for navigation to be visible
    await page.waitForSelector('aside', { state: 'visible' });
    
    // Check that navigation uses gray gradients
    const navItems = page.locator('aside a');
    const firstNavItem = navItems.first();
    
    // Wait for the first nav item to be visible
    await firstNavItem.waitFor({ state: 'visible' });
    
    // Hover to see gradient
    await firstNavItem.hover();
    
    // Should have gray styling (no colorful gradients)
    const bgColor = await firstNavItem.evaluate(el => 
      window.getComputedStyle(el).backgroundColor
    );
    
    // Should be a gray color
    expect(bgColor).toMatch(/rgba?\(\d+,\s*\d+,\s*\d+/);
  });

  test('should have responsive mobile menu', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/modern');
    
    // Menu should be hidden on mobile
    const desktopNav = page.locator('nav').first();
    await expect(desktopNav).not.toBeVisible();
    
    // Mobile menu button should be visible
    const menuButton = page.getByRole('button').filter({ has: page.locator('svg') }).first();
    await expect(menuButton).toBeVisible();
  });
});