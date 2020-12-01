.import "../commons/Consts.js" as Consts
.import "../model/Scale.js" as Scale

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
    if (contains(Consts.possible_keys_major, key)) {
        mode = Consts.MODE.MAJOR
    } else {
        mode = Consts.MODE.MINOR
    }
    return mode;
}

// meter = [nominator,denominator], measureCount is sum of notes from beginning of measure
function getMeasurePlace(meter, measureCount){
    measureCount *= meter[1];
    //if not integer - return UPBEAT
    if(parseInt(measureCount) !== measureCount)
        return Consts.MEASURE_PLACE.UPBEAT;
    if(measureCount === 0)
        return Consts.MEASURE_PLACE.BEGINNING;
    var numerator = meter[0];

    if(isPowerOf2(numerator)){
        for(var i = 2; i < numerator; i = i + 2){
            if(measureCount === i){
                return Consts.MEASURE_PLACE.DOWNBEAT;
            }
        }
        return Consts.MEASURE_PLACE.UPBEAT;
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
            return Consts.MEASURE_PLACE.DOWNBEAT;
    }
    if(twosNumber === 2 && measureCount === counter + 2)
        return Consts.MEASURE_PLACE.DOWNBEAT;
    return Consts.MEASURE_PLACE.UPBEAT;
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
    var match = xString.match(/0|([1-9]\d*)/gi);
    if(match === null)
        return false;
    return x !== xString && match.length === 1 && match[0] === xString
}

function getAlterationSymbolForNote(note, mode, key){
    var scalePitches = mode === Consts.MODE.MAJOR ? new Scale.MajorScale(key).pitches : new Scale.MinorScale(key).pitches
    var noteNumber = mod(note.baseNote - Consts.keyStrBase[key],7)

    if (mod(scalePitches[noteNumber] + Consts.keyStrPitch[key] + 1, 12) === mod(note.pitch, 12)) {
        return Consts.ALTERATIONS.SHARP
    } else  if (mod(scalePitches[noteNumber] + Consts.keyStrPitch[key] - 1, 12) === mod(note.pitch, 12)) {
        return Consts.ALTERATIONS.FLAT
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