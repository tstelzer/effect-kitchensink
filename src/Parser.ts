import {Effect} from 'effect';

export type Parser<E, T> = (u: unknown) => Effect.Effect<never, E, T>;
