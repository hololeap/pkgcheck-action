const os = require('os');
const path = require('path');

const cache = require('@actions/cache');
const core = require('@actions/core');
const exec = require('@actions/exec');
const github = require('@actions/github');

async function run() {
  try {
    // JSON webhook payload for event triggering workflow
    const payload = JSON.stringify(github.context.payload, undefined, 2);

    const pkgcheck_cache_dir = path.join(os.homedir(), '.cache', 'pkgcheck');
    const pkgcore_cache_dir = path.join(os.homedir(), '.cache', 'pkgcore');
    const cache_paths = [
      path.join(os.homedir(), '.cache', 'pip'),
      pkgcheck_cache_dir,
      pkgcore_cache_dir
    ];
    // use cache key unique to each run to force cache saves
    const timestamp = Date.now();
    const key = `pkgcheck-${github.context.runId}-${timestamp}`;
    const restoreKeys = [`pkgcheck-${github.context.runId}-`, 'pkgcheck-'];
    await core.group('Restore cache', async () => {
      const cache_key = await cache.restoreCache(cache_paths, key, restoreKeys);
    });

    await core.group('Install pkgcheck', async () => {
      await exec.exec('pip', ['install', '--upgrade', 'pip']);
      const pkgs = core.getInput('pkgs').split(' ');
      await exec.exec('pip', ['install', ...pkgs]);
    });

    await core.group('Sync gentoo repo', async () => {
      await exec.exec('pmaint', ['sync', 'gentoo']);
    });
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
