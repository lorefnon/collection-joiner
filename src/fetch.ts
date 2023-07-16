export interface FetchSpec<T> {
    fetch: () => Promise<T[]>
    if: () => boolean | Promise<boolean>
}

export interface MultiFetchSpecBase {
    [k: string]: FetchSpec<unknown>
}

export type MultiFetchRes<TSpec extends {}> = {
    [K in keyof TSpec]?: TSpec[K] extends FetchSpec<infer T>
    ? T[]
    : never
}

export const fetchAll = async <TSpec extends MultiFetchSpecBase>(spec: TSpec): Promise<MultiFetchRes<TSpec>> => {
    const specEntries = Object.entries(spec)
    const resolvedEntries: any[] = await Promise.all(specEntries.map(async ([key, value]) => {
        if (await value.if()) {
            const res = await value.fetch()
            return [key, res]
        } else {
            return null
        }
    }))
    const assimilated: any = Object.fromEntries(resolvedEntries.filter(Boolean))
    return assimilated
}