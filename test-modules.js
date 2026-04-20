const { chromium } = require('playwright');

async function testModules() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const errors = [];
  const results = [];
  
  // Collect console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(`[${msg.type()}] ${msg.text()}`);
    }
  });
  
  page.on('pageerror', err => {
    errors.push(`[Page Error] ${err.message}`);
  });

  try {
    // 1. Test Login
    console.log('=== Testing Login ===');
    await page.goto('https://xiandingsi.cn/login', { waitUntil: 'networkidle', timeout: 30000 });
    await page.fill('input[type="text"]', 'admin');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    const url = page.url();
    if (url.includes('/admin')) {
      console.log('✅ Login successful');
      results.push({ module: 'Login', status: 'PASS' });
    } else {
      console.log('❌ Login failed, current URL:', url);
      results.push({ module: 'Login', status: 'FAIL', url });
    }
    
    // 2. Test Admin Modules
    const modules = [
      { name: '仪表盘', path: '/admin' },
      { name: '登记发布', path: '/admin/tasks' },
      { name: '登记审批', path: '/admin/approvals' },
      { name: '义工管理', path: '/admin/volunteers' },
      { name: '义工任务', path: '/admin/volunteer-tasks' },
      { name: '义工考勤', path: '/admin/volunteer-attendance' },
      { name: '僧众管理', path: '/admin/monks' },
      { name: '信众管理', path: '/admin/devotees' },
      { name: '牌位管理', path: '/admin/plaques' },
      { name: '模板设计', path: '/admin/plaque-templates' },
      { name: '法会管理', path: '/admin/rituals' },
      { name: '殿堂管理', path: '/admin/halls' },
      { name: '供灯祈福', path: '/admin/lamps' },
      { name: '功德管理', path: '/admin/donations' },
      { name: '库房管理', path: '/admin/warehouse' },
      { name: '住宿管理', path: '/admin/rooms' },
      { name: '斋堂管理', path: '/admin/dining' },
      { name: '来访管理', path: '/admin/visits' },
      { name: '系统设置', path: '/admin/settings' },
      { name: '用户管理', path: '/admin/users' },
      { name: '操作日志', path: '/admin/logs' },
    ];
    
    for (const mod of modules) {
      console.log(`\n=== Testing ${mod.name} ===`);
      try {
        await page.goto(`https://xiandingsi.cn${mod.path}`, { waitUntil: 'networkidle', timeout: 15000 });
        await page.waitForTimeout(1000);
        
        if (page.title() || await page.$('body')) {
          console.log(`✅ ${mod.name} loaded`);
          results.push({ module: mod.name, status: 'PASS' });
        } else {
          console.log(`❌ ${mod.name} failed to load`);
          results.push({ module: mod.name, status: 'FAIL' });
        }
      } catch (e) {
        console.log(`❌ ${mod.name} error: ${e.message}`);
        results.push({ module: mod.name, status: 'ERROR', error: e.message });
      }
    }
    
    // Print summary
    console.log('\n=== Summary ===');
    results.forEach(r => {
      console.log(`${r.status === 'PASS' ? '✅' : r.status === 'FAIL' ? '❌' : '⚠️'} ${r.module}: ${r.status}`);
    });
    
    if (errors.length > 0) {
      console.log('\n=== Console Errors ===');
      errors.slice(0, 10).forEach(e => console.log(e));
    }
    
  } catch (e) {
    console.error('Test error:', e.message);
  } finally {
    await browser.close();
  }
}

testModules();
