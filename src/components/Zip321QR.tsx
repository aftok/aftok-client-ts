import { QRCodeSVG } from "qrcode.react";
import { type Zip321Request } from "../types/api";

interface Zip321QRProps {
  request: Zip321Request;
}

export function Zip321QR({ request }: Zip321QRProps) {
  return (
    <div className="text-center space-y-4">
      <p className="text-sm text-gray-500">
        Scan this payment request with your Zcash wallet:
      </p>
      <div className="flex justify-center">
        <QRCodeSVG value={request} size={512} level="L" />
      </div>
      <div className="bg-gray-50 p-4 rounded-md break-all font-mono text-xs text-gray-600">
        {request}
      </div>
    </div>
  );
}
