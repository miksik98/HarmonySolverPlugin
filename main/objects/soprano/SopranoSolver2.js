.import "../soprano/HarmonicFunctionGenerator.js" as HarmonicFunctionGenerator
.import "../soprano/SopranoRulesChecker.js" as SopranoRulesChecker
.import "../algorithms/SopranoGraphBuilder.js" as SopranoGraphBuilder
.import "../harmonic/Exercise.js" as HarmonicFunctionsExercise
.import "../utils/Utils.js" as Utils
.import "../algorithms/Dikstra.js" as Dikstra
.import "../harmonic/Exercise.js" as Exercise
.import "../harmonic/Solver2.js" as HarmonisationSolver
.import "../commons/ExerciseSolution.js" as ExerciseSolution
.import "../commons/Errors.js" as Errors
.import "../harmonic/ChordGenerator.js" as ChordGenerator
.import "../harmonic/ChordRulesChecker.js" as RulesChecker
.import "../algorithms/Graph.js" as Graph
.import "../algorithms/GraphBuilder.js" as GraphBuilder

var LOG_SOLUTION_INFO = true;

function SopranoSolver(exercise, punishmentRatios){

    this.exercise = exercise;
    this.harmonicFunctionGenerator = new HarmonicFunctionGenerator.HarmonicFunctionGenerator(this.exercise.possibleFunctionsList, this.exercise.key, this.exercise.mode);
    this.punishmentRatios = punishmentRatios;
    this.sopranoRulesChecker = new SopranoRulesChecker.SopranoRulesChecker(this.exercise.key, this.exercise.mode, this.punishmentRatios);

    this.prepareSopranoGeneratorInputs = function(sopranoExercise){
        var inputs = [];
        for(var i=0; i<sopranoExercise.measures.length; i++){
            var duration_sum = 0;
            for(var j=0; j<sopranoExercise.measures[i].notes.length; j++){
                // console.log( "Duration sum: " + duration_sum + " \tMeasure place " + Utils.getMeasurePlace(sopranoExercise.meter, duration_sum));
                inputs.push(new HarmonicFunctionGenerator.HarmonicFunctionGeneratorInput(sopranoExercise.measures[i].notes[j], i===0 && j==0, i===sopranoExercise.measures.length-1 && j === sopranoExercise.measures[i].notes.length -1 , Utils.getMeasurePlace(sopranoExercise.meter, duration_sum)))
                duration_sum = duration_sum + sopranoExercise.measures[i].notes[j].duration[0]/sopranoExercise.measures[i].notes[j].duration[1];
            }
        }
        return inputs;
    }

    this.solve = function (){
        var graphBuilder = new SopranoGraphBuilder.SopranoGraphBuilder();
        graphBuilder.withOuterGenerator(this.harmonicFunctionGenerator);
        graphBuilder.withOuterEvaluator(this.sopranoRulesChecker);
        graphBuilder.withOuterGeneratorInput(this.prepareSopranoGeneratorInputs(this.exercise));
        graphBuilder.withInnerGenerator(new ChordGenerator.ChordGenerator(this.exercise.key, this.exercise.mode));
        var innerEvaluator = Utils.isDefined(this.punishmentRatios) ?
            new RulesChecker.AdaptiveChordRulesChecker(this.punishmentRatios) :
            new RulesChecker.ChordRulesChecker(false, true);
        graphBuilder.withInnerEvaluator(innerEvaluator);

        try {
            var sopranoGraph = graphBuilder.build();
        } catch(error) {
            throw new Errors.SolverError(error.message);
        }

        var dikstra = new Dikstra.Dikstra(sopranoGraph);
        dikstra.findShortestPaths();
        if (LOG_SOLUTION_INFO) console.log("HARMONIC FUNCTION SEQUENCE COST = " + sopranoGraph.getLast().distanceFromBegining)
        var chordGraph = sopranoGraph.reduceToChordGraph();

        var graphBuilder = new GraphBuilder.GraphBuilder();
        graphBuilder.withEvaluator(innerEvaluator);
        graphBuilder.withGraphTemplate(chordGraph);
        var innerGraph = graphBuilder.build();


        var dikstra2 = new Dikstra.Dikstra(innerGraph);
        var sol_nodes = dikstra2.getShortestPathToLastNode();

        if(sol_nodes.length !== innerGraph.layers.length) {
            throw new Errors.UnexpectedInternalError("Shortest path to last node does not exist");
        }

        var sol_chords = []
        for(var i=0; i<sol_nodes.length; i++)
            sol_chords.push(sol_nodes[i].content)

        if(LOG_SOLUTION_INFO) console.log("CHORD HARMONIZATION COST = " + sol_nodes[sol_nodes.length-1].distanceFromBegining)

        return new ExerciseSolution.ExerciseSolution(this.exercise, sol_nodes[sol_nodes.length-1].distanceFromBegining, sol_chords, true);
    }

}