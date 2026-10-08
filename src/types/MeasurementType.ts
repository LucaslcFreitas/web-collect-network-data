import type { LocationType } from './LocationType'
import type { MotionType } from './MotionType'
import type { CellType } from './CellType'


type MeasurementType = {
    timestamp: string;
    receivedAt: string;
    morphology: string | null;
    topography: string | null;
    location: LocationType | null;
    motion: MotionType | null;
    servingCell: CellType | null;
    neighboringCells: CellType[] | null;
}

type MeasurementsType = MeasurementType[]

export type { MeasurementType, MeasurementsType }