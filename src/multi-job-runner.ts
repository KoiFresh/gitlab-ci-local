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
    const execptions: unknown[] = [];

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
        }).catch((e) => execptions.push(e));

        if (job.interactive) {
            await execution;
        }
    }

    await Promise.all(activeJobsById.values());
    await throwException(execptions);
    await debugJobs(jobsToDebug);
}

async function throwException (execptions: unknown[]): Promise<void> {
    if (execptions.length > 0) {
        throw execptions[0];
    }
}

async function debugJobs (jobs: Job[]): Promise<void> {
    while (jobs.length > 0) {
        const job = jobs.shift();
        if (job) {
            await job.debug();
        }
    }
}
