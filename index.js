const core = require('@actions/core');
const github = require('@actions/github');
const { Octokit } = require('@octokit/rest');

try {
  const { context } = github;
  const isPR = !!context.payload.pull_request;

  if(!isPR) {
    core.setFailed('Action is only allowed for pull requests');
    return;
  }

  const token = core.getInput('token');
  const prDescToAppend = core.getInput('prDescAppend');
  const waitRandom = Math.floor(Math.random() * 25);

  const octokit = new Octokit({ auth: token });

  console.debug('timeout is: ', waitRandom);

  setTimeout(async () => {
    const { data: pr } = await octokit.rest.pulls.get({
      pull_number: context.payload.pull_request.number,
      owner: context.repo.owner,
      repo: context.repo.repo,
    });

    const { body } = pr;
    if (! body.includes(prDescToAppend)) {
      const newBody = body.concat('\n', prDescToAppend);

      console.debug('new body: ', newBody);

      await octokit.rest.pulls.update({
        pull_number: context.payload.pull_request.number,
        owner: context.repo.owner,
        repo: context.repo.repo,
        body: newBody,
      });
    } else {
      console.debug('not appending body - body is up to date');
    }
  }, waitRandom);
} catch (error) {
  core.setFailed(error.message);
}
