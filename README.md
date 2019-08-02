# Probot: baumpfleger

> a GitHub App built with [probot](https://github.com/probot/probot) that closes branches from merged Pull Requests

Largely rendered obselete by Github's own [automatic branch deletion feature](https://help.github.com/en/articles/managing-the-automatic-deletion-of-branches) which is more secure and overall a better option for most people who don't have complex requirements around branch deletion criteria.

## Usage

1. **[Configure the GitHub App](https://github.com/apps/baumpfleger)**
2. Create `.github/baumpfleger.yml` based on the following template
3. It will start scanning for stale issues and/or pull requests within an hour.

A `.github/baumpfleger.yml` file is required to enable the plugin. 

```yml
# Configuration for probot-baumfleger

# Enabled? (optional, default false)
enabled: true

# glob or regex patterns that specify branches to ignore (optional)
ignore_branches: 
  - sandfox/patch-*
  - /^sandfox-[0-9]/i

# list of labels that if found on a pull Request cause it to be ignored (optional)
ignore_labels:
  - keep-branch
```

## What branches will it try deleting?

Any time a pull request is merged a branch will be considered for deletetion, except
- if the branch is the repo's `default` branch
- if the HEAD branch for the PR is from another repository
- if the HEAD branch for the PR is `protected`
- if the PR has any labels that match the labels specified in `.github/baumpfleger.yml` -> `ignore_labels`
- if the HEAD branch for the PR matches any of the patterns in `.github/baumpfleger.yml` -> `ignore_branches`

## Setup

```
# Install dependencies
npm install

# Run the bot
npm start
```

See [docs/deploy.md](docs/deploy.md) if you would like to run your own instance of this app.
