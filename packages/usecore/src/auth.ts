import jwt from "@tsndr/cloudflare-worker-jwt";
import { tryCatch, type Result } from "catch-wrap";

import type { SessionStore } from "./kv";

export interface JWTConfig {
  secret: string;
  algorithm?: "HS256" | "HS384" | "HS512" | "RS256" | "RS384" | "RS512";
  expiresIn?: number;
  issuer?: string;
  audience?: string;
}

export interface JWTPayload {
  sub: string;
  [key: string]: unknown;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthCookie {
  name: string;
  value: string;
  httpOnly: boolean;
  secure: boolean;
  sameSite: "Strict" | "Lax" | "None";
  maxAge?: number;
  path?: string;
  domain?: string;
}

export interface PasswordHashOptions {
  algorithm?: "SHA-256" | "SHA-384" | "SHA-512";
  iterations?: number;
  saltLength?: number;
}

export class AuthClient {
  constructor(
    private readonly config: JWTConfig,
    private readonly sessionStore?: SessionStore,
  ) {}

  async signToken(
    payload: JWTPayload,
    expiresIn?: number,
  ): Promise<Result<string>> {
    return await tryCatch(async () => {
      const exp = expiresIn || this.config.expiresIn || 3600;
      const now = Math.floor(Date.now() / 1000);

      const tokenPayload = {
        ...payload,
        iat: now,
        exp: now + exp,
        iss: this.config.issuer,
        aud: this.config.audience,
      };

      return await jwt.sign(tokenPayload, this.config.secret, {
        algorithm: this.config.algorithm || "HS256",
      });
    });
  }

  async verifyToken(token: string): Promise<Result<JWTPayload>> {
    return await tryCatch(async () => {
      const result = await jwt.verify(token, this.config.secret, {
        algorithm: this.config.algorithm || "HS256",
      });

      if (!result) {
        throw new Error("Invalid or expired token");
      }

      return result.payload as JWTPayload;
    });
  }

  async generateTokenPair(
    userId: string,
    metadata?: Record<string, unknown>,
  ): Promise<Result<TokenPair>> {
    return await tryCatch(async () => {
      const accessTokenExpiry = 900;
      const refreshTokenExpiry = 2592000;

      const accessPayload: JWTPayload = {
        sub: userId,
        type: "access",
        ...metadata,
      };

      const refreshPayload: JWTPayload = {
        sub: userId,
        type: "refresh",
      };

      const accessToken = await this.signToken(
        accessPayload,
        accessTokenExpiry,
      );
      const refreshToken = await this.signToken(
        refreshPayload,
        refreshTokenExpiry,
      );

      if (accessToken.error || refreshToken.error) {
        throw new Error("Failed to generate token pair");
      }

      if (this.sessionStore && accessToken.data && refreshToken.data) {
        const sessionId = this.generateSessionId();
        await this.sessionStore.create(sessionId, {
          userId,
          expiresAt: Date.now() + refreshTokenExpiry * 1000,
          metadata: {
            accessToken: accessToken.data,
            refreshToken: refreshToken.data,
            ...metadata,
          },
        });
      }

      return {
        accessToken: accessToken.data!,
        refreshToken: refreshToken.data!,
        expiresIn: accessTokenExpiry,
      };
    });
  }

  async refreshAccessToken(refreshToken: string): Promise<Result<TokenPair>> {
    return await tryCatch(async () => {
      const verifyResult = await this.verifyToken(refreshToken);
      if (verifyResult.error || !verifyResult.data) {
        throw new Error("Invalid refresh token");
      }

      const payload = verifyResult.data;
      if (payload["type"] !== "refresh") {
        throw new Error("Invalid token type");
      }

      return (await this.generateTokenPair(payload.sub as string)).data!;
    });
  }

  async rotateToken(
    oldToken: string,
    sessionId?: string,
  ): Promise<Result<TokenPair>> {
    return await tryCatch(async () => {
      const verifyResult = await this.verifyToken(oldToken);
      if (verifyResult.error || !verifyResult.data) {
        throw new Error("Invalid token");
      }

      const payload = verifyResult.data;
      const newPair = await this.generateTokenPair(payload.sub as string);

      if (newPair.error || !newPair.data) {
        throw new Error("Failed to rotate token");
      }

      if (this.sessionStore && sessionId) {
        const newSessionId = this.generateSessionId();
        await this.sessionStore.rotate(sessionId, newSessionId);
      }

      return newPair.data;
    });
  }

  createCookie(name: string, token: string, maxAge?: number): AuthCookie {
    return {
      name,
      value: token,
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
      maxAge: maxAge || 86400,
      path: "/",
    };
  }

