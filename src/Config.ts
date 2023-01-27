import {z} from 'zod';
import {pipe, Context, Layer, Effect} from 'effect';
import createDeepMerge from '@fastify/deepmerge';

import {Parser} from './zod.js';
import {readJsonSync} from './fs.js';

const mergeDeep = createDeepMerge();

export function createService<T>({
    fileParser,
    filePath,
    envParser,
    defaults,
}: {
    fileParser: z.ZodType<T, z.ZodTypeDef, unknown>;
    filePath: string;
    envParser?: z.ZodType<T, z.ZodTypeDef, unknown>;
    defaults?: Partial<T>;
}): {
    createLayer: () => Layer.Layer<never, Error, T>;
    Service: Context.Tag<T>;
} {
    const Service = Context.Tag<T>();
    const parseFile = Parser.fromZod(fileParser);
    const parseEnv = envParser ? Parser.fromZod(envParser) : undefined;

    const createLayer = () =>
        Layer.fromEffect<T>(Service)(
            Effect.gen(function* ($) {
                const fromFile = yield* $(
                    pipe(readJsonSync(filePath), Effect.flatMap(parseFile)),
                );

                const fromEnv = parseEnv ? yield* $(parseEnv(process.env)) : {};

                return mergeDeep(mergeDeep(defaults, fromFile), fromEnv) as T;
            }),
        );

    return {createLayer, Service};
}
