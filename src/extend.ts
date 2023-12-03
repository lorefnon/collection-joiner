import { AssocLinks, OneOfAssocLink, OneOrNoneOfAssocLink, ManyOfAssocLink, NCond } from "./ext-spec.js"
import { ExtContext, getExtContext } from "./link-proxy.js"
import { MaybeN } from "./utils.js";

export type * from "./ext-spec.js";
export type * from "./link-proxy.js";

export type WrapOneCond<T, TWrapped> =
    TWrapped extends true ? { value: T } : T

export type WrapManyCond<T, TWrapped> =
    TWrapped extends true ? { values: T } : T

export type ExtResult<TSource, TAssocLinks extends AssocLinks<TSource>> =
    Omit<TSource, keyof TAssocLinks> & {
        [K in keyof TAssocLinks]: TAssocLinks[K] extends (src: TSource) => infer TRes
        ? TRes
        : TAssocLinks[K] extends OneOfAssocLink<TSource, infer _TTarget, infer TNilable, infer TWrapped, infer TRes>
        ? NCond<WrapOneCond<TRes, TWrapped>, TNilable>
        : TAssocLinks[K] extends OneOrNoneOfAssocLink<TSource, infer _TTarget, infer TNilable, infer TWrapped, infer TRes>
        ? NCond<WrapOneCond<MaybeN<TRes>, TWrapped>, TNilable>
        : TAssocLinks[K] extends ManyOfAssocLink<TSource, infer _TTarget, infer TNilable, infer TWrapped, infer TRes>
        ? NCond<WrapManyCond<TRes, TWrapped>, TNilable>
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
    _extend(collection, receiver, opts)

const _extend = <TSource extends {}, TAssocLinks extends AssocLinks<TSource>>(
    collection: TSource[],
    receiver: (ctx: ExtContext<TSource>) => TAssocLinks,
    opts?: ExtendOpts
) => {
    const assocLinks = receiver(getExtContext<TSource>(collection));
    const mapping = buildIndex<TSource, TAssocLinks>(assocLinks)
    const mutate = opts?.mutate ?? false

    const extendItem = (item: any) => {
        const resultItem = opts?.mutate ? item : { ...item };
        for (const key in mapping) {
            const assoc = assocLinks[key]
            if (typeof assoc === "function") {
                resultItem[key] = assoc(item)
                continue;
            }
            if (assoc.cond && !assoc.cond()) {
                continue;
            }
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
                if (assoc.wrap)
                    resultItem[key] = { value: assoc.toRes(targets[0]) }
                else
                    resultItem[key] = assoc.toRes(targets[0])
            } else {
                if (assoc.wrap)
                    resultItem[key] = { values: assoc.toRes(targets) }
                else
                    resultItem[key] = assoc.toRes(targets)
            }
        }
        return resultItem;
    }

    if (opts?.mutate) {
        collection.forEach(extendItem);
        return collection;
    }

    return collection.map(extendItem);
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
        if (typeof assoc !== 'function' && assoc.target) {
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
