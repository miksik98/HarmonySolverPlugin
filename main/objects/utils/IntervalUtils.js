.import "../utils/Utils.js" as Utils
.import "../commons/Consts.js" as Consts
.import "../model/Scale.js" as Scale

function isOctaveOrPrime(note1, note2){
    return note1.baseNote === note2.baseNote;
}

function isFive(note1, note2){
    //todo co ze swobodnym rozwiazaniem septymy?
    if(note1.pitch > note2.pitch)
        return Utils.contains([4, -3],  note1.baseNote - note2.baseNote);
    else
        return Utils.contains([-4, 3],  note1.baseNote - note2.baseNote);
}

function isChromaticAlteration(note1, note2){
    return note1.baseNote === note2.baseNote && Utils.contains([1,11], Utils.mod(note1.pitch - note2.pitch,12));
}

function pitchOffsetBetween(note1, note2){
    return Utils.abs(note1.pitch - note2.pitch)
}

function getBaseDistance(firstBaseNote, secondBaseNote){
    var i = 0;
    while(firstBaseNote!==secondBaseNote) {
        firstBaseNote = Utils.mod((firstBaseNote+1), 7);
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
        if(Utils.mod(halfToneDist, 12) === 0) halfToneDist = 12;
        else halfToneDist = Utils.mod(halfToneDist, 12);
    }
    var alteredIntervals = {3:1, 5:2, 6:3, 8:4, 10:5, 12:6};
    return alteredIntervals[halfToneDist] === baseDistance
}

function getThirdMode(key, baseNote) {

    var pitchesToUse = Utils.contains(Consts.possible_keys_major, key) ?
        new Scale.MajorScale("C").pitches : new Scale.MinorScale("c").pitches

    var difference = Utils.abs(pitchesToUse[Utils.mod(baseNote + 2, 7)] - pitchesToUse[baseNote])

    return (difference === 4 || difference === 8) ? Consts.MODE.MAJOR : Consts.MODE.MINOR
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

    return Utils.mod((scaleBaseNote + (harmonicFunction.degree - 1) + intervalToBaseNote[interval]), 7);
}