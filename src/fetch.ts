import isFunction from "lodash/isFunction.js";
import { MaybeN, MaybeP, MaybeT, Thunk } from "./utils.js"

export interface FetchSpec<T> {
    fetch: () => Promise<T[]>
    if?: MaybeT<MaybeP<MaybeN<boolean>>>
}

export interface MultiFetchSpecBase {
    [k: string]: FetchSpec<unknown> | Thunk<MaybeP<unknown>>
}

export type MultiFetchRes<TSpec extends {}> = {
    [K in keyof TSpec]: TSpec[K] extends FetchSpec<infer T>
        ? TSpec[K]["if"] extends Function
            ? T[] | undefined
            : T[]
        : TSpec[K] extends Thunk<infer T>
            ? Awaited<T>
            : never
}

export const fetchAll = async <TSpec extends MultiFetchSpecBase>(spec: TSpec): Promise<MultiFetchRes<TSpec>> => {
    const specEntries = Object.entries(spec)
    const resolvedEntries: any[] = await Promise.all(specEntries.map(async ([key, value]) => {
        const fetch = isFunction(value)
            ? value
            : value.fetch;
        const shouldFetch = isFunction(value)
            ? true
            : value.if == null
                ? true
                : await resolveThunk(value.if)
        if (shouldFetch) {
            const res = await fetch()
            return [key, res]
        } else {
            return null
        }
    }))
    const assimilated: any = Object.fromEntries(resolvedEntries.filter(Boolean))
    return assimilated
}

export const resolveThunk = <T>(thunk: MaybeT<T>): T => {
    if (isFunction(thunk)) return thunk();
    return thunk;
}

