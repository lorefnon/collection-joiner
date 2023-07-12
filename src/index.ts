import { OutSpec, OneOfExtSpec, OneOrNoneOfExtSpec, ManyOfExtSpec } from "./ext-spec.js"
import { LinkProxy, getLinkProxy } from "./link-proxy.js"

export type * from "./ext-spec.js";
export type * from "./link-proxy.js";

export type ExtResult<TSource, TOutSpec extends OutSpec<TSource>> =
    TSource & {
        [K in keyof TOutSpec]: TOutSpec[K] extends OneOfExtSpec<TSource, infer TTarget>
        ? { value: TTarget }
        : TOutSpec[K] extends OneOrNoneOfExtSpec<TSource, infer TTarget>
        ? { value?: TTarget | null }
        : TOutSpec[K] extends ManyOfExtSpec<TSource, infer TTarget>
        ? { values: TTarget[] }
        : never
    }

export interface ExtendOpts {
    mutate?: boolean
}

export const extend = <TSource extends {}, TOutSpec extends OutSpec<TSource>>(
    collection: TSource[],
    receiver: (ctx: LinkProxy<TSource>) => TOutSpec,
    opts?: ExtendOpts
): ExtResult<TSource, TOutSpec>[] =>
    _extend(collection, receiver, true, opts)

export const extendUnwrapped = <TSource extends {}, TOutSpec extends OutSpec<TSource>>(
    collection: TSource[],
    receiver: (ctx: LinkProxy<TSource>) => TOutSpec,
    opts?: ExtendOpts
): ExtResult<TSource, TOutSpec>[] =>
    _extend(collection, receiver, false, opts)

const _extend = <TSource extends {}, TOutSpec extends OutSpec<TSource>>(
    collection: TSource[],
    receiver: (ctx: LinkProxy<TSource>) => TOutSpec,
    wrapRefs: boolean,
    opts?: ExtendOpts
) => {
    const outSpec = receiver(getLinkProxy<TSource>());
    const mapping = buildIndex<TSource, TOutSpec>(outSpec)
    const mutate = opts?.mutate ?? false

    const mapped: any = collection[mutate ? 'forEach' : 'map']((item: any) => {
        const resultItem = opts?.mutate ? item : { ...item };
        for (const key in mapping) {
            const extSpec = outSpec[key]
            const sourceKeyVal = item[extSpec.sourceKey]
            const targets: any[] = [];
            const sourceKeyVals = Array.isArray(sourceKeyVal)
                ? sourceKeyVal
                : [sourceKeyVal]
            for (const skVal of sourceKeyVals) {
                if (skVal == null) continue;
                const target = mapping[key]?.get(skVal);
                if (target == null) continue;
                targets.push(...target)
            }
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

    return opts?.mutate ? collection : mapped
}

const buildIndex = <TSource extends {}, TOutSpec extends OutSpec<TSource>>(outSpec: TOutSpec) => {
    const mapping: {
        [K in keyof TOutSpec]?: Map<any, any[]>
    } = {}
    const keys = Object.keys(outSpec) as (keyof TOutSpec)[]
    for (const key of keys) {
        const extSpec = outSpec[key]
        const valueMapping = mapping[key] ??= new Map();
        for (const targetItem of extSpec.target) {
            const targetKeyVal = (targetItem as any)[extSpec.targetKey]
            const targetKeyVals = Array.isArray(targetKeyVal)
                ? targetKeyVal
                : [targetKeyVal]
            for (const tkVal of targetKeyVals) {
                if (tkVal == null) continue;
                const targetList = valueMapping.get(tkVal) ?? []
                targetList.push(targetItem)
                valueMapping.set(tkVal, targetList)
            }
        }
    }
    return mapping
}