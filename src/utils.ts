export type Nil = null | undefined
export type MaybeN<T> = T | Nil
export type MaybeP<T> = T | Promise<T>