#!/usr/bin/env node

/**
 * 🧹 MonsterMen90 Project Cleanup Script
 * Removes unnecessary files to create a clean, functional project structure
 */

const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logProgress(message) {
  console.log(`${colors.cyan}[CLEANUP]${colors.reset} ${message}`);
}

function logSuccess(message) {
  console.log(`${colors.green}[SUCCESS]${colors.reset} ${message}`);
}

function logWarning(message) {
  console.log(`${colors.yellow}[WARNING]${colors.reset} ${message}`);
}

function logError(message) {
  console.log(`${colors.red}[ERROR]${colors.reset} ${message}`);
}

// Files and directories to remove
const cleanupTasks = [
  // Duplicate Component Files (HIGH PRIORITY)
  {
    path: 'MonsterFrontend/src/pages/wholesaler/WholesalerHome.corrected.tsx',
    type: 'file',
    priority: 'HIGH',
    reason: 'Duplicate component file'
  },
  {
    path: 'MonsterFrontend/src/pages/wholesaler/WholesalerHome.fixed.tsx',
    type: 'file',
    priority: 'HIGH',
    reason: 'Duplicate component file'
  },
  {
    path: 'MonsterFrontend/src/pages/wholesaler/WholesalerHome.improved.tsx',
    type: 'file',
    priority: 'HIGH',
    reason: 'Duplicate component file'
  },
  {
    path: 'MonsterFrontend/src/pages/wholesaler/WholesalerHome.phase1.tsx',
    type: 'file',
    priority: 'HIGH',
    reason: 'Duplicate component file'
  },

  // Setup/Automation Scripts (MEDIUM PRIORITY)
  {
    path: 'MonsterFrontend/automate-database-setup.js',
    type: 'file',
    priority: 'MEDIUM',
    reason: 'One-time setup script'
  },
  {
    path: 'MonsterFrontend/create-admin-user.js',
    type: 'file',
    priority: 'MEDIUM',
    reason: 'One-time setup script'
  },
  {
    path: 'MonsterFrontend/debug-admin-panel.js',
    type: 'file',
    priority: 'MEDIUM',
    reason: 'Debug script'
  },
  {
    path: 'MonsterFrontend/direct-sql-setup.js',
    type: 'file',
    priority: 'MEDIUM',
    reason: 'One-time setup script'
  },
  {
    path: 'MonsterFrontend/install-dependencies.js',
    type: 'file',
    priority: 'MEDIUM',
    reason: 'Setup automation script'
  },
  {
    path: 'MonsterFrontend/run-migrations.js',
    type: 'file',
    priority: 'MEDIUM',
    reason: 'Setup automation script'
  },
  {
    path: 'MonsterFrontend/setup-automation.js',
    type: 'file',
    priority: 'MEDIUM',
    reason: 'Setup automation script'
  },
  {
    path: 'MonsterFrontend/start-platform.bat',
    type: 'file',
    priority: 'MEDIUM',
    reason: 'Windows batch file (alternative startup)'
  },

  // Test Files
  {
    path: 'MonsterFrontend/test-database-integration.js',
    type: 'file',
    priority: 'MEDIUM',
    reason: 'Test script'
  },
  {
    path: 'MonsterFrontend/test-google-drive-upload.js',
    type: 'file',
    priority: 'MEDIUM',
    reason: 'Test script'
  },
  {
    path: 'MonsterFrontend/test-optimizations.cjs',
    type: 'file',
    priority: 'MEDIUM',
    reason: 'Test script'
  },
  {
    path: 'MonsterFrontend/test-product-creation.js',
    type: 'file',
    priority: 'MEDIUM',
    reason: 'Test script'
  },
  {
    path: 'MonsterFrontend/test-product-editing.js',
    type: 'file',
    priority: 'MEDIUM',
    reason: 'Test script'
  },

  // Backend Setup/Test Scripts
  {
    path: 'MonsterBackend/create-admin-auth.js',
    type: 'file',
    priority: 'MEDIUM',
    reason: 'Setup script'
  },
  {
    path: 'MonsterBackend/create-tables.js',
    type: 'file',
    priority: 'MEDIUM',
    reason: 'Setup script'
  },
  {
    path: 'MonsterBackend/fix-admin-simple.js',
    type: 'file',
    priority: 'MEDIUM',
    reason: 'Setup script'
  },
  {
    path: 'MonsterBackend/test-supabase-connection.js',
    type: 'file',
    priority: 'MEDIUM',
    reason: 'Test script'
  },

  // Documentation Files
  {
    path: 'MonsterFrontend/docs/WholesalerHomeImprovements',
    type: 'directory',
    priority: 'MEDIUM',
    reason: 'Duplicate documentation'
  },
  {
    path: 'MonsterFrontend/docs/WholesalerHomeCodeComparison.md',
    type: 'file',
    priority: 'MEDIUM',
    reason: 'Duplicate documentation'
  },
  {
    path: 'MonsterFrontend/docs/WholesalerHomeRefactoringReport.md',
    type: 'file',
    priority: 'MEDIUM',
    reason: 'Duplicate documentation'
  },
  {
    path: 'MonsterFrontend/PERFORMANCE_OPTIMIZATION_GUIDE.md',
    type: 'file',
    priority: 'MEDIUM',
    reason: 'Development documentation'
  },
  {
    path: 'MonsterFrontend/PRODUCT_HOOK_IMPROVEMENTS.md',
    type: 'file',
    priority: 'MEDIUM',
    reason: 'Development documentation'
  },
  {
    path: 'MonsterFrontend/PROJECT_SUMMARY.md',
    type: 'file',
    priority: 'MEDIUM',
    reason: 'Development documentation'
  },
  {
    path: 'MonsterBackend/SUPABASE_TEST_GUIDE.md',
    type: 'file',
    priority: 'MEDIUM',
    reason: 'Development documentation'
  },

  // Root Level Analysis Documents
  {
    path: 'MonsterMen90_COMPREHENSIVE_ANALYSIS_REPORT.md',
    type: 'file',
    priority: 'MEDIUM',
    reason: 'Development planning document'
  },
  {
    path: 'MonsterMen90_IMMEDIATE_ACTION_PLAN.md',
    type: 'file',
    priority: 'MEDIUM',
    reason: 'Development planning document'
  },
  {
    path: 'MonsterMen90_IMPROVEMENT_ROADMAP.md',
    type: 'file',
    priority: 'MEDIUM',
    reason: 'Development planning document'
  },

  // Configuration File Duplicates
  {
    path: 'MonsterFrontend/tsconfig.app.json',
    type: 'file',
    priority: 'LOW',
    reason: 'Duplicate config file'
  },
  {
    path: 'MonsterFrontend/tsconfig.node.json',
    type: 'file',
    priority: 'LOW',
    reason: 'Duplicate config file'
  },
  {
    path: 'MonsterFrontend/eslint.config.js',
    type: 'file',
    priority: 'LOW',
    reason: 'Duplicate config file'
  },
  {
    path: 'MonsterFrontend/postcss.config.js',
    type: 'file',
    priority: 'LOW',
    reason: 'Duplicate config file'
  },
  {
    path: 'MonsterFrontend/.cspell.json',
    type: 'file',
    priority: 'LOW',
    reason: 'Optional config file'
  },

  // Logs and Temporary Files
  {
    path: 'MonsterBackend/logs/.gitkeep',
    type: 'file',
    priority: 'LOW',
    reason: 'Temporary log file'
  },
  {
    path: 'MonsterFrontend/public/vite.svg',
    type: 'file',
    priority: 'LOW',
    reason: 'Default template asset'
  },
  {
    path: 'MonsterFrontend/src/assets/react.svg',
    type: 'file',
    priority: 'LOW',
    reason: 'Default template asset'
  }
];

