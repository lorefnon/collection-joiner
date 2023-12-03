export type Nil = null | undefined
export type MaybeN<T> = T | Nil
export type MaybeP<T> = T | Promise<T>
export type Thunk<T> = () => T
export type MaybeT<T> = T | Thunk<T>
