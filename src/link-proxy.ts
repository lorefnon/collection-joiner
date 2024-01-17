import { ManyOfAssocLink, ManyOfAsyncAssocLink, OneOfAssocLink, OneOfAsyncAssocLink, OneOrNoneOfAssocLink, OneOrNoneOfAsyncAssocLink } from "./ext-spec.js"
import { MaybeN, MaybeP, MaybeT, Thunk } from "./utils.js"

interface ItemKeyRef<TColItem extends {}, TKey extends keyof TColItem> {
    key: TKey
}

type ItemKeysProxy<TSource extends {}> = {
    [K in keyof TSource]-?: ItemKeyRef<TSource, K>
}

interface GetItemKey<TSource extends {}, TKey extends keyof TSource> {
    (proxy: ItemKeysProxy<TSource>): ItemKeyRef<TSource, TKey>
}

export interface LinkProxy<TSource extends {}, TWrapped extends boolean> {
    toOneOf<TTarget extends {}, TTargetKey extends keyof TTarget>(
        target: TTarget[],
        getTargetKey: GetItemKey<TTarget, TTargetKey>
    ): OneOfAssocLink<TSource, TTarget, false, TWrapped, TTarget>

    toOneOf<TTarget extends {}, TTargetKey extends keyof TTarget>(
        target: MaybeN<TTarget[]>,
        getTargetKey: GetItemKey<TTarget, TTargetKey>
    ): OneOfAssocLink<TSource, TTarget, true, TWrapped, TTarget>

    toOneOrNoneOf<TTarget extends {}, TTargetKey extends keyof TTarget>(
        target: TTarget[],
        getTargetKey: GetItemKey<TTarget, TTargetKey>
    ): OneOrNoneOfAssocLink<TSource, TTarget, false, TWrapped, MaybeN<TTarget>>

    toOneOrNoneOf<TTarget extends {}, TTargetKey extends keyof TTarget>(
        target: MaybeN<TTarget[]>,
        getTargetKey: GetItemKey<TTarget, TTargetKey>
    ): OneOrNoneOfAssocLink<TSource, TTarget, true, TWrapped, MaybeN<TTarget>>

    toManyOf<TTarget extends {}, TTargetKey extends keyof TTarget>(
        target: TTarget[],
        getTargetKey: GetItemKey<TTarget, TTargetKey>
    ): ManyOfAssocLink<TSource, TTarget, false, TWrapped, TTarget[]>

    toManyOf<TTarget extends {}, TTargetKey extends keyof TTarget>(
        target: MaybeN<TTarget[]>,
        getTargetKey: GetItemKey<TTarget, TTargetKey>
    ): ManyOfAssocLink<TSource, TTarget, true, TWrapped, TTarget[]>
}

export interface AsyncLinkProxy<TSource extends {}, TWrapped extends boolean> {
    toOneOf<TTarget extends {}, TTargetKey extends keyof TTarget>(
        target: MaybeT<MaybeP<TTarget[]>>,
        getTargetKey: GetItemKey<TTarget, TTargetKey>
    ): OneOfAsyncAssocLink<TSource, TTarget, false, TWrapped, TTarget>

    toOneOf<TTarget extends {}, TTargetKey extends keyof TTarget>(
        target: MaybeT<MaybeP<TTarget[]>>,
        getTargetKey: GetItemKey<TTarget, TTargetKey>
    ): OneOfAsyncAssocLink<TSource, TTarget, true, TWrapped, TTarget>

    toOneOrNoneOf<TTarget extends {}, TTargetKey extends keyof TTarget>(
        target: MaybeT<MaybeP<TTarget[]>>,
        getTargetKey: GetItemKey<TTarget, TTargetKey>
    ): OneOrNoneOfAsyncAssocLink<TSource, TTarget, false, TWrapped, MaybeN<TTarget>>

    toOneOrNoneOf<TTarget extends {}, TTargetKey extends keyof TTarget>(
        target: MaybeT<MaybeP<TTarget[]>>,
        getTargetKey: GetItemKey<TTarget, TTargetKey>
    ): OneOrNoneOfAsyncAssocLink<TSource, TTarget, true, TWrapped, MaybeN<TTarget>>

    toManyOf<TTarget extends {}, TTargetKey extends keyof TTarget>(
        target: MaybeT<MaybeP<TTarget[]>>,
        getTargetKey: GetItemKey<TTarget, TTargetKey>
    ): ManyOfAsyncAssocLink<TSource, TTarget, false, TWrapped, TTarget[]>

    toManyOf<TTarget extends {}, TTargetKey extends keyof TTarget>(
        target: MaybeT<MaybeP<TTarget[]>>,
        getTargetKey: GetItemKey<TTarget, TTargetKey>
    ): ManyOfAsyncAssocLink<TSource, TTarget, true, TWrapped, TTarget[]>
}


export const getItemKeysProxy = <TSource extends {}>(source: TSource[]) =>
    new Proxy({}, {
        get(_, key) {
            return {
                source,
                key
            }
        }
    }) as ItemKeysProxy<TSource>

export const link = <TSrcColItem extends {}, TSrcKey extends keyof TSrcColItem>(
    ref: ItemKeyRef<TSrcColItem, TSrcKey>
) => createLinkProxy(ref, true) as LinkProxy<TSrcColItem, true>

export const asyncLink = <TSrcColItem extends {}, TSrcKey extends keyof TSrcColItem>(
    ref: ItemKeyRef<TSrcColItem, TSrcKey>
) => createLinkProxy(ref, true) as AsyncLinkProxy<TSrcColItem, true>

const createLinkProxy = (
    ref: any,
    wrap: boolean
) => {
    return new Proxy({}, {
        get(_, type) {
            return <TTarget extends {}, TTargetKey extends keyof TTarget>(
                target: TTarget[],
                getTargetKey: GetItemKey<TTarget, TTargetKey>
            ) => ({
                type,
                target,
                wrap,
                targetKey: getTargetKey(getItemKeysProxy<TTarget>(target)).key,
                sourceKey: ref.key,
                toRes: (target: any) => target,
                unwrap() {
                    return {
                        ...this,
                        wrap: false
                    }
                },
                if(cond: Thunk<boolean>) {
                    return {
                        ...this,
                        cond
                    }
                },
                thru(transform: (input: any) => any) {
                    const toRes = this.toRes
                    return {
                        ...this,
                        toRes: (target: any) => transform(toRes(target))
                    }
                }
            })
        }
    })
}

export interface ExtContext<TSource extends {}> {
    own: ItemKeysProxy<TSource>
    link: typeof link
}

export const getExtContext = <TSource extends {}>(collection: TSource[]): ExtContext<TSource> => ({
    own: getItemKeysProxy(collection),
    link
})

export interface AsyncExtContext<TSource extends {}> {
    collection: TSource[]
    own: ItemKeysProxy<TSource>
    link: typeof asyncLink 
}

export const getAsyncExtContext = <TSource extends {}>(collection: TSource[]): AsyncExtContext<TSource> => ({
    collection,
    own: getItemKeysProxy(collection),
    link: asyncLink
})

