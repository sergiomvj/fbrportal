export function calculateAverageGenerationSeconds(
  jobs: Array<{ created_at?: string | null; started_at?: string | null; completed_at?: string | null }>,
): number {
  const durations = jobs
    .map((job) => {
      if (!job.completed_at) return null;
      const startedAt = Date.parse(job.started_at ?? job.created_at ?? '');
      const completedAt = Date.parse(job.completed_at);
      if (!Number.isFinite(startedAt) || !Number.isFinite(completedAt) || completedAt < startedAt) return null;
      return Math.round((completedAt - startedAt) / 1000);
    })
    .filter((value): value is number => value !== null);

  if (durations.length === 0) return 0;
  return Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length);
}
