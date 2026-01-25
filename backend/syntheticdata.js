const mongoose = require('mongoose');
const SensorData = require('./models/SensorData');
const Loom = require('./models/Loom');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

/**
 * Generate realistic incremental sensor data for running looms
 * This simulates real sensor readings every 5 seconds
 */
async function generateRealtimeSensorData() {
  try {
    // Find all running looms
    const runningLooms = await Loom.find({ 
      status: 'running',
      runningSince: { $exists: true, $ne: null }
    });

    if (runningLooms.length === 0) {
      console.log('⚠️  No running looms found. Waiting...');
      return;
    }

    console.log(`🔄 Generating real-time data for ${activeLooms.length} running loom(s)...`);

    for (const loom of activeLooms) {
      // Get the last sensor reading for this loom's current session
      const lastReading = await SensorData.findOne({ 
        loomId: loom._id,
        timestamp: { $gte: loom.runningSince }
      }).sort({ timestamp: -1 });

      // Calculate cumulative values from the start of this running session
      let cumulativeProduction = 0;
      let cumulativeEnergy = 0;

      if (lastReading) {
        // Continue from last reading
        cumulativeProduction = lastReading.production;
        cumulativeEnergy = lastReading.energy;
      }

      // Generate realistic incremental values (per 5 seconds)
      // Production: ~0.1 to 0.5 meters per 5 seconds (realistic weaving speed)
      // Energy: ~0.02 to 0.08 kWh per 5 seconds (realistic power consumption)
      const productionIncrement = Math.random() * 0.4 + 0.1;
      const energyIncrement = Math.random() * 0.06 + 0.02;

      // Add increments to cumulative totals
      cumulativeProduction += productionIncrement;
      cumulativeEnergy += energyIncrement;

      const newReading = {
        loomId: loom._id,
        production: parseFloat(cumulativeProduction.toFixed(3)),
        energy: parseFloat(cumulativeEnergy.toFixed(3)),
        timestamp: new Date()
      };

      await SensorData.create(newReading);

      console.log(`  ✓ ${loom.loomId}: Production=${newReading.production.toFixed(2)}m (+${productionIncrement.toFixed(2)}), Energy=${newReading.energy.toFixed(2)}kWh (+${energyIncrement.toFixed(2)})`);
    }

    console.log('✅ Real-time sensor data generated\n');
  } catch (error) {
    console.error('❌ Error generating sensor data:', error);
  }
}

/**
 * Generate historical test data for completed shifts
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
    const interval = intervalMinutes * 60 * 1000;

    let currentTime = start;
    let cumulativeProduction = 0;
    let cumulativeEnergy = 0;
    let count = 0;

    // Clear existing data in this time range to avoid duplicates
    await SensorData.deleteMany({
      loomId: loom._id,
      timestamp: { $gte: start, $lte: end }
    });

    while (currentTime <= end) {
      // Realistic increments per interval
      const productionIncrement = (Math.random() * 0.4 + 0.1) * (intervalMinutes / 5);
      const energyIncrement = (Math.random() * 0.06 + 0.02) * (intervalMinutes / 5);
      
      cumulativeProduction += productionIncrement;
      cumulativeEnergy += energyIncrement;

      await SensorData.create({
        loomId: loom._id,
        production: parseFloat(cumulativeProduction.toFixed(3)),
        energy: parseFloat(cumulativeEnergy.toFixed(3)),
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
 * Clear sensor data for specific loom or all
 */
async function clearSensorData(loomId = null) {
  try {
    if (loomId) {
      const loom = await Loom.findOne({ loomId });
      if (!loom) {
        console.log(`❌ Loom ${loomId} not found`);
        return;
      }
      const result = await SensorData.deleteMany({ loomId: loom._id });
      console.log(`🗑️  Deleted ${result.deletedCount} sensor data records for ${loomId}`);
    } else {
      const result = await SensorData.deleteMany({});
      console.log(`🗑️  Deleted ${result.deletedCount} sensor data records`);
    }
  } catch (error) {
    console.error('❌ Error clearing sensor data:', error);
  }
}

/**
 * Display system statistics
 */
