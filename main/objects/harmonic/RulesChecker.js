.import "../utils/Utils.js" as Utils
.import "../commons/Errors.js" as Errors
.import "../commons/Consts.js" as Consts
.import "../utils/IntervalUtils.js" as IntervalUtils
.import "../model/HarmonicFunction.js" as HarmonicFunction
.import "../commons/BrokenRulesCounter.js" as BrokenRulesCounter

var DEBUG = false;

// I know that's bad as hell, but it was the easiest way :P
var fixedBass = false;
var fixedSoprano = false;

function skipCheckingVoiceIncorrectJump(voiceNumber) {
    return (voiceNumber === 0 && fixedBass)
        || (voiceNumber === 3 && fixedSoprano)
}

function correctDistanceBassTenor(chord, brokenRulesCounter){
    var ruleName = "correctDistanceBassTenor"

    if(chord.bassNote.baseChordComponentEquals('1') &&
        chord.tenorNote.chordComponent.semitonesNumber >= 12 &&
        IntervalUtils.pitchOffsetBetween(chord.tenorNote,chord.bassNote) < 12) {
        if(DEBUG) Utils.log("not correct distance between bass and tenor",  "tenor: " + chord.tenorNote + "\t" + "bass: " + chord.bassNote)

        if (brokenRulesCounter !== undefined) {
            brokenRulesCounter.increaseCounter(ruleName)
        }

        return false;
    }
    return true;
}

function concurrentOctaves(prevChord, currentChord, brokenRulesCounter){
    var ruleName = "concurrentOctaves"

    if(prevChord.harmonicFunction.equals(currentChord.harmonicFunction)) return 0;
    for(var i = 0; i < 3; i++){
        for(var j = i + 1; j < 4; j++){
            if(IntervalUtils.isOctaveOrPrime(prevChord.notes[j],prevChord.notes[i]) &&
                IntervalUtils.isOctaveOrPrime(currentChord.notes[j],currentChord.notes[i])){
                    if(DEBUG) Utils.log("concurrentOctaves "+i+" "+j, prevChord + " -> " + currentChord );
                    if (brokenRulesCounter !== undefined) {
                        brokenRulesCounter.increaseCounter(ruleName)
                    }
                    return -1;
                }
        }
    }
    return 0;
}

function concurrentFifths(prevChord, currentChord, brokenRulesCounter){
    var ruleName = "concurrentFifths"

    if(prevChord.harmonicFunction.equals(currentChord.harmonicFunction)) return 0;
    for(var i = 0; i < 3; i++){
        for(var j = i + 1; j < 4; j++){
            if(IntervalUtils.isFive(prevChord.notes[j],prevChord.notes[i]) &&
                IntervalUtils.isFive(currentChord.notes[j],currentChord.notes[i])){
                    if(DEBUG) Utils.log("concurrentFifths "+i+" "+j, prevChord + " -> " + currentChord);
                    if (brokenRulesCounter !== undefined) {
                        brokenRulesCounter.increaseCounter(ruleName)
                    }
                    return -1;
            }
        }
    }
    return 0;
}


function crossingVoices(prevChord, currentChord, brokenRulesCounter){
    var ruleName = "crossingVoices"

    for(var i = 0; i < 3; i++){
        if(currentChord.notes[i].isUpperThan(prevChord.notes[i+1])){
            if(DEBUG) Utils.log("crossingVoices", prevChord + " -> " + currentChord);
            if (brokenRulesCounter !== undefined) {
                brokenRulesCounter.increaseCounter(ruleName)
            }
            return -1
        }
    }
    for(var i = 3; i > 0; i--){
        if(currentChord.notes[i].isLowerThan(prevChord.notes[i-1])){
            if(DEBUG) Utils.log("crossingVoices", prevChord + " -> " + currentChord);
            if (brokenRulesCounter !== undefined) {
                brokenRulesCounter.increaseCounter(ruleName)
            }
            return -1
        }
    }
    return 0;
}

