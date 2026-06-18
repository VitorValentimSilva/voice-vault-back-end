import { PrismaNeon } from '@prisma/adapter-neon';

export type NeonPoolClient = ConstructorParameters<typeof PrismaNeon>[0];
