import { NCond, AsyncAssocLinks, OneOfAsyncAssocLink, OneOrNoneOfAsyncAssocLink, ManyOfAsyncAssocLink } from "./ext-spec.js"
import { ExtendOpts, WrapManyCond, WrapOneCond, extendItem } from "./extend.js";
import isFunction from "lodash/isFunction.js";
import { AsyncExtContext, getAsyncExtContext } from "./link-proxy.js"
import { MaybeN, MaybeP, MaybeT } from "./utils.js";
import { resolveThunk } from "./fetch.js";

export type AsyncExtResult<TSource, TAssocLinks extends AsyncAssocLinks<TSource>> =
    Omit<TSource, keyof TAssocLinks> & {
        [K in keyof TAssocLinks]: TAssocLinks[K] extends (src: TSource) => infer TRes
        ? TRes
        : TAssocLinks[K] extends OneOfAsyncAssocLink<TSource, infer _TTarget, infer TNilable, infer TWrapped, infer TRes>
        ? NCond<WrapOneCond<TRes, TWrapped>, TNilable>
        : TAssocLinks[K] extends OneOrNoneOfAsyncAssocLink<TSource, infer _TTarget, infer TNilable, infer TWrapped, infer TRes>
        ? NCond<WrapOneCond<MaybeN<TRes>, TWrapped>, TNilable>
        : TAssocLinks[K] extends ManyOfAsyncAssocLink<TSource, infer _TTarget, infer TNilable, infer TWrapped, infer TRes>
        ? NCond<WrapManyCond<TRes, TWrapped>, TNilable>
        : never
    }


export const extendAsync = async <TSource extends {}, TAssocLinks extends AsyncAssocLinks<TSource>>(
    source: MaybeT<MaybeP<TSource[]>>,
    receiver: (ctx: AsyncExtContext<TSource>) => MaybeP<TAssocLinks>,
    opts?: ExtendOpts
): Promise<AsyncExtResult<TSource, TAssocLinks>[]> =>
    _extend(source, receiver, opts)

const _extend = async <TSource extends {}, TAssocLinks extends AsyncAssocLinks<TSource>>(
    source: MaybeT<MaybeP<TSource[]>>,
    receiver: (ctx: AsyncExtContext<TSource>) => MaybeP<TAssocLinks>,
    opts?: ExtendOpts
) => {
    const collection = await resolveThunk(source);
    const assocLinks = await receiver(getAsyncExtContext<TSource>(collection));
    const mapping = await buildIndex<TSource, TAssocLinks>(assocLinks)

    const _extendItem = extendItem<TSource, TAssocLinks>(
        assocLinks,
        mapping,
        opts
    )

    if (opts?.mutate) {
        collection.forEach(_extendItem);
        return collection;
    }

    return collection.map(_extendItem);
}

const buildIndex = async <
    TSource extends {},
    TAssocLinks extends AsyncAssocLinks<TSource>
>(assocLinks: TAssocLinks) => {
    const mapping: {
        [K in keyof TAssocLinks]?: Map<any, any[]>
    } = {}
    const keys = Object.keys(assocLinks) as (keyof TAssocLinks)[]

    // If same thunk is used multiple times, we should not refetch
    const targetMapping = new WeakMap();
    const resolveTarget = (target: any) => {
        if (isFunction(target)) {
            const cachedTarget = targetMapping.get(target);
            if (cachedTarget) return cachedTarget;
            const resolved = target();
            return resolved;
        }
        return target;
    }

    await Promise.all(keys.map(async (key) => {
        const assoc = assocLinks[key]
        if (typeof assoc !== 'function' && assoc.cond && !assoc.cond()) {
            return;
        }
        const valueMapping = mapping[key] ??= new Map();
        if (typeof assoc !== 'function' && assoc.target) {
            const target = await resolveTarget(assoc.target);
            if (!target) return;
            for (const targetItem of target) {
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
    }))
    return mapping
}

