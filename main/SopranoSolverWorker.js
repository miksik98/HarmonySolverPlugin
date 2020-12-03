//path is relative to building script context

var d = 0
var D = 17 - 4

WorkerScript.onMessage = function(sopranoSolverRequestDto) {
    try {
        var dto = sopranoSolverRequestReconstruct(sopranoSolverRequestDto)
        var solver = new SopranoSolver(dto.sopranoExercise, dto.punishmentRatios)
        var solution = solver.solve()
        sleep(100)
        WorkerScript.sendMessage({ 'type' : "solution", 'solution': solution, 'durations': dto.sopranoExercise.durations})
    } catch (e) {
        WorkerScript.sendMessage({ 'type' : "error", 'error': e})
    }
}

function sleep(millis){
    var start = new Date();
    while(new Date() - start < millis){}
}

function contains(list, obj) {
    for (var i = 0; i < list.length; i++) {
        if (list[i] === obj) {
            return true
        }
    }
    return false
}

function removeFrom(list, obj) {
     list.splice(list.indexOf(obj), 1)
}

function containsChordComponent(list, cc) {
    for (var i = 0; i < list.length; i++) {
        if (list[i].chordComponentString === cc) {
            return true
        }
    }
    return false
}

function containsBaseChordComponent(list, cc) {
    for (var i = 0; i < list.length; i++) {
        if (list[i].baseComponent === cc) {
            return true
        }
    }
    return false
}

function isDefined(x) {
    return x !== undefined;
}

function abs(a) {
    return a >= 0 ? a : -a;
}

function min(a,b) {
    return a > b ? b : a;
}


function mod(a, b){
    while(a < 0){
        a += b
    }
    return a % b
}


function log(message, longMessage){
    var lineAndSource = ((new Error).stack.split("\n")[1].split("/")).reverse()[0]
    console.log("[" + lineAndSource + "]" + " " + message + (longMessage === undefined ? "" : "\n" + longMessage + "\n"))
}

function error(message, longMessage){
    var lineAndSource = ((new Error).stack.split("\n")[1].split("/")).reverse()[0]
    console.error("[" + lineAndSource + "]" + " " + message + (longMessage === undefined ? "" : "\n" + longMessage + "\n"))
}

function warn(message, longMessage){
    var lineAndSource = ((new Error).stack.split("\n")[1].split("/")).reverse()[0]
    console.warn("[" + lineAndSource + "]" + " " + message + (longMessage === undefined ? "" : "\n" + longMessage + "\n"))
}

function info(message, longMessage){
    var lineAndSource = ((new Error).stack.split("\n")[1].split("/")).reverse()[0]
    console.info("[" + lineAndSource + "]" + " " + message + (longMessage === undefined ? "" : "\n" + longMessage + "\n"))
}

Array.prototype.equals = function (array) {
    // if the other array is a falsy value, return
    if (!array)
        return false;

    // compare lengths - can save a lot of time
    if (this.length !== array.length)
        return false;

    for (var i = 0, l=this.length; i < l; i++) {
        // Check if we have nested arrays
        if (this[i] instanceof Array && array[i] instanceof Array) {
            // recurse into the nested arrays
            if (!this[i].equals(array[i]))
                return false;
        }
        else if (this[i] !== array[i]) {
            // Warning - two different object instances will never be equal: {x:20} != {x:20}
            return false;
        }
    }
    return true;
}

function convertToTpc(note){
    var baseNote = note.baseNote;
    var baseTpc;
    var basePitch;
    switch(baseNote){
        case 0:
            baseTpc = 14;
            basePitch = 60;
            break;
        case 1:
            baseTpc = 16;
            basePitch = 62;
            break;
        case 2:
            baseTpc = 18;
            basePitch = 64;
            break;
        case 3:
            baseTpc = 13;
            basePitch = 65;
            break;
        case 4:
            baseTpc = 15;
            basePitch = 67;
            break;
        case 5:
            baseTpc = 17;
            basePitch = 69;
            break;
        case 6:
            baseTpc = 19;
            basePitch = 71;
            break;
    }
    var inOctavePitch = note.pitch % 12 === 0? 12: note.pitch % 12;
    var actualBasePitch = inOctavePitch + 60;
    var offset = abs(actualBasePitch - basePitch);
    var revertOffset = false;
    if(offset > 2) {
        offset = 12 - offset;
        revertOffset = true;
    }
    if(actualBasePitch > basePitch && !revertOffset) baseTpc += offset * 7;
    else baseTpc -= offset * 7;
    return baseTpc;
}

function getModeFromKey(key){
    var mode;
    if (contains(possible_keys_major, key)) {
        mode = MODE.MAJOR
    } else {
        mode = MODE.MINOR
    }
    return mode;
}

// meter = [nominator,denominator], measureCount is sum of notes from beginning of measure
function getMeasurePlace(meter, measureCount){
    measureCount *= meter[1];
    //if not integer - return UPBEAT
    if(parseInt(measureCount) !== measureCount)
        return MEASURE_PLACE.UPBEAT;
    if(measureCount === 0)
        return MEASURE_PLACE.BEGINNING;
    var numerator = meter[0];

    if(isPowerOf2(numerator)){
        for(var i = 2; i < numerator; i = i + 2){
            if(measureCount === i){
                return MEASURE_PLACE.DOWNBEAT;
            }
        }
        return MEASURE_PLACE.UPBEAT;
    }

    var threesNumber, twosNumber;
    switch(numerator % 3){
        case 0:
            threesNumber = numerator / 3;
            twosNumber = 0;
            break;
        case 1:
            threesNumber = (numerator - 4) / 3;
            twosNumber = 2;
            break;
        case 2:
            threesNumber = (numerator - 2) / 3;
            twosNumber = 1;
            break;
    }
    var counter = 0;
    for(var i = 0; i < threesNumber; i++){
        counter += 3;
        if(measureCount === counter)
            return MEASURE_PLACE.DOWNBEAT;
    }
    if(twosNumber === 2 && measureCount === counter + 2)
        return MEASURE_PLACE.DOWNBEAT;
    return MEASURE_PLACE.UPBEAT;
}

function isPowerOf2(n){
    while(n > 1){
        if(n % 2 !== 0)
            return false;
        n /= 2;
    }
    return true;
}

// Hide method from for-in loops
Object.defineProperty(Array.prototype, "equals", {enumerable: false});

function convertPitchToOneOctave(pitch){
    return mod(pitch,12) + 60;
}

function isIntegerNumber(x){
    var xString = x+"";
    var match = xString.match(/^(0|([1-9]\d*))$/gi);
    if(match === null)
        return false;
    return x !== xString && match.length === 1 && match[0] === xString
}

function getAlterationSymbolForNote(note, mode, key){
    var scalePitches = mode === MODE.MAJOR ? new MajorScale(key).pitches : new MinorScale(key).pitches
    var noteNumber = mod(note.baseNote - keyStrBase[key],7)

    if (mod(scalePitches[noteNumber] + keyStrPitch[key] + 1, 12) === mod(note.pitch, 12)) {
        return ALTERATIONS.SHARP
    } else  if (mod(scalePitches[noteNumber] + keyStrPitch[key] - 1, 12) === mod(note.pitch, 12)) {
        return ALTERATIONS.FLAT
    } else {
        return undefined
    }

}

function getValuesOf(object){
    var propertyList = [];
    for(var key in object)
        propertyList.push(object[key]);
    return propertyList;
}

var LOG_SOLUTION_INFO = true;

function SopranoSolver(exercise, punishmentRatios){

    this.exercise = exercise;
    this.harmonicFunctionGenerator = new HarmonicFunctionGenerator(this.exercise.possibleFunctionsList, this.exercise.key, this.exercise.mode);
    this.punishmentRatios = punishmentRatios;
    this.sopranoRulesChecker = new SopranoRulesChecker(this.exercise.key, this.exercise.mode, this.punishmentRatios);

    this.prepareSopranoGeneratorInputs = function(sopranoExercise){
        var inputs = [];
        for(var i=0; i<sopranoExercise.measures.length; i++){
            var duration_sum = 0;
            for(var j=0; j<sopranoExercise.measures[i].notes.length; j++){
                // console.log( "Duration sum: " + duration_sum + " \tMeasure place " + getMeasurePlace(sopranoExercise.meter, duration_sum));
                inputs.push(new HarmonicFunctionGeneratorInput(sopranoExercise.measures[i].notes[j], i===0 && j==0, i===sopranoExercise.measures.length-1 && j === sopranoExercise.measures[i].notes.length -1 , getMeasurePlace(sopranoExercise.meter, duration_sum)))
                duration_sum = duration_sum + sopranoExercise.measures[i].notes[j].duration[0]/sopranoExercise.measures[i].notes[j].duration[1];
            }
        }
        return inputs;
    }

    this.solve = function (){
        var graphBuilder = new SopranoGraphBuilder();
        graphBuilder.withOuterGenerator(this.harmonicFunctionGenerator);
        graphBuilder.withOuterEvaluator(this.sopranoRulesChecker);
        graphBuilder.withOuterGeneratorInput(this.prepareSopranoGeneratorInputs(this.exercise));
        graphBuilder.withInnerGenerator(new ChordGenerator(this.exercise.key, this.exercise.mode));
        var innerEvaluator = isDefined(this.punishmentRatios) ?
            new AdaptiveChordRulesChecker(this.punishmentRatios) :
            new ChordRulesChecker(false, true);
        graphBuilder.withInnerEvaluator(innerEvaluator);

        try {
            var sopranoGraph = graphBuilder.build();
        } catch(error) {
            throw new SolverError(error.message);
        }

        var dikstra = new Dikstra(sopranoGraph);
        dikstra.findShortestPaths();                                d++; WorkerScript.sendMessage({ 'type' : "progress_notification", 'progress': d/D });
        if (LOG_SOLUTION_INFO) console.log("HARMONIC FUNCTION SEQUENCE COST = " + sopranoGraph.getLast().distanceFromBegining)
        var chordGraph = sopranoGraph.reduceToChordGraph();         d++; WorkerScript.sendMessage({ 'type' : "progress_notification", 'progress': d/D });

        var graphBuilder = new GraphBuilder();
        graphBuilder.withEvaluator(innerEvaluator);
        graphBuilder.withGraphTemplate(chordGraph);
        var innerGraph = graphBuilder.build();                      d++; WorkerScript.sendMessage({ 'type' : "progress_notification", 'progress': d/D });


        var dikstra2 = new Dikstra(innerGraph);
        var sol_nodes = dikstra2.getShortestPathToLastNode();       d++; WorkerScript.sendMessage({ 'type' : "progress_notification", 'progress': d/D });

        if(sol_nodes.length !== innerGraph.layers.length) {
            throw new UnexpectedInternalError("Shortest path to last node does not exist");
        }

        var sol_chords = []
        for(var i=0; i<sol_nodes.length; i++)
            sol_chords.push(sol_nodes[i].content)

        if(LOG_SOLUTION_INFO) console.log("CHORD HARMONIZATION COST = " + sol_nodes[sol_nodes.length-1].distanceFromBegining)
                                                                    d++; WorkerScript.sendMessage({ 'type' : "progress_notification", 'progress': d/D });
        return new ExerciseSolution(this.exercise, sol_nodes[sol_nodes.length-1].distanceFromBegining, sol_chords, true);
    }

}

// It is particularly important not to put methods in this class
function SopranoSolverRequestDto(sopranoExercise, punishmentRatios){
    this.sopranoExercise = sopranoExercise
    this.punishmentRatios = punishmentRatios
}

function sopranoSolverRequestReconstruct(sopranoSolverRequestDto){
    return new SopranoSolverRequestDto(
        sopranoExerciseReconstruct(sopranoSolverRequestDto.sopranoExercise),
        sopranoSolverRequestDto.punishmentRatios
    )
}
//G
var keyStrPitch = {
    'C': 60,
    'B#': 60,
    'Dbb': 60,
    'C#': 61,
    'Db': 61,
    'B##': 61,
    'D': 62,
    'C##': 62,
    'Ebb': 62,
    'Eb': 63,
    'D#': 63,
    'Fbb': 63,
    'E': 64,
    'D##': 64,
    'Fb': 64,
    'F': 65,
    'E#': 65,
    'Gbb': 65,
    'F#': 66,
    'Gb': 66,
    'E##': 66,
    'G': 67,
    'F##': 67,
    'Abb': 67,
    'Ab': 68,
    'G#': 68,
    'A': 69,
    'G##': 69,
    'Bbb': 69,
    'Bb': 70,
    'A#': 70,
    'Cbb': 70,
    'B': 71,
    'Cb': 71,
    'A##': 71,

    'c': 60,
    'b#': 60,
    'dbb': 60,
    'c#': 61,
    'db': 61,
    'b##': 61,
    'd': 62,
    'c##': 62,
    'ebb': 62,
    'd#': 63,
    'eb': 63,
    'fbb': 63,
    'e': 64,
    'd##': 64,
    'fb': 64,
    'f': 65,
    'e#': 65,
    'gbb': 65,
    'f#': 66,
    'gb': 66,
    'e##': 66,
    'g': 67,
    'f##': 67,
    'abb': 67,
    'g#': 68,
    'ab': 68,
    'a': 69,
    'g##': 69,
    'bbb': 69,
    'a#': 70,
    'bb': 70,
    'cbb': 70,
    'b': 71,
    'cb': 71,
    'a##': 71
}

function minorKeyBySignature(signature) {
    switch (signature) {
        case 0:
            return "a";
        case 1:
            return "e";
        case 2:
            return "b";
        case 3:
            return "f#";
        case 4:
            return "c#";
        case 5:
            return "g#";
        case 6:
            return "d#";
        case 7:
            return "a#";
        case -1:
            return "d";
        case -2:
            return "g";
        case -3:
            return "c";
        case -4:
            return "f";
        case -5:
            return "bb";
        case -6:
            return "eb";
        case -7:
            return "ab";
    }
}

function majorKeyBySignature(signature) {
    switch (signature) {
        case 0:
            return "C";
        case 1:
            return "G";
        case 2:
            return "D";
        case 3:
            return "A";
        case 4:
            return "E";
        case 5:
            return "B";
        case 6:
            return "F#";
        case 7:
            return "C#";
        case -1:
            return "F";
        case -2:
            return "Bb";
        case -3:
            return "Eb";
        case -4:
            return "Ab";
        case -5:
            return "Db";
        case -6:
            return "Gb";
        case -7:
            return "Cb";
    }
}

//G
var BASE_NOTES = {
    C: 0,
    D: 1,
    E: 2,
    F: 3,
    G: 4,
    A: 5,
    B: 6
}

//G
var keyStrBase = {
    'Cbb': BASE_NOTES.C,
    'Cb': BASE_NOTES.C,
    'C': BASE_NOTES.C,
    'C#': BASE_NOTES.C,
    'C##': BASE_NOTES.C,
    'Dbb': BASE_NOTES.D,
    'Db': BASE_NOTES.D,
    'D': BASE_NOTES.D,
    'D#': BASE_NOTES.D,
    'D##': BASE_NOTES.D,
    'Ebb': BASE_NOTES.E,
    'Eb': BASE_NOTES.E,
    'E': BASE_NOTES.E,
    'E#': BASE_NOTES.E,
    'E##': BASE_NOTES.E,
    'Fbb': BASE_NOTES.F,
    'Fb': BASE_NOTES.F,
    'F': BASE_NOTES.F,
    'F#': BASE_NOTES.F,
    'F##': BASE_NOTES.F,
    'Gbb': BASE_NOTES.G,
    'Gb': BASE_NOTES.G,
    'G': BASE_NOTES.G,
    'G#': BASE_NOTES.G,
    'G##': BASE_NOTES.G,
    'Abb': BASE_NOTES.A,
    'Ab': BASE_NOTES.A,
    'A': BASE_NOTES.A,
    'A#': BASE_NOTES.A,
    'A##': BASE_NOTES.A,
    'Bbb': BASE_NOTES.B,
    'Bb': BASE_NOTES.B,
    'B': BASE_NOTES.B,
    'B#': BASE_NOTES.B,
    'B##': BASE_NOTES.B,

    'cbb': BASE_NOTES.C,
    'cb': BASE_NOTES.C,
    'c': BASE_NOTES.C,
    'c#': BASE_NOTES.C,
    'c##': BASE_NOTES.C,
    'dbb': BASE_NOTES.D,
    'db': BASE_NOTES.D,
    'd': BASE_NOTES.D,
    'd#': BASE_NOTES.D,
    'd##': BASE_NOTES.D,
    'ebb': BASE_NOTES.E,
    'eb': BASE_NOTES.E,
    'e': BASE_NOTES.E,
    'e#': BASE_NOTES.E,
    'e##': BASE_NOTES.E,
    'fbb': BASE_NOTES.F,
    'fb': BASE_NOTES.F,
    'f': BASE_NOTES.F,
    'f#': BASE_NOTES.F,
    'f##': BASE_NOTES.F,
    'gbb': BASE_NOTES.G,
    'gb': BASE_NOTES.G,
    'g': BASE_NOTES.G,
    'g#': BASE_NOTES.G,
    'g##': BASE_NOTES.G,
    'abb': BASE_NOTES.A,
    'ab': BASE_NOTES.A,
    'a': BASE_NOTES.A,
    'a#': BASE_NOTES.A,
    'a##': BASE_NOTES.A,
    'bbb': BASE_NOTES.B,
    'bb': BASE_NOTES.B,
    'b': BASE_NOTES.B,
    'b#': BASE_NOTES.B,
    'b##': BASE_NOTES.B
}

function VoicesBoundary() {
    this.sopranoMax = 81;
    this.sopranoMin = 60;
    this.altoMax = 74;
    this.altoMin = 53;
    this.tenorMax = 69;
    this.tenorMin = 48;
    this.bassMax = 62;
    this.bassMin = 39;
}

//G
var VOICES = {
    SOPRANO: 0,
    ALTO: 1,
    TENOR: 2,
    BASS: 3
}
//G
var FUNCTION_NAMES = {
    TONIC: "T",
    SUBDOMINANT: "S",
    DOMINANT: "D"
}

//G
var possible_keys_major = ['C', 'C#', 'Db',
    'D', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'Ab', 'A',
    'Bb', 'B', 'Cb']

//G
var possible_keys_minor = ['c', 'c#',
    'd', 'd#', 'eb', 'e', 'f', 'f#', 'g', 'g#', 'ab', 'a',
    'a#', 'bb', 'b']

//G
var possible_systems = ['close', 'open']
//G
var basicMajorChord = [0, 4, 7];
//G
var basicMinorChord = [0, 3, 7];

//G
var ALTERATIONS = {
    SHARP: "#",
    FLAT: "b",
    NATURAL: "h"
};

//G
var MODE = {
    MAJOR: "major",
    MINOR: "minor"
}

//G
var DEFLECTION_TYPE = {
    CLASSIC: 0,
    BACKWARDS: 1,
    ELIPSE: 2
}

//G
var MEASURE_PLACE = {
    UPBEAT: 0,
    DOWNBEAT: 1,
    BEGINNING: 2
}

//G
var keyFromPitchBasenoteAndMode = {
    "60,0,major": 'C',
    "60,6,major": 'B#',
    "60,1,major": 'Dbb',
    "61,0,major": 'C#',
    "61,1,major": 'Db',
    "61,6,major": 'B##',
    "62,1,major": 'D',
    "62,0,major": 'C##',
    "62,2,major": 'Ebb',
    "63,2,major": 'Eb',
    "63,1,major": 'D#',
    "63,3,major": 'Fbb',
    "64,2,major": 'E',
    "64,1,major": 'D##',
    "64,3,major": 'Fb',
    "65,3,major": 'F',
    "65,2,major": 'E#',
    "65,4,major": 'Gbb',
    "66,3,major": 'F#',
    "66,4,major": 'Gb',
    "66,2,major": 'E##',
    "67,4,major": 'G',
    "67,3,major": 'F##',
    "67,5,major": 'Abb',
    "68,4,major": 'G#',
    "68,5,major": 'Ab',
    "69,5,major": 'A',
    "69,4,major": 'G##',
    "69,6,major": 'Bbb',
    "70,6,major": 'Bb',
    "70,5,major": 'A#',
    "70,0,major": 'Cbb',
    "71,6,major": 'B',
    "71,0,major": 'Cb',
    "71,5,major": 'A##',
    "60,0,minor": 'c',
    "60,6,minor": 'b#',
    "60,1,minor": 'dbb',
    "61,0,minor": 'c#',
    "61,1,minor": 'db',
    "61,6,minor": 'b##',
    "62,1,minor": 'd',
    "62,0,minor": 'c##',
    "62,2,minor": 'ebb',
    "63,2,minor": 'eb',
    "63,1,minor": 'd#',
    "63,3,minor": 'fbb',
    "64,2,minor": 'e',
    "64,1,minor": 'd##',
    "64,3,minor": 'fb',
    "65,3,minor": 'f',
    "65,2,minor": 'e#',
    "65,4,minor": 'gbb',
    "66,3,minor": 'f#',
    "66,4,minor": 'gb',
    "66,2,minor": 'e##',
    "67,4,minor": 'g',
    "67,3,minor": 'f##',
    "67,5,minor": 'abb',
    "68,4,minor": 'g#',
    "68,5,minor": 'ab',
    "69,5,minor": 'a',
    "69,4,minor": 'g##',
    "69,6,minor": 'bbb',
    "70,6,minor": 'bb',
    "70,5,minor": 'a#',
    "70,0,minor": 'cbb',
    "71,6,minor": 'b',
    "71,0,minor": 'cb',
    "71,5,minor": 'a##',
}
//G
var PREFERENCES_NAMES = {
    PRECHECK: "precheck",
    CORRECT: "correct",
    PRINT_SYMBOLS: "printSymbols",
    PRINT_COMPONENTS: "printComponents"
}

//G
var CHORD_RULES = {
    ConcurrentOctaves: "ConcurrentOctaves",
    ConcurrentFifths: "ConcurrentFifths",
    CrossingVoices: "CrossingVoices",
    OneDirection: "OneDirection",
    ForbiddenJump: "ForbiddenJump",
    HiddenOctaves: "Hidden consecutive octaves",
    FalseRelation: "FalseRelation",
    SameFunctionCheckConnection: "SameFunctionCheckConnection",
    IllegalDoubledThird: "IllegalDoubledThird",
}


function Scale(baseNote) {
    this.baseNote = baseNote
}

function MajorScale(baseNote, tonicPitch) {
    Scale.call(this.baseNote)
    this.tonicPitch = tonicPitch
    this.pitches = [0, 2, 4, 5, 7, 9, 11]
}

function MajorScale(key){
    Scale.call(this, keyStrBase[key])
    this.tonicPitch = keyStrPitch[key]
    this.pitches = [0, 2, 4, 5, 7, 9, 11]
}

function MinorScale(baseNote, tonicPitch) {
    Scale.call(this.baseNote)
    this.tonicPitch = tonicPitch
    this.pitches = [0, 2, 3, 5, 7, 8, 10]
}

function MinorScale(key){
    Scale.call(this, keyStrBase[key])
    this.tonicPitch = keyStrPitch[key]
    this.pitches = [0, 2, 3, 5, 7, 8, 10]
}
var BASE_NOTES = BASE_NOTES

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
        var p = mod(pitch, 12) + 60;
        return this._map[p + " " + baseNote];
    };

    this.pushToValues = function(pitch, baseNote, harmonicFunction){
        if(!(pitch >= 60 && pitch < 72) || !(baseNote >= 0 && baseNote < 7) ||
            contains(this._map[pitch + " " + baseNote], harmonicFunction))
            return;
        this._map[pitch + " " + baseNote].push(harmonicFunction)
    };
}

function HarmonicFunctionGenerator(allowedHarmonicFunctions, key, mode){
    Generator.call(this);

    this.key = key;
    this.mode = mode;
    this.chordGenerator = new ChordGenerator(this.key, this.mode);
    this.map = new HarmonicFunctionMap();

    for(var i=0; i<allowedHarmonicFunctions.length; i++){
        var currentFunction = allowedHarmonicFunctions[i].copy();
        var possibleNotesToHarmonize = this.chordGenerator.generatePossibleSopranoNotesFor(currentFunction);
        var filledValues = [];
        for(var j=0; j<possibleNotesToHarmonize.length; j++) {
                if(!contains(filledValues, possibleNotesToHarmonize[j].pitch+" "+possibleNotesToHarmonize[j].baseNote)) {
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
                        return harmonicFunction.functionName === FUNCTION_NAMES.TONIC &&
                            harmonicFunction.degree === 1 &&
                            !isDefined(harmonicFunction.key) &&
                            harmonicFunction.revolution === harmonicFunction.getPrime()
                    }
                )
        }

        var resList = []
        for(var i=0; i<resultList.length; i++)
            resList.push(new HarmonicFunctionWithSopranoInfo(resultList[i], harmonicFunctionGeneratorInput.measurePlace, harmonicFunctionGeneratorInput.sopranoNote));

        return resList;
    }
}

