import { storage } from "../storage";
import { InsertOpportunity } from "@shared/schema";
import fetch from 'node-fetch';
import { getEmbeddings } from "./embeddings";

interface IndeedJob {
    job_id: string;
    title: string;
    company_name: string;
    location: string;
    description: string;
    url: string;
    estimated_salary?: {
        maximum: number;
        minimum: number;
    };
    job_types: string[];
    posted_time: string;
}

async function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Function to fetch real-time jobs from Indeed API
async function fetchRealTimeJobs(query: string, page = 1): Promise<IndeedJob[]> {
    try {
        console.log(`Fetching real-time jobs for "${query}" (Page ${page})`);

        const apiKey = process.env.RAPID_API_KEY;
        if (!apiKey) {
            throw new Error("RAPID_API_KEY not configured");
        }

        const response = await fetch('https://indeed-jobs-api.p.rapidapi.com/indeed-jobs', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-RapidAPI-Key': apiKey,
                'X-RapidAPI-Host': 'indeed-jobs-api.p.rapidapi.com'
            },
            body: JSON.stringify({
                query,
                location: "remote",
                page_number: page.toString(),
                level: "all",
                sort_by: "date", // Most recent jobs first
                job_type: ["fulltime", "contract", "parttime"],
                remote: true,
                posted_within: "1d", // Only get jobs posted in last 24 hours
                fetch_full_text: "yes"
            })
        });

        if (!response.ok) {
            throw new Error(`Indeed API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        if (!data.jobs || !Array.isArray(data.jobs)) {
            console.error("Invalid API response format:", data);
            return [];
        }

        console.log(`Retrieved ${data.jobs.length} jobs from Indeed API`);
        return data.jobs;
    } catch (error) {
        console.error(`Error fetching jobs for query "${query}" (Page ${page}):`, error);
        return [];
    }
}

export async function syncJobOpportunities(): Promise<void> {
    console.log("Starting real-time job synchronization...");
    let totalJobs = 0;

    // Clear stale jobs first
    await storage.clearStaleJobs();

    const queries = [
        "software engineer remote",
        "web developer remote", 
        "frontend developer remote",
        "backend developer remote",
        "javascript developer remote",
        "react developer remote",
        "node.js developer remote",
        "python developer remote",
        "business development remote",
        "digital marketing remote",
        "content creator remote",
        "virtual reality developer remote",
        "ar developer remote"
    ];

    for (const query of queries) {
        console.log(`Processing query: ${query}`);

        // Fetch 3 pages of results for each query
        for (let page = 1; page <= 3; page++) {
            const jobs = await fetchRealTimeJobs(query, page);

            for (const job of jobs) {
                try {
                    // Skip if job already exists
                    const existing = await storage.getOpportunityByExternalId(job.job_id);
                    if (existing) {
                        console.log(`Job ${job.job_id} already exists, skipping`);
                        continue;
                    }

                    // Generate embeddings for better matching
                    const jobContent = `${job.title} ${job.description}`;
                    const embeddings = await getEmbeddings([jobContent]);

                    const opportunity: InsertOpportunity = {
                        name: job.title,
                        description: job.description,
                        earnings: job.estimated_salary
                            ? Math.floor((job.estimated_salary.minimum + job.estimated_salary.maximum) / 2)
                            : 0,
                        url: job.url,
                        location: job.location,
                        company: job.company_name,
                        source: "indeed",
                        externalId: job.job_id,
                        postedAt: new Date(job.posted_time),
                        embeddings: embeddings[0]
                    };

                    await storage.createOpportunity(opportunity);
                    totalJobs++;
                    console.log(`Added real-time job: ${opportunity.name} (${opportunity.company})`);

                    // Rate limiting between job saves
                    await delay(500);
                } catch (error) {
                    console.error(`Error processing job ${job.job_id}:`, error);
                    continue;
                }
            }

            // Rate limiting between pages
            await delay(2000);
        }
    }

    console.log(`Job sync completed. Added ${totalJobs} new opportunities.`);
}

// Retry mechanism with exponential backoff
export async function syncJobsWithRetry(maxRetries = 3): Promise<void> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            await syncJobOpportunities();
            return;
        } catch (error) {
            console.error(`Job sync failed on attempt ${attempt}:`, error);
            if (attempt === maxRetries) throw error;
            await delay(Math.pow(2, attempt) * 1000);
        }
    }
}