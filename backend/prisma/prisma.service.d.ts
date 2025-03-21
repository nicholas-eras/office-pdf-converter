import { PrismaClient } from '@prisma/client';
export declare class PrismaService extends PrismaClient {
    private readonly logger;
    constructor();
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
}
