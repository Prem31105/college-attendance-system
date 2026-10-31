import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    try {
      await this.$connect();
      console.log('✅ Connected to PostgreSQL database');
    } catch (err) {
      console.warn('⚠️ Warning: Direct PostgreSQL connection failed. Check DATABASE_URL or start Docker container.');
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
