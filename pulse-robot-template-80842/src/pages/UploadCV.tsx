import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Upload, FileText, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { uploadCV } from "@/services/api";
import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";

const UploadCV = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a PDF file to continue.",
        variant: "destructive",
      });
      return;
    }

    setIsScanning(true);

    try {
      // Prepare form data for backend
      const formData = new FormData();
      formData.append("user_id", "1"); // you can replace this later with dynamic ID
      formData.append("file", file);

      // POST request to backend
      const response = await fetch("http://78.141.223.232:8000/upload_cv", {
        method: "POST",
        body: formData,
        mode: "cors",
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      console.log("✅ Backend response:", result);

      toast({
        title: "CV Scanned Successfully! 🌱",
        description: result.message || "Let's build your profile...",
      });

      // Save user info if needed
      localStorage.setItem("userId", "1");
      localStorage.setItem("cvUploaded", "true");

      // Move to next step
      navigate("/onboarding/step1");
    } catch (error) {
      console.error("❌ CV upload error:", error);
      toast({
        title: "Upload Failed",
        description: "There was an error processing your CV. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsScanning(false);
    }
  };


  const handleSkipCV = () => {
    // Mark that user chose to skip CV upload
    localStorage.setItem("cvUploaded", "false");
    toast({
      title: "No problem!",
      description: "You can fill in your information manually.",
    });
    navigate("/profile");
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <AppHeader />

      {/* Main Content */}
      <section 
        className="flex-1 overflow-hidden relative bg-white" 
      >
        <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative">
          <div className="text-center space-y-6 mb-12">
            <div 
              className="inline-flex items-center bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 mb-4 shadow-sm opacity-0 animate-fade-in" 
              style={{ animationDelay: "0.1s" }}
            >
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary text-white text-xs mr-2">02</span>
              <span className="text-sm font-medium text-gray-700">Upload CV</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold opacity-0 animate-fade-in" style={{ animationDelay: "0.3s" }}>
              Upload Your CV or LinkedIn Profile
            </h1>
            <p className="text-xl text-gray-700 opacity-0 animate-fade-in" style={{ animationDelay: "0.5s" }}>
              We'll extract your information and pre-fill your profile. Don't have one? No problem - just fill it in manually.
            </p>
          </div>

          {/* Upload Area */}
          <div className="glass-card p-8 md:p-12 border-2 border-dashed border-primary/30 hover:border-primary/50 transition-colors opacity-0 animate-fade-in" style={{ animationDelay: "0.7s" }}>
            <div className="space-y-6">
            {/* File Input Area */}
            <label
              htmlFor="cv-upload"
              className="flex flex-col items-center justify-center cursor-pointer group"
            >
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                {file ? (
                  <FileText className="w-12 h-12 text-primary" />
                ) : (
                  <Upload className="w-12 h-12 text-primary" />
                )}
              </div>
              <div className="text-center">
                {file ? (
                  <>
                    <p className="text-lg font-semibold text-gray-900 mb-2">
                      {file.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      Click to change file
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-lg font-semibold text-gray-900 mb-2">
                      Drop your CV here or click to browse
                    </p>
                    <p className="text-sm text-gray-500">
                      PDF files only (max 10MB)
                    </p>
                  </>
                )}
              </div>
              <input
                id="cv-upload"
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            {/* Upload Button */}
            <div className="pt-6 space-y-4">
              <Button
                size="lg"
                onClick={handleUpload}
                disabled={!file || isScanning}
                className="w-full text-lg py-6 rounded-xl"
              >
                {isScanning ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Scanning your CV...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5 mr-2" />
                    Upload & Scan CV
                  </>
                )}
              </Button>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">or</span>
                </div>
              </div>
              
              <Button
                size="lg"
                variant="outline"
                onClick={handleSkipCV}
                disabled={isScanning}
                className="w-full text-lg py-6 rounded-xl"
              >
                <ArrowRight className="w-5 h-5 mr-2" />
                Skip and Fill Manually
              </Button>
            </div>
            </div>
          </div>
        </main>
      </section>
      
      <AppFooter />
    </div>
  );
};

export default UploadCV;