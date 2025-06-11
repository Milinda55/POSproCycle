import './App.css'
// import { initDB } from './db/initDB';
// import { setupReplication } from './db/sync';

// const db = await initDB();
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
setupReplication(db.products);

function App() {

  return (
    <>
      <h1 className="text-3xl bg-amber-200">Hello POS</h1>
    </>
  )
}

export default App
