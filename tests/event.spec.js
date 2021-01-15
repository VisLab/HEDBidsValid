const assert = require('chai').assert
const hed = require('../validator/event')
const schema = require('../validator/schema')
const converterSchema = require('../converter/schema')
const stringParser = require('../validator/stringParser')
const generateIssue = require('../utils/issues')

describe('HED string and event validation', () => {
  describe('Latest HED schema', () => {
    const hedSchemaFile = 'tests/data/HED7.1.1.xml'
    let hedSchemaPromise

    beforeAll(() => {
      hedSchemaPromise = schema.buildSchema({ path: hedSchemaFile })
    })

    const validatorSemanticBase = function(
      testStrings,
      expectedResults,
      expectedIssues,
      testFunction,
    ) {
      return hedSchemaPromise.then(schema => {
        for (const testStringKey in testStrings) {
          const [parsedTestString, parseIssues] = stringParser.parseHedString(
            testStrings[testStringKey],
          )
          const testIssues = testFunction(parsedTestString, schema)
          const issues = [].concat(parseIssues, testIssues)
          const testResult = issues.length === 0
          assert.strictEqual(
            testResult,
            expectedResults[testStringKey],
            testStrings[testStringKey],
          )
          assert.sameDeepMembers(
            issues,
            expectedIssues[testStringKey],
            testStrings[testStringKey],
          )
        }
      })
    }

    const validatorSyntacticBase = function(
      testStrings,
      expectedResults,
      expectedIssues,
      testFunction,
    ) {
      for (const testStringKey in testStrings) {
        const [parsedTestString, parseIssues] = stringParser.parseHedString(
          testStrings[testStringKey],
        )
        const testIssues = testFunction(parsedTestString)
        const issues = [].concat(parseIssues, testIssues)
        const testResult = issues.length === 0
        assert.strictEqual(
          testResult,
          expectedResults[testStringKey],
          testStrings[testStringKey],
        )
        assert.sameDeepMembers(
          issues,
          expectedIssues[testStringKey],
          testStrings[testStringKey],
        )
      }
    }

    describe('Full HED Strings', () => {
      const validator = function(testStrings, expectedResults, expectedIssues) {
        for (const testStringKey in testStrings) {
          const [testResult, testIssues] = hed.validateHedEvent(
            testStrings[testStringKey],
          )
          assert.strictEqual(
            testResult,
            expectedResults[testStringKey],
            testStrings[testStringKey],
          )
          assert.sameDeepMembers(
            testIssues,
            expectedIssues[testStringKey],
            testStrings[testStringKey],
          )
        }
      }

      it('should not have mismatched parentheses', () => {
        const testStrings = {
          extraOpening:
            '/Action/Reach/To touch,((/Attribute/Object side/Left,/Participant/Effect/Body part/Arm),/Attribute/Location/Screen/Top/70 px,/Attribute/Location/Screen/Left/23 px',
          // The extra comma is needed to avoid a comma error.
          extraClosing:
            '/Action/Reach/To touch,(/Attribute/Object side/Left,/Participant/Effect/Body part/Arm),),/Attribute/Location/Screen/Top/70 px,/Attribute/Location/Screen/Left/23 px',
          valid:
            '/Action/Reach/To touch,(/Attribute/Object side/Left,/Participant/Effect/Body part/Arm),/Attribute/Location/Screen/Top/70 px,/Attribute/Location/Screen/Left/23 px',
        }
        const expectedResults = {
          extraOpening: false,
          extraClosing: false,
          valid: true,
        }
        const expectedIssues = {
          extraOpening: [
            generateIssue('parentheses', { opening: 2, closing: 1 }),
          ],
          extraClosing: [
            generateIssue('parentheses', { opening: 1, closing: 2 }),
          ],
          valid: [],
        }
        validator(testStrings, expectedResults, expectedIssues)
      })

      it('should not have malformed delimiters', () => {
        const testStrings = {
          missingOpeningComma:
            '/Action/Reach/To touch(/Attribute/Object side/Left,/Participant/Effect/Body part/Arm),/Attribute/Location/Screen/Top/70 px,/Attribute/Location/Screen/Left/23 px',
          missingClosingComma:
            '/Action/Reach/To touch,(/Attribute/Object side/Left,/Participant/Effect/Body part/Arm)/Attribute/Location/Screen/Top/70 px,/Attribute/Location/Screen/Left/23 px',
          extraOpeningComma:
            ',/Action/Reach/To touch,(/Attribute/Object side/Left,/Participant/Effect/Body part/Arm),/Attribute/Location/Screen/Top/70 px,/Attribute/Location/Screen/Left/23 px',
          extraClosingComma:
            '/Action/Reach/To touch,(/Attribute/Object side/Left,/Participant/Effect/Body part/Arm),/Attribute/Location/Screen/Top/70 px,/Attribute/Location/Screen/Left/23 px,',
          extraOpeningTilde:
            '~/Action/Reach/To touch,(/Attribute/Object side/Left,/Participant/Effect/Body part/Arm),/Attribute/Location/Screen/Top/70 px,/Attribute/Location/Screen/Left/23 px',
          extraClosingTilde:
            '/Action/Reach/To touch,(/Attribute/Object side/Left,/Participant/Effect/Body part/Arm),/Attribute/Location/Screen/Top/70 px,/Attribute/Location/Screen/Left/23 px~',
          multipleExtraOpeningDelimiter:
            ',~,/Action/Reach/To touch,(/Attribute/Object side/Left,/Participant/Effect/Body part/Arm),/Attribute/Location/Screen/Top/70 px,/Attribute/Location/Screen/Left/23 px',
          multipleExtraClosingDelimiter:
            '/Action/Reach/To touch,(/Attribute/Object side/Left,/Participant/Effect/Body part/Arm),/Attribute/Location/Screen/Top/70 px,/Attribute/Location/Screen/Left/23 px,~~,',
          multipleExtraMiddleDelimiter:
            '/Action/Reach/To touch,,(/Attribute/Object side/Left,/Participant/Effect/Body part/Arm),/Attribute/Location/Screen/Top/70 px,~,/Attribute/Location/Screen/Left/23 px',
          valid:
            '/Action/Reach/To touch,(/Attribute/Object side/Left,/Participant/Effect/Body part/Arm),/Attribute/Location/Screen/Top/70 px,/Attribute/Location/Screen/Left/23 px',
          validDoubleOpeningParentheses:
            '/Action/Reach/To touch,((/Attribute/Object side/Left,/Participant/Effect/Body part/Arm),/Attribute/Location/Screen/Top/70 px,/Attribute/Location/Screen/Left/23 px),Event/Duration/3 ms',
          validDoubleClosingParentheses:
            '/Action/Reach/To touch,(/Attribute/Object side/Left,/Participant/Effect/Body part/Arm,(/Attribute/Location/Screen/Top/70 px,/Attribute/Location/Screen/Left/23 px)),Event/Duration/3 ms',
        }
        const expectedResults = {
          missingOpeningComma: false,
          missingClosingComma: false,
          extraOpeningComma: false,
          extraClosingComma: false,
          extraOpeningTilde: false,
          extraClosingTilde: false,
          multipleExtraOpeningDelimiter: false,
          multipleExtraClosingDelimiter: false,
          multipleExtraMiddleDelimiter: false,
          valid: true,
          validDoubleOpeningParentheses: true,
          validDoubleClosingParentheses: true,
        }
        const expectedIssues = {
          missingOpeningComma: [
            generateIssue('invalidTag', { tag: '/Action/Reach/To touch(' }),
          ],
          missingClosingComma: [
            generateIssue('commaMissing', {
              tag: '/Participant/Effect/Body part/Arm)',
            }),
          ],
          extraOpeningComma: [
            generateIssue('extraDelimiter', {
              character: ',',
              index: 0,
              string: testStrings.extraOpeningComma,
            }),
          ],
          extraClosingComma: [
            generateIssue('extraDelimiter', {
              character: ',',
              index: testStrings.extraClosingComma.length - 1,
              string: testStrings.extraClosingComma,
            }),
          ],
          extraOpeningTilde: [
            generateIssue('extraDelimiter', {
              character: '~',
              index: 0,
              string: testStrings.extraOpeningTilde,
            }),
          ],
          extraClosingTilde: [
            generateIssue('extraDelimiter', {
              character: '~',
              index: testStrings.extraClosingTilde.length - 1,
              string: testStrings.extraClosingTilde,
            }),
          ],
          multipleExtraOpeningDelimiter: [
            generateIssue('extraDelimiter', {
              character: ',',
              index: 0,
              string: testStrings.multipleExtraOpeningDelimiter,
            }),
            generateIssue('extraDelimiter', {
              character: '~',
              index: 1,
              string: testStrings.multipleExtraOpeningDelimiter,
            }),
            generateIssue('extraDelimiter', {
              character: ',',
              index: 2,
              string: testStrings.multipleExtraOpeningDelimiter,
            }),
          ],
          multipleExtraClosingDelimiter: [
            generateIssue('extraDelimiter', {
              character: ',',
              index: testStrings.multipleExtraClosingDelimiter.length - 1,
              string: testStrings.multipleExtraClosingDelimiter,
            }),
            generateIssue('extraDelimiter', {
              character: '~',
              index: testStrings.multipleExtraClosingDelimiter.length - 2,
              string: testStrings.multipleExtraClosingDelimiter,
            }),
            generateIssue('extraDelimiter', {
              character: '~',
              index: testStrings.multipleExtraClosingDelimiter.length - 3,
              string: testStrings.multipleExtraClosingDelimiter,
            }),
            generateIssue('extraDelimiter', {
              character: ',',
              index: testStrings.multipleExtraClosingDelimiter.length - 4,
              string: testStrings.multipleExtraClosingDelimiter,
            }),
          ],
          multipleExtraMiddleDelimiter: [
            generateIssue('extraDelimiter', {
              character: ',',
              index: 23,
              string: testStrings.multipleExtraMiddleDelimiter,
            }),
            generateIssue('extraDelimiter', {
              character: '~',
              index: 125,
              string: testStrings.multipleExtraMiddleDelimiter,
            }),
            generateIssue('extraDelimiter', {
              character: ',',
              index: 126,
              string: testStrings.multipleExtraMiddleDelimiter,
            }),
          ],
          valid: [],
          validDoubleOpeningParentheses: [],
          validDoubleClosingParentheses: [],
        }
        validator(testStrings, expectedResults, expectedIssues)
      })

      it('should not have invalid characters', () => {
        const testStrings = {
          openingBrace:
            '/Attribute/Object side/Left,/Participant/Effect{/Body part/Arm',
          closingBrace:
            '/Attribute/Object side/Left,/Participant/Effect}/Body part/Arm',
          openingBracket:
            '/Attribute/Object side/Left,/Participant/Effect[/Body part/Arm',
          closingBracket:
            '/Attribute/Object side/Left,/Participant/Effect]/Body part/Arm',
        }
        const expectedResults = {
          openingBrace: false,
          closingBrace: false,
          openingBracket: false,
          closingBracket: false,
        }
        const expectedIssues = {
          openingBrace: [
            generateIssue('invalidCharacter', {
              character: '{',
              index: 47,
              string: testStrings.openingBrace,
            }),
          ],
          closingBrace: [
            generateIssue('invalidCharacter', {
              character: '}',
              index: 47,
              string: testStrings.closingBrace,
            }),
          ],
          openingBracket: [
            generateIssue('invalidCharacter', {
              character: '[',
              index: 47,
              string: testStrings.openingBracket,
            }),
          ],
          closingBracket: [
            generateIssue('invalidCharacter', {
              character: ']',
              index: 47,
              string: testStrings.closingBracket,
            }),
          ],
        }
        validator(testStrings, expectedResults, expectedIssues)
      })

      it('should substitute and warn for certain illegal characters', () => {
        const testStrings = {
          nul:
            '/Attribute/Object side/Left,/Participant/Effect/Body part/Arm\0',
        }
        const expectedResults = {
          nul: false,
        }
        const expectedIssues = {
          nul: [
            generateIssue('invalidCharacter', {
              character: 'ASCII NUL',
              index: 61,
              string: testStrings.nul,
            }),
          ],
        }
        validator(testStrings, expectedResults, expectedIssues)
      })
    })

    describe('Individual HED Tags', () => {
      const validatorSyntactic = function(
        testStrings,
        expectedResults,
        expectedIssues,
        checkForWarnings,
      ) {
        validatorSyntacticBase(
          testStrings,
          expectedResults,
          expectedIssues,
          function(parsedTestString) {
            return hed.validateIndividualHedTags(
              parsedTestString,
              {},
              false,
              checkForWarnings,
            )
          },
        )
      }

      const validatorSemantic = function(
        testStrings,
        expectedResults,
        expectedIssues,
        checkForWarnings,
      ) {
        return validatorSemanticBase(
          testStrings,
          expectedResults,
          expectedIssues,
          function(parsedTestString, schema) {
            return hed.validateIndividualHedTags(
              parsedTestString,
              schema,
              true,
              checkForWarnings,
            )
          },
        )
      }

      it('should exist in the schema or be an allowed extension', () => {
        const testStrings = {
          takesValue: 'Event/Duration/3 ms',
          full: 'Attribute/Object side/Left',
          extensionAllowed: 'Item/Object/Person/Driver',
          leafExtension: 'Event/Category/Initial context/Something',
          nonExtensionAllowed: 'Event/Nonsense',
          illegalComma: 'Event/Label/This is a label,This/Is/A/Tag',
        }
        const expectedResults = {
          takesValue: true,
          full: true,
          extensionAllowed: false,
          leafExtension: false,
          nonExtensionAllowed: false,
          illegalComma: false,
        }
        const expectedIssues = {
          takesValue: [],
          full: [],
          extensionAllowed: [
            generateIssue('extension', { tag: testStrings.extensionAllowed }),
          ],
          leafExtension: [
            generateIssue('invalidTag', { tag: testStrings.leafExtension }),
          ],
          nonExtensionAllowed: [
            generateIssue('invalidTag', {
              tag: testStrings.nonExtensionAllowed,
            }),
          ],
          illegalComma: [
            generateIssue('extraCommaOrInvalid', {
              previousTag: 'Event/Label/This is a label',
              tag: 'This/Is/A/Tag',
            }),
          ],
        }
        return validatorSemantic(
          testStrings,
          expectedResults,
          expectedIssues,
          true,
        )
      })

      it('should have properly capitalized names', () => {
        const testStrings = {
          proper: 'Event/Category/Experimental stimulus',
          camelCase: 'DoubleEvent/Something',
          takesValue: 'Attribute/Temporal rate/20 Hz',
          numeric: 'Attribute/Repetition/20',
          lowercase: 'Event/something',
        }
        const expectedResults = {
          proper: true,
          camelCase: true,
          takesValue: true,
          numeric: true,
          lowercase: false,
        }
        const expectedIssues = {
          proper: [],
          camelCase: [],
          takesValue: [],
          numeric: [],
          lowercase: [
            generateIssue('capitalization', { tag: testStrings.lowercase }),
          ],
        }
        validatorSyntactic(testStrings, expectedResults, expectedIssues, true)
      })

      it('should have a child when required', () => {
        const testStrings = {
          hasChild: 'Event/Category/Experimental stimulus',
          missingChild: 'Event/Category',
        }
        const expectedResults = {
          hasChild: true,
          missingChild: false,
        }
        const expectedIssues = {
          hasChild: [],
          missingChild: [
            generateIssue('childRequired', { tag: testStrings.missingChild }),
          ],
        }
        return validatorSemantic(
          testStrings,
          expectedResults,
          expectedIssues,
          true,
        )
      })

      it('should have a unit when required', () => {
        const testStrings = {
          hasRequiredUnit: 'Event/Duration/3 ms',
          missingRequiredUnit: 'Event/Duration/3',
          notRequiredNoNumber: 'Attribute/Visual/Color/Red',
          notRequiredNumber: 'Attribute/Visual/Color/Red/0.5',
          notRequiredScientific: 'Attribute/Visual/Color/Red/5.2e-1',
          timeValue: 'Item/2D shape/Clock face/08:30',
        }
        const expectedResults = {
          hasRequiredUnit: true,
          missingRequiredUnit: false,
          notRequiredNoNumber: true,
          notRequiredNumber: true,
          notRequiredScientific: true,
          timeValue: true,
        }
        const expectedIssues = {
          hasRequiredUnit: [],
          missingRequiredUnit: [
            generateIssue('unitClassDefaultUsed', {
              defaultUnit: 's',
              tag: testStrings.missingRequiredUnit,
            }),
          ],
          notRequiredNoNumber: [],
          notRequiredNumber: [],
          notRequiredScientific: [],
          timeValue: [],
        }
        return validatorSemantic(
          testStrings,
          expectedResults,
          expectedIssues,
          true,
        )
      })

      it('should have a proper unit when required', () => {
        const testStrings = {
          correctUnit: 'Event/Duration/3 ms',
          correctUnitScientific: 'Event/Duration/3.5e1 ms',
          correctSingularUnit: 'Event/Duration/1 millisecond',
          correctPluralUnit: 'Event/Duration/3 milliseconds',
          correctNoPluralUnit: 'Attribute/Temporal rate/3 hertz',
          correctNonSymbolCapitalizedUnit: 'Event/Duration/3 MilliSeconds',
          correctSymbolCapitalizedUnit: 'Attribute/Temporal rate/3 kHz',
          incorrectUnit: 'Event/Duration/3 cm',
          incorrectPluralUnit: 'Attribute/Temporal rate/3 hertzs',
          incorrectSymbolCapitalizedUnit: 'Attribute/Temporal rate/3 hz',
          incorrectSymbolCapitalizedUnitModifier:
            'Attribute/Temporal rate/3 KHz',
          notRequiredNumber: 'Attribute/Visual/Color/Red/0.5',
          notRequiredScientific: 'Attribute/Visual/Color/Red/5e-1',
          properTime: 'Item/2D shape/Clock face/08:30',
          invalidTime: 'Item/2D shape/Clock face/54:54',
        }
        const expectedResults = {
          correctUnit: true,
          correctUnitScientific: true,
          correctSingularUnit: true,
          correctPluralUnit: true,
          correctNoPluralUnit: true,
          correctNonSymbolCapitalizedUnit: true,
          correctSymbolCapitalizedUnit: true,
          incorrectUnit: false,
          incorrectPluralUnit: false,
          incorrectSymbolCapitalizedUnit: false,
          incorrectSymbolCapitalizedUnitModifier: false,
          notRequiredNumber: true,
          notRequiredScientific: true,
          properTime: true,
          invalidTime: false,
        }
        const legalTimeUnits = ['s', 'second', 'day', 'minute', 'hour']
        const legalClockTimeUnits = ['hour:min', 'hour:min:sec']
        const legalFrequencyUnits = ['Hz', 'hertz']
        const expectedIssues = {
          correctUnit: [],
          correctUnitScientific: [],
          correctSingularUnit: [],
          correctPluralUnit: [],
          correctNoPluralUnit: [],
          correctNonSymbolCapitalizedUnit: [],
          correctSymbolCapitalizedUnit: [],
          incorrectUnit: [
            generateIssue('unitClassInvalidUnit', {
              tag: testStrings.incorrectUnit,
              unitClassUnits: legalTimeUnits.sort().join(','),
            }),
          ],
          incorrectPluralUnit: [
            generateIssue('unitClassInvalidUnit', {
              tag: testStrings.incorrectPluralUnit,
              unitClassUnits: legalFrequencyUnits.sort().join(','),
            }),
          ],
          incorrectSymbolCapitalizedUnit: [
            generateIssue('unitClassInvalidUnit', {
              tag: testStrings.incorrectSymbolCapitalizedUnit,
              unitClassUnits: legalFrequencyUnits.sort().join(','),
            }),
          ],
          incorrectSymbolCapitalizedUnitModifier: [
            generateIssue('unitClassInvalidUnit', {
              tag: testStrings.incorrectSymbolCapitalizedUnitModifier,
              unitClassUnits: legalFrequencyUnits.sort().join(','),
            }),
          ],
          notRequiredNumber: [],
          notRequiredScientific: [],
          properTime: [],
          invalidTime: [
            generateIssue('unitClassInvalidUnit', {
              tag: testStrings.invalidTime,
              unitClassUnits: legalClockTimeUnits.sort().join(','),
            }),
          ],
        }
        return validatorSemantic(
          testStrings,
          expectedResults,
          expectedIssues,
          false,
        )
      })
    })

    describe('HED Tag Levels', () => {
      const validatorSyntactic = function(
        testStrings,
        expectedResults,
        expectedIssues,
      ) {
        validatorSyntacticBase(
          testStrings,
          expectedResults,
          expectedIssues,
          function(parsedTestString) {
            return hed.validateHedTagLevels(parsedTestString, {}, false)
          },
        )
      }

      const validatorSemantic = function(
        testStrings,
        expectedResults,
        expectedIssues,
      ) {
        return validatorSemanticBase(
          testStrings,
          expectedResults,
          expectedIssues,
          function(parsedTestString, schema) {
            return hed.validateHedTagLevels(parsedTestString, schema, true)
          },
        )
      }

      it('should not contain duplicates', () => {
        const testStrings = {
          topLevelDuplicate:
            'Event/Category/Experimental stimulus,Event/Category/Experimental stimulus',
          groupDuplicate:
            'Item/Object/Vehicle/Train,(Event/Category/Experimental stimulus,Attribute/Visual/Color/Purple,Event/Category/Experimental stimulus)',
          noDuplicate:
            'Event/Category/Experimental stimulus,Item/Object/Vehicle/Train,Attribute/Visual/Color/Purple',
          legalDuplicate:
            'Item/Object/Vehicle/Train,(Item/Object/Vehicle/Train,Event/Category/Experimental stimulus)',
        }
        const expectedResults = {
          topLevelDuplicate: false,
          groupDuplicate: false,
          legalDuplicate: true,
          noDuplicate: true,
        }
        const expectedIssues = {
          topLevelDuplicate: [
            generateIssue('duplicateTag', {
              tag: 'Event/Category/Experimental stimulus',
            }),
          ],
          groupDuplicate: [
            generateIssue('duplicateTag', {
              tag: 'Event/Category/Experimental stimulus',
            }),
          ],
          legalDuplicate: [],
          noDuplicate: [],
        }
        validatorSyntactic(testStrings, expectedResults, expectedIssues)
      })

      it('should not have multiple copies of a unique tag', () => {
        const testStrings = {
          legal:
            'Event/Description/Rail vehicles,Item/Object/Vehicle/Train,(Item/Object/Vehicle/Train,Event/Category/Experimental stimulus)',
          multipleDesc:
            'Event/Description/Rail vehicles,Event/Description/Locomotive-pulled or multiple units,Item/Object/Vehicle/Train,(Item/Object/Vehicle/Train,Event/Category/Experimental stimulus)',
        }
        const expectedResults = {
          legal: true,
          multipleDesc: false,
        }
        const expectedIssues = {
          legal: [],
          multipleDesc: [
            generateIssue('multipleUniqueTags', { tag: 'event/description' }),
          ],
        }
        return validatorSemantic(testStrings, expectedResults, expectedIssues)
      })
    })

    describe('Top-level Tags', () => {
      const validator = function(testStrings, expectedResults, expectedIssues) {
        return validatorSemanticBase(
          testStrings,
          expectedResults,
          expectedIssues,
          function(parsedTestString, schema) {
            return hed.validateTopLevelTags(
              parsedTestString,
              schema,
              true,
              true,
            )
          },
        )
      }

      it('should include all required tags', () => {
        const testStrings = {
          complete:
            'Event/Label/Bus,Event/Category/Experimental stimulus,Event/Description/Shown a picture of a bus,Item/Object/Vehicle/Bus',
          missingLabel:
            'Event/Category/Experimental stimulus,Event/Description/Shown a picture of a bus,Item/Object/Vehicle/Bus',
          missingCategory:
            'Event/Label/Bus,Event/Description/Shown a picture of a bus,Item/Object/Vehicle/Bus',
          missingDescription:
            'Event/Label/Bus,Event/Category/Experimental stimulus,Item/Object/Vehicle/Bus',
          missingAllRequired: 'Item/Object/Vehicle/Bus',
        }
        const expectedResults = {
          complete: true,
          missingLabel: false,
          missingCategory: false,
          missingDescription: false,
          missingAllRequired: false,
        }
        const expectedIssues = {
          complete: [],
          missingLabel: [
            generateIssue('requiredPrefixMissing', {
              tagPrefix: 'event/label',
            }),
          ],
          missingCategory: [
            generateIssue('requiredPrefixMissing', {
              tagPrefix: 'event/category',
            }),
          ],
          missingDescription: [
            generateIssue('requiredPrefixMissing', {
              tagPrefix: 'event/description',
            }),
          ],
          missingAllRequired: [
            generateIssue('requiredPrefixMissing', {
              tagPrefix: 'event/label',
            }),
            generateIssue('requiredPrefixMissing', {
              tagPrefix: 'event/category',
            }),
            generateIssue('requiredPrefixMissing', {
              tagPrefix: 'event/description',
            }),
          ],
        }
        return validator(testStrings, expectedResults, expectedIssues)
      })
    })

    describe('HED Tag Groups', () => {
      const validator = function(testStrings, expectedResults, expectedIssues) {
        validatorSyntacticBase(
          testStrings,
          expectedResults,
          expectedIssues,
          function(parsedTestString) {
            return hed.validateHedTagGroups(parsedTestString)
          },
        )
      }

      it('should have no more than two tildes', () => {
        const testStrings = {
          noTildeGroup:
            'Event/Category/Experimental stimulus,(Item/Object/Vehicle/Train,Event/Category/Experimental stimulus)',
          oneTildeGroup:
            'Event/Category/Experimental stimulus,(Item/Object/Vehicle/Car ~ Attribute/Object control/Perturb)',
          twoTildeGroup:
            'Event/Category/Experimental stimulus,(Participant/ID 1 ~ Participant/Effect/Visual ~ Item/Object/Vehicle/Car, Item/ID/RedCar, Attribute/Visual/Color/Red)',
          invalidTildeGroup:
            'Event/Category/Experimental stimulus,(Participant/ID 1 ~ Participant/Effect/Visual ~ Item/Object/Vehicle/Car, Item/ID/RedCar, Attribute/Visual/Color/Red ~ Attribute/Object control/Perturb)',
        }
        const expectedResults = {
          noTildeGroup: true,
          oneTildeGroup: true,
          twoTildeGroup: true,
          invalidTildeGroup: false,
        }
        const expectedIssues = {
          noTildeGroup: [],
          oneTildeGroup: [],
          twoTildeGroup: [],
          invalidTildeGroup: [
            generateIssue('tooManyTildes', {
              tagGroup:
                '(Participant/ID 1 ~ Participant/Effect/Visual ~ Item/Object/Vehicle/Car, Item/ID/RedCar, Attribute/Visual/Color/Red ~ Attribute/Object control/Perturb)',
            }),
          ],
        }
        validator(testStrings, expectedResults, expectedIssues)
      })
    })

    describe('HED Strings', () => {
      const validator = function(
        testStrings,
        expectedResults,
        expectedIssues,
        allowPlaceholders = false,
      ) {
        return hedSchemaPromise.then(schema => {
          for (const testStringKey in testStrings) {
            const [testResult, testIssues] = hed.validateHedString(
              testStrings[testStringKey],
              schema,
              true,
              allowPlaceholders,
            )
            assert.strictEqual(
              testResult,
              expectedResults[testStringKey],
              testStrings[testStringKey],
            )
            assert.sameDeepMembers(
              testIssues,
              expectedIssues[testStringKey],
              testStrings[testStringKey],
            )
          }
        })
      }

      it('should skip tag group-level checks', () => {
        const testStrings = {
          duplicate: 'Item/Object/Vehicle/Train,Item/Object/Vehicle/Train',
          multipleUnique:
            'Event/Description/Rail vehicles,Event/Description/Locomotive-pulled or multiple units',
        }
        const expectedResults = {
          duplicate: true,
          multipleUnique: true,
        }
        const expectedIssues = {
          duplicate: [],
          multipleUnique: [],
        }
        return validator(testStrings, expectedResults, expectedIssues)
      })

      it('should properly handle strings with placeholders', () => {
        const testStrings = {
          takesValue: 'Attribute/Visual/Color/Red/#',
          withUnit: 'Event/Duration/# ms',
          child: 'Attribute/Object side/#',
          extensionAllowed: 'Item/Object/Person/Driver/#',
          invalidParent: 'Event/Nonsense/#',
          missingRequiredUnit: 'Event/Duration/#',
          wrongLocation: 'Item/#/Person',
        }
        const expectedResults = {
          takesValue: true,
          withUnit: true,
          child: false,
          extensionAllowed: false,
          invalidParent: false,
          missingRequiredUnit: false,
          wrongLocation: false,
        }
        const expectedIssues = {
          takesValue: [],
          withUnit: [],
          child: [generateIssue('invalidTag', { tag: testStrings.child })],
          extensionAllowed: [
            generateIssue('invalidTag', { tag: testStrings.extensionAllowed }),
          ],
          invalidParent: [
            generateIssue('invalidTag', { tag: testStrings.invalidParent }),
          ],
          missingRequiredUnit: [
            generateIssue('unitClassDefaultUsed', {
              defaultUnit: 's',
              tag: testStrings.missingRequiredUnit,
            }),
          ],
          wrongLocation: [
            generateIssue('invalidTag', { tag: testStrings.wrongLocation }),
          ],
        }
        return validator(testStrings, expectedResults, expectedIssues, true)
      })
    })
  })

  describe('Pre-v7.1.0 HED schemas', () => {
    const hedSchemaFile = 'tests/data/HED7.0.4.xml'
    let hedSchemaPromise

    beforeAll(() => {
      hedSchemaPromise = schema.buildSchema({
        path: hedSchemaFile,
      })
    })

    const validatorSemanticBase = function(
      testStrings,
      expectedResults,
      expectedIssues,
      testFunction,
    ) {
      return hedSchemaPromise.then(schema => {
        for (const testStringKey in testStrings) {
          const [parsedTestString, parseIssues] = stringParser.parseHedString(
            testStrings[testStringKey],
          )
          const testIssues = testFunction(parsedTestString, schema)
          const issues = [].concat(parseIssues, testIssues)
          const testResult = issues.length === 0
          assert.strictEqual(
            testResult,
            expectedResults[testStringKey],
            testStrings[testStringKey],
          )
          assert.sameDeepMembers(
            issues,
            expectedIssues[testStringKey],
            testStrings[testStringKey],
          )
        }
      })
    }

    describe('Individual HED Tags', () => {
      const validatorSemantic = function(
        testStrings,
        expectedResults,
        expectedIssues,
        checkForWarnings,
      ) {
        return validatorSemanticBase(
          testStrings,
          expectedResults,
          expectedIssues,
          function(parsedTestString, schema) {
            return hed.validateIndividualHedTags(
              parsedTestString,
              schema,
              true,
              checkForWarnings,
            )
          },
        )
      }

      it('should have a unit when required', () => {
        const testStrings = {
          hasRequiredUnit: 'Event/Duration/3 ms',
          missingRequiredUnit: 'Event/Duration/3',
          notRequiredNumber: 'Attribute/Visual/Color/Red/0.5',
          notRequiredScientific: 'Attribute/Visual/Color/Red/5.2e-1',
          timeValue: 'Item/2D shape/Clock face/08:30',
        }
        const expectedResults = {
          hasRequiredUnit: true,
          missingRequiredUnit: false,
          notRequiredNumber: true,
          notRequiredScientific: true,
          timeValue: true,
        }
        const expectedIssues = {
          hasRequiredUnit: [],
          missingRequiredUnit: [
            generateIssue('unitClassDefaultUsed', {
              defaultUnit: 's',
              tag: testStrings.missingRequiredUnit,
            }),
          ],
          notRequiredNumber: [],
          notRequiredScientific: [],
          timeValue: [],
        }
        return validatorSemantic(
          testStrings,
          expectedResults,
          expectedIssues,
          true,
        )
      })

      it('should have a proper unit when required', () => {
        const testStrings = {
          correctUnit: 'Event/Duration/3 ms',
          correctUnitWord: 'Event/Duration/3 milliseconds',
          correctUnitScientific: 'Event/Duration/3.5e1 ms',
          incorrectUnit: 'Event/Duration/3 cm',
          incorrectUnitWord: 'Event/Duration/3 nanoseconds',
          incorrectPrefix: 'Event/Duration/3 ns',
          notRequiredNumber: 'Attribute/Visual/Color/Red/0.5',
          notRequiredScientific: 'Attribute/Visual/Color/Red/5e-1',
          properTime: 'Item/2D shape/Clock face/08:30',
          invalidTime: 'Item/2D shape/Clock face/54:54',
        }
        const expectedResults = {
          correctUnit: true,
          correctUnitWord: true,
          correctUnitScientific: true,
          incorrectUnit: false,
          incorrectUnitWord: false,
          incorrectPrefix: false,
          notRequiredNumber: true,
          notRequiredScientific: true,
          properTime: true,
          invalidTime: false,
        }
        const legalTimeUnits = [
          's',
          'second',
          'seconds',
          'centiseconds',
          'centisecond',
          'cs',
          'hour:min',
          'day',
          'days',
          'ms',
          'milliseconds',
          'millisecond',
          'minute',
          'minutes',
          'hour',
          'hours',
        ]
        const expectedIssues = {
          correctUnit: [],
          correctUnitWord: [],
          correctUnitScientific: [],
          incorrectUnit: [
            generateIssue('unitClassInvalidUnit', {
              tag: testStrings.incorrectUnit,
              unitClassUnits: legalTimeUnits.sort().join(','),
            }),
          ],
          incorrectUnitWord: [
            generateIssue('unitClassInvalidUnit', {
              tag: testStrings.incorrectUnitWord,
              unitClassUnits: legalTimeUnits.sort().join(','),
            }),
          ],
          incorrectPrefix: [
            generateIssue('unitClassInvalidUnit', {
              tag: testStrings.incorrectPrefix,
              unitClassUnits: legalTimeUnits.sort().join(','),
            }),
          ],
          notRequiredNumber: [],
          notRequiredScientific: [],
          properTime: [],
          invalidTime: [
            generateIssue('unitClassInvalidUnit', {
              tag: testStrings.invalidTime,
              unitClassUnits: legalTimeUnits.sort().join(','),
            }),
          ],
        }
        return validatorSemantic(
          testStrings,
          expectedResults,
          expectedIssues,
          false,
        )
      })
    })
  })

  describe('Post-v8.0.0 HED schemas', () => {
    const hedSchemaFile = 'tests/data/HEDv1.6.10-reduced.xml'
    let hedSchemaPromise

    beforeAll(() => {
      hedSchemaPromise = converterSchema.buildSchema({
        path: hedSchemaFile,
      })
    })

    describe('Full HED Strings', () => {
      const validator = function(testStrings, expectedResults, expectedIssues) {
        return hedSchemaPromise.then(hedSchema => {
          for (const testStringKey in testStrings) {
            const [testResult, testIssues] = hed.validateHedEvent(
              testStrings[testStringKey],
              hedSchema,
              false,
            )
            assert.strictEqual(
              testResult,
              expectedResults[testStringKey],
              testStrings[testStringKey],
            )
            assert.sameDeepMembers(
              testIssues,
              expectedIssues[testStringKey],
              testStrings[testStringKey],
            )
          }
        })
      }

      it('properly validate short tags', () => {
        const testStrings = {
          simple: 'Car',
          groupAndValues: '(Train/Maglev,Age/15,RGB-red/0.5),Operate',
          invalidUnit: 'Duration/20 cm',
          duplicate: 'Train,Vehicle/Train',
          missingChild: 'Label',
        }
        const expectedResults = {
          simple: true,
          groupAndValues: true,
          invalidUnit: false,
          duplicate: false,
          missingChild: false,
        }
        const legalTimeUnits = ['s', 'second', 'day', 'minute', 'hour']
        const expectedIssues = {
          simple: [],
          groupAndValues: [],
          invalidUnit: [
            generateIssue('unitClassInvalidUnit', {
              tag: 'Attribute/Spatiotemporal/Temporal/Duration/20 cm',
              unitClassUnits: legalTimeUnits.sort().join(','),
            }),
          ],
          duplicate: [
            generateIssue('duplicateTag', {
              tag: 'Item/Object/Man-made/Vehicle/Train',
            }),
          ],
          missingChild: [
            generateIssue('childRequired', {
              tag: 'Attribute/Informational/Label',
            }),
          ],
        }
        return validator(testStrings, expectedResults, expectedIssues)
      })
    })
  })
})
