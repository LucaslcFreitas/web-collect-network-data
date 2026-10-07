import styles from './Home.module.css'

function Home() {
    return (
        <div className={styles.home_container}>
            <h1>Welcome to the Home Page</h1>
            <p>This is the home page of our application.</p>
        </div>
    )
}

export default Home