import styles from './BatchCard.module.css'
import type { BatchType } from '../../types/BatchType'

function BatchCard({
    batch,
    onClick,
    isSelected,
}: {
    batch: BatchType
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
                styles.batch_card,
                isSelected && styles.batch_card_selected,
            ]
                .filter(Boolean)
                .join(' ')}
            onClick={() => onClick(batch.id)}
        >
            <h4>{batch.id}</h4>
            <p>Criado em: {formatarDataHora(batch.createdAt)}</p>
            <p>Amostras: {batch.measurementCount}</p>
        </div>
    )
}

export default BatchCard
