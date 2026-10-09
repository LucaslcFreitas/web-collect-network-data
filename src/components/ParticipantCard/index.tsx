import styles from './ParticipantCard.module.css'
import type { ParticipantType } from '../../types/ParticipantType'

function ParticipantCard({
    participant,
    onClick,
    isSelected,
}: {
    participant: ParticipantType
    onClick: (id: string) => void
    isSelected: boolean
}) {
    const formatarDataHora = (dataIso: string) => {
        if (!dataIso) return ''

        return new Date(dataIso).toLocaleString('pt-BR', {
            dateStyle: 'short',
            timeStyle: 'short',
        })
    }

    return (
        <div
            className={[
                styles.participant_card,
                isSelected && styles.participant_card_selected,
            ]
                .filter(Boolean)
                .join(' ')}
            onClick={() => onClick(participant.id)}
        >
            <h4>{participant.id}</h4>
            <p>Criado em: {formatarDataHora(participant.createdAt)}</p>
            <p>
                Última interação:{' '}
                {participant.lastSeenAt
                    ? formatarDataHora(participant.lastSeenAt)
                    : 'Nenhuma'}
            </p>
            <p>
                Dispositivo:{' '}
                {participant.deviceModel || 'Não identificado'}
            </p>
        </div>
    )
}

export default ParticipantCard
