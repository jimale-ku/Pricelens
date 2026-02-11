/**
 * Quick backend connectivity checker
 * Run this in your app console or add a button to test
 */

import { API_BASE_URL } from '../constants/api';

export const checkBackendStatus = async () => {
  console.log('🔍 Checking backend connectivity...');
  console.log('📍 Backend URL:', API_BASE_URL);
  
  const tests = [
    { name: 'Stores endpoint', url: `${API_BASE_URL}/stores` },
    { name: 'API docs', url: `${API_BASE_URL}/api` },
    { name: 'Google auth endpoint', url: `${API_BASE_URL}/auth/google` },
  ];

  const results = [];

  for (const test of tests) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(test.url, {
        method: 'HEAD',
        signal: controller.signal,
        redirect: 'manual',
      });
      
      clearTimeout(timeoutId);
      
      const status = response.status;
      const isOk = status >= 200 && status < 500; // Accept redirects too
      
      results.push({
        name: test.name,
        url: test.url,
        status: status,
        ok: isOk,
        error: null,
      });
      
      console.log(`✅ ${test.name}: ${status} ${isOk ? 'OK' : 'FAILED'}`);
    } catch (error: any) {
      results.push({
        name: test.name,
        url: test.url,
        status: null,
        ok: false,
        error: error.message,
      });
      console.log(`❌ ${test.name}: ${error.message}`);
    }
  }

  const allOk = results.every(r => r.ok);
  
  if (!allOk) {
    console.log('\n⚠️ Backend is not reachable!');
    console.log('\nTroubleshooting steps:');
    console.log('1. Make sure backend is running: cd server && npm run start:dev');
    console.log('2. Check IP address matches:', API_BASE_URL);
    console.log('3. Test in browser:', `${API_BASE_URL}/api`);
    console.log('4. Check firewall settings');
    console.log('5. Ensure phone and PC are on same WiFi');
  } else {
    console.log('\n✅ Backend is reachable!');
  }

  return results;
};
