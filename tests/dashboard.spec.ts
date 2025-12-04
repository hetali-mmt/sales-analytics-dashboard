import { test, expect } from '@playwright/test'

test.describe('Analytics Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should display team overview page', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Team Overview')
    await expect(page.locator('[data-testid="team-performance-chart"]')).toBeVisible()
  })

  test('should navigate to sessions page', async ({ page }) => {
    await page.click('text=Sessions')
    await expect(page.locator('h1')).toContainText('Sessions')
    await expect(page.url()).toContain('/sessions')
  })

  test('should filter users by search', async ({ page }) => {
    const searchInput = page.locator('input[placeholder="Search users..."]')
    await searchInput.fill('John')
    
    // Wait for debounced search
    await page.waitForTimeout(500)
    
    // Check that URL contains search parameter
    await expect(page.url()).toContain('search=John')
  })

  test('should filter users by team', async ({ page }) => {
    const teamSelect = page.locator('select').first()
    await teamSelect.selectOption('Sales')
    
    // Check that URL contains team parameter
    await expect(page.url()).toContain('team=Sales')
  })

  test('should open user modal', async ({ page }) => {
    // Wait for users to load
    await page.waitForSelector('table tbody tr')
    
    // Click on first user row
    await page.click('table tbody tr:first-child')
    
    // Check modal is open
    await expect(page.locator('[role="dialog"]')).toBeVisible()
    await expect(page.locator('h2')).toContainText('Performance Details')
  })

  test('should handle theme toggle', async ({ page }) => {
    const themeToggle = page.locator('button[aria-label="Toggle theme"]')
    await themeToggle.click()
    
    // Check that dark class is added to html element
    const htmlClass = await page.locator('html').getAttribute('class')
    expect(htmlClass).toContain('dark')
  })

  test('should show connection status', async ({ page }) => {
    const connectionStatus = page.locator('text=Connected, text=Disconnected').first()
    await expect(connectionStatus).toBeVisible()
  })
})

test.describe('Session List', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/sessions')
  })

  test('should display sessions list', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Sessions')
    
    // Wait for sessions to load
    await page.waitForSelector('[data-testid="session-list"]', { timeout: 10000 })
  })

  test('should filter sessions by search', async ({ page }) => {
    const searchInput = page.locator('input[placeholder="Search sessions..."]')
    await searchInput.fill('Demo')
    
    // Wait for debounced search
    await page.waitForTimeout(500)
    
    await expect(page.url()).toContain('search=Demo')
  })

  test('should enable bulk actions', async ({ page }) => {
    await page.click('text=Bulk Actions')
    await expect(page.locator('text=Select All')).toBeVisible()
    await expect(page.locator('input[type="checkbox"]').first()).toBeVisible()
  })

  test('should open session detail modal', async ({ page }) => {
    // Wait for sessions to load
    await page.waitForSelector('[data-testid="session-row"]', { timeout: 10000 })
    
    // Click on first session
    await page.click('[data-testid="session-row"]:first-child')
    
    // Check modal is open
    await expect(page.locator('[role="dialog"]')).toBeVisible()
    await expect(page.locator('h2')).toContainText('Session Details')
  })

  test('should handle score range filtering', async ({ page }) => {
    const minScoreInput = page.locator('input[placeholder="Min Score"]')
    const maxScoreInput = page.locator('input[placeholder="Max Score"]')
    
    await minScoreInput.fill('7')
    await maxScoreInput.fill('10')
    
    // Wait for debounced update
    await page.waitForTimeout(500)
    
    await expect(page.url()).toContain('scoreMin=7')
    await expect(page.url()).toContain('scoreMax=10')
  })
})