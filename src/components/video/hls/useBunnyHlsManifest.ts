import * as React from "react";
import { cloud } from "@/lib/cloudClient";

type ErrorState = "processing" | "not_found" | "auth_error" | "unknown" | null;

export function useBunnyHlsManifest(bunnyId?: string | null, opts?: { expiresIn?: number }) {
  const expiresIn = opts?.expiresIn ?? 60 * 10;
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [errorState, setErrorState] = React.useState<ErrorState>(null);
  const [manifestUrl, setManifestUrl] = React.useState<string | undefined>(undefined);
  const [retryCount, setRetryCount] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;
    let blobUrl: string | null = null;
    let retryTimeout: NodeJS.Timeout | null = null;

    const run = async () => {
      if (!bunnyId) {
        setManifestUrl(undefined);
        setError(null);
        setErrorState(null);
        return;
      }

      setLoading(true);
      setError(null);
      setErrorState(null);
      
      try {
        const { data, error: e } = await cloud.functions.invoke("bunny-hls-manifest", {
          body: { bunnyId, expiresIn },
        });
        
        if (e) throw e;
        
        const manifestText = typeof data === "string" ? data : String(data ?? "");
        blobUrl = URL.createObjectURL(
          new Blob([manifestText], {
            type: "application/vnd.apple.mpegurl;charset=utf-8",
          }),
        );
        
        if (!cancelled) {
          setManifestUrl(blobUrl);
          setRetryCount(0); // Reset retry count on success
        }
      } catch (err: any) {
        console.error("useBunnyHlsManifest error:", err);
        
        let parsedErrorState: ErrorState = "unknown";
        let errorMessage = String(err?.message ?? err);
        
        // Try to parse error details from Supabase FunctionsHttpError
        if (err?.context?.json) {
          try {
            const details = await err.context.json();
            console.error("Upstream error details:", details);
            
            // Check if it's a 404 (video still processing or not found)
            if (details?.details?.status === 404) {
              parsedErrorState = "processing";
              errorMessage = "Vídeo em processamento. Aguarde...";
              
              // Retry automatically for processing videos (max 20 retries = ~5 minutes)
              if (retryCount < 20 && !cancelled) {
                const delay = Math.min(5000, 1000 * Math.pow(1.5, retryCount)); // Exponential backoff, max 5s
                console.log(`Video processing, retrying in ${delay}ms (attempt ${retryCount + 1}/20)`);
                retryTimeout = setTimeout(() => {
                  if (!cancelled) {
                    setRetryCount(prev => prev + 1);
                  }
                }, delay);
              }
            } else if (details?.details?.status === 403) {
              parsedErrorState = "auth_error";
              errorMessage = "Erro de autenticação. Tente novamente.";
            }
          } catch (parseErr) {
            console.error("Failed to parse error details:", parseErr);
          }
        }
        
        if (!cancelled) {
          setError(errorMessage);
          setErrorState(parsedErrorState);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();

    return () => {
      cancelled = true;
      if (blobUrl) URL.revokeObjectURL(blobUrl);
      if (retryTimeout) clearTimeout(retryTimeout);
    };
  }, [bunnyId, expiresIn, retryCount]);

  return { 
    manifestUrl, 
    loading, 
    error, 
    errorState,
    isProcessing: errorState === "processing"
  };
}