async function showStats() {
  try {
    const looms = await Loom.find();
    const totalSensorData = await SensorData.countDocuments();

    console.log('\n📊 System Statistics:');
    console.log('─────────────────────────────────────────────────────');
    console.log(`Total Looms: ${looms.length}`);
    console.log(`Running Looms: ${looms.filter(l => l.status === 'running').length}`);
    console.log(`Total Sensor Readings: ${totalSensorData}`);
    console.log('─────────────────────────────────────────────────────\n');

    for (const loom of looms) {
      const totalCount = await SensorData.countDocuments({ loomId: loom._id });
      
      // Get current session data if running
      let currentSessionCount = 0;
      let currentSessionData = null;
      
      if (loom.status === 'running' && loom.runningSince) {
        currentSessionCount = await SensorData.countDocuments({ 
          loomId: loom._id,
          timestamp: { $gte: loom.runningSince }
        });
        
        currentSessionData = await SensorData.findOne({ 
          loomId: loom._id,
          timestamp: { $gte: loom.runningSince }
        }).sort({ timestamp: -1 });
      }
      
      const latest = await SensorData.findOne({ loomId: loom._id }).sort({ timestamp: -1 });
      
      console.log(`${loom.loomId}:`);
      console.log(`  Status: ${loom.status}`);
      console.log(`  Total sensor readings: ${totalCount}`);
      
      if (loom.status === 'running' && currentSessionData) {
        console.log(`  Current session readings: ${currentSessionCount}`);
        console.log(`  Current production: ${currentSessionData.production.toFixed(2)}m`);
        console.log(`  Current energy: ${currentSessionData.energy.toFixed(2)}kWh`);
        console.log(`  Running since: ${new Date(loom.runningSince).toLocaleString('en-IN')}`);
      } else if (latest) {
        console.log(`  Latest production: ${latest.production.toFixed(2)}m`);
        console.log(`  Latest energy: ${latest.energy.toFixed(2)}kWh`);
        console.log(`  Last reading: ${new Date(latest.timestamp).toLocaleString('en-IN')}`);
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
    case 'start':
      // Start real-time simulation (every 5 seconds)
      console.log('🚀 Starting REAL-TIME sensor data simulation');
      console.log('   Generating data every 5 seconds for running looms');
      console.log('   Press Ctrl+C to stop\n');
      
      // Initial generation
      await generateRealtimeSensorData();
      
      // Continue generating every 5 seconds
      setInterval(generateRealtimeSensorData, 5000);
      break;

    case 'historical':
      // Generate historical data
      // Usage: node sensorSimulator.js historical LOOM-001 "2026-01-20T06:00:00" "2026-01-20T14:00:00" 5
      const [, loomId, startTime, endTime, interval] = args;
      if (!loomId || !startTime || !endTime) {
        console.log('❌ Usage: node sensorSimulator.js historical LOOM-ID START_TIME END_TIME [INTERVAL_MINUTES]');
        console.log('   Example: node sensorSimulator.js historical LOOM-001 "2026-01-20T06:00:00" "2026-01-20T14:00:00" 5');
        process.exit(1);
      }
      await generateHistoricalData(loomId, startTime, endTime, interval ? parseInt(interval) : 5);
      process.exit(0);
      break;

    case 'clear':
      // Clear sensor data
      // Usage: node sensorSimulator.js clear [LOOM-ID]
      const clearLoomId = args[1];
      if (clearLoomId && clearLoomId !== 'all') {
        await clearSensorData(clearLoomId);
      } else if (clearLoomId === 'all') {
        console.log('⚠️  This will delete ALL sensor data!');
        await clearSensorData();
      } else {
        console.log('Usage: node sensorSimulator.js clear [LOOM-ID | all]');
      }
      process.exit(0);
      break;

    case 'stats':
      // Show statistics
      await showStats();
      process.exit(0);
      break;

    default:
      console.log('📚 Real-time Sensor Data Simulator - Usage:');
      console.log('─────────────────────────────────────────────────────────────────');
      console.log('  node sensorSimulator.js start');
      console.log('    → Start real-time simulation (generates data every 5 seconds)');
      console.log('    → Automatically detects and generates data for running looms');
      console.log('');
      console.log('  node sensorSimulator.js historical LOOM-ID START END [INTERVAL]');
      console.log('    → Generate historical data for testing past shifts');
      console.log('    → Example: historical LOOM-001 "2026-01-20T06:00:00" "2026-01-20T14:00:00" 5');
      console.log('');
      console.log('  node sensorSimulator.js stats');
      console.log('    → Show system statistics and sensor data summary');
      console.log('');
      console.log('  node sensorSimulator.js clear [LOOM-ID | all]');
      console.log('    → Clear sensor data for specific loom or all looms');
      console.log('─────────────────────────────────────────────────────────────────');
      process.exit(0);
  }
})();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n\n👋 Stopping sensor simulator...');
  await mongoose.connection.close();
  process.exit(0);
});