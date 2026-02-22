import * as core from '@actions/core'
import semver from 'semver'
import * as github from '@actions/github'
import { Context } from '@actions/github/lib/context'

const RELEASE_TYPES = [
  'major',
  'premajor',
  'minor',
  'preminor',
  'patch',
  'prepatch',
  'prerelease'
] as const

type ReleaseTypeKey = (typeof RELEASE_TYPES)[number]

const releaseTypeOrder: ReadonlyArray<ReleaseTypeKey> = RELEASE_TYPES

const defaultConfig: Record<ReleaseTypeKey, ReadonlyArray<ReleaseTypeKey>> = {
  major: ['major'],
  premajor: ['premajor'],
  minor: ['minor'],
  preminor: ['preminor'],
  patch: ['patch'],
  prepatch: ['prepatch'],
  prerelease: ['prerelease']
} as const

const FALLBACK_RELEASE_TYPE: ReleaseTypeKey = 'patch'

function getMatchedReleaseTypes(message: string): ReleaseTypeKey[] {
  const matchedReleaseTypes: ReleaseTypeKey[] = []
  const tagsInMessage = new Set(
    (message.toLowerCase().match(/#[a-z]+/g) || []).map(tag =>
      tag.replace(/^#/, '')
    )
  )

  for (const releaseType of RELEASE_TYPES) {
    const aliases = defaultConfig[releaseType]
    if (aliases.some(alias => tagsInMessage.has(alias))) {
      matchedReleaseTypes.push(releaseType)
    }
  }

  return matchedReleaseTypes
}

function normalizeReleaseType(releaseType: string): ReleaseTypeKey {
  const normalizedReleaseType = releaseType.toLowerCase() as ReleaseTypeKey

  if (RELEASE_TYPES.includes(normalizedReleaseType)) {
    return normalizedReleaseType
  }

  core.warning(
    `Invalid releaseType '${releaseType}' provided. Falling back to '${FALLBACK_RELEASE_TYPE}'.`
  )
  return FALLBACK_RELEASE_TYPE
}

export function increment(
  versionNumber: string,
  versionIdentifier: string,
  commitMessages: string[],
  defaultReleaseType: string,
  incrementPerCommit: boolean
): semver.SemVer {
  const version = semver.parse(versionNumber) || new semver.SemVer('0.0.0')
  const normalizedDefaultReleaseType = normalizeReleaseType(defaultReleaseType)
  core.debug(`Config used => ${JSON.stringify(defaultConfig)}`)
  let matchedLabels: string[] = []

  for (const message of commitMessages) {
    const matchedReleaseTypes = getMatchedReleaseTypes(message)
    matchedLabels.push(...matchedReleaseTypes)

    if (incrementPerCommit && matchedReleaseTypes.length === 0) {
      matchedLabels.push(normalizedDefaultReleaseType)
    }
  }

  core.debug(
    `Parsed labels from commit messages => ${JSON.stringify([
      ...matchedLabels
    ])}`
  )

  if (matchedLabels.length === 0) {
    matchedLabels.push(normalizedDefaultReleaseType)
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
