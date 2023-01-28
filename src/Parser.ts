import * as Effect from '@effect/io/Effect';

export type Parser<E, T> = (u: unknown) => Effect.Effect<never, E, T>;
