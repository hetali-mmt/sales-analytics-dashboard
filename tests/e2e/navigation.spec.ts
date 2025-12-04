import { test, expect } from '@playwright/test'

test.describe('Application Navigation', () => {
  test('should navigate between pages', async ({ page }) => {
    await page.goto('/')
    
    // Should start on Team Overview
    await expect(page.locator('h1')).toContainText('Team Overview')
    
    // Navigate to Sessions
    await page.locator('a[href="/sessions"]').click()
    await expect(page.locator('h1')).toContainText('Sessions')
    
    // Navigate back to Team Overview
    await page.locator('nav a[href="/"]:has-text("Team Overview")').click()
    await expect(page.locator('h1')).toContainText('Team Overview')
  })

  test('should handle direct URL navigation', async ({ page }) => {
    // Direct navigation to sessions
    await page.goto('/sessions')
    await expect(page.locator('h1')).toContainText('Sessions')
    
    // Direct navigation to team overview
    await page.goto('/')
    await expect(page.locator('h1')).toContainText('Team Overview')
  })

  test('should maintain URL state for filters', async ({ page }) => {
    await page.goto('/sessions')
    
    // Apply search filter
    const searchInput = page.locator('input[placeholder*="Search"]')
    await searchInput.fill('demo')
    await page.waitForTimeout(500)
    
    // URL should update
    await expect(page).toHaveURL(/search=demo/)
    
    // Refresh page
    await page.reload()
    
    // Filter should persist
    await expect(searchInput).toHaveValue('demo')
  })

  test('should handle browser back/forward', async ({ page }) => {
    await page.goto('/')
    
    // Navigate to sessions
    await page.locator('a[href="/sessions"]').click()
    await expect(page.locator('h1')).toContainText('Sessions')
    
    // Go back
    await page.goBack()
    await expect(page.locator('h1')).toContainText('Team Overview')
    
    // Go forward
    await page.goForward()
    await expect(page.locator('h1')).toContainText('Sessions')
  })
})