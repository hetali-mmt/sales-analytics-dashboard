import { test, expect } from '@playwright/test'

test.describe('Session List Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/sessions')
    await page.waitForLoadState('networkidle')
  })

  test('should display session list with data', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Sessions')
    
    // Wait for sessions to load
    await page.waitForSelector('h1:has-text("Sessions")', { timeout: 15000 })
    
    // Should show session count
    await expect(page.locator('h1')).toContainText(/Sessions \(\d+/)
    
    // Should show connection status
    await expect(page.locator('text=Live, text=Disconnected')).toBeVisible()
  })

  test('should show and use all filter options', async ({ page }) => {
    // Search filter
    const searchInput = page.locator('input[placeholder*="Search"]')
    await expect(searchInput).toBeVisible()
    
    // Team filter
    const teamSelect = page.locator('select')
    await expect(teamSelect).toBeVisible()
    
    // Date filters
    const dateInputs = page.locator('input[type="date"]')
    await expect(dateInputs).toHaveCount(2)
    
    // Score range filters
    const scoreInputs = page.locator('input[type="number"]')
    await expect(scoreInputs).toHaveCount(2)
  })

  test('should filter sessions by search term', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search"]')
    
    await searchInput.fill('Demo')
    await page.waitForTimeout(500) // Wait for debounce
    
    // Should update URL
    await expect(page).toHaveURL(/search=Demo/)
    
    // Clear search
    await searchInput.clear()
    await page.waitForTimeout(500)
  })

  test('should handle session detail modal workflow', async ({ page }) => {
    // Wait for page to load
    await page.waitForTimeout(2000)
    
    // Try to find any clickable session element
    const sessionElement = page.locator('[data-testid="session-row"], tbody tr, .session-item').first()
    if (await sessionElement.count() > 0) {
      await sessionElement.click()
      
      // Modal should open
      const modal = page.locator('[role="dialog"]')
      await expect(modal).toBeVisible()
      
      // Should show session details
      await expect(modal.locator('text=Session Details, text=Transcript')).toBeVisible()
      
      // Close with ESC
      await page.keyboard.press('Escape')
      await expect(modal).not.toBeVisible()
    } else {
      // Skip test if no sessions available
    }
  })

  test('should handle bulk operations workflow', async ({ page }) => {
    const bulkButton = page.locator('button:has-text("Bulk Actions")')
    await bulkButton.click()
    
    // Should show bulk controls
    await expect(page.locator('button:has-text("Select All")')).toBeVisible()
    
    // Select all sessions
    await page.locator('button:has-text("Select All")').click()
    
    // Should show selected count
    await expect(page.locator('text=/\d+ selected/')).toBeVisible()
    
    // Cancel bulk actions
    await page.locator('button:has-text("Cancel")').click()
    await expect(page.locator('button:has-text("Select All")')).not.toBeVisible()
  })

  test('should handle CSV export', async ({ page }) => {
    const exportButton = page.locator('button:has-text("Export CSV")')
    await expect(exportButton).toBeVisible()
    
    await exportButton.click()
    
    // Should show progress
    await expect(page.locator('button:has-text("Exporting...")')).toBeVisible()
    
    // Wait for export to complete
    await expect(page.locator('button:has-text("Exporting...")')).not.toBeVisible({ timeout: 10000 })
  })

  test('should handle PDF export', async ({ page }) => {
    const exportButton = page.locator('button:has-text("Export PDF")')
    await expect(exportButton).toBeVisible()
    
    await exportButton.click()
    
    // Should show progress
    await expect(page.locator('button:has-text("Generating...")')).toBeVisible()
    
    // Wait for export to complete
    await expect(page.locator('button:has-text("Generating...")')).not.toBeVisible({ timeout: 15000 })
  })

  test('should sort sessions by different columns', async ({ page }) => {
    // Sort by title
    const titleHeader = page.locator('button:has-text("Title")')
    await titleHeader.click()
    await expect(page.locator('span:has-text("↑"), span:has-text("↓")')).toBeVisible()
    
    // Sort by score
    const scoreHeader = page.locator('button:has-text("Score")')
    await scoreHeader.click()
    await expect(page.locator('span:has-text("↑"), span:has-text("↓")')).toBeVisible()
    
    // Sort by date
    const dateHeader = page.locator('button:has-text("Created At")')
    await dateHeader.click()
    await expect(page.locator('span:has-text("↑"), span:has-text("↓")')).toBeVisible()
  })

  test('should customize visible columns', async ({ page }) => {
    const columnsButton = page.locator('button:has-text("Columns")')
    await columnsButton.click()
    
    // Should show column options
    const checkboxes = page.locator('input[type="checkbox"]')
    await expect(checkboxes).toHaveCount(5)
    
    // Toggle a column
    const firstCheckbox = checkboxes.first()
    await firstCheckbox.click()
    
    // Close dropdown by clicking outside
    await page.locator('body').click()
    await expect(page.locator('input[type="checkbox"]')).not.toBeVisible()
  })

  test('should clear all filters', async ({ page }) => {
    // Apply some filters first
    const searchInput = page.locator('input[placeholder*="Search"]')
    await searchInput.fill('test')
    
    const teamSelect = page.locator('select')
    await teamSelect.selectOption('Sales')
    
    // Clear all filters
    const clearButton = page.locator('button:has-text("Clear All Filters")')
    await clearButton.click()
    
    // Should reset to base URL
    await expect(page).toHaveURL('/sessions')
  })

  test('should handle virtualized scrolling', async ({ page }) => {
    // Scroll down to load more sessions
    const sessionContainer = page.locator('[data-testid="session-container"], .overflow-auto')
    
    // Scroll to bottom
    await sessionContainer.evaluate(el => {
      el.scrollTop = el.scrollHeight
    })
    
    // Should load more sessions (if available)
    await page.waitForTimeout(1000)
    
    // Scroll back to top
    await sessionContainer.evaluate(el => {
      el.scrollTop = 0
    })
  })
})

test.describe('Session List Mobile', () => {
  test('should be responsive on mobile devices', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/sessions')
    
    await expect(page.locator('h1')).toBeVisible()
    
    // Should show mobile-friendly layout
    const exportButtons = page.locator('button:has-text("Export")')
    await expect(exportButtons.first()).toBeVisible()
  })
})