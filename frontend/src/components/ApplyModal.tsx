import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { JobMatch } from "@/components/JobMatchCard";
import { FileDown, Mail, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generateTailoredCV, generateApplicationEmail } from "@/services/api";

interface ApplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: JobMatch | null;
}

const ApplyModal = ({ isOpen, onClose, job }: ApplyModalProps) => {
  const [isCopied, setIsCopied] = useState(false);
  const [emailContent, setEmailContent] = useState("");
  const [isGeneratingCV, setIsGeneratingCV] = useState(false);
  const [isGeneratingEmail, setIsGeneratingEmail] = useState(false);
  const [cvGenerated, setCvGenerated] = useState(false);
  const [cvBlobUrl, setCvBlobUrl] = useState<string>("");
  const { toast } = useToast();

  if (!job) return null;

  const handleGenerateCV = async () => {
    setIsGeneratingCV(true);
    
    try {
      const userId = localStorage.getItem("userId") || "mock-user-123";
      const blobUrl = await generateTailoredCV(userId, job.id);
      
      // Store the CV blob URL but don't download yet
      setCvBlobUrl(blobUrl);
      setCvGenerated(true);
      localStorage.setItem("lastGeneratedCV", blobUrl);
      localStorage.setItem("lastGeneratedCVFilename", `CV_${job.company}_${job.id}.pdf`);
      
      toast({
        title: "CV generated!",
        description: "Click 'Download Tailored CV' to save it to your device.",
      });
    } catch (error) {
      console.error("CV generation error:", error);
      toast({
        title: "Generation Failed",
        description: "Could not generate CV. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingCV(false);
    }
  };

  const handleDownloadCV = () => {
    if (!cvBlobUrl) return;
    
    const link = document.createElement("a");
    link.href = cvBlobUrl;
    link.download = `CV_${job.company}_${job.id}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "CV downloaded",
      description: "Your tailored CV is saved locally. Attach it to the email.",
    });
  };

  const handleWriteEmail = async () => {
    setIsGeneratingEmail(true);
    
    try {
      const userId = localStorage.getItem("userId") || "mock-user-123";
      const email = await generateApplicationEmail(userId, job.id);
      
      setEmailContent(email);
    } catch (error) {
      console.error("Email generation error:", error);
      toast({
        title: "Generation Failed",
        description: "Could not generate email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingEmail(false);
    }
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(emailContent);
    setIsCopied(true);
    toast({
      title: "Email copied!",
      description: "The email text has been copied to your clipboard",
    });
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleOpenOutlook = () => {
    const subject = `Application for ${job.company || "Position"}`;
    const cvFilename = localStorage.getItem("lastGeneratedCVFilename") || "CV.pdf";

    // No automatic attachment (not supported). Add a friendly reminder instead.
    const body = `${emailContent}\n\n---\nPlease attach your CV: ${cvFilename}`;

    const outlookLink = `ms-outlook:compose?to=hiring@company.com&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    const mailtoLink = `mailto:hiring@company.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    // Try opening Outlook Desktop first
    const a = document.createElement("a");
    a.href = outlookLink;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // Fallback to default email handler if Outlook protocol isn't available
    setTimeout(() => {
      window.location.href = mailtoLink;
    }, 400);

    toast({
      title: "Opening email client",
      description: "If Outlook Desktop is installed, it will open. Otherwise your default email app will.",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            Apply to {job.company || "this position"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Job Details */}
          <div className="bg-secondary/30 p-4 rounded-lg border border-primary/10">
            <p className="text-sm text-foreground/70 mb-2">
              <strong>Location:</strong> {job.location}
            </p>
            <p className="text-sm text-foreground/80">{job.description}</p>
          </div>

          {/* CV Section */}
          <div className="space-y-3">
            <h3 className="text-lg font-display font-semibold">Step 1: Prepare Your CV</h3>
            {!cvGenerated ? (
              <Button
                onClick={handleGenerateCV}
                size="lg"
                className="w-full"
                variant="outline"
                disabled={isGeneratingCV}
              >
                {isGeneratingCV ? (
                  <>
                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                    Generating CV...
                  </>
                ) : (
                  <>
                    <FileDown className="w-5 h-5 mr-2" />
                    Generate Tailored CV
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={handleDownloadCV}
                size="lg"
                className="w-full"
                variant="outline"
              >
                <FileDown className="w-5 h-5 mr-2" />
                Download Tailored CV
              </Button>
            )}
          </div>

          {/* Email Section */}
          <div className="space-y-3">
            <h3 className="text-lg font-display font-semibold">Step 2: Write Your Email</h3>
            <Button
              onClick={handleWriteEmail}
              size="lg"
              className="w-full"
              variant="outline"
              disabled={isGeneratingEmail}
            >
              {isGeneratingEmail ? (
                <>
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  Writing Email...
                </>
              ) : (
                <>
                  <Mail className="w-5 h-5 mr-2" />
                  Generate Application Email
                </>
              )}
            </Button>

            {emailContent && (
              <div className="space-y-3 mt-4">
                <div className="border rounded-lg p-4 bg-muted/30">
                  <pre className="whitespace-pre-wrap font-sans text-sm text-foreground/80">
                    {emailContent}
                  </pre>
                </div>

                <Button
                  onClick={handleCopyEmail}
                  variant="outline"
                  size="lg"
                  className="w-full"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-5 h-5 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-5 h-5 mr-2" />
                      Copy Email Text
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* Send Section */}
          {emailContent && (
            <div className="space-y-3 pt-4 border-t">
              <h3 className="text-lg font-display font-semibold">Step 3: Send Application</h3>
              <Button 
                onClick={handleOpenOutlook}
                size="lg" 
                className="w-full"
              >
                <Mail className="w-5 h-5 mr-2" />
                Open in Outlook Desktop
              </Button>
              
              <p className="text-xs text-center text-foreground/60 mt-2">
                📎 Remember to attach your downloaded CV file to the email
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ApplyModal;