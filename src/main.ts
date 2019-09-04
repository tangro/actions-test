import * as core from '@actions/core';
import { GitHubContext } from '@tangro/tangro-github-toolkit';
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

    await createChecksFromTestResults({
      pathToTestOutput: './test_results.json',
      context
    });

    core.debug('debug message');
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
