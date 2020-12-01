.import "../utils/Utils.js" as Utils
.import "../commons/Errors.js" as Errors
.import "../commons/Consts.js" as Consts
.import "../utils/IntervalUtils.js" as IntervalUtils
.import "../model/HarmonicFunction.js" as HarmonicFunction
.import "../commons/RulesCheckerUtils.js" as RulesCheckerUtils
.import "../algorithms/Graph.js" as Graph

var DEBUG = false;

function ChordRulesChecker(isFixedBass, isFixedSoprano){
    RulesCheckerUtils.Evaluator.call(this, 3);
    this.isFixedBass = isFixedBass;
    this.isFixedSoprano = isFixedSoprano;

    this.hardRules = [
        new ConcurrentOctavesRule("Consecutive octaves"),
        new ConcurrentFifthsRule("Consecutive fifths"),
        new IllegalDoubledThirdRule("Illegal double third"),
        new CrossingVoicesRule("Crossing voices"),
        new OneDirectionRule("One direction of voices"),
        new ForbiddenJumpRule(false, isFixedBass, isFixedSoprano, "Forbidden voice jump"),
        new CheckDelayCorrectnessRule("Incorrect delay"), //should stand here always
        new HiddenOctavesRule("Hidden consecutive octaves"),
        new FalseRelationRule("False relation"),
        new SameFunctionCheckConnectionRule("Repeated function voice wrong movement"),
        new DominantSubdominantCheckConnectionRule("Dominant subdominant relation voice wrong movement") //should stand here always
    ];
    this.softRules = [
        new ForbiddenSumJumpRule("Forbidden voice sum jump"),
        new ClosestMoveRule("Not closest move in voices"),
        new DoublePrimeOrFifthRule("Doubling prime/fifth due to revolution"),
        new SopranoBestLineRule("Soprano line should not contain big jumps"),
        new DominantRelationCheckConnectionRule("Dominant relation voice wrong movement"),
        new DominantSecondRelationCheckConnectionRule("Dominant second relation voice wrong movement"),
        new SubdominantDominantCheckConnectionRule("Subdominant Dominant relation voice wrong movement")
    ];
}

function AdaptiveChordRulesChecker(punishmentRatios){
    ChordRulesChecker.call(this, false, true);
    this.punishmentRatios = punishmentRatios;

    this.hardRules = [
        new CheckDelayCorrectnessRule("Incorrect delay"), //should stand here
        new DominantSubdominantCheckConnectionRule("Dominant subdominant relation voice wrong movement") //should stand here
    ];
    this.softRules = [
        new ForbiddenSumJumpRule("Forbidden voice sum jump"),
        new ClosestMoveRule("Not closest move in voices"),
        new DoublePrimeOrFifthRule("Doubling prime/fifth due to revolution"),
        new SopranoBestLineRule("Soprano line should not contain big jumps"),
        new DominantRelationCheckConnectionRule("Dominant relation voice wrong movement"),
        new DominantSecondRelationCheckConnectionRule("Dominant second relation voice wrong movement"),
        new SubdominantDominantCheckConnectionRule("Subdominant Dominant relation voice wrong movement"),
        new ClosestMoveInBassRule(true, "Not closest move in bass")
    ];

    this.addPunishmentRatiosToRules = function() {
        var rulesToAlter = Utils.getValuesOf(Consts.CHORD_RULES);

        for (var i = 0; i < rulesToAlter.length; i++) {
            var targetRuleSet = this.punishmentRatios[rulesToAlter[i]] === 1 ? this.hardRules : this.softRules;
            switch (rulesToAlter[i]) {
                case Consts.CHORD_RULES.ConcurrentOctaves:
                    targetRuleSet.push(new ConcurrentOctavesRule("Consecutive octaves", this.punishmentRatios[rulesToAlter[i]]));
                    break;
                case Consts.CHORD_RULES.ConcurrentFifths:
                    targetRuleSet.push(new ConcurrentFifthsRule("Consecutive fifths", this.punishmentRatios[rulesToAlter[i]]));
                    break;
                case Consts.CHORD_RULES.CrossingVoices:
                    targetRuleSet.push(new CrossingVoicesRule("Crossing voices", this.punishmentRatios[rulesToAlter[i]]));
                    break;
                case Consts.CHORD_RULES.OneDirection:
                    targetRuleSet.push(new OneDirectionRule("One direction of voices", this.punishmentRatios[rulesToAlter[i]]));
                    break;
                case Consts.CHORD_RULES.ForbiddenJump:
                    targetRuleSet.push(new ForbiddenJumpRule(false, this.isFixedBass, this.isFixedSoprano, "Forbidden voice jump", this.punishmentRatios[rulesToAlter[i]]));
                    break;
                case Consts.CHORD_RULES.HiddenOctaves:
                    targetRuleSet.push(new HiddenOctavesRule("Hidden consecutive octaves", this.punishmentRatios[rulesToAlter[i]]));
                    break;
                case Consts.CHORD_RULES.FalseRelation:
                    targetRuleSet.push(new FalseRelationRule("False relation", this.punishmentRatios[rulesToAlter[i]]));
                    break;
                case Consts.CHORD_RULES.SameFunctionCheckConnection:
                    targetRuleSet.push(new SameFunctionCheckConnectionRule("Repeated function voice wrong movement", this.punishmentRatios[rulesToAlter[i]]));
                    break;
                case Consts.CHORD_RULES.IllegalDoubledThird:
                    targetRuleSet.push(new IllegalDoubledThirdRule("Illegal double third", this.punishmentRatios[rulesToAlter[i]]));
                    break;
                default:
                    throw new Errors.UnexpectedInternalError("Incorrect rule type to alter", rulesToAlter[i]);
            }
        }
    }

    if(Utils.getValuesOf(this.punishmentRatios).length > 0)
        this.addPunishmentRatiosToRules();

}

