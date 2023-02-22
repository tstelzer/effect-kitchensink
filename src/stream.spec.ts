import * as stream from 'node:stream';

import * as t from 'vitest';
import * as Exit from '@effect/io/Exit';
import * as Effect from '@effect/io/Effect';
import * as Chunk from '@effect/data/Chunk';
import * as Stream from '@effect/stream/Stream';
import {pipe} from '@effect/data/Function';

import * as _ from './stream.js';

function from(a: Iterable<string>): () => stream.Readable {
    return () => stream.Readable.from(a, {objectMode: false});
}

const stringOfBytes = (n: number) =>
    Array.from({length: n})
        .map(_ => '0')
        .join('');

t.describe('stream', () => {
    t.describe('lines', () => {
        t.test('produces defect on overflowing buffer', async () => {
            const result = await pipe(
                _.lines(from('ab\ncd'), {chunkSize: 1, maxBufferSize: 1}),
                Stream.runCollect,
                Effect.runPromiseExit,
            );
            t.expect(Exit.unannotate(result)).toEqual(
                Exit.die(_.BufferOverflowError.create({bufferSize: 1})),
            );
        });

        t.test('with empty input', async () => {
            const nil = await pipe(
                _.lines(from([])),
                Stream.runCollect,
                Effect.runPromise,
            );
            t.expect(nil).toEqual(Chunk.fromIterable([]));

            const empty = await pipe(
                _.lines(from('')),
                Stream.runCollect,
                Effect.runPromise,
            );
            // FIXME
            t.expect(empty).toEqual(Chunk.fromIterable(['']));
        });

        t.test.each<{
            input: string;
            expected: string[];
            options?: _.LinesOptions;
        }>([
            {input: 'a', expected: ['a']},
            {input: 'abc', expected: ['abc']},
            {input: 'a\nb\nc', expected: ['a', 'b', 'c']},
            {
                input: stringOfBytes(32),
                expected: [stringOfBytes(32)],
                options: {chunkSize: 16},
            },
        ])('with input #%#', async ({input, expected, options}) => {
            const result = await pipe(
                _.lines(from(input), options),
                Stream.runCollect,
                Effect.runPromise,
            );
            t.expect(result).toEqual(Chunk.fromIterable(expected));
        });
    });
});
