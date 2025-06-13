import './App.css'
import { useEffect, useState } from 'react';
import { Button } from './components/ui/button';
// import { initDB } from './db/initDB';
// import { setupReplication } from './db/sync';

// const db = await initDB();
// // eslint-disable-next-line @typescript-eslint/ban-ts-comment
// // @ts-expect-error
// setupReplication(db.products);

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(
            (registration) => {
                console.log('ServiceWorker registration successful'+ registration)
            },
            (err) => {
                console.log('ServiceWorker registration failed: ', err)
            }
        )
    })
}


function App() {

    const [installPrompt, setInstallPrompt] = useState<Event | null>(null);

    useEffect(() => {
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setInstallPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    }, []);

    const handleInstallClick = () => {
        if (installPrompt) {
            (installPrompt as any).prompt(); // TypeScript workaround
        }
    };

    return (
        <div>
            {installPrompt && (
                <button onClick={handleInstallClick}>Install App</button>
            )}
            <Button>Click Me</Button>
        </div>
    );
}

export default App
