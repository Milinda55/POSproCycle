import { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';

type CartItem = {
    id: string;
    name: string;
    price: number;
    quantity: number;
    discount: number;
};

interface BillReceiptProps {
    cart: CartItem[];
}

export default function BillReceipt({ cart }: BillReceiptProps) {
    const printRef = useRef<HTMLDivElement>(null);
    useReactToPrint({
        pageStyle: `
      @media print {
        body { font-family: 'ESC/POS'; font-size: 12px; }
      }
    `,
    });
    return (
        <div ref={printRef}>
            {/* Thermal printer-friendly layout */}
            <h3>Receipt</h3>
            <ul>
                {cart.map((item) => (
                    <li key={item.id}>
                        {item.name} x{item.quantity} - ${(item.price - item.discount).toFixed(2)}
                    </li>
                ))}
            </ul>
        </div>
    );
}
