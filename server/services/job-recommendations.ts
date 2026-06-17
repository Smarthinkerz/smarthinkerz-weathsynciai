import { getEmbeddings } from "./embeddings";

export async function getJobRecommendations(userSkills: string[], jobs: { description: string; name: string }[]) {
    try {
        // Log initial data
        console.log("Starting job matching...");
        console.log("User skills:", userSkills);
        console.log("Available jobs:", jobs.length);

        const results = [];

        // Simple matching algorithm
        for (const job of jobs) {
            const jobText = `${job.name} ${job.description}`.toLowerCase();
            const matchedSkills = [];

            // Check each skill against job
            for (const skill of userSkills) {
                const skillLower = skill.toLowerCase();
                // Direct match check
                if (jobText.includes(skillLower)) {
                    matchedSkills.push({
                        skill: skill,
                        confidence: 100
                    });
                    continue;
                }

                // Partial match check
                const skillWords = skillLower.split(/[\s&]+/);
                const matchCount = skillWords.filter(word => 
                    word.length > 2 && jobText.includes(word)
                ).length;

                if (matchCount > 0) {
                    const confidence = Math.round((matchCount / skillWords.length) * 100);
                    if (confidence >= 50) {
                        matchedSkills.push({
                            skill: skill,
                            confidence: confidence
                        });
                    }
                }
            }

            // If we found matches, add to results
            if (matchedSkills.length > 0) {
                const avgConfidence = Math.round(
                    matchedSkills.reduce((sum, m) => sum + m.confidence, 0) / matchedSkills.length
                );

                results.push({
                    ...job,
                    matchScore: avgConfidence,
                    matchedSkills: matchedSkills
                });

                console.log(`Matched job "${job.name}" with score ${avgConfidence}%`);
            }
        }

        // Sort and return top 10 matches
        const recommendations = results
            .sort((a, b) => b.matchScore - a.matchScore)
            .slice(0, 10);

        console.log(`Found ${recommendations.length} matches`);
        if (recommendations.length > 0) {
            console.log("Top match:", {
                name: recommendations[0].name,
                score: recommendations[0].matchScore,
                skills: recommendations[0].matchedSkills
            });
        }

        return recommendations;
    } catch (error) {
        console.error("Error in job recommendations:", error);
        return [];
    }
}