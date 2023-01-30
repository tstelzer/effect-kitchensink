import * as Context from '@fp-ts/data/Context';
import createDeepMerge from '@fastify/deepmerge';
import * as Layer from '@effect/io/Layer';
import * as Effect from '@effect/io/Effect';
import {pipe} from '@fp-ts/core/Function';

import type {Parser} from './Parser.js';
import {FileDoesNotExistError, readJson} from './fs.js';

const mergeDeep = createDeepMerge();

export function createLayer<E, T>({
    tag,
    parseFile,
    filePath,
    parseEnv,
    defaults,
}: {
    tag: Context.Tag<T>;
    parseFile?: Parser<E, T>;
    filePath?: string;
    parseEnv?: Parser<E, T>;
    defaults?: Partial<T>;
}): Layer.Layer<never, E | FileDoesNotExistError, T> {
    return Layer.effect(
        tag,
        Effect.gen(function* ($) {
            const fromFile =
                parseFile !== undefined && filePath !== undefined
                    ? yield* $(
                          pipe(readJson(filePath), Effect.flatMap(parseFile)),
                      )
                    : {};

            const fromEnv =
                parseEnv !== undefined ? yield* $(parseEnv(process.env)) : {};

            return mergeDeep(mergeDeep(defaults, fromFile), fromEnv) as T;
        }),
    );
}
