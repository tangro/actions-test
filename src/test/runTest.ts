import * as core from '@actions/core';
import { exec, type ExecOptions } from '@actions/exec';
import * as fs from 'fs';
import path from 'path';

export async function runTest() {
  let output = '';
  const options: ExecOptions = {
    ignoreReturnCode: true,

    listeners: {
      stderr: (data: Buffer) => {
        output += data.toString();
      }
    }
  };
  const command = core.getInput('command') || 'test:ci';

  await exec('npm', ['run', command], options);

  try {
    console.log('Writing test log to test_result/index.html');
    fs.mkdirSync('test_result');
    fs.writeFileSync(
      path.join('test_result', 'index.html'),
      `<html><body><pre><code>${output}</code></pre></body></html>`
    );
  } catch (error) {
    console.error(error);
    throw error;
  }
}
