import type { EnvironmentType } from '../types/EnvironmentType'
import type { MeasurementType } from '../types/MeasurementType'

const DATABASE_NAME = 'web-collect-network-data'
const DATABASE_VERSION = 1
const MEASUREMENTS_STORE = 'measurements'
const ENVIRONMENT_STORE = 'environment'
const ENVIRONMENT_KEY = 'current'

type EnvironmentCacheEntry = {
    key: typeof ENVIRONMENT_KEY
    value: EnvironmentType
    cachedAt: number
}

type MeasurementCacheEntry = {
    batchId: string
    value: MeasurementType[]
}

const openDatabase = (): Promise<IDBDatabase> =>
    new Promise((resolve, reject) => {
        if (!('indexedDB' in window)) {
            reject(new Error('IndexedDB is not available'))
            return
        }

        const request = window.indexedDB.open(DATABASE_NAME, DATABASE_VERSION)

        request.onupgradeneeded = () => {
            const database = request.result
            if (!database.objectStoreNames.contains(MEASUREMENTS_STORE)) {
                database.createObjectStore(MEASUREMENTS_STORE, {
                    keyPath: 'batchId',
                })
            }
            if (!database.objectStoreNames.contains(ENVIRONMENT_STORE)) {
                database.createObjectStore(ENVIRONMENT_STORE, { keyPath: 'key' })
            }
        }
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
    })

const getFromStore = <T>(storeName: string, key: IDBValidKey): Promise<T | undefined> =>
    openDatabase().then(
        (database) =>
            new Promise((resolve, reject) => {
                const transaction = database.transaction(storeName, 'readonly')
                const request = transaction.objectStore(storeName).get(key)
                request.onsuccess = () => resolve(request.result as T | undefined)
                request.onerror = () => reject(request.error)
                transaction.oncomplete = () => database.close()
                transaction.onerror = () => reject(transaction.error)
            })
    )

const putInStore = <T>(storeName: string, value: T): Promise<void> =>
    openDatabase().then(
        (database) =>
            new Promise((resolve, reject) => {
                const transaction = database.transaction(storeName, 'readwrite')
                transaction.objectStore(storeName).put(value)
                transaction.oncomplete = () => {
                    database.close()
                    resolve()
                }
                transaction.onerror = () => reject(transaction.error)
                transaction.onabort = () => reject(transaction.error)
            })
    )

export const getCachedMeasurements = async (
    batchId: string
): Promise<MeasurementType[] | undefined> => {
    const entry = await getFromStore<MeasurementCacheEntry>(
        MEASUREMENTS_STORE,
        batchId
    )
    return entry?.value
}

export const cacheMeasurements = (
    batchId: string,
    measurements: MeasurementType[]
): Promise<void> =>
    putInStore<MeasurementCacheEntry>(MEASUREMENTS_STORE, {
        batchId,
        value: measurements,
    })

export const getCachedEnvironment = async (
    maxAge: number
): Promise<EnvironmentType | undefined> => {
    const entry = await getFromStore<EnvironmentCacheEntry>(
        ENVIRONMENT_STORE,
        ENVIRONMENT_KEY
    )
    if (!entry || Date.now() - entry.cachedAt > maxAge) return undefined
    return entry.value
}

export const cacheEnvironment = (value: EnvironmentType): Promise<void> =>
    putInStore<EnvironmentCacheEntry>(ENVIRONMENT_STORE, {
        key: ENVIRONMENT_KEY,
        value,
        cachedAt: Date.now(),
    })