.import "../bass/FiguredBass.js" as FiguredBass
.import "../utils/Utils.js" as Utils
.import "../model/HarmonicFunction.js" as HarmonicFunction
.import "../harmonic/Exercise.js" as Exercise
.import "../commons/Consts.js" as Consts
.import "../commons/Errors.js" as Errors
.import "../model/Scale.js" as Scale
.import "../utils/IntervalUtils.js" as IntervalUtils
.import "../harmonic/Parser.js" as Parser

var DEBUG = false;

function ChordElement(notesNumbers, omit, bassElement) {
    this.notesNumbers = notesNumbers
    this.omit = omit
    this.bassElement = bassElement
    this.primeNote = undefined

    this.toString = function () {
        return "NotesNumbers: " + this.notesNumbers + " Omit: " + this.omit + " BassElement: " + this.bassElement + " PrimeNote: " + this.primeNote
    }
}


function BassTranslator() {

    this.makeChoiceAndSplit = function (functions) {

        var ret = []

        for (var i = 0; i < functions.length; i++) {
            if (functions[i].length === 1) {
                ret.push(functions[i][0])
            } else {
                if (i === 0 || i === functions.length - 1) {
                    if (functions[i][0].functionName === "T") {
                        ret.push(functions[i][0])
                    } else {
                        ret.push(functions[i][1])
                    }
                } else if (ret[ret.length - 1].functionName === "D") {
                    if (functions[i][0].functionName === "S") {
                        ret.push(functions[i][1])
                    } else {
                        ret.push(functions[i][0])
                    }
                } else if (i < functions.length - 1 && functions[i + 1].length === 1 && functions[i + 1][0].functionName === "S") {
                    if (functions[i][0].functionName === "D") {
                        ret.push(functions[i][1])
                    } else {
                        ret.push(functions[i][0])
                    }
                } else {
                    ret.push(functions[i][0])
                }
            }
        }
        return [ret]
    }


    this.completeFiguredBassNumbers = function (bassNumbers) {

        //empty -> 3,5
        if (bassNumbers.length === 0) {
            return [3, 5]
        }

        if (bassNumbers.length === 1) {
            // 5 -> 3,5
            if (Utils.contains(bassNumbers, 5)) {
                return [3, 5]
            }

            // 3 -> 3,5 (only alteration symbol)
            if (Utils.contains(bassNumbers, 3)) {
                return [3, 5]
            }

            // 6 -> 3,6
            if (Utils.contains(bassNumbers, 6)) {
                return [3, 6]
            }

            // 7 -> 3,5,7
            if (Utils.contains(bassNumbers, 7)) {
                return [3, 5, 7]
            }

            //2 -> 2,4,6
            if (Utils.contains(bassNumbers, 2)) {
                return [2, 4, 6]
            }
        }

        if (bassNumbers.length === 2) {
            if (Utils.contains(bassNumbers, 3)) {
                //3,4 -> 3,4,6
                if (Utils.contains(bassNumbers, 4)) {
                    return [3, 4, 6]
                } else if (Utils.contains(bassNumbers, 5)) {
                    // 3,5 -> 3,5
                    return [3, 5]
                } else if (Utils.contains(bassNumbers, 6)) {
                    // 3,6 -> 3,6
                    return [3, 6]
                } else if (Utils.contains(bassNumbers, 7)) {
                    //3, 7 -> 3,5,7
                    return [3, 5, 7]
                }

            }

            if (Utils.contains(bassNumbers, 4)) {
                //2,4 -> 2,4,6
                if (Utils.contains(bassNumbers, 2)) {
                    return [2, 4, 6]
                } else if (Utils.contains(bassNumbers, 6)) {
                    //4,6 -> 4,6
                    return [4, 6]
                }
            }

            if (Utils.contains(bassNumbers, 5)) {
                //5,7 -> 3,5,7
                if (Utils.contains(bassNumbers, 7)) {
                    return [3, 5, 7]
                } else if (Utils.contains(bassNumbers, 6)) {
                    //5,6 -> 3,5,6
                    return [3, 5, 6]
                }
            }

            //2,10 -> 2,4,10
            if (Utils.contains(bassNumbers, 2) && Utils.contains(bassNumbers, 10)) {
                return [2, 4, 10]
            }
            //9,7 -> 3,5,7,9
            if (Utils.contains(bassNumbers, 9) && Utils.contains(bassNumbers, 7)) {
                return [3, 5, 7, 9]
            }

        }

        if (bassNumbers.length === 3) {

            //6,5,7 -> 6,5,7 (but we save 5,6,7)

            if (Utils.contains(bassNumbers, 6) && Utils.contains(bassNumbers, 5)
                && Utils.contains(bassNumbers, 7)) {
                return [5, 6, 7]
            }

            ///3,7,9 -> 3,5,7,9
            if (Utils.contains(bassNumbers, 3) && Utils.contains(bassNumbers, 9)
                && Utils.contains(bassNumbers, 7)) {
                return [3, 5, 7, 9]
            }

            //3,5,7 -> 3,5,7
            if (Utils.contains(bassNumbers, 3) && Utils.contains(bassNumbers, 5)
                && Utils.contains(bassNumbers, 7)) {
                return [3, 5, 7]
            }

            //3,5,6 -> 3,5,6
            if (Utils.contains(bassNumbers, 3) && Utils.contains(bassNumbers, 5)
                && Utils.contains(bassNumbers, 6)) {
                return [3, 5, 6]
            }

            //3,4,6 -> 3,4,6
            if (Utils.contains(bassNumbers, 3) && Utils.contains(bassNumbers, 4)
                && Utils.contains(bassNumbers, 6)) {
                return [3, 4, 6]
            }

            //2,4,6 -> 2,4,6
            if (Utils.contains(bassNumbers, 2) && Utils.contains(bassNumbers, 4)
                && Utils.contains(bassNumbers, 6)) {
                return [2, 4, 6]
            }

            //2,4,10 -> 2,4,10
            if (Utils.contains(bassNumbers, 2) && Utils.contains(bassNumbers, 4)
                && Utils.contains(bassNumbers, 10)) {
                return [2, 4, 10]
            }

        }

        if (bassNumbers.length === 4) {
            //3,5,7,9
            if (Utils.contains(bassNumbers, 3) && Utils.contains(bassNumbers, 5)
                && Utils.contains(bassNumbers, 7) && Utils.contains(bassNumbers, 9)) {
                return [3, 5, 7, 9]
            }
        }

        throw new Errors.FiguredBassInputError("Invalid bass symbols:", bassNumbers)
    }

    this.completeFiguredBassSymbol = function (element) {

        if (DEBUG) {
            Utils.log("element.symbols.length: " + element.symbols.length)
            Utils.log("element.symbols before: " + element.symbols)
        }

        var bassNumbers = []
        for (var i = 0; i < element.symbols.length; i++) {
            if (element.symbols[i].component !== undefined) {
                bassNumbers.push(element.symbols[i].component)
            }
        }
        if (DEBUG) {
            Utils.log("BassNumbers:", bassNumbers)
        }

        var completedBassNumbers = this.completeFiguredBassNumbers(bassNumbers)

        if (DEBUG) Utils.log("completedBassNumbers:", completedBassNumbers)

        if (bassNumbers.length !== completedBassNumbers.length) {
            for (var i = 0; i < completedBassNumbers.length; i++) {
                if (!Utils.contains(bassNumbers, completedBassNumbers[i])) {
                    element.symbols.push(new FiguredBass.BassSymbol(completedBassNumbers[i]))
                }
            }
        }

        var sortedElements = element.symbols.sort(function (a, b) {
            return (parseInt(a.component) > parseInt(b.component)) ? 1 : -1
        })

    }


    this.buildChordElement = function (bassElement) {

        var chordElement = new ChordElement([bassElement.bassNote.baseNote], [], bassElement)

        for (var i = 0; i < bassElement.symbols.length; i++) {
            chordElement.notesNumbers.push(bassElement.bassNote.baseNote
                + bassElement.symbols[i].component - 1)
        }

        return chordElement
    }

    this.hasTwoNextThirds = function (chordElement) {
        if (chordElement.notesNumbers.length < 3) {
            return false
        }

        if (DEBUG) Utils.log("checking for next two thirds:", JSON.stringify(chordElement.notesNumbers))

        for (var i = 0; i < chordElement.notesNumbers.length; i++) {

            var n1 = Utils.mod(chordElement.notesNumbers[i], 7)
            var n2 = Utils.mod(chordElement.notesNumbers[Utils.mod(i + 1, chordElement.notesNumbers.length)], 7)
            var n3 = Utils.mod(chordElement.notesNumbers[Utils.mod(i + 2, chordElement.notesNumbers.length)], 7)

            if ((Utils.abs(n2 - n1) === 2 || Utils.abs(n2 - n1) === 5)
                && (Utils.abs(n3 - n2) === 2 || Utils.abs(n3 - n2) === 5)) {
                return true
            }
        }
        return false
    }

    this.addNextNote = function (chordElement) {
        for (var i = 0; i < chordElement.notesNumbers.length - 1; i++) {
            if (chordElement.notesNumbers[i + 1] - chordElement.notesNumbers[i] >= 4) {
                var temp = []

                for (var j = 0; j < chordElement.notesNumbers.length; j++) {
                    temp.push(chordElement.notesNumbers[j])
                    if (j === i) {
                        temp.push(chordElement.notesNumbers[j] + 2)
                    }
                }
                chordElement.notesNumbers = temp
                if (chordElement.notesNumbers.length >= 5) {
                    //nothing?
                    //chordElement.omit.push(Utils.mod((chordElement.notesNumbers[chordElement.notesNumbers.length - 1]), 7) + 1)
                }
                return
            }
        }
        chordElement.notesNumbers.push(chordElement.notesNumbers[chordElement.notesNumbers.length - 1] + 2)
        if (chordElement.notesNumbers.length >= 5) {
            //nothing?
            //      chordElement.omit.push(Utils.mod((chordElement.notesNumbers[chordElement.notesNumbers.length - 1]), 7) + 1)
        }
    }

    this.completeUntillTwoNextThirds = function (chordElement) {

        while (!this.hasTwoNextThirds(chordElement)) {
            this.addNextNote(chordElement)
        }
    }

    this.findPrime = function (chordElement) {

        var scaleNotes = []
        var primeNote = undefined //from 0 to 6

        for (var i = 0; i < chordElement.notesNumbers.length; i++) {
            scaleNotes.push(Utils.mod(chordElement.notesNumbers[i], 7))
        }

        if (DEBUG) Utils.log("Scale Notes: ", scaleNotes.toString())

        for (var i = 0; i < scaleNotes.length; i++) {
            var note = scaleNotes[i]

            while (Utils.contains(scaleNotes, Utils.mod((note - 2), 7))) {
                note = Utils.mod((note - 2), 7)
            }

            if (Utils.contains(scaleNotes, Utils.mod((note + 2), 7)) && Utils.contains(scaleNotes, Utils.mod((note + 4), 7))) {
                primeNote = note
                break
            }
        }

        if (primeNote !== undefined) {
            chordElement.primeNote = primeNote
        } else {
            chordElement.primeNote = scaleNotes[0]
        }
        if (DEBUG) Utils.log("Prime note: " + chordElement.primeNote)
    }

    this.getValidFunctions = function (chordElement, key) {
        var primeNote = chordElement.primeNote
        if (DEBUG) Utils.log("Chordelement:", chordElement)
        if (DEBUG) Utils.log("key: " + key)

        primeNote -= Consts.keyStrBase[key]
        if (DEBUG) Utils.log("primeNote: " + primeNote)
        if (DEBUG) Utils.log("Consts.keyStrBase[key]: " + Consts.keyStrBase[key])

        primeNote = Utils.mod(primeNote, 7)
        switch (primeNote) {
            case 0:
                return ["T"]
            case 1:
                return ["S"]
            case 2:
                return ["T", "D"]
            case 3:
                return ["S"]
            case 4:
                return ["D"]
            case 5:
                return ["T", "S"]
            case 6:
                return ["D"]
        }
    }

    this.getSortedSymbolsFromChordElement = function (chordElement) {
        var symbols = []

        for (var i = 0; i < chordElement.bassElement.symbols.length; i++) {
            symbols.push(chordElement.bassElement.symbols[i].component)
        }

        symbols.sort(function (a, b) {
            return (a > b) ? 1 : -1
        })

        return symbols
    }


    this.getValidPosition = function (chordElement, mode, key) {

        var symbols = this.getSortedSymbolsFromChordElement(chordElement)

        if (symbols.equals([5, 6, 7]) ||
            symbols.equals([2, 4, 10])) {
            return "9" + this.calculateAngleBracketForSpecificNote(mode, key, chordElement.primeNote, 9)
        } else {
            return undefined
        }

    }

    this.getValidPositionAndRevolution = function (chordElement, mode, functionName, degree, key) {

        var revolution = 1

        var prime = chordElement.primeNote

        var bass = chordElement.bassElement.bassNote.baseNote

        while (bass !== prime) {
            bass = Utils.mod((bass - 1), 7)
            revolution++
        }

        if (revolution === 3) {
            if (IntervalUtils.getThirdMode(key, degree === 7 ? 4 : degree - 1) === Consts.MODE.MINOR) {
                revolution = "3>"
            }
        }

        // if (mode === Consts.MODE.MINOR && revolution === 7
        //     && functionName !== Consts.FUNCTION_NAMES.DOMINANT) {
        //     revolution = "7<"
        // }

        var position = this.getValidPosition(chordElement, mode, key)

        return [position, revolution]
    }

    this.addExtraAndOmit = function (extra, omit, chordElement, mode, key) {
        var symbols = this.getSortedSymbolsFromChordElement(chordElement)


        if (symbols.equals([3, 5, 7]) || symbols.equals([2, 4, 6]) ||
            symbols.equals([3, 4, 6]) || symbols.equals([3, 5, 6]) ||
            symbols.equals([2, 4, 10]) || symbols.equals([5, 6, 7]) || symbols.equals([3, 5, 7, 9])) {

            if (!Utils.contains(extra, "7") &&
                !Utils.contains(extra, "7>") &&
                !Utils.contains(extra, "7<")) {
                extra.push("7" + this.calculateAngleBracketForSpecificNote(mode, key, chordElement.primeNote, 7))
            }
        }

        if (symbols.equals([2, 4, 10]) || symbols.equals([5, 6, 7]) || symbols.equals([3, 5, 7, 9])) {
            if (!Utils.contains(extra, "9") &&
                !Utils.contains(extra, "9>") &&
                !Utils.contains(extra, "9<")) {
                extra.push("9" + this.calculateAngleBracketForSpecificNote(mode, key, chordElement.primeNote, 9))
            }

            if (!Utils.contains(omit, "5") &&
                !Utils.contains(omit, "5>") &&
                !Utils.contains(omit, "5<")) {
                omit.push("5" + this.calculateAngleBracketForSpecificNote(mode, key, chordElement.primeNote, 5))
            }
        }

    }

    this.bassSymbolsHasGivenNumber = function (chordElement, number) {
        for (var i = 0; i < chordElement.bassElement.symbols.length; i++) {
            if (chordElement.bassElement.symbols[i].component === number) {
                return true
            }
        }
        return false
    }

    //works for 5 and 7 and 9
    this.calculateAngleBracketForSpecificNote = function (mode, key, primeNote, noteNumber) {
        //zrób to na podstawie pitchy
        var realPrime = Utils.mod(primeNote - Consts.keyStrBase[key], 7)
        var pitches = mode === Consts.MODE.MAJOR ? new Scale.MajorScale("a").pitches : new Scale.MinorScale("a").pitches
        var primePitch = pitches[realPrime]
        var notePitch = pitches[Utils.mod(realPrime + noteNumber - 1, 7)]
        var pitchDifference = Utils.mod(notePitch - primePitch, 12)

        if (DEBUG) Utils.log("realPrime", realPrime)
        if (DEBUG) Utils.log("pitches", pitches)
        if (DEBUG) Utils.log("primePitch", primePitch)
        if (DEBUG) Utils.log("notePitch", notePitch)
        if (DEBUG) Utils.log("pitchDifference", pitchDifference)

        if (noteNumber === 7) {
            return pitchDifference === 10 ? "" : "<"
        } else if (noteNumber === 9) {
            return pitchDifference === 1 ? ">" : ""
        } else { /// 5
            return pitchDifference === 6 ? ">" : ""
        }

    }

    this.substituteDelaysSymbols = function (delays) {
        var ret = delays
        for (var a = 0; a < ret.length; a++) {
            for (var b = 0; b < ret[a].length; b++) {
                ret[a][b] = ret[a][b].replace('b', '>')
                ret[a][b] = ret[a][b].replace('#', '<')
            }
        }
        return ret
    }

    this.translateDelays = function (delays, revolution, mode, degree) {
        var revNumber = parseInt(revolution[0])
        revNumber -= 1
        var delayNumber
        var delayString
        var degree1 = degree - 1
        var baseComponentsSemitonesNumber = {
            '1' : 0,
            '2' : 2,
            '3' : 4,
            '4' : 5,
            '5' : 7,
            '6' : 9,
            '7' : 10
        };

        var pitches = mode === Consts.MODE.MAJOR ? new Scale.MajorScale('a').pitches : new Scale.MinorScale('a').pitches
        for (var a = 0; a < delays.length; a++) {
            for (var b = 0; b < delays[a].length; b++) {
                delayNumber = parseInt(delays[a][b][0])
                delayNumber += revNumber
                delayNumber = delayNumber > 9 ? delayNumber - 7 : delayNumber
                delayString = delays[a][b].length > 1 ? delayNumber + "" + delays[a][b].substring(1) : delayNumber + ""
                if (b === 0 && delayString.length === 1 && delayNumber !== 8) {
                    var pitchDifference = Utils.mod(pitches[Utils.mod(delayNumber + degree1 - 1,7)] - pitches[degree1], 12)
                    if (baseComponentsSemitonesNumber[delayString] > pitchDifference) {
                        delays[a][b] = delayString + ">"
                        continue
                    }
                    if (baseComponentsSemitonesNumber[delayString] < pitchDifference) {
                        delays[a][b] = delayString + "<"
                        continue
                    }
                }
                delays[a][b] = delayString
            }
        }
        return delays
    }

    this.fixDelaysSymbols = function (delays, revolution, mode, degree) {
        var ret = this.substituteDelaysSymbols(delays)
        return this.translateDelays(ret, revolution, mode, degree)
    }

    this.changeDelaysDuringModeChange = function(delays, fromMinorToMajor) {
        for (var a = 0; a < delays.length; a++) {
            for (var b = 0; b < delays[a].length; b++) {
                if (delays[a][b][0] === "6" || delays[a][b][0] === "7") {
                    delays[a][b] = fromMinorToMajor ? this.decreaseByHalfTone(delays[a][b]) : this.increaseByHalfTone(delays[a][b])
                }
            }
        }
    }


    this.createHarmonicFunctionOrFunctions = function (chordElement, mode, key, delays) {
        var ret = []

        var functions = this.getValidFunctions(chordElement, key)

        for (var i = 0; i < functions.length; i++) {

            var functionName = functions[i]

            var degree = Utils.mod(chordElement.primeNote - Consts.keyStrBase[key], 7) + 1
            if (functionName === Consts.FUNCTION_NAMES.DOMINANT
                // && revolution === "1"
                && degree === 7
                // && this.getSortedSymbolsFromChordElement(chordElement).equals([3, 5])
            ) {
                chordElement.primeNote = Utils.mod(chordElement.primeNote - 2, 7)
            }


            var posAndRev = this.getValidPositionAndRevolution(chordElement, mode, functionName, degree, key)

            var position = posAndRev[0]
            var revolution = posAndRev[1].toString()
            var omit1 = []
            for (var z = 0; z < chordElement.omit.length; z++){
                omit1.push(chordElement.omit[z])
            }
            var omit = omit1
            var down = false
            var system = undefined
            var extra = []

            this.addExtraAndOmit(extra, omit, chordElement, mode, key)

            if (functionName === Consts.FUNCTION_NAMES.DOMINANT
                // && revolution === "1"
                && degree === 7
                // && this.getSortedSymbolsFromChordElement(chordElement).equals([3, 5])
            ) {
                if (DEBUG) Utils.log("Handling special situation: equivalent to hdf in C major -> D omit 1 extra 7")
                //revolution = mode === Consts.MODE.MAJOR ? "3" : "3>"

                if (!Utils.contains(omit, "1") &&
                    !Utils.contains(omit, "1>") &&
                    !Utils.contains(omit, "1<")) {
                    omit.push("1")
                }
                if (!Utils.contains(extra, "7") &&
                    !Utils.contains(extra, "7>") &&
                    !Utils.contains(extra, "7<")) {
                    extra.push("7" + this.calculateAngleBracketForSpecificNote(mode, key, chordElement.primeNote, 7))
                }
                if (this.bassSymbolsHasGivenNumber(chordElement, 7)
                    || (parseInt(revolution[0]) === 5 && this.bassSymbolsHasGivenNumber(chordElement, 5))
                    || (parseInt(revolution[0]) === 7 && this.bassSymbolsHasGivenNumber(chordElement, 3))) {
                    if (!Utils.contains(extra, "9") &&
                        !Utils.contains(extra, "9>") &&
                        !Utils.contains(extra, "9<")) {
                        extra.push("9" + this.calculateAngleBracketForSpecificNote(mode, key, chordElement.primeNote, 9))
                    }
                }

                degree = 5
            }

            if (revolution === "2") {
                revolution = "9" + this.calculateAngleBracketForSpecificNote(mode, key, chordElement.primeNote, 9)
            }

            if (revolution === "5") {
                revolution = revolution + this.calculateAngleBracketForSpecificNote(mode, key, chordElement.primeNote, 5)
            }

            if (revolution === "7") {
                revolution = revolution + this.calculateAngleBracketForSpecificNote(mode, key, chordElement.primeNote, 7)
            }

            //var delays1 = this.substituteDelaysSymbols(delays)

            var mode1 = !Utils.contains([2, 3, 6], degree) ? IntervalUtils.getThirdMode(key, degree === 7 ? 4 : degree - 1) : mode

            var delays1 = this.fixDelaysSymbols(delays, revolution, mode1, degree)

            if (DEBUG) {
                Utils.log("chordElement", JSON.stringify(chordElement))
                Utils.log("functionName", JSON.stringify(functionName))
                Utils.log("degree", JSON.stringify(degree))
                Utils.log("position", JSON.stringify(position))
                Utils.log("revolution", JSON.stringify(revolution))
                Utils.log("delays", JSON.stringify(delays1))
                Utils.log("extra", JSON.stringify(extra))
                Utils.log("omit", JSON.stringify(omit))
                Utils.log("down", JSON.stringify(down))
                Utils.log("system", JSON.stringify(system))
                Utils.log("mode", JSON.stringify(mode1))
            }

            var toAdd = new HarmonicFunction.HarmonicFunctionWithoutValidation(functionName, degree, position, revolution, delays1,
                extra, omit, down, system, mode1)

            if (DEBUG) Utils.log("toAdd", JSON.stringify(toAdd))

            ret.push(toAdd)
        }

        return ret
    }


    this.convertToFunctions = function (figuredBassExercise) {

        var harmonicFunctions = []
        var chordElements = []

        var bassElements = figuredBassExercise.elements

        for (var i = 0; i < bassElements.length; i++) {

            if (DEBUG) Utils.log("Bass elements before complete:", JSON.stringify(bassElements[i]))
            this.completeFiguredBassSymbol(bassElements[i])
            if (DEBUG) Utils.log("Bass elements after complete ", JSON.stringify(bassElements[i]))
            if (DEBUG) Utils.log("element.symbols after: " + JSON.stringify(bassElements[i].symbols))


            var chordElement = this.buildChordElement(bassElements[i])
            if (DEBUG) Utils.log("Chord element ", JSON.stringify(chordElement))

            this.completeUntillTwoNextThirds(chordElement)

            this.findPrime(chordElement)
            if (DEBUG) Utils.log("Chord element:", JSON.stringify(chordElement))

            var harmFunction = this.createHarmonicFunctionOrFunctions(chordElement,
                figuredBassExercise.mode,
                figuredBassExercise.key,
                bassElements[i].delays)

            bassElements[i].bassNote.chordComponent = parseInt(harmFunction[0].revolution)

            if (DEBUG) Utils.log("Harmonic function:", JSON.stringify(harmFunction))

            harmonicFunctions.push(harmFunction)
            chordElements.push(chordElement)
        }

        return [chordElements, harmonicFunctions]
    }

    this.convertBassToHarmonicFunctions = function (figuredBassExercise) {
        var chordElementsAndHarmonicFunctions = this.convertToFunctions(figuredBassExercise)

        var functions = chordElementsAndHarmonicFunctions[1]
        var elements = chordElementsAndHarmonicFunctions[0]

        if (DEBUG) Utils.log("Harmonic functions before split:", functions)
        return [elements, this.makeChoiceAndSplit(functions)]
    }

    this.removeRevolutionFromExtra = function (argsMap, revolution) {
        for (var a = 0; a < argsMap.extra.length; a++) {
            if (argsMap.extra[a][0] === (revolution + "")) {
                argsMap.extra.splice(a, 1)
            }
        }
    }

    this.increaseByHalfTone = function (a) {
        if (a === undefined) {
            return undefined
        }

        if (a.length === 1) {
            return a + "<"
        }

        if (a.length === 2 && a[1] === ">") {
            return a[0]
        } else {
            return a + "<"
        }
    }

    this.decreaseByHalfTone = function (a) {
        if (a === undefined) {
            return undefined
        }

        if (a.length === 1) {
            return a + ">"
        }

        if (a.length === 2 && a[1] === "<") {
            return a[0]
        } else {
            return a + ">"
        }
    }

    this.handleDownChord = function (argsMap) {
        if (Utils.contains(argsMap.extra, "1>")) {
            argsMap.omit = []
            argsMap.mode = Consts.MODE.MINOR
            argsMap.down = true
            var extra = []
            for (var a = 0; a < argsMap.extra.length; a++) {
                if (parseInt(argsMap.extra[a][0]) > 5) {
                    extra.push(this.increaseByHalfTone(argsMap.extra[a]))
                }
            }
            argsMap.extra = extra
            if (argsMap.position !== undefined) {
                argsMap.position = this.increaseByHalfTone(argsMap.position)
            }
            if (argsMap.revolution !== undefined) {
                argsMap.revolution = this.increaseByHalfTone(argsMap.revolution)
            }
            //probably?
            for (var a = 0; a < argsMap.delay.length; a++) {
                for (var b = 0; b < argsMap.delay[a].length; b++) {
                    argsMap.delay[a][b] = this.increaseByHalfTone(argsMap.delay[a][b])
                }
            }
        }
    }


    this.fixExtraAfterModeChange = function (argsMap) {
        if (argsMap.mode === Consts.MODE.MAJOR && Utils.contains(argsMap.extra, "3") && !Utils.contains([2, 3, 6], argsMap.degree)) {
            argsMap.extra.splice(argsMap.extra.indexOf("3"), 1)
        }
        if (argsMap.mode === Consts.MODE.MINOR && Utils.contains(argsMap.extra, "3>")) {
            argsMap.extra.splice(argsMap.extra.indexOf("3>"), 1)
        }
    }

    this.handleThirdAlterationIn236Chords = function (argsMap, toOmit, toExtra) {
        if (Utils.contains([2, 3, 6], argsMap.degree)) {
            if (argsMap.mode === Consts.MODE.MAJOR || argsMap.degree === 2) {
                if (Utils.contains(toOmit, 3) && Utils.contains(toExtra, "3<")) {
                    toOmit.splice(toOmit.indexOf(3), 1)
                    toOmit.push("3>")
                    toExtra.splice(toExtra.indexOf("3<"), 1)
                    toExtra.push("3")
                }
            } else {
                //nothing?
            }
        }
    }

    this.handleFifthAlterationIn236Chords = function (argsMap, toOmit, toExtra) {
        if (argsMap.degree === 2 && argsMap.mode === Consts.MODE.MINOR) {
            if (Utils.contains(toExtra, "5<")) {
                if (Utils.contains(toOmit, 5)) {
                    toOmit.splice(toOmit.indexOf(5), 1)
                } else if (Utils.contains(toOmit, "5")) {
                    toOmit.splice(toOmit.indexOf("5"), 1)
                }
                if (!Utils.contains(toOmit, "5>")) {
                    toOmit.push("5>")
                }

                toExtra.splice(toExtra.indexOf("5<"), 1)
                toExtra.push("5")
            }
        }
    }

    this.handle35AlterationsIn236Chords = function(argsMap, toOmit, toExtra) {
        this.handleThirdAlterationIn236Chords(argsMap, toOmit, toExtra)
        this.handleFifthAlterationIn236Chords(argsMap, toOmit, toExtra)
    }

    this.addOmit3ForS2IfNecessary = function(argsMap) {
        if (argsMap.degree === 2 && argsMap.mode === Consts.MODE.MINOR
            && argsMap.revolution === "3" && !Utils.contains(argsMap.omit, "3>")) {
            argsMap.omit.push("3>")
        }
    }

    this.handleAlterations = function (harmonicFunctions, chordElements, figuredBassExercise) {
        var mode = figuredBassExercise.mode

        var majorPitches = new Scale.MajorScale("a").pitches

        if (DEBUG) {
            Utils.log("Handle Alterations")
            Utils.log("harmonicFunctions:", JSON.stringify(harmonicFunctions))
            Utils.log("chordElements:", JSON.stringify(chordElements))
            Utils.log("mode:", JSON.stringify(mode))
            Utils.log("meter:", JSON.stringify(figuredBassExercise.meter))
            Utils.log("durations:", JSON.stringify(figuredBassExercise.durations))
            // if (DEBUG) Utils.log("harmonicFunctions[0].length:", harmonicFunctions[0].length)
            // if (DEBUG) Utils.log("figuredBassExercise.elements.length:", figuredBassExercise.elements.length)
            Utils.log("figuredBassExercise:", JSON.stringify(figuredBassExercise))
        }


        for (var i = 0; i < harmonicFunctions[0].length; i++) {

            var toOmit = []
            var toExtra = []

            for (var j = 0; j < chordElements[i].bassElement.symbols.length; j++) {

                if (chordElements[i].bassElement.symbols[j].alteration !== undefined) {

                    var number = chordElements[i].bassElement.symbols[j].component !== undefined ? chordElements[i].bassElement.symbols[j].component : 3;
                    var alteration = undefined

                    var baseNoteToAlter = Utils.mod(number + chordElements[i].bassElement.bassNote.baseNote - 1, 7)
                    if (DEBUG) Utils.log("baseNoteToAlter: " + baseNoteToAlter)

                    if (chordElements[i].bassElement.symbols[j].alteration === Consts.ALTERATIONS.NATURAL) {
                        //wyliczyć, czy aktualnie nuta jest z bemolem, czy z krzyżykiem
                        //zobacz, jaki basenote ma nuta, którą chcemy alterować --
                        //na podstawie tego weź jej pitch --
                        //weź nutę, któa faktycznie powinna teraz być czyli na postawie tonacji i dźwięku i skali i componentToAlter - 1
                        //jak base jest niższe, to sharp jak większe to flat

                        var baseNotePitch = majorPitches[baseNoteToAlter]
                        //maybe for future bass deflections
                        var keyToUse = harmonicFunctions[0][i].key !== undefined ? harmonicFunctions[0][i].key : figuredBassExercise.key

                        var pitches = Utils.contains(Consts.possible_keys_major, keyToUse) ? new Scale.MajorScale("a").pitches : new Scale.MinorScale("a").pitches

                        var realNotePitch = Utils.mod(
                            Consts.keyStrPitch[keyToUse] + pitches[Utils.mod(baseNoteToAlter - Consts.keyStrBase[keyToUse], 7)], 12)

                        alterationSymbol = Utils.mod(realNotePitch - baseNotePitch, 12) === 1 ? Consts.ALTERATIONS.SHARP : Consts.ALTERATIONS.FLAT

                        if (alterationSymbol === Consts.ALTERATIONS.SHARP) {
                            alteration = ">"
                        } else if (alterationSymbol === Consts.ALTERATIONS.FLAT) {
                            alteration = "<"
                        } else {
                            throw new Errors.FiguredBassInputError("Cannot natural the unaltered note", "Chord nr " + (i + 1))
                        }

                    } else if (chordElements[i].bassElement.symbols[j].alteration === Consts.ALTERATIONS.SHARP) {
                        alteration = "<"
                    } else {
                        alteration = ">"
                    }
                    if (DEBUG) Utils.log("Alteration: " + alteration)

                    var componentToAlter = Utils.mod(baseNoteToAlter - chordElements[i].primeNote, 7) + 1
                    componentToAlter = componentToAlter === 2 ? 9 : componentToAlter

                    if (DEBUG) Utils.log("componentToAlter: " + componentToAlter)

                    if (!Utils.contains(toOmit, componentToAlter)) {
                        toOmit.push(componentToAlter)
                        toExtra.push(componentToAlter + alteration)
                    }
                }
            }

            //handling alterations in bass note itself
            var alterationSymbol = Utils.getAlterationSymbolForNote(figuredBassExercise.elements[i].bassNote, figuredBassExercise.mode,
                figuredBassExercise.key)

            if (alterationSymbol !== undefined) {
                if (DEBUG) Utils.log("is altered " + i, JSON.stringify(figuredBassExercise.elements[i]))
                //z revolution zorientuj się, co masz dawać do omit i extra
                if (DEBUG) Utils.log("harm function", JSON.stringify(harmonicFunctions[0][i]))


                var revolutionString = harmonicFunctions[0][i].revolution.chordComponentString
                var revolution = parseInt(harmonicFunctions[0][i].revolution.baseComponent)

                if (DEBUG) Utils.log("revolutionString", revolutionString)
                if (DEBUG) Utils.log("revolution", revolution)
                if (DEBUG) Utils.log("alterationSymbol", alterationSymbol)

                if (!Utils.contains([7, 9], revolution)) {
                    toOmit.push(revolution)
                }
                var argsMap = harmonicFunctions[0][i].getArgsMapWithDelays()

                if (alterationSymbol === Consts.ALTERATIONS.SHARP) {
                    toExtra.push(revolution + "" + "<")
                    if (revolutionString[revolutionString.length - 1] !== ">") {
                        argsMap.revolution = revolutionString + "<"
                    } else {
                        argsMap.revolution = revolution + ""
                    }

                } else {
                    toExtra.push(revolution + "" + ">")
                    if (revolutionString[revolutionString.length - 1] !== "<") {
                        argsMap.revolution = revolutionString + ">"
                    } else {
                        argsMap.revolution = revolution + ""
                    }
                }
                if (DEBUG) Utils.log("harm function before copy", JSON.stringify(harmonicFunctions[0][i]))

                if (revolution === 3) {
                    if (mode === Consts.MODE.MINOR && Utils.contains(toExtra, "3<")) {
                        if (DEBUG) Utils.log("Changing chord mode to major")
                        if (!Utils.contains([2, 3, 6], argsMap.degree)) {
                            argsMap.mode = Consts.MODE.MAJOR
                            this.changeDelaysDuringModeChange(argsMap.delay, true)
                        }
                        toExtra.splice(toExtra.indexOf("3<"), 1)
                        toOmit.splice(toOmit.indexOf(3), 1)
                    }
                    if (mode === Consts.MODE.MAJOR && Utils.contains(toExtra, "3>")) {
                        if (DEBUG) Utils.log("Changing chord mode to minor")
                        if (!Utils.contains([2, 3, 6], argsMap.degree)) {
                            argsMap.mode = Consts.MODE.MINOR
                            this.changeDelaysDuringModeChange(argsMap.delay, false)
                        }
                        toExtra.splice(toExtra.indexOf("3>"), 1)
                        toOmit.splice(toOmit.indexOf(3), 1)
                    }
                }
                if (DEBUG) Utils.log("toOmit", JSON.stringify(toOmit))
                if (DEBUG) Utils.log("toExtra", JSON.stringify(toExtra))

                this.removeRevolutionFromExtra(argsMap, revolution)

                this.handleDownChord(argsMap)

                harmonicFunctions[0][i] = new HarmonicFunction.HarmonicFunction2(argsMap, true)
                if (DEBUG) Utils.log("harm function after copy", JSON.stringify(harmonicFunctions[0][i]))

            }

            if (DEBUG) Utils.log("toOmit", JSON.stringify(toOmit))
            if (DEBUG) Utils.log("toExtra", JSON.stringify(toExtra))

            if (Utils.contains(toOmit, 3)
                && ((mode === Consts.MODE.MINOR && toExtra[0] === "3<")
                    || (mode === Consts.MODE.MAJOR && toExtra[0] === "3>"))) {
                if (mode === Consts.MODE.MINOR && toExtra[0] === "3<") {
                    if (DEBUG) Utils.log("Changing chord mode to major")
                    if (!Utils.contains([2, 3, 6], harmonicFunctions[0][i].degree)) {
                        var argsMap = harmonicFunctions[0][i].getArgsMapWithDelays()
                        argsMap.mode = Consts.MODE.MAJOR
                        this.changeDelaysDuringModeChange(argsMap.delay, true)
                        harmonicFunctions[0][i] = new HarmonicFunction.HarmonicFunction2(argsMap, true)
                    }
                    toExtra.splice(toExtra.indexOf("3<"), 1)
                    toOmit.splice(toOmit.indexOf(3), 1)
                }
                if (mode === Consts.MODE.MAJOR && toExtra[0] === "3>") {
                    if (DEBUG) Utils.log("Changing chord mode to minor")
                    if (!Utils.contains([2, 3, 6], harmonicFunctions[0][i].degree)) {
                        var argsMap = harmonicFunctions[0][i].getArgsMapWithDelays()
                        argsMap.mode = Consts.MODE.MINOR
                        this.changeDelaysDuringModeChange(argsMap.delay, false)
                        harmonicFunctions[0][i] = new HarmonicFunction.HarmonicFunction2(argsMap, true)
                    }
                    toExtra.splice(toExtra.indexOf("3>"), 1)
                    toOmit.splice(toOmit.indexOf(3), 1)
                }
            }

            var argsMap = harmonicFunctions[0][i].getArgsMapWithDelays()
            if (DEBUG) Utils.log("argsMap " + JSON.stringify(argsMap))
            var addedSomething = false

            this.handle35AlterationsIn236Chords(argsMap, toOmit, toExtra)

            for (var a = 0; a < toOmit.length; a++) {
                if (!Utils.contains(argsMap.omit, toOmit[a] + "") && toOmit[a] !== 8) {
                    argsMap.omit.push(toOmit[a] + "")
                    addedSomething = true
                }
            }

            for (var a = 0; a < toExtra.length; a++) {
                var notAdd = false
                if (!Utils.contains(argsMap.extra, toExtra[a])
                    && (toExtra[a] !== "8" || toExtra[a] !== 8)) {
                    if (toExtra[a].length === 2) {
                        var toAlter = parseInt(toExtra[a][0])
                        var alter = toExtra[a][1]
                        //todo some refactor?
                        if (alter === "<") {
                            if (Utils.contains(argsMap.extra, toAlter + "" + ">")) {
                                if (argsMap.revolution !== toAlter + "" + "<") {
                                    argsMap.extra.splice(argsMap.extra.indexOf(toAlter + "" + ">"), 1)
                                    argsMap.extra.push(toAlter + "")
                                    if (Utils.contains(argsMap.omit, toAlter + "") && argsMap.revolution[0] !== toAlter + "") {
                                        argsMap.omit.splice(argsMap.omit.indexOf(toAlter + ""), 1)
                                    }
                                }
                                addedSomething = true
                                notAdd = true
                            } else if (Utils.contains(argsMap.extra, toAlter + "")) {
                                if (argsMap.revolution !== toAlter + "") {
                                    argsMap.extra.splice(argsMap.extra.indexOf(toAlter + ""), 1)
                                    argsMap.extra.push(toAlter + "<")
                                    if (Utils.contains(argsMap.omit, toAlter + "") && argsMap.revolution[0] !== toAlter + "") {
                                        argsMap.omit.splice(argsMap.omit.indexOf(toAlter + ""), 1)
                                    }
                                }
                                addedSomething = true
                                notAdd = true
                            }
                        } else {
                            if (Utils.contains(argsMap.extra, toAlter + "" + "<")) {
                                if (argsMap.revolution !== toAlter + "" + "<") {
                                    argsMap.extra.splice(argsMap.extra.indexOf(toAlter + "" + "<"), 1)
                                    argsMap.extra.push(toAlter + "")
                                    if (Utils.contains(argsMap.omit, toAlter + "") && argsMap.revolution[0] !== toAlter + "") {
                                        argsMap.omit.splice(argsMap.omit.indexOf(toAlter + ""), 1)
                                    }
                                }
                                addedSomething = true
                                notAdd = true
                            } else if (Utils.contains(argsMap.extra, toAlter + "")) {
                                if (argsMap.revolution !== toAlter + "") {
                                    argsMap.extra.splice(argsMap.extra.indexOf(toAlter + ""), 1)
                                    argsMap.extra.push(toAlter + ">")
                                    if (Utils.contains(argsMap.omit, toAlter + "") && argsMap.revolution[0] !== toAlter + "") {
                                        argsMap.omit.splice(argsMap.omit.indexOf(toAlter + ""), 1)
                                    }
                                }
                                addedSomething = true
                                notAdd = true
                            }
                        }
                    }
                    if (!notAdd) {
                        argsMap.extra.push(toExtra[a] + "")
                        addedSomething = true
                    }
                }
            }

            if (addedSomething) {
                this.handleDownChord(argsMap)
                this.fixExtraAfterModeChange(argsMap)
                this.addOmit3ForS2IfNecessary(argsMap)
                harmonicFunctions[0][i] = new HarmonicFunction.HarmonicFunction2(argsMap, true)
                if (DEBUG) Utils.log("harm function after copy adding toExtra and toOmit",
                    JSON.stringify(harmonicFunctions[0][i]))
            }

        }
    }

    this.split33Delays = function(harmonicFunctions, bassLine, chordElements) {

        var newFunctions = [];
        var newBassLine = []
        var newChordElements = []
        var pushed = false

        for (var i = 0; i < harmonicFunctions[0].length; i++) {
            pushed = false
            if (harmonicFunctions[0][i].delay.length > 0) {
                for (var a = 0; a < harmonicFunctions[0][i].delay.length; a++) {
                    if (harmonicFunctions[0][i].delay[a][0].baseComponent === "3"
                        && harmonicFunctions[0][i].delay[a][1].baseComponent === "3") {
                        var argsMap1 = harmonicFunctions[0][i].getArgsMapWithDelays()
                        var argsMap2 = harmonicFunctions[0][i].getArgsMapWithDelays()

                        if (argsMap1.delay[a][0] === "3" && argsMap1.delay[a][1] === "3>" &&
                            argsMap1.mode === Consts.MODE.MINOR && argsMap1.down === false) {
                            argsMap1.delay.splice(a, 1)
                            argsMap2.delay.splice(a, 1)
                            argsMap1.mode = Consts.MODE.MAJOR
                            argsMap1.revolution = argsMap1.revolution === "3>" ? "3" : argsMap1.revolution
                            var newHarmFunc1 = new HarmonicFunction.HarmonicFunction2(argsMap1, true)
                            var newHarmFunc2 = new HarmonicFunction.HarmonicFunction2(argsMap2, true)
                            newFunctions.push(newHarmFunc1)
                            newFunctions.push(newHarmFunc2)
                            newBassLine.push(bassLine[i])
                            newBassLine.push(bassLine[i])
                            newChordElements.push(chordElements[i])
                            newChordElements.push(chordElements[i])
                            pushed = true
                        } else if (argsMap1.delay[a][0] === "3>" && argsMap1.delay[a][1] === "3" &&
                            argsMap1.mode === Consts.MODE.MAJOR && argsMap1.down === false) {
                            argsMap1.delay.splice(a, 1)
                            argsMap2.delay.splice(a, 1)
                            argsMap1.mode = Consts.MODE.MINOR
                            argsMap1.revolution = argsMap1.revolution === "3" ? "3>" : argsMap1.revolution
                            var newHarmFunc1 = new HarmonicFunction.HarmonicFunction2(argsMap1, true)
                            var newHarmFunc2 = new HarmonicFunction.HarmonicFunction2(argsMap2, true)
                            newFunctions.push(newHarmFunc1)
                            newFunctions.push(newHarmFunc2)
                            newBassLine.push(bassLine[i])
                            newBassLine.push(bassLine[i])
                            newChordElements.push(chordElements[i])
                            newChordElements.push(chordElements[i])
                            pushed = false
                        }
                    }
                }
            }

            if (!pushed) {
                newFunctions.push(harmonicFunctions[0][i])
                newBassLine.push(bassLine[i])
                newChordElements.push(chordElements[i])
            }
        }
        return [[newFunctions], newBassLine, newChordElements]
    }

    this.testThird = function(hf) {
        var test3 = hf.getThird().chordComponentString === "3"
        if (hf.down) {
            return test3 && (hf.getThird().semitonesNumber === 3)
        } else {
            return test3 && (hf.getThird().semitonesNumber === 4)
        }
    }

    this.handleDeflections = function(harmonicFunctions, key, chordElements) {
        var newFunctions = [];

        /*
            * has 7 in extra
            * has 3 in extra or getThird is MAJOR (so semitonesNumber = 4)
            * is in dominant relation with next one
            * calculated key for possible deflection is different from exercise key
            * bass pitch is the same, as calculated pitch for this chord's revolution
            => calculated deflection key pith + 7 (as this is gonna be dominant) + semitones from chord's revolution
         */

        for (var i = 0; i < harmonicFunctions[0].length - 1; i++) {
            if (Utils.containsBaseChordComponent(harmonicFunctions[0][i].extra, "7")
                && (Utils.containsBaseChordComponent(harmonicFunctions[0][i].extra, "3")
                    || this.testThird(harmonicFunctions[0][i]))
                && harmonicFunctions[0][i].isInDominantRelation(harmonicFunctions[0][i + 1])
                && Parser.calculateKey(key, harmonicFunctions[0][i + 1]) !== key
                && (Utils.mod(chordElements[i].bassElement.bassNote.pitch, 12)
                    === Utils.mod(Consts.keyStrPitch[Parser.calculateKey(key, harmonicFunctions[0][i + 1])]
                        + harmonicFunctions[0][i].revolution.semitonesNumber + 7
                        + (harmonicFunctions[0][i].down ? 1 : 0),12))) {
                if (DEBUG) {
                    Utils.log("deflection here!")
                    // console.log(JSON.stringify(harmonicFunctions[0][i]))
                    Utils.log("i = " + i)
                }

                var argsMap = harmonicFunctions[0][i].getArgsMapWithDelays()

                argsMap.mode = Consts.MODE.MAJOR
                argsMap.degree = 5
                argsMap.functionName = Consts.FUNCTION_NAMES.DOMINANT
                argsMap.down = false

                for (var a = 0; a < argsMap.omit.length; a++) {
                    if (argsMap.omit[a] === 3 || argsMap.omit[a][0] === "3") {
                        argsMap.omit.splice(a, 1)
                        break
                    }
                }

                for (var a = 0; a < argsMap.extra.length; a++) {
                    if (argsMap.extra[a] === 3 || argsMap.extra[a][0] === "3") {
                        argsMap.extra.splice(a, 1)
                        break
                    }
                }

                //czy tutaj trzeba jakos wymusic mode major do klucza?
                var keyForHF = Parser.calculateKey(key, harmonicFunctions[0][i + 1])
                argsMap.key = keyForHF

                for (var a = 0; a < argsMap.extra.length; a++) {
                    if (argsMap.extra[a] === 7 || argsMap.extra[a][0] === "7") {
                        argsMap.extra.splice(a, 1)
                        break
                    }
                }

                argsMap.extra.push("7" +
                    this.calculateAngleBracketForSpecificNote(harmonicFunctions[0][i].mode, keyForHF, chordElements[i].primeNote, 7))

                for (var a = 0; a < argsMap.extra.length; a++) {
                    if (argsMap.extra[a] === 9 || argsMap.extra[a][0] === "9") {
                        argsMap.extra.splice(a, 1)
                        argsMap.extra.push("9" +
                            this.calculateAngleBracketForSpecificNote(harmonicFunctions[0][i].mode, keyForHF, chordElements[i].primeNote, 9))
                        break
                    }
                }

                if (argsMap.revolution === 7 || argsMap.revolution[0] === "7") {
                    argsMap.revolution = "7" + this.calculateAngleBracketForSpecificNote(harmonicFunctions[0][i].mode, keyForHF, chordElements[i].primeNote, 7)
                } else if (argsMap.revolution === 9 || argsMap.revolution[0] === "9") {
                    argsMap.revolution = "9" + this.calculateAngleBracketForSpecificNote(harmonicFunctions[0][i].mode, keyForHF, chordElements[i].primeNote, 9)
                }

                if (argsMap.position !== undefined && (argsMap.position === 9 || argsMap.position[0] === "9")) {
                    argsMap.position = "9" + this.calculateAngleBracketForSpecificNote(harmonicFunctions[0][i].mode, keyForHF, chordElements[i].primeNote, 9)
                }

                if (Utils.contains(argsMap.extra, "5") && Utils.contains(argsMap.omit, "5>")) {
                    argsMap.extra.splice(argsMap.extra.indexOf("5"), 1)
                    argsMap.omit.splice(argsMap.omit.indexOf("5>"), 1)
                }

                var newHF = new HarmonicFunction.HarmonicFunction2(argsMap, true)

                newFunctions.push(newHF)

            } else {
                newFunctions.push(harmonicFunctions[0][i])
            }
        }
        newFunctions.push(harmonicFunctions[0][harmonicFunctions[0].length - 1])
        return [newFunctions]
    }



    this.createExerciseFromFiguredBass = function (figuredBassExercise) {
        var chordElementsAndHarmonicFunctions = this.convertBassToHarmonicFunctions(figuredBassExercise)

        var harmonicFunctions = chordElementsAndHarmonicFunctions[1]
        var chordElements = chordElementsAndHarmonicFunctions[0]

        if (DEBUG) Utils.log("Harmonic functions after split", harmonicFunctions)

        var key = figuredBassExercise.mode === Consts.MODE.MAJOR ? figuredBassExercise.key : figuredBassExercise.key.toLowerCase()

        this.handleAlterations(harmonicFunctions, chordElements, figuredBassExercise)

        var bassLine = []
        for (var i = 0; i < figuredBassExercise.elements.length; i++) {
            bassLine.push(figuredBassExercise.elements[i].bassNote)
        }

        var harmBassLineAndChordElements = this.split33Delays(harmonicFunctions, bassLine, chordElements)

        harmBassLineAndChordElements[0] = this.handleDeflections(harmBassLineAndChordElements[0], key, harmBassLineAndChordElements[2])

        return [new Exercise.Exercise(key, figuredBassExercise.meter,
            figuredBassExercise.mode, harmBassLineAndChordElements[0]), harmBassLineAndChordElements[1]]
    }

}