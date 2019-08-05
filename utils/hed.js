// Wrappers around more basic functions.
const strings = require('./string')

/**
 * Replace the end of a HED tag with a pound sign.
 */
const replaceTagNameWithPound = function(formattedTag) {
  return strings.replaceTagNameWithNewEnding(formattedTag, '#')
}

/**
 * Get the indices of all slashes in a HED tag.
 */
const getTagSlashIndices = function(tag) {
  return strings.getCharacterIndices(tag, '/')
}

/**
 * Get the last part of a HED tag.
 */
const getTagName = function(tag) {
  const lastSlashIndex = tag.lastIndexOf('/')
  if (lastSlashIndex === -1) {
    return tag
  } else {
    return tag.substring(lastSlashIndex + 1)
  }
}

/**
 * Get the index at the end of the next set of parentheses in a HED string.
 */
const getIndexAtEndOfParentheses = function(
  hedString,
  currentTag,
  characterIndex,
) {
  currentTag = currentTag.slice(0, -1)
  const restOfHedString = hedString.substring(characterIndex)
  const [, parenthesesLength] = strings.getNextSetOfParentheses(
    currentTag + restOfHedString,
  )
  const finalIndex = characterIndex - currentTag.length + parenthesesLength
  return finalIndex
}

/**
 * Check for a valid unit and remove it.
 */
const stripOffUnitsIfValid = function(tagUnitValues, tagUnitClassUnits) {
  tagUnitClassUnits.sort(function(first, second) {
    return first.length < second.length
  })
  for (const units of tagUnitClassUnits) {
    if (tagUnitValues.startsWith(units)) {
      return tagUnitValues.substring(units.length).trim()
    } else if (tagUnitValues.endsWith(units)) {
      return tagUnitValues.slice(0, -units.length).trim()
    }
  }
  return tagUnitValues
}

module.exports = {
  replaceTagNameWithPound: replaceTagNameWithPound,
  getTagSlashIndices: getTagSlashIndices,
  getTagName: getTagName,
  getIndexAtEndOfParentheses: getIndexAtEndOfParentheses,
  stripOffUnitsIfValid: stripOffUnitsIfValid,
}