//TODO sprawdzić, czy w obrębie tej samej funkcji może być spełnione
function oneDirection(prevChord, currentChord, brokenRulesCounter){
    var ruleName = "oneDirection"

    if((currentChord.bassNote.isUpperThan(prevChord.bassNote) && currentChord.tenorNote.isUpperThan(prevChord.tenorNote)
        && currentChord.altoNote.isUpperThan(prevChord.altoNote) && currentChord.sopranoNote.isUpperThan(prevChord.sopranoNote))
        ||(currentChord.bassNote.isLowerThan(prevChord.bassNote) && currentChord.tenorNote.isLowerThan(prevChord.tenorNote)
            && currentChord.altoNote.isLowerThan(prevChord.altoNote) && currentChord.sopranoNote.isLowerThan(prevChord.sopranoNote))){
        if(DEBUG) Utils.log("oneDirection", prevChord + " -> " + currentChord);
        if (brokenRulesCounter !== undefined) {
            brokenRulesCounter.increaseCounter(ruleName)
        }
        return -1;
    }

    return 0;
}

//TODO wychylenie modulacyjne - ok, np zmiana tercji z malej na wielka | problem z tą samą funkcją - dziwne skoki w basic
function forbiddenJump(prevChord, currentChord, notNeighbourChords, brokenRulesCounter){
    var ruleName1 = "forbiddenJump"
    var ruleName2 = "alteredInterval"

    // if(!notNeighbourChords && prevChord.harmonicFunction.equals(currentChord.harmonicFunction)) return 0;

    for(var i = 0; i < 4; i++){
        //TODO upewnić się jak ze skokami jest naprawdę, basu chyba ta zasada się nie tyczy
        if(IntervalUtils.pitchOffsetBetween(currentChord.notes[i],prevChord.notes[i])>9 && !(notNeighbourChords && i === 0)
            && !skipCheckingVoiceIncorrectJump(i)) {
            if(DEBUG) Utils.log("Forbidden jump in voice "+i, prevChord + "->" + currentChord);
            if (brokenRulesCounter !== undefined) {
                brokenRulesCounter.increaseCounter(ruleName1)
            }
            return -1;
        }
        if(IntervalUtils.isAlteredInterval(prevChord.notes[i],currentChord.notes[i])) {
            if(DEBUG) Utils.log("Altered Interval in voice "+i, prevChord + "->" + currentChord);
            if (brokenRulesCounter !== undefined) {
                brokenRulesCounter.increaseCounter(ruleName2)
            }
            return -1;
        }
    }
    return 0;
}

//TODO wychylenie modulacyjne - ok, np zmiana tercji z malej na wielka, zmiana trybu
function forbiddenSumJump(prevPrevChord, prevChord, currentChord, brokenRulesCounter){
    var ruleName = "forbiddenSumJump"
    if(prevPrevChord === undefined || prevChord === undefined || currentChord === undefined) return 0;
    if(prevPrevChord.harmonicFunction.equals(prevChord.harmonicFunction)
        && prevChord.harmonicFunction.equals(currentChord.harmonicFunction)) return 0;
    for(var i = 0; i < 4; i++){
        if(((prevPrevChord.notes[i].isUpperThan(prevChord.notes[i]) && prevChord.notes[i].isUpperThan(currentChord.notes[i])) ||
            (prevPrevChord.notes[i].isLowerThan(prevChord.notes[i]) && prevChord.notes[i].isLowerThan(currentChord.notes[i])))
            && forbiddenJump(prevPrevChord, currentChord, true) === -1){
            if(DEBUG) {
                Utils.log("forbiddenSumJump in voice "+i, prevPrevChord + " -> " + prevChord + " -> " + currentChord);
            }
            if (brokenRulesCounter !== undefined) {
                brokenRulesCounter.increaseCounter(ruleName)
            }
            return -1;
        }
    }
    return 0;
}

