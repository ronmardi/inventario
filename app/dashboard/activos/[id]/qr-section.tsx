"use client";

import { QRCodeSVG } from "qrcode.react";

interface QRSectionProps {
  assetTag: string;
  assetName: string;
  serialNumber: string | null;
  companyName: string;
}

export default function QRSection({
  assetTag,
  assetName,
  serialNumber,
  companyName,
}: QRSectionProps) {
  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <>
      {/* Etiqueta imprimible (@media print) */}
      <div className="hidden print:flex print:flex-col print:items-center print:justify-center print:p-8 print:bg-white text-black font-sans text-center max-w-xs mx-auto border-2 border-black rounded-xl p-4 my-8">
        <p className="font-extrabold text-lg uppercase tracking-wider truncate border-b-2 border-black pb-1 mb-2 w-full">
          {companyName}
        </p>
        <div className="my-3 flex justify-center">
          <QRCodeSVG value={assetTag} size={180} level="M" />
        </div>
        <p className="font-mono font-black text-2xl text-black">{assetTag}</p>
        <p className="text-xs font-bold text-gray-700 mt-1 uppercase">{assetName}</p>
        {serialNumber && (
          <p className="text-[10px] font-mono text-gray-500">S/N: {serialNumber}</p>
        )}
      </div>

      {/* Tarjeta QR en Pantalla */}
      <div className="p-6 bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl rounded-3xl border border-white/60 dark:border-gray-700/50 shadow-[0_8px_32px_0_rgba(31,38,135,0.1)] flex flex-col items-center text-center h-fit">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          Código QR de Activo
        </h2>
        
        <div className="p-4 bg-white rounded-2xl shadow-inner border border-gray-200/80 mb-4 inline-flex justify-center items-center">
          <QRCodeSVG value={assetTag} size={192} level="H" />
        </div>

        <p className="font-mono font-black text-2xl text-blue-600 dark:text-blue-400 mb-1">
          {assetTag}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
          Escanea esta etiqueta para consultar auditoría o historial.
        </p>

        <button
          onClick={handlePrint}
          className="w-full inline-flex items-center justify-center px-4 py-2.5 rounded-xl font-bold text-sm text-white bg-blue-600/90 hover:bg-blue-600 shadow-md shadow-blue-500/20 backdrop-blur-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <PrinterIcon className="w-5 h-5 mr-2" />
          Imprimir Etiqueta
        </button>
      </div>
    </>
  );
}

function PrinterIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m11.318-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231a1.125 1.125 0 01-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-19.126 0C1.008 7.441.25 8.375.25 9.456v6.294A2.25 2.25 0 002.5 18h1.091" />
    </svg>
  );
}