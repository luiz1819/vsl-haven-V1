import * as React from "react";
import { Loader2, CheckCircle2, XCircle, Clock } from "lucide-react";

type VideoStatus = "uploading" | "transcoding" | "ready" | "failed" | "processing";

interface VideoProcessingBadgeProps {
  status: VideoStatus;
  className?: string;
}

export function VideoProcessingBadge({ status, className = "" }: VideoProcessingBadgeProps) {
  const config = {
    uploading: {
      icon: Loader2,
      label: "Enviando",
      color: "text-blue-600 bg-blue-50 border-blue-200",
      animate: true,
    },
    transcoding: {
      icon: Loader2,
      label: "Processando",
      color: "text-yellow-600 bg-yellow-50 border-yellow-200",
      animate: true,
    },
    processing: {
      icon: Clock,
      label: "Aguardando",
      color: "text-yellow-600 bg-yellow-50 border-yellow-200",
      animate: false,
    },
    ready: {
      icon: CheckCircle2,
      label: "Pronto",
      color: "text-green-600 bg-green-50 border-green-200",
      animate: false,
    },
    failed: {
      icon: XCircle,
      label: "Falhou",
      color: "text-red-600 bg-red-50 border-red-200",
      animate: false,
    },
  };

  const { icon: Icon, label, color, animate } = config[status] || config.ready;

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${color} ${className}`}>
      <Icon className={`h-3.5 w-3.5 ${animate ? "animate-spin" : ""}`} />
      <span>{label}</span>
    </div>
  );
}
