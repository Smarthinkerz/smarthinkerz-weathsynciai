import { storage } from "../storage";
import { Opportunity, User } from "@shared/schema";
import { skillMatcher } from "./skill-matcher";

interface LearningMetrics {
  successRate: number;
  totalAttempts: number;
  successfulAttempts: number;
  lastUpdated: number;
}

interface UserPreference {
  userId: number;
  preferredSkills: string[];
  preferredEarningsRange: { min: number; max: number };
  successfulMatches: Set<number>; // Opportunity IDs
  failedMatches: Set<number>; // Opportunity IDs
  lastUpdated: number;
}

export class AgentCollaborationService {
  private learningMetrics: Map<string, LearningMetrics> = new Map();
  private userPreferences: Map<number, UserPreference> = new Map();
  private readonly LEARNING_THRESHOLD = 0.7; // 70% success rate threshold for learning
  private readonly PREFERENCE_WEIGHT = 0.3; // 30% weight for user preferences

  async scoutOpportunities(user: User): Promise<Opportunity[]> {
    try {
      console.log("Starting opportunity scouting for user with skills:", user.skills);

      // Get available opportunities
      const opportunities = await storage.getOpportunities();
      const availableOpps = opportunities.filter(opp => opp.status === "available");
      console.log(`Found ${availableOpps.length} available opportunities to analyze`);

      // Get or initialize user preferences
      const userPref = this.getUserPreferences(user.id);

      // Analyze each opportunity with learning-enhanced matching
      const scoredOpportunitiesPromises = availableOpps.map(async (opp) => {
        try {
          // Get base match score
          const { score: baseScore, matchDetails } = await skillMatcher.analyzeSkillMatch(user, opp);

          // Apply learning adjustments
          const adjustedScore = this.applyLearningAdjustments(baseScore, user.id, opp, userPref);

          console.log(`Scout analyzed ${opp.name} - Base Score: ${baseScore}, Adjusted Score: ${adjustedScore}`);
          console.log(`Match details:`, matchDetails);

          // Record scouting action
          await this.recordAgentAction(user.id, opp.id, {
            type: 'scout',
            success: adjustedScore > 0,
            details: matchDetails,
            context: {
              baseScore,
              adjustedScore,
              userPreferences: Array.from(userPref.preferredSkills)
            }
          });

          return { opportunity: opp, score: adjustedScore, matchDetails };
        } catch (error) {
          console.error(`Failed to analyze opportunity ${opp.id}:`, error);
          return { opportunity: opp, score: 0, matchDetails: [] };
        }
      });

      const scoredOpportunities = await Promise.all(scoredOpportunitiesPromises);

      // Filter and sort opportunities based on learning-adjusted scores
      const recommendedOpportunities = scoredOpportunities
        .filter(({ score }) => score > 0)
        .sort((a, b) => b.score - a.score)
        .map(({ opportunity }) => opportunity);

      // Update metrics after recommendations
      this.updateLearningMetrics('scout', recommendedOpportunities.length > 0);

      console.log(`Scout found ${recommendedOpportunities.length} recommended opportunities`);
      return recommendedOpportunities;
    } catch (error) {
      console.error('Scout agent failed:', error);
      this.updateLearningMetrics('scout', false);
      return [];
    }
  }

  async negotiateMatch(user: User, opportunity: Opportunity): Promise<boolean> {
    try {
      console.log(`Negotiating match for user ${user.id} with opportunity ${opportunity.id}`);

      // Get previous scouting results and learning history
      const scoutingHistory = await this.getAgentHistory(user.id, opportunity.id, 'scout');
      const userPref = this.getUserPreferences(user.id);

      // Check if this opportunity was previously successful or failed
      const wasSuccessful = userPref.successfulMatches.has(opportunity.id);
      const wasFailed = userPref.failedMatches.has(opportunity.id);

      // Adjust negotiation strategy based on history
      let negotiationThreshold = 0.5; // Base threshold
      if (wasSuccessful) {
        negotiationThreshold *= 0.8; // Lower threshold for previously successful matches
      } else if (wasFailed) {
        negotiationThreshold *= 1.2; // Raise threshold for previously failed matches
      }

      // Perform skill matching with learning context
      const { score, matchDetails } = await skillMatcher.analyzeSkillMatch(user, opportunity);
      const adjustedScore = this.applyLearningAdjustments(score, user.id, opportunity, userPref);

      console.log(`Negotiation analysis - Base Score: ${score}, Adjusted Score: ${adjustedScore}`);
      console.log(`Using negotiation threshold: ${negotiationThreshold}`);

      const isValidMatch = adjustedScore >= negotiationThreshold;

      // Record negotiation action with enhanced context
      await this.recordAgentAction(user.id, opportunity.id, {
        type: 'negotiate',
        success: isValidMatch,
        details: matchDetails,
        context: {
          previousScoutingScore: scoutingHistory[0]?.success,
          baseScore: score,
          adjustedScore,
          threshold: negotiationThreshold,
          previousSuccess: wasSuccessful,
          previousFailure: wasFailed
        }
      });

      // Update learning metrics
      this.updateLearningMetrics('negotiate', isValidMatch);

      return isValidMatch;
    } catch (error) {
      console.error('Negotiation agent failed:', error);
      this.updateLearningMetrics('negotiate', false);
      return false;
    }
  }

