import * as React from "react";
import { useParams } from "react-router-dom";
import { cloud } from "@/lib/cloudClient";
import { BuilderRenderer } from "@/components/video/BuilderRenderer";
import { Loader2 } from "lucide-react";

export default function PublicPage() {
  const { id } = useParams(); // or slug
  const [pageData, setPageData] = React.useState<any>(null);
  const [videoData, setVideoData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
     async function load() {
         try {
             if (!id) throw new Error("No ID");

             // 1. Fetch Page
             const { data: page, error: pageError } = await cloud
                .from("landing_pages")
                .select("*")
                .eq("id", id)
                .single();
             
             if (pageError) throw pageError;
             setPageData(page);

             // 2. Check for Video Section and Fetch Video Data
             const config = page.config as any;
             const videoSection = config?.sections?.find((s: any) => s.type === 'video');

             if (videoSection?.content?.videoId) {
                 // Fetch the specific video to display
                 const { data: videoRow, error: vidError } = await cloud.functions.invoke("public-vsl", {
                     body: { videoId: videoSection.content.videoId }
                 });

                 // Edge function returns { row, signedUrl, ... } or just row? 
                 // public-vsl returns { data: ... } wrapped?
                 // Actually public-vsl returns the whole PublicVslResponse.
                 
                 // Let's use standard select if public access allows, 
                 // BUT public-vsl function handles signed URLs which is crucial.
                 
                 if (vidError) {
                     console.error("Video fetch error", vidError);
                 } else if (videoRow) {
                     setVideoData(videoRow); // Expecting { row, signedUrl } structure from our function?
                     // Verify public-vsl response structure
                 }
             }

         } catch (err) {
             console.error(err);
             setError("Page not found");
         } finally {
             setLoading(false);
         }
     }
     load();
  }, [id]);

  if (loading) return (
      <div className="flex items-center justify-center h-screen">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
  );

  if (error || !pageData) return (
      <div className="flex items-center justify-center h-screen text-red-500">
          {error || "404 Not Found"}
      </div>
  );

  return (
    <BuilderRenderer 
        config={pageData.config} 
        videoData={videoData?.row} // Extract row from response
        signedUrl={videoData?.signedUrl}
    />
  );
}
