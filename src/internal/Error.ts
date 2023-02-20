import * as Data from '@effect/data/Data';

export function createTagged<T extends Data.Case & {_tag: string}>(
    tag: T['_tag'],
) {
    return {
        create: Data.tagged<T>(tag),
        tag,
    };
}
