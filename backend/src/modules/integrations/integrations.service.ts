import crypto from "node:crypto";

import { ApiError } from "../../common/utils/api-error";
import { hashToken } from "../../common/utils/jwt";
import { prisma } from "../../config/prisma";

import type {
    CreateApiCredentialInput,
    ListApiCredentialsQueryInput,
    RotateApiCredentialInput,
    UpdateApiCredentialInput
} from "./integrations.validation";

type UserContext = {
  userId: string;
  role: "ADMIN" | "MANAGER" | "AGENT";
};

const credentialSelect = {
  id: true,
  name: true,
  scopes: true,
  isActive: true,
  lastUsedAt: true,
  createdAt: true,
  updatedAt: true,
  createdById: true,
  createdBy: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true
    }
  }
};

const normalizeOptionalString = (value?: string): string | undefined => {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const calculatePagination = (page: number, limit: number) => {
  const safePage = page > 0 ? page : 1;
  const safeLimit = limit > 0 ? limit : 20;

  return {
    skip: (safePage - 1) * safeLimit,
    take: safeLimit
  };
};

const accessFilter = (context: UserContext) => {
  if (context.role === "ADMIN" || context.role === "MANAGER") {
    return undefined;
  }

  return {
    createdById: context.userId
  };
};

const ensureCredentialAccess = async (credentialId: string, context: UserContext) => {
  const credential = await prisma.apiCredential.findUnique({
    where: { id: credentialId }
  });

  if (!credential) {
    throw new ApiError(404, "API credential not found");
  }

  if (context.role === "AGENT" && credential.createdById !== context.userId) {
    throw new ApiError(403, "Forbidden");
  }

  return credential;
};

const createApiKey = () => {
  return `recrm_${crypto.randomBytes(24).toString("hex")}`;
};

export class IntegrationsService {
  static async listApiCredentials(query: ListApiCredentialsQueryInput, context: UserContext) {
    const scopedFilter = accessFilter(context);
    const search = normalizeOptionalString(query.search);

    const where = {
      ...(scopedFilter ? { createdById: scopedFilter.createdById } : {}),
      ...(query.isActive === undefined ? {} : { isActive: query.isActive }),
      ...(search ? { name: { contains: search } } : {})
    };

    const { skip, take } = calculatePagination(query.page, query.limit);

    const [items, total] = await prisma.$transaction([
      prisma.apiCredential.findMany({
        where,
        skip,
        take,
        select: credentialSelect,
        orderBy: {
          createdAt: "desc"
        }
      }),
      prisma.apiCredential.count({ where })
    ]);

    return {
      items,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit)
      }
    };
  }

  static async createApiCredential(input: CreateApiCredentialInput, context: UserContext) {
    const apiKey = createApiKey();

    const credential = await prisma.apiCredential.create({
      data: {
        name: input.name,
        keyHash: hashToken(apiKey),
        scopes: input.scopes,
        createdById: context.userId
      },
      select: credentialSelect
    });

    return {
      credential,
      apiKey
    };
  }

  static async getApiCredentialById(credentialId: string, context: UserContext) {
    await ensureCredentialAccess(credentialId, context);

    return prisma.apiCredential.findUnique({
      where: { id: credentialId },
      select: credentialSelect
    });
  }

  static async updateApiCredential(credentialId: string, input: UpdateApiCredentialInput, context: UserContext) {
    await ensureCredentialAccess(credentialId, context);

    return prisma.apiCredential.update({
      where: { id: credentialId },
      data: {
        name: input.name,
        scopes: input.scopes,
        isActive: input.isActive
      },
      select: credentialSelect
    });
  }

  static async revokeApiCredential(credentialId: string, context: UserContext) {
    await ensureCredentialAccess(credentialId, context);

    return prisma.apiCredential.update({
      where: { id: credentialId },
      data: {
        isActive: false
      },
      select: credentialSelect
    });
  }

  static async rotateApiCredential(credentialId: string, input: RotateApiCredentialInput, context: UserContext) {
    await ensureCredentialAccess(credentialId, context);

    const apiKey = createApiKey();

    const credential = await prisma.apiCredential.update({
      where: { id: credentialId },
      data: {
        keyHash: hashToken(apiKey),
        name: input.name,
        scopes: input.scopes,
        isActive: true,
        lastUsedAt: null
      },
      select: credentialSelect
    });

    return {
      credential,
      apiKey
    };
  }
}
