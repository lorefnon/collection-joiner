import { ManyOfExtSpec, OneOfExtSpec, OneOrNoneOfExtSpec } from "./ext-spec.js"

export type LinkProxy<TSource extends {}> = {
    [K1 in keyof TSource]-?: {
        toOneOf<TTarget extends {}>(target: TTarget[]): {
            [K2 in keyof TTarget]-?: OneOfExtSpec<TSource, TTarget>
        }
        toOneOrNoneOf<TTarget extends {}>(target: TTarget[]): {
            [K2 in keyof TTarget]-?: OneOrNoneOfExtSpec<TSource, TTarget>
        }
        toManyOf<TTarget extends {}>(target: TTarget[]): {
            [K2 in keyof TTarget]-?: ManyOfExtSpec<TSource, TTarget>
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
