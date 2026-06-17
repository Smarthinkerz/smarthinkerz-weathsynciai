import fetch from 'node-fetch';

// Cache for embeddings to avoid repeated API calls
const embeddingsCache = new Map<string, number[]>();

// Function to get embeddings from OpenAI API with caching
export async function getEmbeddings(texts: string[]): Promise<number[][]> {
    try {
        if (!texts || texts.length === 0) {
            console.error("No texts provided for embeddings");
            return [];
        }

        // Check cache first
        const cachedResults = texts.map(text => embeddingsCache.get(text));
        if (cachedResults.every(result => result !== undefined)) {
            console.log("Using cached embeddings");
            return cachedResults as number[][];
        }

        const uncachedTexts = texts.filter(text => !embeddingsCache.has(text));
        console.log(`Generating embeddings for ${uncachedTexts.length} texts`);

        if (!process.env.OPENAI_API_KEY) {
            console.error("OpenAI API key not configured");
            return fallbackEmbeddings(texts);
        }

        const response = await fetch("https://api.openai.com/v1/embeddings", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "text-embedding-ada-002",
                input: uncachedTexts.map(text => text.slice(0, 8000)) // Respect token limit
            })
        });

        if (!response.ok) {
            const error = await response.text();
            console.error("Failed to get embeddings:", response.status, error);
            return fallbackEmbeddings(texts);
        }

        const data = await response.json();
        const newEmbeddings = data.data.map((item: any) => item.embedding);

        // Cache the new results
        uncachedTexts.forEach((text, index) => {
            embeddingsCache.set(text, newEmbeddings[index]);
        });

        // Return all embeddings in original order
        return texts.map(text => embeddingsCache.get(text)!);
    } catch (error) {
        console.error("Error in getEmbeddings:", error);
        return fallbackEmbeddings(texts);
    }
}

// Fallback function using simple word frequency embeddings
function fallbackEmbeddings(texts: string[]): number[][] {
    console.log("Using fallback embedding generation");
    return texts.map(text => {
        const words = text.toLowerCase().split(/\W+/);
        const vector = new Array(128).fill(0);

        // Create word frequency vector
        words.forEach(word => {
            let hash = 0;
            for (let i = 0; i < word.length; i++) {
                hash = ((hash << 5) - hash) + word.charCodeAt(i);
                hash = hash & hash;
            }
            vector[Math.abs(hash) % vector.length] += 1;
        });

        // Normalize vector
        const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
        return magnitude === 0 ? vector : vector.map(val => val / magnitude);
    });
}

// Function to calculate cosine similarity
export function cosineSimilarity(vec1: number[], vec2: number[]): number {
    if (!vec1 || !vec2 || vec1.length !== vec2.length) {
        console.error("Invalid vectors for similarity calculation");
        return 0;
    }

    try {
        let dotProduct = 0;
        let norm1 = 0;
        let norm2 = 0;

        for (let i = 0; i < vec1.length; i++) {
            dotProduct += vec1[i] * vec2[i];
            norm1 += vec1[i] * vec1[i];
            norm2 += vec2[i] * vec2[i];
        }

        if (norm1 === 0 || norm2 === 0) return 0;

        return Math.max(-1, Math.min(1, dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2))));
    } catch (error) {
        console.error("Error calculating similarity:", error);
        return 0;
    }
}

// Function to get job recommendations based on user skills
export async function getJobRecommendations(userSkills: string[], jobs: { description: string }[]) {
    console.log("User skills:", userSkills);

    // Get embeddings for user skills
    const skillEmbeddings = await getEmbeddings(userSkills);
    if (skillEmbeddings.length === 0) {
        console.log("Failed to get skill embeddings.");
        return [];
    }

    console.log("Found jobs:", jobs.length);

    if (!jobs || jobs.length === 0) {
        console.log("No jobs found.");
        return [];
    }

    // Get embeddings for job descriptions
    const jobDescriptions = jobs.map((job: any) => job.description);
    const jobEmbeddings = await getEmbeddings(jobDescriptions);

    // Match jobs based on skill similarity
    const THRESHOLD = 0.75;  // Adjust threshold if needed
    const recommendedJobs = jobs.filter((job: any, index: number) => {
        return skillEmbeddings.some(skillVec => {
            const similarity = cosineSimilarity(skillVec, jobEmbeddings[index]);
            return similarity >= THRESHOLD;
        });
    });

    console.log("Recommended jobs:", recommendedJobs.length);
    return recommendedJobs;
}