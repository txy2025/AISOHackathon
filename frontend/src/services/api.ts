import { JobMatch } from "@/components/JobMatchCard";

// API Base Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

// Toggle between mock and real API
const USE_MOCK_API = true; // Set to false when backend is ready

export interface CVParseResult {
  userId: string;
  success: boolean;
  extractedData?: {
    fields?: string[];
    status?: string;
    experiences?: Array<{ type: string; details: string }>;
    skills?: string[];
    tools?: string[];
  };
}

/**
 * Upload and parse CV
 * @param file - PDF file to upload
 * @returns Parsed CV data including user ID and extracted profile information
 */
export const uploadCV = async (file: File): Promise<CVParseResult> => {
  if (USE_MOCK_API) {
    // Mock implementation - simulate CV parsing
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ 
          userId: "mock-user-123", 
          success: true,
          extractedData: {
            fields: ["Technology", "Business"],
            status: "student",
            experiences: [
              { type: "education", details: "BSc Computer Science, University of Manchester" },
              { type: "work", details: "Part-time Barista at Coffee House - Customer service and team collaboration" }
            ],
            skills: ["Communication", "Problem Solving", "Teamwork"],
            tools: ["Microsoft Office", "Google Workspace"]
          }
        });
      }, 2000);
    });
  }

  // Real API implementation
  const formData = new FormData();
  formData.append("cv", file);

  const response = await fetch(`${API_BASE_URL}/cv/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Failed to upload CV");
  }

  return response.json();
};

/**
 * Fetch job matches for a user
 * @param userId - User identifier from CV upload
 * @returns Array of matched jobs
 */
export const fetchJobMatches = async (userId: string): Promise<JobMatch[]> => {
  if (USE_MOCK_API) {
    // Mock implementation
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          {
            id: "1",
            matchScore: 92,
            company: "TechStart Solutions",
            salary: "£24,000 - £28,000",
            description: "You'll be helping customers solve problems with our software, mostly through email and chat. You'll learn our products inside-out and become the friendly face customers count on.",
            matchReason: "Your communication skills and interest in technology make you perfect for this role. The company offers excellent training and career progression.",
            location: "Remote",
          },
          {
            id: "2",
            matchScore: 88,
            company: "GrowthCo",
            salary: "£22,000 - £26,000",
            description: "You'll assist the marketing team by creating social media posts, scheduling content, and tracking how well our campaigns perform. No previous experience needed - we'll teach you everything!",
            matchReason: "Your creativity and social media savviness align perfectly with this role. Great entry point into digital marketing with hands-on learning.",
            location: "London, UK",
          },
          {
            id: "3",
            matchScore: 85,
            company: "DataFlow Inc",
            salary: "£23,000 - £27,000",
            description: "You'll help organize and clean up data in spreadsheets, making sure everything is accurate and up-to-date. Perfect for someone detail-oriented who likes working with numbers.",
            matchReason: "Your attention to detail and analytical mindset make you ideal for this position. Excellent foundation for a career in data analysis.",
            location: "Remote",
          },
          {
            id: "4",
            matchScore: 78,
            company: "CreativeHub",
            salary: "£21,000 - £25,000",
            description: "You'll work alongside our design team to create graphics for social media and websites. We'll teach you to use design tools like Canva and Figma - creativity matters more than experience!",
            matchReason: "Your creative portfolio shows promise. This role offers mentorship from experienced designers and a chance to build your professional design skills.",
            location: "Manchester, UK",
          },
          {
            id: "5",
            matchScore: 75,
            company: "FutureBuilders",
            salary: "£23,000 - £26,000",
            description: "You'll help test new features on our website and mobile app, reporting any issues you find. Great for someone who loves technology and has an eye for detail.",
            matchReason: "Your tech enthusiasm and methodical approach suit QA testing perfectly. Great stepping stone into software development or product management.",
            location: "Remote",
          },
          {
            id: "6",
            matchScore: 68,
            company: "PeopleFirst HR",
            salary: "£22,000 - £25,000",
            description: "You'll support the HR team with onboarding new employees, scheduling interviews, and maintaining employee records. Perfect for someone who's organized and enjoys helping people.",
            matchReason: "Your organizational skills and people-focused approach align with HR work. Good entry into a stable career with clear progression paths.",
            location: "Birmingham, UK",
          },
        ]);
      }, 1000);
    });
  }

  // Real API implementation
  const response = await fetch(`${API_BASE_URL}/jobs/matches?userId=${userId}`);

  if (!response.ok) {
    throw new Error("Failed to fetch job matches");
  }

  return response.json();
};

/**
 * Generate tailored CV for a specific job
 * @param userId - User identifier
 * @param jobId - Job identifier
 * @returns Blob URL for the generated PDF
 */
export const generateTailoredCV = async (userId: string, jobId: string): Promise<string> => {
  if (USE_MOCK_API) {
    // Mock implementation - return a real Blob URL (valid PDF placeholder)
    return new Promise((resolve) => {
      setTimeout(() => {
        const minimalPdf = `%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] >>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000010 00000 n \n0000000067 00000 n \n0000000126 00000 n \ntrailer\n<< /Root 1 0 R /Size 4 >>\nstartxref\n185\n%%EOF`;
        const blob = new Blob([minimalPdf], { type: "application/pdf" });
        resolve(URL.createObjectURL(blob));
      }, 800);
    });
  }

  // Real API implementation
  const response = await fetch(`${API_BASE_URL}/cv/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userId, jobId }),
  });

  if (!response.ok) {
    throw new Error("Failed to generate CV");
  }

  const blob = await response.blob();
  return URL.createObjectURL(blob);
};

