import { type Zip321Request } from "../types/api";

interface Zip321QRProps {
  request: Zip321Request;
}

export function Zip321QR({ request }: Zip321QRProps) {
  // For now, display the URI as text. QR code rendering will be added
  // when a QR library is integrated (e.g., qrcode.react).
  return (
    <div className="text-center space-y-4">
      <p className="text-sm text-gray-500">
        Scan this payment request with your Zcash wallet:
      </p>
      <div className="bg-gray-50 p-4 rounded-md break-all font-mono text-sm">
        {request}
      </div>
    </div>
  );
}
