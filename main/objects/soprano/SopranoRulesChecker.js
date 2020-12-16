.import "../commons/Consts.js" as Consts
.import "../commons/RulesCheckerUtils.js" as RulesCheckerUtils
.import "../utils/Utils.js" as Utils
.import "../utils/IntervalUtils.js" as IntervalUtils
.import "../harmonic/Parser.js" as Parser
.import "../harmonic/ChordGenerator.js" as ChordGenerator
.import "../harmonic/ChordRulesChecker.js" as ChordRulesChecker
.import "../commons/ExerciseCorrector.js" as Corrector
.import "../harmonic/Exercise.js" as Exercise
.import "../model/Note.js" as Note

function SopranoRulesChecker(key, mode, punishmentRatios){
    this.key = key;
    this.mode = mode;
    this.punishmentRatios = punishmentRatios;
    RulesCheckerUtils.Evaluator.call(this, 2);

    this.hardRules = [
        new ForbiddenDSConnectionRule(),
        new ExistsSolutionRule(
            Utils.isDefined(this.punishmentRatios)?
            new ChordRulesChecker.AdaptiveChordRulesChecker(this.punishmentRatios):
            new ChordRulesChecker.ChordRulesChecker(false,true),
            new ChordGenerator.ChordGenerator(this.key,this.mode)),
        new SecondaryDominantConnectionRule(this.key),
        new Revolution5Rule(),
        new DownAndNotDownRule(),
        new DegreeRule(),
        new KeepBasicChordsInSecondRelationRule()
    ];
    this.softRules = [
        new HarmonicFunctionRelationRule(),
        new FourthChordsRule(),
        new ChangeFunctionConnectionRule(),
        new JumpRule(),
        new ChangeFunctionOnDownBeatRule(),
        new ChangeFunctionAtMeasureBeginningRule(),
        new PreferNeapolitanRule(),
        new SopranoShouldBeDoubled(),
        new PreferTriadRule()
        ];
}

function HarmonicFunctionWithSopranoInfo(harmonicFunction, measurePlace, sopranoNote){
    this.harmonicFunction = harmonicFunction; // HarmonicFunction
    this.measurePlace = measurePlace; // Consts.MEASURE_PLACE enum
    this.sopranoNote = sopranoNote; // Note
}

function ExistsSolutionRule(chordRulesChecker, chordGenerator){
    RulesCheckerUtils.IRule.call(this);
    this.chordRulesChecker = chordRulesChecker;
    this.chordGenerator = chordGenerator;

    this.evaluate = function(connection) {
        var prevFunction = connection.prev.harmonicFunction;
        var currentFunction = connection.current.harmonicFunction;
        var prevSopranoNote = connection.prev.sopranoNote;
        var currentSopranoNote = connection.current.sopranoNote;

        var prevPossibleChords = this.chordGenerator.generate(new ChordGenerator.ChordGeneratorInput(prevFunction, true, prevSopranoNote))
        var currentPossibleChords = this.chordGenerator.generate(new ChordGenerator.ChordGeneratorInput(currentFunction, true, currentSopranoNote));

        for(var i = 0; i < prevPossibleChords.length; i++){
            for(var j = 0; j < currentPossibleChords.length; j++){
                if(this.chordRulesChecker.evaluateHardRules(new RulesCheckerUtils.Connection(currentPossibleChords[j], prevPossibleChords[i]))){
                    return 0;
                }
            }
        }
        return -1;
    }
}

function KeepBasicChordsInSecondRelationRule(){
    RulesCheckerUtils.IRule.call(this);
    this.evaluate = function(connection){
        if(connection.prev.harmonicFunction.isInSecondRelation(connection.current.harmonicFunction) &&
            connection.current.harmonicFunction.revolution !== connection.current.harmonicFunction.getPrime()){
            return -1;
        }
        return 0;
    }
}

function DownAndNotDownRule(){
    RulesCheckerUtils.IRule.call(this);
    this.evaluate = function(connection){
        if(connection.prev.harmonicFunction.down !== connection.current.harmonicFunction.down &&
            connection.prev.harmonicFunction.degree === connection.current.harmonicFunction.degree &&
            connection.prev.harmonicFunction.key === connection.current.harmonicFunction.degree)
            return -1;
        return 0;
    }
}

