import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function AIContractGenerator({ onSaveContract }: { onSaveContract?: (contract: any) => void }) {
  const { toast } = useToast();
  const [generatedContract, setGeneratedContract] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    contractType: "service",
    counterpartyName: "",
    terms: "",
    amount: "",
    deadline: ""
  });

  const generateContractMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest("POST", "/api/smart-contracts/generate-ai-contract", data);
      const result = await response.json();
      return result;
    },
    onSuccess: (data) => {
      setGeneratedContract(data.contractText);
      toast({
        title: "Contract Generated",
        description: "AI has successfully generated your contract. Review it below.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Generate Contract",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({ ...prev, contractType: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.title || !formData.contractType || !formData.counterpartyName || !formData.terms) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields to generate a contract.",
        variant: "destructive",
      });
      return;
    }
    
    // Submit form data to generate contract
    generateContractMutation.mutate(formData);
  };

  const handleSaveContract = () => {
    if (!generatedContract || !onSaveContract) return;
    
    // Convert the AI-generated text to a structured contract object
    const contractObject = {
      name: formData.title,
      description: `AI-generated ${formData.contractType} contract with ${formData.counterpartyName}`,
      counterparty_id: 0, // This will be properly set by the parent component
      terms: {
        agreement: generatedContract,
        conditions: [],
        compensation: {
          amount: parseFloat(formData.amount) || 0,
          currency: "USD",
          paymentSchedule: "milestone"
        }
      }
    };
    
    onSaveContract(contractObject);
    
    toast({
      title: "Contract Saved",
      description: "Your AI-generated contract has been saved."
    });
  };

  return (
    <div className="grid grid-cols-1 gap-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold flex items-center">
          <Sparkles className="mr-2 h-5 w-5 text-primary" />
          AI Contract Generator
        </h2>
        <p className="text-muted-foreground">
          Create comprehensive contracts instantly with AI. Fill in the basic details, and our AI will generate a complete legal contract for you.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contract Details</CardTitle>
          <CardDescription>
            Provide the key information needed to create your contract.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Contract Title</Label>
              <Input
                id="title"
                name="title"
                placeholder="e.g., Web Development Agreement"
                value={formData.title}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contractType">Contract Type</Label>
              <Select 
                value={formData.contractType} 
                onValueChange={handleSelectChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select contract type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="service">Service Agreement</SelectItem>
                  <SelectItem value="employment">Employment Contract</SelectItem>
                  <SelectItem value="sales">Sales Agreement</SelectItem>
                  <SelectItem value="nda">Non-Disclosure Agreement</SelectItem>
                  <SelectItem value="partnership">Partnership Agreement</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="counterpartyName">Counterparty Name</Label>
              <Input
                id="counterpartyName"
                name="counterpartyName"
                placeholder="e.g., Acme Corporation"
                value={formData.counterpartyName}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="terms">Key Terms & Scope</Label>
              <Textarea
                id="terms"
                name="terms"
                placeholder="Describe the main terms of your agreement, including scope of work, deliverables, etc."
                rows={4}
                value={formData.terms}
                onChange={handleInputChange}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (optional)</Label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  placeholder="e.g., 5000"
                  value={formData.amount}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="deadline">Deadline (optional)</Label>
                <Input
                  id="deadline"
                  name="deadline"
                  type="date"
                  value={formData.deadline}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full mt-4"
              disabled={generateContractMutation.isPending}
            >
              {generateContractMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate AI Contract
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {generatedContract && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Contract</CardTitle>
            <CardDescription>
              Review the AI-generated contract below. You can edit it further before saving.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-gray-50 border rounded-lg p-4 max-h-[500px] overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm font-serif leading-relaxed text-gray-900">
                  {generatedContract}
                </pre>
              </div>
              <div className="space-y-2">
                <Label htmlFor="contract-edit">Edit Contract (Optional)</Label>
                <Textarea
                  id="contract-edit"
                  className="min-h-[200px] font-mono text-xs"
                  value={generatedContract}
                  onChange={(e) => setGeneratedContract(e.target.value)}
                  placeholder="You can edit the generated contract here if needed..."
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setGeneratedContract(null)}
            >
              Discard
            </Button>
            {onSaveContract && (
              <Button
                onClick={handleSaveContract}
              >
                Save Contract
              </Button>
            )}
          </CardFooter>
        </Card>
      )}
    </div>
  );
}