import * as core from '@actions/core';
import { GitHubContext } from '@tangro/tangro-github-toolkit';
import path from 'path';
import { createChecksFromTestResults } from './test/checkRun';
import { runTest } from './test/runTest';
import * as fs from 'fs';

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

    console.log(fs.readdirSync(process.env.RUNNER_WORKSPACE as string));
    console.log(
      fs.readdirSync(
        path.join(process.env.RUNNER_WORKSPACE as string, 'tangro-stella-data')
      )
    );

    const [owner, repo] = context.repository.split('/');

    const testResults = await createChecksFromTestResults({
      pathToTestOutput: path.join(
        process.env.RUNNER_WORKSPACE as string,
        repo,
        'test_results.json'
      ),
      context
    });

    if (testResults.numFailedTestSuites > 0) {
      core.setFailed('Tests failed. See details.');
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
