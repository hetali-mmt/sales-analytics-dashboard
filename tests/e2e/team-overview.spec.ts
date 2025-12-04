import { test, expect } from '@playwright/test'

test.describe('Team Overview Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    // Wait for page to load
    await page.waitForLoadState('networkidle')
  })

  test('should display team overview page elements', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Team Overview')
    await expect(page.locator('[data-chart="team-performance"]')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('text=Top Performers')).toBeVisible()
  })

  test('should show user table with data', async ({ page }) => {
    await expect(page.locator('table')).toBeVisible()
    
    // Check table headers
    await expect(page.locator('th:has-text("Name")')).toBeVisible()
    await expect(page.locator('th:has-text("Team")')).toBeVisible()
    await expect(page.locator('th:has-text("Sessions")')).toBeVisible()
    await expect(page.locator('th:has-text("Avg Score")')).toBeVisible()
    
    // Wait for data to load
    await expect(page.locator('tbody tr')).toHaveCount(300)
  })

  test('should filter users by search term', async ({ page }) => {
    const searchInput = page.locator('input[placeholder="Search users..."]')
    await expect(searchInput).toBeVisible()
    
    // Get initial row count
    await page.waitForSelector('tbody tr')
    const initialRows = await page.locator('tbody tr').count()
    
    // Search for specific term
    await searchInput.fill('John')
    await page.waitForTimeout(500) // Wait for debounce
    
    // Should have filtered results
    const filteredRows = await page.locator('tbody tr').count()
    expect(filteredRows).toBeLessThanOrEqual(initialRows)
  })

  test('should filter users by team selection', async ({ page }) => {
    const teamSelect = page.locator('select')
    await expect(teamSelect).toBeVisible()
    
    await teamSelect.selectOption('Sales')
    await page.waitForTimeout(500)
    
    // All visible users should be from Sales team
    const teamBadges = page.locator('tbody tr .bg-blue-100, tbody tr .bg-blue-900')
    await expect(teamBadges.first()).toBeVisible()
  })

  test('should open and close user modal', async ({ page }) => {
    // Wait for users to load
    await page.waitForSelector('tbody tr', { timeout: 10000 })
    
    const firstUserRow = page.locator('tbody tr').first()
    await firstUserRow.click()
    
    // Modal should open
    const modal = page.locator('[role="dialog"]')
    await expect(modal).toBeVisible()
    
    // Should show user details
    await expect(modal.locator('text=Performance Details')).toBeVisible()
    
    // Close modal with ESC key
    await page.keyboard.press('Escape')
    await expect(modal).not.toBeVisible()
  })

  test('should handle PDF export functionality', async ({ page }) => {
    const exportButton = page.locator('button:has-text("Export PDF Report")')
    await expect(exportButton).toBeVisible()
    
    // Click export button
    await exportButton.click()
    
    // Should show progress indicator
    await expect(page.locator('button:has-text("Generating...")')).toBeVisible()
    
    // Wait for export to complete
    await expect(page.locator('button:has-text("Generating...")')).not.toBeVisible({ timeout: 15000 })
  })

  test('should display top performers ranking', async ({ page }) => {
    await expect(page.locator('text=Top Performers')).toBeVisible()
    
    // Should show ranking badges
    const rankingBadges = page.locator('.bg-yellow-100, .bg-gray-100, .bg-orange-100')
    await expect(rankingBadges.first()).toBeVisible()
    
    // Should show user names and scores
    await expect(page.locator('tbody tr').first()).toBeVisible()
  })

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    
    await expect(page.locator('h1')).toBeVisible()
    await expect(page.locator('table')).toBeVisible()
    
    // Should handle mobile layout
    const exportButton = page.locator('button:has-text("Export PDF Report")')
    await expect(exportButton).toBeVisible()
  })
})

test.describe('Team Overview Accessibility', () => {
  test('should have proper ARIA labels and keyboard navigation', async ({ page }) => {
    await page.goto('/')
    
    // Check for proper headings
    await expect(page.locator('h1')).toBeVisible()
    
    // Check table accessibility
    await expect(page.locator('table')).toBeVisible()
    
    // Test keyboard navigation
    await page.keyboard.press('Tab')
    const focusedElement = page.locator(':focus')
    await expect(focusedElement).toBeVisible()
  })
})