/*
        HARD RULES
 */

function SameFunctionRule(){
    RulesCheckerUtils.IRule.call(this);
    this.evaluate = function(connection){
        if(connection.prev.harmonicFunction.equals(connection.current.harmonicFunction))
            return 0;
        return -1;
    }
}

var sfRule = new SameFunctionRule();


function SpecificFunctionConnectionRule(prevFunctionName, currentFunctionName){
    RulesCheckerUtils.IRule.call(this);
    this.currentFunctionName = currentFunctionName;
    this.prevFunctionName = prevFunctionName;
    this.evaluate = function(connection){
        if(connection.prev.harmonicFunction.functionName === this.prevFunctionName &&
            connection.current.harmonicFunction.functionName === this.currentFunctionName)
            return 0;
        return -1;
    }
}

var specificConnectionRuleDT = new SpecificFunctionConnectionRule(Consts.FUNCTION_NAMES.DOMINANT, Consts.FUNCTION_NAMES.TONIC);
var specificConnectionRuleDS = new SpecificFunctionConnectionRule(Consts.FUNCTION_NAMES.DOMINANT, Consts.FUNCTION_NAMES.SUBDOMINANT);
var specificConnectionRuleSD = new SpecificFunctionConnectionRule(Consts.FUNCTION_NAMES.SUBDOMINANT, Consts.FUNCTION_NAMES.DOMINANT);


function ConcurrentOctavesRule(details, evaluationRatio){
    RulesCheckerUtils.IRule.call(this, details, evaluationRatio);

    this.evaluate = function(connection){
        var currentChord = connection.current;
        var prevChord = connection.prev;
        if(sfRule.isNotBroken(connection)) return 0;
        for(var i = 0; i < 3; i++){
            for(var j = i + 1; j < 4; j++){
                if(IntervalUtils.isOctaveOrPrime(currentChord.notes[j],currentChord.notes[i]) &&
                    IntervalUtils.isOctaveOrPrime(prevChord.notes[j],prevChord.notes[i])){
                    if(DEBUG) Utils.log("concurrentOctaves "+i+" "+j, prevChord + " -> " + currentChord);
                    return this.evaluationRatio * 40;
                }
            }
        }
        return 0;
    }
}

function ConcurrentFifthsRule(details, evaluationRatio){
    RulesCheckerUtils.IRule.call(this, details, evaluationRatio);

    this.evaluate = function(connection) {
        var currentChord = connection.current;
        var prevChord = connection.prev;
        if (sfRule.isNotBroken(connection)) return 0;
        for (var i = 0; i < 3; i++) {
            for (var j = i + 1; j < 4; j++) {
                if (IntervalUtils.isFive(currentChord.notes[j], currentChord.notes[i]) &&
                    IntervalUtils.isFive(prevChord.notes[j], prevChord.notes[i])) {
                    if (DEBUG) Utils.log("concurrentFifths " + i + " " + j, prevChord + " -> " + currentChord);
                    return this.evaluationRatio * 40;
                }
            }
        }
        return 0;
    }
}

