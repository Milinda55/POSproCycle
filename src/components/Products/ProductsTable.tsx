import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table.tsx"
import { Input } from "@/components/ui/input.tsx"
import { useState } from "react"
import {Checkbox} from "@radix-ui/react-checkbox";
import {products} from "@/db/dummyData/Stock.ts";
import "./ProductTable.css";


function LowStockBadge() {
    return (
        <span className="inline-block px-2 py-0.5 text-xs font-medium text-red-800 bg-red-200 rounded-full">
      Low Stock
    </span>
    );
}

export function ProductsTable() {
    const [search, setSearch] = useState("");
    const [showLowStockOnly, setShowLowStockOnly] = useState(false);

    const filteredProducts = products.filter((product) => {
        const matchesSearch =
            product.name.en.toLowerCase().includes(search.toLowerCase()) ||
            product.barcode.includes(search);
        const isLowStock = product.stock.store1 < product.minStock;
        return matchesSearch && (!showLowStockOnly || isLowStock);
    });

    return (
        <div className="space-y-6 p-6 bg-white shadow-md rounded-lg">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h2 className="text-2xl font-bold text-indigo-800">Product Inventory</h2>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
                    <Input
                        type="text"
                        placeholder="Search by name or barcode..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full sm:w-80 border-indigo-300 focus-visible:ring-indigo-500"
                    />

                    <div className="flex items-center gap-2">
                        <Checkbox
                            id="low-stock-filter"
                            checked={showLowStockOnly}
                            onCheckedChange={(checked) => setShowLowStockOnly(!!checked)}
                        />
                        <label htmlFor="low-stock-filter" className="text-sm text-gray-700">
                            Show low stock only
                        </label>
                    </div>
                </div>
            </div>

            <div className="overflow-y-auto max-h-[85vh]" >
                <Table className="text-lg">
                    <TableCaption className="text-gray-500 italic mt-2">
                        {filteredProducts.length === 0
                            ? "No products found."
                            : "List of available products."}
                    </TableCaption>

                    <TableHeader >
                        <TableRow className="bg-indigo-100">
                            <TableHead>ID</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Barcode</TableHead>
                            <TableHead className="text-right">Price (LKR)</TableHead>
                            <TableHead className="text-right">Cost (LKR)</TableHead>
                            <TableHead className="text-center">Stock (Store 1)</TableHead>
                            <TableHead className="text-center">Min Stock</TableHead>
                            <TableHead>Supplier</TableHead>
                            <TableHead className="text-center">Status</TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {filteredProducts.map((product) => {
                            const isLowStock = product.stock.store1 < product.minStock;
                            return (
                                <TableRow key={product.id} className="hover:bg-indigo-50 transition">
                                    <TableCell className="font-medium">{product.id}</TableCell>
                                    <TableCell>{product.name.en}</TableCell>
                                    <TableCell>{product.name.si}</TableCell>
                                    <TableCell>{product.category}</TableCell>
                                    <TableCell>{product.barcode}</TableCell>
                                    <TableCell className="text-right">Rs. {product.price.toFixed(2)}</TableCell>
                                    <TableCell className="text-right">RS. {product.cost.toFixed(2)}</TableCell>
                                    <TableCell className="text-center">{product.stock.store1}</TableCell>
                                    <TableCell className="text-center">{product.minStock}</TableCell>
                                    <TableCell>{product.supplier}</TableCell>
                                    <TableCell className="text-center">
                                        {isLowStock ? <LowStockBadge /> : null}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>

                    {filteredProducts.length > 0 && (
                        <TableFooter>
                            <TableRow>
                                <TableCell colSpan={4}>Total Products</TableCell>
                                <TableCell colSpan={7} className="text-right font-semibold">
                                    {filteredProducts.length}
                                </TableCell>
                            </TableRow>
                        </TableFooter>
                    )}
                </Table>
            </div>

        </div>
    );
}
