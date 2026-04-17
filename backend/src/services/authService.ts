import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { User } from '../models/User';
import { AuditService } from './auditService';
import { SessionService, type SessionContext } from './sessionService';
import { comparePassword, hashPassword, isPasswordReused } from '../utils/password';
import { normalizeRole } from '../utils/roleHelpers';

type JwtPayload = {
  userId: string;
  role: string;
  canonicalRole?: string;
  branchId?: string | null;
  mustChangePassword?: boolean;
  sessionId?: string;
  jti?: string;
  exp?: number;
};

export class AuthService {
  private readonly sessionService = new SessionService();
  private readonly auditService = new AuditService();

  private signToken(payload: Record<string, unknown>, secret: string, expiresIn: string, sessionId: string) {
    return jwt.sign(payload, secret as any, { expiresIn, jwtid: sessionId } as any);
  }

  private parseTokenExpiry(token: string) {
    const decoded = jwt.decode(token) as JwtPayload | null;
    return new Date((decoded?.exp ?? Math.floor(Date.now() / 1000)) * 1000);
  }

  private serializeUser(user: any) {
    return {
      id: user._id?.toString?.() ?? user.id,
      name: user.name,
      username: user.username ?? '',
      email: user.email,
      phone: user.phone ?? '',
      role: normalizeRole(user.role) ?? user.role,
      originalRole: user.role,
      canonicalRole: normalizeRole(user.role) ?? user.role,
      branchId: user.branchId ?? null,
      profileImage: user?.profileImage?.replace('/uploads/', '') || null,
      mustChangePassword: Boolean(user.mustChangePassword),
      status: user.status ?? 'active',
      emailVerified: Boolean(user.emailVerifiedAt),
      phoneVerified: Boolean(user.phoneVerifiedAt)
    };
  }

  private async recordFailedLogin(user: any) {
    user.failedLoginAttempts = Number(user.failedLoginAttempts || 0) + 1;
    if (user.failedLoginAttempts >= 5) {
      user.lockedUntil = new Date(Date.now() + 30 * 60 * 1000);
      user.status = 'locked';
    }
    await user.save();
  }

  private async updateLoginContext(user: any, context?: SessionContext) {
    const devices = Array.isArray(user.loginDevices) ? user.loginDevices : [];
    const deviceId = context?.deviceId ?? 'web-browser';
    const existingDevice = devices.find((item: any) => item.deviceId === deviceId);

    if (existingDevice) {
      existingDevice.userAgent = context?.userAgent ?? existingDevice.userAgent ?? '';
      existingDevice.ipAddress = context?.ipAddress ?? existingDevice.ipAddress ?? '';
      existingDevice.lastSeenAt = new Date();
    } else {
      devices.push({
        deviceId,
        userAgent: context?.userAgent ?? '',
        ipAddress: context?.ipAddress ?? '',
        lastSeenAt: new Date(),
        trusted: false
      });
    }

    user.loginDevices = devices.slice(-10);
    user.failedLoginAttempts = 0;
    user.lockedUntil = null;
    user.status = user.status === 'pending_verification' ? 'pending_verification' : 'active';
    user.lastLoginAt = new Date();
    user.lastLoginIp = context?.ipAddress ?? '';
    await user.save();
  }

  async issueTokens(user: any, context?: SessionContext) {
    const sessionId = crypto.randomUUID();
    const canonicalRole = normalizeRole(user.role) ?? user.role;
    const accessToken = this.signToken(
      {
        userId: user._id.toString(),
        role: user.role,
        canonicalRole,
        branchId: user.branchId?.toString?.() ?? null,
        mustChangePassword: Boolean(user.mustChangePassword)
      },
      config.jwtSecret,
      config.jwtExpiresIn,
      sessionId
    );
    const refreshToken = this.signToken(
      {
        userId: user._id.toString(),
        role: user.role,
        canonicalRole,
        branchId: user.branchId?.toString?.() ?? null
      },
      config.refreshSecret,
      config.refreshExpiresIn,
      sessionId
    );

    await this.sessionService.createRefreshSession({
      userId: user._id.toString(),
      sessionId,
      rawToken: refreshToken,
      expiresAt: this.parseTokenExpiry(refreshToken),
      context
    });

    return {
      accessToken,
      refreshToken,
      sessionId,
      accessTokenExpiresAt: this.parseTokenExpiry(accessToken),
      refreshTokenExpiresAt: this.parseTokenExpiry(refreshToken)
    };
  }

