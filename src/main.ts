import * as core from '@actions/core';
import {
  GitHubContext,
  setStatus,
  createComment
} from '@tangro/tangro-github-toolkit';
import path from 'path';
import { createChecksFromTestResults } from './test/checkRun';
import { runTest } from './test/runTest';
import { parseTests } from './test/parseTests';
import { FormattedTestResults } from '@jest/test-result/build/types';
import { Result } from './Result';

async function wrapWithSetStatus<T>(
  context: GitHubContext<{}>,
  step: string,
  code: () => Promise<Result<T>>
) {
  setStatus({
    context,
    step,
    description: `Running ${step}`,
    state: 'pending'
  });

  try {
    const result = await code();
    setStatus({
      context,
      step,
      description: result.shortText,
      state: result.isOkay ? 'success' : 'failure'
    });
    return result;
  } catch (error) {
    setStatus({
      context,
      step,
      description: `Failed: ${step}`,
      state: 'failure'
    });
    core.setFailed(`CI failed at step: ${step}`);
  }
}

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

      const formattedTestResults = require(pathToTestOutput) as FormattedTestResults;
      const testSummary = parseTests(formattedTestResults);

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
    core.setFailed(error.message);
  }
}

run();
