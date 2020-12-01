.import "../model/Note.js" as Note
.import "../model/HarmonicFunction.js" as HarmonicFunction
.import "../commons/ExerciseSolution.js" as ExerciseSolution
.import "../commons/Consts.js" as Consts
.import "../commons/Errors.js" as Errors
.import "../model/Chord.js" as Chord
.import "../harmonic/ChordGenerator.js" as ChordGenerator
.import "../harmonic/ChordRulesChecker.js" as Checker
.import "../utils/Utils.js" as Utils
.import "../commons/ExerciseCorrector.js" as Corrector
.import "../harmonic/PreChecker.js" as PreChecker
.import "../algorithms/Dikstra.js" as Dikstra
.import "../algorithms/GraphBuilder.js" as GraphBuilder

var DEBUG = false;

function Solver(exercise, bassLine, sopranoLine, correctDisabled, precheckDisabled, punishmentRatios){
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
    this.punishmentRatios = punishmentRatios;

    if(Utils.isDefined(this.punishmentRatios) && !Utils.isDefined(this.sopranoLine))
        throw new Errors.UnexpectedInternalError("Punishment ratios available only for soprano harmonization!");

    this.harmonicFunctions = [];
    for(var i=0; i<exercise.measures.length; i++){
        exercise.measures[i] = getFunctionsWithDelays(exercise.measures[i]);
        this.harmonicFunctions = this.harmonicFunctions.concat(exercise.measures[i]);
    }

    if(!this.correctDisabled) {
        var corrector = new Corrector.ExerciseCorrector(this.exercise, this.harmonicFunctions, Utils.isDefined(this.bassLine), this.sopranoLine);
        this.harmonicFunctions = corrector.correctHarmonicFunctions();
    }

    this.chordGenerator = new ChordGenerator.ChordGenerator(this.exercise.key, this.exercise.mode);

    this.getGeneratorInput = function(){
        var input = [];
        if(Utils.isDefined(this.bassLine)){
            for(var i = 0; i < this.harmonicFunctions.length; i++)
                input.push(new ChordGenerator.ChordGeneratorInput(this.harmonicFunctions[i], i !== 0, undefined, this.bassLine[i]));
        }
        else if(Utils.isDefined(this.sopranoLine)){
            for(var i = 0; i < this.harmonicFunctions.length; i++)
                input.push(new ChordGenerator.ChordGeneratorInput(this.harmonicFunctions[i], i !== 0, this.sopranoLine[i], undefined));
        } else {
            for (var i = 0; i < this.harmonicFunctions.length; i++)
                input.push(new ChordGenerator.ChordGeneratorInput(this.harmonicFunctions[i], i !== 0))
        }
        return input;
    }

    this.prepareGraph = function() {
        var graphBuilder = new GraphBuilder.GraphBuilder();
        graphBuilder.withGenerator(this.chordGenerator);
        graphBuilder.withEvaluator(
            Utils.isDefined(this.punishmentRatios) ?
                new Checker.AdaptiveChordRulesChecker(this.punishmentRatios) :
                new Checker.ChordRulesChecker(Utils.isDefined(this.bassLine), Utils.isDefined(this.sopranoLine)));
        graphBuilder.withInput(this.getGeneratorInput());
        return graphBuilder.build();
    }

    this.overrideGraph = function(graph) {
        this.graph = graph;
    }

    this.solve = function(){
        if(!precheckDisabled) {
            PreChecker.preCheck(this.harmonicFunctions, this.chordGenerator, this.bassLine, this.sopranoLine)
        }
        //${counter}
        var graph = Utils.isDefined(this.graph) ? this.graph : this.prepareGraph();
        //${counter}

        var dikstra = new Dikstra.Dikstra(graph);
        var sol_nodes = dikstra.getShortestPathToLastNode();
        //${counter}

        if(sol_nodes.length !== graph.layers.length) {
            return new ExerciseSolution.ExerciseSolution(this.exercise, -1, [], false);
        }

        var sol_chords = []
        for(var i=0; i<sol_nodes.length; i++)
            sol_chords.push(sol_nodes[i].content)

        //${counter}
        return new ExerciseSolution.ExerciseSolution(this.exercise, sol_nodes[sol_nodes.length-1].distanceFromBegining, sol_chords, sol_chords.length > 0);
    }

}