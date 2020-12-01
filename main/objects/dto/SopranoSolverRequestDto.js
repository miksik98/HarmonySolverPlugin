.import "../soprano/SopranoExercise.js" as SopranoExercise

// It is particularly important not to put methods in this class
function SopranoSolverRequestDto(sopranoExercise, punishmentRatios){
    this.sopranoExercise = sopranoExercise
    this.punishmentRatios = punishmentRatios
}

function sopranoSolverRequestReconstruct(sopranoSolverRequestDto){
    return new SopranoSolverRequestDto(
        SopranoExercise.sopranoExerciseReconstruct(sopranoSolverRequestDto.sopranoExercise),
        sopranoSolverRequestDto.punishmentRatios
    )
}