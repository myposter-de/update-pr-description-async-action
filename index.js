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
  const isTicketUpdate = !! core.getInput('isTicketUpdate');
  const waitRandom = Math.floor(Math.random() * maxTimeout);

  const octokit = new Octokit({ auth: token });

  console.debug('timeout is: ', waitRandom);

  setTimeout(async () => {
    const { data: pr } = await octokit.rest.pulls.get({
      pull_number: context.payload.pull_request.number,
      owner: context.repo.owner,
      repo: context.repo.repo,
    });

    let newBody = '';
    let { body } = pr;

    console.log('isTicketUpdate: ', isTicketUpdate);
    console.log('prData: ', pr);

    if (!body) {
      body = '';
    }

    if (isTicketUpdate) {
      if (body !== '') {
        const jiraRegex = /[A-Z]+(?!-?[a-zA-Z]{1,10})-\d+/g;

        const matchedIssues = body.match(jiraRegex);

        if (matchedIssues?.length) {
          const issue = matchedIssues[0];
          newBody = body.replace(`::${issue}`, `[${issue}](https://myposter.atlassian.net/browse/${issue})`);
        }
      }
    }

    console.log('body.includes(prDescToAppend) ', body.includes(prDescToAppend));

    if (! isTicketUpdate && ! body.includes(prDescToAppend)) {
      let links = body.match(/(?<=🚀\s+).*?(?=\s+🚀)/gs) || [];

      if (links.length) {
        // clean "old" body of all preview links
        links.forEach(r => body = body.replace(`${r} 🚀`, ''));
        // remove emojis, as long as we have the rocket
        links = links.map((prev) => prev.replace('🚀', '').trim());
      }

      links.push(prDescToAppend);
      // sort links and readd the rocket
      links = links
          .sort((linkFirst, linkSecond) => linkFirst !== linkSecond ? linkFirst < linkSecond ? -1 : 1 : 0);

      //append cleaned-old body to sorted links
      newBody = `${body} \n ${links.join('🚀 \n')}`;
    }

    console.log('new body: ', newBody);

    if (newBody !== '') {
      await octokit.rest.pulls.update({
        pull_number: context.payload.pull_request.number,
        owner: context.repo.owner,
        repo: context.repo.repo,
        body: newBody,
      });
    }
  }, waitRandom);
} catch (error) {
  core.setFailed(error.message);
}