function CrossingVoicesRule(details, evaluationRatio){
    RulesCheckerUtils.IRule.call(this, details, evaluationRatio);

    this.evaluate = function(connection) {
        var currentChord = connection.current;
        var prevChord = connection.prev;
        for(var i = 0; i < 3; i++){
            if(currentChord.notes[i].isUpperThan(prevChord.notes[i+1])){
                if(DEBUG) Utils.log("crossingVoices", prevChord + " -> " + currentChord);
                return this.evaluationRatio * 60;
            }
        }
        for(var i = 3; i > 0; i--){
            if(currentChord.notes[i].isLowerThan(prevChord.notes[i-1])){
                if(DEBUG) Utils.log("crossingVoices", prevChord + " -> " + currentChord);
                return this.evaluationRatio * 60;
            }
        }
        return 0;
    }
}

function OneDirectionRule(details, evaluationRatio){
    RulesCheckerUtils.IRule.call(this, details, evaluationRatio);

    this.evaluate = function(connection) {
        var currentChord = connection.current;
        var prevChord = connection.prev;
        if ((currentChord.bassNote.isUpperThan(prevChord.bassNote) && currentChord.tenorNote.isUpperThan(prevChord.tenorNote)
            && currentChord.altoNote.isUpperThan(prevChord.altoNote) && currentChord.sopranoNote.isUpperThan(prevChord.sopranoNote))
            || (currentChord.bassNote.isLowerThan(prevChord.bassNote) && currentChord.tenorNote.isLowerThan(prevChord.tenorNote)
                && currentChord.altoNote.isLowerThan(prevChord.altoNote) && currentChord.sopranoNote.isLowerThan(prevChord.sopranoNote))) {
            if (DEBUG) Utils.log("oneDirection", prevChord + " -> " +currentChord);
            return this.evaluationRatio * 35;
        }

        return 0;
    }
}

function IllegalDoubledThirdRule(details, evaluationRatio){
    RulesCheckerUtils.IRule.call(this, details, evaluationRatio);
    this.evaluate = function(connection) {
        var currentChord = connection.current;
        var prevChord = connection.prev;
        if ((specificConnectionRuleDT.isNotBroken(connection) ||
            Utils.containsBaseChordComponent(prevChord.harmonicFunction.extra, "7")) &&
            prevChord.harmonicFunction.isInDominantRelation(currentChord.harmonicFunction) &&
            Utils.containsChordComponent(prevChord.harmonicFunction.extra, "5<"))
            return 0;
        if(specificConnectionRuleDT.isNotBroken(connection) && prevChord.harmonicFunction.isInSecondRelation(currentChord.harmonicFunction))
            return 0;

        return this.hasIllegalDoubled3Rule(currentChord)? this.evaluationRatio * 50 : 0
    };

    this.hasIllegalDoubled3Rule = function(chord){
        var terCounter = chord.countBaseComponents("3");
        if(chord.harmonicFunction.isNeapolitan())
            return terCounter !== 2;
        return terCounter > 1
    }
}

function ForbiddenJumpRule(notNeighbourChords, isFixedBass, isFixedSoprano, details, evaluationRatio){
    RulesCheckerUtils.IRule.call(this, details, evaluationRatio);
    this.notNeighbourChords = notNeighbourChords;
    this.isFixedBass = isFixedBass;
    this.isFixedSoprano = isFixedSoprano;

    this.evaluate = function(connection) {
        var currentChord = connection.current;
        var prevChord = connection.prev;
        // if(!notNeighbourChords && prevChord.harmonicFunction.equals(currentChord.harmonicFunction)) return 0;

        for (var i = 0; i < 4; i++) {
            //TODO upewnić się jak ze skokami jest naprawdę, basu chyba ta zasada się nie tyczy
            if (IntervalUtils.pitchOffsetBetween(currentChord.notes[i], prevChord.notes[i]) > 9 && !(this.notNeighbourChords && i === 0)
                && !(i === 0 && IntervalUtils.pitchOffsetBetween(currentChord.notes[i], prevChord.notes[i]) === 12) &&!this.skipCheckingVoiceIncorrectJump(i)) {
                if (DEBUG) Utils.log("Forbidden jump in voice " + i, prevChord + "->" + currentChord);
                return this.evaluationRatio * 40;
            }
            if (IntervalUtils.isAlteredInterval(prevChord.notes[i], currentChord.notes[i])) {
                if (DEBUG) Utils.log("Altered Interval in voice " + i, prevChord + "->" + currentChord);
                return this.evaluationRatio * 35;
            }
        }
        return 0;
    }

    this.skipCheckingVoiceIncorrectJump = function(voiceNumber) {
        return (voiceNumber === 0 && this.isFixedBass)
            || (voiceNumber === 3 && this.isFixedSoprano)
    }
}

