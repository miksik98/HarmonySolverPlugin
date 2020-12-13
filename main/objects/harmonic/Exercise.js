.import "../model/HarmonicFunction.js" as HarmonicFunction
.import "../harmonic/ChordRulesChecker.js" as RulesChecker

function Exercise(key, meter, mode, measures) {
    this.mode = mode
    this.key = key
    this.meter = meter
    this.measures = measures

    this.toString = function () {
        return "Mode: " + this.mode + " " +
          "Key: " + this.key + " " +
          "Meter: " + this.meter + " " +
           "Measures: " + this.measures
    }

    this.getHarmonicFunctionList = function() {
        var harmonicFunctions = []
        for(var i=0; i<this.measures.length; i++){
            for(var j =0; j<this.measures[i].length; j++){
                harmonicFunctions.push(this.measures[i][j]);
            }
        }
        return harmonicFunctions;
    }
}

function exerciseReconstruct(ex){
    var measures = []
    for(var i=0; i<ex.measures.length;i++){
        var measure = [];
        for(var j=0; j<ex.measures[i].length; j++){
            measure.push( HarmonicFunction.harmonicFunctionReconstruct(ex.measures[i][j]) )
        }
        measures.push(measure)
    }

    return new Exercise(ex.key, ex.meter, ex.mode, measures);
}

function SolvedExercise(chords){
    this.chords = chords;
    this.rulesChecker = new RulesChecker.BasicHardRulesChecker();
    this.checkCorrectness = function () {
        var brokenRulesReport = "";
        for(var i = 0; i < this.chords.length-1; i++) {
            var brokenRules = this.rulesChecker.findBrokenHardRules(this.chords[i], this.chords[i+1]);
            if(brokenRules.length > 0){
                brokenRulesReport += "\nChord " + (i+1) + " -> Chord " + (i+2);
                for(var j = 0; j < brokenRules.length; j++){
                    brokenRulesReport += "\n\t- "+brokenRules[j];
                }
            }
        }
        if(brokenRulesReport === ""){
            return "Correct!\t\t"
        }
        return "Found some broken rules!\t\t\n"+brokenRulesReport;
    }
}
