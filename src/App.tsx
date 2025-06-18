import './App.css'
// For testing only - remove later
import { initDB } from './db/initDB.ts';
(window as any).initDB = initDB;

import { SyncManager } from './db/sync.ts';
(window as any).SyncManager = SyncManager;

function App() {

  return (

    <>
      <h1 className="text-3xl bg-amber-200">Hello POS</h1>
    </>
  )
}

export default App
