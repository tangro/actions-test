import * as core from '@actions/core';
import {
  GitHubContext,
  wrapWithSetStatus,
  createComment
} from '@tangro/tangro-github-toolkit';
import path from 'path';
import * as fs from 'fs';
import { createChecksFromTestResults } from './test/checkRun';
import { runTest } from './test/runTest';
import { parseTests } from './test/parseTests';
import type { FormattedTestResults } from '@jest/test-result';

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
    ) as GitHubContext<{}>;

    await runTest();

    const [owner, repo] = context.repository.split('/');

    const pathToTestOutput = path.join(
      process.env.RUNNER_WORKSPACE as string,
      repo,
      'test_results.json'
    );

    const testSummary = await wrapWithSetStatus(context, 'test', async () => {
      const testResults = await createChecksFromTestResults({
        pathToTestOutput,
        context
      });

      const testSummary = parseTests(testResults);

      if (testResults.numFailedTestSuites > 0) {
        core.setFailed('Tests failed. See details.');
      }

      return testSummary;
    });

    if (core.getInput('post-comment') === 'true' && testSummary) {
      await createComment({
        context,
        comment: testSummary.text
      });
    }
  } catch (error) {
    core.setFailed((error as Error).message);
  }
}

run();
