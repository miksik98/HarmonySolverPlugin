.import "../commons/Consts.js" as Consts
.import "../harmonic/ChordGenerator.js" as ChordGenerator
.import "../utils/Utils.js" as Utils
.import "../commons/Generator.js" as Generator
.import "../soprano/SopranoRulesChecker.js" as SopranoRulesChecker
var BASE_NOTES = Consts.BASE_NOTES

function HarmonicFunctionGeneratorInput(sopranoNote, isFirst, isLast, measurePlace){
    this.sopranoNote = sopranoNote;
    this.isFirst = isFirst;
    this.isLast = isLast;
    this.measurePlace = measurePlace;
}

function HarmonicFunctionMap(){
    this._map = {};

    this._initializeForPitch = function(pitch, baseNotes){
        for(var i=0; i<baseNotes.length; i++){
            this._map[pitch + " " + baseNotes[i]] = [];
        }
    };

    this._initializeMap = function(){
        this._initializeForPitch(60, [BASE_NOTES.B, BASE_NOTES.C,BASE_NOTES.D]);
        this._initializeForPitch(61, [BASE_NOTES.B, BASE_NOTES.C,BASE_NOTES.D]);
        this._initializeForPitch(62, [BASE_NOTES.C, BASE_NOTES.D,BASE_NOTES.E]);
        this._initializeForPitch(63, [BASE_NOTES.D, BASE_NOTES.E,BASE_NOTES.F]);
        this._initializeForPitch(64, [BASE_NOTES.D, BASE_NOTES.E,BASE_NOTES.F]);
        this._initializeForPitch(65, [BASE_NOTES.E, BASE_NOTES.F,BASE_NOTES.G]);
        this._initializeForPitch(66, [BASE_NOTES.E, BASE_NOTES.F,BASE_NOTES.G]);
        this._initializeForPitch(67, [BASE_NOTES.F, BASE_NOTES.G,BASE_NOTES.A]);
        this._initializeForPitch(68, [BASE_NOTES.G, BASE_NOTES.A]);
        this._initializeForPitch(69, [BASE_NOTES.G, BASE_NOTES.A,BASE_NOTES.B]);
        this._initializeForPitch(70, [BASE_NOTES.A, BASE_NOTES.B,BASE_NOTES.C]);
        this._initializeForPitch(71, [BASE_NOTES.A, BASE_NOTES.B,BASE_NOTES.C]);
    };

    this._initializeMap();

    this.getValues = function(pitch, baseNote){
        var p = Utils.mod(pitch, 12) + 60;
        return this._map[p + " " + baseNote];
    };

    this.pushToValues = function(pitch, baseNote, harmonicFunction){
        if(!(pitch >= 60 && pitch < 72) || !(baseNote >= 0 && baseNote < 7) ||
            Utils.contains(this._map[pitch + " " + baseNote], harmonicFunction))
            return;
        this._map[pitch + " " + baseNote].push(harmonicFunction)
    };
}

function HarmonicFunctionGenerator(allowedHarmonicFunctions, key, mode){
    Generator.Generator.call(this);

    this.key = key;
    this.mode = mode;
    this.chordGenerator = new ChordGenerator.ChordGenerator(this.key, this.mode);
    this.map = new HarmonicFunctionMap();

    for(var i=0; i<allowedHarmonicFunctions.length; i++){
        var currentFunction = allowedHarmonicFunctions[i].copy();
        var possibleNotesToHarmonize = this.chordGenerator.generatePossibleSopranoNotesFor(currentFunction);
        var filledValues = [];
        for(var j=0; j<possibleNotesToHarmonize.length; j++) {
                if(!Utils.contains(filledValues, possibleNotesToHarmonize[j].pitch+" "+possibleNotesToHarmonize[j].baseNote)) {
                    this.map.pushToValues(possibleNotesToHarmonize[j].pitch, possibleNotesToHarmonize[j].baseNote, currentFunction.withPosition(possibleNotesToHarmonize[j].chordComponent));
                    filledValues.push(possibleNotesToHarmonize[j].pitch+" "+possibleNotesToHarmonize[j].baseNote);
                }
        }
    }

    this.generate = function(harmonicFunctionGeneratorInput){
        var resultList = this.map.getValues(harmonicFunctionGeneratorInput.sopranoNote.pitch, harmonicFunctionGeneratorInput.sopranoNote.baseNote);
        if(harmonicFunctionGeneratorInput.isFirst || harmonicFunctionGeneratorInput.isLast){
            resultList = resultList.filter(
                function(harmonicFunction){
                        return harmonicFunction.functionName === Consts.FUNCTION_NAMES.TONIC &&
                            harmonicFunction.degree === 1 &&
                            !Utils.isDefined(harmonicFunction.key) &&
                            harmonicFunction.revolution === harmonicFunction.getPrime()
                    }
                )
        }

        var resList = []
        for(var i=0; i<resultList.length; i++)
            resList.push(new SopranoRulesChecker.HarmonicFunctionWithSopranoInfo(resultList[i], harmonicFunctionGeneratorInput.measurePlace, harmonicFunctionGeneratorInput.sopranoNote));

        return resList;
    }
}