  async login(email: string, password: string, context?: SessionContext) {
    const user = await User.findOne({ email, isDeleted: { $ne: true } }).select('+password +passwordHistory.hash');
    if (!user) {
      throw new Error('Invalid credentials');
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new Error('Account is temporarily locked due to failed login attempts');
    }

    const validPassword = await comparePassword(password, user.password as string);
    if (!validPassword) {
      await this.recordFailedLogin(user);
      throw new Error('Invalid credentials');
    }

    if (['inactive', 'suspended'].includes(user.status)) {
      throw new Error(`Account is ${user.status}`);
    }

    await this.updateLoginContext(user, context);
    const tokens = await this.issueTokens(user, context);

    await this.auditService.recordAction({
      actorId: user._id.toString(),
      branchId: user.branchId?.toString?.() ?? null,
      action: 'AUTH_LOGIN_SUCCESS',
      target: user._id.toString(),
      targetType: 'user',
      metadata: { deviceId: context?.deviceId ?? 'web-browser' },
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent
    });

    return {
      user: this.serializeUser(user),
      tokens
    };
  }

  async getProfile(userId: string) {
    const user = await User.findById(userId).lean<Record<string, any>>();
    if (!user || user.isDeleted) {
      throw new Error('User not found');
    }

    return this.serializeUser(user);
  }

  async refresh(refreshToken: string, context?: SessionContext) {
    let payload: JwtPayload;
    try {
      payload = jwt.verify(refreshToken, config.refreshSecret) as JwtPayload;
    } catch {
      throw new Error('Refresh token invalid');
    }

    const session = await this.sessionService.findValidSessionByToken(refreshToken, 'refresh');
    if (!session) {
      throw new Error('Refresh session invalid');
    }

    const user = await User.findById(payload.userId).select('+password');
    if (!user || user.isDeleted) {
      throw new Error('User not found');
    }

    const nextSessionId = crypto.randomUUID();
    const canonicalRole = normalizeRole(user.role) ?? user.role;
    const nextAccessToken = this.signToken(
      {
        userId: user._id.toString(),
        role: user.role,
        canonicalRole,
        branchId: user.branchId?.toString?.() ?? null,
        mustChangePassword: Boolean(user.mustChangePassword)
      },
      config.jwtSecret,
      config.jwtExpiresIn,
      nextSessionId
    );
    const nextRefreshToken = this.signToken(
      {
        userId: user._id.toString(),
        role: user.role,
        canonicalRole,
        branchId: user.branchId?.toString?.() ?? null
      },
      config.refreshSecret,
      config.refreshExpiresIn,
      nextSessionId
    );

    await this.sessionService.rotateRefreshSession({
      currentToken: refreshToken,
      nextSessionId,
      nextRawToken: nextRefreshToken,
      nextExpiresAt: this.parseTokenExpiry(nextRefreshToken),
      context
    });

    await this.updateLoginContext(user, context);

    return {
      user: this.serializeUser(user),
      tokens: {
        accessToken: nextAccessToken,
        refreshToken: nextRefreshToken,
        sessionId: nextSessionId,
        accessTokenExpiresAt: this.parseTokenExpiry(nextAccessToken),
        refreshTokenExpiresAt: this.parseTokenExpiry(nextRefreshToken)
      }
    };
  }

  async logout(params: {
    userId: string;
    accessToken?: string;
    refreshToken?: string;
    sessionId?: string | null;
    context?: SessionContext;
  }) {
    if (params.refreshToken) {
      await this.sessionService.revokeSessionByToken(params.refreshToken, 'refresh', params.userId, 'logout');
    }

    if (params.accessToken && params.sessionId) {
      await this.sessionService.blacklistAccessToken({
        userId: params.userId,
        sessionId: params.sessionId,
        token: params.accessToken,
        expiresAt: this.parseTokenExpiry(params.accessToken),
        context: params.context,
        reason: 'logout'
      });
    }

    await this.auditService.recordAction({
      actorId: params.userId,
      action: 'AUTH_LOGOUT',
      target: params.userId,
      targetType: 'user',
      ipAddress: params.context?.ipAddress,
      userAgent: params.context?.userAgent
    });
  }

  async logoutAll(userId: string) {
    await this.sessionService.revokeAllUserSessions(userId, 'logout_all', userId);
    await this.auditService.recordAction({
      actorId: userId,
      action: 'AUTH_LOGOUT_ALL',
      target: userId,
      targetType: 'user'
    });
  }

