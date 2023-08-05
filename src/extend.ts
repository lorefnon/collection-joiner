import { OutSpec, OneOfExtSpec, OneOrNoneOfExtSpec, ManyOfExtSpec, NCond } from "./ext-spec.js"
import { LinkProxy, getLinkProxy } from "./link-proxy.js"
import { Nil, MaybeN } from "./utils.js";

export type * from "./ext-spec.js";
export type * from "./link-proxy.js";

export type ExtResult<TSource, TOutSpec extends OutSpec<TSource>> =
    Omit<TSource, keyof TOutSpec> & {
        [K in keyof TOutSpec]: TOutSpec[K] extends OneOfExtSpec<TSource, infer _TTarget, infer Nilable, infer TRes>
        ? NCond<{ value: TRes }, Nilable>
        : TOutSpec[K] extends OneOrNoneOfExtSpec<TSource, infer _TTarget, infer Nilable, infer TRes>
        ? NCond<{ value?: MaybeN<TRes> }, Nilable>
        : TOutSpec[K] extends ManyOfExtSpec<TSource, infer _TTarget, infer Nilable, infer TRes>
        ? NCond<{ values: TRes }, Nilable>
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
                    resultItem[key] = { value: extSpec.toRes(targets[0]) }
                else
                    resultItem[key] = extSpec.toRes(targets[0])
            } else {
                if (wrapRefs)
                    resultItem[key] = { values: extSpec.toRes(targets) }
                else
                    resultItem[key] = extSpec.toRes(targets)
            }
        }
        return resultItem;
    })

    return opts?.mutate ? collection : mapped
}

const buildIndex = <
    TSource extends {},
    TOutSpec extends OutSpec<TSource>
>(outSpec: TOutSpec) => {
    const mapping: {
        [K in keyof TOutSpec]?: Map<any, any[]>
    } = {}
    const keys = Object.keys(outSpec) as (keyof TOutSpec)[]
    for (const key of keys) {
        const extSpec = outSpec[key]
        const valueMapping = mapping[key] ??= new Map();
        if (extSpec.target) {
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
    }
    return mapping
}
