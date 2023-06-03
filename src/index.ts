interface BaseExtSpec<TSource, TTarget> {
    target: TTarget[]
    targetKey: keyof TTarget
    sourceKey: keyof TSource
}

interface OneOfExtSpec<TSource, TTarget> extends BaseExtSpec<TSource, TTarget> {
    type: "toOneOf",
}

interface OneOrNoneOfExtSpec<TSource, TTarget> extends BaseExtSpec<TSource, TTarget> {
    type: "toOneOrNoneOf",
}

interface ManyOfExtSpec<TSource, TTarget> extends BaseExtSpec<TSource, TTarget> {
    type: "toManyOf",
}

type ExtSpec<TSource, TTarget> =
    | OneOfExtSpec<TSource, TTarget>
    | OneOrNoneOfExtSpec<TSource, TTarget>
    | ManyOfExtSpec<TSource, TTarget>

type OutSpec<TSource> = Record<string, ExtSpec<TSource, any>>

type ExtSource<TSource, TOutSpec extends OutSpec<TSource>> =
    TSource & {
        [K in keyof TOutSpec]: TOutSpec[K] extends OneOfExtSpec<TSource, infer TTarget>
        ? { value: TTarget }
        : TOutSpec[K] extends OneOrNoneOfExtSpec<TSource, infer TTarget>
        ? { value?: TTarget | null }
        : TOutSpec[K] extends ManyOfExtSpec<TSource, infer TTarget>
        ? { values: TTarget[] }
        : never
    }

type LinkProxy<TSource extends {}> = {
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

const getLinkProxy= <TSource extends {}> () => {
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


export const extend = <TSource extends {}, TOutSpec extends OutSpec<TSource>>(
    collection: TSource[],
    receiver: (ctx: LinkProxy<TSource>) => TOutSpec
): ExtSource<TSource, TOutSpec>[] => _extend(collection, receiver, true)

export const extendUnwrapped = <TSource extends {}, TOutSpec extends OutSpec<TSource>>(
    collection: TSource[],
    receiver: (ctx: LinkProxy<TSource>) => TOutSpec
): ExtSource<TSource, TOutSpec>[] => _extend(collection, receiver, false)

const _extend = <TSource extends {}, TOutSpec extends OutSpec<TSource>>(
    collection: TSource[],
    receiver: (ctx: LinkProxy<TSource>) => TOutSpec,
    wrapRefs: boolean,
) => {
    const outSpec = receiver(getLinkProxy<TSource>());
    const mapping: {
        [K in keyof TOutSpec]?: Map<any, any[]>
    } = {}
    const keys = Object.keys(outSpec) as (keyof TOutSpec)[]
    for (const key of keys) {
        const extSpec = outSpec[key]
        const valueMapping = mapping[key] ??= new Map();
        for (const targetItem of extSpec.target) {
            const value = (targetItem as any)[extSpec.targetKey]
            const targetList = valueMapping.get(value) ?? []
            targetList.push(targetItem)
            valueMapping.set(value, targetList)
        }
    }
    return collection.map((item: any) => {
        const resultItem = { ...item };
        for (const key of keys) {
            const extSpec = outSpec[key]
            const targets = mapping[key]?.get(item[extSpec.sourceKey]) ?? []
            if (extSpec.type === "toOneOrNoneOf" || extSpec.type === "toOneOf") {
                if (targets.length > 1) {
                    throw new Error(`Expected atmost one target for association ${String(key)} but found ${targets.length}`)
                }
                if (extSpec.type === "toOneOf" && targets.length === 0) {
                    throw new Error(`Expected atleast one target for association ${String(key)} but found ${targets.length}`)
                }
                if (wrapRefs)
                    resultItem[key] = { value: targets[0] }
                else
                    resultItem[key] = targets[0]
            } else {
                if (wrapRefs)
                    resultItem[key] = { values: targets }
                else
                    resultItem[key] = targets
            }
        }
        return resultItem;
    })
}
