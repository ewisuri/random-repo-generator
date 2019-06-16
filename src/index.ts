import 'source-map-support/register';
import { argv } from 'yargs';

import { Generator } from './generator';

const generator = new Generator({
  allowMerge: argv.allowMerge !== 'false',
  allowRebase: argv.allowRebase !== 'false',
  commitCount: parseInt(<string>argv.commitCount) || 500,
  directory: <string>argv.directory,
  maxTreeWidth: parseInt(<string>argv.maxTreeWidth) || 10,
  minTreeWidth: parseInt(<string>argv.minTreeWidth) || 1
});


(async () => {
  try {
    await generator.generate({
      branch: 0.3,
      files: {
        add: 0.3,
        edit: 0.6,
        remove: 0.1,
      },
      merge: 0.3,
      deleteAfterMerge: 0.3
    });
  } catch (err) {
    console.error('Error generating repo', err);
  }
})();