var forbiddenJumpRulenoArgs = new ForbiddenJumpRule();

function CheckDelayCorrectnessRule(details){
    RulesCheckerUtils.IRule.call(this, details);

    this.evaluate = function(connection) {
        var currentChord = connection.current;
        var prevChord = connection.prev;
        var delay = prevChord.harmonicFunction.delay;
        if (delay.length === 0) return 0;
        var delayedVoices = [];
        for (var i = 0; i < delay.length; i++) {
            var prevComponent = delay[i][0];
            var currentComponent = delay[i][1];
            for (var j = 0; j < 4; j++) {
                if (prevChord.notes[j].chordComponentEquals(prevComponent.chordComponentString)) {
                    if (!currentChord.notes[j].chordComponentEquals(currentComponent.chordComponentString)) {
                        if (DEBUG) Utils.log("delay error" + i + " " + j, prevChord + " -> " + currentChord);
                        return -1;
                    } else delayedVoices.push(j);
                }
            }
        }
        for (var i = 0; i < 4; i++) {
            if (Utils.contains(delayedVoices, i)) continue;
            if (!prevChord.notes[i].equalPitches(currentChord.notes[i]) && i !== 0) {
                if (DEBUG) Utils.log("delay error" + i + " " + j, prevChord + " -> " + currentChord);
                return -1;
            }
        }
        return 0;
    }
}

function HiddenOctavesRule(details, evaluationRatio){
    RulesCheckerUtils.IRule.call(this, details, evaluationRatio);

    this.evaluate = function(connection) {
        var currentChord = connection.current;
        var prevChord = connection.prev;
        var sameDirection = (prevChord.bassNote.isLowerThan(currentChord.bassNote) && prevChord.sopranoNote.isLowerThan(currentChord.sopranoNote) ||
            (prevChord.bassNote.isUpperThan(currentChord.bassNote) && prevChord.sopranoNote.isUpperThan(currentChord.sopranoNote)));
        if (sameDirection && Utils.abs(prevChord.sopranoNote.pitch - currentChord.sopranoNote.pitch) > 2 &&
            IntervalUtils.isOctaveOrPrime(currentChord.bassNote, currentChord.sopranoNote)) {
            if (DEBUG) Utils.log("hiddenOctaves", prevChord + " -> " + currentChord);
            return this.evaluationRatio * 35;
        }
        return 0;
    }
}

function FalseRelationRule(details, evaluationRatio){
    RulesCheckerUtils.IRule.call(this, details, evaluationRatio);

    this.evaluate = function(connection) {
        var currentChord = connection.current;
        var prevChord = connection.prev;

        for (var i = 0; i < 4; i++) {
            for (var j = i + 1; j < 4; j++) {
                if (IntervalUtils.isChromaticAlteration(prevChord.notes[i], currentChord.notes[j])) {
                    if(!this.causedBySopranoOrBassSettings(prevChord, currentChord, i, j)) {
                        if (DEBUG) Utils.log("false relation between voices " + i + " " + j, prevChord + "->" + currentChord);
                        return this.evaluationRatio * 30;
                    }
                }
                if (IntervalUtils.isChromaticAlteration(prevChord.notes[j], currentChord.notes[i])) {
                    if(!this.causedBySopranoOrBassSettings(prevChord, currentChord, j, i)) {
                        if (DEBUG) Utils.log("false relation between voices " + j + " " + i, prevChord + "->" + currentChord);
                        return this.evaluationRatio * 30;
                    }
                }
            }
        }
        return 0;
    }

    this.causedBySopranoOrBassSettings = function(prevChord, currentChord, prevVoice, currentVoice){
        //for example D7 -> TVI -> (D) -> SII
        if(prevChord.countBaseComponents("3") === 2 && prevChord.notes[prevVoice].baseChordComponentEquals("3"))
            return true;
        //given bass, couldn't avoid false relation
        if(prevVoice === 0 || currentVoice === 0)
            return true;
        //given soprano, couldn't avoid false relation
        // if(prevVoice === 3 || currentVoice === 3){
        //     if(Utils.isDefined(prevChord.harmonicFunction.position) && Utils.isDefined(currentChord.harmonicFunction.position))
        //         return true;
        // }
        return false;
    }
}

var currentConnection = undefined
var currentConnectionTranslated = undefined