function checkIllegalDoubled3(chord, brokenRulesCounter){
    var ruleName = "checkIllegalDoubled3"
    var result;
    var terCounter = chord.countBaseComponents("3");

    if(chord.harmonicFunction.isNeapolitan()) {
        result = terCounter !== 2;
    } else {
        result = terCounter > 1
    }

    if (brokenRulesCounter !== undefined && result) {
        brokenRulesCounter.increaseCounter(ruleName)
    }
    return result
}

function checkConnection(prevChord, currentChord, brokenRulesCounter){
    var ruleName = "checkConnection"

    var currentChordFunctionTemp = currentChord.harmonicFunction.copy();
    currentChordFunctionTemp.key = currentChord.harmonicFunction.key;
    var prevChordFunctionTemp = prevChord.harmonicFunction.copy();
    prevChordFunctionTemp.key = prevChord.harmonicFunction.key;
    if(prevChord.harmonicFunction.key !== currentChord.harmonicFunction.key){
        if(Utils.isDefined(prevChord.harmonicFunction.key) && !prevChord.harmonicFunction.isRelatedBackwards) {
            currentChordFunctionTemp.functionName = Consts.FUNCTION_NAMES.TONIC;
            currentChordFunctionTemp.degree = 1;
        }
        else if(currentChord.harmonicFunction.isRelatedBackwards){
            prevChordFunctionTemp.functionName = Consts.FUNCTION_NAMES.TONIC;
            prevChordFunctionTemp.degree = 1;
        } else return checkIllegalDoubled3(currentChord)? -1 : 0;
    }

    var couldHaveDouble3 = false;
    if((prevChord.harmonicFunction.functionName === Consts.FUNCTION_NAMES.DOMINANT
        && currentChordFunctionTemp.functionName === Consts.FUNCTION_NAMES.TONIC) ||
        Utils.containsBaseChordComponent(prevChord.harmonicFunction.extra, "7")){
        if(prevChord.harmonicFunction.isInDominantRelation(currentChordFunctionTemp)) {
            var dominantVoiceWith3 = -1;
            for (var i = 0; i < 4; i++) {
                if (prevChord.notes[i].baseChordComponentEquals("3")) {
                    dominantVoiceWith3 = i;
                    break;
                }
            }
            if (dominantVoiceWith3 > -1 &&
                !prevChord.notes[dominantVoiceWith3].equalPitches(currentChord.notes[dominantVoiceWith3]) &&
                !Utils.containsBaseChordComponent(currentChord.harmonicFunction.omit, "1") &&
                !currentChord.notes[dominantVoiceWith3].baseChordComponentEquals("1") &&
                !currentChord.notes[dominantVoiceWith3].baseChordComponentEquals("7") &&
                !currentChord.harmonicFunction.containsDelayedChordComponent("1") &&
                !(prevChord.bassNote.baseChordComponentEquals("3") && currentChord.bassNote.baseChordComponentEquals("3"))) {
                if (brokenRulesCounter !== undefined) {
                    brokenRulesCounter.increaseCounter(ruleName)
                }
                return -1;
            }

            if (Utils.containsBaseChordComponent(prevChord.harmonicFunction.extra, "7")) {
                var dominantVoiceWith7 = -1;
                for (var i = 0; i < 4; i++) {
                    if (prevChord.notes[i].baseChordComponentEquals("7")) {
                        dominantVoiceWith7 = i;
                        break;
                    }
                }
                if (dominantVoiceWith7 > -1 &&
                    !prevChord.notes[dominantVoiceWith7].equalPitches(currentChord.notes[dominantVoiceWith7]) &&
                    !currentChord.notes[dominantVoiceWith7].baseChordComponentEquals("3") &&
                    !currentChord.harmonicFunction.containsDelayedBaseChordComponent("3")){
                    //rozwiazanie swobodne mozliwe
                    if((currentChord.harmonicFunction.revolution.chordComponentString === "3" ||
                        currentChord.harmonicFunction.revolution.chordComponentString === "3>" ||
                        (currentChord.harmonicFunction.position !== undefined &&
                            (currentChord.harmonicFunction.position.chordComponentString === "3" ||
                        currentChord.harmonicFunction.position.chordComponentString === "3>"))) &&
                        dominantVoiceWith7 < dominantVoiceWith3) {
                        if(!currentChord.notes[dominantVoiceWith7].baseChordComponentEquals("5")) {
                            if (brokenRulesCounter !== undefined) {
                                brokenRulesCounter.increaseCounter(ruleName)
                            }
                            return -1;
                        }
                    }
                    else {
                        if (brokenRulesCounter !== undefined) {
                            brokenRulesCounter.increaseCounter(ruleName)
                        }
                        return -1;
                    }
                }
                if (Utils.containsBaseChordComponent(prevChord.harmonicFunction.extra, "9")) {
                    var dominantVoiceWith9 = -1;
                    for (var i = 0; i < 4; i++) {
                        if (prevChord.notes[i].baseChordComponentEquals("9")) {
                            dominantVoiceWith9 = i;
                            break;
                        }
                    }
                    if(dominantVoiceWith9 > -1 &&
                        !prevChord.notes[dominantVoiceWith9].equalPitches(currentChord.notes[dominantVoiceWith9]) &&
                        !currentChord.notes[dominantVoiceWith9].baseChordComponentEquals("5") &&
                        !currentChord.harmonicFunction.containsDelayedBaseChordComponent("5")) {
                        if (brokenRulesCounter !== undefined) {
                            brokenRulesCounter.increaseCounter(ruleName)
                        }
                        return -1;
                    }
                }
            }
            if (Utils.containsChordComponent(prevChord.harmonicFunction.extra, "5<")) {
                var dominantVoiceWithAlt5 = -1;
                for (var i = 0; i < 4; i++) {
                    if (prevChord.notes[i].chordComponentEquals("5<")) {
                        dominantVoiceWithAlt5 = i;
                        break;
                    }
                }
                if (dominantVoiceWithAlt5 > -1 &&
                    !prevChord.notes[dominantVoiceWithAlt5].equalPitches(currentChord.notes[dominantVoiceWithAlt5]) &&
                    !currentChord.notes[dominantVoiceWithAlt5].baseChordComponentEquals("3") &&
                    !currentChord.harmonicFunction.containsDelayedBaseChordComponent("3")) {
                    if (brokenRulesCounter !== undefined) {
                        brokenRulesCounter.increaseCounter(ruleName)
                    }
                    return -1;
                }
                //todo co jesli damy double 3 do dominanty wtrąconej? jedna tercja sie tylko prawidlowo rozwiazuje
                couldHaveDouble3 = true;
            }
            if (Utils.containsChordComponent(prevChord.harmonicFunction.extra, "5>")
                || prevChord.harmonicFunction.getFifth().chordComponentString === "5>") {
                var dominantVoiceWithAlt5 = -1;
                for (var i = 0; i < 4; i++) {
                    if (prevChord.notes[i].chordComponentEquals("5>")) {
                        dominantVoiceWithAlt5 = i;
                        break;
                    }
                }
                if (dominantVoiceWithAlt5 > -1 &&
                    !prevChord.notes[dominantVoiceWithAlt5].equalPitches(currentChord.notes[dominantVoiceWithAlt5]) &&
                    !currentChord.notes[dominantVoiceWithAlt5].baseChordComponentEquals("1") &&
                    !currentChord.harmonicFunction.containsDelayedBaseChordComponent("1")) {
                    if (brokenRulesCounter !== undefined) {
                        brokenRulesCounter.increaseCounter(ruleName)
                    }
                    return -1;
                }
            }
            if (prevChord.harmonicFunction.isChopin()){{
                var dominantVoiceWith6 = -1;
                for (var i = 0; i < 4; i++) {
                    if (prevChord.notes[i].baseChordComponentEquals("6")) {
                        dominantVoiceWith6 = i;
                        break;
                    }
                }
                if (dominantVoiceWith6 > -1 &&
                    !currentChord.notes[dominantVoiceWith6].chordComponentEquals("1") &&
                    !currentChord.harmonicFunction.containsDelayedChordComponent("1")) {
                    if (brokenRulesCounter !== undefined) {
                        brokenRulesCounter.increaseCounter(ruleName)
                    }
                    return -1;
                }
            }}
        }

        // todo 7 na 1, chyba inaczej, czy tylko dla D -> T?
        if(prevChordFunctionTemp.functionName === Consts.FUNCTION_NAMES.DOMINANT
            && currentChordFunctionTemp.functionName === Consts.FUNCTION_NAMES.TONIC
            && currentChordFunctionTemp.degree - prevChordFunctionTemp.degree === 1) {
            couldHaveDouble3 = true;
            var dominantVoiceWith3 = -1;
            for (var i = 0; i < 4; i++) {
                if (prevChord.notes[i].baseChordComponentEquals("3")) {
                    dominantVoiceWith3 = i;
                    break;
                }
            }
            if (dominantVoiceWith3 > -1 && !currentChord.notes[dominantVoiceWith3].baseChordComponentEquals("3") &&
                !currentChord.harmonicFunction.containsDelayedBaseChordComponent("3")) {
                if (brokenRulesCounter !== undefined) {
                    brokenRulesCounter.increaseCounter(ruleName)
                }
                return -1;
            }

            var dominantVoiceWith5 = -1;
            for (var i = 0; i < 4; i++) {
                if (prevChord.notes[i].baseChordComponentEquals("5")) {
                    dominantVoiceWith5 = i;
                    break;
                }
            }
            if (dominantVoiceWith5 > -1 && !currentChord.notes[dominantVoiceWith5].baseChordComponentEquals("3") &&
                !currentChord.harmonicFunction.containsDelayedBaseChordComponent("3")) {
                if (brokenRulesCounter !== undefined) {
                    brokenRulesCounter.increaseCounter(ruleName)
                }
                return -1;
            }

            if (Utils.containsChordComponent(prevChord.harmonicFunction.extra, "7")) {
                var dominantVoiceWith7 = -1;
                for (var i = 0; i < 4; i++) {
                    if (prevChord.notes[i].baseChordComponentEquals("7")) {
                        dominantVoiceWith7 = i;
                        break;
                    }
                }
                if (dominantVoiceWith7 > -1 && !currentChord.notes[dominantVoiceWith7].baseChordComponentEquals("5") &&
                    !currentChord.harmonicFunction.containsDelayedBaseChordComponent("5")) {
                    if (brokenRulesCounter !== undefined) {
                        brokenRulesCounter.increaseCounter(ruleName)
                    }
                    return -1;
                }
            }
            if (Utils.containsChordComponent(prevChord.harmonicFunction.extra, "5>")) {
                var dominantVoiceWithAlt5 = -1;
                for (var i = 0; i < 4; i++) {
                    if (prevChord.notes[i].chordComponentEquals("5>")) {
                        dominantVoiceWithAlt5 = i;
                        break;
                    }
                }
                if (dominantVoiceWithAlt5 > -1 &&
                    !prevChord.notes[dominantVoiceWithAlt5].equalPitches(currentChord.notes[dominantVoiceWithAlt5]) &&
                    !currentChord.notes[dominantVoiceWithAlt5].baseChordComponentEquals("3") &&
                    !currentChord.harmonicFunction.containsDelayedBaseChordComponent("3")) {
                        if (brokenRulesCounter !== undefined) {
                            brokenRulesCounter.increaseCounter(ruleName)
                        }
                        return -1;
                }
            }
        }
    }

    if(prevChordFunctionTemp.functionName === Consts.FUNCTION_NAMES.SUBDOMINANT
        && currentChordFunctionTemp.functionName === Consts.FUNCTION_NAMES.DOMINANT
        && prevChord.harmonicFunction.degree + 1 === currentChord.harmonicFunction.degree){
        //todo maybe for all connections?
        var vb = new Consts.VoicesBoundary();
        for(var i=1; i<4; i++){
            var higherPitch, lowerPitch;
            if(prevChord.notes[i].pitch > currentChord.notes[i].pitch){
                higherPitch = prevChord.notes[i].pitch;
                lowerPitch = currentChord.notes[i].pitch;
            } else {
                higherPitch = currentChord.notes[i].pitch;
                lowerPitch = prevChord.notes[i].pitch;
            }

            for(var j=1; j<4; j++){
                if(j !== i){
                    for(var currentPitch=currentChord.notes[j].pitch; currentPitch<vb.sopranoMax; currentPitch += 12){
                        if(currentPitch < higherPitch && currentPitch > lowerPitch){
                            if (brokenRulesCounter !== undefined) {
                                brokenRulesCounter.increaseCounter(ruleName)
                            }
                            return -1;
                        }
                    }
                    for(var currentPitch=currentChord.notes[j].pitch; currentPitch<vb.tenorMin; currentPitch -= 12){
                        if(currentPitch < higherPitch && currentPitch > lowerPitch){
                            if (brokenRulesCounter !== undefined) {
                                brokenRulesCounter.increaseCounter(ruleName)
                            }
                            return -1;
                        }
                    }
                }
            }
        }

        if(currentChord.bassNote.chordComponentEquals("1") && prevChord.bassNote.chordComponentEquals("1")) {
            for(var i = 1; i < 4; i++) {
                if (prevChord.notes[i].pitch - currentChord.notes[i].pitch < 0) {
                    if (brokenRulesCounter !== undefined) {
                        brokenRulesCounter.increaseCounter(ruleName)
                    }
                    return -1;
                }
            }
        }
    }

    if(prevChordFunctionTemp.equals(currentChordFunctionTemp)){
        if(prevChord.sopranoNote.equals(currentChord.sopranoNote) &&
            prevChord.altoNote.equals(currentChord.altoNote) &&
            prevChord.tenorNote.equals(currentChord.tenorNote) &&
            prevChord.bassNote.equalsInOneOctave(currentChord.bassNote)){
            if (brokenRulesCounter !== undefined) {
                brokenRulesCounter.increaseCounter(ruleName)
            }
            return -1;
        }
    }

    if(prevChord.harmonicFunction.functionName === Consts.FUNCTION_NAMES.DOMINANT
        && prevChord.harmonicFunction.mode === Consts.MODE.MAJOR
        && currentChordFunctionTemp.functionName === Consts.FUNCTION_NAMES.SUBDOMINANT){
        throw new Errors.RulesCheckerError("Forbidden connection: D->S");
    }

    if (!couldHaveDouble3 && checkIllegalDoubled3(currentChord)) {
        if (brokenRulesCounter !== undefined) {
            brokenRulesCounter.increaseCounter(ruleName)
        }
        return -1;
    }
    return 0;
}

