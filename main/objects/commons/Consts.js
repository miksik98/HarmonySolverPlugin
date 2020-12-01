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
