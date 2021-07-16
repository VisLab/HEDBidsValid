/**
 * A HED validation error or warning.
 *
 * @param {string} internalCode The internal error code.
 * @param {string} hedCode The HED 3 error code.
 * @param {string} level The issue level (error or warning).
 * @param {string} message The detailed error message.
 * @constructor
 */
const Issue = function (internalCode, hedCode, level, message) {
  /**
   * The internal error code.
   * @type {string}
   */
  this.internalCode = internalCode
  /**
   * Also the internal error code.
   *
   * TODO: This is kept for backward compatibility until the next major version bump.
   * @type {string}
   */
  this.code = internalCode
  /**
   * The HED 3 error code.
   * @type {string}
   */
  this.hedCode = hedCode
  /**
   * The issue level (error or warning).
   * @type {string}
   */
  this.level = level
  /**
   * The detailed error message.
   * @type {string}
   */
  this.message = `${level.toUpperCase()}: [${hedCode}] ${message}`
}

/**
 * Generate a new issue object.
 *
 * @param {string} internalCode The internal error code.
 * @param {object<string, (string|number[])>} parameters The error string parameters.
 * @return {Issue} An object representing the issue.
 */
const generateIssue = function (internalCode, parameters) {
  let message
  let level = 'error'
  let hedCode = 'HED_GENERIC_ERROR'
  switch (internalCode) {
    case 'parentheses':
      hedCode = 'HED_PARENTHESES_MISMATCH'
      level = 'error'
      message = `Number of opening and closing parentheses are unequal. ${parameters.opening} opening parentheses. ${parameters.closing} closing parentheses.`
      break
    case 'invalidTag':
      hedCode = 'HED_TAG_INVALID'
      level = 'error'
      message = `Invalid tag - "${parameters.tag}"`
      break
    case 'extraDelimiter':
      hedCode = 'HED_TAG_EMPTY'
      level = 'error'
      message = `Extra delimiter "${parameters.character}" at index ${parameters.index} of string "${parameters.string}"`
      break
    case 'commaMissing':
      hedCode = 'HED_COMMA MISSING'
      level = 'error'
      message = `Comma missing after - "${parameters.tag}"`
      break
    case 'capitalization':
      hedCode = 'HED_STYLE_WARNING'
      level = 'warning'
      message = `First word not capitalized or camel case - "${parameters.tag}"`
      break
    case 'duplicateTag':
      hedCode = 'HED_TAG_REPEATED'
      level = 'error'
      message = `Duplicate tag at indices (${parameters.bounds[0]}, ${parameters.bounds[1]}) - "${parameters.tag}"`
      break
    case 'multipleUniqueTags':
      hedCode = 'HED_TAG_NOT_UNIQUE'
      level = 'error'
      message = `Multiple unique tags with prefix - "${parameters.tag}"`
      break
    case 'tooManyTildes':
      hedCode = 'HED_TILDES_UNSUPPORTED'
      level = 'error'
      message = `Too many tildes - group "${parameters.tagGroup}"`
      break
    case 'childRequired':
      hedCode = 'HED_TAG_REQUIRES_CHILD'
      level = 'error'
      message = `Descendant tag required - "${parameters.tag}"`
      break
    case 'requiredPrefixMissing':
      hedCode = 'HED_REQUIRED_TAG_MISSING'
      level = 'warning'
      message = `Tag with prefix "${parameters.tagPrefix}" is required`
      break
    case 'unitClassDefaultUsed':
      hedCode = 'HED_UNITS_MISSING'
      level = 'warning'
      message = `No unit specified. Using "${parameters.defaultUnit}" as the default - "${parameters.tag}"`
      break
    case 'unitClassInvalidUnit':
      hedCode = 'HED_UNITS_INVALID'
      level = 'error'
      message = `Invalid unit - "${parameters.tag}" - valid units are "${parameters.unitClassUnits}"`
      break
    case 'extraCommaOrInvalid':
      hedCode = 'HED_TAG_INVALID'
      level = 'error'
      message = `Either "${parameters.previousTag}" contains a comma when it should not or "${parameters.tag}" is not a valid tag`
      break
    case 'invalidCharacter':
      hedCode = 'HED_CHARACTER_INVALID'
      level = 'error'
      message = `Invalid character "${parameters.character}" at index ${parameters.index} of string "${parameters.string}"`
      break
    case 'extension':
      hedCode = 'HED_TAG_EXTENDED'
      level = 'warning'
      message = `Tag extension found - "${parameters.tag}"`
      break
    case 'invalidPlaceholder':
      hedCode = 'HED_PLACEHOLDER_INVALID'
      level = 'error'
      message = `Invalid placeholder - "${parameters.tag}"`
      break
    case 'invalidPlaceholderInDefinition':
      hedCode = 'HED_PLACEHOLDER_INVALID'
      level = 'error'
      message = `Invalid placeholder in definition - "${parameters.definition}"`
      break
    case 'invalidValue':
      hedCode = 'HED_VALUE_INVALID'
      level = 'error'
      message = `Invalid placeholder value for tag "${parameters.tag}"`
      break
    case 'invalidParentNode':
      hedCode = 'HED_VALUE_IS_NODE'
      level = 'error'
      message = `"${parameters.tag}" appears as "${parameters.parentTag}" and cannot be used as an extension. Indices (${parameters.bounds[0]}, ${parameters.bounds[1]}).`
      break
    case 'emptyTagFound':
      hedCode = 'HED_NODE_NAME_EMPTY'
      level = 'error'
      message = `Empty tag cannot be converted.`
      break
    case 'duplicateTagsInSchema':
      level = 'error'
      message = `Source HED schema is invalid as it contains duplicate tags.`
      break
    case 'illegalDefinitionGroupTag':
      hedCode = 'HED_DEFINITION_INVALID'
      level = 'error'
      message = `Illegal tag "${parameters.tag}" in tag group for definition "${parameters.definition}"`
      break
    case 'nestedDefinition':
      hedCode = 'HED_DEFINITION_INVALID'
      level = 'error'
      message = `Illegal nested definition in tag group for definition "${parameters.definition}"`
      break
    case 'multipleTagGroupsInDefinition':
      hedCode = 'HED_DEFINITION_INVALID'
      level = 'error'
      message = `Multiple inner tag groups found in definition "${parameters.definition}"`
      break
    case 'invalidTopLevelTagGroupTag':
      hedCode = 'HED_TAG_GROUP_ERROR'
      level = 'error'
      message = `Tag "${parameters.tag}" is only allowed inside of a top-level tag group.`
      break
    case 'multipleTopLevelTagGroupTags':
      hedCode = 'HED_TAG_GROUP_ERROR'
      level = 'error'
      message = `Tag "${parameters.tag}" found in top-level tag group where "${parameters.otherTag}" was already defined.`
      break
    case 'invalidTopLevelTag':
      hedCode = 'HED_TAG_GROUP_ERROR'
      level = 'error'
      message = `Tag "${parameters.tag}" is only allowed inside of a tag group.`
      break
    default:
      hedCode = 'HED_GENERIC_ERROR'
      level = 'error'
      message = `Unknown HED error.`
      break
  }

  return new Issue(internalCode, hedCode, level, message)
}

module.exports = {
  generateIssue: generateIssue,
  Issue: Issue,
}
