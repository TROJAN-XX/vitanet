import mongoose from 'mongoose';
import app from './app.js';
import env from './config/env.js';

const PORT = env.PORT;

/**
 * Connect to MongoDB and start the HTTP server.
 * Implements graceful shutdown for SIGTERM/SIGINT.
 */
async function start() {
  try {
    // Connect to MongoDB Atlas
    console.log('Connecting to MongoDB...');
    await mongoose.connect(env.MONGODB_URI, {
      // Mongoose 8 defaults are good; explicit for clarity
      maxPoolSize: 5,         // Free tier — keep connections low
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ MongoDB connected');

    // Start HTTP server
    const server = app.listen(PORT, () => {
      console.log(`✅ VitaNet API running on port ${PORT} [${env.NODE_ENV}]`);
    });

    // ── Graceful shutdown ──
    const shutdown = async (signal) => {
      console.log(`\n${signal} received. Shutting down gracefully...`);

      server.close(async () => {
        console.log('HTTP server closed');
        try {
          await mongoose.connection.close();
          console.log('MongoDB connection closed');
        } catch (err) {
          console.error('Error closing MongoDB:', err.message);
        }
        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        console.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (err) {
    console.error('❌ Failed to start server:', err.message);
    process.exit(1);
  }
}

start();
