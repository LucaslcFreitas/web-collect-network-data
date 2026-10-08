
type ParticipantType = {
    id: string;
    appVersion: string | null;
    deviceModel: string | null;
    os: string | null;
    createdAt: string;
    lastSeenAt: string | null;
}

export type { ParticipantType }