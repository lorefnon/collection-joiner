import { MaybeN } from "./utils.js"

export type NCond<T, Nilable> =
    true extends Nilable ? MaybeN<T> : T;

export interface BaseExtSpec<TSource, TTarget, Nilable extends boolean, TRes> {
    target: NCond<TTarget[], Nilable>
    targetKey: keyof TTarget
    sourceKey: keyof TSource
    toRes: (target: any /* NCond<TTarget[], Nilable> */) => TRes
}

export interface OneOfExtSpec<TSource, TTarget, Nilable extends boolean, TRes> extends BaseExtSpec<TSource, TTarget, Nilable, TRes> {
    type: "toOneOf",
    thru: <TResNext> (transform: (res: TRes) => TResNext) => OneOfExtSpec<TSource, TTarget, Nilable, TResNext>
}

export interface OneOrNoneOfExtSpec<TSource, TTarget, Nilable extends boolean, TRes> extends BaseExtSpec<TSource, TTarget, Nilable, TRes> {
    type: "toOneOrNoneOf",
    thru: <TResNext> (transform: (res: TRes) => TResNext) => OneOrNoneOfExtSpec<TSource, TTarget, Nilable, TResNext>
}

export interface ManyOfExtSpec<TSource, TTarget, Nilable extends boolean, TRes> extends BaseExtSpec<TSource, TTarget, Nilable, TRes> {
    type: "toManyOf",
    thru: <TResNext> (transform: (res: TRes) => TResNext) => ManyOfExtSpec<TSource, TTarget, Nilable, TResNext>
}

export type ExtSpec<TSource, TTarget, Nilable extends boolean, TRes> =
    | OneOfExtSpec<TSource, TTarget, Nilable, TRes>
    | OneOrNoneOfExtSpec<TSource, TTarget, Nilable, TRes>
    | ManyOfExtSpec<TSource, TTarget, Nilable, TRes>

export type OutSpec<TSource> = Record<string, Omit<ExtSpec<TSource, any, boolean, any>, "thru">>
