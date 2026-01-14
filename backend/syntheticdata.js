const mongoose = require('mongoose');
const SensorData = require('./models/SensorData');
const Loom = require('./models/Loom');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/loom-management')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

/**
 * Generate realistic sensor data for running looms
 */
async function generateSensorData() {
  try {
    // Find all running looms
    const runningLooms = await Loom.find({ 
      status: 'running',
      runningSince: { $exists: true, $ne: null }
    });

    if (runningLooms.length === 0) {
      console.log('⚠️  No running looms found. Start a loom first!');
      return;
    }

    console.log(`🔄 Generating data for ${runningLooms.length} running looms...`);

    for (const loom of runningLooms) {
      // Get last sensor reading for cumulative calculation
      const lastReading = await SensorData.findOne({ 
        loomId: loom._id 
      }).sort({ timestamp: -1 });

      // Generate realistic incremental values
      const baseProduction = lastReading ? lastReading.production : 0;
      const baseEnergy = lastReading ? lastReading.energy : 0;

      // Add incremental values (simulating continuous operation)
      const productionIncrement = Math.random() * 2 + 0.5; // 0.5 to 2.5 meters per reading
      const energyIncrement = Math.random() * 0.3 + 0.1;   // 0.1 to 0.4 kWh per reading

      const newReading = {
        loomId: loom._id,
        production: baseProduction + productionIncrement,
        energy: baseEnergy + energyIncrement,
        timestamp: new Date()
      };

      await SensorData.create(newReading);

      console.log(`  ✓ ${loom.loomId}: Production=${newReading.production.toFixed(2)}m, Energy=${newReading.energy.toFixed(2)}kWh`);
    }

    console.log('✅ Sensor data generated successfully\n');
  } catch (error) {
    console.error('❌ Error generating sensor data:', error);
  }
}

/**
 * Generate historical test data for a completed shift
 */
async function generateHistoricalData(loomId, startTime, endTime, intervalMinutes = 5) {
  try {
    const loom = await Loom.findOne({ loomId });
    
    if (!loom) {
      console.log(`❌ Loom ${loomId} not found`);
      return;
    }

    console.log(`🔄 Generating historical data for ${loomId}...`);

    const start = new Date(startTime);
    const end = new Date(endTime);
    const interval = intervalMinutes * 60 * 1000; // Convert to milliseconds

    let currentTime = start;
    let cumulativeProduction = 0;
    let cumulativeEnergy = 0;
    let count = 0;

    while (currentTime <= end) {
      // Generate realistic cumulative values
      cumulativeProduction += Math.random() * 2 + 0.5;
      cumulativeEnergy += Math.random() * 0.3 + 0.1;

      await SensorData.create({
        loomId: loom._id,
        production: cumulativeProduction,
        energy: cumulativeEnergy,
        timestamp: new Date(currentTime)
      });

      currentTime = new Date(currentTime.getTime() + interval);
      count++;
    }

    console.log(`✅ Generated ${count} historical data points`);
    console.log(`   Total Production: ${cumulativeProduction.toFixed(2)}m`);
    console.log(`   Total Energy: ${cumulativeEnergy.toFixed(2)}kWh\n`);
  } catch (error) {
    console.error('❌ Error generating historical data:', error);
  }
}

/**
 * Clear all sensor data (use with caution!)
 */
async function clearAllSensorData() {
  try {
    const result = await SensorData.deleteMany({});
    console.log(`🗑️  Deleted ${result.deletedCount} sensor data records`);
  } catch (error) {
    console.error('❌ Error clearing sensor data:', error);
  }
}

/**
 * Display statistics
 */
async function showStats() {
  try {
    const looms = await Loom.find();
    const totalSensorData = await SensorData.countDocuments();

    console.log('\n📊 System Statistics:');
    console.log('─────────────────────────────────');
    console.log(`Total Looms: ${looms.length}`);
    console.log(`Running Looms: ${looms.filter(l => l.status === 'running').length}`);
    console.log(`Total Sensor Readings: ${totalSensorData}`);
    console.log('─────────────────────────────────\n');

    for (const loom of looms) {
      const count = await SensorData.countDocuments({ loomId: loom._id });
      const latest = await SensorData.findOne({ loomId: loom._id }).sort({ timestamp: -1 });
      
      console.log(`${loom.loomId}:`);
      console.log(`  Status: ${loom.status}`);
      console.log(`  Sensor readings: ${count}`);
      if (latest) {
        console.log(`  Latest production: ${latest.production.toFixed(2)}m`);
        console.log(`  Latest energy: ${latest.energy.toFixed(2)}kWh`);
      }
      console.log('');
    }
  } catch (error) {
    console.error('❌ Error showing stats:', error);
  }
}

// ============================================
// MAIN EXECUTION
// ============================================

const args = process.argv.slice(2);
const command = args[0];

(async () => {
  switch (command) {
    case 'generate':
      // Generate data once
      await generateSensorData();
      process.exit(0);
      break;

    case 'continuous':
      // Generate data continuously
      console.log('🚀 Starting continuous data generation (every 30 seconds)');
      console.log('   Press Ctrl+C to stop\n');
      
      await generateSensorData();
      setInterval(generateSensorData, 30000); // Every 30 seconds
      break;

    case 'historical':
      // Generate historical data
      // Usage: node testDataGenerator.js historical LOOM-123 "2026-01-07T06:00:00" "2026-01-07T14:00:00"
      const [, loomId, startTime, endTime] = args;
      if (!loomId || !startTime || !endTime) {
        console.log('❌ Usage: node testDataGenerator.js historical LOOM-ID START_TIME END_TIME');
        console.log('   Example: node testDataGenerator.js historical LOOM-123 "2026-01-07T06:00:00" "2026-01-07T14:00:00"');
        process.exit(1);
      }
      await generateHistoricalData(loomId, startTime, endTime);
      process.exit(0);
      break;

    case 'clear':
      // Clear all sensor data
      console.log('⚠️  This will delete ALL sensor data. Are you sure?');
      console.log('   Run: node testDataGenerator.js clear confirm');
      if (args[1] === 'confirm') {
        await clearAllSensorData();
      }
      process.exit(0);
      break;

    case 'stats':
      // Show statistics
      await showStats();
      process.exit(0);
      break;

    default:
      console.log('📚 Test Data Generator - Usage:');
      console.log('─────────────────────────────────────────────────────────');
      console.log('  node testDataGenerator.js generate');
      console.log('    → Generate sensor data once for all running looms');
      console.log('');
      console.log('  node testDataGenerator.js continuous');
      console.log('    → Generate data continuously every 30 seconds');
      console.log('');
      console.log('  node testDataGenerator.js historical LOOM-ID START END');
      console.log('    → Generate historical data for a specific time range');
      console.log('    Example: historical LOOM-123 "2026-01-07T06:00:00" "2026-01-07T14:00:00"');
      console.log('');
      console.log('  node testDataGenerator.js stats');
      console.log('    → Show system statistics');
      console.log('');
      console.log('  node testDataGenerator.js clear confirm');
      console.log('    → Clear all sensor data (use with caution!)');
      console.log('─────────────────────────────────────────────────────────');
      process.exit(0);
  }
})();

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n👋 Stopping data generator...');
  mongoose.connection.close();
  process.exit(0);
});