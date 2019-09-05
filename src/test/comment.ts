import { Result } from '../Result';
import { TestResult } from './parseTests';

export function createCommentText(results: Result<TestResult>) {
  return `\n## test summary
${results.text}`;
}
