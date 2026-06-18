import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { db } from '../db/connection';
import { users as usersTable, gmailAccounts as gmailAccountsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

class AuthController {
  getGoogleAuthUrl(req: Request, res: Response) {
    try {
      const url = authService.getAuthUrl();
      return res.json({ url });
    } catch (error: any) {
      console.error('Error generating Google Auth URL:', error);
      return res.status(500).json({ error: error.message || 'Failed to generate authorization URL.' });
    }
  }

  async handleGoogleCallback(req: Request, res: Response) {
    const { code } = req.query;
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Authorization code is required.' });
    }

    try {
      const { appToken, user } = await authService.handleCallback(code);
      // Redirect to the frontend callback page with the token
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const params = new URLSearchParams({
        token: appToken,
        user: JSON.stringify(user),
      });
      return res.redirect(`${frontendUrl}/auth/callback?${params.toString()}`);
    } catch (error: any) {
      console.error('Error in OAuth callback controller:', error);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      return res.redirect(`${frontendUrl}/auth/callback?error=${encodeURIComponent(error.message || 'OAuth authentication failed.')}`);
    }
  }

  async getCurrentUser(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    try {
      const user = await db.query.users.findFirst({
        where: eq(usersTable.id, userId),
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found.' });
      }

      const gmailAccount = await db.query.gmailAccounts.findFirst({
        where: eq(gmailAccountsTable.userId, userId),
      });

      return res.json({
        user,
        isGmailLinked: !!gmailAccount,
        gmailEmail: gmailAccount ? gmailAccount.email : null,
      });
    } catch (error: any) {
      console.error('Error fetching current user:', error);
      return res.status(500).json({ error: error.message || 'Internal Server Error.' });
    }
  }
}

export const authController = new AuthController();
