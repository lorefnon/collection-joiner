import { AssocLinks, OneOfAssocLink, OneOrNoneOfAssocLink, ManyOfAssocLink, NCond } from "./ext-spec.js"
import { ExtContext, getExtContext } from "./link-proxy.js"
import { MaybeN } from "./utils.js";

export type * from "./ext-spec.js";
export type * from "./link-proxy.js";

export type ExtResult<TSource, TAssocLinks extends AssocLinks<TSource>> =
    Omit<TSource, keyof TAssocLinks> & {
        [K in keyof TAssocLinks]: TAssocLinks[K] extends OneOfAssocLink<TSource, infer _TTarget, infer Nilable, infer TRes>
        ? NCond<{ value: TRes }, Nilable>
        : TAssocLinks[K] extends OneOrNoneOfAssocLink<TSource, infer _TTarget, infer Nilable, infer TRes>
        ? NCond<{ value?: MaybeN<TRes> }, Nilable>
        : TAssocLinks[K] extends ManyOfAssocLink<TSource, infer _TTarget, infer Nilable, infer TRes>
        ? NCond<{ values: TRes }, Nilable>
        : never
    }

export interface ExtendOpts {
    mutate?: boolean
}

export const extend = <TSource extends {}, TAssocLinks extends AssocLinks<TSource>>(
    collection: TSource[],
    receiver: (ctx: ExtContext<TSource>) => TAssocLinks,
    opts?: ExtendOpts
): ExtResult<TSource, TAssocLinks>[] =>
    _extend(collection, receiver, true, opts)

export const extendUnwrapped = <TSource extends {}, TAssocLinks extends AssocLinks<TSource>>(
    collection: TSource[],
    receiver: (ctx: ExtContext<TSource>) => TAssocLinks,
    opts?: ExtendOpts
): ExtResult<TSource, TAssocLinks>[] =>
    _extend(collection, receiver, false, opts)

const _extend = <TSource extends {}, TAssocLinks extends AssocLinks<TSource>>(
    collection: TSource[],
    receiver: (ctx: ExtContext<TSource>) => TAssocLinks,
    wrapRefs: boolean,
    opts?: ExtendOpts
) => {
    const assocLinks = receiver(getExtContext<TSource>(collection));
    const mapping = buildIndex<TSource, TAssocLinks>(assocLinks)
    const mutate = opts?.mutate ?? false

    const mapped: any = collection[mutate ? 'forEach' : 'map']((item: any) => {
        const resultItem = opts?.mutate ? item : { ...item };
        for (const key in mapping) {
            const assoc = assocLinks[key]
            const sourceKeyVal = item[assoc.sourceKey]
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
            if (assoc.type === "toOneOrNoneOf" || assoc.type === "toOneOf") {
                if (targets.length > 1) {
                    throw new Error(`Expected atmost one target for association ${String(key)} but found ${targets.length}`)
                }
                if (assoc.type === "toOneOf" && targets.length === 0) {
                    throw new Error(`Expected atleast one target for association ${String(key)} but found ${targets.length}`)
                }
                if (wrapRefs)
                    resultItem[key] = { value: assoc.toRes(targets[0]) }
                else
                    resultItem[key] = assoc.toRes(targets[0])
            } else {
                if (wrapRefs)
                    resultItem[key] = { values: assoc.toRes(targets) }
                else
                    resultItem[key] = assoc.toRes(targets)
            }
        }
        return resultItem;
    })

    return opts?.mutate ? collection : mapped
}

const buildIndex = <
    TSource extends {},
    TAssocLinks extends AssocLinks<TSource>
>(assocLinks: TAssocLinks) => {
    const mapping: {
        [K in keyof TAssocLinks]?: Map<any, any[]>
    } = {}
    const keys = Object.keys(assocLinks) as (keyof TAssocLinks)[]
    for (const key of keys) {
        const assoc = assocLinks[key]
        const valueMapping = mapping[key] ??= new Map();
        if (assoc.target) {
            for (const targetItem of assoc.target) {
                const targetKeyVal = (targetItem as any)[assoc.targetKey]
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
