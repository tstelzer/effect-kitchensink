import * as E from '@effect/io/Effect';
import {pipe} from '@fp-ts/core/Function';
import * as mongo from 'mongodb';

export type Database = {client: mongo.MongoClient; db: mongo.Db};

export const createResource = ({
    connectionString,
    database,
    dbOptions,
    clientOptions,
}: {
    connectionString: string;
    database: string;
    dbOptions?: mongo.DbOptions;
    clientOptions?: mongo.MongoClientOptions;
}) =>
    E.acquireRelease(
        pipe(
            E.gen(function* ($) {
                const url = new URL(connectionString);
                const mongoClient = new mongo.MongoClient(
                    url.toString(),
                    clientOptions,
                );
                const client = yield* $(E.promise(() => mongoClient.connect()));
                const db = client.db(database, dbOptions);
                yield* $(E.log('mongodb: connected'));
                return {client, db};
            }),
        ),
        ({client}) =>
            E.gen(function* ($) {
                yield* $(E.promise(client.close));
                yield* $(E.log('mongodb: closed connection'));
            }),
    );
