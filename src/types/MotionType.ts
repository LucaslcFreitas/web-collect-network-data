type MotionItemType = {
    x: number | null;
    y: number | null;
    z: number | null;
}

type MotionType = {
    accelerometer: MotionItemType | null;
    gyroscope: MotionItemType | null;
}

export type { MotionType }