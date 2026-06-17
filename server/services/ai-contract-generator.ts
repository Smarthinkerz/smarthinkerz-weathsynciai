import OpenAI from "openai";
import { z } from "zod";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Validate and parse contract input
const contractInputSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  contractType: z.string(),
  description: z.string().optional(),
  parties: z.object({
    creator: z.object({
      name: z.string(),
      email: z.string().email().optional(),
      address: z.string().optional(),
    }),
    counterparty: z.object({
      name: z.string(),
      email: z.string().email().optional(),
      address: z.string().optional(),
    }),
  }),
  terms: z.object({
    scope: z.string().optional(),
    deliverables: z.array(z.string()).optional(),
    timeline: z.string().optional(),
    paymentDetails: z.object({
      amount: z.number().positive(),
      currency: z.string().default("USD"),
      schedule: z.string().optional(),
    }),
    specialClauses: z.array(z.string()).optional(),
  }),
  deadline: z.string().optional(),
  effectiveDate: z.string().optional(),
});

type ContractInput = z.infer<typeof contractInputSchema>;

export class AIContractGenerator {
  async generateContract(input: ContractInput): Promise<string> {
    try {
      // Create a detailed prompt for the AI
      const prompt = this.createPrompt(input);

      // Call OpenAI
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: `You are an expert legal contract drafter with 20+ years of experience in commercial law. Generate comprehensive, legally-sound contracts that follow proper legal formatting standards.

FORMATTING REQUIREMENTS:
- Use proper legal document structure with centered title
- Include article/section numbering (1., 1.1, 1.2, etc.)
- Use formal legal language and terminology
- Include standard legal clauses and boilerplate language
- Format with proper indentation and spacing
- Include signature blocks with proper legal formatting
- Add date and execution provisions
- Include proper legal notices and disclaimers

REQUIRED SECTIONS:
1. Contract header with parties identification
2. Recitals (WHEREAS clauses)
3. Definitions section
4. Main agreement terms
5. Responsibilities and obligations
6. Payment terms and conditions
7. Intellectual property provisions
8. Confidentiality clauses
9. Term and termination
10. Dispute resolution and governing law
11. General provisions
12. Signature blocks

Ensure the contract is enforceable, comprehensive, and follows standard legal formatting conventions used in professional legal documents.`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 4000,
        temperature: 0.3,
      });

      return response.choices[0].message.content || "Error generating contract";
    } catch (error) {
      console.error("Error generating contract with AI:", error);
      throw new Error("Failed to generate contract. Please try again later.");
    }
  }

  private createPrompt(input: ContractInput): string {
    return `
Create a professionally formatted legal contract with proper legal structure and formatting. Follow standard legal document conventions.

CONTRACT SPECIFICATIONS:
- Title: ${input.title}
- Type: ${input.contractType}
- Governing Law: United States
${input.description ? `- Purpose: ${input.description}` : ''}

CONTRACTING PARTIES:
Party A: ${input.parties.creator.name} (the "Provider")
${input.parties.creator.email ? `Email: ${input.parties.creator.email}` : 'Email: [TO BE COMPLETED]'}
${input.parties.creator.address ? `Address: ${input.parties.creator.address}` : 'Address: [TO BE COMPLETED]'}

Party B: ${input.parties.counterparty.name} (the "Client")
${input.parties.counterparty.email ? `Email: ${input.parties.counterparty.email}` : 'Email: [TO BE COMPLETED]'}
${input.parties.counterparty.address ? `Address: ${input.parties.counterparty.address}` : 'Address: [TO BE COMPLETED]'}

CONTRACT TERMS:
- Scope: ${input.terms.scope || 'Services as mutually agreed upon'}
${input.terms.deliverables && input.terms.deliverables.length > 0 
  ? `- Deliverables: ${input.terms.deliverables.join(', ')}` 
  : ''}
- Contract Value: ${input.terms.paymentDetails.currency} ${input.terms.paymentDetails.amount.toLocaleString()}
- Payment Terms: ${input.terms.paymentDetails.schedule || 'Net 30 days'}
${input.deadline ? `- Completion Date: ${input.deadline}` : ''}

REQUIRED LEGAL STRUCTURE:
Generate a complete legal contract with these exact sections in this order:

1. CONTRACT TITLE (centered, all caps)
2. PARTIES section with complete identification
3. RECITALS (WHEREAS clauses explaining the context)
4. DEFINITIONS of key terms used in the contract
5. SCOPE OF SERVICES with detailed description
6. COMPENSATION AND PAYMENT TERMS with specific amounts
7. PERFORMANCE OBLIGATIONS for both parties
8. INTELLECTUAL PROPERTY RIGHTS and ownership
9. CONFIDENTIALITY AND NON-DISCLOSURE provisions
10. REPRESENTATIONS AND WARRANTIES
11. INDEMNIFICATION clauses
12. TERM AND TERMINATION with notice requirements
13. FORCE MAJEURE provisions
14. DISPUTE RESOLUTION and governing law
15. GENERAL PROVISIONS (entire agreement, amendments, severability)
16. SIGNATURE BLOCKS with proper legal formatting

FORMATTING REQUIREMENTS:
- Use formal legal language throughout
- Number sections properly (1., 1.1, 1.2, etc.)
- Include "NOW, THEREFORE" transition clause before main terms
- Add proper spacing between sections
- Include execution date and location
- Format signature blocks with date lines and witness provisions
- Use standard legal boilerplate language where appropriate

Create a complete, enforceable contract suitable for professional business use.
`;
  }

  async generateSimpleContract(
    title: string,
    contractType: string,
    creatorName: string,
    counterpartyName: string,
    terms: string,
    amount: number,
    deadline?: string
  ): Promise<string> {
    // Simplified version that accepts basic parameters without requiring the full schema
    const input: ContractInput = {
      title,
      contractType,
      parties: {
        creator: { name: creatorName },
        counterparty: { name: counterpartyName }
      },
      terms: {
        scope: terms,
        deliverables: [],
        paymentDetails: {
          amount,
          currency: "USD"
        }
      }
    };

    if (deadline) {
      input.deadline = deadline;
    }

    return this.generateContract(input);
  }
}

export const aiContractGenerator = new AIContractGenerator();