  async requestPasswordReset(email: string, context?: SessionContext) {
    const user = await User.findOne({ email, isDeleted: { $ne: true } }).select('+password +passwordHistory.hash');
    if (!user) {
      return { message: 'If the account exists, a reset workflow has been initiated.' };
    }

    const rawToken = await this.sessionService.createOneTimeToken({
      userId: user._id.toString(),
      tokenType: 'password_reset',
      expiresAt: new Date(Date.now() + config.passwordResetExpiresMinutes * 60 * 1000),
      context
    });

    await this.auditService.recordAction({
      actorId: user._id.toString(),
      branchId: user.branchId?.toString?.() ?? null,
      action: 'AUTH_PASSWORD_RESET_REQUESTED',
      target: user._id.toString(),
      targetType: 'user',
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent
    });

    return {
      message: 'Password reset token generated.',
      resetTokenPreview: config.environment === 'production' ? undefined : rawToken
    };
  }

  async resetPassword(resetToken: string, newPassword: string) {
    const tokenRecord = await this.sessionService.consumeOneTimeToken(resetToken, 'password_reset');
    if (!tokenRecord) {
      throw new Error('Password reset token invalid or expired');
    }

    const user = await User.findById(tokenRecord.userId).select('+password +passwordHistory.hash');
    if (!user) {
      throw new Error('User not found');
    }

    const passwordHistory = [
      { hash: user.password as string, changedAt: new Date() },
      ...(Array.isArray(user.passwordHistory) ? user.passwordHistory : [])
    ];

    if (await isPasswordReused(newPassword, passwordHistory)) {
      throw new Error('New password must not match a recent password');
    }

    user.password = await hashPassword(newPassword);
    user.mustChangePassword = false;
    user.failedLoginAttempts = 0;
    user.lockedUntil = null;
    user.status = 'active';
    await user.save();

    await this.sessionService.revokeAllUserSessions(user._id.toString(), 'password_reset', user._id.toString());

    await this.auditService.recordAction({
      actorId: user._id.toString(),
      branchId: user.branchId?.toString?.() ?? null,
      action: 'AUTH_PASSWORD_RESET_COMPLETED',
      target: user._id.toString(),
      targetType: 'user'
    });

    return { message: 'Password reset completed successfully.' };
  }

  async requestEmailVerification(userId: string, context?: SessionContext) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const rawToken = await this.sessionService.createOneTimeToken({
      userId: user._id.toString(),
      tokenType: 'email_verification',
      expiresAt: new Date(Date.now() + config.emailVerificationExpiresHours * 60 * 60 * 1000),
      context
    });

    return {
      message: 'Email verification token generated.',
      verificationTokenPreview: config.environment === 'production' ? undefined : rawToken
    };
  }

  async confirmEmailVerification(token: string) {
    const tokenRecord = await this.sessionService.consumeOneTimeToken(token, 'email_verification');
    if (!tokenRecord) {
      throw new Error('Email verification token invalid or expired');
    }

    const user = await User.findById(tokenRecord.userId);
    if (!user) {
      throw new Error('User not found');
    }

    user.emailVerifiedAt = new Date();
    if (user.status === 'pending_verification') {
      user.status = 'active';
    }
    await user.save();

    return { message: 'Email verified successfully.' };
  }

  async requestPhoneVerification(userId: string, phone?: string, context?: SessionContext) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (phone) {
      user.phone = phone;
      await user.save();
    }

    const code = `${crypto.randomInt(100000, 999999)}`;
    await this.sessionService.createOneTimeToken({
      userId: user._id.toString(),
      tokenType: 'phone_verification',
      expiresAt: new Date(Date.now() + config.phoneVerificationExpiresMinutes * 60 * 1000),
      token: code,
      context
    });

    return {
      message: 'Phone verification code generated.',
      verificationCodePreview: config.environment === 'production' ? undefined : code
    };
  }

  async confirmPhoneVerification(code: string) {
    const tokenRecord = await this.sessionService.consumeOneTimeToken(code, 'phone_verification');
    if (!tokenRecord) {
      throw new Error('Phone verification code invalid or expired');
    }

    const user = await User.findById(tokenRecord.userId);
    if (!user) {
      throw new Error('User not found');
    }

    user.phoneVerifiedAt = new Date();
    await user.save();

    return { message: 'Phone verified successfully.' };
  }
}
