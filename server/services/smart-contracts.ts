import { db } from "../db";
import { eq, or } from "drizzle-orm";
import { smartContracts } from "@shared/schema";
import { storage } from "../storage";

export interface SmartContractData {
  name: string;
  description: string;
  terms: any;
  validation_rules?: any;
  execution_conditions?: any;
  creator_id: number;
  counterparty_id?: number;
  status?: string;
}

class SmartContractService {
  async createContract(data: SmartContractData) {
    const contractData = {
      name: data.name,
      description: data.description,
      creator_id: data.creator_id,
      counterparty_id: data.counterparty_id,
      status: data.status || 'draft',
      terms: data.terms,
      validation_rules: data.validation_rules || {},
      execution_conditions: data.execution_conditions || {
        triggers: ["completion"],
        prerequisites: ["contractSigned"],
        automationRules: [
          { condition: "milestoneCompleted", action: "releaseMilestonePayment" }
        ]
      }
    };
    
    const [contract] = await db.insert(smartContracts)
      .values(contractData)
      .returning();

    this.notifyContractParties(contract, 'created').catch(e =>
      console.error('Contract creation notification error:', e)
    );
    
    return contract;
  }

  async getContractById(id: number) {
    const [contract] = await db.select()
      .from(smartContracts)
      .where(eq(smartContracts.id, id));
      
    return contract || null;
  }

  async getContractsByUser(userId: number) {
    return await db.select()
      .from(smartContracts)
      .where(
        or(
          eq(smartContracts.creator_id, userId),
          eq(smartContracts.counterparty_id, userId)
        )
      );
  }

  async activateContract(id: number) {
    const existing = await this.getContractById(id);
    if (!existing) throw new Error('Contract not found');

    if (!this.validateContract(existing)) {
      throw new Error('Contract validation failed: missing required terms or compensation');
    }

    const [contract] = await db.update(smartContracts)
      .set({ 
        status: 'active',
        last_executed_at: new Date()
      })
      .where(eq(smartContracts.id, id))
      .returning();
      
    if (!contract) throw new Error('Contract not found');

    this.notifyContractParties(contract, 'activated').catch(e =>
      console.error('Contract activation notification error:', e)
    );
    
    return contract;
  }

  async deleteContract(id: number) {
    const [deletedContract] = await db.delete(smartContracts)
      .where(eq(smartContracts.id, id))
      .returning();
      
    if (!deletedContract) throw new Error('Contract not found');
    
    return { success: true };
  }

  private validateContract(contract: any): boolean {
    const terms = contract.terms || {};
    if (!terms.agreement) return false;
    if (!terms.compensation?.amount) return false;
    return true;
  }

  async checkCondition(contract: any, condition: string): Promise<boolean> {
    switch (condition) {
      case 'contractSigned':
        return contract.status === 'active';
      case 'partiesAgreed':
        return contract.status === 'active';
      case 'deadlineNotPassed':
        return !contract.expires_at || new Date(contract.expires_at) > new Date();
      case 'milestoneCompleted': {
        const terms = contract.terms || {};
        if (!terms.milestones || !Array.isArray(terms.milestones)) {
          return contract.status === 'active';
        }
        return terms.milestones.some((m: any) => m.status === 'completed');
      }
      case 'allMilestonesCompleted': {
        const terms = contract.terms || {};
        if (!terms.milestones || !Array.isArray(terms.milestones)) {
          return contract.status === 'active';
        }
        return terms.milestones.every((m: any) => m.status === 'completed');
      }
      default:
        console.warn(`Unknown condition: ${condition}`);
        return false;
    }
  }

  async executeAutomation(contract: any): Promise<void> {
    if (!this.validateContract(contract)) {
      throw new Error('Contract validation failed');
    }

    const executionConditions = contract.execution_conditions || {};
    const rules = executionConditions.automationRules || [];
    
    for (const rule of rules) {
      if (await this.checkCondition(contract, rule.condition)) {
        await this.executeAction(contract, rule.action);
      }
    }
  }

  private async executeAction(contract: any, action: string): Promise<void> {
    switch (action) {
      case 'markComplete':
        await db.update(smartContracts)
          .set({ status: 'completed', last_executed_at: new Date() })
          .where(eq(smartContracts.id, contract.id));
        await this.notifyContractParties(contract, 'completed');
        break;
      case 'releaseMilestonePayment': {
        const terms = contract.terms || {};
        const amount = terms.compensation?.amount || 0;
        const currency = terms.compensation?.currency || 'USD';
        console.log(`Processing milestone payment: ${currency} ${amount} for contract ${contract.id}`);
        await this.notifyContractParties(contract, 'payment_released');
        break;
      }
      case 'notifyParties':
        await this.notifyContractParties(contract, 'update');
        break;
      default:
        console.warn(`Unknown action: ${action}`);
    }
  }

  private async notifyContractParties(contract: any, event: string): Promise<void> {
    const eventMessages: Record<string, { title: string; message: string }> = {
      created: {
        title: 'New Smart Contract Created',
        message: `A new contract "${contract.name}" has been created and is awaiting review.`,
      },
      activated: {
        title: 'Smart Contract Activated',
        message: `Contract "${contract.name}" is now active. All parties have agreed to the terms.`,
      },
      completed: {
        title: 'Smart Contract Completed',
        message: `Contract "${contract.name}" has been successfully completed.`,
      },
      payment_released: {
        title: 'Milestone Payment Released',
        message: `A milestone payment has been released for contract "${contract.name}".`,
      },
      update: {
        title: 'Smart Contract Update',
        message: `There is an update on contract "${contract.name}".`,
      },
    };

    const { title, message } = eventMessages[event] || eventMessages.update;

    const partyIds = [contract.creator_id, contract.counterparty_id].filter(Boolean);
    for (const userId of partyIds) {
      storage.createNotification({
        userId,
        type: 'system',
        title,
        message,
        link: '/smart-contracts',
      }).catch(e => console.error(`Contract notification error for user ${userId}:`, e));
    }
  }
}

export const smartContractService = new SmartContractService();