function checkDelayCorrectness(prevChord, currentChord, brokenRulesCounter){
    var ruleName = "checkDelayCorrectness"

    var delay = prevChord.harmonicFunction.delay;
    if(delay.length === 0) return 0;
    var delayedVoices = [];
    for(var i=0; i<delay.length; i++){
        var prevComponent = delay[i][0];
        var currentComponent = delay[i][1];
        for(var j=0; j<4; j++){
            if(prevChord.notes[j].chordComponentEquals(prevComponent.chordComponentString)) {
                if(!currentChord.notes[j].chordComponentEquals(currentComponent.chordComponentString)){
                    if(DEBUG) Utils.log("delay error"+i+" "+j, prevChord + " -> " + currentChord);
                    if (brokenRulesCounter !== undefined) {
                        brokenRulesCounter.increaseCounter(ruleName)
                    }
                    return -1;
                }
                else delayedVoices.push(j);
            }
        }
    }
    for(var i=0; i<4; i++){
        if(Utils.contains(delayedVoices, i)) continue;
        if(!prevChord.notes[i].equalPitches(currentChord.notes[i]) && i !== 0) {
            if(DEBUG) Utils.log("delay error"+i+" "+j, prevChord + " -> " + currentChord);
            if (brokenRulesCounter !== undefined) {
                brokenRulesCounter.increaseCounter(ruleName)
            }
            return -1;
        }
    }
    return 0;
}

