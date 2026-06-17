import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SmartContractForm } from "./smart-contract-form";
import { FileText } from "lucide-react";

export function SmartContractDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <FileText className="h-4 w-4 mr-2" />
          Create Smart Contract
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Blockchain Smart Contract</DialogTitle>
          <DialogDescription>
            Fill in the contract details below. The contract will be securely stored and executed on the blockchain.
          </DialogDescription>
        </DialogHeader>
        <SmartContractForm />
      </DialogContent>
    </Dialog>
  );
}
