interface QRPaymentProps {
  qrUrl: string | null;
  amount?: number;
  orderName?: string;
}

export default function QRPayment({ qrUrl, amount, orderName }: QRPaymentProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-6">
      {qrUrl && (
        <div className="bg-white rounded-3xl p-8 shadow-2xl">
          <img
            src={qrUrl}
            alt="Payment QR Code"
            className="w-[300px] h-[300px]"
          />
        </div>
      )}
      {amount !== undefined && (
        <div className="text-4xl font-bold text-emerald-400">
          {amount.toLocaleString('ko-KR')}원
        </div>
      )}
      {orderName && (
        <div className="text-2xl text-white font-semibold">{orderName}</div>
      )}
    </div>
  );
}
