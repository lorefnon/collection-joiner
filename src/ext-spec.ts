export interface BaseExtSpec<TSource, TTarget> {
    target: TTarget[]
    targetKey: keyof TTarget
    sourceKey: keyof TSource
}

export interface OneOfExtSpec<TSource, TTarget> extends BaseExtSpec<TSource, TTarget> {
    type: "toOneOf",
}

export interface OneOrNoneOfExtSpec<TSource, TTarget> extends BaseExtSpec<TSource, TTarget> {
    type: "toOneOrNoneOf",
}

export interface ManyOfExtSpec<TSource, TTarget> extends BaseExtSpec<TSource, TTarget> {
    type: "toManyOf",
}

export type ExtSpec<TSource, TTarget> =
    | OneOfExtSpec<TSource, TTarget>
    | OneOrNoneOfExtSpec<TSource, TTarget>
    | ManyOfExtSpec<TSource, TTarget>

export type OutSpec<TSource> = Record<string, ExtSpec<TSource, any>>