function hiddenOctaves(prevChord, currentChord, brokenRulesCounter){
    var ruleName = "hiddenOctaves"

    var sameDirection = (prevChord.bassNote.isLowerThan(currentChord.bassNote)
        && prevChord.sopranoNote.isLowerThan(currentChord.sopranoNote) ||
        (prevChord.bassNote.isUpperThan(currentChord.bassNote) && prevChord.sopranoNote.isUpperThan(currentChord.sopranoNote)));
    if(sameDirection && Utils.abs(prevChord.sopranoNote.pitch-currentChord.sopranoNote.pitch)>2 &&
        IntervalUtils.isOctaveOrPrime(currentChord.bassNote,currentChord.sopranoNote)){
        if(DEBUG) Utils.log("hiddenOctaves", prevChord + " -> " + currentChord);
        if (brokenRulesCounter !== undefined) {
            brokenRulesCounter.increaseCounter(ruleName)
        }
        return -1;
    }
    return 0;
}

function falseRelation(prevChord, currentChord, brokenRulesCounter){
    var ruleName = "falseRelation"

    for(var i=0; i<4; i++){
        if(IntervalUtils.isChromaticAlteration(prevChord.notes[i],currentChord.notes[i])){
            return 0;
        }
    }

    for(var i=0; i<4; i++){
        for(var j=i+1; j<4; j++){
            if(IntervalUtils.isChromaticAlteration(prevChord.notes[i],currentChord.notes[j])) {
                if(DEBUG) Utils.log("false relation between voices "+i+" "+j, prevChord + "->" + currentChord);
                if (brokenRulesCounter !== undefined) {
                    brokenRulesCounter.increaseCounter(ruleName)
                }
                return -1;
            }
            if(IntervalUtils.isChromaticAlteration(prevChord.notes[j],currentChord.notes[i])) {
                if(DEBUG) Utils.log("false relation between voices "+i+" "+j, prevChord + "->" + currentChord);
                if (brokenRulesCounter !== undefined) {
                    brokenRulesCounter.increaseCounter(ruleName)
                }
                return -1;
            }
        }
    }
    return 0;
}

