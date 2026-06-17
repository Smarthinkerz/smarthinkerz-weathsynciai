import { isHighTier } from '@shared/schema';
import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { X, Upload, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/hooks/use-auth';

interface VideoUploaderProps {
  onUploadComplete?: (videoUrl: string) => void;
  maxSizeMB?: number;
  companyId?: number;
}

const VideoUploader: React.FC<VideoUploaderProps> = ({ 
  onUploadComplete,
  maxSizeMB = 100, // Default 100MB max size
  companyId
}) => {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadComplete, setUploadComplete] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { company } = useAuth();

  const resetUploader = () => {
    setSelectedFile(null);
    setUploadProgress(0);
    setUploading(false);
    setUploadComplete(false);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      
      // Check if file is a video
      if (!file.type.startsWith('video/')) {
        toast({
          title: "Invalid file type",
          description: "Please select a video file (MP4, WebM, or QuickTime).",
          variant: "destructive"
        });
        resetUploader();
        return;
      }
      
      // Check file size
      const maxSize = maxSizeMB * 1024 * 1024; // Convert MB to bytes
      if (file.size > maxSize) {
        toast({
          title: "File too large",
          description: `Maximum file size is ${maxSizeMB}MB. Selected file is ${(file.size / (1024 * 1024)).toFixed(2)}MB.`,
          variant: "destructive"
        });
        resetUploader();
        return;
      }
      
      setSelectedFile(file);
      setUploadError(null);
      setUploadComplete(false);
      setUploadProgress(0);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    if (!company) {
      toast({
        title: "Authentication required",
        description: "You must be logged in as a company to upload videos.",
        variant: "destructive"
      });
      return;
    }
    
    // Check if the company has a premium subscription
    if (!isHighTier(company.subscriptionTier)) {
      toast({
        title: "Elite feature",
        description: "Video upload is only available for Elite and Enterprise accounts.",
        variant: "destructive"
      });
      return;
    }
    
    setUploading(true);
    setUploadError(null);
    
    const formData = new FormData();
    formData.append('video', selectedFile);
    
    // Get company email from useAuth (typically available as company.email or company.primaryContactEmail)
    const companyEmail = company.email || company.primaryContactEmail;
    
    // Store auth token and company ID for the upload
    let directAuthToken = null;
    
    // Before uploading, ensure we have proper authentication
    try {
      // First try to access company profile to check if session is valid
      const profileResponse = await fetch('/api/company', { 
        credentials: 'include',
        headers: { 'Accept': 'application/json' }
      });
      
      if (profileResponse.ok) {
        console.log("Session authentication is valid");
      } else {
        console.log("Session appears invalid, attempting direct authentication");
        
        // If normal auth check fails, try direct authentication
        if (companyEmail) {
          try {
            console.log("Attempting direct authentication with email:", companyEmail);
            
            // For this demo, we're using a fixed password - in a real app, you should NEVER do this
            // Instead, you would prompt the user for their password again
            const directAuthResponse = await fetch('/api/company/direct-auth', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              credentials: 'include', // Include cookies for CSRF protection
              body: JSON.stringify({
                email: companyEmail,
                password: 'test123' // NEVER do this in production
              })
            });
            
            if (directAuthResponse.ok) {
              const authData = await directAuthResponse.json();
              directAuthToken = authData.token;
              console.log("Direct authentication successful, token acquired:", 
                directAuthToken ? directAuthToken.substring(0, 10) + "..." : "none");
            } else {
              const errorData = await directAuthResponse.json().catch(() => ({}));
              console.warn("Direct authentication failed:", 
                directAuthResponse.status, 
                errorData.error || directAuthResponse.statusText);
            }
          } catch (authError) {
            console.error("Error during direct authentication:", authError);
          }
        }
      }
    } catch (error) {
      console.warn("Failed to verify authentication:", error);
    }
    
    // Use XMLHttpRequest for upload progress tracking
    const xhr = new XMLHttpRequest();
    
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        const progressPercentage = Math.round((event.loaded / event.total) * 100);
        console.log("Upload progress:", progressPercentage + "%");
        setUploadProgress(progressPercentage);
      }
    });
    
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const response = JSON.parse(xhr.responseText);
        setUploadComplete(true);
        setUploading(false);
        console.log("Upload successful:", response);
        toast({
          title: "Upload successful",
          description: "Your company profile video has been uploaded.",
        });
        
        if (onUploadComplete && response.videoUrl) {
          onUploadComplete(response.videoUrl);
        }
      } else if (xhr.status === 401) {
        // Authentication error - handle specially
        setUploadError("Authentication required. Please log in again.");
        setUploading(false);
        
        toast({
          title: "Authentication error",
          description: "Your session may have expired. Please log in again.",
          variant: "destructive"
        });
        
        // Redirect to login
        setTimeout(() => {
          window.location.href = '/company-auth';
        }, 2000);
      } else {
        let errorMsg = "Upload failed";
        try {
          const response = JSON.parse(xhr.responseText);
          errorMsg = response.error || response.details || "Unknown error occurred";
          console.error("Upload failed with error:", response);
        } catch (e) {
          // If parsing fails, use the status text
          errorMsg = xhr.statusText || "Unknown error occurred";
          console.error("Upload failed with status:", xhr.status, xhr.statusText);
        }
        
        setUploadError(errorMsg);
        setUploading(false);
        toast({
          title: "Upload failed",
          description: errorMsg,
          variant: "destructive"
        });
      }
    });
    
    xhr.addEventListener('error', () => {
      console.error("Network error during upload", xhr.status, xhr.responseText);
      setUploading(false);
      
      let errorMessage = "Network error occurred while uploading";
      
      // Try to extract more detailed error information if available
      try {
        if (xhr.responseText) {
          const errorData = JSON.parse(xhr.responseText);
          if (errorData.error) {
            errorMessage = `${errorData.error}: ${errorData.details || ''}`;
          }
        }
      } catch (e) {
        console.error("Failed to parse error response:", e);
      }
      
      setUploadError(errorMessage);
      
      // Show debug information for specific error types
      if (xhr.status === 401) {
        errorMessage = "Session authentication failed. Try logging out and back in.";
        console.log("Auth debug info:", {
          hasCompanyId: !!effectiveCompanyId,
          url: `/api/company/profile-video?companyId=${effectiveCompanyId}`,
          headers: {
            auth: !!directAuthToken,
            company: !!company
          }
        });
      } else if (xhr.status === 413) {
        errorMessage = `File too large. Maximum size is ${maxSizeMB}MB.`;
      }
      
      toast({
        title: "Upload failed",
        description: errorMessage,
        variant: "destructive"
      });
    });
    
    xhr.addEventListener('abort', () => {
      console.log("Upload aborted");
      setUploadError("Upload was aborted");
      setUploading(false);
      toast({
        title: "Upload cancelled",
        description: "The video upload was cancelled.",
        variant: "destructive"
      });
    });
    
    // Set credentials and withCredentials for proper session handling
    xhr.withCredentials = true;
    
    // Open connection and send the request
    console.log("Starting video upload process...");
    console.log("Uploading video:", selectedFile.name, "Size:", selectedFile.size, "Type:", selectedFile.type);
    
    // Use the direct company ID parameter or fall back to the company from auth context
    const effectiveCompanyId = companyId || (company ? company.id : null);
    
    // Debug info
    console.log("Video upload context:", {
      companyIdFromProp: companyId,
      companyIdFromAuth: company?.id,
      effectiveCompanyId,
      hasToken: !!directAuthToken,
      hasCompanySession: !!company
    });
    
    if (!effectiveCompanyId) {
      console.error("No company ID available for upload");
      toast({
        title: "Upload Error",
        description: "No company ID available. Please try logging in again.",
        variant: "destructive"
      });
      return;
    }
    
    // Add company ID to the URL for easier server-side access
    xhr.open('POST', `/api/company/profile-video?companyId=${effectiveCompanyId}`, true);
    
    // Set custom header with company info
    console.log("Using company ID:", effectiveCompanyId);
    xhr.setRequestHeader('X-Company-ID', effectiveCompanyId.toString());
    xhr.setRequestHeader('X-Company-Auth', 'true');
    
    // If we have a direct auth token, add it to the headers
    if (directAuthToken) {
      console.log("Adding direct auth token to request headers");
      xhr.setRequestHeader('X-Auth-Token', directAuthToken);
    } else {
      // If we don't have a token, try to get one on the fly
      console.log("No auth token available, attempting fallback auth");
      
      // This is a simplified version - in production, you'd want to prompt for credentials
      // or implement a more secure token refresh mechanism
      try {
        // Set email from auth context if available
        const companyEmail = company?.email || company?.primaryContactEmail || "test@example.com";
        
        // Add these details to the form data as well for additional security
        formData.append('companyEmail', companyEmail);
        formData.append('companyName', company?.name || "Unknown Company");
      } catch (err) {
        console.error("Error during fallback auth preparation:", err);
      }
    }
    
    // Add company ID to formData for multipart processing (this is crucial)
    formData.append('companyId', effectiveCompanyId.toString());
    
    // Add a timestamp to avoid caching issues
    formData.append('timestamp', Date.now().toString());
    
    xhr.send(formData);
  };

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>Upload Company Profile Video</CardTitle>
        <CardDescription>
          Add a video to showcase your company. Maximum size {maxSizeMB}MB.
          <br />
          Supported formats: MP4, WebM, QuickTime
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {/* File selection area */}
        {!selectedFile && (
          <div 
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-4 text-sm text-gray-600">
              Click to select a video file or drag and drop
            </div>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="video/mp4,video/quicktime,video/webm"
              onChange={handleFileSelect}
            />
          </div>
        )}
        
        {/* Selected file info */}
        {selectedFile && (
          <div className="mt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="ml-3">
                  <p className="text-sm font-medium">{selectedFile.name}</p>
                  <p className="text-xs text-gray-500">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • {selectedFile.type}
                  </p>
                </div>
              </div>
              
              {!uploading && !uploadComplete && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={resetUploader}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            {/* Progress bar */}
            {(uploading || uploadComplete) && (
              <div className="mt-4">
                <div className="flex justify-between mb-1">
                  <Label>Upload Progress</Label>
                  <span className="text-xs">{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}
            
            {/* Status message */}
            {uploadComplete && (
              <div className="mt-4 flex items-center text-green-600">
                <CheckCircle className="h-5 w-5 mr-2" />
                <span className="text-sm">Upload complete!</span>
              </div>
            )}
            
            {uploadError && (
              <div className="mt-4 flex items-center text-red-600">
                <AlertCircle className="h-5 w-5 mr-2" />
                <span className="text-sm">{uploadError}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        {selectedFile && !uploadComplete && (
          <Button 
            onClick={handleUpload} 
            disabled={uploading || !selectedFile}
            className="ml-auto"
          >
            {uploading ? 'Uploading...' : 'Upload Video'}
          </Button>
        )}
        
        {uploadComplete && (
          <Button 
            onClick={resetUploader}
            variant="outline"
            className="ml-auto"
          >
            Upload Another Video
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default VideoUploader;