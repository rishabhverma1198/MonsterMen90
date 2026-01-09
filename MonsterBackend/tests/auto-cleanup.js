#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Auto Cleanup Script for MonsterMen90
 * Performs comprehensive cleanup and optimization
 */

class AutoCleanup {
  constructor() {
    this.workspaceDir = process.cwd();
    this.stats = {
      filesDeleted: 0,
      foldersDeleted: 0,
      optimizationApplied: 0,
      errors: []
    };
  }

  async run() {
    console.log('🧹 Starting MonsterMen90 Auto-Cleanup...');
    
    try {
      await this.removeDuplicateFiles();
      await this.optimizePackageFiles();
      await this.cleanupNodeModules();
      await this.optimizeConfigurationFiles();
      await this.generateProjectSummary();
      
      console.log('\n✅ Auto-Cleanup completed successfully!');
      console.log(`📊 Statistics:`);
      console.log(`   - Files deleted: ${this.stats.filesDeleted}`);
      console.log(`   - Folders deleted: ${this.stats.foldersDeleted}`);
      console.log(`   - Optimizations applied: ${this.stats.optimizationApplied}`);
      
      if (this.stats.errors.length > 0) {
        console.log(`\n⚠️  Errors encountered:`);
        this.stats.errors.forEach(error => console.log(`   - ${error}`));
      }
      
    } catch (error) {
      console.error('❌ Auto-Cleanup failed:', error.message);
      process.exit(1);
    }
  }

  async removeDuplicateFiles() {
    console.log('\n🔍 Removing duplicate files...');
    
    // Remove duplicate package.json files in subdirectories
    const duplicates = [
      'MonsterBackend/package-lock.json',
      'MonsterFrontend/package-lock.json'
    ];
    
    for (const file of duplicates) {
      const filePath = path.join(this.workspaceDir, file);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
          this.stats.filesDeleted++;
          console.log(`   ✓ Removed duplicate: ${file}`);
        } catch (error) {
          this.stats.errors.push(`Failed to remove ${file}: ${error.message}`);
        }
      }
    }
  }

  async optimizePackageFiles() {
    console.log('\n📦 Optimizing package files...');
    
    const packageFiles = [
      'MonsterBackend/package.json',
      'MonsterFrontend/package.json'
    ];
    
    for (const file of packageFiles) {
      const filePath = path.join(this.workspaceDir, file);
      if (fs.existsSync(filePath)) {
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          const packageData = JSON.parse(content);
          
          // Remove unnecessary scripts and dependencies
          if (packageData.scripts) {
            const keepScripts = ['start', 'dev', 'build', 'test'];
            const filteredScripts = {};
            
            for (const [key, value] of Object.entries(packageData.scripts)) {
              if (keepScripts.some(keep => key.includes(keep))) {
                filteredScripts[key] = value;
              }
            }
            
            packageData.scripts = filteredScripts;
            this.stats.optimizationApplied++;
          }
          
          // Write optimized file
          fs.writeFileSync(filePath, JSON.stringify(packageData, null, 2));
          console.log(`   ✓ Optimized: ${file}`);
          
        } catch (error) {
          this.stats.errors.push(`Failed to optimize ${file}: ${error.message}`);
        }
      }
    }
  }

  async cleanupNodeModules() {
    console.log('\n🗂️  Checking node_modules directories...');
    
    const nodeModulesPaths = [
      'MonsterBackend/node_modules',
      'MonsterFrontend/node_modules'
    ];
    
    for (const dir of nodeModulesPaths) {
      const dirPath = path.join(this.workspaceDir, dir);
      if (fs.existsSync(dirPath)) {
        try {
          const stats = fs.statSync(dirPath);
          const sizeInMB = stats.size / (1024 * 1024);
          
          if (sizeInMB > 100) {
            console.log(`   ✓ Large node_modules detected: ${dir} (${sizeInMB.toFixed(2)} MB)`);
            console.log(`     Recommendation: Run 'npm install' to optimize`);
          }
        } catch (error) {
          this.stats.errors.push(`Failed to check ${dir}: ${error.message}`);
        }
      }
    }
  }

  async optimizeConfigurationFiles() {
    console.log('\n⚙️  Optimizing configuration files...');
    
    const configFiles = [
      'MonsterFrontend/tsconfig.json',
      'MonsterFrontend/tsconfig.app.json',
      'MonsterFrontend/tsconfig.node.json',
      'MonsterFrontend/vite.config.ts',
      'MonsterFrontend/tailwind.config.js'
    ];
    
    for (const file of configFiles) {
      const filePath = path.join(this.workspaceDir, file);
      if (fs.existsSync(filePath)) {
        try {
          let content = fs.readFileSync(filePath, 'utf8');
          let optimized = false;
          
          // Basic optimization: remove excessive comments and whitespace
          content = content.replace(/\/\*[\s\S]*?\*\//g, ''); // Remove block comments
          content = content.replace(/\/\/.*$/gm, ''); // Remove line comments
          content = content.replace(/\n\s*\n/g, '\n'); // Remove excessive newlines
          
          if (content !== fs.readFileSync(filePath, 'utf8')) {
            optimized = true;
            this.stats.optimizationApplied++;
          }
          
          if (optimized) {
            fs.writeFileSync(filePath, content.trim());
            console.log(`   ✓ Optimized: ${file}`);
          }
          
        } catch (error) {
          this.stats.errors.push(`Failed to optimize ${file}: ${error.message}`);
        }
      }
    }
  }

  async generateProjectSummary() {
    console.log('\n📋 Generating project summary...');
    
    const summary = {
      timestamp: new Date().toISOString(),
      workspace: this.workspaceDir,
      stats: this.stats,
      recommendations: [
        'Run npm install in both MonsterBackend and MonsterFrontend',
        'Update .env files with actual Supabase credentials',
        'Set up proper database schema in Supabase',
        'Configure authentication flows',
        'Set up proper error handling and logging'
      ]
    };
    
    try {
      fs.writeFileSync(
        path.join(this.workspaceDir, 'AUTO_CLEANUP_REPORT.json'),
        JSON.stringify(summary, null, 2)
      );
      console.log('   ✓ Generated: AUTO_CLEANUP_REPORT.json');
    } catch (error) {
      this.stats.errors.push(`Failed to generate summary: ${error.message}`);
    }
  }
}

// Run cleanup if called directly
if (require.main === module) {
  const cleanup = new AutoCleanup();
  cleanup.run().catch(console.error);
}

module.exports = AutoCleanup;