.import "../utils/IntervalUtils.js" as IntervalUtils
.import "../commons/Consts.js" as Consts
.import "../model/ChordComponentManager.js" as ChordComponentManager
.import "../utils/Utils.js" as Utils

var DEBUG = false;

function ExerciseCorrector(exercise, harmonicFunctions, isDefinedBassLine, sopranoLine){
    this.exercise = exercise;
    this.harmonicFunctions = harmonicFunctions;
    this.isDefinedBassLine = isDefinedBassLine;
    this.sopranoLine = sopranoLine;

    this._makeChordsIncompleteToAvoidConcurrent5 = function(startIndex, endIndex) {
        var changeCurrentChord = (endIndex - startIndex) % 2 === 0;
        if(changeCurrentChord && startIndex > 0 &&
            Utils.containsChordComponent(this.harmonicFunctions[startIndex - 1].omit, "5") && !Utils.containsBaseChordComponent(this.harmonicFunctions[startIndex - 1].extra, "5")){
            changeCurrentChord = !changeCurrentChord;
        }
        for(var i=startIndex; i<endIndex; i++){
            if(changeCurrentChord){
                if(Utils.isDefined(this.harmonicFunctions[i].position) && this.harmonicFunctions[i].position === this.harmonicFunctions[i].getFifth()){
                    this.harmonicFunctions[i].revolution = this.harmonicFunctions[i].getThird();
                    //todo maybe it is wrong strategy
                    this.harmonicFunctions[i].omit.push(this.harmonicFunctions[i].getPrime());
                } else
                    this.harmonicFunctions[i].omit.push(this.harmonicFunctions[i].getFifth());
            }
            changeCurrentChord = !changeCurrentChord;
        }
    };

    this._handleChopinTonicConnection = function (chopinHarmonicFunction, tonicHarmonicFunction) {
        if(chopinHarmonicFunction.isChopin() && chopinHarmonicFunction.isInDominantRelation(tonicHarmonicFunction)){
            if(!Utils.containsChordComponent(tonicHarmonicFunction.omit,"5")){
                tonicHarmonicFunction.omit.push(tonicHarmonicFunction.cm.chordComponentFromString("5"));
            }
        }
    };

    this._handleDominantConnectionsWith7InBass = function(dominantHarmonicFunction, tonicHarmonicFunction) {
        if(isDefinedBassLine)
            return false;
        if(dominantHarmonicFunction.isInDominantRelation(tonicHarmonicFunction) &&
            dominantHarmonicFunction.revolution.baseComponent === "7" &&
            tonicHarmonicFunction.revolution.baseComponent === "1") {
            var key = tonicHarmonicFunction.key !== undefined ?
                tonicHarmonicFunction.key : this.exercise.key;
            var cm = tonicHarmonicFunction.cm;
            tonicHarmonicFunction.revolution =
                IntervalUtils.getThirdMode(key, tonicHarmonicFunction.degree-1) === Consts.MODE.MAJOR ?
                    cm.chordComponentFromString("3") : cm.chordComponentFromString("3>");
            return Utils.isDefined(tonicHarmonicFunction.delay) && tonicHarmonicFunction.delay.length > 0
        }
        if(dominantHarmonicFunction.isInDominantRelation(tonicHarmonicFunction) &&
            tonicHarmonicFunction.revolution.baseComponent === "7" &&
            dominantHarmonicFunction.revolution.baseComponent === "1") {
            var key = dominantHarmonicFunction.key !== undefined ?
                dominantHarmonicFunction.key : this.exercise.key;
            var cm = dominantHarmonicFunction.cm;
            dominantHarmonicFunction.revolution =
                IntervalUtils.getThirdMode(key, dominantHarmonicFunction.degree-1) === Consts.MODE.MAJOR ?
                    cm.chordComponentFromString("3") : cm.chordComponentFromString("3>");
            return false;
        }

        return false;
    };

    this.correctHarmonicFunctions = function() {
        var resultHarmonicFunctions = this.harmonicFunctions;
        var startIndexOfChain = -1, insideChain = false;
        for(var i=0; i<resultHarmonicFunctions.length;i++){
            if(i < resultHarmonicFunctions.length-1){
                if(this._handleDominantConnectionsWith7InBass(resultHarmonicFunctions[i], resultHarmonicFunctions[i+1])){
                    var hf = resultHarmonicFunctions[i+2];
                    var key = hf.key !== undefined ?
                        hf.key : this.exercise.key;
                    hf.revolution = IntervalUtils.getThirdMode(key, hf.degree-1) === Consts.MODE.MAJOR ?
                        hf.cm.chordComponentFromString("3") : hf.cm.chordComponentFromString("3>");
                }
                this._handleChopinTonicConnection(resultHarmonicFunctions[i], resultHarmonicFunctions[i+1]);
                if(resultHarmonicFunctions[i].isInDominantRelation(resultHarmonicFunctions[i+1]) &&
                    resultHarmonicFunctions[i].revolution.baseComponent === "1" &&
                    resultHarmonicFunctions[i+1].revolution.baseComponent === "1" &&
                    Utils.containsBaseChordComponent(resultHarmonicFunctions[i].extra, "7") &&
                    resultHarmonicFunctions[i].omit.length === 0 && resultHarmonicFunctions[i+1].omit.length === 0){
                    if(!insideChain){
                        startIndexOfChain = i;
                        insideChain = true;
                    }
                } else {
                    if(insideChain) {
                        insideChain = false;
                        this._makeChordsIncompleteToAvoidConcurrent5(startIndexOfChain, i+1);
                    }
                }
            } else {
                if(insideChain) {
                    insideChain = false;
                    this._makeChordsIncompleteToAvoidConcurrent5(startIndexOfChain, i+1);
                }
            }
        }
        return resultHarmonicFunctions;
    };
}