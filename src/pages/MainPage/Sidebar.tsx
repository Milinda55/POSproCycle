import {
    LayoutDashboard,
    Warehouse,
    FileText,
    Users,
    ShoppingCart,
    Settings,
    Info,
    LogOut,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'

const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, to: '/dashboard' },
    { label: 'Ware House', icon: Warehouse, to: '/warehouse' },
    { label: 'Invoices', icon: FileText, to: '/invoices' },
    { label: 'Employees', icon: Users, to: '/employees' },
    { label: 'Sale Screen', icon: ShoppingCart, to: '/sales' },
    { label: 'Settings', icon: Settings, to: '/settings' },
    { label: 'About', icon: Info, to: '/about' },
]

export default function Sidebar() {
    return (
        <aside className="h-screen w-72 bg-gradient-to-b from-indigo-900 to-indigo-700 text-white shadow-xl flex flex-col justify-between">
            <div>
                <div className="p-6 border-b border-indigo-600">
                    <h1 className="text-3xl font-bold tracking-wide">
                        INNOVATIVE <span className="text-orange-400">POS</span>
                    </h1>
                </div>
                <nav className="mt-6 flex flex-col gap-3">
                    {navItems.map((item) => {
                        const Icon = item.icon
                        return (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                className={({ isActive }) =>
                                    cn(
                                        'flex items-center gap-5 px-6 py-6 text-2xl font-semibold rounded-md transition-colors hover:bg-indigo-600',
                                        isActive && 'bg-indigo-800'
                                    )
                                }
                            >
                                <Icon className="w-12 h-12" />
                                {item.label}
                            </NavLink>
                        )
                    })}
                </nav>
            </div>
            <div className="p-6 border-t border-indigo-600">
                <Button
                    variant="ghost"
                    className="w-full text-white text-2xl py-6 justify-start hover:bg-indigo-600"
                >
                    <LogOut className="mr-4 h-12 w-12" />
                    Exit
                </Button>
                <p className="text-sm mt-4 text-gray-300">
                    © {new Date().getFullYear()} Muzammil Ijaz
                </p>
            </div>
        </aside>
    )
}
