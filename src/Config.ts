import {pipe, Layer, Effect} from 'effect';
import {Tag} from '@fp-ts/data/Context';
import createDeepMerge from '@fastify/deepmerge';

import type {Parser} from './Parser.js';
import {readJsonSync} from './fs.js';

const mergeDeep = createDeepMerge();

export function createLayer<E, T>({
    tag,
    parseFile,
    filePath,
    parseEnv,
    defaults,
}: {
    tag: Tag<T>,
    parseFile?: Parser<E, T>;
    filePath?: string;
    parseEnv?: Parser<E, T>;
    defaults?: Partial<T>;
}): Layer.Layer<never, E | Error, T> {
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