function ICheckConnectionRule(details){
    RulesCheckerUtils.IRule.call(this, details);

    this.evaluate = function(connection) {
        var translatedConnection = this.translateConnectionIncludingDeflections(connection);
        currentConnection = connection;
        currentConnectionTranslated = translatedConnection;
        if(!Utils.isDefined(translatedConnection))
            return 0;
        return this.evaluateIncludingDeflections(translatedConnection);
    };

    this.translateConnectionIncludingDeflections = function(connection){
        if(Utils.isDefined(currentConnection) && connection.equals(currentConnection))
            return currentConnectionTranslated;
        var currentChord = connection.current.copy();
        var prevChord = connection.prev.copy();
        var currentFunctionTranslated = currentChord.harmonicFunction.copy();
        currentFunctionTranslated.key = currentChord.harmonicFunction.key;
        var prevFunctionTranslated = prevChord.harmonicFunction.copy();
        prevFunctionTranslated.key = prevChord.harmonicFunction.key;
        if(prevChord.harmonicFunction.key !== currentChord.harmonicFunction.key){
            if(Utils.isDefined(prevChord.harmonicFunction.key) && !prevChord.harmonicFunction.isRelatedBackwards) {
                currentFunctionTranslated.functionName = Consts.FUNCTION_NAMES.TONIC;
                currentFunctionTranslated.degree = 1;
            } else if(currentChord.harmonicFunction.isRelatedBackwards){
                prevFunctionTranslated.functionName = Consts.FUNCTION_NAMES.TONIC;
                prevFunctionTranslated.degree = 1;
            } else
                return undefined
        }
        currentChord.harmonicFunction = currentFunctionTranslated;
        prevChord.harmonicFunction = prevFunctionTranslated;

        return new RulesCheckerUtils.Connection(currentChord, prevChord)
    };

    this.evaluateIncludingDeflections = function(connection){
        return new Error("ICheckConnectionRule default method was called")
    };

    //returns voice number with given base component, otherwise returns -1
    this.voiceWithBaseComponent = function(chord, baseComponent){
        var voiceWithGivenComponent = -1;
        for (var i = 0; i < 4; i++) {
            if (chord.notes[i].baseChordComponentEquals(baseComponent)) {
                voiceWithGivenComponent = i;
                break;
            }
        }
        return voiceWithGivenComponent;
    };

    //returns voice number with given chord component, otherwise returns -1
    this.voiceWithComponent = function(chord, chordComponent){
        var voiceWithGivenComponent = -1;
        for (var i = 0; i < 4; i++) {
            if (chord.notes[i].chordComponentEquals(chordComponent)) {
                voiceWithGivenComponent = i;
                break;
            }
        }
        return voiceWithGivenComponent;
    };

}

function DominantSubdominantCheckConnectionRule(details){

    ICheckConnectionRule.call(this, details);

    this.evaluateIncludingDeflections = function(connection){
        if (specificConnectionRuleDS.isNotBroken(connection) &&
            connection.prev.harmonicFunction.hasMajorMode())
            throw new Errors.RulesCheckerError("Forbidden connection: D->S");
        return 0;
    }
}

function SameFunctionCheckConnectionRule(details, evaluationRatio){

    ICheckConnectionRule.call(this, details, evaluationRatio);

    this.evaluateIncludingDeflections = function(connection){
        if(sfRule.isNotBroken(connection)){
                if(this.brokenChangePitchesRule(connection.current, connection.prev))
                    return this.evaluationRatio * 20;
        }
        return 0;
    };

    this.brokenChangePitchesRule = function(currentChord, prevChord) {
        return prevChord.sopranoNote.equals(currentChord.sopranoNote) &&
            prevChord.altoNote.equals(currentChord.altoNote) &&
            prevChord.tenorNote.equals(currentChord.tenorNote) &&
            prevChord.bassNote.equalsInOneOctave(currentChord.bassNote);
    };

}
/*
        END OF HARD RULES
 */

/*
        SOFT RULES
 */
function ForbiddenSumJumpRule(details){
    RulesCheckerUtils.IRule.call(this, details);

    this.evaluate = function(connection) {
        if(!Utils.isDefined(connection.prevPrev))
            return 0;
        var currentChord = connection.current;
        var prevChord = connection.prev;
        var prevPrevChord = connection.prevPrev;

        if (sfRule.isNotBroken(new RulesCheckerUtils.Connection(connection.prevPrev, connection.prev)) &&
            sfRule.isNotBroken(new RulesCheckerUtils.Connection(connection.prev, connection.current))) return 0;
        for (var i = 0; i < 4; i++) {
            if (((prevPrevChord.notes[i].isUpperThan(prevChord.notes[i]) && prevChord.notes[i].isUpperThan(currentChord.notes[i])) ||
                (prevPrevChord.notes[i].isLowerThan(prevChord.notes[i]) && prevChord.notes[i].isLowerThan(currentChord.notes[i])))
                && forbiddenJumpRulenoArgs.isBroken(new RulesCheckerUtils.Connection(connection.current, connection.prevPrev), true)) {
                if (DEBUG) {
                    Utils.log("forbiddenSumJump in voice " + i, prevPrevChord + " -> " + prevChord + " -> " + currentChord);
                }
                return 10;
            }
        }
        return 0;
    }
}

