import { MaybeN } from "./utils.js"

export interface BaseExtSpec<TSource, TTarget, Nilable extends boolean> {
    target: true extends Nilable ? MaybeN<TTarget[]> : TTarget[]
    targetKey: keyof TTarget
    sourceKey: keyof TSource
}

export interface OneOfExtSpec<TSource, TTarget, Nilable extends boolean> extends BaseExtSpec<TSource, TTarget, Nilable> {
    type: "toOneOf",
}

export interface OneOrNoneOfExtSpec<TSource, TTarget, Nilable extends boolean> extends BaseExtSpec<TSource, TTarget, Nilable> {
    type: "toOneOrNoneOf",
}

export interface ManyOfExtSpec<TSource, TTarget, Nilable extends boolean> extends BaseExtSpec<TSource, TTarget, Nilable> {
    type: "toManyOf",
}

export type ExtSpec<TSource, TTarget, Nilable extends boolean> =
    | OneOfExtSpec<TSource, TTarget, Nilable>
    | OneOrNoneOfExtSpec<TSource, TTarget, Nilable>
    | ManyOfExtSpec<TSource, TTarget, Nilable>

export type OutSpec<TSource> = Record<string, ExtSpec<TSource, any, boolean>>
