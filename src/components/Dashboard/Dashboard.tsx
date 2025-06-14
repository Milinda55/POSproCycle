import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import {products} from "@/db/dummyData/Stock.ts";

// interface DashboardProps {
//     products: products;
// }

export function Dashboard() {
    // Calculate dashboard metrics
    const totalProducts = products.length;

    // Mock data for today's sales (in a real app, this would come from your backend)
    const todaySelling = Math.floor(Math.random() * 50) + 20;
    const todayProfit = (Math.random() * 500 + 200).toFixed(2);

    // Calculate low stock items (stock < minStock in any store)
    const lowStockItems = products.filter(product => {
        return (
            (product.stock.store1 < product.minStock) ||
            (product.stock.store2 < product.minStock)
        );
    }).length;

    // Function to generate PDF (mock implementation)
    const downloadInventoryPDF = () => {
        // In a real app, this would generate or fetch a PDF
        alert("Inventory PDF download started!");
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">Inventory Dashboard</h1>
                <Button
                    onClick={downloadInventoryPDF}
                    className="bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 text-white"
                >
                    <Download className="mr-2 h-4 w-4" />
                    Download Inventory PDF
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {/* Total Products Card */}
                <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-blue-600">
                            Total Products
                        </CardTitle>
                        <div className="h-4 w-4 rounded-full bg-blue-200"></div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-blue-800">{totalProducts}</div>
                        <p className="text-xs text-blue-500 mt-1">All products in inventory</p>
                    </CardContent>
                </Card>

                {/* Today's Selling Card */}
                <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-green-600">
                            Today's Selling
                        </CardTitle>
                        <div className="h-4 w-4 rounded-full bg-green-200"></div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-green-800">{todaySelling}</div>
                        <p className="text-xs text-green-500 mt-1">Items sold today</p>
                    </CardContent>
                </Card>

                {/* Today's Profit Card */}
                <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-purple-600">
                            Today's Profit
                        </CardTitle>
                        <div className="h-4 w-4 rounded-full bg-purple-200"></div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-purple-800">${todayProfit}</div>
                        <p className="text-xs text-purple-500 mt-1">Profit earned today</p>
                    </CardContent>
                </Card>

                {/* Low Stock Items Card */}
                <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-orange-600">
                            Low Stock Items
                        </CardTitle>
                        <div className="h-4 w-4 rounded-full bg-orange-200"></div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-orange-800">{lowStockItems}</div>
                        <p className="text-xs text-orange-500 mt-1">Items need restocking</p>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Activity Section */}
            <Card className="border-0 shadow-lg">
                <CardHeader>
                    <CardTitle className="text-xl font-semibold text-gray-800">
                        Recent Inventory Activity
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {products.slice(0, 5).map((product) => (
                            <div key={product.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                                <div className="flex items-center space-x-4">
                                    <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="24"
                                            height="24"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            className="h-5 w-5"
                                        >
                                            <path d="m7.5 4.27 9 5.15"></path>
                                            <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"></path>
                                            <path d="m3.3 7 8.7 5 8.7-5"></path>
                                            <path d="M12 22V12"></path>
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-gray-800">{product.name.en}</h3>
                                        <p className="text-sm text-gray-500">Updated: {product.updatedAt}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-medium">${product.price}</p>
                                    <p className="text-sm text-gray-500">
                                        Stock: {product.stock.store1 + product.stock.store2}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}