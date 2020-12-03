.import "../commons/Errors.js" as Errors
.import "../commons/Consts.js" as Consts
.import "../commons/BrokenRulesCounter.js" as BrokenRulesCounter
.import "../harmonic/ChordRulesChecker.js" as ChordRulesChecker
.import "../commons/RulesCheckerUtils.js" as RulesCheckerUtils
.import "../harmonic/ChordGenerator.js" as ChordGenerator

var DEBUG = false;

function checkDSConnection(harmonicFunctions, indexes) {
    for (var i = 0; i < harmonicFunctions.length - 1; i++) {
        if (harmonicFunctions[i].functionName === Consts.FUNCTION_NAMES.DOMINANT
            && harmonicFunctions[i + 1].functionName === Consts.FUNCTION_NAMES.SUBDOMINANT
            && harmonicFunctions[i].mode === Consts.MODE.MAJOR
            && harmonicFunctions[i].key === harmonicFunctions[i+1].key) {
            throw new Errors.PreCheckerError("Forbidden connection: D->S", "Chords: " + (indexes[i]) + " " + (indexes[i + 1])
                + "\nChord " + (indexes[i]) + "\n" + (DEBUG ? JSON.stringify(harmonicFunctions[i]) : harmonicFunctions[i].toString())
                + "\nChord " + (indexes[i + 1]) + "\n" + (DEBUG ? JSON.stringify(harmonicFunctions[i + 1]) : harmonicFunctions[i].toString()))
        }
    }
}

function checkForImpossibleConnections(harmonicFunctions, chordGenerator, bassLine, indexes) {
    var currentChords
    var prevChords = undefined
    var goodCurrentChords = []
    var usedCurrentChords = []
    var score
    var chordsWithDelays = 0
    var allConnections = 0

    var isBassDefined = bassLine !== undefined

    var rulesChecker = new ChordRulesChecker.ChordRulesChecker(isBassDefined);

    for (var i = 0; i < harmonicFunctions.length; i++) {
        allConnections = 0
        if(harmonicFunctions[i].delay.length > 0){
            chordsWithDelays += (harmonicFunctions[i].delay[0].length - 1)
        }
        if (i !== 0) {
            prevChords = goodCurrentChords
        }
        goodCurrentChords = []
        usedCurrentChords = []
        if (isBassDefined) {
            currentChords = chordGenerator.generate(new ChordGenerator.ChordGeneratorInput(harmonicFunctions[i],i!==0,undefined,bassLine[i]))
        } else {
            currentChords = chordGenerator.generate(new ChordGenerator.ChordGeneratorInput(harmonicFunctions[i],i!==0))
        }

        if (DEBUG) console.log("generated for " + i + " " + currentChords.length)

        //todo do the same in chordGenerator
        if(i === 0){
            var illegalDoubledThirdRule = new ChordRulesChecker.IllegalDoubledThirdRule();
            currentChords = currentChords.filter(function(chord){return !illegalDoubledThirdRule.hasIllegalDoubled3Rule(chord)})
        }

        if (currentChords.length === 0) {
            if (DEBUG) console.log(harmonicFunctions[i])
            throw new Errors.PreCheckerError("Could not generate any chords for chord " + (indexes[i]),
                DEBUG ? JSON.stringify(harmonicFunctions[i]) : harmonicFunctions[i].toString())
        }

        for (var a = 0; a < currentChords.length; a++) {
            usedCurrentChords.push(false)
        }

        rulesChecker.initializeBrokenRulesCounter()

        if (i !== 0) {
            for (var a = 0; a < prevChords.length; a++) {
                for (var b = 0; b < currentChords.length; b++) {
                    allConnections++
                    if (!usedCurrentChords[b]) {
                        score = rulesChecker.evaluateAllRulesWithCounter(new RulesCheckerUtils.Connection(currentChords[b], prevChords[a]))
                        if (score !== -1) {
                            goodCurrentChords.push(currentChords[b])
                            usedCurrentChords[b] = true
                        }
                    }
                }
            }
        } else {
            for (var b = 0; b < currentChords.length; b++) {
                allConnections++
                goodCurrentChords.push(currentChords[b])
            }
        }
        rulesChecker.getBrokenRulesCounter().setAllConnections(allConnections)

        if (goodCurrentChords.length === 0) {
            var brokenRulesStringInfo = rulesChecker.getBrokenRulesCounter().getBrokenRulesStringInfo()

            if (i !== 0) {
                throw new Errors.PreCheckerError("Could not find valid connection between chords " + (indexes[i - 1]) + " and " + (indexes[i]),
                    "\nChord " + (indexes[i - 1])+ "\n" + (DEBUG ? JSON.stringify(harmonicFunctions[i - 1]) : harmonicFunctions[i - 1].toString())
                    + "\nChord " + (indexes[i]) + "\n" + (DEBUG ? JSON.stringify(harmonicFunctions[i]) : harmonicFunctions[i].toString())
                        + "\nBroken rules for all " + allConnections + " possible connections between these chords:\n" + brokenRulesStringInfo)
            } else {
                throw new Errors.PreCheckerError("Could not generate any correct chord for first chord",
                    (DEBUG ? JSON.stringify(harmonicFunctions[i]) : harmonicFunctions[i].toString())
                    + "\nBroken rules:\n" + brokenRulesStringInfo)
            }
        }
    }
}

function getHFIndexesBasedOnDelays(harmonicFunctions) {
    var ret = []
    var currentIndex = 1
    for (var a = 0; a < harmonicFunctions.length; a++, currentIndex++) {
        ret.push(currentIndex)
        if (harmonicFunctions[a].delay.length > 0) {
            ret.push(currentIndex)
            a++
        }
    }
    return ret
}


function preCheck(harmonicFunctions, chordGenerator, bassLine, sopranoLine) {
    if (sopranoLine !== undefined) {
        //we do not precheck soprano exercises, since there are more than one possible exercises considered and
        //we create those harmonic function exercises by ourselves
        return
    }
    if (DEBUG) console.log("Prechecker harmonic functions")
    if (DEBUG) console.log(JSON.stringify(harmonicFunctions))
    var indexes = getHFIndexesBasedOnDelays(harmonicFunctions)
    checkDSConnection(harmonicFunctions, indexes)
    checkForImpossibleConnections(harmonicFunctions, chordGenerator, bassLine, indexes)
}


