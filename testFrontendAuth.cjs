const puppeteer = require('puppeteer');

async function testFrontendAuthentication() {
  console.log('🧪 Testing Frontend Authentication Flow...\n');
  
  let browser;
  try {
    // Launch browser
    browser = await puppeteer.launch({ 
      headless: false, // Set to true for headless mode
      defaultViewport: { width: 1280, height: 720 }
    });
    
    const page = await browser.newPage();
    
    // Navigate to the application
    console.log('📱 Navigating to http://localhost:5174...');
    await page.goto('http://localhost:5174', { waitUntil: 'networkidle2' });
    
    // Wait for the page to load
    await page.waitForTimeout(2000);
    
    // Check if login form is present
    const loginForm = await page.$('form');
    if (loginForm) {
      console.log('✅ Login form found');
      
      // Test Admin Login
      console.log('\n🔐 Testing Admin Login...');
      
      // Fill in admin credentials
      await page.type('input[type="email"]', 'admin@cafecolombia.com');
      await page.type('input[type="password"]', 'admin123');
      
      // Submit the form
      await page.click('button[type="submit"]');
      
      // Wait for navigation or response
      await page.waitForTimeout(3000);
      
      // Check current URL
      const currentUrl = page.url();
      console.log(`📍 Current URL after admin login: ${currentUrl}`);
      
      if (currentUrl.includes('/admin') || currentUrl.includes('/dashboard')) {
        console.log('✅ Admin login successful - redirected to dashboard');
      } else {
        console.log('❌ Admin login may have failed - no redirect detected');
      }
      
      // Check for any error messages
      const errorMessage = await page.$('.error, .alert-error, [role="alert"]');
      if (errorMessage) {
        const errorText = await page.evaluate(el => el.textContent, errorMessage);
        console.log(`⚠️ Error message found: ${errorText}`);
      }
      
    } else {
      console.log('❌ Login form not found - checking if already logged in');
      
      // Check if we're already on a dashboard
      const currentUrl = page.url();
      console.log(`📍 Current URL: ${currentUrl}`);
      
      if (currentUrl.includes('/dashboard')) {
        console.log('✅ Already logged in and on dashboard');
      }
    }
    
    // Take a screenshot for verification
    await page.screenshot({ path: 'frontend-auth-test.png', fullPage: true });
    console.log('📸 Screenshot saved as frontend-auth-test.png');
    
  } catch (error) {
    console.error('❌ Frontend authentication test failed:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the test