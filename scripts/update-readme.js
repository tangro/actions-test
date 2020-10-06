const ejs = require('ejs');
const fs = require('fs');
const path = require('path');
const { github } = require('@tangro/tangro-github-toolkit');
const package = require('../package.json');

const getActionWithVersion = async (owner, repo) => {
  const response = await github.repos.listTags({ owner, repo });
  const latestTag = response.data[0].name;
  // GitHub actions/checkout uses the vX (e.g. v2) tag for all minor and patch releases under the vX (v2) major version.
  // So it's better to use the major version instead of a fixed patch version
  // actions/setup-node does not yet support this - :(
  const latestVersion =
    repo === 'checkout' ? latestTag.split('.')[0] : latestTag;
  return `${owner}/${repo}@${latestVersion}`;
};

async function main() {
  const version = `v${package.version}`;
  const name = package.name.replace('@tangro', 'tangro');

  const variables = {
    version,
    name,
    uses: `${name}@${version}`,
    actions: {
      'setup-node': await getActionWithVersion('actions', 'setup-node'),
      checkout: await getActionWithVersion('actions', 'checkout')
    },
    tangro: {
      'actions-deploy': await getActionWithVersion('tangro', 'actions-deploy')
    }
  };

  const readmeTemplateContent = fs
    .readFileSync(path.join(__dirname, '..', 'templates', 'README.md'))
    .toString('utf-8');

  const output = ejs.render(readmeTemplateContent, variables);

  fs.writeFileSync(path.join(__dirname, '..', 'README.md'), output);
}

if (package.name === 'tangro-actions-template') {
  console.warn(
    'Do not run this script inside the tangro-actions-template repository. The tangro-actions-template README should not be overwritten.'
  );
  console.log(
    'If you are developing a new action, you forgot to change the name in the package.json'
  );
} else if (!process.env.GITHUB_TOKEN || process.env.GITHUB_TOKEN.length === 0) {
  console.warn(
    'To run this script you need a personal access token stored in your environment variables called GITHUB_TOKEN. Please create one: https://github.com/settings/tokens/new and add it to your environment variables'
  );
} else {
  main()
    .then(() => {
      console.log('Successfully updated README.md');
    })
    .catch(error => {
      console.error(error);
    });
}
