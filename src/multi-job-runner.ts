import {Job} from "./job";


export type MultiJobRunnerOptions = {
    concurrency: number;
};

/**
 * Run multiple jobs in parallel, if a job is interactive it will no be run in parallel.
 *
 * @param jobs the rubs to run in parallel
 * @param options parallelization options
 */
export async function runMultipleJobs (jobs: Job[], options: MultiJobRunnerOptions): Promise<void> {
    const activeJobsById: Map<number, Promise<void>> = new Map();
    const jobsToDebug: Job[] = [];

    for (const job of jobs) {
        await debugJobs(jobsToDebug);

        if (job.interactive) {
            await Promise.all(activeJobsById.values());
        }

        if (activeJobsById.size >= options.concurrency) {
            await Promise.any(activeJobsById.values());
        }

        const execution = job.start();
        activeJobsById.set(job.jobId, execution);
        execution.then(() => {
            activeJobsById.delete(job.jobId);
            if (job.argv.debug && job.jobStatus === "failed") {
                jobsToDebug.push(job);
            }
        });

        if (job.interactive) {
            await execution;
        }
    }

    await Promise.all(activeJobsById.values());
    await debugJobs(jobsToDebug);
}

async function debugJobs (jobs: Job[]): Promise<void> {
    while (jobs.length > 0) {
        const job = jobs.shift();
        if (job) {
            await job.debug();
        }
    }
}
