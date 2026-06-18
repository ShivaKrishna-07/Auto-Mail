import { google } from 'googleapis';
import { db } from '../db/connection';
import { users, gmailAccounts } from '../db/schema';
import { eq } from 'drizzle-orm';
import { ENV } from '../config/env';
import * as jwt from 'jsonwebtoken';

class AuthService {
  private getOAuthClient() {
    return new google.auth.OAuth2(
      ENV.GOOGLE_CLIENT_ID,
      ENV.GOOGLE_CLIENT_SECRET,
      ENV.GOOGLE_REDIRECT_URI
    );
  }

  getAuthUrl(): string {
    const client = this.getOAuthClient();
    return client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/gmail.modify',
      ],
    });
  }

  async handleCallback(code: string) {
    const client = this.getOAuthClient();
    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);

    // Get user info from OAuth
    const oauth2 = google.oauth2({ version: 'v2', auth: client });
    const userInfo = await oauth2.userinfo.get();
    
    const email = userInfo.data.email;
    const name = userInfo.data.name;

    if (!email) {
      throw new Error('Email not found in Google OAuth response');
    }

    // Upsert User
    let user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) {
      const [newUser] = await db.insert(users).values({
        email,
        name: name || null,
      }).returning();
      user = newUser;
    }

    // Upsert Gmail Account
    let gmailAccount = await db.query.gmailAccounts.findFirst({
      where: eq(gmailAccounts.email, email),
    });

    const expiresAt = new Date(Date.now() + (tokens.expiry_date ? (tokens.expiry_date - Date.now()) : 3600 * 1000));

    if (gmailAccount) {
      await db.update(gmailAccounts).set({
        accessToken: tokens.access_token!,
        refreshToken: tokens.refresh_token || gmailAccount.refreshToken, // refresh_token only returns when consent prompt is shown
        expiresAt,
        updatedAt: new Date(),
      }).where(eq(gmailAccounts.id, gmailAccount.id));
    } else {
      if (!tokens.refresh_token) {
        throw new Error('Google did not return a refresh token. Revoke access from Google permissions and sign in again.');
      }
      await db.insert(gmailAccounts).values({
        userId: user.id,
        email,
        accessToken: tokens.access_token!,
        refreshToken: tokens.refresh_token!,
        expiresAt,
      });
    }

    // Generate App JWT Token
    const appToken = jwt.sign(
      { userId: user.id, email: user.email },
      ENV.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return { appToken, user };
  }

  async getValidClient(userId: string) {
    const account = await db.query.gmailAccounts.findFirst({
      where: eq(gmailAccounts.userId, userId),
    });

    if (!account) {
      throw new Error('Gmail account credentials not found. Please log in first.');
    }

    const client = this.getOAuthClient();
    client.setCredentials({
      access_token: account.accessToken,
      refresh_token: account.refreshToken,
      expiry_date: account.expiresAt.getTime(),
    });

    // Check if token has expired or is close to expiry (within 1 min)
    if (account.expiresAt.getTime() - 60 * 1000 <= Date.now()) {
      const { credentials } = await client.refreshAccessToken();
      const expiresAt = new Date(Date.now() + (credentials.expiry_date ? (credentials.expiry_date - Date.now()) : 3600 * 1000));
      
      await db.update(gmailAccounts).set({
        accessToken: credentials.access_token!,
        expiresAt,
        updatedAt: new Date(),
      }).where(eq(gmailAccounts.id, account.id));

      client.setCredentials(credentials);
    }

    return client;
  }
}

export const authService = new AuthService();
