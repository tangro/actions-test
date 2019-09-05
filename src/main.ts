import * as core from '@actions/core';
import { GitHubContext, setStatus } from '@tangro/tangro-github-toolkit';
import path from 'path';
import { createChecksFromTestResults } from './test/checkRun';
import { runTest } from './test/runTest';

async function run() {
  try {
    if (
      !process.env.GITHUB_CONTEXT ||
      process.env.GITHUB_CONTEXT.length === 0
    ) {
      throw new Error(
        'You have to set the GITHUB_CONTEXT in your configuration'
      );
    }
    if (!process.env.GITHUB_TOKEN || process.env.GITHUB_TOKEN.length === 0) {
      throw new Error('You have to set the GITHUB_TOKEN in your configuration');
    }

    const context = JSON.parse(
      process.env.GITHUB_CONTEXT || ''
    ) as GitHubContext;

    await runTest();

    const [owner, repo] = context.repository.split('/');

    const testResults = await createChecksFromTestResults({
      pathToTestOutput: path.join(
        process.env.RUNNER_WORKSPACE as string,
        repo,
        'test_results.json'
      ),
      context
    });

    if (testResults.formattedTestResults.numFailedTestSuites > 0) {
      core.setFailed('Tests failed. See details.');
    }

    await setStatus({
      context,
      description: testResults.testSummary.shortText,
      state: 'failure',
      step: 'test'
    });
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
