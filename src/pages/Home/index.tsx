import styles from './Home.module.css'
import logo from '../../assets/logo.png'
import Map, { Source, Layer } from 'react-map-gl/maplibre'
import { useState, useEffect } from 'react'
import type { ParticipantType } from '../../types/ParticipantType'
import type { BatchType } from '../../types/BatchType'
import api from '../../services/api'
import endpoints from '../../services/endpoints'
import ParticipantCard from '../../components/ParticipantCard'
import BatchCard from '../../components/BatchCard'

const pontos = [
    { lat: -21.760445, lng: -43.349809 },
    { lat: -21.761319, lng: -43.349576 },
    { lat: -21.760708, lng: -43.346917 },
]

const trajeto = {
    type: 'Feature',
    properties: {},
    geometry: {
        type: 'LineString',
        coordinates: pontos.map((p) => [p.lng, p.lat]), // GeoJSON usa [lng, lat]
    },
}

function Home() {
    // participants
    const [participants, setParticipants] = useState<ParticipantType[]>([])
    const [loadingParticipants, setLoadingParticipants] = useState(true)
    const [participantSelected, setParticipantSelected] = useState<
        string | null
    >(null)
    const [participantError, setParticipantError] = useState(false)

    // batches
    const [batches, setBatches] = useState<BatchType[]>([])
    const [loadingBatches, setLoadingBatches] = useState(false)
    const [batchSelected, setBatchSelected] = useState<string | null>(null)
    const [batchError, setBatchError] = useState(false)


    const loadParticipants = () => {
        api.get<{ participants: ParticipantType[] }>(endpoints.GET_PARTICIPANTS)
            .then(({ data }) => {
                setParticipants(data.participants)
                setLoadingParticipants(false)
            })
            .catch((error) => {
                console.error('Error fetching participants:', error)
                setLoadingParticipants(false)
                setParticipantError(true)
            })
    }

    const loadBatches = (participantId: string) => {
        if (!participantId) return
        console.log('Participant clicked:', participantId)
            setBatchError(false)
            setLoadingBatches(true)
            api.get<{ batches: BatchType[] }>(endpoints.GET_BATCHES_BY_ID, {
                params: {
                    participantId: participantId,
                },
            })
                .then(({ data }) => {
                    setBatches(data.batches)
                    setLoadingBatches(false)
                })
                .catch((error) => {
                    console.error('Error fetching batches:', error)
                    setLoadingBatches(false)
                    setBatchError(true)
                })
    }


    useEffect(() => {
        loadParticipants()
    }, [])

    const retryParticipants = () => {
        setParticipantError(false)
        loadParticipants()
    }

    const handleParticipantClick = (participantId: string) => {
        if (
            !loadingBatches &&
            participantId !== participantSelected &&
            participantId != null
        ) {
            setParticipantSelected(participantId)
            loadBatches(participantId)
        }
    }

    const handleBatchClick = (batchId: string) => {
        console.log('Batch clicked:', batchId)
        setBatchSelected(batchId)
    }

    return (
        <>
            <Map
                initialViewState={{
                    longitude: pontos[0].lng,
                    latitude: pontos[0].lat,
                    zoom: 16,
                }}
                mapStyle="https://tiles.openfreemap.org/styles/liberty"
                style={{
                    position: 'fixed',
                    inset: 0,
                    width: '100%',
                    height: '100vh',
                }}
            >
                <Source id="trajeto" type="geojson" data={trajeto}>
                    <Layer
                        id="trajeto-linha"
                        type="line"
                        paint={{
                            'line-color': '#2563eb',
                            'line-width': 4,
                        }}
                    />
                </Source>
            </Map>
            <div
                className={[
                    styles.batch_list,
                    (participantSelected || loadingBatches) &&
                        styles.batch_list_open,
                ]
                    .filter(Boolean)
                    .join(' ')}
            >
                <h3>Coletas</h3>
                {loadingBatches ? (
                    <div className={styles.loading_no_batches}>
                        <p>Loading batches...</p>
                    </div>
                ) : batchError ? (
                    <div className={styles.loading_no_batches}>
                        <p>Erro ao carregar coletas</p>
                        <button onClick={() => loadBatches(participantSelected || '')}>Tentar novamente</button>
                    </div>
                ) : batches.length === 0 ? (
                    <div className={styles.loading_no_batches}>
                        <p>Nenhuma coleta realizada</p>
                    </div>
                ) : (
                    <div className={styles.participants_batch_container}>
                        {batches.map((b) => (
                            <BatchCard
                                key={b.id}
                                batch={b}
                                onClick={handleBatchClick}
                                isSelected={batchSelected === b.id}
                            />
                        ))}
                    </div>
                )}
            </div>
            <div
                className={[
                    styles.user_list,
                    participantSelected && styles.user_list_batch_open,
                ]
                    .filter(Boolean)
                    .join(' ')}
            >
                <div className={styles.header_nav}>
                    <img
                        src={logo}
                        alt="GetCollection"
                        width={90}
                        height={90}
                    />
                    <h1>GetCollection</h1>
                </div>
                {loadingParticipants ? (
                    <div className={styles.loading_no_batches}>
                        <p>Carregando usuários...</p>
                    </div>
                ) : participantError ? (
                    <div className={styles.loading_no_batches}>
                        <p>Erro ao carregar usuários</p>
                        <button onClick={retryParticipants}>Tentar novamente</button>
                    </div>
                ) : (
                    <div className={styles.participants_batch_container}>
                        <p className={styles.participants_title}>Usuários</p>
                        {participants.map((p) => (
                            <ParticipantCard
                                key={p.id}
                                participant={p}
                                onClick={handleParticipantClick}
                                isSelected={participantSelected === p.id}
                            />
                        ))}
                    </div>
                )}
            </div>
        </>
    )
}

export default Home
