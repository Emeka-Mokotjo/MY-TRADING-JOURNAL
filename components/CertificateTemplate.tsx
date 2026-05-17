"use client";

import React from "react";

interface CertificateTemplateProps {
  title: string;
  description: string;
  fullName: string;
  certificateId: string;
  issuedDate: string;
  accountName?: string;
  isPrintMode?: boolean;
}

export function CertificateTemplate({
  title,
  description,
  fullName,
  certificateId,
  issuedDate,
  accountName,
  isPrintMode = false,
}: CertificateTemplateProps) {
  const formattedDate = new Date(issuedDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div
      className={`w-full flex items-center justify-center ${
        isPrintMode ? "bg-white" : "bg-gray-900 p-8"
      }`}
      id="certificate-content"
    >
      <div
        className={`${
          isPrintMode
            ? "w-full max-w-4xl aspect-video"
            : "w-full max-w-2xl"
        } relative`}
        style={{
          backgroundColor: isPrintMode ? "white" : "#0a0a0a",
          aspectRatio: isPrintMode ? "16 / 9" : "auto",
          minHeight: isPrintMode ? "600px" : "700px",
        }}
      >
        {/* Background Decorative Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Top border decoration */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent"></div>

          {/* Bottom border decoration */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent"></div>

          {/* Left accent */}
          <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-gradient-to-b from-transparent via-amber-500 to-transparent"></div>

          {/* Right accent */}
          <div className="absolute right-0 top-1/4 bottom-1/4 w-1 bg-gradient-to-b from-transparent via-amber-500 to-transparent"></div>

          {/* Decorative corner elements */}
          <div className="absolute top-8 left-8 text-amber-500/30 text-6xl font-serif">
            ✦
          </div>
          <div className="absolute bottom-8 right-8 text-amber-500/30 text-6xl font-serif">
            ✦
          </div>
        </div>

        {/* Certificate Content */}
        <div className="relative h-full flex flex-col items-center justify-center px-12 py-8">
          {/* Header - Logo/Branding */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 mb-3">
              <span className="text-lg font-bold text-white">BE</span>
            </div>
            <h2 className="text-sm font-semibold tracking-widest text-amber-600 uppercase">
              Bemo Edge
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Prop Trading Excellence
            </p>
          </div>

          {/* Certificate Title */}
          <div className="text-center mb-8">
            <h1
              className={`${
                isPrintMode ? "text-4xl" : "text-5xl"
              } font-serif font-bold text-gray-900 mb-2`}
              style={{ color: isPrintMode ? "#1f2937" : "#f3f4f6" }}
            >
              {title}
            </h1>
            <p
              className="text-sm tracking-widest font-semibold text-amber-600 uppercase"
            >
              Certificate of Achievement
            </p>
          </div>

          {/* Main Text */}
          <div className="text-center mb-8 max-w-xl">
            <p
              className={`text-base leading-relaxed ${
                isPrintMode
                  ? "text-gray-700"
                  : "text-gray-300"
              }`}
            >
              <span className="font-semibold">This certifies that</span>
            </p>
            <p
              className={`${
                isPrintMode ? "text-3xl" : "text-3xl"
              } font-serif font-bold my-4 ${
                isPrintMode
                  ? "text-gray-900"
                  : "text-white"
              }`}
            >
              {fullName}
            </p>
            <p
              className={`text-base leading-relaxed ${
                isPrintMode
                  ? "text-gray-700"
                  : "text-gray-300"
              }`}
            >
              {description}
            </p>
            {accountName && (
              <p
                className={`text-sm mt-4 font-medium ${
                  isPrintMode
                    ? "text-gray-600"
                    : "text-gray-400"
                }`}
              >
                Account: <span className="font-semibold">{accountName}</span>
              </p>
            )}
          </div>

          {/* Signature Line */}
          <div className="w-full max-w-xl border-t border-gray-400 pt-6 mt-8">
            <div className="grid grid-cols-3 gap-4 text-center text-xs">
              <div>
                <div
                  className={`font-serif italic ${
                    isPrintMode
                      ? "text-gray-600"
                      : "text-gray-400"
                  }`}
                >
                  Authorized Signature
                </div>
              </div>
              <div>
                <p
                  className={`font-serif text-sm font-bold ${
                    isPrintMode
                      ? "text-gray-900"
                      : "text-amber-400"
                  }`}
                >
                  Bemo Edge
                </p>
                <p
                  className={`text-xs ${
                    isPrintMode
                      ? "text-gray-600"
                      : "text-gray-500"
                  }`}
                >
                  Official Seal
                </p>
              </div>
              <div>
                <div
                  className={`font-serif italic ${
                    isPrintMode
                      ? "text-gray-600"
                      : "text-gray-400"
                  }`}
                >
                  Date
                </div>
              </div>
            </div>
          </div>

          {/* Footer Info */}
          <div className="mt-8 text-center text-xs space-y-1">
            <p
              className={`font-mono font-semibold ${
                isPrintMode
                  ? "text-gray-700"
                  : "text-gray-400"
              }`}
            >
              Certificate ID: {certificateId}
            </p>
            <p
              className={`${
                isPrintMode
                  ? "text-gray-600"
                  : "text-gray-500"
              }`}
            >
              Issued on {formattedDate}
            </p>
            <p
              className={`text-xs ${
                isPrintMode
                  ? "text-gray-500"
                  : "text-gray-600"
              }`}
            >
              This certificate represents significant achievement in trading
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
