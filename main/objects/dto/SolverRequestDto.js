.import "../harmonic/Exercise.js" as Exercise
.import "../model/Note.js" as Note

// It is particularly important not to put methods in this class
function SolverRequestDto(exercise, bassline, sopranoLine, enableCorrector, enablePrechecker, durations){
      this.exercise = exercise;
      this.bassline = bassline;
      this.sopranoLine = sopranoLine;
      this.enableCorrector = enableCorrector;
      this.enablePrechecker = enablePrechecker;
      this.durations = durations;
}

function solverRequestReconstruct(solverRequestDto){

    return new SolverRequestDto(
        Exercise.exerciseReconstruct(solverRequestDto.exercise),
        solverRequestDto.bassLine == undefined ? undefined : solverRequestDto.bassLine.map( function (n) { return Note.noteReconstruct(n) } ),
        solverRequestDto.sopranoLine == undefined ? undefined : solverRequestDto.sopranoLine.map( function (n) { return Note.noteReconstruct(n) } ),
        solverRequestDto.enableCorrector,
        solverRequestDto.enablePrechecker,
        solverRequestDto.durations
    )

}