import { AggregatedResult } from '@jest/test-result';
import { github, GitHubContext } from '@tangro/tangro-github-toolkit';

function chunkArray<T>(
  inputArray: Array<T>,
  chunkSize: number
): Array<Array<T>> {
  return inputArray.reduce(
    (resultArray: Array<Array<T>>, item: T, index: number) => {
      const chunkIndex = Math.floor(index / chunkSize);

      if (!resultArray[chunkIndex]) {
        resultArray[chunkIndex] = []; // start a new chunk
      }

      resultArray[chunkIndex].push(item);

      return resultArray;
    },
    []
  );
}

function parseTestOutput(pathToTestOutput: string) {
  const testResults = require(pathToTestOutput) as AggregatedResult;
  if (testResults.numFailedTestSuites > 0) {
    const testSuitesWithFailingTests = testResults.testResults.filter(
      suite => suite.numFailingTests > 0
    );
    return testSuitesWithFailingTests
      .map(suite => {
        const failingTests = suite.testResults.filter(
          test => test.status === 'failed'
        );
        return failingTests.map(test => {
          return {
            title: test.ancestorTitles.join(' > ') + ' > ' + test.title,
            failureMessages: test.failureMessages.join('\n\n'),
            location: test.location,
            path: suite.testFilePath
          };
        });
      })
      .flat();
  } else {
    return [];
  }
}

export async function createChecksFromTestResults({
  pathToTestOutput,
  context
}: {
  pathToTestOutput: string;
  context: GitHubContext;
}) {
  const name = context.action;
  const ref = context.ref;
  const [owner, repo] = context.repository.split('/');
  const checkRunsResult = await github.checks.listForRef({
    owner,
    repo,
    ref,
    status: 'in_progress'
  });

  if (checkRunsResult.data.check_runs.length === 0) {
    throw new Error(`Could not find check run for action: ${name}`);
  } else {
    const checkRun = checkRunsResult.data.check_runs[0];
    const testResults = parseTestOutput(pathToTestOutput);
    // GitHub only allows to send 50 checks at a time
    const chunkedTestResults = chunkArray(testResults, 50);
    console.log('testResults', testResults);
    console.log('chunkedTestResults', chunkedTestResults);
    for (const chunk of chunkedTestResults) {
      const checks = {
        title: 'Test results',
        summary: 'We need a summary',
        annotations: chunk.map(testResult => {
          return {
            path: testResult.path,
            start_line: testResult.location!.line,
            end_line: testResult.location!.line,
            annotation_level: 'failure' as 'failure',
            title: testResult.title,
            message: testResult.failureMessages
          };
        })
      };

      console.log('checks', JSON.stringify(checks));

      const response = await github.checks.update({
        owner,
        repo,
        check_run_id: checkRun.id,
        name: checkRun.name,
        output: checks
      });

      console.log('response', response);

      console.log(
        'listForRef',
        JSON.stringify(
          await github.checks.listForRef({
            owner,
            repo,
            ref
          }),
          null,
          2
        )
      );

      console.log(
        'listAnnotations',
        await github.checks.listAnnotations({
          owner,
          repo,
          check_run_id: checkRun.id
        })
      );
    }

    const aggregatedResult = require(pathToTestOutput) as AggregatedResult;
    return aggregatedResult;
  }
}
