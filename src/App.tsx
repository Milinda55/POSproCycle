import './App.css'
import { useEffect, useState } from 'react';
import LoginPage from "@/pages/Login/LoginPage.tsx";
import {createBrowserRouter, RouterProvider} from "react-router-dom";
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

    const route = createBrowserRouter([
        {
            path: "/",
            element:<LoginPage/>
        },
        {
            path:"/harigala",
            element:<h1>Harigala Branch</h1>
        },
        {
            path:"/boyagama",
            element:<h1>Boyagama Branch</h1>
        },
    ]);

    return (
        <div>
            {installPrompt && (
                <button onClick={handleInstallClick}>Install App</button>
            )}
            <RouterProvider router={route}/>
        </div>
    );
}

export default App
