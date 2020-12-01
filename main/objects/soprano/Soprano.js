.import "../model/Scale.js" as Scale
.import "../model/Chord.js" as Chord
.import "../model/Note.js" as Note
.import "../commons/Consts.js" as Consts
.import "../soprano/SopranoExercise.js" as SopranoExercise
.import "../utils/Utils.js" as Utils
.import "../harmonic/Solver.js" as Solver
.import "../harmonic/Exercise.js" as Exercise

var DEBUG = false;

function RulesChecker(){

    this.checkBasicCadention = function(prevs, curr, ex_length){

        var score = 0;
        //pierwsza tonika
        if(prevs.length === 0) {
            if(curr.functionName === "T") return 0;
            if(curr.functionName === "S") return 10;
            if(curr.functionName === "D") return 10;
        }

        if( prevs.length === ex_length - 1 ){
            if(curr.functionName === "T") score += 0;
            if(curr.functionName === "S") score += 10;
            if(curr.functionName === "D") score += 10;
        }

        var prev = prevs[prevs.length - 1];

        if(prev.functionName === "T"){
            if(curr.functionName === "T") score +=  1;
            if(curr.functionName === "S") score +=  0;
            if(curr.functionName === "D") score +=  3;
        }

        if(prev.functionName === "S"){
            if(curr.functionName === "T") score +=  3;
            if(curr.functionName === "S") score +=  1;
            if(curr.functionName === "D") score +=  0;
        }

        if(prev.functionName === "D"){
            //prev is not D7
            if(!Utils.contains(prev.extra, "7")){
                if(curr.functionName === "T") score +=  0;
                if(curr.functionName === "S") return -1;
                if(curr.functionName === "D" && !Utils.contains(curr.extra, "7")) score +=  1;
                if(curr.functionName === "D" && Utils.contains(curr.extra, "7")) score +=  0;
            }
            //prev is D7
            else{
                if(curr.functionName === "T") score +=  0;
                if(curr.functionName === "S") return -1;
                if(curr.functionName === "D" && !Utils.contains(curr.extra, "7")) return -1;
                if(curr.functionName === "D" && Utils.contains(curr.extra, "7")) score += 1;
            }

        }

        return score;
    }

    this.checkAllRules = function(prevs, curr, ex_length){
        // if(prevs.length === 0)  this.checkBasicCadention(undefined, curr, ex_length);
        return this.checkBasicCadention(prevs, curr, ex_length);
    }
}

