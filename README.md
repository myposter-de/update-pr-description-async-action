# update-pr-description-async-action

## usecase
In some repositories we're building more than one preview-stagings in parallel. We'd like to update the pr-description with the URLs. Since the github-context is not updating, we can not use it.
Solution: fetch the current pr and use extract the body.

The timeout is neccessary because it may happen, that two jobs trigger the action at the same time. That would result in a concurrency issue: only one would be successful.

## usage

```yaml
- uses: myposter-de/update-pr-description-async-action@master
  with:
    token: ${{ inputs.GH_TOKEN }}
    prDescAppend: '🚀 append me! 🚀'
    isTicketUpdate: true or false #true, for set jira link on pr-description
    maxTimeout: 25 # default is 25 (seconds)

```
