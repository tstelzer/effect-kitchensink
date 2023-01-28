import {pipe, Effect} from 'effect';
import {z} from 'zod';

import type {Parser} from './Parser.js';

export const createParser =
    <T>(p: z.ZodType<T, z.ZodTypeDef, unknown>): Parser<z.ZodError, T> =>
    u =>
        pipe(p.safeParse(u), r =>
            r.success
                ? Effect.succeed(r.data)
                : Effect.fail(r.error),
        );
