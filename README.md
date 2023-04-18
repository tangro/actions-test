# tangro/actions-test

Run jest tests, add annotations to failing tests. By default it runs `npm run test:ci` but it can be configured: `npm run ${command}`.

# Versions

You can use a specific `version` of this action. The latest published version is `v1.1.13`. You can also use `latest` to always get the latest version.

# Example job

```yml
test:
  runs-on: ubuntu-latest
  steps:
    - name: Checkout latest code
      uses: actions/checkout@v3
    - name: Use Node.js 16.x
      uses: actions/setup-node@v3.6.0
      with:
        node-version: 16.x
    - name: Run npm install
      run: npm install
    - name: Run tests
      uses: tangro/actions-test@v1.1.13
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        GITHUB_CONTEXT: ${{ toJson(github) }}
```

> **Attention** Do not forget to pass the `GITHUB_TOKEN` and `GITHUB_CONTEXT` to the `tangro/actions-test` action

Steps the example job will perform:

1. Check out the latest code
2. Use node v12
3. Run `npm install`
4. (this action) Run the tests, add the annotations and add a status to the commit

# Usage

The action will call `npm run ${command}`. The `${command}` can be specified by passing an input variable `command` to the action. It defaults to `test:ci`. The `command` should look like this: `jest --testLocationInResults --ci --outputFile=test_results.json --json`.

The action will set a status to the commit to `pending` under the context `Tangro CI/coverage`. When it finishes it will set the test result as the description of the status.

It is also possible that the action posts a comment with the result to the commit. You have to set `post-comment` to `true`.

Additionally the test results get written to `./test_result/index.html`. This file can be deployed to a static file server and be linked inside a status.

## Example with a different command

```yml
- name: Run tests
  uses: tangro/actions-test@v1.1.13
  with:
    command: 'tests'
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    GITHUB_CONTEXT: ${{ toJson(github) }}
```

## Example with posting the result as a comment

```yml
- name: Run tests
  uses: tangro/actions-test@v1.1.13
  with:
    post-comment: true
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    GITHUB_CONTEXT: ${{ toJson(github) }}
```

# Using with a static file server

You can also publish the results to a static file server. The action will write the results into `test_result/index.html`.

You can publish the results with our custom [deploy actions](https://github.com/tangro/actions-deploy)

```yml
test:
  runs-on: ubuntu-latest
  steps:
    - name: Checkout latest code
      uses: actions/checkout@v3
    - name: Use Node.js 16.x
      uses: actions/setup-node@v3.6.0
      with:
        node-version: 16.x
    - name: Authenticate with GitHub package registry
      run: echo "//npm.pkg.github.com/:_authToken=${{ secrets.ACCESS_TOKEN }}" >> ~/.npmrc
    - name: Run npm install
      run: npm install
    - name: Run tests
      uses: tangro/actions-test@v1.1.13
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        GITHUB_CONTEXT: ${{ toJson(github) }}
    - name: Zip license check result
      if: always()
      run: |
        cd test_result
        zip --quiet --recurse-paths ../test_result.zip *
    - name: Deploy test result
      if: always()
      uses: tangro/actions-deploy@v1.2.15
      with:
        context: auto
        zip-file: test_result.zip
        deploy-url: ${{secrets.DEPLOY_URL}}
        project: tests
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        GITHUB_CONTEXT: ${{ toJson(github) }}
        DEPLOY_PASSWORD: ${{ secrets.DEPLOY_PASSWORD }}
        DEPLOY_USER: ${{ secrets.DEPLOY_USER }}
```

> **Attention** Do not forget to use the correct `DEPLOY_URL` and provide all the tokens the actions need.

# Development

Follow the guide of the [tangro-actions-template](https://github.com/tangro/tangro-actions-template)

# Scripts

- `npm run update-readme` - Run this script to update the README with the latest versions.

  > You do not have to run this script, since it is run automatically by the release action

- `npm run update-dependencies` - Run this script to update all the dependencies
