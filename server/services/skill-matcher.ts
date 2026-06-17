import { User, Opportunity } from "@shared/schema";
import { getSemanticSimilarity } from "./embeddings";

export class SkillMatcher {
  async analyzeSkillMatch(user: User, opportunity: Opportunity): Promise<{
    score: number;
    matchDetails: string[];
  }> {
    try {
      console.log(`Analyzing skill match for: ${user.id} with ${opportunity.name}`);
      const details: string[] = [];

      // Extract job content
      const jobTitle = opportunity.name;
      const jobDesc = opportunity.description;

      let totalScore = 0;
      let maxPossibleScore = user.skills.length;

      // Analyze each skill
      for (const skill of user.skills) {
        try {
          // Check title match (weighted higher)
          const titleScore = await getSemanticSimilarity(skill, jobTitle);

          // Check description match
          const descScore = await getSemanticSimilarity(skill, jobDesc);

          // Weighted average (title counts more)
          let skillScore = (titleScore * 0.6) + (descScore * 0.4);

          // Record strong matches
          if (titleScore > 0.8) {
            details.push(`Strong title match: ${skill}`);
            skillScore *= 1.2; // Bonus for very strong title match
          }
          if (descScore > 0.8) {
            details.push(`Strong description match: ${skill}`);
          }

          // Add to total if significant match
          if (skillScore > 0.5) {
            totalScore += skillScore;
            details.push(`Skill match: ${skill} (Score: ${skillScore.toFixed(2)})`);
          }

        } catch (error) {
          console.error(`Error analyzing skill: ${skill}`, error);
          maxPossibleScore--; // Reduce denominator if skill analysis fails
          continue;
        }
      }

      // Calculate final score (0-1)
      const finalScore = maxPossibleScore > 0 ? 
        Math.min(totalScore / maxPossibleScore, 1) : 0;

      return {
        score: finalScore,
        matchDetails: details.length > 0 ? 
          details : ["No significant skill matches found"]
      };

    } catch (error) {
      console.error("Skill matching failed:", error);
      throw error;
    }
  }
}

export const skillMatcher = new SkillMatcher();