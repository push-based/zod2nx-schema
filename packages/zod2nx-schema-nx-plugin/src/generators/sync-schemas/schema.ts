import { z } from 'zod';

const schema = z.object({
    template: z.boolean(),
});

export default schema;
