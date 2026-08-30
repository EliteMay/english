import {defineConfig,devices} from '@playwright/test';
export default defineConfig({testDir:'./tests',testMatch:'e2e.spec.mjs',timeout:30000,use:{baseURL:'http://127.0.0.1:4173',trace:'retain-on-failure'},projects:[{name:'firefox',use:{...devices['Desktop Firefox']}}]});
