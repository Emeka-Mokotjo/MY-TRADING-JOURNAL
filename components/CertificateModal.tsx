"use client";

import React, { useRef } from "react";
import { Button } from "@/components/ui/button";
import { X, Download, Printer } from "lucide-react";
import { CertificateTemplate } from "@/components/CertificateTemplate";

interface CertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  fullName: string;
  certificateId: string;
  issuedDate: string;
  accountName?: string;
}

export function CertificateModal({
  isOpen,
  onClose,
  title,
  description,
  fullName,
  certificateId,
  issuedDate,
  accountName,
}: CertificateModalProps) {
  const certificateRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printWindow = window.open("", "", "width=1200,height=800");
    if (printWindow && certificateRef.current) {
      // Create a printable version
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Certificate - ${certificateId}</title>
            <style>
              body {
                margin: 0;
                padding: 20px;
                background: white;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              }
              @media print {
                body { margin: 0; padding: 0; }
              }
            </style>
          </head>
          <body>
            ${certificateRef.current.innerHTML}
          </body>
        </html>
      `;
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
  };

  const handleDownloadPNG = async () => {
    if (!certificateRef.current) return;

    try {
      // Dynamically import html2canvas
      const html2canvas = (await import("html2canvas")).default;

      const canvas = await html2canvas(certificateRef.current, {
        backgroundColor: "#ffffff",
        scale: 2,
      });

      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = `Certificate-${certificateId}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error downloading certificate:", error);
      // Fallback: Just print
      handlePrint();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="relative z-50 bg-card border border-border rounded-xl shadow-2xl max-w-5xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between p-6 border-b border-border bg-card/80 backdrop-blur-md">
          <h2 className="text-xl font-bold text-foreground">
            Certificate Preview
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Certificate Content */}
        <div className="p-8 bg-gradient-to-b from-gray-900 to-black min-h-full">
          <div
            ref={certificateRef}
            className="max-w-4xl mx-auto"
          >
            <CertificateTemplate
              title={title}
              description={description}
              fullName={fullName}
              certificateId={certificateId}
              issuedDate={issuedDate}
              accountName={accountName}
              isPrintMode={true}
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 flex gap-3 p-6 border-t border-border bg-card/80 backdrop-blur-md">
          <Button
            onClick={handlePrint}
            variant="outline"
            className="flex-1 gap-2"
          >
            <Printer className="h-4 w-4" />
            Print Certificate
          </Button>
          <Button
            onClick={handleDownloadPNG}
            className="flex-1 gap-2 bg-amber-600 hover:bg-amber-700"
          >
            <Download className="h-4 w-4" />
            Download Image
          </Button>
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
