// SPDX-FileCopyrightText: Embedded Academy contributors
// SPDX-License-Identifier: MIT

const modules = Array.from({ length: 11 }, (_, i) => `m${String(i).padStart(2, '0')}`);

export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'content', 'fix', 'docs', 'refactor', 'test', 'build', 'ci', 'chore', 'revert'],
    ],
    'scope-enum': [2, 'always', ['site', 'anim', 'ui', 'boards', 'labs', 'deps', 'docs', 'repo', ...modules]],
    'subject-case': [2, 'never', ['sentence-case', 'start-case', 'pascal-case', 'upper-case']],
    'header-max-length': [2, 'always', 72],
    'trailer-exists': [2, 'always', 'Signed-off-by:'],
  },
};
