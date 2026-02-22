
# auto-semver-action
auto-semver-action allows you to easily determine the next version number.

## How does it work?
Automatically determines the next semantic version number by using repository tags. Uses the commit messages to determine the type of changes in the repository. 

### Commit message format
Supported release tags in commit messages:

*If commit messages do not match any tag below, the default `releaseType` is used.*

`#major`, `#premajor`, `#minor`, `#preminor`, `#patch`, `#prepatch`, `#prerelease`

Behavior details:

- Tag matching is case-insensitive (`#MAJOR` works).
- Tags are matched as exact hashtag tokens (`#majorfix` does **not** count as `#major`).
- `incrementPerCommit: false` → evaluates all commit messages, picks the highest priority tag, and increments once.
- `incrementPerCommit: true` → increments for each commit; commits without a tag use the default `releaseType`.

### Examples

Assume current version is `1.0.0`.

| Commit messages | incrementPerCommit | releaseType | Result |
|---|---:|---|---|
| `feat: add x #minor` | `false` | `patch` | `1.1.0` |
| `feat #minor`, `breaking change #major`, `fix #patch` | `false` | `patch` | `2.0.0` (highest once) |
| `feat #minor`, `breaking change #major`, `fix #patch` | `true` | `patch` | `2.1.1` |
| `docs update`, `chore cleanup` | `false` | `minor` | `1.1.0` (default used) |
| `feat #MAJOR` | `false` | `patch` | `2.0.0` (case-insensitive) |
| `feat #majorfix` | `false` | `patch` | `1.0.1` (partial tag ignored, default used) |
| `docs update` | `false` | `invalid` | `1.0.1` (falls back to `patch`) |
| `release prep #prepatch` + `identifier: beta` | `false` | `patch` | `1.0.1-beta.0` |

## Inputs

### `identifier`

**Optional** Semver identifier for version (beta,alpha..).

### `incrementPerCommit`

**Optional** Increments a version for each commit (true,false).

### `releaseType`

**Required** Default semantic version release type.
`major`, `premajor`, `minor`, `preminor`, `patch`, `prepatch`, or `prerelease`.

Notes:

- `releaseType` is case-insensitive (`PATCH` is valid).
- If an invalid value is provided, action falls back to `patch` and logs a warning.

### `github_token`

**Required**. Used to make API requests for looking existing tags. Pass in using `secrets.GITHUB_TOKEN`.

## Example usage

```yaml
   steps:
    - name: Auto Increment Semver Action
      uses: MCKanpolat/auto-semver-action@v2
      id: versioning
      with:
        releaseType: patch 
        incrementPerCommit: false
        github_token: ${{ secrets.GITHUB_TOKEN }}

    - name: Next Release Number
      run: echo ${{ steps.versioning.outputs.version }}
```

## Debugging
To see debug output from this action, you must set the secret ACTIONS_STEP_DEBUG to true in your repository. 
