import { MaybeN, MaybeP, MaybeT, Thunk } from "./utils.js"

export type NCond<T, Nilable> =
    true extends Nilable ? MaybeN<T> : T;

export interface BaseAssocLink<TSource, TTarget, TNilable extends boolean, TWrapped extends boolean, TRes> {
    target: NCond<TTarget[], TNilable>
    targetKey: keyof TTarget
    sourceKey: keyof TSource
    wrap: TWrapped
    cond?: Thunk<boolean>
    toRes: (target: any /* NCond<TTarget[], Nilable> */) => TRes
}

export interface OneOfAssocLink<TSource, TTarget, TNilable extends boolean, TWrapped extends boolean, TRes> extends BaseAssocLink<TSource, TTarget, TNilable, TWrapped, TRes> {
    type: "toOneOf",
    thru: <TResNext> (transform: (res: TRes) => TResNext) => OneOfAssocLink<TSource, TTarget, TNilable, TWrapped, TResNext>
    unwrap(): OneOfAssocLink<TSource, TTarget, TNilable, false, TRes>
    if(cond: Thunk<boolean>): OneOfAssocLink<TSource, TTarget, true, TWrapped, TRes> 
}

export interface OneOrNoneOfAssocLink<TSource, TTarget, TNilable extends boolean, TWrapped extends boolean, TRes> extends BaseAssocLink<TSource, TTarget, TNilable, TWrapped, TRes> {
    type: "toOneOrNoneOf",
    thru: <TResNext> (transform: (res: TRes) => TResNext) => OneOrNoneOfAssocLink<TSource, TTarget, TNilable, TWrapped, TResNext>
    unwrap(): OneOrNoneOfAssocLink<TSource, TTarget, TNilable, false, TRes> 
    if(cond: Thunk<boolean>): OneOrNoneOfAssocLink<TSource, TTarget, true, TWrapped, TRes> 
}

export interface ManyOfAssocLink<TSource, TTarget, TNilable extends boolean, TWrapped extends boolean, TRes> extends BaseAssocLink<TSource, TTarget, TNilable, TWrapped, TRes> {
    type: "toManyOf",
    thru: <TResNext> (transform: (res: TRes) => TResNext) => ManyOfAssocLink<TSource, TTarget, TNilable, TWrapped, TResNext>
    unwrap(): ManyOfAssocLink<TSource, TTarget, TNilable, false, TRes> 
    if(cond: Thunk<boolean>): ManyOfAssocLink<TSource, TTarget, true, TWrapped, TRes> 
}

export type AssocLink<TSource, TTarget, TNilable extends boolean, TWrapped extends boolean, TRes> =
    | OneOfAssocLink<TSource, TTarget, TNilable, TWrapped, TRes>
    | OneOrNoneOfAssocLink<TSource, TTarget, TNilable, TWrapped, TRes>
    | ManyOfAssocLink<TSource, TTarget, TNilable, TWrapped, TRes>

export type AssocLinks<TSource> = Record<string, Omit<AssocLink<TSource, any, boolean, boolean, any>, "thru" | "unwrap"> | ((source: TSource) => any)>




export interface BaseAsyncAssocLink<TSource, TTarget, TNilable extends boolean, TWrapped extends boolean, TRes> {
    target: MaybeT<MaybeP<NCond<TTarget[], TNilable>>>
    targetKey: keyof TTarget
    sourceKey: keyof TSource
    wrap: TWrapped
    cond?: Thunk<MaybeP<boolean>>
    toRes: (target: any /* NCond<TTarget[], Nilable> */) => TRes
}

export interface OneOfAsyncAssocLink<TSource, TTarget, TNilable extends boolean, TWrapped extends boolean, TRes> extends BaseAsyncAssocLink<TSource, TTarget, TNilable, TWrapped, TRes> {
    type: "toOneOf",
    thru: <TResNext> (transform: (res: TRes) => MaybeP<TResNext>) => OneOfAsyncAssocLink<TSource, TTarget, TNilable, TWrapped, Awaited<TResNext>>
    unwrap(): OneOfAsyncAssocLink<TSource, TTarget, TNilable, false, TRes>
    if(cond: Thunk<MaybeP<boolean>>): OneOfAsyncAssocLink<TSource, TTarget, true, TWrapped, TRes> 
}

export interface OneOrNoneOfAsyncAssocLink<TSource, TTarget, TNilable extends boolean, TWrapped extends boolean, TRes> extends BaseAsyncAssocLink<TSource, TTarget, TNilable, TWrapped, TRes> {
    type: "toOneOrNoneOf",
    thru: <TResNext> (transform: (res: TRes) => MaybeP<TResNext>) => OneOrNoneOfAsyncAssocLink<TSource, TTarget, TNilable, TWrapped, Awaited<TResNext>>
    unwrap(): OneOrNoneOfAsyncAssocLink<TSource, TTarget, TNilable, false, TRes> 
    if(cond: Thunk<MaybeP<boolean>>): OneOrNoneOfAsyncAssocLink<TSource, TTarget, true, TWrapped, TRes> 
}

export interface ManyOfAsyncAssocLink<TSource, TTarget, TNilable extends boolean, TWrapped extends boolean, TRes> extends BaseAsyncAssocLink<TSource, TTarget, TNilable, TWrapped, TRes> {
    type: "toManyOf",
    thru: <TResNext> (transform: (res: TRes) => MaybeP<TResNext>) => ManyOfAsyncAssocLink<TSource, TTarget, TNilable, TWrapped, Awaited<TResNext>>
    unwrap(): ManyOfAsyncAssocLink<TSource, TTarget, TNilable, false, TRes> 
    if(cond: Thunk<MaybeP<boolean>>): ManyOfAsyncAssocLink<TSource, TTarget, true, TWrapped, TRes> 
}

export type AsyncAssocLink<TSource, TTarget, TNilable extends boolean, TWrapped extends boolean, TRes> =
    | OneOfAsyncAssocLink<TSource, TTarget, TNilable, TWrapped, TRes>
    | OneOrNoneOfAsyncAssocLink<TSource, TTarget, TNilable, TWrapped, TRes>
    | ManyOfAsyncAssocLink<TSource, TTarget, TNilable, TWrapped, TRes>

export type AsyncAssocLinks<TSource> = Record<string, Omit<AsyncAssocLink<TSource, any, boolean, boolean, any>, "thru" | "unwrap"> | ((source: TSource) => any)>

