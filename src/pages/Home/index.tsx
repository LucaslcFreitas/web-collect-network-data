import styles from './Home.module.css'
import logo from '../../assets/logo.png'
import Map, { Source, Layer, type MapRef } from 'react-map-gl/maplibre'
import { useState, useEffect, useRef } from 'react'
import type { ParticipantType } from '../../types/ParticipantType'
import type { BatchType } from '../../types/BatchType'
import type { MeasurementType } from '../../types/MeasurementType'
import api from '../../services/api'
import endpoints from '../../services/endpoints'
import ParticipantCard from '../../components/ParticipantCard'
import BatchCard from '../../components/BatchCard'

const getMeasurementLocations = (
    measurements: MeasurementType[],
): [number, number][] =>
    measurements.flatMap((measurement) => {
        const location = measurement.location
        if (
            !location ||
            typeof location.longitude !== 'number' ||
            typeof location.latitude !== 'number'
        ) {
            return []
        }

        return [[location.longitude, location.latitude]]
    })

function Home() {
    const mapRef = useRef<MapRef>(null)

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

    // measurements
    const [measurements, setMeasurements] = useState<MeasurementType[]>([])
    const [loadingMeasurements, setLoadingMeasurements] = useState(false)

    const locations = getMeasurementLocations(measurements)

    const trajeto = {
        type: 'Feature' as const,
        properties: {},
        geometry: {
            type: 'LineString' as const,
            coordinates: locations,
        },
    }

    const pontosDoTrajeto = {
        type: 'FeatureCollection' as const,
        features: locations.map(([longitude, latitude], index) => ({
            type: 'Feature' as const,
            properties: { measurementIndex: index + 1 },
            geometry: {
                type: 'Point' as const,
                coordinates: [longitude, latitude],
            },
        })),
    }

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

    const loadMeasurements = (batchId: string) => {
        if (!batchId) return
        setMeasurements([])
        setLoadingMeasurements(true)
        api.get<{ measurements: MeasurementType[] }>(endpoints.GET_MEASUREMENTS_BY_ID, {
            params: {
                batchId: batchId,
            },
        })
            .then(({ data }) => {
                setMeasurements(data.measurements)
                setLoadingMeasurements(false)
                console.log('Measurements loaded:', data.measurements)
            })
            .catch((error) => {
                console.error('Error fetching measurements:', error)
                setLoadingMeasurements(false)
            })
    }

    useEffect(() => {
        loadParticipants()
    }, [])

    useEffect(() => {
        const map = mapRef.current
        const locations = getMeasurementLocations(measurements)
        if (!map || locations.length === 0) return

        if (locations.length === 1) {
            map.flyTo({
                center: locations[0],
                zoom: 16,
            })
            return
        }

        const longitudes = locations.map(([longitude]) => longitude)
        const latitudes = locations.map(([, latitude]) => latitude)

        map.fitBounds(
            [
                [Math.min(...longitudes), Math.min(...latitudes)],
                [Math.max(...longitudes), Math.max(...latitudes)],
            ],
            { padding: 80, duration: 800 },
        )
    }, [measurements])

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
        if (
            !loadingMeasurements &&
            batchId !== batchSelected &&
            batchId != null
        ) {
            setBatchSelected(batchId)
            loadMeasurements(batchId)
        }
    }

    return (
        <>
            <Map
                ref={mapRef}
                initialViewState={{
                    longitude: 0,
                    latitude: 0,
                    zoom: 2,
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
                <Source
                    id="pontos-do-trajeto"
                    type="geojson"
                    data={pontosDoTrajeto}
                >
                    <Layer
                        id="trajeto-pontos"
                        type="circle"
                        paint={{
                            'circle-radius': 6,
                            'circle-color': '#1d4ed8',
                            'circle-stroke-color': '#ffffff',
                            'circle-stroke-width': 2,
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
                        <button
                            onClick={() =>
                                loadBatches(participantSelected || '')
                            }
                        >
                            Tentar novamente
                        </button>
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
                        <button onClick={retryParticipants}>
                            Tentar novamente
                        </button>
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