function SopranoRulesChecker(key, mode, punishmentRatios){
    this.key = key;
    this.mode = mode;
    this.punishmentRatios = punishmentRatios;
    Evaluator.call(this, 2);

    this.hardRules = [
        new ForbiddenDSConnectionRule(),
        new ExistsSolutionRule(
            isDefined(this.punishmentRatios)?
            new AdaptiveChordRulesChecker(this.punishmentRatios):
            new ChordRulesChecker(false,true),
            new ChordGenerator(this.key,this.mode)),
        new SecondaryDominantConnectionRule(this.key),
        new Revolution5Rule(),
        new DownAndNotDownRule(),
        new DegreeRule()
    ];
    this.softRules = [
        new HarmonicFunctionRelationRule(),
        new FourthChordsRule(),
        new ChangeFunctionConnectionRule(),
        new JumpRule(),
        new ChangeFunctionOnDownBeatRule(),
        new ChangeFunctionAtMeasureBeginningRule(),
        new PreferNeapolitanRule(),
        new SopranoShouldBeDoubled(),
        new PreferTriadRule()
        ];
}

function HarmonicFunctionWithSopranoInfo(harmonicFunction, measurePlace, sopranoNote){
    this.harmonicFunction = harmonicFunction; // HarmonicFunction
    this.measurePlace = measurePlace; // MEASURE_PLACE enum
    this.sopranoNote = sopranoNote; // Note
}

function ExistsSolutionRule(chordRulesChecker, chordGenerator){
    IRule.call(this);
    this.chordRulesChecker = chordRulesChecker;
    this.chordGenerator = chordGenerator;

    this.evaluate = function(connection) {
        var prevFunction = connection.prev.harmonicFunction;
        var currentFunction = connection.current.harmonicFunction;
        var prevSopranoNote = connection.prev.sopranoNote;
        var currentSopranoNote = connection.current.sopranoNote;

        var prevPossibleChords = this.chordGenerator.generate(new ChordGeneratorInput(prevFunction, true, prevSopranoNote))
        var currentPossibleChords = this.chordGenerator.generate(new ChordGeneratorInput(currentFunction, true, currentSopranoNote));

        for(var i = 0; i < prevPossibleChords.length; i++){
            for(var j = 0; j < currentPossibleChords.length; j++){
                if(this.chordRulesChecker.evaluateHardRules(new Connection(currentPossibleChords[j], prevPossibleChords[i]))){
                    return 0;
                }
            }
        }
        return -1;
    }
}

function DownAndNotDownRule(){
    IRule.call(this);
    this.evaluate = function(connection){
        if(connection.prev.harmonicFunction.down !== connection.current.harmonicFunction.down &&
            connection.prev.harmonicFunction.degree === connection.current.harmonicFunction.degree &&
            connection.prev.harmonicFunction.key === connection.current.harmonicFunction.degree)
            return -1;
        return 0;
    }
}

function SpecialConnectionRule(punishment, prevFunctionName, currentFunctionName){
    IRule.call(this);
    this.currentFunctionName = currentFunctionName;
    this.prevFunctionName = prevFunctionName;
    this.evaluate = function(connection){
        var newConnection = this.translateConnectionIncludingDeflections(connection);
        if(!isDefined(newConnection))
            return 0    //prevFunctionName === FUNCTION_NAMES.DOMINANT ? -1 : 0;
        if(newConnection.current.harmonicFunction.functionName === this.currentFunctionName &&
            newConnection.prev.harmonicFunction.functionName === this.prevFunctionName){
                return punishment;
        }
        return 0;
    }

    this.translateConnectionIncludingDeflections = function(connection){
        var currentFunction = connection.current.harmonicFunction.copy();
        var prevFunction = connection.prev.harmonicFunction.copy();
        var currentFunctionTranslated = currentFunction.copy();
        currentFunctionTranslated.key = currentFunction.key;
        var prevFunctionTranslated = prevFunction.copy();
        prevFunctionTranslated.key = prevFunction.key;
        if(prevFunction.key !== currentFunction.key){
            if(isDefined(prevFunction.key) && !prevFunction.isRelatedBackwards) {
                currentFunctionTranslated.functionName = FUNCTION_NAMES.TONIC;
                currentFunctionTranslated.degree = 1;
            } else if(currentFunction.isRelatedBackwards){
                prevFunctionTranslated.functionName = FUNCTION_NAMES.TONIC;
                prevFunctionTranslated.degree = 1;
            } else
                return undefined
        }
        currentFunction = currentFunctionTranslated;
        prevFunction = prevFunctionTranslated;

        return new Connection(new HarmonicFunctionWithSopranoInfo(currentFunction), new HarmonicFunctionWithSopranoInfo(prevFunction))
    };
}

function DSConnectionRule(){
    SpecialConnectionRule.call(this, 10, FUNCTION_NAMES.DOMINANT, FUNCTION_NAMES.SUBDOMINANT);
}

function STConnectionRule(){
    SpecialConnectionRule.call(this, 10, FUNCTION_NAMES.SUBDOMINANT, FUNCTION_NAMES.TONIC);
}

function TDConnectionRule(){
    SpecialConnectionRule.call(this, 10, FUNCTION_NAMES.TONIC, FUNCTION_NAMES.DOMINANT);
}

function ChangeFunctionConnectionRule(){
    IRule.call(this);
    this.evaluate = function(connection){
        var stRule = new STConnectionRule();
        var tdRule = new TDConnectionRule();
        var dsRule = new DSConnectionRule();
        return stRule.evaluate(connection) + tdRule.evaluate(connection) + dsRule.evaluate(connection);
    }
}

function ForbiddenDSConnectionRule(){
    IRule.call(this);
    this.evaluate = function(connection) {
        var dsRule = new DSConnectionRule();
        if(dsRule.isBroken(connection) && connection.prev.harmonicFunction.hasMajorMode()){
            return -1;
        }
        return 0;
    }
}

function HarmonicFunctionRelationRule(){
    IRule.call(this);

    this.allSubRulesBroken = true;
    this.subRules = [
        new DominantRelationRule(),
        new SecondRelationRule(),
        new SubdominantRelationRule()
    ];

    this.evaluate = function(connection){
        if(connection.current.harmonicFunction.equals(connection.prev.harmonicFunction))
            return 5;
        var evaluationResult = this.evaluateSubRules(connection);
        if(this.allSubRulesBroken){
            return 70;
        }
        return evaluationResult;
    };

    this.evaluateSubRules = function(connection){
        var evaluationResult = 0;
        for(var i = 0; i < this.subRules.length; i++) {
            var currentResult = this.subRules[i].evaluate(connection);
            if(currentResult < 10) {
                this.allSubRulesBroken = false;
                return currentResult;
            }
            evaluationResult += currentResult;
        }
        return evaluationResult;
    };
}

function SubdominantRelationRule(){
    IRule.call(this);
    this.evaluate = function(connection){
        if(connection.prev.harmonicFunction.isInSubdominantRelation(connection.current.harmonicFunction)){
            if(connection.prev.harmonicFunction.key !== connection.current.harmonicFunction.key){
                return 2;
            } else
                return 0;
        }
        return 4;
    }
}

function DominantRelationRule(){
    IRule.call(this);
    this.evaluate = function(connection){
        if(connection.prev.harmonicFunction.isInDominantRelation(connection.current.harmonicFunction)){
            if(connection.prev.harmonicFunction.key !== connection.current.harmonicFunction.key){
                return 2;
            } else
                return 0;
        }
        if(connection.current.harmonicFunction.degree === 1)
            return 50;
        return 15;
    }
}

function SecondRelationRule(){
    IRule.call(this);
    this.evaluate = function(connection){
        if(connection.prev.harmonicFunction.isInSecondRelation(connection.current.harmonicFunction)){
            if(containsBaseChordComponent(connection.prev.harmonicFunction.extra, "7") ||
                connection.prev.harmonicFunction.degree === 5)
                return 0;
            else
                return 3;
        }
        return 7;
    }
}

function NotChangeFunctionRule(){
    IRule.call(this);
    this.evaluate = function(connection){
        if(connection.current.harmonicFunction.functionName === connection.prev.harmonicFunction.functionName)
            return 0;
        return -1;
    }
}

function ChangeFunctionAtMeasureBeginningRule(){
    IRule.call(this);
    this.evaluate = function(connection){
        var notChangeFunctionRule = new NotChangeFunctionRule();
        if(notChangeFunctionRule.isNotBroken(connection) && connection.current.measurePlace === MEASURE_PLACE.BEGINNING)
            return 50;
        return 0;
    }
}

function JumpRule(){
    IRule.call(this);
    this.evaluate = function(connection){
        var sameFunctionRule = new NotChangeFunctionRule();
        var ruleIsNotBroken = sameFunctionRule.isNotBroken(connection);
        if(pitchOffsetBetween(connection.current.sopranoNote, connection.prev.sopranoNote) > 2){
             return ruleIsNotBroken ? 0 : 10;
        }
        return ruleIsNotBroken ? 10 : 0;
    }
}

function ChangeFunctionOnDownBeatRule(){
    IRule.call(this);
    this.evaluate = function(connection){
        var sameFunctionRule = new NotChangeFunctionRule();
        if(sameFunctionRule.isBroken(connection) && connection.current.measurePlace === MEASURE_PLACE.UPBEAT){
            return 5;
        }
        return 0;
    }
}

function DTConnectionRule(){
    SpecialConnectionRule.call(this, -1, FUNCTION_NAMES.DOMINANT, FUNCTION_NAMES.TONIC);
}

function SecondaryDominantConnectionRule(key) {
    IRule.call(this);
    this.evaluate = function (connection) {
        var dt = new DTConnectionRule();
        if(dt.isBroken(connection) && connection.prev.harmonicFunction.key !== connection.current.harmonicFunction.key){
            if(calculateKey(key, connection.current.harmonicFunction) !== connection.prev.harmonicFunction.key)
                return -1;
        }
        return 0;
    }
}

function FourthChordsRule(){
    IRule.call(this);
    this.evaluate = function (connection) {
        if(connection.current.harmonicFunction.countChordComponents() === 3 &&
            contains([1,4,5], connection.current.harmonicFunction.degree)){
            return 8;
        }
        return 0;
    }
}

function Revolution5Rule(){
    IRule.call(this);
    this.evaluate = function (connection) {
        if(connection.current.harmonicFunction.revolution === connection.current.harmonicFunction.getFifth() &&
            connection.current.measurePlace !== MEASURE_PLACE.UPBEAT){
            return -1;
        }
        return 0;
    }
}

function PreferNeapolitanRule(){
    IRule.call(this);
    this.evaluate = function (connection) {
        if(connection.current.harmonicFunction.degree !== 2)
            return 0;
        if(connection.current.harmonicFunction.isNeapolitan())
            return 0;
        return 1;
    }
}

function SopranoShouldBeDoubled(){
    IRule.call(this);
    this.evaluate = function (connection) {
        if(connection.current.harmonicFunction.position !== connection.current.harmonicFunction.revolution)
            return 3;
        return 0;
    }
}

function PreferTriadRule(){
    IRule.call(this);
    this.evaluate = function (connection) {
        if(contains([1,4,5],connection.current.harmonicFunction.degree))
            return 0;
        return 5;
    }
}

function DegreeRule(){
    IRule.call(this);
    this.evaluate = function (connection) {
        if(connection.current.harmonicFunction.degree === connection.prev.harmonicFunction.degree &&
            connection.current.harmonicFunction.functionName !== connection.prev.harmonicFunction.functionName)
            return -1;
        if(connection.current.harmonicFunction.functionName === connection.prev.harmonicFunction.functionName &&
            connection.current.harmonicFunction.degree !== connection.prev.harmonicFunction.degree)
            return -1;
        return 0;
    }
}


function SopranoGraphBuilder() {
    this.outerEvaluator = undefined;
    this.outerGenerator = undefined;
    this.outerGeneratorInput = undefined;
    this.innerEvaluator = undefined;
    this.innerGenerator = undefined;

    this.withOuterEvaluator = function (outerEvaluator) {
        this.outerEvaluator = outerEvaluator;
    }

    this.withOuterGenerator = function (outerGenerator) {
        this.outerGenerator = outerGenerator;
    }

    this.withOuterGeneratorInput = function (outerGeneratorInput) {
        this.outerGeneratorInput = outerGeneratorInput;
    }

    this.withInnerEvaluator = function (innerEvaluator) {
        this.innerEvaluator = innerEvaluator;
    }

    this.withInnerGenerator = function (innerGenerator) {
        this.innerGenerator = innerGenerator;
    }

    this.getGraphTemplate = function () {
        var graphBuilder = new GraphBuilder();
        graphBuilder.withEvaluator(this.outerEvaluator);
        graphBuilder.withGenerator(this.outerGenerator);
        graphBuilder.withInput(this.outerGeneratorInput)
        return graphBuilder.buildWithoutWeights();
    }

    var generateNestedLayers = function(graph, innerGenerator, outerGeneratorInput) {
        for(var i=0; i<graph.layers.length; i++){
            var sopranoNote = outerGeneratorInput[i].sopranoNote;
            for(var j=0; j<graph.layers[i].nodeList.length; j++){
                var currentNode = graph.layers[i].nodeList[j];
                var nestedLayer = new Layer(
                    new ChordGeneratorInput(currentNode.content.harmonicFunction, i!==0, sopranoNote),
                    innerGenerator
                );
                currentNode.nestedLayer = nestedLayer;
            }
        }
    }

    var connectNestedLayers = function(graph, innerEvaluator) {
        for(var i=0; i<graph.layers.length -1; i++) {
            for (var j=0; j<graph.layers[i].nodeList.length; j++) {
                var currentNode = graph.layers[i].nodeList[j];
                for(var k=0; k<currentNode.nextNeighbours.length; k++){
                    var nextNeighbour = currentNode.nextNeighbours[k].node;
                    currentNode.nestedLayer.connectWith(nextNeighbour.nestedLayer, innerEvaluator, i===0, false);
                }
            }
        }
    }

    var removeUselessNodesInNestedLayers = function(graph) {
        //without last layer cause the first node is not present yet
        for(var i=graph.layers.length-2; i>=0; i--) {
            for (var j = 0; j < graph.layers[i].nodeList.length; j++) {
                var currentNode = graph.layers[i].nodeList[j];
                currentNode.nestedLayer.removeUselessNodes()
            }
        }
    }

    var removeUnreachableNodesInNestedLayers = function(graph) {
        //without last layer cause the first node is not present yet
        for(var i=1; i<graph.layers.length; i++) {
            for (var j = 0; j < graph.layers[i].nodeList.length; j++) {
                var currentNode = graph.layers[i].nodeList[j];
                currentNode.nestedLayer.removeUnreachableNodes()
            }
        }
    }

    var removeNodesWithEmptyNestedLayers = function(graph) {
        for(var i=graph.layers.length-1; i>=0; i--) {
            for (var j = 0; j < graph.layers[i].nodeList.length; j++) {
                var currentNode = graph.layers[i].nodeList[j];
                if(currentNode.nestedLayer.isEmpty()){
                    graph.layers[i].removeNode(currentNode);
                    j--;
                }
            }
        }
    }

    var removeUnreachableNodes = function (graph) {
        for (var i = 0; i < graph.layers.length; i++) {
            graph.layers[i].removeUnreachableNodes()
        }
    }

    var removeUselessNodes = function (graph) {
        for (var i = graph.layers.length - 1; i >= 0; i--) {
            graph.layers[i].removeUselessNodes();
        }
    }

    var propagateEdgeWeightIntoNestedLayer = function (currentNode, w, hf_right){
        for(var l=0; l<currentNode.nestedLayer.nodeList.length; l++){
            var nested_node = currentNode.nestedLayer.nodeList[l];
            for(var m=0; m<nested_node.nextNeighbours.length; m++){
                var nested_neighbour = nested_node.nextNeighbours[m];
                if(nested_neighbour.node.content.harmonicFunction === hf_right){
                    nested_neighbour.setWeight(w);
                }
            }
        }
    }

    var setEdgeWeightsAndPropagate = function(graph, evaluator){
        for(var i=0; i<graph.layers.length - 1; i++){
            for(var j=0; j<graph.layers[i].nodeList.length; j++){
                var currentNode = graph.layers[i].nodeList[j];

                for(var k=0; k<currentNode.nextNeighbours.length; k++){
                    var neighbour = currentNode.nextNeighbours[k];
                    var connection = new Connection(neighbour.node.content, currentNode.content)

                    var w = evaluator.evaluateSoftRules(connection);
                    neighbour.setWeight(w);

                    propagateEdgeWeightIntoNestedLayer(currentNode, w, neighbour.node.content.harmonicFunction)
                }
            }
        }
    }

    var attachNestedFirstAndLast = function(graph){
        graph.nestedFirst = new Node("first");
        graph.nestedLast = new Node("last");
        ///first
        for(var i=0; i<graph.layers[0].nodeList.length; i++){
            var currentNode = graph.layers[0].nodeList[i];
            for(var j=0; j<currentNode.nestedLayer.nodeList.length; j++){
                var currentNestedNode = currentNode.nestedLayer.nodeList[j];
                if(currentNestedNode.haveNext())
                    graph.nestedFirst.addNextNeighbour(new NeighbourNode(currentNestedNode, 0));
            }
        }

        //last
        for(var i=0; i<graph.layers[graph.layers.length -1].nodeList.length; i++) {
            var currentNode = graph.layers[graph.layers.length -1].nodeList[i];
            for (var j=0; j<currentNode.nestedLayer.nodeList.length; j++) {
                var currentNestedNode = currentNode.nestedLayer.nodeList[j];
                if(currentNestedNode.havePrev())
                    currentNestedNode.addNextNeighbour(new NeighbourNode(graph.nestedLast, 0));
            }
        }

    }


    this.build = function () {
        var graphTemplate = this.getGraphTemplate();
        generateNestedLayers(graphTemplate, this.innerGenerator, this.outerGeneratorInput); d++; WorkerScript.sendMessage({ 'type' : "progress_notification", 'progress': d/D });
        connectNestedLayers(graphTemplate, this.innerEvaluator);                            d++; WorkerScript.sendMessage({ 'type' : "progress_notification", 'progress': d/D });
        removeUselessNodesInNestedLayers(graphTemplate);
        removeUnreachableNodesInNestedLayers(graphTemplate);
        setEdgeWeightsAndPropagate(graphTemplate, this.outerEvaluator);                     d++; WorkerScript.sendMessage({ 'type' : "progress_notification", 'progress': d/D });

        removeNodesWithEmptyNestedLayers(graphTemplate)


        var sopranoGraph = new SopranoGraph(
            graphTemplate.layers,
            graphTemplate.first,
            graphTemplate.last
        )

        if(sopranoGraph.getNodes().length === 2)
            throw new InvalidGraphConstruction("Cannot find any harmonic function sequence which could be harmonised");

        attachNestedFirstAndLast(sopranoGraph);                                             d++; WorkerScript.sendMessage({ 'type' : "progress_notification", 'progress': d/D });

        return sopranoGraph;
    }

}

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
            measure.push( harmonicFunctionReconstruct(ex.measures[i][j]) )
        }
        measures.push(measure)
    }

    return new Exercise(ex.key, ex.meter, ex.mode, measures);
}


function contains(list, obj) {
    for (var i = 0; i < list.length; i++) {
        if (list[i] === obj) {
            return true
        }
    }
    return false
}

function removeFrom(list, obj) {
     list.splice(list.indexOf(obj), 1)
}

function containsChordComponent(list, cc) {
    for (var i = 0; i < list.length; i++) {
        if (list[i].chordComponentString === cc) {
            return true
        }
    }
    return false
}

function containsBaseChordComponent(list, cc) {
    for (var i = 0; i < list.length; i++) {
        if (list[i].baseComponent === cc) {
            return true
        }
    }
    return false
}

function isDefined(x) {
    return x !== undefined;
}

function abs(a) {
    return a >= 0 ? a : -a;
}

function min(a,b) {
    return a > b ? b : a;
}


function mod(a, b){
    while(a < 0){
        a += b
    }
    return a % b
}


function log(message, longMessage){
    var lineAndSource = ((new Error).stack.split("\n")[1].split("/")).reverse()[0]
    console.log("[" + lineAndSource + "]" + " " + message + (longMessage === undefined ? "" : "\n" + longMessage + "\n"))
}

function error(message, longMessage){
    var lineAndSource = ((new Error).stack.split("\n")[1].split("/")).reverse()[0]
    console.error("[" + lineAndSource + "]" + " " + message + (longMessage === undefined ? "" : "\n" + longMessage + "\n"))
}

function warn(message, longMessage){
    var lineAndSource = ((new Error).stack.split("\n")[1].split("/")).reverse()[0]
    console.warn("[" + lineAndSource + "]" + " " + message + (longMessage === undefined ? "" : "\n" + longMessage + "\n"))
}

function info(message, longMessage){
    var lineAndSource = ((new Error).stack.split("\n")[1].split("/")).reverse()[0]
    console.info("[" + lineAndSource + "]" + " " + message + (longMessage === undefined ? "" : "\n" + longMessage + "\n"))
}

Array.prototype.equals = function (array) {
    // if the other array is a falsy value, return
    if (!array)
        return false;

    // compare lengths - can save a lot of time
    if (this.length !== array.length)
        return false;

    for (var i = 0, l=this.length; i < l; i++) {
        // Check if we have nested arrays
        if (this[i] instanceof Array && array[i] instanceof Array) {
            // recurse into the nested arrays
            if (!this[i].equals(array[i]))
                return false;
        }
        else if (this[i] !== array[i]) {
            // Warning - two different object instances will never be equal: {x:20} != {x:20}
            return false;
        }
    }
    return true;
}

function convertToTpc(note){
    var baseNote = note.baseNote;
    var baseTpc;
    var basePitch;
    switch(baseNote){
        case 0:
            baseTpc = 14;
            basePitch = 60;
            break;
        case 1:
            baseTpc = 16;
            basePitch = 62;
            break;
        case 2:
            baseTpc = 18;
            basePitch = 64;
            break;
        case 3:
            baseTpc = 13;
            basePitch = 65;
            break;
        case 4:
            baseTpc = 15;
            basePitch = 67;
            break;
        case 5:
            baseTpc = 17;
            basePitch = 69;
            break;
        case 6:
            baseTpc = 19;
            basePitch = 71;
            break;
    }
    var inOctavePitch = note.pitch % 12 === 0? 12: note.pitch % 12;
    var actualBasePitch = inOctavePitch + 60;
    var offset = abs(actualBasePitch - basePitch);
    var revertOffset = false;
    if(offset > 2) {
        offset = 12 - offset;
        revertOffset = true;
    }
    if(actualBasePitch > basePitch && !revertOffset) baseTpc += offset * 7;
    else baseTpc -= offset * 7;
    return baseTpc;
}

function getModeFromKey(key){
    var mode;
    if (contains(possible_keys_major, key)) {
        mode = MODE.MAJOR
    } else {
        mode = MODE.MINOR
    }
    return mode;
}

// meter = [nominator,denominator], measureCount is sum of notes from beginning of measure
function getMeasurePlace(meter, measureCount){
    measureCount *= meter[1];
    //if not integer - return UPBEAT
    if(parseInt(measureCount) !== measureCount)
        return MEASURE_PLACE.UPBEAT;
    if(measureCount === 0)
        return MEASURE_PLACE.BEGINNING;
    var numerator = meter[0];

    if(isPowerOf2(numerator)){
        for(var i = 2; i < numerator; i = i + 2){
            if(measureCount === i){
                return MEASURE_PLACE.DOWNBEAT;
            }
        }
        return MEASURE_PLACE.UPBEAT;
    }

    var threesNumber, twosNumber;
    switch(numerator % 3){
        case 0:
            threesNumber = numerator / 3;
            twosNumber = 0;
            break;
        case 1:
            threesNumber = (numerator - 4) / 3;
            twosNumber = 2;
            break;
        case 2:
            threesNumber = (numerator - 2) / 3;
            twosNumber = 1;
            break;
    }
    var counter = 0;
    for(var i = 0; i < threesNumber; i++){
        counter += 3;
        if(measureCount === counter)
            return MEASURE_PLACE.DOWNBEAT;
    }
    if(twosNumber === 2 && measureCount === counter + 2)
        return MEASURE_PLACE.DOWNBEAT;
    return MEASURE_PLACE.UPBEAT;
}

function isPowerOf2(n){
    while(n > 1){
        if(n % 2 !== 0)
            return false;
        n /= 2;
    }
    return true;
}

// Hide method from for-in loops
Object.defineProperty(Array.prototype, "equals", {enumerable: false});

function convertPitchToOneOctave(pitch){
    return mod(pitch,12) + 60;
}

function isIntegerNumber(x){
    var xString = x+"";
    var match = xString.match(/^(0|([1-9]\d*))$/gi);
    if(match === null)
        return false;
    return x !== xString && match.length === 1 && match[0] === xString
}

function getAlterationSymbolForNote(note, mode, key){
    var scalePitches = mode === MODE.MAJOR ? new MajorScale(key).pitches : new MinorScale(key).pitches
    var noteNumber = mod(note.baseNote - keyStrBase[key],7)

    if (mod(scalePitches[noteNumber] + keyStrPitch[key] + 1, 12) === mod(note.pitch, 12)) {
        return ALTERATIONS.SHARP
    } else  if (mod(scalePitches[noteNumber] + keyStrPitch[key] - 1, 12) === mod(note.pitch, 12)) {
        return ALTERATIONS.FLAT
    } else {
        return undefined
    }

}

function getValuesOf(object){
    var propertyList = [];
    for(var key in object)
        propertyList.push(object[key]);
    return propertyList;
}