function SopranoSolver(sopranoExercise, correctDisabled, precheckDisabled){

    this.exercise = sopranoExercise;
    this.correctDisabled = correctDisabled;
    this.precheckDisabled = precheckDisabled;
    this.rulesChecker = new RulesChecker();

    this.chordsMap = {
        0:[],
        1:[],
        2:[],
        3:[],
        4:[],
        5:[],
        6:[],
        7:[],
        8:[],
        9:[],
        10:[],
        11:[]
    }

    this.getChordsMap = function(){
        return this.chordsMap;
    }

    this.getChordBasePitch = function (harmonicFunction) {

        var chordElement = ['1', '3', '5'];

        for (var i = 0; i < harmonicFunction.extra.length; i++) {
            //Chopin chord
            if (harmonicFunction.extra[i].length > 2) {
                if (harmonicFunction.extra[i][0] === "1" && harmonicFunction.extra[i][1] === "3")
                    chordElement = "6" + harmonicFunction.extra[i].splice(2, harmonicFunction.extra[i].length);
                continue;
            }
            chordElement.push(harmonicFunction.extra[i]);
        }

        for (var i = 0; i < harmonicFunction.omit.length; i++) {
            //I'm not shure if omit conntains int or char - assume that string
            switch (harmonicFunction.omit[i]) {
                case "1":
                    chordElement.splice(chordElement.indexOf('1'), 1)
                    break;
                case "5":
                    chordElement.splice(chordElement.indexOf('5'), 1)
                    break;
            }
        }

        //TODO minor scale
        var scale;
        if (this.exercise.mode === Consts.MODE.MAJOR){
            scale = new Scale.MajorScale(this.exercise.key);
        }
        else if(this.exercise.mode === Consts.MODE.MINOR){
            scale = new Scale.MinorScale(this.exercise.key.toUpperCase());
        }
        var basicNote = scale.tonicPitch + scale.pitches[harmonicFunction.degree - 1];

        var chordType;
        var d = harmonicFunction.degree;
        if (d === 1 || d === 4 || d === 5) chordType = Consts.basicMajorChord;
        else chordType = Consts.basicMinorChord;
        var components = {
            '1': chordType[0],
            '3': chordType[1],
            '5': chordType[2],
            '6': 9,
            '7': 10,
            '9': 14,
        }

        var chordElement_cp = chordElement.slice();

        chordElement_cp = chordElement.map(function (scheme) {

            if (scheme.length > 1) {
                var intervalPitch = components[scheme.charAt(0)];
                for (var j = 1; j < scheme.length; j++) {
                    if (scheme[j] === '<') intervalPitch++;
                    if (scheme[j] === '>') intervalPitch--;
                }
                return Utils.mod((basicNote + intervalPitch), 12);
            }
            return Utils.mod((basicNote + components[scheme]), 12);
        })
        
        return chordElement_cp;
    }

    //assume that harmonic functions in harmonicFunctions are unique
    this.prepareMap = function(harmonicFunctions){
        
        for(var i=0; i<harmonicFunctions.length; i++){
            
            var basePitches = this.getChordBasePitch(harmonicFunctions[i]); 
            for(var j=0; j < basePitches.length; j++){
                this.chordsMap[basePitches[j]].push(harmonicFunctions[i]);

                if(DEBUG) console.log(basePitches[j] + " : " + harmonicFunctions[i].functionName);

            }

        }
    }

    this.solve = function(){
        this.prepareMap(this.exercise.possibleFunctionsList);
        var solution = this.findSolution(0, [], 0);
        if(solution.length === 0){

            if(DEBUG) console.log("Solution not exists");

            return -1;
        }

        solution.sort(function(a,b){ return (a[1] > b[1]) ? 1 : -1} );

        solution.forEach(function(element) {

            if(DEBUG) console.log("solution with rating " + element[1]);
            element[0].forEach(function(element1){
                if(DEBUG) console.log(element1.toString());

            });
        });

        var i=0
        for(; i<solution.length; i++){
            var ex = new Exercise.Exercise(this.exercise.key, this.exercise.meter, this.exercise.mode, [solution[i][0]]);
            var solver = new Solver.Solver(ex, undefined, this.exercise.notes, this.correctDisabled, this.precheckDisabled);
            var sol = solver.solve();
            
            //temporary condition for full solution
            if(sol.chords[sol.chords.length-1].bassNote.pitch !== undefined) break;
        }
        
        solution[i][0].forEach(function(el) {

            if(DEBUG) console.log(el.toString())
        })

        if(DEBUG) console.log("SOLUT")
        sol.chords.forEach(function(el) {
            if(DEBUG) console.log(el.harmonicFunction.functionName);
        })
        if(DEBUG) console.log(sol.chords);
        // function Exercise(key, meter, mode, measures) {
        if(DEBUG) console.log("SOLUTION LENGTH = " + sol.chords.length);

        return sol;
    }

    this.findSolution = function(curr_index, prev_chords, penalty){

        var result = [];
        var notes = this.exercise.notes;

        // if(curr_index == notes.length) return [prev_chords, penalty];

        //conversion to int
        var basePitch = (notes[curr_index].pitch - 0) % 12;
        if(DEBUG) console.log("BasePitch: "+basePitch);
        var possibleChords  = this.chordsMap[basePitch];
        if(DEBUG) console.log("possible chords: " + possibleChords);

        var goodChords = []

        for(var i=0; i<possibleChords.length; i++){
            var score = this.rulesChecker.checkAllRules(prev_chords, possibleChords[i], notes.length, false, true);
            if(score !== -1){
                goodChords.push([possibleChords[i], score])
            }
        }
        goodChords.forEach(function(element){

            if(DEBUG) console.log(element[1].toString() + "    " + element[0]);

        });

        if(goodChords.length === 0) return [];

        if(curr_index + 1 === notes.length){
            for(var i=0;i<goodChords.length;i++){
                var resArray = prev_chords.slice();
                resArray.push(goodChords[i][0]);
                result.push( [resArray, penalty + goodChords[i][1]] );
            }
            return result;
        }  

        for(var i=0; i<goodChords.length; i++){
            prev_chords.push(goodChords[i][0]);

            if(DEBUG) Utils.log(curr_index+ "  " + goodChords[i][0].toString() + "    " + goodChords[i][1]);

            var sol = this.findSolution(curr_index+1, prev_chords, penalty + goodChords[i][1]);
            // if(DEBUG) console.log("SOL: " + sol);
            result = result.concat(sol);
            // if(DEBUG) console.log("RES: " + result);
            prev_chords.pop();
        }

        return result;
    }

}