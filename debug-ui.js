const { chromium } = require('playwright');

async function debugUIRefresh() {
  console.log('🔍 Starting UI refresh debugging...');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Listen to console logs
  page.on('console', msg => {
    console.log(`📋 BROWSER: ${msg.type()}: ${msg.text()}`);
  });
  
  // Listen to network requests
  page.on('request', request => {
    if (request.url().includes('localhost:3002')) {
      console.log(`🌐 REQUEST: ${request.method()} ${request.url()}`);
    }
  });
  
  page.on('response', response => {
    if (response.url().includes('localhost:3002')) {
      console.log(`📥 RESPONSE: ${response.status()} ${response.url()}`);
    }
  });
  
  try {
    console.log('📱 Navigating to localhost:3002...');
    await page.goto('http://localhost:3002');
    await page.waitForLoadState('networkidle');
    
    // Set up bypass authentication in localStorage
    console.log('🔐 Setting up bypass authentication...');
    await page.evaluate(() => {
      const bypassUserData = {
        id: "bypass-admin",
        name: "System Administrator",
        email: "admin@bypass.local",
        authType: "bypass",
      };
      localStorage.setItem("bypass-auth", JSON.stringify(bypassUserData));
    });
    
    console.log('🔄 Refreshing page after setting auth...');
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Try to navigate to meetings page
    console.log('📱 Navigating to meetings page...');
    await page.goto('http://localhost:3002/meetings');
    await page.waitForLoadState('networkidle');
    
    console.log('✅ Page loaded, looking for Current Meeting Items...');
    
    // Wait for the current meeting items section
    await page.waitForSelector('text=Current Meeting Items', { timeout: 10000 });
    
    // Check if there are any meeting items with X buttons
    const removeButtons = await page.locator('button[title*="Remove"], button:has-text("×"), button:has-text("X")').count();
    console.log(`🔍 Found ${removeButtons} remove buttons`);
    
    if (removeButtons > 0) {
      console.log('🧪 Testing remove functionality...');
      
      // Get initial count of meeting items
      const initialItems = await page.locator('[data-testid="meeting-item"], .meeting-item, div:has(button[title*="Remove"])').count();
      console.log(`📊 Initial meeting items count: ${initialItems}`);
      
      // Click the first remove button
      await page.locator('button[title*="Remove"], button:has-text("×"), button:has-text("X")').first().click();
      console.log('🖱️ Clicked remove button');
      
      // Wait a moment for any async operations
      await page.waitForTimeout(2000);
      
      // Check if items count changed
      const afterRemoveItems = await page.locator('[data-testid="meeting-item"], .meeting-item, div:has(button[title*="Remove"])').count();
      console.log(`📊 After remove items count: ${afterRemoveItems}`);
      
      if (afterRemoveItems < initialItems) {
        console.log('✅ Remove worked immediately!');
      } else {
        console.log('❌ Remove did not update UI immediately');
      }
    }
    
    // Test add functionality
    console.log('🧪 Testing add functionality...');
    
    // Look for Add Issues button
    const addButton = page.locator('button:has-text("Add Issues")');
    const addButtonExists = await addButton.count() > 0;
    
    if (addButtonExists) {
      console.log('🖱️ Clicking Add Issues button...');
      await addButton.click();
      
      // Wait for dialog to open
      await page.waitForSelector('dialog, [role="dialog"]', { timeout: 5000 });
      console.log('📱 Add Issues dialog opened');
      
      // Check for available issues to select
      const checkboxes = await page.locator('input[type="checkbox"]').count();
      console.log(`📋 Found ${checkboxes} checkboxes in dialog`);
      
      if (checkboxes > 0) {
        // Select first available issue
        await page.locator('input[type="checkbox"]').first().check();
        console.log('✅ Selected first issue');
        
        // Click Add button in dialog
        const addDialogButton = page.locator('button:has-text("Add")').last();
        await addDialogButton.click();
        console.log('🖱️ Clicked Add button in dialog');
        
        // Wait for potential UI updates
        await page.waitForTimeout(3000);
        
        // Check if dialog closed
        const dialogStillOpen = await page.locator('dialog, [role="dialog"]').count() > 0;
        console.log(`📱 Dialog still open: ${dialogStillOpen}`);
        
        // Check if new items appeared
        const finalItems = await page.locator('[data-testid="meeting-item"], .meeting-item, div:has(button[title*="Remove"])').count();
        console.log(`📊 Final meeting items count: ${finalItems}`);
      }
    } else {
      console.log('❌ Add Issues button not found');
    }
    
    // Keep browser open for inspection
    console.log('🔍 Keeping browser open for 30 seconds for manual inspection...');
    await page.waitForTimeout(30000);
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
  } finally {
    await browser.close();
  }
}

debugUIRefresh().catch(console.error);