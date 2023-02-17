import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import * as Data from '@fp-ts/data/Data';
import * as E from '@effect/io/Effect';
import * as Effect from '@effect/io/Effect';
import {parse as _parseCSV} from 'csv-parse/sync';
import {pipe} from '@fp-ts/core/Function';

import {rootKey} from './constants.js';

// =============================================================================
// Error
// =============================================================================

function createTagged<T extends Data.Case & {_tag: string}>(tag: T['_tag']) {
    return {
        create: Data.tagged<T>(tag),
        tag,
    };
}

export interface FileDoesNotExistError extends Data.Case {
    _tag: typeof FileDoesNotExistErrorTag;
    filePath: string;
}

const FileDoesNotExistErrorTag = `${rootKey}/fs/FileDoesNotExistError` as const;
export const FileDoesNotExistError = createTagged<FileDoesNotExistError>(
    FileDoesNotExistErrorTag,
);

export interface IsDirectoryError extends Data.Case {
    _tag: typeof IsDirectoryErrorTag;
    filePath: string;
}

const IsDirectoryErrorTag = `${rootKey}/fs/IsDirectoryError` as const;
export const IsDirectoryError =
    createTagged<IsDirectoryError>(IsDirectoryErrorTag);

export type FileSystemError = FileDoesNotExistError | IsDirectoryError;

// =============================================================================
// Util
// =============================================================================

const isENOENT = (e: unknown) =>
    typeof e === 'object' && e !== null && 'code' in e && e?.code === 'ENOENT';

const isEISDIR = (e: unknown) =>
    typeof e === 'object' && e !== null && 'code' in e && e?.code === 'EISDIR';

/** Wrapper around promise-based `writeFile`. */
export function writeFile(
    filePath: string,
    data: unknown,
): E.Effect<never, FileSystemError, void> {
    return E.tryCatchPromise(
        () =>
            fs.writeFile(filePath, JSON.stringify(data), {
                encoding: 'utf8',
            }),
        e => {
            if (isENOENT(e)) {
                return FileDoesNotExistError.create({filePath});
            }
            if (isEISDIR(e)) {
                return IsDirectoryError.create({filePath});
            }
            throw e;
        },
    );
}

/** Wrapper around promise-based `writeFile`. Implicitly creates directory. */
export function writeFileRecursive(
    filePath: string,
    data: unknown,
): E.Effect<never, FileSystemError, void> {
    return pipe(
        E.promise(() => fs.mkdir(path.basename(filePath), {recursive: true})),
        E.flatMap(() => writeFile(filePath, data)),
    );
}

/**
 * @example
 * // Equivalent of `__dirname` in common-js.
 * dirname(import.meta.url)
 */
export const dirname = (url: string): string =>
    path.dirname(fileURLToPath(url));

export function readFile(
    filePath: string,
): E.Effect<never, FileSystemError, string> {
    return Effect.tryCatchPromise(
        () => fs.readFile(filePath, {encoding: 'utf8'}),
        e => {
            if (isENOENT(e)) {
                return FileDoesNotExistError.create({filePath});
            }
            throw e;
        },
    );
}

export function readJson(
    filePath: string,
): E.Effect<never, FileSystemError, unknown> {
    return pipe(
        readFile(filePath),
        Effect.map(s => JSON.parse(s)),
    );
}

export function readCsv(m: {
    delimiter: string;
    path: string;
}): Effect.Effect<never, FileSystemError, unknown[]> {
    return pipe(
        readFile(m.path),
        Effect.map(s =>
            _parseCSV(s, {
                delimiter: m.delimiter,
                columns: true,
                skip_empty_lines: true,
            }),
        ),
    );
}
