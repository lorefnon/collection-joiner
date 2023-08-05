import { ManyOfExtSpec, OneOfExtSpec, OneOrNoneOfExtSpec } from "./ext-spec.js"
import { MaybeN } from "./utils.js"

export type LinkProxy<TSource extends {}> = {
    [K1 in keyof TSource]-?: {
        toOneOf<TTarget extends {}>(target: TTarget[]): {
            [K2 in keyof TTarget]-?: OneOfExtSpec<TSource, TTarget, false, TTarget>
        }
        toOneOf<TTarget extends {}>(target: MaybeN<TTarget[]>): {
            [K2 in keyof TTarget]-?: OneOfExtSpec<TSource, TTarget, true, TTarget>
        }
        toOneOrNoneOf<TTarget extends {}>(target: TTarget[]): {
            [K2 in keyof TTarget]-?: OneOrNoneOfExtSpec<TSource, TTarget, false, MaybeN<TTarget>>
        }
        toOneOrNoneOf<TTarget extends {}>(target: MaybeN<TTarget[]>): {
            [K2 in keyof TTarget]-?: OneOrNoneOfExtSpec<TSource, TTarget, true, MaybeN<TTarget>>
        }
        toManyOf<TTarget extends {}>(target: TTarget[]): {
            [K2 in keyof TTarget]-?: ManyOfExtSpec<TSource, TTarget, false, TTarget[]>
        }
        toManyOf<TTarget extends {}>(target: MaybeN<TTarget[]>): {
            [K2 in keyof TTarget]-?: ManyOfExtSpec<TSource, TTarget, true, TTarget[]>
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
                                targetKey,
                                toRes: (it: any) => it,
                                thru(transform: any): any {
                                    const prevToRes = this.toRes
                                    return {
                                        ...this,
                                        toRes: (it: any) => transform(prevToRes(it))
                                    }
                                }
                            }
                        }
                    })
                }
            })
        }
    }) as LinkProxy<TSource>
}