function correctChopinChord(chord, brokenRulesCounter){
    var ruleName = "correctChopinChord"

    if(chord.harmonicFunction.isChopin()){
        var voiceWith6 = -1;
        var voiceWith7 = -1;
        for(var voice=0; voice<4; voice++){
            if(chord.notes[voice].baseChordComponentEquals("6"))
                voiceWith6 = voice;
            if(chord.notes[voice].chordComponentEquals("7"))
                voiceWith7 = voice;
        }
        if(voiceWith6 !== -1 && voiceWith7 !== -1 && voiceWith6 < voiceWith7){
            if (brokenRulesCounter !== undefined) {
                brokenRulesCounter.increaseCounter(ruleName)
            }
            return false;
        }
    }
    return true;
}

function correctNoneChord(chord, brokenRulesCounter){
    var ruleName = "correctNoneChord"

    if(!Utils.containsBaseChordComponent(chord.harmonicFunction.extra,9))
        return true;
    if(Utils.containsBaseChordComponent(["3","7"], chord.harmonicFunction.revolution)) {
        if(!chord.sopranoNote.baseChordComponentEquals("9") || !chord.tenorNote.baseChordComponentEquals("1")){
            if (brokenRulesCounter !== undefined) {
                brokenRulesCounter.increaseCounter(ruleName)
            }
            return false;
        }
    }
    return true;
};