// Essential files to verify exist
const essentialFiles = [
  'MonsterBackend/server.js',
  'MonsterBackend/package.json',
  'MonsterBackend/.env',
  'MonsterBackend/db/db.js',
  'MonsterFrontend/package.json',
  'MonsterFrontend/src/App.tsx',
  'MonsterFrontend/index.html',
  'MonsterFrontend/vite.config.ts',
  'MonsterFrontend/tailwind.config.js',
  'MonsterFrontend/supabase/config.toml'
];

async function cleanup() {
  log('\n🧹 MONSTERMEN90 PROJECT CLEANUP', 'bright');
  log('=' .repeat(50), 'magenta');

  logProgress('Analyzing project structure...');

  let removedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  // Remove files by priority
  const priorities = ['HIGH', 'MEDIUM', 'LOW'];
  
  for (const priority of priorities) {
    logProgress(`Removing ${priority} priority items...`);
    
    const tasks = cleanupTasks.filter(task => task.priority === priority);
    
    for (const task of tasks) {
      try {
        if (fs.existsSync(task.path)) {
          if (task.type === 'directory') {
            fs.rmSync(task.path, { recursive: true, force: true });
            logSuccess(`Removed directory: ${task.path}`);
          } else {
            fs.unlinkSync(task.path);
            logSuccess(`Removed file: ${task.path}`);
          }
          removedCount++;
        } else {
          logWarning(`File not found (already removed): ${task.path}`);
          skippedCount++;
        }
      } catch (error) {
        logError(`Failed to remove ${task.path}: ${error.message}`);
        errorCount++;
      }
    }
  }

  // Verify essential files exist
  logProgress('Verifying essential files...');
  
  let missingEssential = 0;
  for (const file of essentialFiles) {
    if (!fs.existsSync(file)) {
      logError(`Missing essential file: ${file}`);
      missingEssential++;
    }
  }

  // Summary
  log('\n🎉 CLEANUP COMPLETED!', 'bright');
  log('=' .repeat(50), 'green');
  
  log(`\n📊 Cleanup Summary:`, 'cyan');
  log(`   ✅ Files removed: ${removedCount}`, 'green');
  log(`   ⚠️  Files skipped: ${skippedCount}`, 'yellow');
  log(`   ❌ Errors: ${errorCount}`, 'red');
  
  if (missingEssential === 0) {
    log(`   ✅ All essential files present`, 'green');
  } else {
    log(`   ❌ Missing essential files: ${missingEssential}`, 'red');
  }

  // Recommendations
  log('\n📋 Next Steps:', 'cyan');
  log('1. Test that the application still runs correctly', 'white');
  log('2. Verify all routes and components work', 'white');
  log('3. Check that database connections work', 'white');
  log('4. Ensure frontend builds successfully', 'white');
  log('5. Confirm backend server starts properly', 'white');

  // Final structure
  log('\n📁 Clean Project Structure:', 'cyan');
  log('MonsterMen90/', 'white');
  log('├── .gitignore', 'white');
  log('├── package.json', 'white');
  log('├── nginx.conf', 'white');
  log('├── start-platform.sh', 'white');
  log('├── start-simple.bat', 'white');
  log('├── MonsterBackend/', 'white');
  log('│   ├── server.js', 'white');
  log('│   ├── package.json', 'white');
  log('│   ├── .env', 'white');
  log('│   ├── db/db.js', 'white');
  log('│   ├── routes/', 'white');
  log('│   ├── fix-realtime-view.js', 'white');
  log('│   └── simple-realtime-fix.js', 'white');
  log('├── MonsterFrontend/', 'white');
  log('│   ├── src/', 'white');
  log('│   ├── package.json', 'white');
  log('│   ├── .env.example', 'white');
  log('│   ├── index.html', 'white');
  log('│   ├── vite.config.ts', 'white');
  log('│   ├── tailwind.config.js', 'white');
  log('│   └── supabase/', 'white');
  log('└── supabase/', 'white');
  log('    └── config.toml', 'white');

  if (errorCount === 0 && missingEssential === 0) {
    log('\n🚀 Project cleanup successful! Your project is now clean and functional.', 'bright');
    return true;
  } else {
    log('\n⚠️  Cleanup completed with some issues. Please review the errors above.', 'yellow');
    return false;
  }
}

