import { promises as fs } from 'fs';
import { loremIpsum } from 'lorem-ipsum';
import simplegit, { SimpleGit } from 'simple-git/promise';

import { AddFileOperation, EditFileOperation, FileOperation, RemoveFileOperation } from './operations';

export interface GeneratorOptions {
  allowMerge?: boolean;
  allowRebase?: boolean;
  directory: string;
  maxTreeWidth: number;
  minTreeWidth: number;
  commitCount: number;
}

export interface GeneratorProbabilities {
  files: {
    add: number;
    edit: number;
    remove: number;
  },
  branch: number;
  merge: number;
  deleteAfterMerge: number;
}

export class Generator {
  private git: SimpleGit;

  constructor(private options: GeneratorOptions) {
    this.git = simplegit(this.options.directory);
  }

  async generate(probabilities: GeneratorProbabilities) {
    if (!(await this.git.checkIsRepo())) {
      await this.git.init();
    }

    for (let i = 0; i < this.options.commitCount; i++) {
      console.log(`Generating commit ${i}`);
      if (Math.random() <= probabilities.merge) {
        console.debug('merging or rebasing');
        await this.mergeOrRebaseBranch(probabilities.deleteAfterMerge);
      }
      const branches = await this.git.branchLocal();
      if (branches.all.length < 1 || branches.all.length < this.options.maxTreeWidth && Math.random() <= probabilities.branch) {
        await this.createBranch();
      } else {
        await this.git.checkout(await this.pickBranch());
      }
      let op = await this.getNextFileOperation(probabilities);
      await op.execute();
    }
  }

  private async createBranch() {
    const branches = await this.git.branchLocal();
    while (true) {
      const branchName = loremIpsum({ count: 1, units: 'word' });
      if (branches.all.length < 1 || !branches.all.find(b => b == branchName)) {
        console.log(`creating branch ${branchName}`);
        await this.git.checkoutLocalBranch(branchName);
        break;
      }
    }
  }

  private async getNextFileOperation(p: GeneratorProbabilities): Promise<FileOperation> {
    const files = (await fs.readdir(this.options.directory)).filter(f => f != '.git');
    if (files.length < 1) {
      return new AddFileOperation(this.git, this.options.directory);
    }
    if (files.length < 2) {
      const addProbability = p.files.add + p.files.remove/2;
      return Math.random() <= addProbability ? new AddFileOperation(this.git, this.options.directory) : new EditFileOperation(this.git, this.options.directory);
    }

    const r = Math.random();
    if (r <= p.files.add) {
      return new AddFileOperation(this.git, this.options.directory);
    }
    else if (r <= p.files.add + p.files.edit) {
      return new EditFileOperation(this.git, this.options.directory);
    }
    return new RemoveFileOperation(this.git, this.options.directory);
  }

  private async mergeOrRebaseBranch(pDeleteAfterMerge: number) {
    const branches = await this.git.branchLocal();
    if (branches.all.length < 2) {
      return;
    }
    if (this.options.allowMerge && this.options.allowRebase) {
      if (Math.random() < 0.5) {
        console.debug('merging branch');
        await this.mergeBranch(pDeleteAfterMerge);
      } else {
        console.debug('rebasing branch');
        await this.rebaseBranch();
      }
    } else if (this.options.allowMerge) {
      console.debug('merging branch');
      await this.mergeBranch(pDeleteAfterMerge);
    } else if (this.options.allowRebase) {
      console.debug('rebasing branch');
      await this.rebaseBranch();
    }
  }

  private async mergeBranch(pDeleteAfterMerge: number) {
    const source = await this.pickBranch();
    let destination = await this.pickBranch();
    while (source == destination) {
      destination = await this.pickBranch();
    }
    await this.git.checkout(destination);
    console.debug(`merging branch '${source}' with '${destination}'`);
    try {
      await this.git.mergeFromTo(source, destination);
    } catch (err) {
      const unresolvedFiles = await this.git.diff(['--name-only', '--diff-filter=U']);
      console.debug('merge conflicts', unresolvedFiles, unresolvedFiles.split(/\r?\n/));
      for (let file of unresolvedFiles.split(/\r?\n/).filter(f => f && f.length > 0)) {
        console.debug(`resolving conflict for '${file}'`);
        try {
          await this.git.checkout(['--ours', './' + file]);
          await this.git.add(file);
        } catch {
          await this.git.rm(file);
        }
      }
      await this.git.commit(`merge '${source}' into '${destination}'\n\nMerge conflicts:\n${unresolvedFiles}`);
    }
    if (Math.random() < pDeleteAfterMerge) {
      this.git.checkout(destination);
      this.git.deleteLocalBranch(source);
    }
  }

  private async pickBranch() {
    const branches = await this.git.branchLocal();
    const index = Math.floor(Math.random() * branches.all.length);
    return branches.all[index];
  }

  private async rebaseBranch() {
    const source = await this.pickBranch();
    let destination = await this.pickBranch();
    while (source == destination) {
      destination = await this.pickBranch();
    }
    console.debug(`rebasing branch '${source}' onto '${destination}'`);
    await this.git.checkout(source);
    await this.git.rebase(destination);
  }
}