function checkChordCorrectness(chord, brokenRulesCounter){
    if(!correctDistanceBassTenor(chord, brokenRulesCounter)) {
        return -1;
    }
    if(!correctChopinChord(chord, brokenRulesCounter)) {
        return -1;
    }
    if(!correctNoneChord(chord, brokenRulesCounter)) {
        return -1;
    }
    return 0;
}

function checkRules(prevPrevChord, prevChord, currentChord, rules, checkSumJumpRule, brokenRulesCounter){
    var result = 0;
    var oneRuleBroken = false
    var currentResult
    if(prevChord !== undefined){
        for (var i = 0; i < rules.length; i++) {
            currentResult = rules[i](prevChord, currentChord, brokenRulesCounter);
            if (currentResult === -1) {
                if (brokenRulesCounter === undefined) {
                    return -1;
                } else {
                    oneRuleBroken = true
                }
            } else {
                result += currentResult
            }
        }
        if (prevPrevChord !== undefined && checkSumJumpRule) {
            currentResult = forbiddenSumJump(prevPrevChord, prevChord, currentChord, brokenRulesCounter);
            if (currentResult === -1) {
                if (brokenRulesCounter === undefined) {
                    return -1;
                } else {
                    oneRuleBroken = true
                }
            } else {
                result += currentResult;
            }
        }
    } else if(checkIllegalDoubled3(currentChord, brokenRulesCounter)) {
        if (brokenRulesCounter === undefined) {
            return -1;
        } else {
            oneRuleBroken = true
        }
    }
    currentResult = checkChordCorrectness(currentChord, brokenRulesCounter);
    if (currentResult === -1) {
        if (brokenRulesCounter === undefined) {
            return -1;
        } else {
            oneRuleBroken = true
        }
    } else {
        result += currentResult;
    }

    if (brokenRulesCounter === undefined) {
        return result
    } else {
        if (oneRuleBroken) {
            return -1
        } else {
            return result
        }
    }
}

