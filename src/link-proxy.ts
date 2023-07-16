import { ManyOfExtSpec, OneOfExtSpec, OneOrNoneOfExtSpec } from "./ext-spec.js"
import { MaybeN } from "./utils.js"

export type LinkProxy<TSource extends {}> = {
    [K1 in keyof TSource]-?: {
        toOneOf<TTarget extends {}>(target: TTarget[]): {
            [K2 in keyof TTarget]-?: OneOfExtSpec<TSource, TTarget, false>
        }
        toOneOf<TTarget extends {}>(target: MaybeN<TTarget[]>): {
            [K2 in keyof TTarget]-?: OneOfExtSpec<TSource, TTarget, true>
        }
        toOneOrNoneOf<TTarget extends {}>(target: TTarget[]): {
            [K2 in keyof TTarget]-?: OneOrNoneOfExtSpec<TSource, TTarget, false>
        }
        toOneOrNoneOf<TTarget extends {}>(target: MaybeN<TTarget[]>): {
            [K2 in keyof TTarget]-?: OneOrNoneOfExtSpec<TSource, TTarget, true>
        }
        toManyOf<TTarget extends {}>(target: TTarget[]): {
            [K2 in keyof TTarget]-?: ManyOfExtSpec<TSource, TTarget, false>
        }
        toManyOf<TTarget extends {}>(target: MaybeN<TTarget[]>): {
            [K2 in keyof TTarget]-?: ManyOfExtSpec<TSource, TTarget, true>
        }
    }
}

export const getLinkProxy = <TSource extends {}>() => {
    return new Proxy({}, {
        get(_, sourceKey) {
            return new Proxy({}, {
                get(_, type) {
                    return (target: any) => new Proxy({}, {
                        get(_, targetKey) {
                            return {
                                target,
                                type,
                                sourceKey,
                                targetKey
                            }
                        }
                    })
                }
            })
        }
    }) as LinkProxy<TSource>
}
