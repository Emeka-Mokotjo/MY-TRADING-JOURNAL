"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/utils/supabase/client";
import { useAuth } from "@/components/auth-provider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/stat-card";
import { CertificateModal } from "@/components/CertificateModal";
import {
  checkFundedAccountCertificate,
  checkProfitMilestoneCertificates,
  checkConsistencyCertificate,
  createCertificate,
  getUserCertificates,
  getUserProfileInfo,
  getAccountInfo,
  certificateExists,
} from "@/utils/certificates";
import { Award, Lock, Unlock, Eye, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

interface AvailableCertificate {
  type: string;
  name: string;
  description: string;
  requirement: string;
  icon: React.ReactNode;
  isAvailable: boolean;
  isLocked: boolean;
  accountId?: string;
}

interface GeneratedCert {
  id: string;
  title: string;
  description: string | null;
  certificate_id: string;
  issued_at: string;
  account_name?: string;
  account_id?: string;
}

interface PreviewCert {
  title: string;
  description: string;
  fullName: string;
  certificateId: string;
  issuedDate: string;
  accountName?: string;
}

export default function CertificatesPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  const [userProfile, setUserProfile] = useState<{ fullName: string } | null>(null);
  const [availableCertificates, setAvailableCertificates] = useState<AvailableCertificate[]>([]);
  const [generatedCertificates, setGeneratedCertificates] = useState<GeneratedCert[]>([]);

  const [previewCert, setPreviewCert] = useState<PreviewCert | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) return;

    try {
      // Get user profile
      const profileInfo = await getUserProfileInfo(supabase, user.id);
      setUserProfile(profileInfo);

      // Check funded account certificate
      const fundedCheck = await checkFundedAccountCertificate(supabase, user.id);
      const fundedCerts: AvailableCertificate[] = fundedCheck.accounts.map((acc) => ({
        type: `funded_account_${acc.id}`,
        name: "Funded Account Certificate",
        description: `Certificate for trading a funded account`,
        requirement: `Account: ${acc.name}`,
        icon: <Award className="h-5 w-5" />,
        isAvailable: true,
        isLocked: false,
        accountId: acc.id,
      }));

      // Check profit milestone certificates
      const profitCheck = await checkProfitMilestoneCertificates(supabase, user.id);
      const profitCerts: AvailableCertificate[] = profitCheck
        .map((milestone) => ({
          type: `profit_milestone_${milestone.threshold}`,
          name: `$${milestone.threshold.toLocaleString()} Profit Certificate`,
          description: `Certifies achieving $${milestone.threshold.toLocaleString()} in trading profits`,
          requirement: `Current PnL: $${milestone.currentPnL.toLocaleString(undefined, {
            minimumFractionDigits: 2,
          })}`,
          icon: <Award className="h-5 w-5" />,
          isAvailable: milestone.qualifies,
          isLocked: !milestone.qualifies,
        }))
        .filter((cert) => cert.isAvailable || cert.isLocked);

      // Check consistency certificate
      const consistencyCheck = await checkConsistencyCertificate(supabase, user.id, 10);
      const consistencyCerts: AvailableCertificate[] = [
        {
          type: "consistency",
          name: "Consistency Certificate",
          description: "Certifies 10+ days of profitable trading",
          requirement: `Profitable Days: ${consistencyCheck.profitableDays}/${consistencyCheck.requiredDays}`,
          icon: <Award className="h-5 w-5" />,
          isAvailable: consistencyCheck.qualifies,
          isLocked: !consistencyCheck.qualifies,
        },
      ];

      const allAvailable = [...fundedCerts, ...profitCerts, ...consistencyCerts];
      setAvailableCertificates(allAvailable);

      // Get generated certificates
      const certs = await getUserCertificates(supabase, user.id);
      setGeneratedCertificates(certs);
    } catch (err) {
      console.error("Error fetching certificates data:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();

    if (!user) return;

    // Setup realtime subscriptions
    const channel = supabase
      .channel("realtime-certificates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "certificates",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchData]);

  const handleGenerateCertificate = async (certType: AvailableCertificate) => {
    if (!user || !userProfile) {
      toast.error("User information not available");
      return;
    }

    if (!certType.isAvailable) {
      toast.error("You don't qualify for this certificate yet");
      return;
    }

    setGeneratingId(certType.type);

    try {
      let title = "";
      let description = "";
      let dbCertType = certType.type;

      if (certType.type.startsWith("funded_account_")) {
        title = "Certified Funded Trader";
        const accountInfo = await getAccountInfo(supabase, certType.accountId!);
        description = `This certifies that ${userProfile.fullName} has successfully achieved a funded trading account on Bemo Edge.`;
        dbCertType = "funded_account";
      } else if (certType.type.startsWith("profit_milestone_")) {
        const threshold = parseInt(certType.type.split("_")[2]);
        title = `$${threshold.toLocaleString()} Profit Milestone`;
        description = `This certifies that ${userProfile.fullName} has achieved $${threshold.toLocaleString()} in cumulative trading profits on Bemo Edge.`;
        dbCertType = `profit_milestone`;
      } else if (certType.type === "consistency") {
        title = "Trading Consistency Certificate";
        description = `This certifies that ${userProfile.fullName} has demonstrated consistent profitable trading across 10+ trading days on Bemo Edge.`;
        dbCertType = "consistency";
      }

      const result = await createCertificate(
        supabase,
        user.id,
        dbCertType,
        title,
        description,
        certType.accountId
      );

      if (result.success && result.certificateId) {
        toast.success("Certificate generated successfully!");

        // Show preview modal
        setPreviewCert({
          title,
          description,
          fullName: userProfile.fullName,
          certificateId: result.certificateId,
          issuedDate: new Date().toISOString(),
          accountName: certType.accountId
            ? availableCertificates.find((c) => c.accountId === certType.accountId)?.requirement
            : undefined,
        });

        fetchData();
      } else {
        toast.error(result.error || "Failed to generate certificate");
      }
    } catch (err) {
      console.error("Error generating certificate:", err);
      toast.error("An error occurred while generating the certificate");
    } finally {
      setGeneratingId(null);
    }
  };

  const handleDeleteCertificate = async (id: string) => {
    if (!user) return;

    if (!window.confirm("Are you sure you want to delete this certificate?")) return;

    const { error } = await supabase
      .from("certificates")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      toast.error("Failed to delete certificate");
    } else {
      toast.success("Certificate deleted");
      fetchData();
    }
  };

  const handleViewCertificate = async (cert: GeneratedCert) => {
    if (!userProfile) return;

    setPreviewCert({
      title: cert.title,
      description: cert.description || "",
      fullName: userProfile.fullName,
      certificateId: cert.certificate_id,
      issuedDate: cert.issued_at,
      accountName: cert.account_name,
    });
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2 animate-pulse">
            Certificates
          </h1>
          <p className="text-gray-400">Loading...</p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-card border border-border rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Certificates</h1>
        <p className="text-gray-400">
          Recognize and showcase your trading achievements.
        </p>
      </div>

      {/* Summary Stat */}
      <div className="grid gap-6 md:grid-cols-3">
        <StatCard
          title="Certificates Earned"
          value={generatedCertificates.length.toString()}
          icon={Award}
        />
        <StatCard
          title="Available to Earn"
          value={availableCertificates.filter((c) => c.isAvailable).length.toString()}
          icon={Unlock}
        />
        <StatCard
          title="Locked Certificates"
          value={availableCertificates.filter((c) => c.isLocked).length.toString()}
          icon={Lock}
        />
      </div>

      {/* Available Certificates Section */}
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-4">Available Certificates</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {availableCertificates.map((cert) => (
            <Card
              key={cert.type}
              className={`relative overflow-hidden transition-all ${
                cert.isLocked
                  ? "opacity-60 border-gray-700"
                  : "border-amber-500/30 hover:border-amber-500/50"
              }`}
            >
              {cert.isAvailable && (
                <div className="absolute inset-0 top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400"></div>
              )}

              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${
                        cert.isAvailable
                          ? "bg-amber-500/20 text-amber-400"
                          : "bg-gray-700/30 text-gray-500"
                      }`}
                    >
                      {cert.icon}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{cert.name}</CardTitle>
                    </div>
                  </div>
                  {cert.isLocked && <Lock className="h-4 w-4 text-gray-600" />}
                </div>
                <CardDescription className="mt-2">
                  {cert.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="p-3 rounded-lg bg-white/5 border border-border">
                  <p className="text-sm font-medium text-gray-300 mb-1">Requirement</p>
                  <p className="text-sm text-gray-400">{cert.requirement}</p>
                </div>

                <Button
                  onClick={() => handleGenerateCertificate(cert)}
                  disabled={!cert.isAvailable || generatingId === cert.type}
                  className={`w-full ${
                    cert.isAvailable
                      ? "bg-amber-600 hover:bg-amber-700"
                      : "opacity-50 cursor-not-allowed"
                  }`}
                >
                  {generatingId === cert.type ? "Generating..." : "Generate Certificate"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Generated Certificates Section */}
      {generatedCertificates.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-4">Your Certificates</h2>
          <Card>
            <CardHeader>
              <CardTitle>Certificate History</CardTitle>
              <CardDescription>
                {generatedCertificates.length} {generatedCertificates.length === 1 ? "certificate" : "certificates"} earned
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-gray-400">
                    <th className="px-4 py-3 text-left font-semibold">Title</th>
                    <th className="px-4 py-3 text-left font-semibold">Certificate ID</th>
                    <th className="px-4 py-3 text-left font-semibold">Issued Date</th>
                    <th className="px-4 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {generatedCertificates.map((cert) => (
                    <tr key={cert.id} className="border-b border-border/50 hover:bg-white/5">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-foreground">{cert.title}</p>
                          {cert.account_name && (
                            <p className="text-xs text-gray-500 mt-1">{cert.account_name}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <code className="text-xs bg-white/5 px-2 py-1 rounded border border-border text-amber-400">
                          {cert.certificate_id}
                        </code>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-sm">
                        {new Date(cert.issued_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewCertificate(cert)}
                            className="gap-1"
                          >
                            <Eye className="h-4 w-4" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteCertificate(cert.id)}
                            className="gap-1 hover:bg-red-900/30"
                          >
                            <Trash2 className="h-4 w-4 text-red-400" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Empty State */}
      {generatedCertificates.length === 0 && (
        <Card className="border-dashed border-gray-700">
          <CardContent className="py-12 text-center">
            <Award className="h-12 w-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">No certificates yet</p>
            <p className="text-gray-500 text-sm mt-1">
              Achieve the requirements above to earn your first certificate
            </p>
          </CardContent>
        </Card>
      )}

      {/* Certificate Preview Modal */}
      {previewCert && (
        <CertificateModal
          isOpen={true}
          onClose={() => setPreviewCert(null)}
          title={previewCert.title}
          description={previewCert.description}
          fullName={previewCert.fullName}
          certificateId={previewCert.certificateId}
          issuedDate={previewCert.issuedDate}
          accountName={previewCert.accountName}
        />
      )}
    </div>
  );
}
