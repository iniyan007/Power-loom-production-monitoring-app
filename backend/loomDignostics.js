const mongoose = require('mongoose');
const Loom = require('./models/Loom');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

/**
 * Diagnostic script to check loom status
 */
async function checkLoomStatus() {
  try {
    console.log('\n🔍 LOOM DIAGNOSTIC CHECK');
    console.log('═══════════════════════════════════════════════════\n');

    const looms = await Loom.find({});

    if (looms.length === 0) {
      console.log('❌ No looms found in database!\n');
      return;
    }

    console.log(`📊 Total Looms: ${looms.length}\n`);

    looms.forEach((loom, index) => {
      console.log(`${index + 1}. ${loom.loomId}`);
      console.log(`   ID: ${loom._id}`);
      console.log(`   Status: ${loom.status}`);
      console.log(`   runningSince: ${loom.runningSince || 'null'}`);
      console.log(`   currentWeaver: ${loom.currentWeaver || 'null'}`);
      console.log(`   createdAt: ${loom.createdAt}`);
      console.log(`   updatedAt: ${loom.updatedAt}`);
      
      // Check if it should be detected by simulator
      if (loom.status === 'running' && loom.runningSince) {
        console.log(`   ✅ WILL BE DETECTED by simulator`);
      } else if (loom.status === 'running' && !loom.runningSince) {
        console.log(`   ⚠️  WARNING: Running but no runningSince timestamp!`);
      } else {
        console.log(`   ⏸️  Stopped - will not generate data`);
      }
      console.log('');
    });

    // Summary
    const runningCount = looms.filter(l => l.status === 'running').length;
    const runningWithTimestamp = looms.filter(l => l.status === 'running' && l.runningSince).length;
    const runningWithoutTimestamp = looms.filter(l => l.status === 'running' && !l.runningSince).length;

    console.log('═══════════════════════════════════════════════════');
    console.log('📊 SUMMARY:');
    console.log(`   Total looms: ${looms.length}`);
    console.log(`   Running looms: ${runningCount}`);
    console.log(`   ✅ Running with runningSince: ${runningWithTimestamp}`);
    console.log(`   ⚠️  Running WITHOUT runningSince: ${runningWithoutTimestamp}`);
    console.log('═══════════════════════════════════════════════════\n');

    if (runningWithoutTimestamp > 0) {
      console.log('⚠️  ISSUE DETECTED:');
      console.log('   Some looms are marked as "running" but don\'t have runningSince.');
      console.log('   This will prevent the simulator from generating data.');
      console.log('   Solutions:');
      console.log('   1. Stop and restart the loom properly');
      console.log('   2. Use the force-start admin endpoint');
      console.log('   3. Run: node loomDiagnostic.js fix\n');
    }

    if (runningWithTimestamp === 0) {
      console.log('💡 TIP:');
      console.log('   No looms are currently running with proper timestamps.');
      console.log('   Start a loom first, then run the simulator.\n');
    }

  } catch (error) {
    console.error('❌ Error during diagnostic:', error);
  }
}

/**
 * Fix looms that are running but missing runningSince
 */
async function fixLooms() {
  try {
    console.log('\n🔧 FIXING LOOMS...\n');

    const brokenLooms = await Loom.find({
      status: 'running',
      $or: [
        { runningSince: null },
        { runningSince: { $exists: false } }
      ]
    });

    if (brokenLooms.length === 0) {
      console.log('✅ No looms need fixing!\n');
      return;
    }

    console.log(`Found ${brokenLooms.length} loom(s) to fix:\n`);

    for (const loom of brokenLooms) {
      console.log(`Fixing ${loom.loomId}...`);
      loom.runningSince = new Date();
      await loom.save();
      console.log(`✅ Fixed: ${loom.loomId} - runningSince set to ${loom.runningSince}\n`);
    }

    console.log('✅ All looms fixed!\n');

  } catch (error) {
    console.error('❌ Error fixing looms:', error);
  }
}

/**
 * Force set a specific loom to running
 */
async function forceStartLoom(loomId) {
  try {
    const loom = await Loom.findOne({ loomId });

    if (!loom) {
      console.log(`❌ Loom ${loomId} not found!\n`);
      return;
    }

    console.log(`\n🚀 Force-starting ${loomId}...\n`);

    loom.status = 'running';
    loom.runningSince = new Date();
    await loom.save();

    console.log(`✅ Loom started successfully!`);
    console.log(`   Status: ${loom.status}`);
    console.log(`   runningSince: ${loom.runningSince}\n`);

  } catch (error) {
    console.error('❌ Error force-starting loom:', error);
  }
}

/**
 * Stop all looms
 */
async function stopAllLooms() {
  try {
    console.log('\n🛑 Stopping all looms...\n');

    const result = await Loom.updateMany(
      { status: 'running' },
      { 
        $set: { 
          status: 'stopped',
          runningSince: null
        }
      }
    );

    console.log(`✅ Stopped ${result.modifiedCount} loom(s)\n`);

  } catch (error) {
    console.error('❌ Error stopping looms:', error);
  }
}

// ============================================
// MAIN EXECUTION
// ============================================

const args = process.argv.slice(2);
const command = args[0];

(async () => {
  switch (command) {
    case 'check':
    case 'status':
      await checkLoomStatus();
      break;

    case 'fix':
      await fixLooms();
      await checkLoomStatus();
      break;

    case 'start':
      const loomId = args[1];
      if (!loomId) {
        console.log('❌ Usage: node loomDiagnostic.js start LOOM-ID');
        console.log('   Example: node loomDiagnostic.js start LOOM-001');
        process.exit(1);
      }
      await forceStartLoom(loomId);
      break;

    case 'stop-all':
      await stopAllLooms();
      await checkLoomStatus();
      break;

    default:
      console.log('📚 Loom Diagnostic Tool - Usage:');
      console.log('─────────────────────────────────────────────────────');
      console.log('  node loomDiagnostic.js check');
      console.log('    → Check status of all looms');
      console.log('');
      console.log('  node loomDiagnostic.js fix');
      console.log('    → Fix looms that are running but missing runningSince');
      console.log('');
      console.log('  node loomDiagnostic.js start LOOM-ID');
      console.log('    → Force-start a specific loom');
      console.log('    Example: node loomDiagnostic.js start LOOM-001');
      console.log('');
      console.log('  node loomDiagnostic.js stop-all');
      console.log('    → Stop all running looms');
      console.log('─────────────────────────────────────────────────────');
  }

  await mongoose.connection.close();
  process.exit(0);
})(); 