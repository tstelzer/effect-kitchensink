import {pipe, Effect} from 'effect';
import {z} from 'zod';

export type Parser<T> = (u: unknown) => Effect.Effect<never, z.ZodError, T>;

const fromZod =
    <T>(p: z.ZodType<T, z.ZodTypeDef, unknown>): Parser<T> =>
    u =>
        pipe(p.safeParse(u), r =>
            r.success
                ? Effect.succeed(r.data)
                : Effect.fail(r.error),
        );

export const Parser = {
    fromZod,
};
