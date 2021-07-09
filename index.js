const minimatch = require('minimatch')

const CONFIG_FILE = 'baumpfleger.yml'

const DEFAULT_CONFIG = {
  enabled: false
}

// we only support /PATTERN/ with u and/or i flags
const regexRegex = /^\/(.+)\/([iu]{0,2})$/

module.exports = robot => {
  robot.on('pull_request.closed', async context => {
    const config = await context.config(CONFIG_FILE, DEFAULT_CONFIG)

    const { pull_request, repository } = context.payload

    context.log(`Inspecting PR #${pull_request.number} for ${pull_request.base.repo.full_name}`)

        // check if PR was merged
    if (!pull_request.merged) {
      context.log('PR was not merged, ignoring')
      return
    }

        // do not delete branches from other repos
    if (pull_request.head.repo.full_name !== repository.full_name) {
      context.log('PR head branch is from a different repository, ignoring')
      return
    }

    const headBranchName = pull_request.head.ref

        // Do not delete default branches
    if (headBranchName === context.payload.repository.default_branch) {
      context.log('PR head branch is this repo\'s default branch, ignoring')
      return
    }

        // Do not delete ignored branches (specified by glob or regex)
    if (config.ignore_branches) {
      const ignoreBranches = [...config.ignore_branches].filter(item => item != null)

      const match = ignoreBranches.reduce((result, pattern) => {
        if (result) {
          return result
        }

        context.log(`trying branch ignore pattern: ${pattern}`)

        const regexMatch = regexRegex.exec(pattern)
        const test = regexMatch ? new RegExp(regexMatch[1], regexMatch[2]) : minimatch.makeRe(pattern)
        if (test.test(headBranchName)) {
          return pattern
        }
      }, undefined)

      if (match) {
        context.log(`PR head branch is ignored by pattern "${match}", ignoring`)
        return
      }
    }

        // Do not delete when PR has certain labels (specified by string match)
    if (config.ignore_labels) {
      const { data: issueLabels } = await context.octokit.issues.getIssueLabels(context.issue())
      const issueLabelNames = issueLabels.map(l => l.name)
      const ignoreLabels = [...config.ignore_labels].filter(item => item != null)
      const match = ignoreLabels.find(l => issueLabelNames.includes(l))
      if (match) {
        context.log(`PR has label "${match}" which we ignore, ignoring`)
        return
      }
    }

        // Do not delete protected branches
    const headBranch = await context.octokit.repos.getBranch(context.repo({branch: headBranchName}))

    if (headBranch.protected) {
      context.log('PR head branch is protected, ignoring')
      return
    }

    if (config.enabled !== true) {
      context.log('baumfleger is not enabled in the config, ignoring the PR')
      return
    }

        // cut down the branch
    context.log(`Deleting branch ${headBranchName}`)
    await context.octokit.gitdata.deleteReference(context.repo({ref: `heads/${headBranchName}`}))
    context.log(`Successful deleted branch ${headBranchName}`)
  })
}
