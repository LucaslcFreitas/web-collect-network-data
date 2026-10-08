type CellType = {
    registered: boolean | null;
    technology: string | null;
    cellId: string | null;
    pci: number | null;
    tac: number | null;
    arfcn: number | null;
    mcc: string | null;
    mnc: string | null;
    rsrp: number | null;
    rsrq: number | null;
    rssi: number | null;
    sinr: number | null;
    timingAdvance: number | null;
}

export type { CellType }