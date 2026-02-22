import * as core from '@actions/core'
import semver from 'semver'
import * as github from '@actions/github'
import { Context } from '@actions/github/lib/context'

const releaseTypeOrder = [
  'major',
  'premajor',
  'minor',
  'preminor',
  'patch',
  'prepatch',
  'prerelease'
]

const defaultConfig = {
  major: ['major'],
  premajor: ['premajor'],
  minor: ['minor'],
  preminor: ['preminor'],
  patch: ['patch'],
  prepatch: ['prepatch'],
  prerelease: ['prerelease']
}

export function increment(
  versionNumber: string,
  versionIdentifier: string,
  commitMessages: string[],
  defaultReleaseType: string,
  incrementPerCommit: boolean
): semver.SemVer {
  const version = semver.parse(versionNumber) || new semver.SemVer('0.0.0')
  core.debug(`Config used => ${JSON.stringify(defaultConfig)}`)
  let matchedLabels = new Array<string>()

  for (const message of commitMessages) {
    let msgMatch = false
    const normalizedMessage = message.toLowerCase()
    for (const [key, value] of Object.entries(defaultConfig)) {
      for (const releaseType of value) {
        if (normalizedMessage.includes(`#${releaseType}`)) {
          matchedLabels.push(key)
          msgMatch = true
        }
      }
    }
    if (incrementPerCommit && !msgMatch) {
      matchedLabels.push(defaultReleaseType)
    }
  }

  core.debug(
    `Parsed labels from commit messages => ${JSON.stringify([
      ...matchedLabels
    ])}`
  )

  if (matchedLabels.length === 0) {
    matchedLabels.push(defaultReleaseType)
  }

  //find highest release type and singularize
  if (!incrementPerCommit) {
    for (const releaseType of releaseTypeOrder) {
      if (matchedLabels.find(w => w.toLowerCase() === releaseType)) {
        matchedLabels = []
        matchedLabels.push(releaseType)
        break
      }
    }
  }

  for (const releaseType of releaseTypeOrder) {
    const len = matchedLabels.filter(
      w => w.toLowerCase() === releaseType
    ).length
    for (let index = 0; index < len; index++) {
      version?.inc(releaseType as semver.ReleaseType, versionIdentifier)
      core.debug(
        `Increment version for label => ${releaseType} - ${version.version}`
      )
    }
  }

  return version
}

export async function getMostRecentVersionFromTags(
  context: Context
): Promise<semver.SemVer> {
  const token = core.getInput('github_token', { required: true })
  const octokit = github.getOctokit(token)

  const { data: refs } = await octokit.rest.git.listMatchingRefs({
    owner: context.repo.owner,
    repo: context.repo.repo,
    ref: 'tags/'
  })

  const versions = refs
    .map(ref =>
      semver.parse(ref.ref.replace(/^refs\/tags\//g, ''), { loose: true })
    )
    .filter(version => version !== null)
    .sort((a, b) =>
      semver.rcompare(a?.version || '0.0.0', b?.version || '0.0.0')
    )

  if (versions[0] != null) {
    return versions[0]
  } else {
    return new semver.SemVer('0.0.0')
  }
}