var vb = new Consts.VoicesBoundary();


function ClosestMoveRule(details){
    RulesCheckerUtils.IRule.call(this, details);

    this.evaluate = function(connection) {
        var currentChord = connection.current;
        var prevChord = connection.prev;
        for(var i=1; i<4; i++){
            var higherPitch, lowerPitch;
            if(prevChord.notes[i].pitch > currentChord.notes[i].pitch){
                higherPitch = prevChord.notes[i].pitch;
                lowerPitch = currentChord.notes[i].pitch;
            } else {
                higherPitch = currentChord.notes[i].pitch;
                lowerPitch = prevChord.notes[i].pitch;
            }

            for(var j=1; j<3; j++){
                if(j !== i){
                    for(var currentPitch=currentChord.notes[j].pitch; currentPitch<vb.sopranoMax; currentPitch += 12){
                        if(currentPitch < higherPitch && currentPitch > lowerPitch){
                            return 10;
                        }
                    }
                    for(var currentPitch=currentChord.notes[j].pitch; currentPitch<vb.tenorMin; currentPitch -= 12){
                        if(currentPitch < higherPitch && currentPitch > lowerPitch){
                            return 10;
                        }
                    }
                }
            }
        }
        return 0;
    };
}

function ClosestMoveInBassRule(isFixedSoprano, details){
    RulesCheckerUtils.IRule.call(this, details);

    this.isFixedSoprano = isFixedSoprano;

    this.evaluate = function(connection) {
        if(!this.isFixedSoprano)
            return 0;
        var currentChord = connection.current;
        var prevChord = connection.prev;
        var bassPitch = currentChord.bassNote.pitch;
        var prevBassPitch = prevChord.bassNote.pitch;
        var offset = Utils.abs(bassPitch - prevBassPitch);

        for(var i = 1; i < 4; i++){
            var pitch = currentChord.notes[i].pitch;
            if(Utils.contains(currentChord.harmonicFunction.getBasicChordComponents(), currentChord.notes[i].chordComponent) &&
                currentChord.harmonicFunction.revolution !== currentChord.notes[i].chordComponent){
                while(Utils.abs(prevBassPitch - pitch) >= 12)
                    pitch -= 12;
                if(Utils.abs(pitch - prevBassPitch) < offset)
                    return 50;
            }
        }
        return 0;
    };
}

//only for current chord - improvement
function DoublePrimeOrFifthRule(details) {
    RulesCheckerUtils.IRule.call(this, details);

    this.evaluate = function (connection) {
        var currentChord = connection.current;

        if(currentChord.harmonicFunction.countChordComponents() > 3)
            return 0;

        //double soprano component
        if(currentChord.harmonicFunction.revolution.chordComponentString === "1"){
            if(currentChord.countBaseComponents(currentChord.sopranoNote.chordComponent.baseComponent) === 1)
                return 2;
        }
        //double fifth if revolution === fifth
        if(currentChord.harmonicFunction.revolution.chordComponentString === currentChord.harmonicFunction.getFifth()){
            if(currentChord.countBaseComponents(currentChord.harmonicFunction.getFifth()) === 1)
                return 2;
        }
        return 0;
    }
}

//soprano line should not have big jumps
function SopranoBestLineRule(details){
    RulesCheckerUtils.IRule.call(this, details);

    this.evaluate = function (connection) {
        var currentChord = connection.current;
        var prevChord = connection.prev;

        if(IntervalUtils.pitchOffsetBetween(prevChord.sopranoNote, currentChord.sopranoNote) > 4)
            return 3;
        return 0;
    }
}

