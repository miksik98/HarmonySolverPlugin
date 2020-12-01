.import "../model/Note.js" as Note
.import "../model/HarmonicFunction.js" as HarmonicFunction

function SopranoExercise(mode, key, meter, notes, durations, measures, possibleFunctionsList){
    this.mode = mode; // minor or major
    this.key = key; // for example C
    this.meter = meter; // [x,y]
    this.notes = notes; // list of notes
    this.durations = durations; // list of durations corresponding to notes
    this.measures = measures;
    this.possibleFunctionsList = possibleFunctionsList;

    this.toString = function(){
        return "Mode: " + this.mode+" Key: "+this.key+" Meter: "+this.meter+" Notes: "+this.notes+" Durations: "+this.durations;
    }
}

function sopranoExerciseReconstruct(sopranoExercise){
    return new SopranoExercise(
        sopranoExercise.mode,
        sopranoExercise.key,
        sopranoExercise.meter,
        sopranoExercise.notes.map(function (n) { return Note.noteReconstruct(n) }),
        sopranoExercise.durations,
        sopranoExercise.measures.map(function (m) { return Note.measureReconstruct(m) }),
        sopranoExercise.possibleFunctionsList.map(function (hf) { return HarmonicFunction.harmonicFunctionReconstruct(hf)})
    )
}