function SpecialConnectionRule(punishment, prevFunctionName, currentFunctionName){
    RulesCheckerUtils.IRule.call(this);
    this.currentFunctionName = currentFunctionName;
    this.prevFunctionName = prevFunctionName;
    this.evaluate = function(connection){
        var newConnection = this.translateConnectionIncludingDeflections(connection);
        if(!Utils.isDefined(newConnection))
            return 0    //prevFunctionName === Consts.FUNCTION_NAMES.DOMINANT ? -1 : 0;
        if(newConnection.current.harmonicFunction.functionName === this.currentFunctionName &&
            newConnection.prev.harmonicFunction.functionName === this.prevFunctionName){
                return punishment;
        }
        return 0;
    }

    this.translateConnectionIncludingDeflections = function(connection){
        var currentFunction = connection.current.harmonicFunction.copy();
        var prevFunction = connection.prev.harmonicFunction.copy();
        var currentFunctionTranslated = currentFunction.copy();
        currentFunctionTranslated.key = currentFunction.key;
        var prevFunctionTranslated = prevFunction.copy();
        prevFunctionTranslated.key = prevFunction.key;
        if(prevFunction.key !== currentFunction.key){
            if(Utils.isDefined(prevFunction.key) && !prevFunction.isRelatedBackwards) {
                currentFunctionTranslated.functionName = Consts.FUNCTION_NAMES.TONIC;
                currentFunctionTranslated.degree = 1;
            } else if(currentFunction.isRelatedBackwards){
                prevFunctionTranslated.functionName = Consts.FUNCTION_NAMES.TONIC;
                prevFunctionTranslated.degree = 1;
            } else
                return undefined
        }
        currentFunction = currentFunctionTranslated;
        prevFunction = prevFunctionTranslated;

        return new RulesCheckerUtils.Connection(new HarmonicFunctionWithSopranoInfo(currentFunction), new HarmonicFunctionWithSopranoInfo(prevFunction))
    };
}

function DSConnectionRule(){
    SpecialConnectionRule.call(this, 10, Consts.FUNCTION_NAMES.DOMINANT, Consts.FUNCTION_NAMES.SUBDOMINANT);
}

function STConnectionRule(){
    SpecialConnectionRule.call(this, 10, Consts.FUNCTION_NAMES.SUBDOMINANT, Consts.FUNCTION_NAMES.TONIC);
}

function TDConnectionRule(){
    SpecialConnectionRule.call(this, 10, Consts.FUNCTION_NAMES.TONIC, Consts.FUNCTION_NAMES.DOMINANT);
}

function ChangeFunctionConnectionRule(){
    RulesCheckerUtils.IRule.call(this);
    this.evaluate = function(connection){
        var stRule = new STConnectionRule();
        var tdRule = new TDConnectionRule();
        var dsRule = new DSConnectionRule();
        return stRule.evaluate(connection) + tdRule.evaluate(connection) + dsRule.evaluate(connection);
    }
}

function ForbiddenDSConnectionRule(){
    RulesCheckerUtils.IRule.call(this);
    this.evaluate = function(connection) {
        var dsRule = new DSConnectionRule();
        if(dsRule.isBroken(connection) && connection.prev.harmonicFunction.hasMajorMode()){
            return -1;
        }
        return 0;
    }
}

function HarmonicFunctionRelationRule(){
    RulesCheckerUtils.IRule.call(this);

    this.allSubRulesBroken = true;
    this.subRules = [
        new DominantRelationRule(),
        new SecondRelationRule(),
        new SubdominantRelationRule()
    ];

    this.evaluate = function(connection){
        if(connection.current.harmonicFunction.equals(connection.prev.harmonicFunction))
            return 5;
        var evaluationResult = this.evaluateSubRules(connection);
        if(this.allSubRulesBroken){
            return 70;
        }
        return evaluationResult;
    };

    this.evaluateSubRules = function(connection){
        var evaluationResult = 0;
        for(var i = 0; i < this.subRules.length; i++) {
            var currentResult = this.subRules[i].evaluate(connection);
            if(currentResult < 10) {
                this.allSubRulesBroken = false;
                return currentResult;
            }
            evaluationResult += currentResult;
        }
        return evaluationResult;
    };
}

function SubdominantRelationRule(){
    RulesCheckerUtils.IRule.call(this);
    this.evaluate = function(connection){
        if(connection.prev.harmonicFunction.isInSubdominantRelation(connection.current.harmonicFunction)){
            if(connection.prev.harmonicFunction.key !== connection.current.harmonicFunction.key){
                return 2;
            } else
                return 0;
        }
        return 4;
    }
}

function DominantRelationRule(){
    RulesCheckerUtils.IRule.call(this);
    this.evaluate = function(connection){
        if(connection.prev.harmonicFunction.isInDominantRelation(connection.current.harmonicFunction)){
            if(connection.prev.harmonicFunction.key !== connection.current.harmonicFunction.key){
                return 2;
            } else
                return 0;
        }
        if(connection.current.harmonicFunction.degree === 1)
            return 50;
        return 15;
    }
}

