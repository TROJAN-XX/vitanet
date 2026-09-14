import { Router } from 'express';
import mongoose from 'mongoose';

const router = Router();

/**
 * GET /health
 * Basic liveness check — always returns 200.
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
    },
    requestId: req.requestId,
  });
});

/**
 * GET /ready
 * Readiness check — verifies database connectivity.
 */
router.get('/ready', async (req, res) => {
  const checks = {
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  };

  const isReady = checks.database === 'connected';

  res.status(isReady ? 200 : 503).json({
    success: isReady,
    data: {
      status: isReady ? 'ready' : 'not_ready',
      checks,
      timestamp: new Date().toISOString(),
    },
    requestId: req.requestId,
  });
});

export default router;
