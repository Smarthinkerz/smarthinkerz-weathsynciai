import { SmartContract, InsertSmartContract } from "@shared/schema";
import { storage } from "../storage";

class SmartContractService {
  async createContract(contractData: InsertSmartContract & { creator_id: number }): Promise<SmartContract> {
    try {
      console.log('Creating contract with data:', JSON.stringify(contractData, null, 2));

      if (contractData.counterparty_id < 1) {
        throw new Error("Counterparty ID must be 1 or greater");
      }

      const counterparty = await storage.getUser(contractData.counterparty_id);
      if (!counterparty) {
        throw new Error(`User with ID ${contractData.counterparty_id} does not exist. Please use an ID between 1 and 20.`);
      }

      if (contractData.creator_id === contractData.counterparty_id) {
        throw new Error("Cannot create a contract with yourself");
      }

      const existingContracts = await storage.getSmartContractsByUser(contractData.counterparty_id);
      const hasActiveContract = existingContracts.some(contract => 
        contract.status !== 'completed' && contract.status !== 'cancelled'
      );

      if (hasActiveContract) {
        throw new Error(`Counterparty with ID ${contractData.counterparty_id} already has an active contract. Please choose a different counterparty ID.`);
      }

      if (!contractData.name || !contractData.description) {
        throw new Error('Missing required fields: name or description');
      }

      if (!contractData.terms?.agreement) {
        throw new Error('Missing required terms: agreement');
      }

      if (!contractData.terms?.compensation?.amount) {
        throw new Error('Missing required compensation amount');
      }

      const contractToCreate = {
        name: contractData.name,
        description: contractData.description,
        creator_id: contractData.creator_id,
        counterparty_id: contractData.counterparty_id,
        status: 'draft',
        terms: contractData.terms,
        validation_rules: {
          required: ["hasValidParties", "hasValidTerms"],
          optional: []
        },
        execution_conditions: {
          triggers: ["completion"],
          prerequisites: ["contractSigned"],
          automationRules: [
            {
              condition: "milestoneCompleted",
              action: "releaseMilestonePayment"
            }
          ]
        },
        created_at: new Date()
      };

      console.log('Sending to storage:', JSON.stringify(contractToCreate, null, 2));
      const contract = await storage.createSmartContract(contractToCreate);
      console.log('Successfully created contract:', JSON.stringify(contract, null, 2));

      await this.notifyContractParties(contract, 'created');

      return contract;
    } catch (error: any) {
      console.error('Error creating contract:', error);
      throw new Error(`Failed to create smart contract: ${error.message}`);
    }
  }

  async activateContract(contractId: number): Promise<SmartContract> {
    try {
      const contract = await storage.getSmartContract(contractId);
      if (!contract) {
        throw new Error('Contract not found');
      }

      if (contract.status === 'active') {
        throw new Error('Contract is already active');
      }

      const isValid = await this.validateContract(contract);
      if (!isValid) {
        throw new Error('Contract validation failed: missing required terms or compensation');
      }

      const updated = await storage.updateSmartContractStatus(contractId, 'active');
      await this.notifyContractParties(updated, 'activated');
      return updated;
    } catch (error: any) {
      console.error(`Error activating contract ${contractId}:`, error);
      throw error;
    }
  }

  private async validateContract(contract: SmartContract): Promise<boolean> {
    try {
      const terms = contract.terms as { 
        agreement?: string; 
        compensation?: { amount?: number }
      } || {};
      
      if (!terms || !terms.agreement || !terms.compensation?.amount) {
        return false;
      }

      const creator = await storage.getUser(contract.creator_id);
      const counterparty = await storage.getUser(contract.counterparty_id);
      if (!creator || !counterparty) {
        return false;
      }

      return true;
    } catch (error) {
      console.error(`Error validating contract ${contract.id}:`, error);
      return false;
    }
  }

  async executeAutomation(contract: SmartContract): Promise<void> {
    try {
      console.log(`Executing automation for contract ${contract.id}`);

      if (!(await this.validateContract(contract))) {
        throw new Error('Contract validation failed');
      }

      const executionConditions = contract.execution_conditions as ExecutionConditions;
      for (const rule of executionConditions.automationRules) {
        if (await this.checkCondition(contract, rule.condition)) {
          await this.executeAction(contract, rule.action);
        }
      }
    } catch (error) {
      console.error(`Error executing automation for contract ${contract.id}:`, error);
      throw error;
    }
  }

  private async checkCondition(contract: SmartContract, condition: string): Promise<boolean> {
    try {
      switch (condition) {
        case 'contractSigned':
          return contract.status === 'active';
        case 'partiesAgreed':
          return contract.status === 'active';
        case 'deadlineNotPassed':
          return !contract.expires_at || new Date(contract.expires_at) > new Date();
        case 'milestoneCompleted': {
          const terms = contract.terms as any;
          if (!terms?.milestones || !Array.isArray(terms.milestones)) {
            return contract.status === 'active';
          }
          return terms.milestones.some((m: any) => m.status === 'completed');
        }
        case 'allMilestonesCompleted': {
          const terms = contract.terms as any;
          if (!terms?.milestones || !Array.isArray(terms.milestones)) {
            return contract.status === 'active';
          }
          return terms.milestones.every((m: any) => m.status === 'completed');
        }
        default:
          console.warn(`Unknown condition: ${condition}`);
          return false;
      }
    } catch (error) {
      console.error(`Error checking condition ${condition} for contract ${contract.id}:`, error);
      return false;
    }
  }

  private async executeAction(contract: SmartContract, action: string): Promise<void> {
    console.log(`Executing action ${action} for contract ${contract.id}`);

    try {
      switch (action) {
        case 'markComplete':
          await storage.executeSmartContract(contract.id);
          await this.notifyContractParties(contract, 'completed');
          break;
        case 'releaseMilestonePayment': {
          const terms = contract.terms as any;
          const amount = terms?.compensation?.amount || 0;
          const currency = terms?.compensation?.currency || 'USD';
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
    } catch (error) {
      console.error(`Error executing action ${action}:`, error);
      throw error;
    }
  }

  private async notifyContractParties(contract: SmartContract, event: string): Promise<void> {
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

    const partyIds = [contract.creator_id, contract.counterparty_id];
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

interface ExecutionConditions {
  triggers: string[];
  prerequisites?: string[];
  automationRules: {
    condition: string;
    action: string;
  }[];
}
