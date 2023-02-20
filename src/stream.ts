import {EOL} from 'node:os';
import type {Readable} from 'node:stream';

import * as Data from '@effect/data/Data';
import * as Effect from '@effect/io/Effect';
import * as Option from '@fp-ts/core/Option';
import * as FR from '@effect/io/FiberRef';
import * as Stream from '@effect/stream/Stream';
import type {LazyArg} from '@fp-ts/core/Function';
import {pipe} from '@fp-ts/core/Function';

import {rootKey} from './constants.js';
import {createTagged} from './internal/Error.js';

export const DEFAULT_CHUNK_SIZE = 16 * 2 ** 10; // default highWaterMark of Readable / Writeable
export const DEFAULT_MAX_BUFFER_SIZE = 1_000 * 2 ** 20; // 1GB seems like a reasonable default

const BufferOverflowErrorTag =
    `${rootKey}/stream/error/BufferOverflowError` as const;
export type BufferOverflowError = Data.Case & {
    _tag: typeof BufferOverflowErrorTag;
    bufferSize: number;
};
export const BufferOverflowError = createTagged<BufferOverflowError>(
    BufferOverflowErrorTag,
);

const ReadableErrorTag = `${rootKey}/stream/error/ReadableError` as const;
export type ReadableError = Data.Case & {
    _tag: typeof ReadableErrorTag;
    error: Error;
};
export const ReadableError = createTagged<ReadableError>(ReadableErrorTag);

type BufferRef = string | null;

/** @internal */
export function readLine(
    stream: Readable,
    bufferRef: FR.FiberRef<BufferRef>,
    chunkSize: number,
    maxBufferSize: number,
): Effect.Effect<never, Option.Option<never>, string> {
    return pipe(
        FR.get(bufferRef),
        Effect.flatMap(previous => {
            let buffer = '';
            let next: string | null;

            // REFACTOR: This `read`s at least one too many times, even though
            // it works as expected (see tests).
            do {
                if (previous !== null && previous.length > 0) {
                    // Non-empty previous buffer.
                    for (let i = 0; i < previous.length; i++) {
                        if (previous[i] === EOL) {
                            const rest = previous.slice(i + 1);
                            const value = previous.slice(0, i);
                            return pipe(FR.set<BufferRef>(rest)(bufferRef), Effect.map(() => value));
                        }
                    }
                    // No EOL in previous buffer.
                    buffer = previous;
                }

                const bufferSize =
                    Buffer.byteLength(buffer, 'utf8') + chunkSize;

                // TODO: Technically, if the next chunk includes an EOL _at
                // all_, we don't overflow. I don't know how else to check,
                // other than searching through the entire string, or checking
                // at every character, both of which seem excessive.
                if (bufferSize >= maxBufferSize) {
                    return Effect.die(BufferOverflowError.create({bufferSize}));
                }

                next = stream.read(chunkSize);
                if (next === null && buffer.length === 0) {
                    // EOF
                    return Effect.fail(Option.none());
                } if (next === null && buffer.length > 0) {
                    // No more chunks, and we already know that the buffer has no EOL, so we leave.
                    return pipe(FR.set<BufferRef>(null)(bufferRef), Effect.map(() => buffer));
                } else{
                    buffer += next;
                }

                for (let i = 0; i < buffer.length; i++) {
                    if (buffer[i] === EOL) {
                        const rest = buffer.slice(i + 1);
                        const value = buffer.slice(0, i);
                        return pipe(FR.set<BufferRef>(rest)(bufferRef), Effect.map(() => value));
                    }
                }
            } while (next !== null);

            return Effect.die(new TypeError('Reached end of stream without producing a value. This is likely a bug in the library, please report this issue.'));
        }),
    );
}

export type LinesOptions = {
    chunkSize?: number;
    maxBufferSize?: number;
};

/**
 * Takes a lazy utf8-encoded NodeJS.Readable, and returns a Stream of lines, i.e. EOL-delimited strings.
 */
export function lines(
    createStream: LazyArg<Readable>,
    {
        chunkSize = DEFAULT_CHUNK_SIZE,
        maxBufferSize = DEFAULT_MAX_BUFFER_SIZE,
    }: LinesOptions = {},
): Stream.Stream<never, ReadableError, string> {
    const bufferRef = FR.unsafeMake('');

    return pipe(
        Effect.acquireRelease(
                Effect.sync(createStream),
            stream =>
                Effect.sync(() => {
                    stream.removeAllListeners();

                    if (!stream.closed) {
                        FR.delete(bufferRef);
                        stream.destroy();
                    }
                }),
        ),
        Effect.map(stream =>
            Stream.async<never, ReadableError, Readable>(emit => {
                stream.once('error', error => {
                    emit.fail(ReadableError.create({error}));
                });

                stream.once('end', () => {
                    emit.end();
                });

                stream.on('readable', () => {
                    emit.single(stream);
                });
            }, 0),
        ),
        Stream.unwrapScoped,
        Stream.flatMap(stream =>
            Stream.repeatEffectOption(
                readLine(stream, bufferRef, chunkSize, maxBufferSize),
            ),
        ),
    );
}