function checkAllRules(prevPrevChord, prevChord, currentChord, isFixedBass, isFixedSoprano, brokenRulesCounter){
    if (isFixedBass) {
        fixedBass = true
    } else {
        fixedBass = false
    }
    if (isFixedSoprano) {
        fixedSoprano = true
    } else {
        fixedSoprano = false
    }
    var chosenRules = [falseRelation, checkDelayCorrectness, checkConnection, concurrentOctaves, concurrentFifths, crossingVoices, oneDirection, forbiddenJump, hiddenOctaves];
    var result = checkRules(prevPrevChord ,prevChord, currentChord, chosenRules, true, brokenRulesCounter);
    return result
}

function getInitializedBrokenRulesCounter() {
    return new BrokenRulesCounter.BrokenRulesCounter([
        "correctDistanceBassTenor",
        "concurrentOctaves",
        "concurrentFifths",
        "crossingVoices",
        "oneDirection",
        "forbiddenJump",
        "forbiddenSumJump",
        "checkIllegalDoubled3",
        "checkConnection",
        "checkDelayCorrectness",
        "hiddenOctaves",
        "falseRelation",
        "correctChopinChord",
        "correctNoneChord",
        "alteredInterval"
    ], [
        "Incorrect distance between bass and tenor",
        "Concurrent octaves",
        "Concurrent fifths",
        "Crossing voices",
        "All voices goes in one direction",
        "Forbidden jump in one voice",
        "Forbidden sum of jumps in one voice",
        "Doubled third in chord",
        "Invalid connection between chords",
        "Invalid delay",
        "Hidden octaves",
        "False relation",
        "Incorrect Chopin chord",
        "Incorrect none chord",
        "Altered interval"
    ])
}
  
//to do should be implemented as Evaluator in RulesCheckerUtils (probably if RulesChecker refactor is done)
function ChordRelationEvaluator() {

    this.hardRules = [falseRelation, checkDelayCorrectness, checkConnection, concurrentOctaves, concurrentFifths, crossingVoices, oneDirection, hiddenOctaves, forbiddenJump]
    this.softRules = [forbiddenSumJump]

    //todo remove fifth argument
    this.evaluateHardRules = function(connection){
        return checkRules(undefined, connection.prev.content, connection.current.content, this.hardRules, false)
    }

    //todo remove fifth argument
    this.evaluateSoftRules = function (connection){
        var prevPrev = connection.prevPrev === undefined ? undefined : connection.prevPrev.content;
        return checkRules(prevPrev, connection.prev.content, connection.current.content, this.softRules, true);
    }


}