function Dikstra(graph){

    this.graph = graph;
    this.queue = new PriorityQueue("distanceFromBegining");

    this.init = function() {
        var allNodes = this.graph.getNodes();
        for(var i=0; i<allNodes.length; i++){
            allNodes[i].distanceFromBegining = "infinity";
            allNodes[i].prevsInShortestPath = undefined;
            this.queue.insert(allNodes[i]);
        }
        this.graph.getFirst().distanceFromBegining = 0;
    }

    //Cormen p.662
    this.relax = function(u, v, w){
        if(u.distanceFromBegining === "infinity"){
            throw new UnexpectedInternalError("u cannot have inifinity distance from begining")
        }

        if(u.distanceFromBegining + w < v.distanceFromBegining || v.distanceFromBegining === "infinity") {
            this.queue.decreaseKey(v, u.distanceFromBegining + w);
            v.prevsInShortestPath = [u];
        } else if (u.distanceFromBegining + w === v.distanceFromBegining){
            v.prevsInShortestPath.push(u);
        }
    }

    this.findShortestPaths = function() {
        this.init();
        var u, v, w;
        while(this.queue.isNotEmpty()){
            u = this.queue.extractMin();
            for(var i=u.nextNeighbours.length; i--;){
                v = u.nextNeighbours[i].node;
                w = u.nextNeighbours[i].weight;
                this.relax(u,v,w);
            }
        }
    }

    this.getShortestPathToLastNode = function() {
        this.findShortestPaths();
        var currentNode = this.graph.getLast();
        var result = []
        while(currentNode.prevsInShortestPath !== undefined){
            result.unshift(currentNode);
            currentNode = currentNode.prevsInShortestPath[0];
        }
        result.splice(result.length-1, 1);
        return result;
    }

}

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
                if(parseInt(delays[j][1].baseComponent)>=8 && !containsChordComponent(newFunction.extra, delays[j][1].chordComponentString))
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
                var newNote = new Note(bassLine[i].pitch, bassLine[i].baseNote, bassLine[i].chordComponent);
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

    if(isDefined(this.punishmentRatios) && !isDefined(this.sopranoLine))
        throw new UnexpectedInternalError("Punishment ratios available only for soprano harmonization!");

    this.harmonicFunctions = [];
    for(var i=0; i<exercise.measures.length; i++){
        exercise.measures[i] = getFunctionsWithDelays(exercise.measures[i]);
        this.harmonicFunctions = this.harmonicFunctions.concat(exercise.measures[i]);
    }

    if(!this.correctDisabled) {
        var corrector = new ExerciseCorrector(this.exercise, this.harmonicFunctions, isDefined(this.bassLine), this.sopranoLine);
        this.harmonicFunctions = corrector.correctHarmonicFunctions();
    }

    this.chordGenerator = new ChordGenerator(this.exercise.key, this.exercise.mode);

    this.getGeneratorInput = function(){
        var input = [];
        if(isDefined(this.bassLine)){
            for(var i = 0; i < this.harmonicFunctions.length; i++)
                input.push(new ChordGeneratorInput(this.harmonicFunctions[i], i !== 0, undefined, this.bassLine[i]));
        }
        else if(isDefined(this.sopranoLine)){
            for(var i = 0; i < this.harmonicFunctions.length; i++)
                input.push(new ChordGeneratorInput(this.harmonicFunctions[i], i !== 0, this.sopranoLine[i], undefined));
        } else {
            for (var i = 0; i < this.harmonicFunctions.length; i++)
                input.push(new ChordGeneratorInput(this.harmonicFunctions[i], i !== 0))
        }
        return input;
    }

    this.prepareGraph = function() {
        var graphBuilder = new GraphBuilder();
        graphBuilder.withGenerator(this.chordGenerator);
        graphBuilder.withEvaluator(
            isDefined(this.punishmentRatios) ?
                new AdaptiveChordRulesChecker(this.punishmentRatios) :
                new ChordRulesChecker(isDefined(this.bassLine), isDefined(this.sopranoLine)));
        graphBuilder.withInput(this.getGeneratorInput());
        return graphBuilder.build();
    }

    this.overrideGraph = function(graph) {
        this.graph = graph;
    }

    this.solve = function(){
        if(!precheckDisabled) {
            preCheck(this.harmonicFunctions, this.chordGenerator, this.bassLine, this.sopranoLine)
        }
        d++; WorkerScript.sendMessage({ 'type' : "progress_notification", 'progress': d/D });
        var graph = isDefined(this.graph) ? this.graph : this.prepareGraph();
        d++; WorkerScript.sendMessage({ 'type' : "progress_notification", 'progress': d/D });

        var dikstra = new Dikstra(graph);
        var sol_nodes = dikstra.getShortestPathToLastNode();
        d++; WorkerScript.sendMessage({ 'type' : "progress_notification", 'progress': d/D });

        if(sol_nodes.length !== graph.layers.length) {
            return new ExerciseSolution(this.exercise, -1, [], false);
        }

        var sol_chords = []
        for(var i=0; i<sol_nodes.length; i++)
            sol_chords.push(sol_nodes[i].content)

        d++; WorkerScript.sendMessage({ 'type' : "progress_notification", 'progress': d/D });
        return new ExerciseSolution(this.exercise, sol_nodes[sol_nodes.length-1].distanceFromBegining, sol_chords, sol_chords.length > 0);
    }

}

var DEBUG = false

function ExerciseSolution(exercise, rating, chords, success) {
    this.exercise = exercise;
    this.rating = rating;
    this.chords = chords;

    this.success = success === undefined ? true : success //todo for later use
    this.infoMessages = []
    this.errorMessages = []

    if(!this.success && isDefined(exercise)){
        throw new SolverError("Cannot find solution for given harmonic functions",
            "If you want know more details please turn on prechecker in Settings and solve again")
    }

    this.setDurations = function () {
        function default_divide(number, result) {
            //default_divide(3, [1/2]) // [3]
            var newElement;
            if(result.length === number) return result
            var all_equal = true
            for (var i = 0; i < result.length - 1; i++) {
                if (result[i] > result[i + 1]) {
                    if (result[i] <= 1) {
                        result[i] /= 2
                        result.splice(i, 0, result[i])
                    } else {
                        newElement = Math.ceil(result[i] / 2)
                        result[i] = Math.floor(result[i] / 2)
                        result.splice(i, 0, newElement)
                    }
                    all_equal = false
                    break
                }
            }
            if (all_equal) {
                if (result[result.length - 1] <= 1) {
                    result[result.length - 1] /= 2
                    result.push(result[result.length - 1])
                } else {
                    newElement = Math.floor(result[result.length - 1] / 2)
                    result[result.length - 1] = Math.ceil(result[result.length - 1] / 2)
                    result.push(newElement)
                }
            }
            return default_divide(number, result)
        }

        function find_division_point(list) {
            var front = 0
            var back = list.length - 1
            var front_sum = list[front][0]
            var back_sum = list[back][0]
            var last = -1
            while (front < back) {
                if (front_sum > back_sum) {
                    back--
                    back_sum += list[back][0]
                    last = 0
                } else {
                    front++
                    front_sum += list[front][0]
                    last = 1
                }
            }
            if (front === 0)
                return 1
            return front
        }

        function divide_fun_changed(measure) {
            var funList = []
            var changes_counter = 0
            if (measure.length === 1) return [[1, 0]]
            for (var i = 0; i < measure.length; i++) {
                var one_fun_counter = 0
                while (i < measure.length - 1 && measure[i].equals(measure[i + 1])) {
                    one_fun_counter++
                    i++
                }
                funList.push([one_fun_counter + 1, changes_counter])
                changes_counter++
            }
            return funList
        }

        function sum_of(list){
            var acc = 0;
            for (var i = 0; i < list.length; i++){
                acc += list[i][0];
            }
            return acc;
        }

        var measures = this.exercise.measures
        var offset = 0
        for (var measure_id = 0; measure_id < measures.length; measure_id++) {
            var current_measure = measures[measure_id]
            var funList = divide_fun_changed(current_measure)

            function add_time_to_fun(list, value) {
                if (list.length === 1) {
                    funList[list[0][1]].push(value)
                    return
                }
                var index = find_division_point(list)

                var list1 = list.slice(0, index)
                var list2 = list.slice(index, list.length)
                if (value > 1) {
                    var ceil = Math.ceil(value / 2)
                    var floor = Math.floor(value / 2)
                    if (sum_of(list1) >= sum_of(list2)) {
                        add_time_to_fun(list1, ceil)
                        add_time_to_fun(list2, floor)
                    } else {
                        add_time_to_fun(list1, floor)
                        add_time_to_fun(list2, ceil)
                    }
                } else {
                    add_time_to_fun(list1, value / 2)
                    add_time_to_fun(list2, value / 2)
                }
            }

            add_time_to_fun(funList, this.exercise.meter[0])
            var counter_measure = 0
            var counter_fun = 0
            while (counter_measure < current_measure.length) {
                for (var i = 0; i < funList.length; i++) {
                    var len_list = default_divide(funList[i][0], [funList[i][2]])
                    for (var j = 0; j < len_list.length; j++) {
                        if (len_list[j] >= 1) {
                            this.chords[counter_measure + offset].duration = [len_list[j], this.exercise.meter[1]]
                        } else {
                            this.chords[counter_measure + offset].duration = [1, this.exercise.meter[1] * (1 / len_list[j])]
                        }
                        if(DEBUG) log("Duration added:", this.chords[counter_measure + offset].toString())
                        counter_measure++
                    }
                }
                counter_fun++
            }
            offset += current_measure.length
        }
    }

    this.addInfoMessage = function (message) {
        this.infoMessages.push(message)
    }

    this.addErrorMessage = function (message) {
        this.errorMessages.push(message)
    }

}

function exerciseSolutionReconstruct(sol){
    return new ExerciseSolution(
        exerciseReconstruct(sol.exercise),
        sol.rating,
        sol.chords.map(function (chord) { return chordReconstruct(chord) }),
        sol.success
    )
}

function BasicError(message, details) {
    this.message = message
    this.details = details
}


function FiguredBassInputError(message, details) {
    BasicError.call(this, message, details)
    this.source = "Error in figured bass input"
}

function SopranoInputError(message, details) {
    BasicError.call(this, message, details)
    this.source = "Error in soprano harmonization input"
}

function HarmonicFunctionsParserError(message, details) {
    BasicError.call(this, message,details)
    this.source = "Error during parsing harmonic functions input"
}

function RulesCheckerError(message, details) {
    BasicError.call(this, message, details)
    this.source = "Error during checking connections between chords"
}

function SopranoHarmonizationInputError(message, details) {
    BasicError.call(this, message, details)
    this.source = "Error in soprano harmonization input"
}

function UnexpectedInternalError(message, details) {
    BasicError.call(this, message, details)
    this.source = "Error in Harmonysolver plugin. Please contact with developers."
}

function PreCheckerError(message, details) {
    BasicError.call(this, message, details)
    this.source = "Error during checking exercise correctness"
}

function InvalidGraphConstruction(message, details) {
    BasicError.call(this, message, details)
    this.source = "Some conditions on graph specific structure don't match"
}

function SolverError(message, details){
    BasicError.call(this, message, details)
    this.source = "Error during harmonization"
}

function ChordGeneratorInput(harmonicFunction, allowDoubleThird, sopranoNote, bassNote) {
    this.harmonicFunction = harmonicFunction;
    this.allowDoubleThird = allowDoubleThird;
    this.sopranoNote = sopranoNote;
    this.bassNote = bassNote;
}

