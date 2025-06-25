import { useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { products } from "@/db/dummyData/Stock";

interface BillingItem {
    id: number;
    name: string;
    price: number;
    quantity: number;
    total: number;
}

export function BillingPage() {
    const [search, setSearch] = useState("");
    const [billingItems, setBillingItems] = useState<BillingItem[]>([]);
    const [discount, setDiscount] = useState(0);
    const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage");

    // Filter products based on search
    const filteredProducts = products.filter((product) =>
        product.name.en.toLowerCase().includes(search.toLowerCase()) ||
        product.barcode.includes(search)
    );

    // Add product to billing table
    const addToBill = (product: typeof products[0]) => {
        // @ts-ignore
        setBillingItems(prev => {
            const existingItem = prev.find(item => item.id === product.id);
            if (existingItem) {
                // @ts-ignore
                return prev.map(item =>
                    item.id === product.id
                        ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.price }
                        : item
                );
            } else {
                return [
                    ...prev,
                    {
                        id: product.id,
                        name: product.name.en,
                        price: product.price,
                        quantity: 1,
                        total: product.price
                    }
                ];
            }
        });
    };

    // Update quantity in billing table
    const updateQuantity = (id: number, newQuantity: number) => {
        if (newQuantity < 1) return;

        setBillingItems(prev =>
            prev.map(item =>
                item.id === id
                    ? { ...item, quantity: newQuantity, total: newQuantity * item.price }
                    : item
            )
        );
    };

    // Remove item from billing table
    const removeItem = (id: number) => {
        setBillingItems(prev => prev.filter(item => item.id !== id));
    };

    // Calculate subtotal
    const subtotal = billingItems.reduce((sum, item) => sum + item.total, 0);

    // Calculate discount amount
    const discountAmount = discountType === "percentage"
        ? subtotal * (discount / 100)
        : discount;

    // Calculate total
    const total = subtotal - discountAmount;

    // Print bill
    const printBill = () => {
        const printWindow = window.open("", "_blank");
        if (!printWindow) return;

        const printContent = `
      <html>
        <head>
          <title>Bill Receipt</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { text-align: center; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .total-row { font-weight: bold; }
            .right { text-align: right; }
          </style>
        </head>
        <body>
          <h1>Invoice</h1>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Price</th>
                <th>Qty</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${billingItems.map(item => `
                <tr>
                  <td>${item.name}</td>
                  <td>Rs. ${item.price.toFixed(2)}</td>
                  <td>${item.quantity}</td>
                  <td>Rs. ${item.total.toFixed(2)}</td>
                </tr>
              `).join("")}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="3" class="right">Subtotal:</td>
                <td>Rs. ${subtotal.toFixed(2)}</td>
              </tr>
              <tr>
                <td colspan="3" class="right">Discount:</td>
                <td>Rs. ${discountAmount.toFixed(2)}</td>
              </tr>
              <tr class="total-row">
                <td colspan="3" class="right">Total:</td>
                <td>Rs. ${total.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
          <p>Thank you for your purchase!</p>
        </body>
      </html>
    `;

        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 500);
    };

    return (
        <div className="p-6 space-y-6">
            {/* Product Selection Table (Top Half) */}
            <div className="bg-white shadow-md rounded-lg p-6">
                <h2 className="text-2xl font-bold text-indigo-800 mb-4">Products</h2>
                <div className="mb-4">
                    <Input
                        type="text"
                        placeholder="Search products..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full sm:w-80 border-indigo-300 focus-visible:ring-indigo-500"
                    />
                </div>

                <div className="overflow-y-auto max-h-[40vh]">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-indigo-100">
                                <TableHead>ID</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Price (LKR)</TableHead>
                                <TableHead>Stock</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredProducts.map((product) => (
                                <TableRow key={product.id} className="hover:bg-indigo-50 transition">
                                    <TableCell className="font-medium">{product.id}</TableCell>
                                    <TableCell>{product.name.en}</TableCell>
                                    <TableCell>Rs. {product.price.toFixed(2)}</TableCell>
                                    <TableCell>{product.stock.store1}</TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            onClick={() => addToBill(product)}
                                            className="bg-green-600 hover:bg-green-700"
                                        >
                                            Add
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Billing Table (Bottom Half) */}
            <div className="bg-white shadow-md rounded-lg p-6">
                <h2 className="text-2xl font-bold text-indigo-800 mb-4">Bill</h2>

                <div className="overflow-y-auto max-h-[40vh] mb-6">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-indigo-100">
                                <TableHead>Item</TableHead>
                                <TableHead>Price</TableHead>
                                <TableHead>Qty</TableHead>
                                <TableHead>Total</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {billingItems.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                                        No items added to bill
                                    </TableCell>
                                </TableRow>
                            ) : (
                                billingItems.map((item) => (
                                    <TableRow key={item.id} className="hover:bg-indigo-50 transition">
                                        <TableCell>{item.name}</TableCell>
                                        <TableCell>Rs. {item.price.toFixed(2)}</TableCell>
                                        <TableCell>
                                            <Input
                                                type="number"
                                                min="1"
                                                value={item.quantity}
                                                onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                                                className="w-20"
                                            />
                                        </TableCell>
                                        <TableCell>Rs. {item.total.toFixed(2)}</TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => removeItem(item.id)}
                                            >
                                                Remove
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Discount and Total Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="space-y-4">
                        <h3 className="font-medium">Discount</h3>
                        <div className="flex items-center gap-4">
                            <div className="flex-1">
                                <Input
                                    type="number"
                                    min="0"
                                    value={discount}
                                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                                    placeholder="Discount value"
                                />
                            </div>
                            <select
                                value={discountType}
                                onChange={(e) => setDiscountType(e.target.value as "percentage" | "fixed")}
                                className="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="percentage">%</option>
                                <option value="fixed">Fixed Amount</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <span>Subtotal:</span>
                            <span className="font-medium">Rs. {subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Discount:</span>
                            <span className="font-medium text-red-600">
                - Rs. {discountAmount.toFixed(2)}
              </span>
                        </div>
                        <div className="flex justify-between border-t pt-2">
                            <span className="font-bold">Total:</span>
                            <span className="font-bold text-lg">Rs. {total.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* Print Button */}
                <div className="flex justify-end">
                    <Button
                        onClick={printBill}
                        disabled={billingItems.length === 0}
                        className="bg-indigo-600 hover:bg-indigo-700 px-8 py-4 text-lg"
                    >
                        Print Bill
                    </Button>
                </div>
            </div>
        </div>
    );
}