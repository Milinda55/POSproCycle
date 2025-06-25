
import { Input } from "@/components/ui/input.tsx"
import { useState } from "react"
import {products} from "@/db/dummyData/Stock.ts";
import {Button} from "@/components/ui/button.tsx";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


interface UpdateProductModalProps {
    product: typeof products[0];
    onSave: (updatedProduct: typeof products[0]) => void;
}

function UpdateProductModal({ product, onSave }: UpdateProductModalProps) {
    const [open, setOpen] = useState(false);
    const [formData, setFormData] = useState({ ...product });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'price' || name === 'cost' ? parseFloat(value) : value
        }));
    };

    const handleStockChange = (store: 'store1' | 'store2', value: string) => {
        setFormData(prev => ({
            ...prev,
            stock: {
                ...prev.stock,
                [store]: parseInt(value) || 0
            }
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-blue-500 hover:bg-blue-600">Update</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Update Product: {product.name.en}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name.en">English Name</Label>
                            <Input
                                id="name.en"
                                name="name.en"
                                value={formData.name.en}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="name.si">Sinhala Name</Label>
                            <Input
                                id="name.si"
                                name="name.si"
                                value={formData.name.si}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="price">Price (LKR)</Label>
                            <Input
                                id="price"
                                name="price"
                                type="number"
                                step="0.01"
                                value={formData.price}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="cost">Cost (LKR)</Label>
                            <Input
                                id="cost"
                                name="cost"
                                type="number"
                                step="0.01"
                                value={formData.cost}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="minStock">Min Stock</Label>
                            <Input
                                id="minStock"
                                name="minStock"
                                type="number"
                                value={formData.minStock}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Store 1 Stock</Label>
                            <Input
                                type="number"
                                value={formData.stock.store1}
                                onChange={(e) => handleStockChange('store1', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Store 2 Stock</Label>
                            <Input
                                type="number"
                                value={formData.stock.store2}
                                onChange={(e) => handleStockChange('store2', e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Select
                            value={formData.category}
                            onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Electronics">Electronics</SelectItem>
                                <SelectItem value="Clothing">Clothing</SelectItem>
                                <SelectItem value="Groceries">Groceries</SelectItem>
                                <SelectItem value="Pharmacy">Pharmacy</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex justify-end gap-2 mt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" className="bg-blue-500 hover:bg-blue-600">
                            Save Changes
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export default UpdateProductModal;