import { MaybeN } from "./utils.js"

export type NCond<T, Nilable> =
    true extends Nilable ? MaybeN<T> : T;

export interface BaseAssocLink<TSource, TTarget, TNilable extends boolean, TWrapped extends boolean, TRes> {
    target: NCond<TTarget[], TNilable>
    targetKey: keyof TTarget
    sourceKey: keyof TSource
    wrap: TWrapped
    toRes: (target: any /* NCond<TTarget[], Nilable> */) => TRes
}

export interface OneOfAssocLink<TSource, TTarget, TNilable extends boolean, TWrapped extends boolean, TRes> extends BaseAssocLink<TSource, TTarget, TNilable, TWrapped, TRes> {
    type: "toOneOf",
    thru: <TResNext> (transform: (res: TRes) => TResNext) => OneOfAssocLink<TSource, TTarget, TNilable, TWrapped, TResNext>
    unwrap(): OneOfAssocLink<TSource, TTarget, TNilable, false, TRes> 
}

export interface OneOrNoneOfAssocLink<TSource, TTarget, TNilable extends boolean, TWrapped extends boolean, TRes> extends BaseAssocLink<TSource, TTarget, TNilable, TWrapped, TRes> {
    type: "toOneOrNoneOf",
    thru: <TResNext> (transform: (res: TRes) => TResNext) => OneOrNoneOfAssocLink<TSource, TTarget, TNilable, TWrapped, TResNext>
    unwrap(): OneOrNoneOfAssocLink<TSource, TTarget, TNilable, false, TRes> 
}

export interface ManyOfAssocLink<TSource, TTarget, TNilable extends boolean, TWrapped extends boolean, TRes> extends BaseAssocLink<TSource, TTarget, TNilable, TWrapped, TRes> {
    type: "toManyOf",
    thru: <TResNext> (transform: (res: TRes) => TResNext) => ManyOfAssocLink<TSource, TTarget, TNilable, TWrapped, TResNext>
    unwrap(): ManyOfAssocLink<TSource, TTarget, TNilable, false, TRes> 
}

export type AssocLink<TSource, TTarget, TNilable extends boolean, TWrapped extends boolean, TRes> =
    | OneOfAssocLink<TSource, TTarget, TNilable, TWrapped, TRes>
    | OneOrNoneOfAssocLink<TSource, TTarget, TNilable, TWrapped, TRes>
    | ManyOfAssocLink<TSource, TTarget, TNilable, TWrapped, TRes>

export type AssocLinks<TSource> = Record<string, Omit<AssocLink<TSource, any, boolean, boolean, any>, "thru" | "unwrap"> | ((source: TSource) => any)>
