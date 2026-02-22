import {increment} from '../src/versionBuilder'

test('increment minor version', () => {
  const nextVersion = increment('1.0.0', '', ['#minor'], 'patch', false)
  console.log(nextVersion.version)
  expect(nextVersion.version).toEqual('1.1.0')
})

test('increment major version', () => {
  const nextVersion = increment('1.0.0', '', ['#major'], 'patch', false)
  console.log(nextVersion.version)
  expect(nextVersion.version).toEqual('2.0.0')
})

test('increment patch version', () => {
  const nextVersion = increment('1.0.0', '', ['#patch'], 'patch', false)
  console.log(nextVersion.version)
  expect(nextVersion.version).toEqual('1.0.1')
})

test('increment pre patch version', () => {
  const nextVersion = increment(
    '1.0.0',
    'beta',
    ['this is test #prepatch version'],
    'patch',
    false
  )
  console.log(nextVersion.version)
  expect(nextVersion.version).toEqual('1.0.1-beta.0')
})

test('increment multiple version', () => {
  const nextVersion = increment(
    '1.0.0',
    '',
    ['test #minor', 'test #major', 'test #patch'],
    'patch',
    true
  )
  console.log(nextVersion.version)
  expect(nextVersion.version).toEqual('2.1.1')
})

test('increment highest release type once when per-commit disabled', () => {
  const nextVersion = increment(
    '1.0.0',
    '',
    ['feat: add x #minor', 'breaking api #major', 'fix: typo #patch'],
    'patch',
    false
  )
  console.log(nextVersion.version)
  expect(nextVersion.version).toEqual('2.0.0')
})

test('uses default release type when no tags are present', () => {
  const nextVersion = increment(
    '1.0.0',
    '',
    ['feat: add docs', 'chore: lint'],
    'patch',
    false
  )
  console.log(nextVersion.version)
  expect(nextVersion.version).toEqual('1.0.1')
})

test('uses default release type when commit list is empty', () => {
  const nextVersion = increment('1.0.0', '', [], 'minor', false)
  console.log(nextVersion.version)
  expect(nextVersion.version).toEqual('1.1.0')
})

test('matches release tags case-insensitively', () => {
  const nextVersion = increment('1.0.0', '', ['BREAKING: API #MAJOR'], 'patch', false)
  console.log(nextVersion.version)
  expect(nextVersion.version).toEqual('2.0.0')
})

test('per-commit mode increments default type for unmatched commits', () => {
  const nextVersion = increment(
    '1.0.0',
    '',
    ['feat: add x #minor', 'docs: update', 'fix: typo'],
    'patch',
    true
  )
  console.log(nextVersion.version)
  expect(nextVersion.version).toEqual('1.1.2')
})

test('does not match partial tags like #majorfix', () => {
  const nextVersion = increment(
    '1.0.0',
    '',
    ['feat: add parser #majorfix'],
    'patch',
    false
  )
  console.log(nextVersion.version)
  expect(nextVersion.version).toEqual('1.0.1')
})

test('normalizes default release type case-insensitively', () => {
  const nextVersion = increment('1.0.0', '', ['chore: no tag'], 'MINOR', false)
  console.log(nextVersion.version)
  expect(nextVersion.version).toEqual('1.1.0')
})

test('falls back to patch when default release type is invalid', () => {
  const nextVersion = increment('1.0.0', '', ['chore: no tag'], 'invalid', false)
  console.log(nextVersion.version)
  expect(nextVersion.version).toEqual('1.0.1')
})
