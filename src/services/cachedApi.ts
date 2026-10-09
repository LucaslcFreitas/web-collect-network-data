import api from './api'
import endpoints from './endpoints'
import {
    cacheEnvironment,
    cacheMeasurements,
    getCachedEnvironment,
    getCachedMeasurements,
} from './cache'
import type { EnvironmentType } from '../types/EnvironmentType'
import type { MeasurementType } from '../types/MeasurementType'

export const ENVIRONMENT_CACHE_MAX_AGE = 24 * 60 * 60 * 1000

export const getMeasurementsByBatchId = async (
    batchId: string
): Promise<MeasurementType[]> => {
    let cachedMeasurements: MeasurementType[] | undefined

    try {
        cachedMeasurements = await getCachedMeasurements(batchId)
        if (cachedMeasurements) return cachedMeasurements
    } catch (cacheError) {
        console.warn('Unable to read measurements cache:', cacheError)
    }

    try {
        const { data } = await api.get<{ measurements: MeasurementType[] }>(
            endpoints.GET_MEASUREMENTS_BY_ID,
            { params: { batchId } }
        )
        try {
            await cacheMeasurements(batchId, data.measurements)
        } catch (cacheError) {
            console.warn('Unable to save measurements cache:', cacheError)
        }
        return data.measurements
    } catch (error) {
        if (cachedMeasurements) return cachedMeasurements
        throw error
    }
}

export const getEnvironment = async (): Promise<EnvironmentType> => {
    try {
        const cachedEnvironment = await getCachedEnvironment(
            ENVIRONMENT_CACHE_MAX_AGE
        )
        if (cachedEnvironment) return cachedEnvironment
    } catch (cacheError) {
        console.warn('Unable to read environment cache:', cacheError)
    }

    const { data } = await api.get<EnvironmentType>(endpoints.GET_ENVIRONMENT)
    try {
        await cacheEnvironment(data)
    } catch (cacheError) {
        console.warn('Unable to save environment cache:', cacheError)
    }
    return data
}