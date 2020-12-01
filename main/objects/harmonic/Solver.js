.import "../model/Note.js" as Note
.import "../model/HarmonicFunction.js" as HarmonicFunction
.import "../commons/ExerciseSolution.js" as ExerciseSolution
.import "../commons/Consts.js" as Consts
.import "../model/Chord.js" as Chord
.import "../harmonic/ChordGenerator.js" as ChordGenerator
.import "../harmonic/RulesChecker.js" as Checker
.import "../utils/Utils.js" as Utils
.import "../commons/ExerciseCorrector.js" as Corrector
.import "../harmonic/PreChecker.js" as PreChecker
.import "../harmonic/ChordRulesChecker.js" as ChordRulesChecker

var DEBUG = false;

function Solver(exercise, bassLine, sopranoLine, correctDisabled, precheckDisabled){

    function getFunctionsWithDelays(functions){
        var newFunctions = functions.slice();
        var addedChords = 0;
        for(var i=0; i<functions.length; i++){
            var delays = functions[i].delay;
            if(delays.length === 0) continue;
            var newFunction = functions[i].copy();
            for(var j=0; j<delays.length; j++){
                if(parseInt(delays[j][1].baseComponent)>=8 && !Utils.containsChordComponent(newFunction.extra, delays[j][1].chordComponentString))
                        newFunction.extra.push(delays[j][1]);

                functions[i].extra.push(delays[j][0]);
                functions[i].omit.push(delays[j][1]);
                functions[i].extra = functions[i].extra.filter(function(elem){return elem.chordComponentString !== delays[j][1].chordComponentString});
                if(delays[j][1] === functions[i].position) functions[i].position = delays[j][0];
                if(delays[j][1] === functions[i].revolution) functions[i].revolution = delays[j][0];
            }
            newFunctions.splice(i+addedChords+1, 0, newFunction);
            addedChords++;
        }
        return newFunctions;
    }

    function handleDelaysInBassLine(bassLine, measures) {
        if (bassLine === undefined) {
            return undefined
        }
        var newBassLine = bassLine.slice()
        var addedNotes = 0;

        var i = 0;
        for(var a=0; a<exercise.measures.length; a++){
            for(var b=0; b<exercise.measures[a].length; b++, i++){
                var delays = exercise.measures[a][b].delay;
                if(delays.length === 0) continue;
                var newNote = new Note.Note(bassLine[i].pitch, bassLine[i].baseNote, bassLine[i].chordComponent);
                newBassLine.splice(i+addedNotes+1, 0, newNote);
                addedNotes++;
            }
        }
        return newBassLine;
    }


    this.exercise = exercise;
    this.bassLine = handleDelaysInBassLine(bassLine, exercise.measures);

    this.sopranoLine = sopranoLine;
    this.correctDisabled = correctDisabled;
    this.precheckDisabled = precheckDisabled;

    this.harmonicFunctions = [];
    for(var i=0; i<exercise.measures.length; i++){
        exercise.measures[i] = getFunctionsWithDelays(exercise.measures[i]);

        this.harmonicFunctions = this.harmonicFunctions.concat(exercise.measures[i]);
    }

    if(!this.correctDisabled) {
        var corrector = new Corrector.ExerciseCorrector(this.exercise, this.harmonicFunctions);
        this.harmonicFunctions = corrector.correctHarmonicFunctions();
    }

    this.chordGenerator = new ChordGenerator.ChordGenerator(this.exercise.key, this.exercise.mode);

    this.solve = function(){
        if(!this.precheckDisabled) {
            PreChecker.preCheck(this.harmonicFunctions, this.chordGenerator, this.bassLine, this.sopranoLine)
            var sol_chords = this.findSolution(0, undefined, undefined);
        }
        //dopełenienie pustymi chordami
        var N = sol_chords.length;
        for(var i = 0; i<this.harmonicFunctions.length - N; i++){
            var n = new Note.Note(undefined, undefined, undefined)
            sol_chords.push(new Chord.Chord(n,n,n,n, this.harmonicFunctions[N + i]));
        }

        return new ExerciseSolution.ExerciseSolution(this.exercise, -12321, sol_chords);
    }

    this.findSolution = function(curr_index, prev_prev_chord, prev_chord){
        var chords;
        if(this.bassLine !== undefined) chords = this.chordGenerator.generate(new ChordGenerator.ChordGeneratorInput(this.harmonicFunctions[curr_index],curr_index!==0,undefined,this.bassLine[curr_index]))
        else if (this.sopranoLine !== undefined) chords = this.chordGenerator.generate(new ChordGenerator.ChordGeneratorInput(this.harmonicFunctions[curr_index],curr_index!==0,this.sopranoLine[curr_index],undefined))
        else chords = this.chordGenerator.generate(new ChordGenerator.ChordGeneratorInput(this.harmonicFunctions[curr_index],curr_index!==0))
        var good_chords = []

        if(curr_index === 0){
            var illegalDoubledThirdRule = new ChordRulesChecker.IllegalDoubledThirdRule();
            chords = chords.filter(function(chord){return !illegalDoubledThirdRule.hasIllegalDoubled3Rule(chord)})
        }

        if(DEBUG){
            var log = "";
            for(var x = 0; x<curr_index; x++) log += "   "
            if(curr_index < 6) Utils.log("Log", log + curr_index)
        }

        for (var j = 0; j < chords.length; j++){
            // console.log(chords[j].toString())
            var score = Checker.checkAllRules(prev_prev_chord, prev_chord, chords[j],
                this.bassLine !== undefined, this.sopranoLine !== undefined)

            if (score !== -1 ) {

                if(DEBUG) {
                    console.log("OK!");
                    console.log(curr_index + " -> " + chords[j]);
                }

                good_chords.push([score,chords[j]]);
            }
        }

        if (good_chords.length === 0){
            return [];
        }

        good_chords.sort(function(a,b){return (a[0] > b[0]) ? 1 : -1})

        if (curr_index+1 === this.harmonicFunctions.length){
            //console.log(good_chords[0][1])
            return [good_chords[0][1]];
        }

        var longest_next_chords = []
        for (var i = 0; i< good_chords.length; i++){

            var next_chords = this.findSolution( curr_index + 1, prev_chord, good_chords[i][1])

            if (next_chords.length === this.harmonicFunctions.length - curr_index - 1 && next_chords[next_chords.length -1].sopranoNote.pitch !== undefined){
                next_chords.unshift(good_chords[i][1])
                return next_chords
            }
            //just to get partial solution in case of critical error (-1)
            else{
                if(next_chords.length + 1 > longest_next_chords.length){
                    next_chords.unshift(good_chords[i][1]);
                    longest_next_chords = next_chords;
                }
            }

        }
    
        return longest_next_chords
    }
}