  formatCookieHeader(cookie: AuthCookie): string {
    const parts = [`${cookie.name}=${cookie.value}`];

    if (cookie.httpOnly) parts.push("HttpOnly");
    if (cookie.secure) parts.push("Secure");
    if (cookie.sameSite) parts.push(`SameSite=${cookie.sameSite}`);
    if (cookie.maxAge) parts.push(`Max-Age=${cookie.maxAge}`);
    if (cookie.path) parts.push(`Path=${cookie.path}`);
    if (cookie.domain) parts.push(`Domain=${cookie.domain}`);

    return parts.join("; ");
  }

  private generateSessionId(): string {
    const buffer = new Uint8Array(32);
    crypto.getRandomValues(buffer);
    return Array.from(buffer, (byte) =>
      byte.toString(16).padStart(2, "0"),
    ).join("");
  }
}

export class PasswordHasher {
  private readonly defaultOptions: Required<PasswordHashOptions> = {
    algorithm: "SHA-256",
    iterations: 100000,
    saltLength: 16,
  };

  async hash(
    password: string,
    options?: PasswordHashOptions,
  ): Promise<Result<string>> {
    return await tryCatch(async () => {
      const opts = { ...this.defaultOptions, ...options };
      const salt = this.generateSalt(opts.saltLength);
      const hash = await this.pbkdf2(
        password,
        salt,
        opts.iterations,
        opts.algorithm,
      );

      return `${opts.algorithm}:${opts.iterations}:${salt}:${hash}`;
    });
  }

  async verify(
    password: string,
    hashedPassword: string,
  ): Promise<Result<boolean>> {
    return await tryCatch(async () => {
      const parts = hashedPassword.split(":");
      if (parts.length !== 4) {
        throw new Error("Invalid hash format");
      }

      const [algorithm, iterations, salt, expectedHash] = parts;
      const hash = await this.pbkdf2(
        password,
        salt,
        parseInt(iterations),
        algorithm as PasswordHashOptions["algorithm"],
      );

      return hash === expectedHash;
    });
  }

  private async pbkdf2(
    password: string,
    salt: string,
    iterations: number,
    algorithm?: PasswordHashOptions["algorithm"],
  ): Promise<string> {
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);
    const saltBuffer = encoder.encode(salt);

    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      passwordBuffer,
      "PBKDF2",
      false,
      ["deriveBits"],
    );

    const hashAlgorithm = algorithm || "SHA-256";
    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt: saltBuffer,
        iterations,
        hash: hashAlgorithm,
      },
      keyMaterial,
      256,
    );

    return this.bufferToBase64(derivedBits);
  }

  private generateSalt(length: number): string {
    const buffer = new Uint8Array(length);
    crypto.getRandomValues(buffer);
    return this.bufferToBase64(buffer);
  }

  private bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
    const bytes =
      buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    return btoa(String.fromCharCode(...bytes));
  }
}

export class CSRFTokenGenerator {
  private readonly tokenLength = 32;

  generateToken(): string {
    const buffer = new Uint8Array(this.tokenLength);
    crypto.getRandomValues(buffer);
    return Array.from(buffer, (byte) =>
      byte.toString(16).padStart(2, "0"),
    ).join("");
  }

  async validateToken(
    token: string,
    expectedToken: string,
  ): Promise<Result<boolean>> {
    return await tryCatch(async () => {
      if (!token || !expectedToken) {
        return false;
      }

      if (token.length !== expectedToken.length) {
        return false;
      }

      return this.constantTimeCompare(token, expectedToken);
    });
  }

  private constantTimeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return result === 0;
  }
}

export interface AuthMiddlewareOptions {
  tokenExtractor?: (headers: Headers) => string | null;
  skipPaths?: string[];
  requiredRoles?: string[];
}

export function createBearerTokenExtractor() {
  return (headers: Headers): string | null => {
    const authHeader = headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }
    return authHeader.substring(7);
  };
}

export function createCookieTokenExtractor(cookieName: string) {
  return (headers: Headers): string | null => {
    const cookieHeader = headers.get("Cookie");
    if (!cookieHeader) {
      return null;
    }

    const cookies = cookieHeader.split(";").map((c) => c.trim());
    for (const cookie of cookies) {
      const [name, value] = cookie.split("=");
      if (name === cookieName) {
        return value;
      }
    }

    return null;
  };
}

export function createAuthClient(
  config: JWTConfig,
  sessionStore?: SessionStore,
): AuthClient {
  return new AuthClient(config, sessionStore);
}

export function createPasswordHasher(): PasswordHasher {
  return new PasswordHasher();
}

export function createCSRFTokenGenerator(): CSRFTokenGenerator {
  return new CSRFTokenGenerator();
}
