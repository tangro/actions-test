import * as core from '@actions/core';

async function run() {
  try {
    if (!process.env.ENV_VARIABLE || process.env.ENV_VARIABLE.length === 0) {
      throw new Error(
        'You have to set the ENV_VARIABLE in your secrets configuration'
      );
    }
    const context = JSON.parse(process.env.GITHUB_CONTEXT || '');

    core.debug('debug message');
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