function DominantRelationCheckConnectionRule(details){

    ICheckConnectionRule.call(this, details);

    this.evaluateIncludingDeflections = function(connection) {
        var currentChord = connection.current;
        var prevChord = connection.prev;
        var result = 0;
        if ((specificConnectionRuleDT.isNotBroken(connection) ||
            Utils.containsBaseChordComponent(prevChord.harmonicFunction.extra, "7")) &&
            prevChord.harmonicFunction.isInDominantRelation(currentChord.harmonicFunction)){
            if(this.brokenThirdMoveRule(prevChord, currentChord))
                return 50;
            if (Utils.containsBaseChordComponent(prevChord.harmonicFunction.extra, "7")) {
                if(this.brokenSeventhMoveRule(prevChord, currentChord))
                    result += 20;
                if (Utils.containsBaseChordComponent(prevChord.harmonicFunction.extra, "9") && this.brokenNinthMoveRule(prevChord, currentChord))
                    result += 20;
            }
            if (Utils.containsChordComponent(prevChord.harmonicFunction.extra, "5<")  && this.brokenUpFifthMoveRule(prevChord, currentChord))
                result += 20;
            if ((Utils.containsChordComponent(prevChord.harmonicFunction.extra, "5>") || prevChord.harmonicFunction.getFifth().chordComponentString === "5>") &&
                this.brokenDownFifthMoveRule(prevChord, currentChord))
                result += 20;
            if (prevChord.harmonicFunction.isChopin() && this.brokenChopinMoveRule(prevChord, currentChord))
                return 50;
        }
        return result;
    };

    this.brokenThirdMoveRule = function(prevChord, currentChord){
        var dominantVoiceWith3 = this.voiceWithBaseComponent(prevChord, "3");
        return dominantVoiceWith3 > -1 &&
            !prevChord.notes[dominantVoiceWith3].equalPitches(currentChord.notes[dominantVoiceWith3]) &&
            !Utils.containsBaseChordComponent(currentChord.harmonicFunction.omit, "1") &&
            !currentChord.notes[dominantVoiceWith3].baseChordComponentEquals("1") &&
            !currentChord.notes[dominantVoiceWith3].baseChordComponentEquals("7") &&
            !currentChord.harmonicFunction.containsDelayedChordComponent("1") &&
            !(prevChord.bassNote.baseChordComponentEquals("3") && currentChord.bassNote.baseChordComponentEquals("3"));
    };

    this.brokenSeventhMoveRule = function(prevChord, currentChord){
        var dominantVoiceWith3 = this.voiceWithBaseComponent(prevChord, "3");
        var dominantVoiceWith7 = this.voiceWithBaseComponent(prevChord, "7");
        if (dominantVoiceWith7 > -1 &&
            !prevChord.notes[dominantVoiceWith7].equalPitches(currentChord.notes[dominantVoiceWith7]) &&
            !currentChord.notes[dominantVoiceWith7].baseChordComponentEquals("3") &&
            !currentChord.harmonicFunction.containsDelayedBaseChordComponent("3")) {
            //rozwiazanie swobodne mozliwe
            if ((currentChord.harmonicFunction.revolution.chordComponentString === "3" ||
                currentChord.harmonicFunction.revolution.chordComponentString === "3>" ||
                (Utils.isDefined(currentChord.harmonicFunction.position) && (currentChord.harmonicFunction.position.chordComponentString === "3" ||
                    currentChord.harmonicFunction.position.chordComponentString === "3>"))) &&
                dominantVoiceWith7 < dominantVoiceWith3) {
                if (!currentChord.notes[dominantVoiceWith7].baseChordComponentEquals("5")) return true;
            } else return true;
        }
        return false;
    };

    this.brokenNinthMoveRule = function(prevChord, currentChord){
        var dominantVoiceWith9 = this.voiceWithBaseComponent(prevChord, "9");
        return dominantVoiceWith9 > -1 &&
            !prevChord.notes[dominantVoiceWith9].equalPitches(currentChord.notes[dominantVoiceWith9]) &&
            !currentChord.notes[dominantVoiceWith9].baseChordComponentEquals("5") &&
            !currentChord.harmonicFunction.containsDelayedBaseChordComponent("5");
    };

    this.brokenUpFifthMoveRule = function(prevChord, currentChord){
        var dominantVoiceWithAlt5 = this.voiceWithComponent(prevChord, "5<");
        return dominantVoiceWithAlt5 > -1 &&
            !prevChord.notes[dominantVoiceWithAlt5].equalPitches(currentChord.notes[dominantVoiceWithAlt5]) &&
            !currentChord.notes[dominantVoiceWithAlt5].baseChordComponentEquals("3") &&
            !currentChord.harmonicFunction.containsDelayedBaseChordComponent("3");
    };

    this.brokenDownFifthMoveRule = function(prevChord, currentChord){
        var dominantVoiceWithAlt5 = this.voiceWithComponent(prevChord, "5>");
        return dominantVoiceWithAlt5 > -1 &&
            !prevChord.notes[dominantVoiceWithAlt5].equalPitches(currentChord.notes[dominantVoiceWithAlt5]) &&
            !currentChord.notes[dominantVoiceWithAlt5].baseChordComponentEquals("1") &&
            !currentChord.harmonicFunction.containsDelayedBaseChordComponent("1");
    };

    this.brokenChopinMoveRule = function(prevChord, currentChord){
        var dominantVoiceWith6 = this.voiceWithBaseComponent(prevChord, "6");
        return dominantVoiceWith6 > -1 &&
            !currentChord.notes[dominantVoiceWith6].chordComponentEquals("1") &&
            !currentChord.harmonicFunction.containsDelayedChordComponent("1");
    };
}