  async executeOpportunityPursuit(user: User, opportunity: Opportunity): Promise<boolean> {
    try {
      console.log(`Executing pursuit for user ${user.id} on opportunity ${opportunity.id}`);

      // Get previous negotiation results
      const negotiationHistory = await this.getAgentHistory(user.id, opportunity.id, 'negotiate');
      const userPref = this.getUserPreferences(user.id);

      if (!negotiationHistory[0]?.success) {
        console.log('Cannot execute pursuit - negotiation was unsuccessful');
        return false;
      }

      const result = await storage.updateOpportunityStatus(opportunity.id, "pursued");

      // Update user preferences based on execution result
      if (result) {
        userPref.successfulMatches.add(opportunity.id);
        userPref.failedMatches.delete(opportunity.id);

        // Update preferred earnings range
        userPref.preferredEarningsRange.min = Math.min(userPref.preferredEarningsRange.min, opportunity.earnings);
        userPref.preferredEarningsRange.max = Math.max(userPref.preferredEarningsRange.max, opportunity.earnings);
      } else {
        userPref.failedMatches.add(opportunity.id);
        userPref.successfulMatches.delete(opportunity.id);
      }
      userPref.lastUpdated = Date.now();

      // Record execution action with enhanced context
      await this.recordAgentAction(user.id, opportunity.id, {
        type: 'execute',
        success: !!result,
        details: ['Opportunity status updated to pursued'],
        context: {
          negotiationSuccess: negotiationHistory[0].success,
          matchDetails: negotiationHistory[0].details,
          userPreferencesUpdated: true,
          earningsInRange: opportunity.earnings >= userPref.preferredEarningsRange.min && 
                          opportunity.earnings <= userPref.preferredEarningsRange.max
        }
      });

      // Update learning metrics
      this.updateLearningMetrics('execute', !!result);

      return !!result;
    } catch (error) {
      console.error('Execution agent failed:', error);
      this.updateLearningMetrics('execute', false);
      return false;
    }
  }

  private getUserPreferences(userId: number): UserPreference {
    if (!this.userPreferences.has(userId)) {
      this.userPreferences.set(userId, {
        userId,
        preferredSkills: [],
        preferredEarningsRange: { min: 0, max: Infinity },
        successfulMatches: new Set(),
        failedMatches: new Set(),
        lastUpdated: Date.now()
      });
    }
    return this.userPreferences.get(userId)!;
  }

  private updateLearningMetrics(actionType: string, success: boolean) {
    const metrics = this.learningMetrics.get(actionType) || {
      successRate: 0,
      totalAttempts: 0,
      successfulAttempts: 0,
      lastUpdated: Date.now()
    };

    metrics.totalAttempts++;
    if (success) metrics.successfulAttempts++;
    metrics.successRate = metrics.successfulAttempts / metrics.totalAttempts;
    metrics.lastUpdated = Date.now();

    this.learningMetrics.set(actionType, metrics);
    console.log(`Updated learning metrics for ${actionType}:`, metrics);
  }

  private applyLearningAdjustments(
    baseScore: number,
    userId: number,
    opportunity: Opportunity,
    userPref: UserPreference
  ): number {
    let adjustedScore = baseScore;

    // Adjust based on learning metrics
    const scoutMetrics = this.learningMetrics.get('scout');
    if (scoutMetrics && scoutMetrics.successRate > this.LEARNING_THRESHOLD) {
      adjustedScore *= 1.1; // Boost score if scout has high success rate
    }

    // Adjust based on user preferences
    if (userPref.successfulMatches.has(opportunity.id)) {
      adjustedScore *= (1 + this.PREFERENCE_WEIGHT); // Boost score for previously successful matches
    }
    if (userPref.failedMatches.has(opportunity.id)) {
      adjustedScore *= (1 - this.PREFERENCE_WEIGHT); // Reduce score for previously failed matches
    }

    // Adjust based on earnings preferences
    if (opportunity.earnings >= userPref.preferredEarningsRange.min &&
        opportunity.earnings <= userPref.preferredEarningsRange.max) {
      adjustedScore *= 1.1; // Boost score if earnings are in preferred range
    }

    return Math.min(1, Math.max(0, adjustedScore)); // Ensure score stays between 0 and 1
  }

  // Agent action tracking
  private agentHistory: AgentAction[] = [];

  private async recordAgentAction(userId: number, opportunityId: number, action: Partial<AgentAction>) {
    const fullAction: AgentAction = {
      userId,
      opportunityId,
      timestamp: Date.now(),
      type: action.type!,
      success: action.success ?? false,
      details: action.details ?? [],
      context: action.context ?? {}
    };

    this.agentHistory.push(fullAction);
    console.log(`Recorded ${action.type} action:`, fullAction);
  }

  private async getAgentHistory(userId: number, opportunityId: number, type?: string): Promise<AgentAction[]> {
    return this.agentHistory
      .filter(action => 
        action.userId === userId && 
        action.opportunityId === opportunityId &&
        (!type || action.type === type)
      )
      .sort((a, b) => b.timestamp - a.timestamp);
  }
}

interface AgentAction {
  userId: number;
  opportunityId: number;
  timestamp: number;
  type: 'scout' | 'negotiate' | 'execute';
  success: boolean;
  details: string[];
  context: Record<string, any>;
}

export const agentCollaboration = new AgentCollaborationService();