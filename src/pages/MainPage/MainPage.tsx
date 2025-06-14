import Sidebar from './Sidebar'
import {Outlet} from "react-router-dom";

export default function MainLayout() {
    return (
        <div className="flex">
            <Sidebar />
            <section className="flex-1 p-6 overflow-y-auto bg-gray-100">
                <Outlet/>
            </section>
        </div>
    )
}
