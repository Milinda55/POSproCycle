import './App.css'
// For testing only - remove later
import { initDB } from './db/initDB.ts';
(window as any).initDB = initDB;

import { SyncManager } from './db/sync.ts';
import {useEffect} from "react";
import {initTestingHelpers} from "./utils/testingHelpers.ts";
(window as any).SyncManager = SyncManager;

function App() {

    useEffect(() => {
        if (process.env.NODE_ENV === 'development') {
            initTestingHelpers();
        }
    }, []);

  return (

    <>
      <h1 className="text-3xl bg-amber-200">Hello POS</h1>
    </>
  )
}

export default App
