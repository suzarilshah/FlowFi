import { test, expect } from '@playwright/test';

test.describe('Navigation Component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display the FlowFi logo and brand', async ({ page }) => {
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.locator('a[aria-label="FlowFi Dashboard"]')).toBeVisible();
    await expect(page.locator('nav').getByText('FlowFi')).toBeVisible();
  });

  test('should display all navigation items on desktop', async ({ page }) => {
    // Check that all navigation items are visible on desktop
    const navItems = [
      'Dashboard',
      'Expenses', 
      'Income',
      'Reports',
      'Data Management',
      'Settings'
    ];

    for (const item of navItems) {
      await expect(page.locator(`text=${item}`).first()).toBeVisible();
    }
  });

  test('should navigate to different pages when clicking nav items', async ({ page }) => {
    // Test navigation to Dashboard
    await page.click('text=Dashboard');
    await expect(page).toHaveURL('/dashboard');

    // Test navigation to Expenses
    await page.click('text=Expenses');
    await expect(page).toHaveURL('/expenses');

    // Test navigation to Income
    await page.click('text=Income');
    await expect(page).toHaveURL('/income');

    // Test navigation to Reports
    await page.click('text=Reports');
    await expect(page).toHaveURL('/reports');

    // Test navigation to Data Management
    await page.click('text=Data Management');
    await expect(page).toHaveURL('/data-management');

    // Test navigation to Settings
    await page.click('text=Settings');
    await expect(page).toHaveURL('/settings');
  });

  test('should highlight active navigation item', async ({ page }) => {
    // Navigate to expenses page
    await page.click('text=Expenses');
    
    // Check that the expenses nav item has active styling
    const expensesLink = page.locator('a[href="/expenses"]');
    await expect(expensesLink).toHaveClass(/bg-blue-100/);
    await expect(expensesLink).toHaveAttribute('aria-current', 'page');
  });

  test('should have proper accessibility attributes', async ({ page }) => {
    // Check main navigation has proper role and aria-label
    await expect(page.locator('nav')).toHaveAttribute('role', 'navigation');
    await expect(page.locator('nav')).toHaveAttribute('aria-label', 'Main navigation');

    // Check that navigation links have proper accessibility attributes
    const dashboardLink = page.locator('a[href="/dashboard"]').first();
    await expect(dashboardLink).toHaveAttribute('aria-label');
  });

  test('should show icons for each navigation item', async ({ page }) => {
    // Check that each navigation item has an icon (svg element)
    const navLinks = page.locator('nav a[href^="/"]');
    const count = await navLinks.count();
    
    for (let i = 0; i < count; i++) {
      const link = navLinks.nth(i);
      await expect(link.locator('svg')).toBeVisible();
    }
  });

  test('should have hover effects on navigation items', async ({ page }) => {
    const dashboardLink = page.locator('a[href="/dashboard"]').first();
    
    // Check that the link has hover classes defined (Tailwind hover classes are in CSS, not DOM)
    await expect(dashboardLink).toHaveClass(/hover:/);
  });
});

test.describe('Mobile Navigation', () => {
  test.use({ viewport: { width: 375, height: 667 } }); // Mobile viewport

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should show mobile menu button on small screens', async ({ page }) => {
    // Check that the hamburger menu button is visible
    const menuButton = page.locator('button[aria-label="Open menu"]');
    await expect(menuButton).toBeVisible();
    
    // Check that desktop navigation is hidden
    const desktopNav = page.locator('.hidden.md\\:flex');
    await expect(desktopNav).not.toBeVisible();
  });

  test('should open and close mobile menu', async ({ page }) => {
    const menuButton = page.locator('button[aria-expanded]');
    
    // Initially menu should be closed
    await expect(menuButton).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('#mobile-menu')).not.toBeVisible();
    
    // Click to open menu
    await menuButton.click();
    await expect(menuButton).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('#mobile-menu')).toBeVisible();
    
    // Click to close menu
    await menuButton.click();
    await expect(menuButton).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('#mobile-menu')).not.toBeVisible();
  });

  test('should navigate from mobile menu and close menu', async ({ page }) => {
    // Open mobile menu
    await page.click('button[aria-label="Open menu"]');
    
    // Click on Expenses in mobile menu
    await page.click('#mobile-menu a[href="/expenses"]');
    
    // Check navigation worked
    await expect(page).toHaveURL('/expenses');
    
    // Check menu is closed
    await expect(page.locator('#mobile-menu')).not.toBeVisible();
  });

  test('should show navigation descriptions in mobile menu', async ({ page }) => {
    // Open mobile menu
    await page.click('button[aria-label="Open menu"]');
    
    // Check that descriptions are visible in mobile menu
    await expect(page.getByText('Overview and analytics')).toBeVisible();
    await expect(page.getByText('Manage expenses and receipts')).toBeVisible();
    await expect(page.getByText('Track income and invoices')).toBeVisible();
  });

  test('should have proper mobile menu accessibility', async ({ page }) => {
    const menuButton = page.locator('button[aria-expanded]');
    
    // Check button has proper accessibility attributes
    await expect(menuButton).toHaveAttribute('aria-controls', 'mobile-menu');
    
    // Open menu and check menu accessibility
    await menuButton.click();
    const mobileMenu = page.locator('#mobile-menu');
    await expect(mobileMenu).toHaveAttribute('role', 'menu');
    await expect(mobileMenu).toHaveAttribute('aria-orientation', 'vertical');
    
    // Check menu items have proper role
    const menuItems = mobileMenu.locator('a[role="menuitem"]');
    await expect(menuItems.first()).toBeVisible();
  });
});

test.describe('Navigation Responsive Behavior', () => {
  test('should adapt layout between desktop and mobile breakpoints', async ({ page }) => {
    await page.goto('/');
    
    // Start with desktop view
    await page.setViewportSize({ width: 1024, height: 768 });
    await expect(page.locator('.hidden.md\\:flex')).toBeVisible();
    await expect(page.locator('button[aria-label="Open menu"]')).not.toBeVisible();
    
    // Switch to mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('.hidden.md\\:flex')).not.toBeVisible();
    await expect(page.locator('button[aria-label="Open menu"]')).toBeVisible();
    
    // Switch back to desktop
    await page.setViewportSize({ width: 1024, height: 768 });
    await expect(page.locator('.hidden.md\\:flex')).toBeVisible();
    await expect(page.locator('button[aria-label="Open menu"]')).not.toBeVisible();
  });
});

test.describe('Navigation Performance and UX', () => {
  test('should load navigation quickly', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    
    // Check that navigation is visible within reasonable time
    await expect(page.locator('nav')).toBeVisible();
    const loadTime = Date.now() - startTime;
    
    // Navigation should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  test('should have smooth transitions', async ({ page }) => {
    await page.goto('/');
    
    // Check that navigation items have transition classes
    const navLink = page.locator('nav a[href="/dashboard"]').nth(1); // Get the nav item, not the logo
    await expect(navLink).toHaveClass(/transition/);
  });

  test('should maintain focus management', async ({ page }) => {
    await page.goto('/');
    
    // Tab through navigation items
    await page.keyboard.press('Tab');
    await expect(page.locator('a[aria-label="FlowFi Dashboard"]')).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.locator('a[href="/dashboard"]').first()).toBeFocused();
  });

  test('should handle keyboard navigation', async ({ page }) => {
    await page.goto('/');
    
    // Focus on a navigation link and press Enter
    await page.locator('a[href="/expenses"]').first().focus();
    await page.keyboard.press('Enter');
    
    // Should navigate to expenses page
    await expect(page).toHaveURL('/expenses');
  });
});