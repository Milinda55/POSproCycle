import React, { useState } from 'react';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import QrScanner from '../components/pos/QrScanner.tsx';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import CartItem from '../components/pos/CartItem.tsx';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import BillReceipt from '../components/pos/BillReceipt.tsx';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import { db } from '../db';

// Define types
interface Item {
    id: string;
    name: string;
    price: number;
    discount: number;
}

const POS: React.FC = () => {
    const [cart, setCart] = useState<Item[]>([]);

    const handleScan = (data: string | null) => {
        if (data) {
            db.inventory.findOne(data).exec().then((item: Omit<Item, 'discount'>) => {
                if (item) {
                    setCart(prev => [...prev, { ...item, discount: 0 }]);
                }
            });
        }
    };

    // Calculate totals
    const subtotal = cart.reduce((sum, item) => sum + item.price, 0);
    const totalDiscount = cart.reduce((sum, item) => sum + item.discount, 0);

    return (
        <div>
            <QrScanner onScan={handleScan} />
            {cart.map((item) => (
                <CartItem key={item.id} item={item} />
            ))}
            <BillReceipt subtotal={subtotal} discount={totalDiscount} />
        </div>
    );
};

export default POS;