function ChordGenerator(key, mode) {
    Generator.call(this);

    this.key = key;
    this.mode = mode;

    function getPossiblePitchValuesFromInterval(note, minPitch, maxPitch) {

        while (note - minPitch >= 12) {
            note = note - 12;
        }

        while (note - minPitch < 0) {
            note = note + 12;
        }

        var possiblePitch = [];
        while (maxPitch - note >= 0) {
            possiblePitch.push(note);
            note = note + 12;
        }

        return possiblePitch;
    }

    this.getChordTemplate = function (harmonicFunction) {

        var bass = undefined;
        var tenor = undefined;
        var alto = undefined;
        var soprano = undefined;

        var needToAdd = harmonicFunction.getBasicChordComponents();

        for (var i = 0; i < harmonicFunction.extra.length; i++) {
            needToAdd.push(harmonicFunction.extra[i]);
        }

        for(i = 0; i < harmonicFunction.omit.length; i++) {
            if(contains(needToAdd, harmonicFunction.omit[i]))
                needToAdd.splice(needToAdd.indexOf(harmonicFunction.omit[i]), 1);
        }

        //Position is given
        if (harmonicFunction.position !== undefined) {
            soprano = harmonicFunction.position;
            if(contains(needToAdd, harmonicFunction.position))
                needToAdd.splice(needToAdd.indexOf(harmonicFunction.position), 1);
        }

        //Revolution handling
        bass = harmonicFunction.revolution;
        if(contains(needToAdd, harmonicFunction.revolution))
            needToAdd.splice(needToAdd.indexOf(harmonicFunction.revolution), 1);

        return [[soprano, alto, tenor, bass], needToAdd]

    };

    this.permutations = function (array, indices) {

        var res = []
        if (indices.length === 3) {
            var p = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]];
            for (var j = 0; j < p.length; j++) {
                var res_element = []
                //copy array
                for (var i = 0; i < array.length; i++) {
                    res_element[i] = array[i];
                }
                for (var i = 0; i < indices.length; i++) {
                    res_element[indices[i]] = array[indices[p[j][i]]]
                }
                res.push(res_element)
            }
        } else if (indices.length === 2) {
            var p = [[0, 1], [1, 0]];
            for (var j = 0; j < p.length; j++) {
                res_element = []
                //copy array
                for (var i = 0; i < array.length; i++) {
                    res_element[i] = array[i];
                }
                for (var i = 0; i < indices.length; i++) {
                    res_element[indices[i]] = array[indices[p[j][i]]]
                }
                res.push(res_element)
            }
        }

        //delete repeating
        var comparator = function (a, b) {
            for (var i = 0; i < 4; i++) {
                if (a[i].semitonesNumber === b[i].semitonesNumber) continue;
                if (a[i].semitonesNumber < b[i].semitonesNumber) return -1;
                else return 1
            }
            return 0;
        }
        res.sort(comparator);

        var N = res.length;
        for (var i = 0; i < N - 1; i++) {
            if (comparator(res[i], res[i + 1]) === 0) {
                res.splice(i + 1, 1);
                N--;
            }
        }

        // console.log("PERMUTATIONS")
        // res.forEach(function(x) {
        //     console.log(x)
        // })
        // console.log("END PERMUTATIONS")
        return res;
    }

    this.getSchemas = function (harmonicFunction, chordTemplate) {


        // console.log(chordTemplate);

        var schemas = []

        var chord = chordTemplate[0];
        var needToAdd = chordTemplate[1];

        var possible_to_double = harmonicFunction.getPossibleToDouble();

        // if soprano is not set
        if (chord[0] === undefined) {
            var undefined_count = 3;
            if (needToAdd.length === 3) {
                chord[0] = needToAdd[0];
                chord[1] = needToAdd[1];
                chord[2] = needToAdd[2];
                schemas = schemas.concat(this.permutations(chord, [0, 1, 2]));
            } else if (needToAdd.length === 2) {

                chord[0] = needToAdd[0];
                chord[1] = needToAdd[1];

                for(var i=0; i<possible_to_double.length; i++) {
                    chord[2] = possible_to_double[i];
                    schemas = schemas.concat(this.permutations(chord, [0, 1, 2]));
                }

            } else if (needToAdd.length === 1) {
                chord[0] = needToAdd[0];

                if(possible_to_double.length === 2){
                    chord[1] = possible_to_double[0];
                    chord[2] = possible_to_double[0];
                    schemas = schemas.concat(this.permutations(chord, [0, 1, 2]));
                    chord[1] = possible_to_double[0];
                    chord[2] = possible_to_double[1];
                    schemas = schemas.concat(this.permutations(chord, [0, 1, 2]));
                    chord[1] = possible_to_double[1];
                    chord[2] = possible_to_double[1];
                    schemas = schemas.concat(this.permutations(chord, [0, 1, 2]));
                }
                else if (possible_to_double.length === 1){
                    chord[1] = possible_to_double[0];
                    chord[2] = possible_to_double[0];
                    schemas = schemas.concat(this.permutations(chord, [0, 1, 2]));
                }


            }
        } else {
            var undefined_count = 2;
            if (needToAdd.length === 2) {

                chord[1] = needToAdd[0];
                chord[2] = needToAdd[1];
                schemas = schemas.concat(this.permutations(chord, [1, 2]));

            } else if (needToAdd.length === 1) {
                chord[1] = needToAdd[0]

                for(var i=0; i<possible_to_double.length; i++) {
                    chord[2] = possible_to_double[i];
                    schemas = schemas.concat(this.permutations(chord, [1, 2]));
                }

            } else if (needToAdd.length === 0){

                if(possible_to_double.length === 2){
                    chord[1] = possible_to_double[0];
                    chord[2] = possible_to_double[0];
                    schemas = schemas.concat(this.permutations(chord, [0, 1, 2]));
                    chord[1] = possible_to_double[0];
                    chord[2] = possible_to_double[1];
                    schemas = schemas.concat(this.permutations(chord, [0, 1, 2]));
                    chord[1] = possible_to_double[1];
                    chord[2] = possible_to_double[1];
                    schemas = schemas.concat(this.permutations(chord, [0, 1, 2]));
                }
                else if (possible_to_double.length === 1){
                    chord[1] = possible_to_double[0];
                    chord[2] = possible_to_double[0];
                    schemas = schemas.concat(this.permutations(chord, [0, 1, 2]));
                }

            }
        }


        // console.log("SHEMAS:");
        // schemas.forEach(function(x){ console.log(x)});
        // console.log("SCHEMAS END");

        return schemas;
    };

    this.mapSchemas = function (harmonicFunction, schemas) {

        var infered_key = harmonicFunction.key !== undefined ? harmonicFunction.key : this.key;

        var scale = harmonicFunction.mode === MODE.MAJOR ? new MajorScale(infered_key) : new MinorScale(infered_key);

        var chordFirstPitch = scale.tonicPitch + scale.pitches[harmonicFunction.degree - 1];

        var schemas_cp = schemas.slice();
        for (var i = 0; i < schemas.length; i++) {
            schemas_cp[i] = schemas[i].map(function (scheme_elem) {
                var intervalPitch = scheme_elem.semitonesNumber;
                return chordFirstPitch + intervalPitch;
            })
        }

       // console.log("SHEMAS MAPPED:");
      //  schemas_cp.forEach(function(x){ console.log(x)});
       // console.log("SCHEMAS MAPPED END");

        return schemas_cp;

    };

    this.generatePossibleSopranoNotesFor = function (harmonicFunction) {
        var temp = this.getChordTemplate(harmonicFunction);
        var schemas = this.getSchemas(harmonicFunction, temp);
        var schemas_mapped = this.mapSchemas(harmonicFunction, schemas);

        var infered_key = harmonicFunction.key !== undefined ? harmonicFunction.key : this.key;
        var scale = harmonicFunction.mode === MODE.MAJOR ? new MajorScale(infered_key) : new MinorScale(infered_key);

        var resultNotes = [];

        for (var i = 0; i < schemas_mapped.length; i++) {
            var schema_mapped = schemas_mapped[i];
            var vb = new VoicesBoundary()
            var bass = getPossiblePitchValuesFromInterval(schema_mapped[3], vb.bassMin, vb.bassMax);
            var tenor = getPossiblePitchValuesFromInterval(schema_mapped[2], vb.tenorMin, vb.tenorMax);
            var alto = getPossiblePitchValuesFromInterval(schema_mapped[1], vb.altoMin, vb.altoMax);
            var soprano = getPossiblePitchValuesFromInterval(schema_mapped[0], vb.sopranoMin, vb.sopranoMax);

            var foundForCurrentIteration = false;

            for (var n = 0; n < bass.length && !foundForCurrentIteration; n++) {
                for (var j = 0; j < tenor.length && !foundForCurrentIteration; j++) {
                    if (tenor[j] >= bass[n]) {
                        for (var k = 0; k < alto.length && !foundForCurrentIteration; k++) {
                            if (alto[k] >= tenor[j] && alto[k] - tenor[j] <= 12) {
                                for (var m = 0; m < soprano.length && !foundForCurrentIteration; m++) {
                                    if (soprano[m] >= alto[k] && soprano[m] - alto[k] <= 12) {
                                        var bassNote = new Note(bass[n], toBaseNote(scale.baseNote, harmonicFunction, schemas[i][3]), schemas[i][3]);
                                        var tenorNote = new Note(tenor[j], toBaseNote(scale.baseNote, harmonicFunction, schemas[i][2]), schemas[i][2]);
                                        var altoNote = new Note(alto[k], toBaseNote(scale.baseNote, harmonicFunction, schemas[i][1]), schemas[i][1]);
                                        var sopranoNote = new Note(soprano[m], toBaseNote(scale.baseNote, harmonicFunction, schemas[i][0]), schemas[i][0]);
                                        if(checkChordCorrectness(new Chord(sopranoNote,altoNote,tenorNote,bassNote,harmonicFunction))) {
                                            sopranoNote.pitch = convertPitchToOneOctave(soprano[m]);
                                            if (!contains(resultNotes, sopranoNote)) {
                                                resultNotes.push(sopranoNote);
                                                foundForCurrentIteration = true;
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        return resultNotes;
    }

    this.generate = function (chordGeneratorInput) {
        var harmonicFunction = chordGeneratorInput.harmonicFunction;
        if(harmonicFunction.isTVIMinorDown()  || harmonicFunction.isTIIIMinorDown()){
            harmonicFunction = harmonicFunction.copy();
            harmonicFunction.mode = MODE.MAJOR;
        }
        var chords = [];
        var temp = this.getChordTemplate(harmonicFunction);
        var schemas = this.getSchemas(harmonicFunction, temp);
        var schemas_mapped = this.mapSchemas(harmonicFunction, schemas);

        var infered_key = harmonicFunction.key !== undefined ? harmonicFunction.key : this.key;
        var scale = harmonicFunction.mode === MODE.MAJOR ? new MajorScale(infered_key) : new MinorScale(infered_key);

        for (var i = 0; i < schemas_mapped.length; i++) {
            var schema_mapped = schemas_mapped[i];
            var vb = new VoicesBoundary()
            var bass = getPossiblePitchValuesFromInterval(schema_mapped[3], vb.bassMin, vb.bassMax);
            var tenor = getPossiblePitchValuesFromInterval(schema_mapped[2], vb.tenorMin, vb.tenorMax);
            var alto = getPossiblePitchValuesFromInterval(schema_mapped[1], vb.altoMin, vb.altoMax);
            var soprano = getPossiblePitchValuesFromInterval(schema_mapped[0], vb.sopranoMin, vb.sopranoMax);

            for (var n = 0; n < bass.length; n++) {
                for (var j = 0; j < tenor.length; j++) {
                    if (tenor[j] >= bass[n]) {
                        for (var k = 0; k < alto.length; k++) {
                            if (alto[k] >= tenor[j] && alto[k] - tenor[j] <= 12) {
                                for (var m = 0; m < soprano.length; m++) {
                                    if (soprano[m] >= alto[k] && soprano[m] - alto[k] <= 12) {

                                        var bassNote = new Note(bass[n], toBaseNote(scale.baseNote, harmonicFunction, schemas[i][3]), schemas[i][3]);
                                        var tenorNote = new Note(tenor[j], toBaseNote(scale.baseNote, harmonicFunction, schemas[i][2]), schemas[i][2]);
                                        var altoNote = new Note(alto[k], toBaseNote(scale.baseNote, harmonicFunction, schemas[i][1]), schemas[i][1]);
                                        var sopranoNote = new Note(soprano[m], toBaseNote(scale.baseNote, harmonicFunction, schemas[i][0]), schemas[i][0]);
                                        chords.push(new Chord(sopranoNote, altoNote, tenorNote, bassNote, chordGeneratorInput.harmonicFunction));

                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        //filtering in case of given system (open/close)
        if (harmonicFunction.system !== undefined) {

            chords = chords.filter(function (chord) {
                // console.log("\n");
                // console.log(chord.toString());
                var isInOpenInterval = function(pitch, interval){
                    for(var i= interval[0] + 1; i<interval[1];i++){
                        if( mod(i, 12) === mod(pitch, 12) ) return true;
                    }
                    return false;
                }

                var xor = function(p,q){
                    return (p || q) && !(p && q)
                }

                var interval1 = [chord.altoNote.pitch, chord.sopranoNote.pitch];
                var interval2 = [chord.tenorNote.pitch, chord.altoNote.pitch];
                // console.log(interval1)
                // console.log(interval2)

                var p = isInOpenInterval(chord.bassNote.pitch, interval1);
                var q = isInOpenInterval(chord.tenorNote.pitch, interval1);

                var r = isInOpenInterval(chord.bassNote.pitch, interval2);
                var s = isInOpenInterval(chord.sopranoNote.pitch, interval2);
                // console.log( p + " " + q + " " + r + " " + s)

                if(chord.harmonicFunction.system === "open") {
                    var t = (chord.bassNote.chordComponent === chord.tenorNote.chordComponent);
                    var u = (chord.bassNote.chordComponent === chord.sopranoNote.chordComponent);
                    
                    return (xor(p,q) || (t && p && q)) && (xor(r,s) || (u && r && s));
                }
                if(chord.harmonicFunction.system === "close") return (!p && !q && !r && !s);
                log("ILLEGAL system in harmonicFunction: " + chord.harmonicFunction.system)
                return true;
            });


        }

        // console.log("CHORDS:");
        // chords.forEach(function(x){ console.log(x.toString())});
        // console.log("CHORDS END:");

        // filtering chords with given pitches
        if (isDefined(chordGeneratorInput.bassNote)) {
            chords = chords.filter(function (chord) {
                function eq(x, y) {
                    return y === undefined
                        || y.pitch === undefined
                        || x.pitch === y.pitch
                }

                return eq(chord.bassNote, chordGeneratorInput.bassNote)
            })
        }
        if (isDefined(chordGeneratorInput.sopranoNote)) {
            chords = chords.filter(function (chord) {
                function eq(x, y) {
                    return y === undefined
                        || y.pitch === undefined
                        || x.pitch === y.pitch
                }

                return eq(chord.sopranoNote, chordGeneratorInput.sopranoNote)
            })
        }
        if(!chordGeneratorInput.allowDoubleThird){
            var illegalDoubledThirdRule = new IllegalDoubledThirdRule();
            chords.filter(function (chord) {
                    return !illegalDoubledThirdRule.hasIllegalDoubled3Rule(chord)
                }
            )
        }

        return chords.filter(function (chord){
            return checkChordCorrectness(chord)
        });

    }
}

function correctDistanceBassTenor(chord){
    return !chord.bassNote.baseChordComponentEquals('1') ||
        chord.tenorNote.chordComponent.semitonesNumber < 12 ||
        pitchOffsetBetween(chord.tenorNote, chord.bassNote) >= 12;

}

function correctChopinChord(chord){
    if(chord.harmonicFunction.isChopin()){
        var voiceWith6 = -1;
        var voiceWith7 = -1;
        for(var voice=0; voice<4; voice++){
            if(chord.notes[voice].baseChordComponentEquals("6"))
                voiceWith6 = voice;
            if(chord.notes[voice].chordComponentEquals("7"))
                voiceWith7 = voice;
        }
        if(voiceWith6 !== -1 && voiceWith7 !== -1 && voiceWith6 < voiceWith7)
            return false;
    }
    return true;
}

function correctNinthChord(chord){
    if(!containsBaseChordComponent(chord.harmonicFunction.extra,9))
        return true;
    if(containsBaseChordComponent(["3","7"], chord.harmonicFunction.revolution)) {
        if(!chord.sopranoNote.baseChordComponentEquals("9") || !chord.tenorNote.baseChordComponentEquals("1"))
            return false;
    }
    return true;
}

function checkChordCorrectness(chord){
    return correctDistanceBassTenor(chord) && correctChopinChord(chord) && correctNinthChord(chord)
}

var DEBUG = false;

function ChordRulesChecker(isFixedBass, isFixedSoprano){
    Evaluator.call(this, 3);
    this.isFixedBass = isFixedBass;
    this.isFixedSoprano = isFixedSoprano;

    this.hardRules = [
        new ConcurrentOctavesRule("Parallel octaves"),
        new ConcurrentFifthsRule("Parallel fifths"),
        new IllegalDoubledThirdRule("Illegal double third"),
        new CrossingVoicesRule("Crossing voices"),
        new OneDirectionRule("One direction of voices"),
        new ForbiddenJumpRule(false, isFixedBass, isFixedSoprano, "Forbidden voice jump"),
        new CheckDelayCorrectnessRule("Incorrect delay"), //should stand here always
        new HiddenOctavesRule("Hidden parallel octaves"),
        new FalseRelationRule("False relation"),
        new SameFunctionCheckConnectionRule("Repeated function voice wrong movement"),
        new DominantSubdominantCheckConnectionRule("Dominant subdominant relation voice wrong movement") //should stand here always
    ];
    this.softRules = [
        new ForbiddenSumJumpRule("Forbidden voice sum jump"),
        new ClosestMoveRule("Not closest move in voices"),
        new DoublePrimeOrFifthRule("Doubling prime/fifth due to revolution"),
        new SopranoBestLineRule("Soprano line should not contain big jumps"),
        new DominantRelationCheckConnectionRule("Dominant relation voice wrong movement"),
        new DominantSecondRelationCheckConnectionRule("Dominant second relation voice wrong movement"),
        new SubdominantDominantCheckConnectionRule("Subdominant Dominant relation voice wrong movement")
    ];
}

function AdaptiveChordRulesChecker(punishmentRatios){
    ChordRulesChecker.call(this, false, true);
    this.punishmentRatios = punishmentRatios;

    this.hardRules = [
        new CheckDelayCorrectnessRule("Incorrect delay"), //should stand here
        new DominantSubdominantCheckConnectionRule("Dominant subdominant relation voice wrong movement") //should stand here
    ];
    this.softRules = [
        new ForbiddenSumJumpRule("Forbidden voice sum jump"),
        new ClosestMoveRule("Not closest move in voices"),
        new DoublePrimeOrFifthRule("Doubling prime/fifth due to revolution"),
        new SopranoBestLineRule("Soprano line should not contain big jumps"),
        new DominantRelationCheckConnectionRule("Dominant relation voice wrong movement"),
        new DominantSecondRelationCheckConnectionRule("Dominant second relation voice wrong movement"),
        new SubdominantDominantCheckConnectionRule("Subdominant Dominant relation voice wrong movement"),
        new ClosestMoveInBassRule(true, "Not closest move in bass")
    ];

    this.addPunishmentRatiosToRules = function() {
        var rulesToAlter = getValuesOf(CHORD_RULES);

        for (var i = 0; i < rulesToAlter.length; i++) {
            var targetRuleSet = this.punishmentRatios[rulesToAlter[i]] === 1 ? this.hardRules : this.softRules;
            switch (rulesToAlter[i]) {
                case CHORD_RULES.ConcurrentOctaves:
                    targetRuleSet.push(new ConcurrentOctavesRule("Parallel octaves", this.punishmentRatios[rulesToAlter[i]]));
                    break;
                case CHORD_RULES.ConcurrentFifths:
                    targetRuleSet.push(new ConcurrentFifthsRule("Parallel fifths", this.punishmentRatios[rulesToAlter[i]]));
                    break;
                case CHORD_RULES.CrossingVoices:
                    targetRuleSet.push(new CrossingVoicesRule("Crossing voices", this.punishmentRatios[rulesToAlter[i]]));
                    break;
                case CHORD_RULES.OneDirection:
                    targetRuleSet.push(new OneDirectionRule("One direction of voices", this.punishmentRatios[rulesToAlter[i]]));
                    break;
                case CHORD_RULES.ForbiddenJump:
                    targetRuleSet.push(new ForbiddenJumpRule(false, this.isFixedBass, this.isFixedSoprano, "Forbidden voice jump", this.punishmentRatios[rulesToAlter[i]]));
                    break;
                case CHORD_RULES.HiddenOctaves:
                    targetRuleSet.push(new HiddenOctavesRule("Hidden parallel octaves", this.punishmentRatios[rulesToAlter[i]]));
                    break;
                case CHORD_RULES.FalseRelation:
                    targetRuleSet.push(new FalseRelationRule("False relation", this.punishmentRatios[rulesToAlter[i]]));
                    break;
                case CHORD_RULES.SameFunctionCheckConnection:
                    targetRuleSet.push(new SameFunctionCheckConnectionRule("Repeated function voice wrong movement", this.punishmentRatios[rulesToAlter[i]]));
                    break;
                case CHORD_RULES.IllegalDoubledThird:
                    targetRuleSet.push(new IllegalDoubledThirdRule("Illegal double third", this.punishmentRatios[rulesToAlter[i]]));
                    break;
                default:
                    throw new UnexpectedInternalError("Incorrect rule type to alter", rulesToAlter[i]);
            }
        }
    }

    if(getValuesOf(this.punishmentRatios).length > 0)
        this.addPunishmentRatiosToRules();

}

/*
        HARD RULES
 */

function SameFunctionRule(){
    IRule.call(this);
    this.evaluate = function(connection){
        if(connection.prev.harmonicFunction.equals(connection.current.harmonicFunction))
            return 0;
        return -1;
    }
}

var sfRule = new SameFunctionRule();


function SpecificFunctionConnectionRule(prevFunctionName, currentFunctionName){
    IRule.call(this);
    this.currentFunctionName = currentFunctionName;
    this.prevFunctionName = prevFunctionName;
    this.evaluate = function(connection){
        if(connection.prev.harmonicFunction.functionName === this.prevFunctionName &&
            connection.current.harmonicFunction.functionName === this.currentFunctionName)
            return 0;
        return -1;
    }
}

var specificConnectionRuleDT = new SpecificFunctionConnectionRule(FUNCTION_NAMES.DOMINANT, FUNCTION_NAMES.TONIC);
var specificConnectionRuleDS = new SpecificFunctionConnectionRule(FUNCTION_NAMES.DOMINANT, FUNCTION_NAMES.SUBDOMINANT);
var specificConnectionRuleSD = new SpecificFunctionConnectionRule(FUNCTION_NAMES.SUBDOMINANT, FUNCTION_NAMES.DOMINANT);


function ConcurrentOctavesRule(details, evaluationRatio){
    IRule.call(this, details, evaluationRatio);

    this.evaluate = function(connection){
        var currentChord = connection.current;
        var prevChord = connection.prev;
        if(sfRule.isNotBroken(connection)) return 0;
        for(var i = 0; i < 3; i++){
            for(var j = i + 1; j < 4; j++){
                if(isOctaveOrPrime(currentChord.notes[j],currentChord.notes[i]) &&
                    isOctaveOrPrime(prevChord.notes[j],prevChord.notes[i])){
                    if(DEBUG) log("concurrentOctaves "+i+" "+j, prevChord + " -> " + currentChord);
                    return this.evaluationRatio * 40;
                }
            }
        }
        return 0;
    }
}

function ConcurrentFifthsRule(details, evaluationRatio){
    IRule.call(this, details, evaluationRatio);

    this.evaluate = function(connection) {
        var currentChord = connection.current;
        var prevChord = connection.prev;
        if (sfRule.isNotBroken(connection)) return 0;
        for (var i = 0; i < 3; i++) {
            for (var j = i + 1; j < 4; j++) {
                if (isFive(currentChord.notes[j], currentChord.notes[i]) &&
                    isFive(prevChord.notes[j], prevChord.notes[i])) {
                    if (DEBUG) log("concurrentFifths " + i + " " + j, prevChord + " -> " + currentChord);
                    return this.evaluationRatio * 40;
                }
            }
        }
        return 0;
    }
}

function CrossingVoicesRule(details, evaluationRatio){
    IRule.call(this, details, evaluationRatio);

    this.evaluate = function(connection) {
        var currentChord = connection.current;
        var prevChord = connection.prev;
        for(var i = 0; i < 3; i++){
            if(currentChord.notes[i].isUpperThan(prevChord.notes[i+1])){
                if(DEBUG) log("crossingVoices", prevChord + " -> " + currentChord);
                return this.evaluationRatio * 60;
            }
        }
        for(var i = 3; i > 0; i--){
            if(currentChord.notes[i].isLowerThan(prevChord.notes[i-1])){
                if(DEBUG) log("crossingVoices", prevChord + " -> " + currentChord);
                return this.evaluationRatio * 60;
            }
        }
        return 0;
    }
}

function OneDirectionRule(details, evaluationRatio){
    IRule.call(this, details, evaluationRatio);

    this.evaluate = function(connection) {
        var currentChord = connection.current;
        var prevChord = connection.prev;
        if ((currentChord.bassNote.isUpperThan(prevChord.bassNote) && currentChord.tenorNote.isUpperThan(prevChord.tenorNote)
            && currentChord.altoNote.isUpperThan(prevChord.altoNote) && currentChord.sopranoNote.isUpperThan(prevChord.sopranoNote))
            || (currentChord.bassNote.isLowerThan(prevChord.bassNote) && currentChord.tenorNote.isLowerThan(prevChord.tenorNote)
                && currentChord.altoNote.isLowerThan(prevChord.altoNote) && currentChord.sopranoNote.isLowerThan(prevChord.sopranoNote))) {
            if (DEBUG) log("oneDirection", prevChord + " -> " +currentChord);
            return this.evaluationRatio * 35;
        }

        return 0;
    }
}

function IllegalDoubledThirdRule(details, evaluationRatio){
    IRule.call(this, details, evaluationRatio);
    this.evaluate = function(connection) {
        var currentChord = connection.current;
        var prevChord = connection.prev;
        if ((specificConnectionRuleDT.isNotBroken(connection) ||
            containsBaseChordComponent(prevChord.harmonicFunction.extra, "7")) &&
            prevChord.harmonicFunction.isInDominantRelation(currentChord.harmonicFunction) &&
            containsChordComponent(prevChord.harmonicFunction.extra, "5<"))
            return 0;
        if(specificConnectionRuleDT.isNotBroken(connection) && prevChord.harmonicFunction.isInSecondRelation(currentChord.harmonicFunction))
            return 0;

        return this.hasIllegalDoubled3Rule(currentChord)? this.evaluationRatio * 50 : 0
    };

    this.hasIllegalDoubled3Rule = function(chord){
        var terCounter = chord.countBaseComponents("3");
        if(chord.harmonicFunction.isNeapolitan())
            return terCounter !== 2;
        return terCounter > 1
    }
}

function ForbiddenJumpRule(notNeighbourChords, isFixedBass, isFixedSoprano, details, evaluationRatio){
    IRule.call(this, details, evaluationRatio);
    this.notNeighbourChords = notNeighbourChords;
    this.isFixedBass = isFixedBass;
    this.isFixedSoprano = isFixedSoprano;

    this.evaluate = function(connection) {
        var currentChord = connection.current;
        var prevChord = connection.prev;
        // if(!notNeighbourChords && prevChord.harmonicFunction.equals(currentChord.harmonicFunction)) return 0;

        for (var i = 0; i < 4; i++) {
            //TODO upewnić się jak ze skokami jest naprawdę, basu chyba ta zasada się nie tyczy
            if (pitchOffsetBetween(currentChord.notes[i], prevChord.notes[i]) > 9 && !(this.notNeighbourChords && i === 0)
                && !(i === 0 && pitchOffsetBetween(currentChord.notes[i], prevChord.notes[i]) === 12) &&!this.skipCheckingVoiceIncorrectJump(i)) {
                if (DEBUG) log("Forbidden jump in voice " + i, prevChord + "->" + currentChord);
                return this.evaluationRatio * 40;
            }
            if (isAlteredInterval(prevChord.notes[i], currentChord.notes[i])) {
                if (DEBUG) log("Altered Interval in voice " + i, prevChord + "->" + currentChord);
                return this.evaluationRatio * 35;
            }
        }
        return 0;
    }

    this.skipCheckingVoiceIncorrectJump = function(voiceNumber) {
        return (voiceNumber === 0 && this.isFixedBass)
            || (voiceNumber === 3 && this.isFixedSoprano)
    }
}

var forbiddenJumpRulenoArgs = new ForbiddenJumpRule();

function CheckDelayCorrectnessRule(details){
    IRule.call(this, details);

    this.evaluate = function(connection) {
        var currentChord = connection.current;
        var prevChord = connection.prev;
        var delay = prevChord.harmonicFunction.delay;
        if (delay.length === 0) return 0;
        var delayedVoices = [];
        for (var i = 0; i < delay.length; i++) {
            var prevComponent = delay[i][0];
            var currentComponent = delay[i][1];
            for (var j = 0; j < 4; j++) {
                if (prevChord.notes[j].chordComponentEquals(prevComponent.chordComponentString)) {
                    if (!currentChord.notes[j].chordComponentEquals(currentComponent.chordComponentString)) {
                        if (DEBUG) log("delay error" + i + " " + j, prevChord + " -> " + currentChord);
                        return -1;
                    } else delayedVoices.push(j);
                }
            }
        }
        for (var i = 0; i < 4; i++) {
            if (contains(delayedVoices, i)) continue;
            if (!prevChord.notes[i].equalPitches(currentChord.notes[i]) && i !== 0) {
                if (DEBUG) log("delay error" + i + " " + j, prevChord + " -> " + currentChord);
                return -1;
            }
        }
        return 0;
    }
}

function HiddenOctavesRule(details, evaluationRatio){
    IRule.call(this, details, evaluationRatio);

    this.evaluate = function(connection) {
        var currentChord = connection.current;
        var prevChord = connection.prev;
        var sameDirection = (prevChord.bassNote.isLowerThan(currentChord.bassNote) && prevChord.sopranoNote.isLowerThan(currentChord.sopranoNote) ||
            (prevChord.bassNote.isUpperThan(currentChord.bassNote) && prevChord.sopranoNote.isUpperThan(currentChord.sopranoNote)));
        if (sameDirection && abs(prevChord.sopranoNote.pitch - currentChord.sopranoNote.pitch) > 2 &&
            isOctaveOrPrime(currentChord.bassNote, currentChord.sopranoNote)) {
            if (DEBUG) log("hiddenOctaves", prevChord + " -> " + currentChord);
            return this.evaluationRatio * 35;
        }
        return 0;
    }
}

function FalseRelationRule(details, evaluationRatio){
    IRule.call(this, details, evaluationRatio);

    this.evaluate = function(connection) {
        var currentChord = connection.current;
        var prevChord = connection.prev;

        for (var i = 0; i < 4; i++) {
            for (var j = i + 1; j < 4; j++) {
                if (isChromaticAlteration(prevChord.notes[i], currentChord.notes[j])) {
                    if(!this.causedBySopranoOrBassSettings(prevChord, currentChord, i, j)) {
                        if (DEBUG) log("false relation between voices " + i + " " + j, prevChord + "->" + currentChord);
                        return this.evaluationRatio * 30;
                    }
                }
                if (isChromaticAlteration(prevChord.notes[j], currentChord.notes[i])) {
                    if(!this.causedBySopranoOrBassSettings(prevChord, currentChord, j, i)) {
                        if (DEBUG) log("false relation between voices " + j + " " + i, prevChord + "->" + currentChord);
                        return this.evaluationRatio * 30;
                    }
                }
            }
        }
        return 0;
    }

    this.causedBySopranoOrBassSettings = function(prevChord, currentChord, prevVoice, currentVoice){
        //for example D7 -> TVI -> (D) -> SII
        if(prevChord.countBaseComponents("3") === 2 && prevChord.notes[prevVoice].baseChordComponentEquals("3"))
            return true;
        //given bass, couldn't avoid false relation
        if(prevVoice === 0 || currentVoice === 0)
            return true;
        //given soprano, couldn't avoid false relation
        // if(prevVoice === 3 || currentVoice === 3){
        //     if(isDefined(prevChord.harmonicFunction.position) && isDefined(currentChord.harmonicFunction.position))
        //         return true;
        // }
        return false;
    }
}

var currentConnection = undefined
var currentConnectionTranslated = undefined

function ICheckConnectionRule(details){
    IRule.call(this, details);

    this.evaluate = function(connection) {
        var translatedConnection = this.translateConnectionIncludingDeflections(connection);
        currentConnection = connection;
        currentConnectionTranslated = translatedConnection;
        if(!isDefined(translatedConnection))
            return 0;
        return this.evaluateIncludingDeflections(translatedConnection);
    };

    this.translateConnectionIncludingDeflections = function(connection){
        if(isDefined(currentConnection) && connection.equals(currentConnection))
            return currentConnectionTranslated;
        var currentChord = connection.current.copy();
        var prevChord = connection.prev.copy();
        var currentFunctionTranslated = currentChord.harmonicFunction.copy();
        currentFunctionTranslated.key = currentChord.harmonicFunction.key;
        var prevFunctionTranslated = prevChord.harmonicFunction.copy();
        prevFunctionTranslated.key = prevChord.harmonicFunction.key;
        if(prevChord.harmonicFunction.key !== currentChord.harmonicFunction.key){
            if(isDefined(prevChord.harmonicFunction.key) && !prevChord.harmonicFunction.isRelatedBackwards) {
                currentFunctionTranslated.functionName = FUNCTION_NAMES.TONIC;
                currentFunctionTranslated.degree = 1;
            } else if(currentChord.harmonicFunction.isRelatedBackwards){
                prevFunctionTranslated.functionName = FUNCTION_NAMES.TONIC;
                prevFunctionTranslated.degree = 1;
            } else
                return undefined
        }
        currentChord.harmonicFunction = currentFunctionTranslated;
        prevChord.harmonicFunction = prevFunctionTranslated;

        return new Connection(currentChord, prevChord)
    };

    this.evaluateIncludingDeflections = function(connection){
        return new Error("ICheckConnectionRule default method was called")
    };

    //returns voice number with given base component, otherwise returns -1
    this.voiceWithBaseComponent = function(chord, baseComponent){
        var voiceWithGivenComponent = -1;
        for (var i = 0; i < 4; i++) {
            if (chord.notes[i].baseChordComponentEquals(baseComponent)) {
                voiceWithGivenComponent = i;
                break;
            }
        }
        return voiceWithGivenComponent;
    };

    //returns voice number with given chord component, otherwise returns -1
    this.voiceWithComponent = function(chord, chordComponent){
        var voiceWithGivenComponent = -1;
        for (var i = 0; i < 4; i++) {
            if (chord.notes[i].chordComponentEquals(chordComponent)) {
                voiceWithGivenComponent = i;
                break;
            }
        }
        return voiceWithGivenComponent;
    };

}

function DominantSubdominantCheckConnectionRule(details){

    ICheckConnectionRule.call(this, details);

    this.evaluateIncludingDeflections = function(connection){
        if (specificConnectionRuleDS.isNotBroken(connection) &&
            connection.prev.harmonicFunction.hasMajorMode())
            throw new RulesCheckerError("Forbidden connection: D->S");
        return 0;
    }
}

function SameFunctionCheckConnectionRule(details, evaluationRatio){

    ICheckConnectionRule.call(this, details, evaluationRatio);

    this.evaluateIncludingDeflections = function(connection){
        if(sfRule.isNotBroken(connection)){
                if(this.brokenChangePitchesRule(connection.current, connection.prev))
                    return this.evaluationRatio * 20;
        }
        return 0;
    };

    this.brokenChangePitchesRule = function(currentChord, prevChord) {
        return prevChord.sopranoNote.equals(currentChord.sopranoNote) &&
            prevChord.altoNote.equals(currentChord.altoNote) &&
            prevChord.tenorNote.equals(currentChord.tenorNote) &&
            prevChord.bassNote.equalsInOneOctave(currentChord.bassNote);
    };

}
/*
        END OF HARD RULES
 */

/*
        SOFT RULES
 */
function ForbiddenSumJumpRule(details){
    IRule.call(this, details);

    this.evaluate = function(connection) {
        if(!isDefined(connection.prevPrev))
            return 0;
        var currentChord = connection.current;
        var prevChord = connection.prev;
        var prevPrevChord = connection.prevPrev;

        if (sfRule.isNotBroken(new Connection(connection.prevPrev, connection.prev)) &&
            sfRule.isNotBroken(new Connection(connection.prev, connection.current))) return 0;
        for (var i = 0; i < 4; i++) {
            if (((prevPrevChord.notes[i].isUpperThan(prevChord.notes[i]) && prevChord.notes[i].isUpperThan(currentChord.notes[i])) ||
                (prevPrevChord.notes[i].isLowerThan(prevChord.notes[i]) && prevChord.notes[i].isLowerThan(currentChord.notes[i])))
                && forbiddenJumpRulenoArgs.isBroken(new Connection(connection.current, connection.prevPrev), true)) {
                if (DEBUG) {
                    log("forbiddenSumJump in voice " + i, prevPrevChord + " -> " + prevChord + " -> " + currentChord);
                }
                return 10;
            }
        }
        return 0;
    }
}

var vb = new VoicesBoundary();


function ClosestMoveRule(details){
    IRule.call(this, details);

    this.evaluate = function(connection) {
        var currentChord = connection.current;
        var prevChord = connection.prev;
        for(var i=1; i<4; i++){
            var higherPitch, lowerPitch;
            if(prevChord.notes[i].pitch > currentChord.notes[i].pitch){
                higherPitch = prevChord.notes[i].pitch;
                lowerPitch = currentChord.notes[i].pitch;
            } else {
                higherPitch = currentChord.notes[i].pitch;
                lowerPitch = prevChord.notes[i].pitch;
            }

            for(var j=1; j<3; j++){
                if(j !== i){
                    for(var currentPitch=currentChord.notes[j].pitch; currentPitch<vb.sopranoMax; currentPitch += 12){
                        if(currentPitch < higherPitch && currentPitch > lowerPitch){
                            return 10;
                        }
                    }
                    for(var currentPitch=currentChord.notes[j].pitch; currentPitch<vb.tenorMin; currentPitch -= 12){
                        if(currentPitch < higherPitch && currentPitch > lowerPitch){
                            return 10;
                        }
                    }
                }
            }
        }
        return 0;
    };
}

function ClosestMoveInBassRule(isFixedSoprano, details){
    IRule.call(this, details);

    this.isFixedSoprano = isFixedSoprano;

    this.evaluate = function(connection) {
        if(!this.isFixedSoprano)
            return 0;
        var currentChord = connection.current;
        var prevChord = connection.prev;
        var bassPitch = currentChord.bassNote.pitch;
        var prevBassPitch = prevChord.bassNote.pitch;
        var offset = abs(bassPitch - prevBassPitch);

        for(var i = 1; i < 4; i++){
            var pitch = currentChord.notes[i].pitch;
            if(contains(currentChord.harmonicFunction.getBasicChordComponents(), currentChord.notes[i].chordComponent) &&
                currentChord.harmonicFunction.revolution !== currentChord.notes[i].chordComponent){
                while(abs(prevBassPitch - pitch) >= 12)
                    pitch -= 12;
                if(abs(pitch - prevBassPitch) < offset)
                    return 50;
            }
        }
        return 0;
    };
}

//only for current chord - improvement
function DoublePrimeOrFifthRule(details) {
    IRule.call(this, details);

    this.evaluate = function (connection) {
        var currentChord = connection.current;

        if(currentChord.harmonicFunction.countChordComponents() > 3)
            return 0;

        //double soprano component
        if(currentChord.harmonicFunction.revolution.chordComponentString === "1"){
            if(currentChord.countBaseComponents(currentChord.sopranoNote.chordComponent.baseComponent) === 1)
                return 2;
        }
        //double fifth if revolution === fifth
        if(currentChord.harmonicFunction.revolution.chordComponentString === currentChord.harmonicFunction.getFifth()){
            if(currentChord.countBaseComponents(currentChord.harmonicFunction.getFifth()) === 1)
                return 2;
        }
        return 0;
    }
}

//soprano line should not have big jumps
function SopranoBestLineRule(details){
    IRule.call(this, details);

    this.evaluate = function (connection) {
        var currentChord = connection.current;
        var prevChord = connection.prev;

        if(pitchOffsetBetween(prevChord.sopranoNote, currentChord.sopranoNote) > 4)
            return 3;
        return 0;
    }
}

function DominantRelationCheckConnectionRule(details){

    ICheckConnectionRule.call(this, details);

    this.evaluateIncludingDeflections = function(connection) {
        var currentChord = connection.current;
        var prevChord = connection.prev;
        var result = 0;
        if ((specificConnectionRuleDT.isNotBroken(connection) ||
            containsBaseChordComponent(prevChord.harmonicFunction.extra, "7")) &&
            prevChord.harmonicFunction.isInDominantRelation(currentChord.harmonicFunction)){
            if(this.brokenThirdMoveRule(prevChord, currentChord))
                return 50;
            if (containsBaseChordComponent(prevChord.harmonicFunction.extra, "7")) {
                if(this.brokenSeventhMoveRule(prevChord, currentChord))
                    result += 20;
                if (containsBaseChordComponent(prevChord.harmonicFunction.extra, "9") && this.brokenNinthMoveRule(prevChord, currentChord))
                    result += 20;
            }
            if (containsChordComponent(prevChord.harmonicFunction.extra, "5<")  && this.brokenUpFifthMoveRule(prevChord, currentChord))
                result += 20;
            if ((containsChordComponent(prevChord.harmonicFunction.extra, "5>") || prevChord.harmonicFunction.getFifth().chordComponentString === "5>") &&
                this.brokenDownFifthMoveRule(prevChord, currentChord))
                result += 20;
            if (prevChord.harmonicFunction.isChopin() && this.brokenChopinMoveRule(prevChord, currentChord))
                return 50;
        }
        return result;
    };

    this.brokenThirdMoveRule = function(prevChord, currentChord){
        var dominantVoiceWith3 = this.voiceWithBaseComponent(prevChord, "3");
        return dominantVoiceWith3 > -1 &&
            !prevChord.notes[dominantVoiceWith3].equalPitches(currentChord.notes[dominantVoiceWith3]) &&
            !containsBaseChordComponent(currentChord.harmonicFunction.omit, "1") &&
            !currentChord.notes[dominantVoiceWith3].baseChordComponentEquals("1") &&
            !currentChord.notes[dominantVoiceWith3].baseChordComponentEquals("7") &&
            !currentChord.harmonicFunction.containsDelayedChordComponent("1") &&
            !(prevChord.bassNote.baseChordComponentEquals("3") && currentChord.bassNote.baseChordComponentEquals("3"));
    };

    this.brokenSeventhMoveRule = function(prevChord, currentChord){
        var dominantVoiceWith3 = this.voiceWithBaseComponent(prevChord, "3");
        var dominantVoiceWith7 = this.voiceWithBaseComponent(prevChord, "7");
        if (dominantVoiceWith7 > -1 &&
            !prevChord.notes[dominantVoiceWith7].equalPitches(currentChord.notes[dominantVoiceWith7]) &&
            !currentChord.notes[dominantVoiceWith7].baseChordComponentEquals("3") &&
            !currentChord.harmonicFunction.containsDelayedBaseChordComponent("3")) {
            //rozwiazanie swobodne mozliwe
            if ((currentChord.harmonicFunction.revolution.chordComponentString === "3" ||
                currentChord.harmonicFunction.revolution.chordComponentString === "3>" ||
                (isDefined(currentChord.harmonicFunction.position) && (currentChord.harmonicFunction.position.chordComponentString === "3" ||
                    currentChord.harmonicFunction.position.chordComponentString === "3>"))) &&
                dominantVoiceWith7 < dominantVoiceWith3) {
                if (!currentChord.notes[dominantVoiceWith7].baseChordComponentEquals("5")) return true;
            } else return true;
        }
        return false;
    };

    this.brokenNinthMoveRule = function(prevChord, currentChord){
        var dominantVoiceWith9 = this.voiceWithBaseComponent(prevChord, "9");
        return dominantVoiceWith9 > -1 &&
            !prevChord.notes[dominantVoiceWith9].equalPitches(currentChord.notes[dominantVoiceWith9]) &&
            !currentChord.notes[dominantVoiceWith9].baseChordComponentEquals("5") &&
            !currentChord.harmonicFunction.containsDelayedBaseChordComponent("5");
    };

    this.brokenUpFifthMoveRule = function(prevChord, currentChord){
        var dominantVoiceWithAlt5 = this.voiceWithComponent(prevChord, "5<");
        return dominantVoiceWithAlt5 > -1 &&
            !prevChord.notes[dominantVoiceWithAlt5].equalPitches(currentChord.notes[dominantVoiceWithAlt5]) &&
            !currentChord.notes[dominantVoiceWithAlt5].baseChordComponentEquals("3") &&
            !currentChord.harmonicFunction.containsDelayedBaseChordComponent("3");
    };

    this.brokenDownFifthMoveRule = function(prevChord, currentChord){
        var dominantVoiceWithAlt5 = this.voiceWithComponent(prevChord, "5>");
        return dominantVoiceWithAlt5 > -1 &&
            !prevChord.notes[dominantVoiceWithAlt5].equalPitches(currentChord.notes[dominantVoiceWithAlt5]) &&
            !currentChord.notes[dominantVoiceWithAlt5].baseChordComponentEquals("1") &&
            !currentChord.harmonicFunction.containsDelayedBaseChordComponent("1");
    };

    this.brokenChopinMoveRule = function(prevChord, currentChord){
        var dominantVoiceWith6 = this.voiceWithBaseComponent(prevChord, "6");
        return dominantVoiceWith6 > -1 &&
            !currentChord.notes[dominantVoiceWith6].chordComponentEquals("1") &&
            !currentChord.harmonicFunction.containsDelayedChordComponent("1");
    };
}

function DominantSecondRelationCheckConnectionRule(details){

    ICheckConnectionRule.call(this, details);

    this.evaluateIncludingDeflections = function(connection) {
        var currentChord = connection.current;
        var prevChord = connection.prev;
        var result = 0;
        if (specificConnectionRuleDT.isNotBroken(connection)
            && prevChord.harmonicFunction.isInSecondRelation(currentChord.harmonicFunction)) {
            if(this.brokenThirdMoveRule(prevChord, currentChord))
                return 50;
            if(this.brokenFifthMoveRule(prevChord, currentChord))
                result += 20;
            if (containsChordComponent(prevChord.harmonicFunction.extra, "7") && this.brokenSeventhMoveRule(prevChord, currentChord))
                result += 20;
            if (containsChordComponent(prevChord.harmonicFunction.extra, "5>") && this.brokenDownFifthMoveRule(prevChord, currentChord))
                result += 20;
        }
        return result;
    };

    this.brokenThirdMoveRule = function(prevChord, currentChord){
        var dominantVoiceWith3 = this.voiceWithBaseComponent(prevChord, "3");
        return dominantVoiceWith3 > -1 && !currentChord.notes[dominantVoiceWith3].baseChordComponentEquals("3") &&
            !currentChord.harmonicFunction.containsDelayedBaseChordComponent("3");
    };

    this.brokenFifthMoveRule = function(prevChord, currentChord){
        var dominantVoiceWith5 = this.voiceWithBaseComponent(prevChord, "5");
        return (dominantVoiceWith5 > -1 && !currentChord.notes[dominantVoiceWith5].baseChordComponentEquals("3") &&
            !currentChord.harmonicFunction.containsDelayedBaseChordComponent("3"));
    };

    this.brokenSeventhMoveRule = function(prevChord, currentChord){
        var dominantVoiceWith7 = this.voiceWithBaseComponent(prevChord, "7");
        return dominantVoiceWith7 > -1 && !currentChord.notes[dominantVoiceWith7].baseChordComponentEquals("5") &&
            !currentChord.harmonicFunction.containsDelayedBaseChordComponent("5");
    };

    this.brokenDownFifthMoveRule = function(prevChord, currentChord){
        var dominantVoiceWithAlt5 = this.voiceWithComponent(prevChord, "5>");
        return dominantVoiceWithAlt5 > -1 &&
            !prevChord.notes[dominantVoiceWithAlt5].equalPitches(currentChord.notes[dominantVoiceWithAlt5]) &&
            !currentChord.notes[dominantVoiceWithAlt5].baseChordComponentEquals("3") &&
            !currentChord.harmonicFunction.containsDelayedBaseChordComponent("3");
    }
}

function SubdominantDominantCheckConnectionRule(details){

    ICheckConnectionRule.call(this, details);

    this.evaluateIncludingDeflections = function(connection){
        var currentChord = connection.current;
        var prevChord = connection.prev;
        if (specificConnectionRuleSD.isNotBroken(connection)
            && prevChord.harmonicFunction.degree + 1 === currentChord.harmonicFunction.degree){
            if(this.brokenVoicesMoveOppositeDirectionRule(currentChord, prevChord))
                return 40;
        }
        return 0;
    };

    this.brokenVoicesMoveOppositeDirectionRule = function(currentChord, prevChord){
        if(currentChord.bassNote.chordComponentEquals("1") && prevChord.bassNote.chordComponentEquals("1")) {
            for(var i = 1; i < 4; i++) {
                if (prevChord.notes[i].pitch - currentChord.notes[i].pitch < 0) {
                    return true;
                }
            }
        }
        return false;
    }
}
/*
        END OF SOFT RULES
 */

function Graph(layers, first, last) {
    this.first = first;
    this.last = last;
    this.layers = layers;
    //just for printing
    this.current_id = 0;

    this.getFirst = function (){
        return this.first;
    }

    this.getLast = function (){
        return this.last;
    }

    this.getNodes = function (){
        var allNodes = [];
        for(var i=0; i<this.layers.length; i++){
            for(var j=0; j<this.layers[i].nodeList.length; j++) {
                allNodes.push(this.layers[i].nodeList[j])
            }
        }
        allNodes.push(this.first);
        allNodes.push(this.last);
        return allNodes;
    }

    this.enumerateNodes = function () {

        this.first["id"] = -1;
        this.last["id"] = -2;
        for(var i=0; i<this.layers.length; i++){
            for(var j=0; j<this.layers[i].nodeList.length; j++){
                var currentNode = this.layers[i].nodeList[j];
                if(currentNode.id === undefined) {
                    currentNode.id = this.current_id;
                    this.current_id++;
                }
            }
        }
    }

    this.printEdges = function () {
        var printNodeInfo = function(currentNode, layerNumber){
            for(var k=0; k< currentNode.nextNeighbours.length; k++){
                // version for first exercise
                // console.log(currentNode.id + "+" + currentNode.content.shortString() + ","  + currentNode.nextNeighbours[k].node.id + "+" + currentNode.nextNeighbours[k].node.content.shortString() + "," + i)

                // version for soprano
                if(currentNode.content !== "first" && currentNode.nextNeighbours[k].node.content !== "last")
                // console.log(currentNode.id + currentNode.content.harmonicFunction.functionName + "," + currentNode.nextNeighbours[k].node.id + currentNode.nextNeighbours[k].node.content.harmonicFunction.functionName+ "," + layerNumber + "," + currentNode.nextNeighbours[k].weight)
                console.log(currentNode.id + currentNode.content.harmonicFunction.functionName + "_" +currentNode.content.harmonicFunction.degree +  "," + currentNode.nextNeighbours[k].node.id + currentNode.nextNeighbours[k].node.content.harmonicFunction.functionName+  "_"+ currentNode.nextNeighbours[k].node.content.harmonicFunction.degree +"," + layerNumber + "," + currentNode.nextNeighbours[k].weight)

                // default version
                // console.log(currentNode.id + "," + currentNode.nextNeighbours[k].node.id + "," + layerNumber + "," + currentNode.nextNeighbours[k].weight)
            }
        }

        printNodeInfo(this.first, 0);
        for(var i=0; i<this.layers.length; i++){
            for(var j=0; j<this.layers[i].nodeList.length; j++) {
                printNodeInfo(this.layers[i].nodeList[j], i+1)
            }
        }
    }

    this.getPossiblePathCount = function(){
        var n = 0;
        this.first.pp2 = 1
        for(var i=0; i<this.layers.length;i++){
            for(var j=0; j<this.layers[i].nodeList.length; j++) {
                var curr = this.layers[i].nodeList[j];
                curr.pp2 = 0
                for (var k = 0; k < curr.prevNodes.length; k++) {
                    curr.pp2 += curr.prevNodes[k].pp2;
                }
                if (i === this.layers.length -1) {
                    console.log(curr.pp2)
                    n += curr.pp2
                }
            }
        }
        return n;
    }
}

function GraphBuilder() {
    this.evaluator = undefined;
    this.generator = undefined;
    this.generatorInput = undefined;
    this.connectedLayers = undefined;

    this.withEvaluator = function (evaluator) {
        this.evaluator = evaluator;
    }

    this.withGenerator = function (generator) {
        this.generator = generator;
    }

    this.withInput = function (generatorInput) {
        this.generatorInput = generatorInput;
    }

    this.withConnectedLayers = function(layers){
        this.connectedLayers = layers;
    }

    this.withGraphTemplate = function (graphTemplate){
        this.graphTemplate = graphTemplate;
    }

    var removeUnexpectedNeighboursIfExist = function(graph) {
        for(var i = 0; i < graph.layers.length-1; i++){
            graph.layers[i].leaveOnlyNodesTo(graph.layers[i+1]);
        }

    }

    var generateLayers = function (graph, generator, inputs) {
        for (var i = 0; i < inputs.length; i++) {
            graph.layers.push(
                new Layer(inputs[i], generator)
            )
        }
    }

    var addEdges = function (graph, evaluator) {
        for (var i = 0; i < graph.layers.length - 1; i++) {
            graph.layers[i].connectWith(graph.layers[i+1], evaluator, i===0, true)
        }
    }

    var addFirstAndLast = function(graph) {
        graph.first = new Node("first");
        for(var i=0; i<graph.layers[0].nodeList.length; i++){
            graph.first.addNextNeighbour(new NeighbourNode(graph.layers[0].nodeList[i], 0))
        }

        graph.last = new Node("last");
        var lastLayerIdx = graph.layers.length - 1;
        for(var i=0; i<graph.layers[lastLayerIdx].nodeList.length; i++){
            graph.layers[lastLayerIdx].nodeList[i].addNextNeighbour(new NeighbourNode(graph.last, 0))
        }
    }

    var removeUnreachableNodes = function (graph) {
        // for (var i = 0; i < graph.layers.length; i++) {
        //     graph.layers[i].removeUnreachableNodes()
        // }
        graph.layers[graph.layers.length-1].removeUnreachableNodes()
    }

    var removeUselessNodes = function (graph) {
        for (var i = graph.layers.length - 1; i >= 0; i--) {
            graph.layers[i].removeUselessNodes();
        }
    }

    var makeAllNodesHavingSinglePrevContent = function (graph){
        for (var i = graph.layers.length - 1; i >= 0; i--) {

            for(var j=0; j<graph.layers[i].nodeList.length; j++){
                var currentNode = graph.layers[i].nodeList[j];
                if (currentNode.prevNodes.length > 1) {
                    var duplicates = [];
                    for (var k = 0; k < currentNode.prevNodes.length - 1; k++) {
                        duplicates.push(currentNode.duplicate());
                    }
                    var prevNodes = currentNode.prevNodes.slice();
                    currentNode.removeLeftConnections();

                    prevNodes[0].addNextNeighbour(new NeighbourNode(currentNode))
                    for (k = 1; k < duplicates.length + 1; k++) {
                        if(i === 0) prevNodes[k].addNextNeighbour(new NeighbourNode(duplicates[k - 1], 0));
                        else prevNodes[k].addNextNeighbour(new NeighbourNode(duplicates[k - 1]));
                        graph.layers[i].nodeList.push(duplicates[k - 1]);
                    }
                }
            }
        }
    }

    var setEdgeWeights = function(graph, evaluator){
        for(var i=0; i<graph.layers.length - 1; i++){
            for(var j=0; j<graph.layers[i].nodeList.length; j++){
                var currentNode = graph.layers[i].nodeList[j];

                var prevNodeContent = i === 0 ? undefined : ( evaluator.connectionSize !== 3 ? undefined : currentNode.getPrevContentIfSingle());

                for(var k=0; k<currentNode.nextNeighbours.length; k++){
                    var neighbour = currentNode.nextNeighbours[k];
                    var connection = new Connection(neighbour.node.content, currentNode.content, prevNodeContent)
                    //todo Optymalizacja wydzielić zestaw ruli obliczanych dla connection size2 i size3, te pierwsze liczyć przed transformacją grafu
                    var w = evaluator.evaluateSoftRules(connection);
                    neighbour.setWeight(w);
                }
            }
        }

    }

    this.buildWithoutWeights = function() {
        var resultGraph = new Graph([]);                              d++; WorkerScript.sendMessage({ 'type' : "progress_notification", 'progress': d/D });
        generateLayers(resultGraph, this.generator, this.generatorInput);   d++; WorkerScript.sendMessage({ 'type' : "progress_notification", 'progress': d/D });
        addEdges(resultGraph, this.evaluator);                              d++; WorkerScript.sendMessage({ 'type' : "progress_notification", 'progress': d/D });
        addFirstAndLast(resultGraph);

        removeUselessNodes(resultGraph);                                    d++; WorkerScript.sendMessage({ 'type' : "progress_notification", 'progress': d/D });
        return resultGraph;
    }

    this.build = function () {
        if(isDefined(this.connectedLayers)){
            var resultGraph = new Graph(this.connectedLayers);
            addFirstAndLast(resultGraph);
            removeUnexpectedNeighboursIfExist(resultGraph);
            removeUnreachableNodes(resultGraph);
            removeUselessNodes(resultGraph);
        }
        else if(isDefined(this.graphTemplate)){
            var resultGraph = this.graphTemplate;
        }
        else{
            var resultGraph = this.buildWithoutWeights();
        }

        if (this.evaluator.connectionSize === 3){
            makeAllNodesHavingSinglePrevContent(resultGraph);
        }
        setEdgeWeights(resultGraph, this.evaluator);

        return resultGraph;
    }
}

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
        sopranoExercise.notes.map(function (n) { return noteReconstruct(n) }),
        sopranoExercise.durations,
        sopranoExercise.measures.map(function (m) { return measureReconstruct(m) }),
        sopranoExercise.possibleFunctionsList.map(function (hf) { return harmonicFunctionReconstruct(hf)})
    )
}

function Generator(){
    this.generate = function(input){
        throw new UnexpectedInternalError("Default generate function was called");
    }
}

function Connection(current, prev, prevPrev){
    var undefinedNodeContents = ["first", "last"];

    this.current = contains(undefinedNodeContents, current) ? undefined : current;
    this.prev = contains(undefinedNodeContents, prev) ? undefined : prev;
    this.prevPrev = contains(undefinedNodeContents, prevPrev) ? undefined : prevPrev;

    this.equals = function(other){
        return (!this.current && !other.current || (this.current ? this.current.equals(other.current) : false)) &&
            (!this.prev && !other.prev || (this.prev ? this.prev.equals(other.prev) : false))  &&
            (!this.prevPrev && !other.prevPrev || (this.prevPrev ? this.prevPrev.equals(other.prevPrev) : false))
    }
}

function Evaluator(connectionSize){
    this.connectionSize = connectionSize;
    this.softRules = [];
    this.hardRules = [];
    this.evaluateHardRules = function(connection){
        for(var i = 0; i < this.hardRules.length; i++){
            if(this.hardRules[i].isBroken(connection))
                return false;
        }
        return true;
    }
    this.evaluateSoftRules = function(connection){
        var result = 0;
        for(var i = 0; i < this.softRules.length; i++){
            result += this.softRules[i].evaluate(connection);
        }
        return result;
    }
    this.initializeBrokenRulesCounter = function(){
        var rulesList = [];
        var rulesDetails = [];
        for(var i = 0; i < this.hardRules.length; i++){
            rulesList.push(this.hardRules[i].name)
            rulesDetails.push(this.hardRules[i].details)
        }
        this.brokenRulesCounter = new BrokenRulesCounter(rulesList, rulesDetails)
    }
    this.evaluateAllRulesWithCounter = function(connection){
        if(this.brokenRulesCounter === undefined)
            return
        var result = 0;
        var oneRuleBroken = false;
        for(var i = 0; i < this.hardRules.length; i++){
            if(this.hardRules[i].isBroken(connection)) {
                this.brokenRulesCounter.increaseCounter(this.hardRules[i].name)
                oneRuleBroken = true;
            }
        }
        return oneRuleBroken ? -1 : result
    }
    this.getBrokenRulesCounter = function(){
        return this.brokenRulesCounter;
    }
}

function IRule(details, evaluationRatio){
    this.evaluate = function(connection){
        throw new UnexpectedInternalError("IRule default evaluate method was called");
    };

    if(isDefined(evaluationRatio) && (evaluationRatio > 1 || evaluationRatio < 0)){
        throw new UnexpectedInternalError("Incorrect evaluation ratio in Rule. Should be in [0,1].")
    };

    this.name = this.constructor.name;
    this.details = details;
    this.evaluationRatio = isDefined(evaluationRatio)? evaluationRatio : 1;

    this.isBroken = function(connection){
        var evaluationResult = this.evaluate(connection);
        return evaluationResult !== 0 && evaluationResult !== true;
    };

    this.isNotBroken = function(connection){
        return !this.isBroken(connection);
    }
}

function isOctaveOrPrime(note1, note2){
    return note1.baseNote === note2.baseNote;
}

function isFive(note1, note2){
    //todo co ze swobodnym rozwiazaniem septymy?
    if(note1.pitch > note2.pitch)
        return contains([4, -3],  note1.baseNote - note2.baseNote);
    else
        return contains([-4, 3],  note1.baseNote - note2.baseNote);
}

function isChromaticAlteration(note1, note2){
    return note1.baseNote === note2.baseNote && contains([1,11], mod(note1.pitch - note2.pitch,12));
}

function pitchOffsetBetween(note1, note2){
    return abs(note1.pitch - note2.pitch)
}

function getBaseDistance(firstBaseNote, secondBaseNote){
    var i = 0;
    while(firstBaseNote!==secondBaseNote) {
        firstBaseNote = mod((firstBaseNote+1), 7);
        i++;
    }
    return i
}

function isAlteredInterval(note1, note2){
    var halfToneDist = note1.pitch-note2.pitch;
    var firstBase = note1.baseNote;
    var secondBase = note2.baseNote;
    var baseDistance = -1;
    if(halfToneDist>0){
        baseDistance = getBaseDistance(secondBase, firstBase);
    } else{
        baseDistance = getBaseDistance(firstBase, secondBase);
        if(halfToneDist === 0 && baseDistance !== 1) baseDistance = 1;
        halfToneDist = -halfToneDist
    }
    if(halfToneDist > 12){
        if(mod(halfToneDist, 12) === 0) halfToneDist = 12;
        else halfToneDist = mod(halfToneDist, 12);
    }
    var alteredIntervals = {3:1, 5:2, 6:3, 8:4, 10:5, 12:6};
    return alteredIntervals[halfToneDist] === baseDistance
}

function getThirdMode(key, baseNote) {

    var pitchesToUse = contains(possible_keys_major, key) ?
        new MajorScale("C").pitches : new MinorScale("c").pitches

    var difference = abs(pitchesToUse[mod(baseNote + 2, 7)] - pitchesToUse[baseNote])

    return (difference === 4 || difference === 8) ? MODE.MAJOR : MODE.MINOR
}

function toBaseNote(scaleBaseNote, harmonicFunction, chordComponent) {
    var interval = chordComponent.baseComponent;

    var intervalToBaseNote = {
        '1': 0,
        '2': 1,
        '3': 2,
        '4': 3,
        '5': 4,
        '6': 5,
        '7': 6,
        '8': 7,
        '9': 8
    }

    return mod((scaleBaseNote + (harmonicFunction.degree - 1) + intervalToBaseNote[interval]), 7);
}

var DEBUG = false;

function check_figured_bass_symbols(symbols){
    var figured_bass_symbols = /^((([0-9][bh#]?(\-[0-9][bh#]?)?)|([bh#]))(\n(([0-9][bh#]?(\-[0-9][bh#]?)?)|([bh#])))*)$/gi;
    return figured_bass_symbols.test(symbols);
}

function parseChord(string, withoutFirstChar, withoutLastChar) {
    if (withoutFirstChar) string = string.substring(1, string.length)
    if (withoutLastChar) string = string.substring(0, string.length - 1)

    var i = 0
    while (i < string.length && string[i] !== '{') {
        i++
    }
    var chord_type = string.substring(0, i)
    var arguments = string.substring(i, string.length)

    if (arguments === null || arguments.length < 2 || chord_type.length > 2) {
        return undefined
    }
    var mode;
    if(chord_type.length === 2 && chord_type[1] === "o") mode = MODE.MINOR;
    var arguments_json = JSON.parse(arguments);
    arguments_json["functionName"] = chord_type[0];
    arguments_json["mode"] = mode;
    return new HarmonicFunction2(arguments_json)
}

function getKeyFromPitchBasenoteAndModeOrThrowError(pitch, basenote, mode) {
    var mapKey = pitch.toString() + "," + basenote.toString() + "," + mode
    var key = keyFromPitchBasenoteAndMode[mapKey]
    if (key === undefined) {
        throw new UnexpectedInternalError("Could not find key for given pitch, basenote and mode",
            "Pitch: " + pitch + " Basenote: " + basenote + " Mode: " + mode)
    } else {
        return key
    }
}

function calculateKey(key, deflectionTargetChord) {

    var keyToUse = key
    if (deflectionTargetChord.key !== undefined) {
        keyToUse = deflectionTargetChord.key
    }

    var pitchesToUse = contains(possible_keys_major, keyToUse) ?
        new MajorScale("C").pitches : new MinorScale("c").pitches

    var keyPitch = keyStrPitch[keyToUse] + pitchesToUse[deflectionTargetChord.degree - 1]
    keyPitch = keyPitch >= 72 ? keyPitch - 12 : keyPitch

    var keyBaseNote = mod(keyStrBase[keyToUse] + deflectionTargetChord.degree - 1, 7)
    if(deflectionTargetChord.down) {
        keyPitch--
        if(keyPitch < 60)
            keyPitch += 12
    }
    var modeToUse = getThirdMode(key, deflectionTargetChord.degree - 1)

    if(deflectionTargetChord.down)
        modeToUse = MODE.MAJOR

    return getKeyFromPitchBasenoteAndModeOrThrowError(keyPitch, keyBaseNote, modeToUse)
}

function getSpecificChord(measures, i) {
    var currentChordNumber = 0
    for (var a = 0; a < measures.length; a++) {
        for (var b = 0; b < measures[a].length; b++) {
            if (currentChordNumber === i) {
                return measures[a][b]
            } else {
                currentChordNumber++
            }
        }
    }
    return undefined
}

function applyKeyAndModeToSpecificChord(measures, key, mode, i, isRelatedBackwards) {
    var currentChordNumber = 0
    for (var a = 0; a < measures.length; a++) {
        for (var b = 0; b < measures[a].length; b++) {
            if (currentChordNumber === i) {
                measures[a][b].key = key
                if (DEBUG) log("mode")
                measures[a][b].mode = measures[a][b].functionName === FUNCTION_NAMES.DOMINANT ? MODE.MAJOR : measures[a][b].mode
                if (DEBUG) log("mode", measures[a][b].mode)
                measures[a][b].isRelatedBackwards = isRelatedBackwards
                if (DEBUG) log("isRelatedBackwards", measures[a][b].isRelatedBackwards)
                return
            } else {
                currentChordNumber++
            }
        }
    }
}

function applyKeyToChords(measures, beginning, end, key, deflectionType) {
    var modeToApply = getModeFromKey(key)

    for (var i = beginning; i <= end; i++) {
        if (DEBUG) log(i)
        applyKeyAndModeToSpecificChord(measures, key, modeToApply, i, deflectionType === DEFLECTION_TYPE.BACKWARDS)
    }
}



function handleDeflections(measures, key, deflections){

    if (DEBUG) log("Handling deflections")
    if (DEBUG) log(JSON.stringify(deflections))

    var nextChordAfterDeflection = undefined
    var prevChordBeforeDeflection = undefined
    var elipseChord = undefined
    var keyForDeflection = undefined

    for (var i = 0; i < deflections.length; ++i) {
        if (DEBUG) log(JSON.stringify(deflections[i]))
        if(deflections[i][2] === DEFLECTION_TYPE.BACKWARDS){
            prevChordBeforeDeflection = getSpecificChord(measures, deflections[i][0] - 1)
            if (DEBUG) log("prevChordBeforeDeflection", prevChordBeforeDeflection)
            if (prevChordBeforeDeflection === undefined) {
                throw new HarmonicFunctionsParserError("Backward deflection cannot be the first chord")
            }
            keyForDeflection = calculateKey(key, prevChordBeforeDeflection)
            if (DEBUG) log("keyForDeflection", keyForDeflection)
            applyKeyToChords(measures, deflections[i][0], deflections[i][1], keyForDeflection, DEFLECTION_TYPE.BACKWARDS)
        }
        if(deflections[i][2] === DEFLECTION_TYPE.ELIPSE){
            if (DEBUG) log(JSON.stringify(deflections[i]))
            elipseChord = getSpecificChord(measures, deflections[i][1])
            if (elipseChord === undefined) {
                throw new HarmonicFunctionsParserError("Elipse cannot be empty.")
            }
            if (DEBUG) log("elipseChord", elipseChord)
            keyForDeflection = calculateKey(key, elipseChord)
            elipseChord.functionName = FUNCTION_NAMES.TONIC
            elipseChord.degree = 6
            if (DEBUG) log("keyForDeflection", keyForDeflection)
            applyKeyToChords(measures, deflections[i][0], deflections[i][1], keyForDeflection, DEFLECTION_TYPE.ELIPSE)
        }
    }

    for (var i = deflections.length - 1; i >= 0; --i) {
        if (DEBUG) log(JSON.stringify(deflections[i]))
        if(deflections[i][2] === DEFLECTION_TYPE.CLASSIC){
            nextChordAfterDeflection = getSpecificChord(measures, deflections[i][1] + 1)
            if (DEBUG) log("nextChordAfterDeflection", nextChordAfterDeflection)
            if (nextChordAfterDeflection === undefined) {
                throw new HarmonicFunctionsParserError("Deflection cannot be the last chord")
            }
            if(nextChordAfterDeflection.isRelatedBackwards){
                throw new HarmonicFunctionsParserError("Backward deflection could not be after forward deflection.", JSON.stringify(nextChordAfterDeflection))
            }
            keyForDeflection = calculateKey(key, nextChordAfterDeflection)
            if (DEBUG) log("keyForDeflection", keyForDeflection)
            applyKeyToChords(measures, deflections[i][0], deflections[i][1], keyForDeflection, DEFLECTION_TYPE.CLASSIC)
        }
    }
}
/*
        "delay" : delay,
*/

function validateSymbol(symbol) {
    return /^[1-9][<>]?$/.test(symbol)
}

function isIntegerString(symbol) {
    return /^[1-9]$/.test(symbol)
}


function translateContent(content){
    var subcontents = content.split("/");
    for(var i = 0; i < subcontents.length; i++){
        if(subcontents[i].length === 0)
            continue;
        var subcontentSplitted = subcontents[i].split(":");
        if(subcontentSplitted.length > 2) {
                throw new HarmonicFunctionsParserError("Invalid number of \":\"", subcontents[i]);
        }
        var key = subcontentSplitted[0];
        var value = subcontentSplitted[1];
        subcontents[i] = "\""+key+"\":";
        switch(key){
            case "position":
                if (value === undefined || value.length === 0) {
                    throw new HarmonicFunctionsParserError("\"position\", if specified, cannot be empty");
                }
                if (!validateSymbol(value)) {
                    throw new HarmonicFunctionsParserError("\"position\" value is invalid.", value);
                }
                subcontents[i] += "\""+value+"\"";
                break;
            case "revolution":
                if (value === undefined || value.length === 0) {
                    throw new HarmonicFunctionsParserError("\"revolution\", if specified, cannot be empty");
                }
                if (!validateSymbol(value)) {
                    throw new HarmonicFunctionsParserError("\"revolution\" value is invalid.", value);
                }
                subcontents[i] += "\""+value+"\"";
                break;
            case "system":
                if (value === undefined || value.length === 0) {
                    throw new HarmonicFunctionsParserError("\"system\", if specified, cannot be empty");
                }
                subcontents[i] += "\""+value+"\"";
                break;
            case "isRelatedBackwards":
                if(isDefined(value))
                    throw new HarmonicFunctionsParserError("Property \"isRelatedBackwards\" should not have any value.", "Found: " + value);
                subcontents[i] += "true";
                break;
            case "down":
                if(isDefined(value))
                    throw new HarmonicFunctionsParserError("Property \"down\" should not have any value.", "Found: " + value);
                subcontents[i] += "true";
                break;
            case "degree":
                if (value === undefined || value.length === 0) {
                    throw new HarmonicFunctionsParserError("\"degree\", if specified, cannot be empty");
                }
                if (!isIntegerString(value)) {
                    throw new HarmonicFunctionsParserError("\"degree\" value should be integer.", "Found: " + value);
                }
                subcontents[i] += value;
                break;
            case "extra":
                if (value === undefined || value.length === 0) {
                    throw new HarmonicFunctionsParserError("\"extra\", if specified, cannot be empty");
                }
                var values = value.split(",");
                for(var j = 0; j < values.length; j++){
                    if (values[j] === undefined || values[j].length === 0) {
                        throw new HarmonicFunctionsParserError("One \"extra\" value is empty.", value);
                    }
                    if (!validateSymbol(values[j])) {
                        throw new HarmonicFunctionsParserError("\"extra\" value is invalid.", values[j]);
                    }
                    values[j] = "\""+values[j]+"\"";
                }
                subcontents[i] += "["+values.join(",")+"]";
                break;
            case "omit":
                if (value === undefined || value.length === 0) {
                    throw new HarmonicFunctionsParserError("\"omit\", if specified, cannot be empty");
                }
                var values = value.split(",");
                for(var j = 0; j < values.length; j++){
                    if (values[j] === undefined || values[j].length === 0) {
                        throw new HarmonicFunctionsParserError("One \"omit\" value is empty.", value);
                    }
                    if (!validateSymbol(values[j])) {
                        throw new HarmonicFunctionsParserError("\"omit\" value is invalid.", values[j]);
                    }
                    values[j] = "\""+values[j]+"\"";
                }
                subcontents[i] += "["+values.join(",")+"]";
                break;
            case "delay":
                if (value === undefined || value.length === 0) {
                    throw new HarmonicFunctionsParserError("\"delay\", if specified, cannot be empty");
                }
                var values = value.split(",");
                var delay;
                for(var j = 0; j < values.length; j++){
                    if (values[j] === undefined || values[j].length === 0) {
                        throw new HarmonicFunctionsParserError("Empty delay.", values);
                    }
                    delay = values[j].split("-");
                    if(delay.length !== 2)
                        throw new HarmonicFunctionsParserError("Delay should match pattern \"X-Y\".", "Found: "+values[j]);
                    if (delay[0] === undefined || delay[0].length === 0) {
                        throw new HarmonicFunctionsParserError("Empty left side of delay.", "Invalid delay: " + values[j]);
                    }
                    if (delay[1] === undefined || delay[1].length === 0) {
                        throw new HarmonicFunctionsParserError("Empty right side of delay.", "Invalid delay: " + values[j]);
                    }
                    if (!validateSymbol(delay[0])) {
                        throw new HarmonicFunctionsParserError("Left \"delay\" value is invalid.", values[j]);
                    }
                    if (!validateSymbol(delay[1])) {
                        throw new HarmonicFunctionsParserError("Right \"delay\" value is invalid.", values[j]);
                    }

                    delay[0] = "\""+delay[0]+"\"";
                    delay[1] = "\""+delay[1]+"\"";
                    values[j] = "["+delay.join(",")+"]"
                }
                subcontents[i] += "["+values.join(",")+"]";
                break;
            default:
                throw new HarmonicFunctionsParserError("Invalid property name. Allowed: " +
                    "\"position\", \"revolution\", \"system\", \"degree\", " +
                    "\"extra\", \"omit\", \"delay\",\"down\", \"isRelatedBackwards\".", "Found \"" + key + "\"");
        }
    }
    return subcontents.join(",");
}

function translateHarmonicFunction(harmonicFunctionString){
    if(!(/[\(\[]?([TSD])o?\{.*\}[\)\]]?/ig).test(harmonicFunctionString))
        throw new HarmonicFunctionsParserError("Wrong harmonic structure. Check name, curly parenthesis and deflection parenthesis.", harmonicFunctionString);
    var result = "";
    var i = 0;
    while(harmonicFunctionString[i] !== "{"){
        result += harmonicFunctionString[i];
        i++;
    }
    result += "{";
    result += translateContent(harmonicFunctionString.substring(i+1, harmonicFunctionString.lastIndexOf("}")));
    result += "}";
    if(harmonicFunctionString.lastIndexOf("}") === harmonicFunctionString.length - 2)
        result += harmonicFunctionString[harmonicFunctionString.length-1];
    return result;
}

function translateToOldNotation(lines) {
    for(var i = 0; i < lines.length; i++){
        if(!lines[i] || lines[i].startsWith("//")) continue;
        lines[i] = lines[i].replace(/\r/g,"");
        if(lines[i].endsWith(";")){
            lines[i] = lines[i].substring(0, lines[i].length-1);
        }
        var harmonicFunctionString = lines[i].split(";")
        for(var j = 0; j < harmonicFunctionString.length; j++){
            try {
                harmonicFunctionString[j] = translateHarmonicFunction(harmonicFunctionString[j]);
            } catch(e){
                throw new HarmonicFunctionsParserError(e.message + " " + e.details,
                    "at "+(i+1)+" measure, "+(j+1)+" harmonic function: "+harmonicFunctionString[j]);
            }
        }
        lines[i] = harmonicFunctionString.join(";");
    }
    return lines;
}

function parse(input) {
    input = input.replace(/[ \t\r]+/g,"")

    if (input === undefined || input === "") {
        throw new HarmonicFunctionsParserError("Exercise is empty")
    }

    var lines = input.split("\n")

    if (lines === undefined || lines[0] === undefined || lines[0] === ""
        || lines[1] === undefined  || lines[1] === ""
        || lines[2] === undefined || lines[2] === "") {
        throw new HarmonicFunctionsParserError("Exercise is empty")
    }

    var isInNewNotation = false;
    if(lines[0] === "dev") {
        lines = lines.splice(1, lines.length);
    } else {
        isInNewNotation = true;
    }
    var key = lines[0]

    var mode = null

    if (contains(possible_keys_major, key)) {
        mode = MODE.MAJOR
    } else if (contains(possible_keys_minor, key)) {
        mode = MODE.MINOR
    } else {
        throw new HarmonicFunctionsParserError("Unrecognized key", key)
    }

    var metre1 = lines[1]
    metre1 = metre1.replace(/\s/g, '')
    var metre

    if (metre1 === 'C') {
        metre = [4,4]
    } else {
        metre = [parseInt(metre1.split('/')[0]),
                parseInt(metre1.split('/')[1])]

        if (lines[1] === undefined || lines[1] === ""
            || metre[0] === undefined || metre[0] <= 0 || isNaN(metre[0])
            || !(/^[0-9]+$/.test(metre1.split('/')[0])) || !(/^[0-9]+$/.test(metre1.split('/')[1]))
            || metre[1] === undefined || isNaN(metre[1]) || !contains([1, 2, 4, 8, 16 ,32 ,64], metre[1])) {
            throw new HarmonicFunctionsParserError("Invalid metre", lines[1])
        }
    }

    lines = lines.splice(2, lines.length);
    if(isInNewNotation)
        lines = translateToOldNotation(lines);
    var measures = []

    var insideDeflection = false
    var deflections = []
    var deflectionBeginning = undefined
    var deflectionType = undefined
    var chordNumber = 0

    var dropFirstChar = false
    var dropLastChar = false

    for (var i = 0; i < lines.length; i++) {
        if(!lines[i] || lines[i].startsWith("//")) continue
        var chords = lines[i].split(";")
        var chords_parsed = []
        for (var j = 0; j < chords.length; j++) {
            chords[j] = chords[j].trim()
            dropFirstChar = false
            dropLastChar = false
            if (DEBUG) log("Current chord: ", JSON.stringify(chords[j]))

            if(chords[j][0] === '['){
                if(insideDeflection){
                    throw new HarmonicFunctionsParserError("Elipse cannot be inside deflection.", chords[j])
                } else if(j === 0){
                    if(!chords[j].endsWith(']')){
                        throw new HarmonicFunctionsParserError("There could be only one chord in elipse.", chords[j]);
                    }
                    var parsedElipse = parseChord(chords[j], true, true);
                    chords_parsed.push(parsedElipse);
                    deflectionType = DEFLECTION_TYPE.ELIPSE;
                    if(deflections[deflections.length - 1][1] !== chordNumber - 1){
                        throw new HarmonicFunctionsParserError("Elipse must be preceded by deflection", chords[j])
                    }
                    deflections[deflections.length - 1][1] = chordNumber
                    deflections[deflections.length - 1][2] = deflectionType
                    chordNumber ++
                    continue;
                } else {
                    throw new HarmonicFunctionsParserError("Elipse must be preceded by deflection", chords[j])
                }
            }

            if (chords[j][0] === '(') {
                if(chords[j][1] === '['){
                    throw new HarmonicFunctionsParserError("Elipse cannot be inside deflection.", chords[j])
                }
                if (insideDeflection) {
                    throw new HarmonicFunctionsParserError("Deflection cannot be inside another deflection.", chords[j])
                }
                if (DEBUG) log("Inside deflection")
                deflectionBeginning = chordNumber
                insideDeflection = true
                dropFirstChar = true
            }

            if (chords[j][chords[j].length - 1] === ')') {
                if (!insideDeflection) {
                    throw new HarmonicFunctionsParserError("Unexpected end of deflection:", chords[j])
                }
                if (DEBUG) log("Exiting deflection")
                insideDeflection = false
                dropLastChar = true
            }

            var parsedChord = parseChord(chords[j], dropFirstChar, dropLastChar)
            chords_parsed.push(parsedChord)
            if(chords[j][0] === '('){
                if(parsedChord === undefined) {
                    throw new HarmonicFunctionsParserError("Deflection cannot be empty.", chords[j])
                }
                deflectionType = parsedChord.isRelatedBackwards ? DEFLECTION_TYPE.BACKWARDS :  DEFLECTION_TYPE.CLASSIC
            }
            if(chords[j][chords[j].length - 1] === ')'){
                if(j < chords.length-1 && chords[j+1].startsWith("[")){
                    j++;
                    if(!chords[j].endsWith(']')){
                        throw new HarmonicFunctionsParserError("There could be only one chord in elipse.", chords[j]);
                    }
                    var parsedElipse = parseChord(chords[j], true, true);
                    chords_parsed.push(parsedElipse);
                    deflectionType = DEFLECTION_TYPE.ELIPSE;
                    chordNumber++;
                }
                deflections.push([deflectionBeginning, chordNumber, deflectionType])
            }
            chordNumber++
        }
        measures.push(chords_parsed)
    }

    if (insideDeflection) {
        throw new HarmonicFunctionsParserError("There is unclosed deflection")
    }

    if (DEBUG) log("Parsed measures", JSON.stringify(measures))

    if (deflections.length !== 0){
        handleDeflections(measures, key, deflections)
        if (DEBUG) log("Parsed measures after handling deflections", JSON.stringify(measures))
    }

    return new Exercise(key, metre, mode, measures)

}


var DEBUG = false;

function ExerciseCorrector(exercise, harmonicFunctions, isDefinedBassLine, sopranoLine){
    this.exercise = exercise;
    this.harmonicFunctions = harmonicFunctions;
    this.isDefinedBassLine = isDefinedBassLine;
    this.sopranoLine = sopranoLine;

    this._makeChordsIncompleteToAvoidConcurrent5 = function(startIndex, endIndex) {
        var changeCurrentChord = (endIndex - startIndex) % 2 === 0;
        if(changeCurrentChord && startIndex > 0 &&
            containsChordComponent(this.harmonicFunctions[startIndex - 1].omit, "5") && !containsBaseChordComponent(this.harmonicFunctions[startIndex - 1].extra, "5")){
            changeCurrentChord = !changeCurrentChord;
        }
        for(var i=startIndex; i<endIndex; i++){
            if(changeCurrentChord){
                if(isDefined(this.harmonicFunctions[i].position) && this.harmonicFunctions[i].position === this.harmonicFunctions[i].getFifth()){
                    this.harmonicFunctions[i].revolution = this.harmonicFunctions[i].getThird();
                    //todo maybe it is wrong strategy
                    this.harmonicFunctions[i].omit.push(this.harmonicFunctions[i].getPrime());
                } else
                    this.harmonicFunctions[i].omit.push(this.harmonicFunctions[i].getFifth());
            }
            changeCurrentChord = !changeCurrentChord;
        }
    };

    this._handleChopinTonicConnection = function (chopinHarmonicFunction, tonicHarmonicFunction) {
        if(chopinHarmonicFunction.isChopin() && chopinHarmonicFunction.isInDominantRelation(tonicHarmonicFunction)){
            if(!containsChordComponent(tonicHarmonicFunction.omit,"5")){
                tonicHarmonicFunction.omit.push(tonicHarmonicFunction.cm.chordComponentFromString("5"));
            }
        }
    };

    this._handleDominantConnectionsWith7InBass = function(dominantHarmonicFunction, tonicHarmonicFunction) {
        if(isDefinedBassLine)
            return false;
        if(dominantHarmonicFunction.isInDominantRelation(tonicHarmonicFunction) &&
            dominantHarmonicFunction.revolution.baseComponent === "7" &&
            tonicHarmonicFunction.revolution.baseComponent === "1") {
            var key = tonicHarmonicFunction.key !== undefined ?
                tonicHarmonicFunction.key : this.exercise.key;
            var cm = tonicHarmonicFunction.cm;
            tonicHarmonicFunction.revolution =
                getThirdMode(key, tonicHarmonicFunction.degree-1) === MODE.MAJOR ?
                    cm.chordComponentFromString("3") : cm.chordComponentFromString("3>");
            return isDefined(tonicHarmonicFunction.delay) && tonicHarmonicFunction.delay.length > 0
        }
        if(dominantHarmonicFunction.isInDominantRelation(tonicHarmonicFunction) &&
            tonicHarmonicFunction.revolution.baseComponent === "7" &&
            dominantHarmonicFunction.revolution.baseComponent === "1") {
            var key = dominantHarmonicFunction.key !== undefined ?
                dominantHarmonicFunction.key : this.exercise.key;
            var cm = dominantHarmonicFunction.cm;
            dominantHarmonicFunction.revolution =
                getThirdMode(key, dominantHarmonicFunction.degree-1) === MODE.MAJOR ?
                    cm.chordComponentFromString("3") : cm.chordComponentFromString("3>");
            return false;
        }

        return false;
    };

    this.correctHarmonicFunctions = function() {
        var resultHarmonicFunctions = this.harmonicFunctions;
        var startIndexOfChain = -1, insideChain = false;
        for(var i=0; i<resultHarmonicFunctions.length;i++){
            if(i < resultHarmonicFunctions.length-1){
                if(this._handleDominantConnectionsWith7InBass(resultHarmonicFunctions[i], resultHarmonicFunctions[i+1])){
                    var hf = resultHarmonicFunctions[i+2];
                    var key = hf.key !== undefined ?
                        hf.key : this.exercise.key;
                    hf.revolution = getThirdMode(key, hf.degree-1) === MODE.MAJOR ?
                        hf.cm.chordComponentFromString("3") : hf.cm.chordComponentFromString("3>");
                }
                this._handleChopinTonicConnection(resultHarmonicFunctions[i], resultHarmonicFunctions[i+1]);
                if(resultHarmonicFunctions[i].isInDominantRelation(resultHarmonicFunctions[i+1]) &&
                    resultHarmonicFunctions[i].revolution.baseComponent === "1" &&
                    resultHarmonicFunctions[i+1].revolution.baseComponent === "1" &&
                    containsBaseChordComponent(resultHarmonicFunctions[i].extra, "7") &&
                    resultHarmonicFunctions[i].omit.length === 0 && resultHarmonicFunctions[i+1].omit.length === 0){
                    if(!insideChain){
                        startIndexOfChain = i;
                        insideChain = true;
                    }
                } else {
                    if(insideChain) {
                        insideChain = false;
                        this._makeChordsIncompleteToAvoidConcurrent5(startIndexOfChain, i+1);
                    }
                }
            } else {
                if(insideChain) {
                    insideChain = false;
                    this._makeChordsIncompleteToAvoidConcurrent5(startIndexOfChain, i+1);
                }
            }
        }
        return resultHarmonicFunctions;
    };
}

var cm = new ChordComponentManager();

function Note(pitch, baseNote, chordComponent, duration) {
    this.pitch = pitch
    this.baseNote = baseNote

    this.chordComponent = chordComponent
    this.duration = duration

    if(typeof chordComponent === 'string'){
        this.chordComponent = cm.chordComponentFromString(chordComponent);
    }

    this.toString = function () {
        if (this.pitch === undefined) return undefined;
        return "Pitch: " + this.pitch + " BaseNote: " + this.baseNote + " ChordComponent: " + this.chordComponent.toString();
    };

    this.isUpperThan = function(other){
        return this.pitch > other.pitch;
    }

    this.isLowerThan = function(other){
        return this.pitch < other.pitch;
    }

    this.chordComponentEquals = function(chordComponentString){
        return this.chordComponent.chordComponentString === chordComponentString;
    }

    this.baseChordComponentEquals = function(baseComponentString){
        return this.chordComponent.baseComponent === baseComponentString;
    }

    // other is of type Note
    this.equalPitches = function(other){
        return this.pitch === other.pitch;
    }

    this.equals = function(other){
        return this.pitch === other.pitch
            && this.baseNote === other.baseNote
            && this.chordComponent.equals(other.chordComponent);
    }

    this.equalsInOneOctave = function(other){
        return mod(this.pitch, 12) === mod(other.pitch, 12)
            && this.baseNote === other.baseNote
            && this.chordComponent.equals(other.chordComponent);
    }

}

function Measure(notes){
    this.notes = notes; // [Note]
}

function noteReconstruct(note){
    return new Note(note.pitch, note.baseNote, note.chordComponent.chordComponentString, note.duration)
}

function measureReconstruct(measure){
    var notes = [];
    for(var i=0; i<measure.notes.length; i++){
        notes.push(noteReconstruct(measure.notes[i]))
    }
    return new Measure(notes);
}

function SopranoGraph(layers, first, last, nestedFirst, nestedLast){
    Graph.call(this, layers, first, last);
    this.nestedFirst = nestedFirst;
    this.nestedLast = nestedLast;

    this.getFirst = function (){
        return this.nestedFirst;
    }

    this.getLast = function (){
        return this.nestedLast;
    }

    this.getNodes = function (){
        var allNodes = [];
        for(var i=0; i<this.layers.length; i++){
            for(var j=0; j<this.layers[i].nodeList.length; j++) {
                var currentNode = this.layers[i].nodeList[j];
                allNodes = allNodes.concat(currentNode.nestedLayer.nodeList);
            }
        }
        allNodes.push(this.nestedFirst);
        allNodes.push(this.nestedLast);
        return allNodes;
    }


    this.reduceToChordGraph = function (){
        if(this.getLast().distanceFromBegining === "infinity"){
            console.log("Shortest paths are not calculated properly " + this.getNodes().length);
        }

        var layers = [];
        var stack = [this.getLast()];
        while(stack.length !== 1 || stack[0] !== this.getFirst()){
            var edges = []
            var newStack = []
            for(var i=0; i<stack.length; i++){
                var currentNode = stack[i];
                for(var j=0; j<currentNode.prevsInShortestPath.length; j++){
                    edges.push([currentNode.prevsInShortestPath[j], currentNode]);
                    if(!contains(newStack, currentNode.prevsInShortestPath[j])) newStack.push(currentNode.prevsInShortestPath[j]);
                }
            }

            for(var i=0; i<stack.length; i++){
                stack[i].overridePrevNodes([]);
            }

            for(var i=0; i<newStack.length; i++){
                newStack[i].overrideNextNeighbours([]);
            }

            for(var i=0; i<edges.length; i++) {
                edges[i][0].addNextNeighbour(new NeighbourNode(edges[i][1]));
            }
            stack = newStack;
            var layer = new Layer();
            layer.nodeList = stack;
            layers.unshift(layer)
        }
        layers.splice(0,1)
        ;
        for(var i=0; i<this.getFirst().nextNeighbours.length; i++){
            this.getFirst().nextNeighbours[i].weight = 0
        }

        for(var i=0; i<this.getLast().prevNodes.length; i++){
            var currentNode = this.getLast().prevNodes[i];
            for(var j=0; j<currentNode.nextNeighbours.length; j++){
                if(currentNode.nextNeighbours[j].node === this.getLast()){
                    currentNode.nextNeighbours[j].weight = 0;
                }
            }
        }
        return new Graph(layers, this.getFirst(), this.getLast());
    }

    this.enumerateNodes = function() {
        this.nestedFirst.id = -1;
        this.nestedLast.id = -2;
        for(var i=0; i<this.layers.length; i++){
            for(var j=0; j<this.layers[i].nodeList.length; j++) {
                var currentLayer = this.layers[i].nodeList[j].nestedLayer;
                for(var k=0; k<currentLayer.nodeList.length; k++){
                    var currentNode = currentLayer.nodeList[k];
                    currentNode.id = this.current_id;
                    this.current_id++;
                }
            }
        }
    }

    this.printEdges = function() {
        for(var i=0; i<this.layers.length; i++){
            for(var j=0; j<this.layers[i].nodeList.length; j++) {
                var currentLayer = this.layers[i].nodeList[j].nestedLayer;
                for(var k=0; k<currentLayer.nodeList.length; k++){
                    var currentNode = currentLayer.nodeList[k];
                    for(var l=0; l<currentNode.nextNeighbours.length;l++){
                        console.log(currentNode.id + "," + currentNode.nextNeighbours[l].node.id + "," + (i + 1) + "," + currentNode.nextNeighbours[l].weight)
                        if(currentNode.nextNeighbours[l].node.id === undefined){
                            console.log(currentNode.nextNeighbours[l])
                        }
                    }
                }
            }
        }
        var currentNode = this.nestedFirst;
        for(var l=0; l<currentNode.nextNeighbours.length;l++){
            console.log(currentNode.id + "," + currentNode.nextNeighbours[l].node.id + "," + 0 + "," + currentNode.nextNeighbours[l].weight )
        }
    }
}


function Layer(generatorInput, generator) {

    this.nodeList =  generator === undefined ? undefined : generator.generate(generatorInput).map(function (x) {
        return new Node(x);
    })

    this.removeNode = function (node) {
        removeFrom(this.nodeList, node);

        node.removeConnections();
    }

    this.getPrevConnectionsCount = function () {
        var count = 0;
        for (var i=0; i<this.nodeList.length; i++){
            count += this.nodeList[i].prevNodes.length;
        }
        return count;
    }

    this.getNextConnnetionsCount = function () {
        var count = 0;
        for(var i =0; i<this.nodeList.length; i++){
            count += this.nodeList[i].nextNeighbours.length;
        }
        return count;
    }

    this.connectWith = function(other, evaluator, isFirstLayer, removeUnreachable){
        var nextNodes = other.nodeList;
        for (var i = 0; i < this.nodeList.length; i++) {
            var currentNode = this.nodeList[i];
            if(currentNode.havePrev() || isFirstLayer) {
                for (var k = 0; k < other.nodeList.length; k++) {
                    if (evaluator.evaluateHardRules(new Connection(nextNodes[k].content, currentNode.content))) {
                        currentNode.addNextNeighbour(new NeighbourNode(nextNodes[k]));
                    }
                }
            }
        }
        if(removeUnreachable) other.removeUnreachableNodes();
    }

    this.leaveOnlyNodesTo = function(other){
        for(var i=0; i < this.nodeList.length; i++) {
            var currentNode = this.nodeList[i];
            for(var j=0; j < currentNode.nextNeighbours.length; j++){
                var currentNeighbour = currentNode.nextNeighbours[j];
                if( ! contains(currentNeighbour.node, other.nodeList) ){
                    currentNode.removeNextNeighbour(currentNeighbour.node);
                    j--;
                }
            }
        }
    }

    this.removeUselessNodes = function () {
        for (var j = 0; j < this.nodeList.length; j++) {
            var currentNode = this.nodeList[j];
            if(!currentNode.haveNext()){
                this.removeNode(currentNode);
                j--;
            }
        }
    }

    this.removeUnreachableNodes = function () {
        for (var j = 0; j < this.nodeList.length; j++) {
            var currentNode = this.nodeList[j];
            if(!currentNode.havePrev()){
                this.removeNode(currentNode);
                j--;
            }
        }
    }

    this.map = function (func) {
        this.nodeList = this.nodeList.map(func);
    }

    this.isEmpty = function () {
        return this.nodeList.length === 0;
    }
}
function NeighbourNode(node, weight) {
    this.node = node;
    this.weight = weight;

    this.setWeight = function (weight) {
        this.weight = weight;
    }
}


function Node(content, nextNeighbours, prevNodes) {

    this.content = content;
    this.nextNeighbours = nextNeighbours === undefined ? [] : nextNeighbours;
    this.prevNodes = prevNodes === undefined ? [] : prevNodes;
    // this.pp2 = 0

    this.getPrevContentIfSingle = function () {
        var uniquePrevContents =  this.getUniquePrevContents();
        if(uniquePrevContents.length !== 1)
            throw new UnexpectedInternalError("Method not allowed in current state of node - there are "
                + this.getUniquePrevContents().length + " unique prev nodes contents instead of expected 1");

        return uniquePrevContents[0];
    }

    this.getUniquePrevContents = function () {
        var uniquePrevContents = []
        for (var i = 0; i < this.prevNodes.length; i++) {
            if (!contains(uniquePrevContents, this.prevNodes[i].content))
                uniquePrevContents.push(this.prevNodes[i].content)
        }
        return uniquePrevContents;
    }

    this.getUniquePrevContentsCount = function () {
        return this.getUniquePrevContents().length;
    }

    this.haveNext = function (){
        return this.nextNeighbours.length > 0;
    }

    this.havePrev = function () {
        return this.prevNodes.length > 0;
    }

    this.addNextNeighbour = function (neighbourNode) {
        this.nextNeighbours.push(neighbourNode);
        neighbourNode.node.prevNodes.push(this);
    }

    this.removeLeftConnections = function () {
        var prevNodes = this.prevNodes.slice();
        for(var i=0; i<prevNodes.length; i++){
            prevNodes[i].removeNextNeighbour(this)
        }
    }

    this.removeRightConnections = function () {
        while(this.nextNeighbours.length > 0){
            this.removeNextNeighbour(this.nextNeighbours[0].node)
        }
    }

    this.removeConnections = function () {
        this.removeLeftConnections();
        this.removeRightConnections();
    }

    //removes given node from neighbourList in this and this from prevNodes in given node
    this.removeNextNeighbour = function (node) {
        this.nextNeighbours = this.nextNeighbours.filter(function (neighbour) {
            return neighbour.node !== node;
        })
        removeFrom(node.prevNodes, this);
    }

    this.overridePrevNodes = function(newPrevNodes) {
        this.prevNodes = newPrevNodes;
    }

    this.overrideNextNeighbours = function(newNextNeighbours){
        this.nextNeighbours = newNextNeighbours;
    }

    this.duplicate = function(){
        var newNode = new Node(this.content);
        for(var i=0; i<this.nextNeighbours.length; i++){
            newNode.addNextNeighbour(new NeighbourNode(this.nextNeighbours[i].node, this.nextNeighbours[i].weight))
        }
        return newNode;
    }

}

var DEBUG = false;

function HarmonicFunction2(params, notValidate){
    // Properties:
    // functionName          "T", "S", "D"
    // degree               int
    // position             should be string f.e. "<7" or "7>" or just "7"
    // revolution           should be string f.e. "<6" or "6>" or just "6"
    // delay                delayed components list
    // extra                extra components list [] | ["9", "7>"]
    // omit                 omitted components list [] | ["1", "5"]
    // down                 true or false
    // system               "open" | "close" | undefined
    // mode                 "major" | "minor"
    // key                  string, f.e. "C#", "g#", "Ab"

    //preprocessing zadania wymagał użycia tego samego chord component managera dla danej HF, co w momencie jej inicjalizacji
    this.cm = new ChordComponentManager();
    var cm = this.cm;

    // *****CONSTUCTOR PART 1*****

    this.functionName = params["functionName"];
    this.degree = params["degree"] === undefined ? getDegreeFromFunctionName(this.functionName) : params["degree"];
    this.position = params["position"];
    this.revolution = params["revolution"] === undefined ? "1" : params["revolution"];
    this.delay = params["delay"] === undefined ? [] : params["delay"];
    this.extra = params["extra"] === undefined ? [] : params["extra"];
    this.omit = params["omit"] === undefined ? [] : params["omit"];
    this.down = params["down"] === undefined ? false : params["down"];
    this.system = params["system"];
    this.mode = params["mode"] === undefined ? MODE.MAJOR : params["mode"];
    this.key = params["key"];
    this.isRelatedBackwards = params["isRelatedBackwards"];

    // *****CONSTUCTOR PART 1 END*****

    function getDegreeFromFunctionName(functionName){
        return {"T":1, "S":4, "D":5}[functionName];
    }

    this.getPrime = function(){
        return cm.chordComponentFromString("1", this.down);
    }

    this.getThird = function(){
        if(this.down === true)
            return cm.chordComponentFromString("3", true);

        var scale = this.mode === MODE.MAJOR ? new MajorScale("X") : new MinorScale("X");
        var thirdPitch = mod(scale.pitches[mod(this.degree + 1, 7)] - scale.pitches[mod(this.degree - 1, 7)], 12);
        return cm.basicChordComponentFromPitch(thirdPitch, false);
    }

    this.getFifth = function (){
        if(this.down === true)
            return cm.chordComponentFromString("5", true);

        var scale = this.mode === MODE.MAJOR ? new MajorScale("X") : new MinorScale("X");
        var fifthPitch = mod(scale.pitches[mod(this.degree + 3, 7)] - scale.pitches[mod(this.degree - 1, 7)], 12);

        return cm.basicChordComponentFromPitch(fifthPitch, false);
    }

    this.getBasicChordComponents = function () {
        return [this.getPrime(), this.getThird(), this.getFifth()];
    };

    this.getBasicChordComponentStrings = function () {
        return [this.getPrime().chordComponentString, this.getThird().chordComponentString, this.getFifth().chordComponentString];
    }

    this.getChordComponentFromStringInThisHfContext = function(chordComponentString) {
        // console.log(chordComponentString);
        // console.log(this.getBasicChordComponents());
        if(contains(this.getBasicChordComponentStrings(), chordComponentString)){
            if(chordComponentString[0] === '1') return this.getPrime();
            if(chordComponentString[0] === '3') return this.getThird();
            if(chordComponentString[0] === '5') return this.getFifth();
        }
        return cm.chordComponentFromString(chordComponentString, this.down);
    }

    this.countChordComponents = function () {
        var chordComponentsCount = 3;
        chordComponentsCount += this.extra.length;
        chordComponentsCount -= this.omit.length;
        for(var i=0; i<this.delay.length; i++) {
            if (!contains(this.extra, this.delay[i][0])
                && (contains(this.omit, this.delay[i][1])
                || this.delay[i][1].baseComponent === "8")) chordComponentsCount += 1;
            if (contains(this.extra, this.delay[i][0])
                && !contains(this.omit, this.delay[i][1])
                && this.delay[i][1].baseComponent !== "8") chordComponentsCount -= 1;
        }
        return chordComponentsCount;
    };

    this.getPossibleToDouble = function () {
        var res = this.getBasicChordComponents();
        for (var i = 0; i < this.omit.length; i++)
            res.splice(res.indexOf(this.omit[i]), 1);
        return res;
    };

    this.isNeapolitan = function () {
        return this.degree === 2 && this.down
            && this.functionName === FUNCTION_NAMES.SUBDOMINANT && this.mode === MODE.MINOR
            && this.revolution.baseComponent === "3" && this.extra.length === 0
    };

    this.isChopin = function () {
        return this.functionName === FUNCTION_NAMES.DOMINANT
            && containsChordComponent(this.omit, "5")
            && contains(this.extra, cm.chordComponentFromString("7", this.down))
            && containsBaseChordComponent(this.extra, "6")
    };

    this.isTVIMinorDown = function () {
        return this.functionName === FUNCTION_NAMES.TONIC
            && this.degree === 6
            && this.down
            && this.mode === MODE.MINOR
    };

    this.isTIIIMinorDown = function () {
        return this.functionName === FUNCTION_NAMES.TONIC
            && this.degree === 3
            && this.down
            && this.mode === MODE.MINOR
    };


    this.containsDelayedChordComponent = function (cc) {
        for(var i = 0; i < this.delay.length; i++){
            if(this.delay[i][1] === cc)
                return true;
        }
        return false;
    };

    this.containsDelayedBaseChordComponent = function (cc) {
        for(var i = 0; i < this.delay.length; i++){
            if(this.delay[i][1].baseComponent === cc)
                return true;
        }
        return false;
    };

    this.isInSubdominantRelation = function (nextFunction) {
        if(this.key !== nextFunction.key && isDefined(this.key)){
            return contains([-4, 3], this.degree - 1);
        }
        if(this.key === nextFunction.key)
            return contains([-4,3], this.degree - nextFunction.degree);
        return false;
    };

    this.isInDominantRelation = function (nextFunction) {
        if(this.down !== nextFunction.down && this.key === nextFunction.key && !(this.functionName === FUNCTION_NAMES.TONIC
            && this.degree === 6
            && this.mode === MODE.MINOR && nextFunction.down)) {
            return false;
        }
        if(this.key !== nextFunction.key && isDefined(this.key)){
            return contains([4,-3], this.degree - 1);
        }
        if(this.key === nextFunction.key)
            return contains([4,-3], this.degree - nextFunction.degree);
        return false;
    };

    this.isInSecondRelation = function (nextFunction) {
        return nextFunction.degree - this.degree === 1;
    };

    this.hasMajorMode = function (){
        return this.mode === MODE.MAJOR;
    };

    this.hasMinorMode = function (){
        return this.mode === MODE.MINOR;
    };

    this.getArgsMap = function() {
        return {
            "functionName" : this.functionName,
            "degree" : this.degree,
            "position" : (this.position === undefined ? undefined : this.position.chordComponentString),
            "revolution" : this.revolution.chordComponentString,
            "down" : this.down,
            "system" : this.system,
            "mode" : this.mode,
            "omit" : this.omit.map(function (cc) { return cc.chordComponentString; }),
            "extra" : this.extra.map(function (cc) { return cc.chordComponentString; }),
            "key" : this.key,
            "isRelatedBackwards" : this.isRelatedBackwards
        }
    }

    this.getDelaysCopy = function() {
        var ret = []
        for (var a = 0; a < this.delay.length; a++) {
            ret.push([this.delay[a][0].chordComponentString, this.delay[a][1].chordComponentString])
        }
        return ret
    }

    this.getExtraString = function() {
        var ret = ""
        var delays = this.getDelaysCopy()
        var leftSideOfDelays = []

        for (var a = 0; a < delays.length; a++) {
            leftSideOfDelays.push(delays[a][0])
        }

        for (var a = 0; a < this.extra.length; a++) {
            if (!contains(leftSideOfDelays, this.extra[a].chordComponentString)) {
                if (a!== 0 && ret !== ""){
                    ret += ", "
                }
                ret += this.extra[a].chordComponentString
            }
        }
        return ret
    }

    this.getDelaysString = function() {
        var ret = ""
        for (var a = 0; a < this.delay.length; a++) {
            ret = ret + this.delay[a][0].chordComponentString + "-" + this.delay[a][1].chordComponentString
            if (a !== this.delay.length - 1) {
                ret += ", "
            }
        }
        return ret
    }

    this.getOmitString = function() {
        var ret = ""
        var delays = this.getDelaysCopy()
        var rightSideOfDelays = []

        for (var a = 0; a < delays.length; a++) {
            rightSideOfDelays.push(delays[a][1])
        }
        for (var a = 0; a < this.omit.length; a++) {
            if (!contains(rightSideOfDelays, this.omit[a].chordComponentString)) {
                if (a!== 0 && ret !== ""){
                    ret += ", "
                }
                ret += this.omit[a].chordComponentString
            }
        }
        return ret
    }

    this.getArgsMapWithDelays = function() {
        return {
            "functionName" : this.functionName,
            "degree" : this.degree,
            "position" : (this.position === undefined ? undefined : this.position.chordComponentString),
            "revolution" : this.revolution.chordComponentString,
            "down" : this.down,
            "system" : this.system,
            "mode" : this.mode,
            "omit" : this.omit.map(function (cc) { return cc.chordComponentString; }),
            "extra" : this.extra.map(function (cc) { return cc.chordComponentString; }),
            "key" : this.key,
            "delay" : this.getDelaysCopy(),
            "isRelatedBackwards" : this.isRelatedBackwards
        }
    }

    this.copy = function copy(){
        var args = this.getArgsMap();
        return new HarmonicFunction2(args, true);
    }

    this.equals = function (other) {
        return this.functionName === other.functionName
            && this.degree === other.degree
            && this.down === other.down
            && this.key === other.key
    };

    this.withPosition = function (position) {
        var functionWithPosition = this.copy();
        functionWithPosition.position = position;
        return functionWithPosition;
    };

    this.toString = function () {
        return "FunctionName: " + this.functionName + "\n" +
            "Degree: " + this.degree + " \n" +
            (this.position !== undefined ? "Position: " + this.position.chordComponentString + "\n" : "") +
            (this.revolution !== undefined ? "Revolution: " + this.revolution.chordComponentString + "\n" : "" ) +
            (this.delay.length !== 0 ? "Delay: " + this.getDelaysString()+ "\n" : "") +
            (this.extra.length !== 0 ? "Extra: " + this.getExtraString() + "\n" : "") +
            (this.omit.length !== 0 ? "Omit: " + this.getOmitString() + "\n" : "") +
            (this.down === true ? "Down: " + this.down + "\n" : "") +
            (this.system !== undefined ? "System: " + this.system + "\n"  : "") +
            (this.mode !== undefined ? "Mode: " + this.mode  + "\n" : "") +
            (this.key !== undefined ? "Key: " + this.key  + "\n" : "") +
            (this.isRelatedBackwards === true ? "Is related backwards" : "" )
    };

    this.getSimpleChordName = function() {
    //    functionName [moll] [delay] [deg] [down]
        var functionNameAdapter = { "T" : "A", "S" : "B", "D":"D", "same_as_prev" : "C"};
        var res = functionNameAdapter[this.functionName];

        if(this.mode === "minor") res += "moll";

        if(this.delay.length === 1){
            res += "delay" + this.delay[0][0].chordComponentString + "-" + this.delay[0][1].chordComponentString;
        }

        if(this.delay.length === 2){
            res += "delay" + this.delay[0][0].chordComponentString + this.delay[1][0].chordComponentString
                     + "-" + this.delay[0][1].chordComponentString + this.delay[1][1].chordComponentString;
        }

        var degreeAdapter = {1: "I", 2:"II", 3:"III", 4:"IV", 5:"V", 6:"VI", 7:"VII"};

        if(this.down) {
            res += "down";
            if(this.degree === 1 || this.degree === 4 || this.degree === 5)
            res += "deg" + degreeAdapter[this.degree]
        }

        if(this.degree !== undefined && this.degree !== 1 && this.degree !== 4 && this.degree !== 5)
            res += "deg" + degreeAdapter[this.degree];

        return res;
    }

    this.isDelayRoot = function() {
        return this.delay.length > 0;
    }

    // *****CONSTUCTOR PART 2*****

    // mapping to ChordComponent
    if(this.position !== undefined) this.position = this.getChordComponentFromStringInThisHfContext(this.position);
    this.revolution = this.getChordComponentFromStringInThisHfContext(this.revolution);
    for(var i=0; i<this.delay.length; i++){
        this.delay[i][0] = this.getChordComponentFromStringInThisHfContext(this.delay[i][0]);
        this.delay[i][1] = this.getChordComponentFromStringInThisHfContext(this.delay[i][1]);
        //todo czy zostawiamy to walidatorowi?
        if(this.delay[i][1].baseComponent === "5"){
            this.delay[i][1] = this.getFifth();
        }
        if(this.delay[i][1].baseComponent === "3" && this.getThird() !== this.delay[i][0]){
            this.delay[i][1] = this.getThird();
        }
    }
    for(i=0; i<this.extra.length; i++) this.extra[i] = this.getChordComponentFromStringInThisHfContext(this.extra[i]);
    for(i=0; i<this.omit.length; i++) this.omit[i] = this.getChordComponentFromStringInThisHfContext(this.omit[i]);


    //additional rules
    if((contains(this.extra, cm.chordComponentFromString("9", this.down)) || contains(this.extra, cm.chordComponentFromString("9>", this.down)) || contains(this.extra, cm.chordComponentFromString("9<", this.down)))
        && !contains(this.extra, cm.chordComponentFromString("7", this.down)) && !contains(this.extra, cm.chordComponentFromString("7<", this.down))) {
        this.extra.push(cm.chordComponentFromString("7", this.down));
    }
    if(this.position !== undefined && !contains(this.getBasicChordComponents(), this.position) && !contains(this.extra, this.position)) this.extra.push(this.position);
    if(!contains(this.getBasicChordComponents(), this.revolution) && !contains(this.extra, this.revolution)) this.extra.push(this.revolution);
    if(contains(this.extra, cm.chordComponentFromString("5<", this.down)) || contains(this.extra, cm.chordComponentFromString("5>", this.down))) {
        if (!contains(this.omit, cm.chordComponentFromString("5", this.down))){
            this.omit.push(cm.chordComponentFromString("5", this.down));
        }
    }

    if(contains(this.omit, this.cm.chordComponentFromString("1", this.down)) && this.revolution === this.cm.chordComponentFromString("1", this.down)){
        this.revolution = this.getBasicChordComponents()[1];
    }

    if(contains(this.omit, this.cm.chordComponentFromString("5", this.down))){
        var five = this.cm.chordComponentFromString("5", this.down);
        if(five !== this.getBasicChordComponents()[2]){
            this.omit = this.omit.filter(function(x){return x !== five});
            this.omit.push(this.getBasicChordComponents()[2]);
        }
    }

    if(contains(this.omit, this.cm.chordComponentFromString("3", this.down))){
        var third = this.cm.chordComponentFromString("3", this.down);
        if(third !== this.getBasicChordComponents()[1]){
            this.omit = this.omit.filter(function(x){return x !== third});
            this.omit.push(this.getBasicChordComponents()[1]);
        }
    }

    if(this.revolution === this.cm.chordComponentFromString("5", this.down)){
        this.revolution = this.getBasicChordComponents()[2];
    }

    if(this.position === this.cm.chordComponentFromString("5", this.down)){
        this.position = this.getBasicChordComponents()[2];
    }

    //handle ninth chords
    // todo obnizenia -> czy nie powinno sie sprawdzac po baseComponentach 1 i 5?
    var has9ComponentInDelay = false;
    for(var i = 0; i < this.delay.length; i++){
        if(this.delay[i][0].baseComponent === "9"){
            has9ComponentInDelay = true;
            break;
        }
    }
    if(containsBaseChordComponent(this.extra, "9") || has9ComponentInDelay){
        if(this.countChordComponents() > 4){
            var prime = this.getPrime()
            var fifth = this.getFifth()
            if(this.position === this.revolution){
                throw new HarmonicFunctionsParserError("HarmonicFunction validation error: " +
                    "ninth chord could not have same position as revolution")
            }
            if (contains([prime, fifth], this.position) && contains([prime, fifth], this.revolution)) {
                throw new HarmonicFunctionsParserError("HarmonicFunction validation error: " +
                    "ninth chord could not have both prime or fifth in position and revolution")
            }
            if(!contains(this.omit, fifth) && this.position !== fifth && this.revolution !== fifth) {
                this.omit.push(fifth);
            }
            else if(!contains(this.omit, prime)) {
                this.omit.push(prime);
                if(this.revolution === prime)
                    this.revolution = this.getBasicChordComponents()[1];
            }
        }
    }
// *****CONSTUCTOR PART 2 END*****

    if(!isDefined(notValidate)) {
        var validator = new HarmonicFunctionValidator();
        validator.validate(this);
    }

}

function HarmonicFunction(functionName, degree, position, revolution, delay, extra, omit, down, system, mode, key, isRelatedBackwards) {
    var args = {
        "functionName" : functionName,
        "degree" : degree,
        "position" : position,
        "revolution" : revolution,
        "delay" : delay,
        "extra" : extra,
        "omit" : omit,
        "down" : down,
        "system" : system,
        "mode" : mode,
        "key" : key,
        "isRelatedBackwards" : isRelatedBackwards
    };
    HarmonicFunction2.call(this, args);
}

function HarmonicFunctionWithoutValidation(functionName, degree, position, revolution, delay, extra, omit, down, system, mode, key, isRelatedBackwards){
    var args = {
        "functionName" : functionName,
        "degree" : degree,
        "position" : position,
        "revolution" : revolution,
        "delay" : delay,
        "extra" : extra,
        "omit" : omit,
        "down" : down,
        "system" : system,
        "mode" : mode,
        "key" : key,
        "isRelatedBackwards" : isRelatedBackwards
    };
    HarmonicFunction2.call(this, args, true);
}

function harmonicFunctionReconstruct(hf){
    var delay = []
    for(var i=0;i<hf.delay.length; i++){
        delay.push([hf.delay[i][0].chordComponentString, hf.delay[i][1].chordComponentString]);
    }
    delay = delay.length > 0 ? delay : undefined;

    return new HarmonicFunctionWithoutValidation(
        hf.functionName,
        hf.degree,
        hf.position === undefined ? undefined : hf.position.chordComponentString,
        hf.revolution === undefined ? undefined : hf.revolution.chordComponentString,
        delay,
        hf.extra === undefined ? undefined : hf.extra.map(function (cc) { return cc.chordComponentString; }),
        hf.omit === undefined ? undefined : hf.omit.map(function (cc) { return cc.chordComponentString; }),
        hf.down,
        hf.system,
        hf.mode,
        hf.key,
        hf.isRelatedBackwards
    )
}

// priority queue of type MIN
function PriorityQueue (priorityAttribute) {

    this.nodeList = []
    this.priorityAttribute = priorityAttribute;  //for graph it is destanceFromBegining

    this.insert = function (node){
        this.nodeList.push(node);
    }

    // return 1 if first > second
    // return 0 if first = second
    // return -1 if first < second
    var sign = function(x){
        if(x > 0) return 1;
        if(x < 0) return -1;
        return 0;
    }

    var compare = function(first, second){

        if(first === undefined || second === undefined)
            throw new UnexpectedInternalError("Illegal argument exception: arguments of compare cannot be undefined")

        if (first === "infinity") {
            if (second === "infinity") {
                return 0;
            } else {
                return 1;
            }
        } else {
            if (second === "infinity") {
                return -1;
            } else {
                sign(first - second) ;
            }
        }

    }

    this.extractMin = function () {
        if(this.nodeList.length === 0) return "empty";

        var indexOfMin = 0;
        for(var i = 0; i < this.nodeList.length; i++){
            if( compare(this.nodeList[i][this.priorityAttribute], this.nodeList[indexOfMin][this.priorityAttribute]) === -1 )
                indexOfMin = i;
        }

        var min = this.nodeList[indexOfMin];
        this.nodeList.splice(indexOfMin, 1);
        return min;
    }

    this.decreaseKey = function (node, key) {
        if(node[this.priorityAttribute] < key)
            throw new UnexpectedInternalError("Given key: " + key + " is greater than current key of given node:" + node[this.priorityAttribute])

        node[this.priorityAttribute] = key;
    }

    this.isEmpty = function (){
        return this.nodeList.length === 0;
    }

    this.isNotEmpty = function () {
        return this.nodeList.length !== 0;
    }
}

function Chord(sopranoNote, altoNote, tenorNote, bassNote, harmonicFunction) {
    this.sopranoNote = sopranoNote
    this.altoNote = altoNote
    this.tenorNote = tenorNote
    this.bassNote = bassNote
    this.harmonicFunction = harmonicFunction
    this.notes = [bassNote, tenorNote, altoNote, sopranoNote]
    this.duration = undefined

    this.toString = function () {
        var chordStr = "CHORD: \n";
        chordStr += "Soprano note: " + this.sopranoNote.toString() + "\n";
        chordStr += "Alto note: " + this.altoNote.toString() + "\n";
        chordStr += "Tenor note: " + this.tenorNote.toString() + "\n";
        chordStr += "Bass note: " + this.bassNote.toString() + "\n";
        return chordStr;
    }

    this.shortString = function (){
        return this.sopranoNote.pitch + "|" + this.altoNote.pitch + "|" + this.tenorNote.pitch + "|" + this.bassNote.pitch;
    }

    this.copy = function(){
        return new Chord(sopranoNote, altoNote, tenorNote, bassNote,harmonicFunction.copy())
    }

    this.countBaseComponents = function(baseComponentString){
        var counter = 0;
        for(var i = 0; i < this.notes.length; i++){
            if(this.notes[i].baseChordComponentEquals(baseComponentString)){
                counter ++;
            }
        }
        return counter
    }

    this.equals = function(other){
        return this.equalsNotes(other)
            && this.harmonicFunction.equals(other.harmonicFunction);
    }

    this.equalsNotes = function (other){
        return this.sopranoNote.equals(other.sopranoNote)
            && this.altoNote.equals(other.altoNote)
            && this.tenorNote.equals(other.tenorNote)
            && this.bassNote.equals(other.bassNote)
    }

}

function chordReconstruct(chord){
    return new Chord(
        noteReconstruct(chord.sopranoNote),
        noteReconstruct(chord.altoNote),
        noteReconstruct(chord.tenorNote),
        noteReconstruct(chord.bassNote),
        harmonicFunctionReconstruct(chord.harmonicFunction)
    )
}



var DEBUG = false;

function checkDSConnection(harmonicFunctions, indexes) {
    for (var i = 0; i < harmonicFunctions.length - 1; i++) {
        if (harmonicFunctions[i].functionName === FUNCTION_NAMES.DOMINANT
            && harmonicFunctions[i + 1].functionName === FUNCTION_NAMES.SUBDOMINANT
            && harmonicFunctions[i].mode === MODE.MAJOR
            && harmonicFunctions[i].key === harmonicFunctions[i+1].key) {
            throw new PreCheckerError("Forbidden connection: D->S", "Chords: " + (indexes[i]) + " " + (indexes[i + 1])
                + "\nChord " + (indexes[i]) + "\n" + (DEBUG ? JSON.stringify(harmonicFunctions[i]) : harmonicFunctions[i].toString())
                + "\nChord " + (indexes[i + 1]) + "\n" + (DEBUG ? JSON.stringify(harmonicFunctions[i + 1]) : harmonicFunctions[i].toString()))
        }
    }
}

function checkForImpossibleConnections(harmonicFunctions, chordGenerator, bassLine, indexes) {
    var currentChords
    var prevChords = undefined
    var goodCurrentChords = []
    var usedCurrentChords = []
    var score
    var chordsWithDelays = 0
    var allConnections = 0

    var isBassDefined = bassLine !== undefined

    var rulesChecker = new ChordRulesChecker(isBassDefined);

    for (var i = 0; i < harmonicFunctions.length; i++) {
        allConnections = 0
        if(harmonicFunctions[i].delay.length > 0){
            chordsWithDelays += (harmonicFunctions[i].delay[0].length - 1)
        }
        if (i !== 0) {
            prevChords = goodCurrentChords
        }
        goodCurrentChords = []
        usedCurrentChords = []
        if (isBassDefined) {
            currentChords = chordGenerator.generate(new ChordGeneratorInput(harmonicFunctions[i],i!==0,undefined,bassLine[i]))
        } else {
            currentChords = chordGenerator.generate(new ChordGeneratorInput(harmonicFunctions[i],i!==0))
        }

        if (DEBUG) console.log("generated for " + i + " " + currentChords.length)

        //todo do the same in chordGenerator
        if(i === 0){
            var illegalDoubledThirdRule = new IllegalDoubledThirdRule();
            currentChords = currentChords.filter(function(chord){return !illegalDoubledThirdRule.hasIllegalDoubled3Rule(chord)})
        }

        if (currentChords.length === 0) {
            if (DEBUG) console.log(harmonicFunctions[i])
            throw new PreCheckerError("Could not generate any chords for chord " + (indexes[i]),
                DEBUG ? JSON.stringify(harmonicFunctions[i]) : harmonicFunctions[i].toString())
        }

        for (var a = 0; a < currentChords.length; a++) {
            usedCurrentChords.push(false)
        }

        rulesChecker.initializeBrokenRulesCounter()

        if (i !== 0) {
            for (var a = 0; a < prevChords.length; a++) {
                for (var b = 0; b < currentChords.length; b++) {
                    allConnections++
                    if (!usedCurrentChords[b]) {
                        score = rulesChecker.evaluateAllRulesWithCounter(new Connection(currentChords[b], prevChords[a]))
                        if (score !== -1) {
                            goodCurrentChords.push(currentChords[b])
                            usedCurrentChords[b] = true
                        }
                    }
                }
            }
        } else {
            for (var b = 0; b < currentChords.length; b++) {
                allConnections++
                goodCurrentChords.push(currentChords[b])
            }
        }
        rulesChecker.getBrokenRulesCounter().setAllConnections(allConnections)

        if (goodCurrentChords.length === 0) {
            var brokenRulesStringInfo = rulesChecker.getBrokenRulesCounter().getBrokenRulesStringInfo()

            if (i !== 0) {
                throw new PreCheckerError("Could not find valid connection between chords " + (indexes[i - 1]) + " and " + (indexes[i]),
                    "\nChord " + (indexes[i - 1])+ "\n" + (DEBUG ? JSON.stringify(harmonicFunctions[i - 1]) : harmonicFunctions[i - 1].toString())
                    + "\nChord " + (indexes[i]) + "\n" + (DEBUG ? JSON.stringify(harmonicFunctions[i]) : harmonicFunctions[i].toString())
                        + "\nBroken rules:\n" + brokenRulesStringInfo)
            } else {
                throw new PreCheckerError("Could not generate any correct chord for first chord",
                    (DEBUG ? JSON.stringify(harmonicFunctions[i]) : harmonicFunctions[i].toString())
                    + "\nBroken rules:\n" + brokenRulesStringInfo)
            }
        }
    }
}

function getHFIndexesBasedOnDelays(harmonicFunctions) {
    var ret = []
    var currentIndex = 1
    for (var a = 0; a < harmonicFunctions.length; a++, currentIndex++) {
        ret.push(currentIndex)
        if (harmonicFunctions[a].delay.length > 0) {
            ret.push(currentIndex)
            a++
        }
    }
    return ret
}


function preCheck(harmonicFunctions, chordGenerator, bassLine, sopranoLine) {
    if (sopranoLine !== undefined) {
        //we do not precheck soprano exercises, since there are more than one possible exercises considered and
        //we create those harmonic function exercises by ourselves
        return
    }
    if (DEBUG) console.log("Prechecker harmonic functions")
    if (DEBUG) console.log(JSON.stringify(harmonicFunctions))
    var indexes = getHFIndexesBasedOnDelays(harmonicFunctions)
    checkDSConnection(harmonicFunctions, indexes)
    checkForImpossibleConnections(harmonicFunctions, chordGenerator, bassLine, indexes)
}




//G
var availableChordComponents = {};

//G
var availableDownChordComponents = {};

//G
var sequence = 0;

function ChordComponentManager() {

    this.chordComponentFromString = function (chordComponentString, isDown) {
        if (!isDown && availableChordComponents.hasOwnProperty(chordComponentString))
            return availableChordComponents[chordComponentString];

        if (isDown && availableDownChordComponents.hasOwnProperty(chordComponentString))
            return availableDownChordComponents[chordComponentString];

        var chordComponent = new ChordComponent(chordComponentString, sequence, isDown);
        sequence++;

        if (isDown) {
            availableDownChordComponents[chordComponentString] = chordComponent;
        } else {
            availableChordComponents[chordComponentString] = chordComponent;
        }
        return chordComponent;
    };

    this.basicChordComponentFromPitch = function (chordComponentPitch, isDown) {
        if(isDown){
            return this.chordComponentFromString({3: "3>", 4: "3", 5: "3<", 6: "5>", 7: "5", 8: "5<"}[chordComponentPitch], isDown);
        }
        return this.chordComponentFromString({3: "3>", 4: "3", 5: "3<", 6: "5>", 7: "5", 8: "5<"}[chordComponentPitch], isDown);
    }
}
function BrokenRulesCounter(rulesList, rulesDetails) {
    this.rulesList = rulesList
    this.rulesDetails = rulesDetails
    this.allConnections = 0

    for (var i = 0; i < this.rulesList.length; i++) {
        this[this.rulesList[i]] = 0
    }

    this.increaseCounter = function(ruleName) {
        this[ruleName] += 1
    }

    this.setAllConnections = function(value) {
        this.allConnections = value
    }

    this.compareBrokenRuleStatuses = function(r1, r2) {
        return r2.counter - r1.counter
    }

    this.getBrokenRulesStringInfo = function() {
        var ret = ""

        var brokenRuleStatuses = []
        for (var i = 0; i < this.rulesList.length; i++){
            brokenRuleStatuses.push(new BrokenRuleStatus(this.rulesDetails[i], this[this.rulesList[i]]))
        }

        brokenRuleStatuses.sort(this.compareBrokenRuleStatuses)

        for (var i = 0; i < brokenRuleStatuses.length; i++) {
            if (brokenRuleStatuses[i].counter !== 0) {
                ret += brokenRuleStatuses[i].details + ": " + brokenRuleStatuses[i].counter + "/" + this.allConnections + "\n"
            }
        }
        return ret
    }
}

function BrokenRuleStatus(details, counter){
    this.details = details
    this.counter = counter
}

function HarmonicFunctionValidator(){

    this.result = true;

    var validFunctionNames = ["T", "S", "D"];

    this.validate = function(harmonicFunction){
        this.harmonicFunction = harmonicFunction;
        this.result = true;
        // functionName          "T", "S", "D"
        validateFunctionName(this);
        // degree               int
        validateDegree(this);
        // position             should be string f.e. "<7" or "7>" or just "7"
        validatePosition(this);
        // revolution           should be string f.e. "<6" or "6>" or just "6"
        validateRevolution(this);
        // delay                delayed components list
        validateDelay(this);
        // extra                extra components list [] | ["9", "7>"]
        validateExtra(this);
        // omit                 omitted components list [] | ["1", "5"]
        validateOmit(this);
        // down                 true or false
        validateDown(this);
        // system               "open" | "close" | undefined
        validateSystem(this);
        // mode                 "major" | "minor"
        validateMode(this);

        //other checks
        checkAllChordComponentNumber(this);
        checkIfExtraContainsPosition(this);
        checkIfExtraContainsRevolution(this);

        return this.result;
    };
    
    function handleValidationFailure(_this, msg){
        _this.result = false;
        throw new HarmonicFunctionsParserError("HarmonicFunction validation error: " + msg)
    }

    function validateFunctionName(_this){
        var functionName = _this.harmonicFunction.functionName;
        if(functionName === undefined) handleValidationFailure(_this, "FunctionName cannot be undefined");
        if(!contains( validFunctionNames, functionName)) handleValidationFailure(_this, "Invalid function name: " + functionName);
    }

    function validateDegree(_this) {
        var degree = _this.harmonicFunction.degree;
        if(!isIntegerNumber(degree)){
            handleValidationFailure(_this, "Degree is not a number");
            return
        }
        if( degree < 1 || degree > 7 ) handleValidationFailure(_this, "Invalid degree value");
    }

    function validatePosition(_this) {
        var position = _this.harmonicFunction.position;
        if(position !== undefined && !isValidChordComponent(position))  handleValidationFailure(_this, "Invalid chordComponentString of position");
    }

    function validateRevolution(_this) {
        var revolution = _this.harmonicFunction.revolution;
        if(revolution === undefined) handleValidationFailure(_this, "Revolution cannot be undefined");
        if(!isValidChordComponent(revolution)) handleValidationFailure(_this, "Invalid chordComponentString of revolution");
    }

    function validateDelay(_this){
        var delay = _this.harmonicFunction.delay;
        if(delay === undefined) handleValidationFailure(_this, "Delay cannot be undefined");
        if(delay.length > 4) handleValidationFailure(_this, "Too large delay list - there are only four voices");
        for(var i=0; i<delay.length; i++){
            
            if(delay[i].length !== 2) handleValidationFailure(_this, "Wrong size of delay");
            
            var first = delay[i][0];
            var second = delay[i][1];

            if(!isValidChordComponent(first)) handleValidationFailure(_this, "Delay first component has not contain valid chordComponentString");
            if(!isValidChordComponent(second)) handleValidationFailure(_this, "Delay second component has not contain valid chordComponentString");

            //too large difference in delay
            var chordComponentManager = new ChordComponentManager();

            if(abs(parseInt(first.baseComponent) - parseInt(second.baseComponent)) > 1 )  handleValidationFailure(_this, "Too large difference in delay");
            // todo to many chord components!
            //todo cannot omit component used in delay, position, resolution, extra

        }
    }

    function validateExtra(_this){
        var extra = _this.harmonicFunction.extra;
        if(extra === undefined) handleValidationFailure(_this, "Extra cannot be undefined");

        for(var i=0; i<extra.length; i++){
            if(!isValidChordComponent(extra[i])) handleValidationFailure(_this, "Invalid chordComponentString of extra[" + i  + "]");
            if(contains(_this.harmonicFunction.getBasicChordComponents(), extra[i])) handleValidationFailure(_this, "Extra contains basic chord component which is not allowed here");

            var other_extra = extra.slice();
            other_extra.splice(i, 1);
            if(contains(other_extra, extra[i])) handleValidationFailure(_this, "Extra contains duplicates");
        }

        if(extra.length > 4) handleValidationFailure(_this, "Extra is too large");
    }

    function validateOmit(_this){
        var omit = _this.harmonicFunction.omit;
        if(omit === undefined) handleValidationFailure(_this, "Omit cannot be undefined");

        for(var i=0; i<omit.length; i++){
            if(!isValidChordComponent(omit[i])) handleValidationFailure(_this, "Invalid chordComponentString of omit [" + i + "]");
            if(!contains(_this.harmonicFunction.getBasicChordComponents(), omit[i]) && omit[i].chordComponentString !== "8") {
                handleValidationFailure(_this, "Omit contains not basic chord component which is not allowed here");
            }

            if(omit.length === 2 && omit[0] === omit[1]) handleValidationFailure(_this, "Omit contains duplicates");
        }
        if(omit.length > 2) handleValidationFailure(_this, "Omit is too large");
    }

    function validateDown(_this){
        var down = _this.harmonicFunction.down;
        if(down !== true && down !== false) handleValidationFailure(_this, "Invalid value of down: " + down);
    }

    function validateSystem(_this){
        var system = _this.harmonicFunction.system;
        if(system !== 'open' && system !== 'close' && system !== undefined) handleValidationFailure(_this, "Illegal value of system: " + system)
    }

    function validateMode(_this) {
        var mode = _this.harmonicFunction.mode;
        if(!contains([MODE.MAJOR, MODE.MINOR], mode)) handleValidationFailure(_this, "Invalid value of mode: " + mode);
    }

    function checkAllChordComponentNumber(_this){
        if(_this.harmonicFunction.countChordComponents() > 4) handleValidationFailure(_this, "Count of chord components is to large - there are only 4 voices");
    }

    function checkIfExtraContainsPosition(_this) {
        var position = _this.harmonicFunction.position;
        var extra = _this.harmonicFunction.extra;
        if(position !== undefined && !contains(_this.harmonicFunction.getBasicChordComponents(), position) && !contains(extra, position))
            handleValidationFailure(_this, "Extra not contains position which is not standard chord component");
    }

    function checkIfExtraContainsRevolution(_this) {
        var revolution = _this.harmonicFunction.revolution;
        var extra = _this.harmonicFunction.extra;
        if(!contains(_this.harmonicFunction.getBasicChordComponents(), revolution) && !contains(extra, revolution))
            handleValidationFailure(_this, "Extra not contains position which is not standard chord component");
    }

    function isValidChordComponent(chordComponent) {
        return (/^(([1-9](>|<|>>|<<)?)|((>|<|>>|<<)[1-9])?)$/gi).test(chordComponent.chordComponentString);
    }
}


// threat this constructor as private - use ChordComponentManager
function ChordComponent(chordComponentString, id, isDown){

    // just for tests
    this.id = id;
    this.isDown = isDown;

    var baseComponentsSemitonesNumber = {
        '1' : 0,
        '2' : 2,
        '3' : 4,
        '4' : 5,
        '5' : 7,
        '6' : 9,
        '7' : 10,
        '8' : 12,
        '9' : 14
        // todo: for future consideration
        // '10' : 16,
        // '11' : 17,
        // '13' : 21
    };

    var deltaPlus = 0;
    var deltaMinus = 0;
    var baseComponent = "";
    for(var i=0; i<chordComponentString.length; i++){
        if(chordComponentString[i] === '>') deltaMinus--;
        else if(chordComponentString[i] === '<') deltaPlus++;
        else baseComponent = baseComponent + chordComponentString[i];
    }
    if(deltaMinus !== 0 && deltaPlus !== 0) {
        error("Invalid chord component string - cannot contains both < and >");
        return;
    }

    this.chordComponentString = chordComponentString;
    this.baseComponent = baseComponent;
    this.semitonesNumber = this.isDown ? baseComponentsSemitonesNumber[baseComponent] + deltaMinus + deltaPlus - 1 : baseComponentsSemitonesNumber[baseComponent] + deltaMinus + deltaPlus;

    this.equals = function(other){
        return this.id === other.id;
    }

    // this.toString = function () {
    //     todo without this test are not passing - dont know why
    //     return this.chordComponentString;
    // }

    this.toXmlString = function() {
        return (this.chordComponentString.replace("<", "&lt;")).replace(">", "&gt;");
    }

    this.toString = function() {
        return "CC string: " + this.chordComponentString +
            " CC semitones_number: " + this.semitonesNumber;
    }
}

function chordComponentReconstruct(chordComponent){
    return new ChordComponent(chordComponent.chordComponentString, chordComponent.id, chordComponent.isDown);
}
