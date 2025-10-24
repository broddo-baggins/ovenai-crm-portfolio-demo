#!/usr/bin/env node

/**
 * Automated Backup Cycler
 * 
 * Maintains rolling emergency backups and cleans up old ones
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

const BACKUP_CONFIG = {
  maxBackups: 10,          // Keep last 10 backups
  maxAge: 30,              // Delete backups older than 30 days
  backupOnChange: true,    // Auto-backup on significant changes
  checkInterval: 'daily'   // How often to run cleanup
};

async function createCycledBackup(reason = 'manual') {
  try {
    log('cyan', '🔄 CREATING CYCLED BACKUP');
    log('blue', '=========================');

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = `EMERGENCY_BACKUP/cycled-backup-${timestamp}`;
    
    // Create backup directory
    if (!fs.existsSync('EMERGENCY_BACKUP')) {
      fs.mkdirSync('EMERGENCY_BACKUP', { recursive: true });
    }
    fs.mkdirSync(backupDir, { recursive: true });

    log('blue', `\n📝 Backup reason: ${reason}`);
    log('blue', `📁 Backup location: ${backupDir}`);

    // Get git state for backup metadata
    const gitState = {
      commit: execSync('git log -1 --format="%H"', { encoding: 'utf8' }).trim(),
      branch: execSync('git branch --show-current', { encoding: 'utf8' }).trim(),
      changes: execSync('git status --porcelain', { encoding: 'utf8' }).trim(),
      timestamp: new Date().toISOString(),
      reason: reason
    };

    // Backup critical files only (faster)
    const criticalFiles = [
      'src/types/database.ts',
      'src/services/whatsapp-logging.ts',
      'src/services/whatsapp-monitoring.ts', 
      'src/services/whatsapp-alert-service.ts',
      'package.json',
      '.husky/pre-push'
    ];

    let backupCount = 0;
    criticalFiles.forEach(file => {
      if (fs.existsSync(file)) {
        const targetDir = path.dirname(path.join(backupDir, file));
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }
        fs.copyFileSync(file, path.join(backupDir, file));
        backupCount++;
      }
    });

    // Save backup metadata
    const metadata = {
      created: new Date().toISOString(),
      reason: reason,
      gitState: gitState,
      filesBackedUp: backupCount,
      backupType: 'cycled',
      systemState: {
        buildWorking: checkBuildStatus(),
        typescriptErrors: getTypescriptErrorCount(),
        lastModified: getLastModified()
      }
    };

    fs.writeFileSync(
      path.join(backupDir, 'backup-metadata.json'),
      JSON.stringify(metadata, null, 2)
    );

    log('green', `✅ Cycled backup created: ${backupCount} files`);
    return backupDir;

  } catch (error) {
    log('red', `❌ Cycled backup failed: ${error.message}`);
    throw error;
  }
}

function checkBuildStatus() {
  try {
    execSync('npm run build:clean', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

function getTypescriptErrorCount() {
  try {
    const output = execSync('npm run type-check', { encoding: 'utf8', stdio: 'pipe' });
    return 0; // No errors if command succeeds
  } catch (error) {
    const errorOutput = error.stdout || error.stderr || '';
    const matches = errorOutput.match(/Found (\d+) errors?/);
    return matches ? parseInt(matches[1]) : 'unknown';
  }
}

function getLastModified() {
  try {
    const lastCommit = execSync('git log -1 --format="%ci"', { encoding: 'utf8' }).trim();
    return lastCommit;
  } catch {
    return new Date().toISOString();
  }
}

async function cleanupOldBackups() {
  try {
    log('blue', '\n🧹 Cleaning up old backups...');
    
    if (!fs.existsSync('EMERGENCY_BACKUP')) {
      return;
    }

    const backups = fs.readdirSync('EMERGENCY_BACKUP')
      .filter(name => name.startsWith('cycled-backup-'))
      .map(name => {
        const fullPath = path.join('EMERGENCY_BACKUP', name);
        const stats = fs.statSync(fullPath);
        return {
          name,
          path: fullPath,
          created: stats.birthtime,
          age: (Date.now() - stats.birthtime.getTime()) / (1000 * 60 * 60 * 24) // days
        };
      })
      .sort((a, b) => b.created - a.created); // Newest first

    let cleaned = 0;

    // Remove backups older than maxAge days
    const oldBackups = backups.filter(backup => backup.age > BACKUP_CONFIG.maxAge);
    oldBackups.forEach(backup => {
      fs.rmSync(backup.path, { recursive: true, force: true });
      log('yellow', `  🗑️ Removed old backup: ${backup.name} (${backup.age.toFixed(1)} days old)`);
      cleaned++;
    });

    // Remove excess backups beyond maxBackups limit
    const recentBackups = backups.filter(backup => backup.age <= BACKUP_CONFIG.maxAge);
    const excessBackups = recentBackups.slice(BACKUP_CONFIG.maxBackups);
    excessBackups.forEach(backup => {
      fs.rmSync(backup.path, { recursive: true, force: true });
      log('yellow', `  🗑️ Removed excess backup: ${backup.name}`);
      cleaned++;
    });

    const remaining = backups.length - cleaned;
    log('green', `✅ Cleanup complete: ${cleaned} removed, ${remaining} kept`);

  } catch (error) {
    log('red', `❌ Cleanup failed: ${error.message}`);
  }
}

async function shouldCreateBackup() {
  try {
    // Check if there are uncommitted changes
    const changes = execSync('git status --porcelain', { encoding: 'utf8' }).trim();
    if (changes) {
      return { should: true, reason: 'uncommitted_changes' };
    }

    // Check when last backup was created
    if (fs.existsSync('EMERGENCY_BACKUP')) {
      const backups = fs.readdirSync('EMERGENCY_BACKUP')
        .filter(name => name.startsWith('cycled-backup-'))
        .map(name => {
          const fullPath = path.join('EMERGENCY_BACKUP', name);
          return fs.statSync(fullPath).birthtime;
        })
        .sort((a, b) => b - a); // Newest first

      if (backups.length > 0) {
        const lastBackup = backups[0];
        const hoursSinceLastBackup = (Date.now() - lastBackup.getTime()) / (1000 * 60 * 60);
        
        if (hoursSinceLastBackup > 24) {
          return { should: true, reason: 'daily_backup' };
        }
      }
    } else {
      return { should: true, reason: 'first_backup' };
    }

    return { should: false, reason: 'not_needed' };

  } catch (error) {
    return { should: true, reason: 'error_check' };
  }
}

async function runBackupCycle() {
  try {
    log('cyan', '🔄 RUNNING BACKUP CYCLE');
    log('blue', '======================');

    // Check if backup is needed
    const { should, reason } = await shouldCreateBackup();
    
    if (should) {
      log('yellow', `📋 Backup needed: ${reason}`);
      await createCycledBackup(reason);
    } else {
      log('green', `✅ No backup needed: ${reason}`);
    }

    // Always run cleanup
    await cleanupOldBackups();

    // Show backup status
    await showBackupStatus();

  } catch (error) {
    log('red', `❌ Backup cycle failed: ${error.message}`);
  }
}

async function showBackupStatus() {
  try {
    log('blue', '\n📊 BACKUP STATUS');
    log('blue', '================');

    if (!fs.existsSync('EMERGENCY_BACKUP')) {
      log('yellow', '⚠️ No backups found');
      return;
    }

    const backups = fs.readdirSync('EMERGENCY_BACKUP')
      .filter(name => name.startsWith('cycled-backup-') || name.startsWith('typescript-modernization-'))
      .map(name => {
        const fullPath = path.join('EMERGENCY_BACKUP', name);
        const stats = fs.statSync(fullPath);
        const age = (Date.now() - stats.birthtime.getTime()) / (1000 * 60 * 60 * 24);
        
        return {
          name: name.replace(/^(cycled-backup-|typescript-modernization-)/, ''),
          type: name.startsWith('typescript-modernization-') ? 'major' : 'cycled',
          created: stats.birthtime.toISOString().split('T')[0],
          age: age.toFixed(1) + ' days'
        };
      })
      .sort((a, b) => new Date(b.created) - new Date(a.created));

    backups.slice(0, 5).forEach(backup => {
      const icon = backup.type === 'major' ? '🎯' : '🔄';
      log('cyan', `  ${icon} ${backup.created} (${backup.age}) - ${backup.type}`);
    });

    if (backups.length > 5) {
      log('yellow', `  ... and ${backups.length - 5} more backups`);
    }

    log('green', `\n✅ Total backups: ${backups.length}`);

  } catch (error) {
    log('red', `❌ Status check failed: ${error.message}`);
  }
}

// Command line interface
const command = process.argv[2];

switch (command) {
  case 'create':
    createCycledBackup(process.argv[3] || 'manual');
    break;
  case 'cleanup':
    cleanupOldBackups();
    break;
  case 'status':
    showBackupStatus();
    break;
  case 'cycle':
  default:
    runBackupCycle();
    break;
} 