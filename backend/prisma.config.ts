import { defineConfig } from '@prisma/config';
import dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
    prisma: {
        schema: 'prisma/schema.prisma',
    },
    datasource: {
        url: process.env.DATABASE_URL
    }
});
