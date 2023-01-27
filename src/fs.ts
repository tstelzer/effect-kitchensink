
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {parse as _parseCSV} from 'csv-parse/sync';
import {Effect, pipe} from 'effect';

/**
 * @example
 * // Equivalent of `__dirname` in common-js.
 * dirname(import.meta.url)
 */
export const dirname = (url: string): string =>
    path.dirname(fileURLToPath(url));

export const readFileSync = (filePath: string) =>
    Effect.tryCatch(
        () => fs.readFileSync(filePath, {encoding: 'utf8'}),
        e => e as Error,
    );

export const readJsonSync = (filePath: string) =>
    pipe(
        readFileSync(filePath),
        Effect.flatMap(s =>
            Effect.tryCatch(
                () => JSON.parse(s),
                e => e as Error
            ),
        ),
    );

export function readCsvSync(m: {
    delimiter: string;
    path: string;
}): Effect.Effect<never, Error, unknown[]> {
    return pipe(
        readFileSync(m.path),
        Effect.flatMap(s =>
            Effect.tryCatch(
                () =>
                    _parseCSV(s, {
                        delimiter: m.delimiter,
                        columns: true,
                        skip_empty_lines: true,
                    }),
                e => e as Error
            ),
        ),
    );
}
