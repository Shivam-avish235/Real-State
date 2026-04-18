import crypto from "crypto";

import type { User, UserRole } from "@prisma/client";

import { ApiError } from "../../common/utils/api-error";
import { durationToDateFromNow } from "../../common/utils/duration";
import { hashToken, signAccessToken, signRefreshToken, verifyRefreshToken } from "../../common/utils/jwt";
import { comparePassword, hashPassword } from "../../common/utils/password";
import { env } from "../../config/env";
import { prisma } from "../../config/prisma";

import type { AuthenticatedUserDto, TokenPair } from "./auth.types";
import type { ChangePasswordInput, LoginInput, RegisterInput } from "./auth.validation";

const sanitizeUser = (user: User): AuthenticatedUserDto => ({
  id: user.id,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  phone: user.phone,
  role: user.role,
  status: user.status,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt
});

const createTokenPair = (user: User): TokenPair => {
  const tokenId = crypto.randomUUID();
  const accessToken = signAccessToken({
    userId: user.id,
    role: user.role
  });
  const refreshToken = signRefreshToken({
    userId: user.id,
    tokenId
  });

  return {
    accessToken,
    refreshToken
  };
};

export class AuthService {
  static async register(input: RegisterInput, actorRole?: UserRole): Promise<{ user: AuthenticatedUserDto; tokens: TokenPair }> {
    const existing = await prisma.user.findUnique({
      where: { email: input.email }
    });

    if (existing) {
      throw new ApiError(409, "Email already in use");
    }

    const userCount = await prisma.user.count();

    if (userCount > 0 && !actorRole) {
      throw new ApiError(403, "Self registration is disabled");
    }

    if (input.role && input.role !== "AGENT" && actorRole !== "ADMIN") {
      throw new ApiError(403, "Only admins can create non-agent users");
    }

    const role = userCount === 0 ? "ADMIN" : (input.role ?? "AGENT");
    const passwordHash = await hashPassword(input.password);

    const user = await prisma.user.create({
      data: {
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        phone: input.phone,
        role,
        passwordHash
      }
    });

    const tokens = createTokenPair(user);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(tokens.refreshToken),
        expiresAt: durationToDateFromNow(env.REFRESH_TOKEN_EXPIRES_IN)
      }
    });

    return {
      user: sanitizeUser(user),
      tokens
    };
  }

  static async login(input: LoginInput, userAgent?: string, ipAddress?: string): Promise<{ user: AuthenticatedUserDto; tokens: TokenPair }> {
    const user = await prisma.user.findUnique({
      where: { email: input.email }
    });

    if (!user || user.deletedAt) {
      throw new ApiError(401, "Invalid credentials");
    }

    if (user.status !== "ACTIVE") {
      throw new ApiError(403, "User account is not active");
    }

    const isValidPassword = await comparePassword(input.password, user.passwordHash);

    if (!isValidPassword) {
      throw new ApiError(401, "Invalid credentials");
    }

    const tokens = createTokenPair(user);

    await prisma.$transaction([
      prisma.refreshToken.create({
        data: {
          userId: user.id,
          tokenHash: hashToken(tokens.refreshToken),
          userAgent,
          ipAddress,
          expiresAt: durationToDateFromNow(env.REFRESH_TOKEN_EXPIRES_IN)
        }
      }),
      prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
      })
    ]);

    return {
      user: sanitizeUser(user),
      tokens
    };
  }

  static async refreshAccessToken(refreshToken: string, userAgent?: string, ipAddress?: string): Promise<{ user: AuthenticatedUserDto; tokens: TokenPair }> {
    const payload = verifyRefreshToken(refreshToken);
    const tokenHash = hashToken(refreshToken);

    const storedToken = await prisma.refreshToken.findFirst({
      where: {
        tokenHash,
        revokedAt: null,
        expiresAt: {
          gt: new Date()
        }
      },
      include: {
        user: true
      }
    });

    if (!storedToken || storedToken.user.id !== payload.userId || storedToken.user.deletedAt) {
      throw new ApiError(401, "Invalid refresh token");
    }

    if (storedToken.user.status !== "ACTIVE") {
      throw new ApiError(403, "User account is not active");
    }

    const tokens = createTokenPair(storedToken.user);

    await prisma.$transaction([
      prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { revokedAt: new Date() }
      }),
      prisma.refreshToken.create({
        data: {
          userId: storedToken.userId,
          tokenHash: hashToken(tokens.refreshToken),
          userAgent,
          ipAddress,
          expiresAt: durationToDateFromNow(env.REFRESH_TOKEN_EXPIRES_IN)
        }
      })
    ]);

    return {
      user: sanitizeUser(storedToken.user),
      tokens
    };
  }

  static async logout(refreshToken?: string): Promise<void> {
    if (!refreshToken) {
      return;
    }

    await prisma.refreshToken.updateMany({
      where: {
        tokenHash: hashToken(refreshToken),
        revokedAt: null
      },
      data: {
        revokedAt: new Date()
      }
    });
  }

  static async logoutAll(userId: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: {
        userId,
        revokedAt: null
      },
      data: {
        revokedAt: new Date()
      }
    });
  }

  static async getMe(userId: string): Promise<AuthenticatedUserDto> {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || user.deletedAt) {
      throw new ApiError(404, "User not found");
    }

    return sanitizeUser(user);
  }

  static async changePassword(userId: string, input: ChangePasswordInput): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || user.deletedAt) {
      throw new ApiError(404, "User not found");
    }

    const matches = await comparePassword(input.currentPassword, user.passwordHash);

    if (!matches) {
      throw new ApiError(400, "Current password is incorrect");
    }

    const nextHash = await hashPassword(input.newPassword);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { passwordHash: nextHash }
      }),
      prisma.refreshToken.updateMany({
        where: {
          userId,
          revokedAt: null
        },
        data: {
          revokedAt: new Date()
        }
      })
    ]);
  }
}
