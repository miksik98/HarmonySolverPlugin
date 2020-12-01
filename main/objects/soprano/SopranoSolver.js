.import "../soprano/HarmonicFunctionGenerator.js" as HarmonicFunctionGenerator
.import "../soprano/SopranoRulesChecker.js" as SopranoRulesChecker
.import "../algorithms/GraphBuilder.js" as GraphBuilder
.import "../harmonic/Exercise.js" as HarmonicFunctionsExercise
.import "../utils/Utils.js" as Utils
.import "../algorithms/Dikstra.js" as Dikstra
.import "../harmonic/Exercise.js" as Exercise
.import "../harmonic/Solver2.js" as HarmonisationSolver
.import "../commons/ExerciseSolution.js" as ExerciseSolution
.import "../commons/Errors.js" as Errors

LOG_SOLUTION_INFO = true

function SopranoSolver(exercise, punishmentRatios){

    this.exercise = exercise;
    this.harmonicFunctionGenerator = new HarmonicFunctionGenerator.HarmonicFunctionGenerator(this.exercise.possibleFunctionsList, this.exercise.key, this.exercise.mode);
    this.numberOfRetry = 10;
    this.punishmentRatios = punishmentRatios;
    this.sopranoRulesChecker = new SopranoRulesChecker.SopranoRulesChecker(this.exercise.key, this.exercise.mode, this.punishmentRatios);

    this.mapToHarmonisationExercise = function(harmonicFunctions){
        var measures = []
        var current_measure = []
        var counter = 0
        for(var i=0; i<this.exercise.notes.length; i++){
            var note = this.exercise.notes[i];
            counter += note.duration[0] / note.duration[1]
            current_measure.push(harmonicFunctions[i])
            if( counter === this.exercise.meter[0]/this.exercise.meter[1]){
                measures.push(current_measure)
                current_measure = []
                counter = 0
            }
        }
        return new Exercise.Exercise(this.exercise.key, this.exercise.meter, this.exercise.mode, measures);
    }

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
        var graphBuilder = new GraphBuilder.GraphBuilder();
        graphBuilder.withGenerator(this.harmonicFunctionGenerator);
        graphBuilder.withEvaluator(this.sopranoRulesChecker);
        graphBuilder.withInput(this.prepareSopranoGeneratorInputs(this.exercise));
        var graph = graphBuilder.build();

        var x = undefined;
        var tryNumber = 0;
        var solutionCandidate = new ExerciseSolution.ExerciseSolution(x, x, x, false);

        while(tryNumber < this.numberOfRetry && !solutionCandidate.success) {
            var dikstra = new Dikstra.Dikstra(graph);
            var sol_nodes = dikstra.getShortestPathToLastNode();
            if(LOG_SOLUTION_INFO) console.log("HARMONIC FUNCTION SEQUENCE COST = " + graph.getLast().distanceFromBegining)

            if(sol_nodes.length !== this.exercise.notes.length) throw new Errors.SolverError("Cannot find any harmonic function sequence satisfying given notes");

            var sol_functions = []
            for (var i = 0; i < sol_nodes.length; i++) {
                sol_functions.push(sol_nodes[i].content.harmonicFunction)
            }

            var harmonisationExercise = this.mapToHarmonisationExercise(sol_functions);
            var harmonisationSolver = new HarmonisationSolver.Solver(harmonisationExercise, undefined, this.exercise.notes, true, false, this.punishmentRatios);
            var solutionCandidate = harmonisationSolver.solve();

            if (!solutionCandidate.success) {
                var riseWeightsOnShortestPath = function(path, t){
                    for(var i=0; i<path.length-1; i++){
                        var currentNode = path[i];
                        for(var j=0; j<currentNode.nextNeighbours.length; j++){
                            if(path[i+1] === currentNode.nextNeighbours[j].node)
                                currentNode.nextNeighbours[j].weight = currentNode.nextNeighbours[j].weight * t;
                        }
                    }
                }

                riseWeightsOnShortestPath(sol_nodes, 2);
                tryNumber++;
            }
        }
        if(LOG_SOLUTION_INFO) console.log("CHORD HARMONIZATION COST = " + solutionCandidate.rating)

        if(!solutionCandidate.success) throw new Errors.SolverError("Cannot find any solution for each of " + this.numberOfRetry + " harmonic functions sequences");

        return solutionCandidate;
    }

}