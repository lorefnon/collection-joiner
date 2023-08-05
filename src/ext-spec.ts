import { MaybeN } from "./utils.js"

export type NCond<T, Nilable> =
    true extends Nilable ? MaybeN<T> : T;

export interface BaseAssocLink<TSource, TTarget, Nilable extends boolean, TRes> {
    target: NCond<TTarget[], Nilable>
    targetKey: keyof TTarget
    sourceKey: keyof TSource
    toRes: (target: any /* NCond<TTarget[], Nilable> */) => TRes
}

export interface OneOfAssocLink<TSource, TTarget, Nilable extends boolean, TRes> extends BaseAssocLink<TSource, TTarget, Nilable, TRes> {
    type: "toOneOf",
    thru: <TResNext> (transform: (res: TRes) => TResNext) => OneOfAssocLink<TSource, TTarget, Nilable, TResNext>
}

export interface OneOrNoneOfAssocLink<TSource, TTarget, Nilable extends boolean, TRes> extends BaseAssocLink<TSource, TTarget, Nilable, TRes> {
    type: "toOneOrNoneOf",
    thru: <TResNext> (transform: (res: TRes) => TResNext) => OneOrNoneOfAssocLink<TSource, TTarget, Nilable, TResNext>
}

export interface ManyOfAssocLink<TSource, TTarget, Nilable extends boolean, TRes> extends BaseAssocLink<TSource, TTarget, Nilable, TRes> {
    type: "toManyOf",
    thru: <TResNext> (transform: (res: TRes) => TResNext) => ManyOfAssocLink<TSource, TTarget, Nilable, TResNext>
}

export type AssocLink<TSource, TTarget, Nilable extends boolean, TRes> =
    | OneOfAssocLink<TSource, TTarget, Nilable, TRes>
    | OneOrNoneOfAssocLink<TSource, TTarget, Nilable, TRes>
    | ManyOfAssocLink<TSource, TTarget, Nilable, TRes>

export type AssocLinks<TSource> = Record<string, Omit<AssocLink<TSource, any, boolean, any>, "thru">>