// Interactive confirmation
async function main() {
  log('\n🤔 This cleanup will remove unnecessary files from your project.', 'yellow');
  log('The following will be removed:', 'yellow');
  
  const highPriority = cleanupTasks.filter(t => t.priority === 'HIGH');
  const mediumPriority = cleanupTasks.filter(t => t.priority === 'MEDIUM');
  const lowPriority = cleanupTasks.filter(t => t.priority === 'LOW');
  
  log(`\n🔴 HIGH Priority (${highPriority.length} items):`, 'red');
  highPriority.forEach(task => log(`   • ${path.basename(task.path)}`, 'red'));
  
  log(`\n🟡 MEDIUM Priority (${mediumPriority.length} items):`, 'yellow');
  mediumPriority.slice(0, 5).forEach(task => log(`   • ${path.basename(task.path)}`, 'yellow'));
  if (mediumPriority.length > 5) {
    log(`   ... and ${mediumPriority.length - 5} more files`, 'yellow');
  }
  
  log(`\n🟢 LOW Priority (${lowPriority.length} items):`, 'green');
  lowPriority.slice(0, 3).forEach(task => log(`   • ${path.basename(task.path)}`, 'green'));
  if (lowPriority.length > 3) {
    log(`   ... and ${lowPriority.length - 3} more files`, 'green');
  }

  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question('\n❓ Do you want to proceed with cleanup? (y/N): ', (answer) => {
      rl.close();
      if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
        resolve(true);
      } else {
        log('\n❌ Cleanup cancelled by user.', 'yellow');
        resolve(false);
      }
    });
  });
}

// Run cleanup
main().then(shouldProceed => {
  if (shouldProceed) {
    cleanup().then(success => {
      process.exit(success ? 0 : 1);
    }).catch(error => {
      logError(`Cleanup failed: ${error.message}`);
      process.exit(1);
    });
  } else {
    process.exit(0);
  }
}).catch(error => {
  logError(`Failed to start cleanup: ${error.message}`);
  process.exit(1);
});