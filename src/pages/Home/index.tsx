import styles from './Home.module.css'
import logo from '../../assets/logo.png'
import Map, { Source, Layer } from 'react-map-gl/maplibre'
import { useState, useEffect } from 'react'
import type { ParticipantType } from '../../types/ParticipantType'
import api from '../../services/api'
import endpoints from '../../services/endpoints'

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
    const [participants, setParticipants] = useState<ParticipantType[]>([])
    const [loadingParticipants, setLoadingParticipants] = useState(true)

    useEffect(() => {
        api.get<{participants: ParticipantType[]}>(endpoints.GET_PARTICIPANTS)
            .then(({ data }) => {
                setParticipants(data.participants)
                setLoadingParticipants(false)
            })
            .catch((error) => {
                console.error('Error fetching participants:', error)
                setLoadingParticipants(false)
            })
    }, [])


    return (
        <>
            <Map
                initialViewState={{
                    longitude: pontos[0].lng,
                    latitude: pontos[0].lat,
                    zoom: 16,
                }}
                mapStyle="https://tiles.openfreemap.org/styles/liberty"
                style={{ width: '100%', height: '100vh' }}
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
            <div className={styles.user_list}>
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
                    <p>Loading participants...</p>
                ) : (
                    <ul>
                        {participants.map((p) => (
                            <li key={p.id}>{p.id}</li>
                        ))}
                    </ul>
                )}
            </div>
        </>
    )
}

export default Home
