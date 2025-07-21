// watcher.js - ESM (ES Modules) version

// ✅ CHUẨN ESM imports
import chokidar from 'chokidar';
import { exec } from 'child_process';
import path from 'path';

// ✅ Configuration
const CONFIG = {
  // Files to watch
  watchPatterns: [
    '**/*.js',
    '**/*.html', 
    '**/*.css',
    '**/*.json',
    '!node_modules/**',
    '!.vercel/**'
  ],
  // Directories to ignore
  ignored: [
    'node_modules/**',
    '.vercel/**',
    '.git/**',
    'dist/**',
    'build/**',
    '**/*.log',
    '**/*.tmp',
    '**/package-lock.json' // Ignore package-lock changes
  ],
  // Deployment settings
  deployCommand: 'vercel --prod --yes',
  debounceDelay: 3000, // Wait 3 seconds before deploying
  maxRetries: 3,
  retryDelay: 5000 // 5 seconds between retries
};

// ✅ State management
let deployInProgress = false;
let deployQueue = new Set();
let debounceTimer = null;
let retryCount = 0;

// ✅ Initialize watcher
const watcher = chokidar.watch(CONFIG.watchPatterns, {
  ignored: CONFIG.ignored,
  ignoreInitial: true,
  persistent: true,
  awaitWriteFinish: {
    stabilityThreshold: 500,
    pollInterval: 100
  }
});

console.log('👀 ZA-LOG Auto-Deploy Watcher Started');
console.log('📁 Watching patterns:', CONFIG.watchPatterns);
console.log('🚫 Ignoring:', CONFIG.ignored);
console.log('⏱️  Debounce delay:', CONFIG.debounceDelay + 'ms');

// ✅ Debounced deploy function
function scheduleDeploy(changedFile) {
  // Add to queue
  deployQueue.add(changedFile);
  
  // Clear existing timer
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }
  
  // Set new timer
  debounceTimer = setTimeout(() => {
    if (!deployInProgress) {
      performDeploy();
    }
  }, CONFIG.debounceDelay);
}

// ✅ Perform deployment
function performDeploy() {
  if (deployInProgress) {
    console.log('⏳ Deployment already in progress, skipping...');
    return;
  }

  deployInProgress = true;
  const changedFiles = Array.from(deployQueue);
  deployQueue.clear();

  console.log('\n🚀 Starting deployment...');
  console.log('📝 Changed files:', changedFiles);
  console.log('⏰ Time:', new Date().toLocaleString());

  const startTime = Date.now();

  exec(CONFIG.deployCommand, { 
    timeout: 120000, // 2 minute timeout
    maxBuffer: 1024 * 1024 // 1MB buffer
  }, (error, stdout, stderr) => {
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    
    if (error) {
      retryCount++;
      console.error(`❌ Deployment failed (attempt ${retryCount}/${CONFIG.maxRetries}):`);
      console.error('Error:', error.message);
      console.error('Stderr:', stderr);
      
      // Retry logic
      if (retryCount < CONFIG.maxRetries) {
        console.log(`🔄 Retrying in ${CONFIG.retryDelay/1000} seconds...`);
        setTimeout(() => {
          deployInProgress = false;
          performDeploy();
        }, CONFIG.retryDelay);
        return;
      } else {
        console.error('💥 Max retries reached. Please check the error and try manually.');
        console.error('💡 Common fixes:');
        console.error('  - Check internet connection');
        console.error('  - Run: vercel login');
        console.error('  - Run: vercel --prod manually');
        retryCount = 0;
      }
    } else {
      retryCount = 0;
      console.log(`✅ Deployment successful! (${duration}s)`);
      
      // Extract deployment URL if available
      const urlMatch = stdout.match(/https:\/\/[^\s]+/);
      if (urlMatch) {
        console.log('🌐 URL:', urlMatch[0]);
      }
      
      // Show preview of output
      if (stdout.length > 200) {
        console.log('📋 Output preview:', stdout.substring(0, 200) + '...');
      } else {
        console.log('📋 Output:', stdout);
      }
    }
    
    deployInProgress = false;
  });
}

// ✅ Event handlers
watcher.on('change', (filePath) => {
  const relativePath = path.relative(process.cwd(), filePath);
  console.log(`📝 Changed: ${relativePath}`);
  scheduleDeploy(relativePath);
});

watcher.on('add', (filePath) => {
  const relativePath = path.relative(process.cwd(), filePath);
  console.log(`➕ Added: ${relativePath}`);
  scheduleDeploy(relativePath);
});

watcher.on('unlink', (filePath) => {
  const relativePath = path.relative(process.cwd(), filePath);
  console.log(`➖ Deleted: ${relativePath}`);
  scheduleDeploy(relativePath);
});

watcher.on('error', (error) => {
  console.error('👀 Watcher error:', error);
});

watcher.on('ready', () => {
  console.log('✅ Watcher ready - monitoring for changes...');
  console.log('💡 Tip: Make changes to your files and they will auto-deploy!');
  console.log('🛑 Press Ctrl+C to stop watching\n');
});

// ✅ Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down watcher...');
  
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }
  
  watcher.close().then(() => {
    console.log('✅ Watcher stopped gracefully');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down...');
  watcher.close().then(() => {
    process.exit(0);
  });
});

// ✅ ESM export
export {
  watcher,
  scheduleDeploy,
  CONFIG
};