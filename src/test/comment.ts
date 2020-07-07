import { TestResult } from './parseTests';
import { Result } from '@tangro/tangro-github-toolkit';

export function createCommentText(results: Result<TestResult>) {
  return `\n## test summary
${results.text}`;
}