/**
 * Generate application email for a specific job
 * @param userId - User identifier
 * @param jobId - Job identifier
 * @returns Email content
 */
export const generateApplicationEmail = async (
  userId: string,
  jobId: string
): Promise<string> => {
  if (USE_MOCK_API) {
    // Mock implementation
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(`Dear Hiring Manager,

I am writing to express my interest in this opportunity. 

As a recent graduate with relevant skills, I believe I would be a great fit for this role. My background aligns well with the responsibilities you've outlined.

I've attached my tailored CV for your review and would welcome the opportunity to discuss how I can contribute to your team.

Thank you for your consideration.

Best regards`);
      }, 1500);
    });
  }

  // Real API implementation
  const response = await fetch(`${API_BASE_URL}/application/email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userId, jobId }),
  });

  if (!response.ok) {
    throw new Error("Failed to generate email");
  }

  const data = await response.json();
  return data.emailContent;
};

/**
 * Save a job to user's saved list
 * @param userId - User identifier
 * @param jobId - Job identifier
 */
export const saveJob = async (userId: string, jobId: string): Promise<void> => {
  if (USE_MOCK_API) {
    // Mock implementation - use localStorage
    const savedJobs = JSON.parse(localStorage.getItem("savedJobs") || "[]");
    if (!savedJobs.includes(jobId)) {
      savedJobs.push(jobId);
      localStorage.setItem("savedJobs", JSON.stringify(savedJobs));
    }
    return Promise.resolve();
  }

  // Real API implementation
  const response = await fetch(`${API_BASE_URL}/jobs/save`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userId, jobId }),
  });

  if (!response.ok) {
    throw new Error("Failed to save job");
  }
};

/**
 * Dislike a job
 * @param userId - User identifier
 * @param jobId - Job identifier
 */
export const dislikeJob = async (userId: string, jobId: string): Promise<void> => {
  if (USE_MOCK_API) {
    // Mock implementation - use localStorage
    const dislikedJobs = JSON.parse(localStorage.getItem("dislikedJobs") || "[]");
    if (!dislikedJobs.includes(jobId)) {
      dislikedJobs.push(jobId);
      localStorage.setItem("dislikedJobs", JSON.stringify(dislikedJobs));
    }
    return Promise.resolve();
  }

  // Real API implementation
  const response = await fetch(`${API_BASE_URL}/jobs/dislike`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userId, jobId }),
  });

  if (!response.ok) {
    throw new Error("Failed to dislike job");
  }
};
