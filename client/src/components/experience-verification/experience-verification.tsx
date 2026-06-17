import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { SiLinkedin } from "react-icons/si";
import { Briefcase, Users, Award, FolderGit2 } from "lucide-react";
import { WorkHistoryForm } from "./work-history-form";
import { ReferenceForm } from "./reference-form";
import { CertificateForm } from "./certificate-form";
import { ProjectForm } from "./project-form";
import { LinkedInVerification } from "./linkedin-verification";

export function ExperienceVerification() {
  return (
    <Card className="p-6">
      <h2 className="text-2xl font-semibold mb-6">Experience Verification</h2>
      <Tabs defaultValue="work-history" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 h-auto">
          <TabsTrigger value="work-history" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Work History
          </TabsTrigger>
          <TabsTrigger value="references" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            References
          </TabsTrigger>
          <TabsTrigger value="certificates" className="flex items-center gap-2">
            <Award className="h-4 w-4" />
            Certificates
          </TabsTrigger>
          <TabsTrigger value="projects" className="flex items-center gap-2">
            <FolderGit2 className="h-4 w-4" />
            Projects
          </TabsTrigger>
          <TabsTrigger value="linkedin" className="flex items-center gap-2">
            <SiLinkedin className="h-4 w-4" />
            LinkedIn
          </TabsTrigger>
        </TabsList>
        <TabsContent value="work-history">
          <WorkHistoryForm />
        </TabsContent>
        <TabsContent value="references">
          <ReferenceForm />
        </TabsContent>
        <TabsContent value="certificates">
          <CertificateForm />
        </TabsContent>
        <TabsContent value="projects">
          <ProjectForm />
        </TabsContent>
        <TabsContent value="linkedin">
          <LinkedInVerification />
        </TabsContent>
      </Tabs>
    </Card>
  );
}
