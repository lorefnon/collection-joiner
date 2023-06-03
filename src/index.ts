interface BaseExtSpec<TSource, TTarget> {
    target: TTarget[]
    targetKey: keyof TTarget
    sourceKey: keyof TSource
}

interface OneOfExtSpec<TSource, TTarget> extends BaseExtSpec<TSource, TTarget> {
    type: "OneOfExtSpec",
}

interface OneOrNoneOfExtSpec<TSource, TTarget> extends BaseExtSpec<TSource, TTarget> {
    type: "OneOrNoneOfExtSpec",
}

interface ManyOfExtSpec<TSource, TTarget> extends BaseExtSpec<TSource, TTarget> {
    type: "ManyOfExtSpec",
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

class ExtContext<TSource> {
    oneOf<TTarget>(target: TTarget[], targetKey: keyof TTarget, sourceKey: keyof TSource): OneOfExtSpec<TSource, TTarget> {
        return {
            type: "OneOfExtSpec",
            target,
            targetKey,
            sourceKey
        }
    }
    oneOrNoneOf<TTarget>(target: TTarget[], targetKey: keyof TTarget, sourceKey: keyof TSource): OneOrNoneOfExtSpec<TSource, TTarget> {
        return {
            type: "OneOrNoneOfExtSpec",
            target,
            targetKey,
            sourceKey
        }
    }
    manyOf<TTarget>(target: TTarget[], targetKey: keyof TTarget, sourceKey: keyof TSource): ManyOfExtSpec<TSource, TTarget> {
        return {
            type: "ManyOfExtSpec",
            target,
            targetKey,
            sourceKey
        }
    }
};

export const extend = <TSource, TOutSpec extends OutSpec<TSource>>(
    collection: TSource[],
    receiver: (ctx: ExtContext<TSource>) => TOutSpec
): ExtSource<TSource, TOutSpec>[] => _extend(collection, receiver, true)

export const extendUnwrapped = <TSource, TOutSpec extends OutSpec<TSource>>(
    collection: TSource[],
    receiver: (ctx: ExtContext<TSource>) => TOutSpec
): ExtSource<TSource, TOutSpec>[] => _extend(collection, receiver, false)

const _extend = <TSource, TOutSpec extends OutSpec<TSource>>(
    collection: TSource[],
    receiver: (ctx: ExtContext<TSource>) => TOutSpec,
    wrapRefs: boolean,
) => {
    const outSpec = receiver(new ExtContext<TSource>());
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
            if (extSpec.type === "OneOrNoneOfExtSpec" || extSpec.type === "OneOfExtSpec") {
                if (targets.length > 1) {
                    throw new Error(`Expected atmost one target for association ${String(key)} but found ${targets.length}`)
                }
                if (extSpec.type === "OneOfExtSpec" && targets.length === 0) {
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
