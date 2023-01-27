import {z} from 'zod';
import {pipe, Layer, Effect} from 'effect';
import {Tag} from '@fp-ts/data/Context';
import createDeepMerge from '@fastify/deepmerge';

import {Parser} from './zod.js';
import {readJsonSync} from './fs.js';

const mergeDeep = createDeepMerge();

export function createLayer<T>({
    tag,
    fileParser,
    filePath,
    envParser,
    defaults,
}: {
    tag: Tag<T>,
    fileParser?: z.ZodType<T, z.ZodTypeDef, unknown>;
    filePath?: string;
    envParser?: z.ZodType<T, z.ZodTypeDef, unknown>;
    defaults?: Partial<T>;
}): Layer.Layer<never, Error, T> {
    const parseFile =  (filePath !== undefined && fileParser !== undefined) ? Parser.fromZod(fileParser) : undefined;
    const parseEnv = envParser !== undefined ? Parser.fromZod(envParser) : undefined;

    return Layer.fromEffect<T>(tag)(
            Effect.gen(function* ($) {
                const fromFile = (parseFile !== undefined && filePath !== undefined) ? yield* $(
                    pipe(readJsonSync(filePath), Effect.flatMap(parseFile)),
                ) : {};

                const fromEnv = parseEnv !== undefined ? yield* $(parseEnv(process.env)) : {};

                return mergeDeep(mergeDeep(defaults, fromFile), fromEnv) as T;
            }),
        );
}
