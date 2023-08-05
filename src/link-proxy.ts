import { ManyOfAssocLink, OneOfAssocLink, OneOrNoneOfAssocLink } from "./ext-spec.js"
import { MaybeN } from "./utils.js"

interface ItemKeyRef<TColItem extends {}, TKey extends keyof TColItem> {
    key: TKey
}

type ItemKeysProxy<TSource extends {}> = {
    [K in keyof TSource]-?: ItemKeyRef<TSource, K>
}

interface GetItemKey<TSource extends {}, TKey extends keyof TSource> {
    (proxy: ItemKeysProxy<TSource>): ItemKeyRef<TSource, TKey>
}

export interface LinkProxy<TSource extends {}> {
    toOneOf<TTarget extends {}, TTargetKey extends keyof TTarget>(
        target: TTarget[],
        getTargetKey: GetItemKey<TTarget, TTargetKey>
    ): OneOfAssocLink<TSource, TTarget, false, TTarget>
    toOneOf<TTarget extends {}, TTargetKey extends keyof TTarget>(
        target: MaybeN<TTarget[]>,
        getTargetKey: GetItemKey<TTarget, TTargetKey>
    ): OneOfAssocLink<TSource, TTarget, true, TTarget>
    toOneOrNoneOf<TTarget extends {}, TTargetKey extends keyof TTarget>(
        target: TTarget[],
        getTargetKey: GetItemKey<TTarget, TTargetKey>
    ): OneOrNoneOfAssocLink<TSource, TTarget, false, MaybeN<TTarget>>
    toOneOrNoneOf<TTarget extends {}, TTargetKey extends keyof TTarget>(
        target: MaybeN<TTarget[]>,
        getTargetKey: GetItemKey<TTarget, TTargetKey>
    ): OneOrNoneOfAssocLink<TSource, TTarget, true, MaybeN<TTarget>>
    toManyOf<TTarget extends {}, TTargetKey extends keyof TTarget>(
        target: TTarget[],
        getTargetKey: GetItemKey<TTarget, TTargetKey>
    ): ManyOfAssocLink<TSource, TTarget, false, TTarget[]>
    toManyOf<TTarget extends {}, TTargetKey extends keyof TTarget>(
        target: MaybeN<TTarget[]>,
        getTargetKey: GetItemKey<TTarget, TTargetKey>
    ): ManyOfAssocLink<TSource, TTarget, true, TTarget[]>
}

export const getItemKeysProxy = <TSource extends {}> (source: TSource[]) =>
    new Proxy({}, {
        get(_, key) {
            return {
                source,
                key
            }
        }
    }) as ItemKeysProxy<TSource>

export const link = <TSrcColItem extends {}, TSrcKey extends keyof TSrcColItem> (
    ref: ItemKeyRef<TSrcColItem, TSrcKey>
) => {
    return new Proxy({}, {
        get(_, type) {
            return <TTarget extends {}, TTargetKey extends keyof TTarget> (target: TTarget[], getTargetKey: GetItemKey<TTarget, TTargetKey>) => ({
                type,
                target,
                targetKey: getTargetKey(getItemKeysProxy<TTarget>(target)).key,
                sourceKey: ref.key,
                toRes: (target: any) => target,
                thru(transform: (input: any) => any) {
                    const toRes = this.toRes
                     return {
                        ...this,
                        toRes: (target: any) => transform(toRes(target))
                    }
                }
            })
        }
    }) as LinkProxy<TSrcColItem>
}

export interface ExtContext<TSource extends {}> {
    own: ItemKeysProxy<TSource>
    link: typeof link
}

export const getExtContext = <TSource extends {}>(collection: TSource[]) => ({
    own: getItemKeysProxy(collection),
    link
})