function SecondRelationRule(){
    RulesCheckerUtils.IRule.call(this);
    this.evaluate = function(connection){
        if(connection.prev.harmonicFunction.isInSecondRelation(connection.current.harmonicFunction)){
            if(Utils.containsBaseChordComponent(connection.prev.harmonicFunction.extra, "7") ||
                connection.prev.harmonicFunction.degree === 5)
                return 0;
            else
                return 3;
        }
        return 7;
    }
}

function NotChangeFunctionRule(){
    RulesCheckerUtils.IRule.call(this);
    this.evaluate = function(connection){
        if(connection.current.harmonicFunction.functionName === connection.prev.harmonicFunction.functionName)
            return 0;
        return -1;
    }
}

function ChangeFunctionAtMeasureBeginningRule(){
    RulesCheckerUtils.IRule.call(this);
    this.evaluate = function(connection){
        var notChangeFunctionRule = new NotChangeFunctionRule();
        if(notChangeFunctionRule.isNotBroken(connection) && connection.current.measurePlace === Consts.MEASURE_PLACE.BEGINNING)
            return 50;
        return 0;
    }
}

function JumpRule(){
    RulesCheckerUtils.IRule.call(this);
    this.evaluate = function(connection){
        var sameFunctionRule = new NotChangeFunctionRule();
        var ruleIsNotBroken = sameFunctionRule.isNotBroken(connection);
        if(IntervalUtils.pitchOffsetBetween(connection.current.sopranoNote, connection.prev.sopranoNote) > 2){
             return ruleIsNotBroken ? 0 : 10;
        }
        return ruleIsNotBroken ? 10 : 0;
    }
}

function ChangeFunctionOnDownBeatRule(){
    RulesCheckerUtils.IRule.call(this);
    this.evaluate = function(connection){
        var sameFunctionRule = new NotChangeFunctionRule();
        if(sameFunctionRule.isBroken(connection) && connection.current.measurePlace === Consts.MEASURE_PLACE.UPBEAT){
            return 5;
        }
        return 0;
    }
}

function DTConnectionRule(){
    SpecialConnectionRule.call(this, -1, Consts.FUNCTION_NAMES.DOMINANT, Consts.FUNCTION_NAMES.TONIC);
}

function SecondaryDominantConnectionRule(key) {
    RulesCheckerUtils.IRule.call(this);
    this.evaluate = function (connection) {
        var dt = new DTConnectionRule();
        if(dt.isBroken(connection) && connection.prev.harmonicFunction.key !== connection.current.harmonicFunction.key){
            if(Parser.calculateKey(key, connection.current.harmonicFunction) !== connection.prev.harmonicFunction.key)
                return -1;
        }
        return 0;
    }
}

function FourthChordsRule(){
    RulesCheckerUtils.IRule.call(this);
    this.evaluate = function (connection) {
        if(connection.current.harmonicFunction.countChordComponents() === 3 &&
            Utils.contains([1,4,5], connection.current.harmonicFunction.degree)){
            return 8;
        }
        return 0;
    }
}

function Revolution5Rule(){
    RulesCheckerUtils.IRule.call(this);
    this.evaluate = function (connection) {
        if(connection.current.harmonicFunction.revolution === connection.current.harmonicFunction.getFifth() &&
            connection.current.measurePlace !== Consts.MEASURE_PLACE.UPBEAT){
            return -1;
        }
        return 0;
    }
}

function PreferNeapolitanRule(){
    RulesCheckerUtils.IRule.call(this);
    this.evaluate = function (connection) {
        if(connection.current.harmonicFunction.degree !== 2)
            return 0;
        if(connection.current.harmonicFunction.isNeapolitan())
            return 0;
        return 1;
    }
}

function SopranoShouldBeDoubled(){
    RulesCheckerUtils.IRule.call(this);
    this.evaluate = function (connection) {
        if(connection.current.harmonicFunction.position !== connection.current.harmonicFunction.revolution)
            return 3;
        return 0;
    }
}

function PreferTriadRule(){
    RulesCheckerUtils.IRule.call(this);
    this.evaluate = function (connection) {
        if(Utils.contains([1,4,5],connection.current.harmonicFunction.degree))
            return 0;
        return 5;
    }
}

function DegreeRule(){
    RulesCheckerUtils.IRule.call(this);
    this.evaluate = function (connection) {
        if(connection.current.harmonicFunction.degree === connection.prev.harmonicFunction.degree &&
            connection.current.harmonicFunction.functionName !== connection.prev.harmonicFunction.functionName)
            return -1;
        if(connection.current.harmonicFunction.functionName === connection.prev.harmonicFunction.functionName &&
            connection.current.harmonicFunction.degree !== connection.prev.harmonicFunction.degree)
            return -1;
        return 0;
    }
}