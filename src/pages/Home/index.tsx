import styles from './Home.module.css'
import logo from '../../assets/logo.png'
import Map, { Source, Layer, type MapRef } from 'react-map-gl/maplibre'
import { useState, useEffect, useRef } from 'react'
import type { ParticipantType } from '../../types/ParticipantType'
import type { BatchType } from '../../types/BatchType'
import type { MeasurementType } from '../../types/MeasurementType'
import api from '../../services/api'
import {
    getEnvironment,
    getMeasurementsByBatchId,
} from '../../services/cachedApi'
import endpoints from '../../services/endpoints'
import ParticipantCard from '../../components/ParticipantCard'
import BatchCard from '../../components/BatchCard'

const defaultMorphology = [
    'Urbano denso (prédios altos)',
    'Urbano (prédios baixos)',
    'Suburbano residencial (casas, prédios baixos)',
    'Condomínio',
    'Vegetação densa',
    'Vegetação esparsa',
    "Espelho d'água",
    'Rural',
    'Campo aberto',
    'Indoor',
    'Shopping',
    'Estacionamento fechado',
    'Estádio ou campo esportivo',
    'Rodovia',
    'Estrada',
]

const environmentColors = [
    '#0000ff',
    '#dc143c',
    '#7fff00',
    '#ff7f50',
    '#9400d3',
    '#008000',
    '#800000',
    '#ff00ff',
    '#87ceeb',
    '#ffff00',
    '#dda0dd',
    '#191970',
    '#778899',
    '#808000',
    '#008080',
    '#4682b4',
    '#4b0082',
    '#000000',
    '#9370db',
    '#48d1cc',
    '#4169e1',
    '#ff6347',
]

const defaultEnvironmentColor = '#000000'

const getEnvironmentColor = (environment: string | null) => {
    const environmentIndex = environment
        ? defaultMorphology.indexOf(environment)
        : -1

    return environmentColors[environmentIndex] ?? defaultEnvironmentColor
}

const getMeasurementPoints = (
    measurements: MeasurementType[]
): { coordinates: [number, number]; morphology: string | null }[] =>
    measurements.flatMap((measurement) => {
        const location = measurement.location
        if (
            !location ||
            typeof location.longitude !== 'number' ||
            typeof location.latitude !== 'number'
        ) {
            return []
        }

        return [{
            coordinates: [location.longitude, location.latitude],
            morphology: measurement.morphology,
        }]
    })

const participantTests = ['031062e2-bed0-4cfa-a51a-d6ada6d3ccf5', '0ade6845-72e3-4b30-b0d5-5555436184a9', '19401b8e-28ad-4a8b-bb57-c9fa729d683a', '2591af81-4f39-4706-a5b5-d5f23a3a3452']

function Home() {
    const mapRef = useRef<MapRef>(null)

    // environments
    const [morphology, setMorphology] = useState<string[]>([])
    const [loadingMorphology, setLoadingMorphology] = useState(true)

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

    const measurementPoints = getMeasurementPoints(measurements)
    const locations = measurementPoints.map(({ coordinates }) => coordinates)

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
        features: measurementPoints.map(({ coordinates, morphology }, index) => ({
            type: 'Feature' as const,
            properties: {
                measurementIndex: index + 1,
                color: getEnvironmentColor(morphology),
            },
            geometry: {
                type: 'Point' as const,
                coordinates,
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
        getMeasurementsByBatchId(batchId)
            .then((data) => {
                setMeasurements(data)
                setLoadingMeasurements(false)
                console.log('Measurements loaded:', data)
            })
            .catch((error) => {
                console.error('Error fetching measurements:', error)
                setLoadingMeasurements(false)
            })
    }

    const loadMorphology = () => {
        getEnvironment()
            .then((data) => {
                setMorphology(data.morphology)
                setLoadingMorphology(false)
            })
            .catch((error) => {
                console.error('Error fetching environments:', error)
                setLoadingMorphology(false)
                setMorphology(defaultMorphology)
            })
    }

    useEffect(() => {
        loadParticipants()
        loadMorphology()
    }, [])

    useEffect(() => {
        const map = mapRef.current
        const locations = getMeasurementPoints(measurements).map(
            ({ coordinates }) => coordinates
        )
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
            { padding: 80, duration: 800 }
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
                    longitude: -43.369237,
                    latitude: -21.776114,
                    zoom: 15,
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
                            'line-color': '#696969',
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
                            'circle-color': ['get', 'color'],
                            'circle-stroke-color': '#ffffff',
                            'circle-stroke-width': 2,
                        }}
                    />
                </Source>
            </Map>
            <div className={styles.environment_list}>
                <h3>Ambientes</h3>
                {loadingMorphology ? (
                    <div className={styles.loading_no_batches}>
                        <p>Carregando ambientes...</p>
                    </div>
                ) : (
                    <div className={styles.morphology_container}>
                        {morphology.map((m) => (
                            <p key={m}>
                                <span
                                    className={styles.environment_color}
                                    style={{
                                        backgroundColor: getEnvironmentColor(m),
                                    }}
                                    aria-hidden="true"
                                />
                                {m}
                            </p>
                        ))}
                    </div>
                )}
            </div>
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
                        {participants.map((p) => {
                            if (!participantTests.includes(p.id)) {
                                return (
                                    <ParticipantCard
                                        key={p.id}
                                        participant={p}
                                        onClick={handleParticipantClick}
                                        isSelected={participantSelected === p.id}
                                    />
                                )
                            }
})}
                    </div>
                )}
            </div>
        </>
    )
}

export default Home