function DominantSecondRelationCheckConnectionRule(details){

    ICheckConnectionRule.call(this, details);

    this.evaluateIncludingDeflections = function(connection) {
        var currentChord = connection.current;
        var prevChord = connection.prev;
        var result = 0;
        if (specificConnectionRuleDT.isNotBroken(connection)
            && prevChord.harmonicFunction.isInSecondRelation(currentChord.harmonicFunction)) {
            if(this.brokenThirdMoveRule(prevChord, currentChord))
                return 50;
            if(this.brokenFifthMoveRule(prevChord, currentChord))
                result += 20;
            if (Utils.containsChordComponent(prevChord.harmonicFunction.extra, "7") && this.brokenSeventhMoveRule(prevChord, currentChord))
                result += 20;
            if (Utils.containsChordComponent(prevChord.harmonicFunction.extra, "5>") && this.brokenDownFifthMoveRule(prevChord, currentChord))
                result += 20;
        }
        return result;
    };

    this.brokenThirdMoveRule = function(prevChord, currentChord){
        var dominantVoiceWith3 = this.voiceWithBaseComponent(prevChord, "3");
        return dominantVoiceWith3 > -1 && !currentChord.notes[dominantVoiceWith3].baseChordComponentEquals("3") &&
            !currentChord.harmonicFunction.containsDelayedBaseChordComponent("3");
    };

    this.brokenFifthMoveRule = function(prevChord, currentChord){
        var dominantVoiceWith5 = this.voiceWithBaseComponent(prevChord, "5");
        return (dominantVoiceWith5 > -1 && !currentChord.notes[dominantVoiceWith5].baseChordComponentEquals("3") &&
            !currentChord.harmonicFunction.containsDelayedBaseChordComponent("3"));
    };

    this.brokenSeventhMoveRule = function(prevChord, currentChord){
        var dominantVoiceWith7 = this.voiceWithBaseComponent(prevChord, "7");
        return dominantVoiceWith7 > -1 && !currentChord.notes[dominantVoiceWith7].baseChordComponentEquals("5") &&
            !currentChord.harmonicFunction.containsDelayedBaseChordComponent("5");
    };

    this.brokenDownFifthMoveRule = function(prevChord, currentChord){
        var dominantVoiceWithAlt5 = this.voiceWithComponent(prevChord, "5>");
        return dominantVoiceWithAlt5 > -1 &&
            !prevChord.notes[dominantVoiceWithAlt5].equalPitches(currentChord.notes[dominantVoiceWithAlt5]) &&
            !currentChord.notes[dominantVoiceWithAlt5].baseChordComponentEquals("3") &&
            !currentChord.harmonicFunction.containsDelayedBaseChordComponent("3");
    }
}

function SubdominantDominantCheckConnectionRule(details){

    ICheckConnectionRule.call(this, details);

    this.evaluateIncludingDeflections = function(connection){
        var currentChord = connection.current;
        var prevChord = connection.prev;
        if (specificConnectionRuleSD.isNotBroken(connection)
            && prevChord.harmonicFunction.degree + 1 === currentChord.harmonicFunction.degree){
            if(this.brokenVoicesMoveOppositeDirectionRule(currentChord, prevChord))
                return 40;
        }
        return 0;
    };

    this.brokenVoicesMoveOppositeDirectionRule = function(currentChord, prevChord){
        if(currentChord.bassNote.chordComponentEquals("1") && prevChord.bassNote.chordComponentEquals("1")) {
            for(var i = 1; i < 4; i++) {
                if (prevChord.notes[i].pitch - currentChord.notes[i].pitch < 0) {
                    return true;
                }
            }
        }
        return false;
    }
}
/*
        END OF SOFT RULES
 */