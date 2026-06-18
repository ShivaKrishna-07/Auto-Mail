import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { gmailService, SyncProgressData } from '../services/gmail.service';
import { db } from '../db/connection';
import { gmailAccounts as gmailAccountsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export interface SyncProgressState {
  syncing: boolean;
  total?: number;
  processed?: number;
  statusMessage?: string;
}

// Simple in-memory state for tracking background syncs
const activeSyncs = new Map<string, SyncProgressState>();

class SyncController {
  async triggerSync(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    if (activeSyncs.get(userId)?.syncing) {
      return res.status(409).json({ error: 'A sync process is already running.', status: 'already_syncing' });
    }

    const limit = req.body.limit ? parseInt(req.body.limit) : 50;

    try {
      console.log(`Sync pipeline initiated for user: ${userId}, limit: ${limit}`);
      
      // Mark as syncing
      activeSyncs.set(userId, { syncing: true, statusMessage: 'Starting sync...' });

      // Start background process with progress callback
      gmailService.syncEmails(userId, limit, (progress: SyncProgressData) => {
        // Update the active syncs map with progress
        activeSyncs.set(userId, {
          syncing: true,
          total: progress.total,
          processed: progress.processed,
          statusMessage: progress.status,
        });
      })
        .then((result) => {
          console.log(`Sync completed for ${userId}:`, result);
        })
        .catch((error) => {
          console.error(`Background sync failed for ${userId}:`, error);
        })
        .finally(() => {
          // Clear syncing state
          activeSyncs.delete(userId);
        });

      // Return immediately
      return res.json({ status: 'sync_started', message: 'Synchronization has started in the background.' });
    } catch (error: any) {
      console.error('Error in triggerSync controller:', error);
      activeSyncs.delete(userId);
      return res.status(500).json({ error: error.message || 'Failed to start synchronization.' });
    }
  }

  async getSyncStatus(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    try {
      const account = await db.query.gmailAccounts.findFirst({
        where: eq(gmailAccountsTable.userId, userId),
      });

      if (!account) {
        return res.status(404).json({ error: 'Gmail account not linked.' });
      }

      const activeSync = activeSyncs.get(userId);

      return res.json({
        email: account.email,
        historyId: account.historyId,
        lastSyncedAt: account.updatedAt,
        syncing: activeSync?.syncing || false,
        total: activeSync?.total,
        processed: activeSync?.processed,
        statusMessage: activeSync?.statusMessage,
      });
    } catch (error: any) {
      console.error('Error fetching sync status:', error);
      return res.status(500).json({ error: error.message || 'Internal Server Error.' });
    }
  }
}

export const syncController = new SyncController();
