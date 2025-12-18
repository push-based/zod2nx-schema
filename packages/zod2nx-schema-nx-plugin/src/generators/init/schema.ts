import { z } from 'zod';

export const initGeneratorSchema = z.object({
  skipPackageJson: z.boolean().optional().default(false),
  skipInstall: z.boolean().optional().default(false),
  skipNxJson: z.boolean().optional().default(false),
});
export type InitGeneratorSchema = z.infer<typeof initGeneratorSchema>;

export default initGeneratorSchema;
