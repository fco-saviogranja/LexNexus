"use client";

import { Document, Page, pdfjs } from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

type PdfDocumentViewerProps = {
  assetUrl: string;
  page: number;
  onLoadSuccess: (numPages: number) => void;
};

export function PdfDocumentViewer({ assetUrl, page, onLoadSuccess }: PdfDocumentViewerProps) {
  return (
    <Document file={assetUrl} onLoadSuccess={({ numPages }) => onLoadSuccess(numPages)}>
      <Page pageNumber={page} width={780} />
    </Document>
  );
}
