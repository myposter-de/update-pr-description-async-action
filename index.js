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

  const maxTimeout = core.getInput('maxTimeout');
  const token = core.getInput('token');
  const prDescToAppend = core.getInput('prDescAppend');
  const waitRandom = Math.floor(Math.random() * maxTimeout);

  const octokit = new Octokit({ auth: token });

  console.debug('timeout is: ', waitRandom);

  setTimeout(async () => {
    const { data: pr } = await octokit.rest.pulls.get({
      pull_number: context.payload.pull_request.number,
      owner: context.repo.owner,
      repo: context.repo.repo,
    });

    let { body } = pr;

    if (!body) {
      body = '';
    }

    if (! body.includes(prDescToAppend)) {
      let links = body.match(/(?<=🚀\s+).*?(?=\s+🚀)/gs) || [];

      if (links.length) {
        links.forEach(r => body = body.replace(`${r} 🚀`, ''));
        links = links.map((prev) => prev.replace('🚀', '').trim());
      }

      links.push(prDescToAppend);
      links = links
          .sort((linkFirst, linkSecond) => linkFirst !== linkSecond ? linkFirst < linkSecond ? -1 : 1 : 0)
          .map((link) => `🚀 ${link}`);

      const newBody = `${body} \n ${links.join('🚀 \n')}`;

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
