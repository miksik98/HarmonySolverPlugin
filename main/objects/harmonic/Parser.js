.import "../commons/Consts.js" as Consts
.import "../harmonic/Exercise.js" as Exercise
.import "../model/HarmonicFunction.js" as HarmonicFunction
.import "../utils/Utils.js" as Utils
.import "../commons/Errors.js" as Errors
.import "../model/Scale.js" as Scale
.import "../utils/IntervalUtils.js" as IntervalUtils

var DEBUG = false;

function check_figured_bass_symbols(symbols){
    var figured_bass_symbols = /\s*(((([#bh])?\d+)|([#bh]))\s*)+/;
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
    if(chord_type.length === 2 && chord_type[1] === "o") mode = Consts.MODE.MINOR;
    var arguments_json = JSON.parse(arguments);
    arguments_json["functionName"] = chord_type[0];
    arguments_json["mode"] = mode;
    return new HarmonicFunction.HarmonicFunction2(arguments_json)
}

function getKeyFromPitchBasenoteAndModeOrThrowError(pitch, basenote, mode) {
    var mapKey = pitch.toString() + "," + basenote.toString() + "," + mode
    var key = Consts.keyFromPitchBasenoteAndMode[mapKey]
    if (key === undefined) {
        throw new Errors.UnexpectedInternalError("Could not find key for given pitch, basenote and mode",
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

    var pitchesToUse = Utils.contains(Consts.possible_keys_major, keyToUse) ?
        new Scale.MajorScale("C").pitches : new Scale.MinorScale("c").pitches

    var keyPitch = Consts.keyStrPitch[keyToUse] + pitchesToUse[deflectionTargetChord.degree - 1]
    keyPitch = keyPitch >= 72 ? keyPitch - 12 : keyPitch

    var keyBaseNote = Utils.mod(Consts.keyStrBase[keyToUse] + deflectionTargetChord.degree - 1, 7)
    if(deflectionTargetChord.down) {
        keyPitch--
        if(keyPitch < 60)
            keyPitch += 12
    }
    var modeToUse = IntervalUtils.getThirdMode(key, deflectionTargetChord.degree - 1)

    if(deflectionTargetChord.down)
        modeToUse = Consts.MODE.MAJOR

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
                if (DEBUG) Utils.log("mode")
                measures[a][b].mode = measures[a][b].functionName === Consts.FUNCTION_NAMES.DOMINANT ? Consts.MODE.MAJOR : measures[a][b].mode
                if (DEBUG) Utils.log("mode", measures[a][b].mode)
                measures[a][b].isRelatedBackwards = isRelatedBackwards
                if (DEBUG) Utils.log("isRelatedBackwards", measures[a][b].isRelatedBackwards)
                return
            } else {
                currentChordNumber++
            }
        }
    }
}

function applyKeyToChords(measures, beginning, end, key, deflectionType) {
    var modeToApply = Utils.getModeFromKey(key)

    for (var i = beginning; i <= end; i++) {
        if (DEBUG) Utils.log(i)
        applyKeyAndModeToSpecificChord(measures, key, modeToApply, i, deflectionType === Consts.DEFLECTION_TYPE.BACKWARDS)
    }
}



function handleDeflections(measures, key, deflections){

    if (DEBUG) Utils.log("Handling deflections")
    if (DEBUG) Utils.log(JSON.stringify(deflections))

    var nextChordAfterDeflection = undefined
    var prevChordBeforeDeflection = undefined
    var elipseChord = undefined
    var keyForDeflection = undefined

    for (var i = 0; i < deflections.length; ++i) {
        if (DEBUG) Utils.log(JSON.stringify(deflections[i]))
        if(deflections[i][2] === Consts.DEFLECTION_TYPE.BACKWARDS){
            prevChordBeforeDeflection = getSpecificChord(measures, deflections[i][0] - 1)
            if (DEBUG) Utils.log("prevChordBeforeDeflection", prevChordBeforeDeflection)
            if (prevChordBeforeDeflection === undefined) {
                throw new Errors.HarmonicFunctionsParserError("Backward deflection cannot be the first chord")
            }
            keyForDeflection = calculateKey(key, prevChordBeforeDeflection)
            if (DEBUG) Utils.log("keyForDeflection", keyForDeflection)
            applyKeyToChords(measures, deflections[i][0], deflections[i][1], keyForDeflection, Consts.DEFLECTION_TYPE.BACKWARDS)
        }
        if(deflections[i][2] === Consts.DEFLECTION_TYPE.ELIPSE){
            if (DEBUG) Utils.log(JSON.stringify(deflections[i]))
            elipseChord = getSpecificChord(measures, deflections[i][1])
            if (elipseChord === undefined) {
                throw new Errors.HarmonicFunctionsParserError("Elipse cannot be empty.")
            }
            if (DEBUG) Utils.log("elipseChord", elipseChord)
            keyForDeflection = calculateKey(key, elipseChord)
            elipseChord.functionName = Consts.FUNCTION_NAMES.TONIC
            elipseChord.degree = 6
            if (DEBUG) Utils.log("keyForDeflection", keyForDeflection)
            applyKeyToChords(measures, deflections[i][0], deflections[i][1], keyForDeflection, Consts.DEFLECTION_TYPE.ELIPSE)
        }
    }

    for (var i = deflections.length - 1; i >= 0; --i) {
        if (DEBUG) Utils.log(JSON.stringify(deflections[i]))
        if(deflections[i][2] === Consts.DEFLECTION_TYPE.CLASSIC){
            nextChordAfterDeflection = getSpecificChord(measures, deflections[i][1] + 1)
            if (DEBUG) Utils.log("nextChordAfterDeflection", nextChordAfterDeflection)
            if (nextChordAfterDeflection === undefined) {
                throw new Errors.HarmonicFunctionsParserError("Deflection cannot be the last chord")
            }
            if(nextChordAfterDeflection.isRelatedBackwards){
                throw new Errors.HarmonicFunctionsParserError("Backward deflection could not be after forward deflection.", JSON.stringify(nextChordAfterDeflection))
            }
            keyForDeflection = calculateKey(key, nextChordAfterDeflection)
            if (DEBUG) Utils.log("keyForDeflection", keyForDeflection)
            applyKeyToChords(measures, deflections[i][0], deflections[i][1], keyForDeflection, Consts.DEFLECTION_TYPE.CLASSIC)
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
                throw new Errors.HarmonicFunctionsParserError("Invalid number of \":\"", subcontents[i]);
        }
        var key = subcontentSplitted[0];
        var value = subcontentSplitted[1];
        subcontents[i] = "\""+key+"\":";
        switch(key){
            case "position":
                if (value === undefined || value.length === 0) {
                    throw new Errors.HarmonicFunctionsParserError("\"position\", if specified, cannot be empty");
                }
                if (!validateSymbol(value)) {
                    throw new Errors.HarmonicFunctionsParserError("\"position\" value is invalid.", value);
                }
                subcontents[i] += "\""+value+"\"";
                break;
            case "revolution":
                if (value === undefined || value.length === 0) {
                    throw new Errors.HarmonicFunctionsParserError("\"revolution\", if specified, cannot be empty");
                }
                if (!validateSymbol(value)) {
                    throw new Errors.HarmonicFunctionsParserError("\"revolution\" value is invalid.", value);
                }
                subcontents[i] += "\""+value+"\"";
                break;
            case "system":
                if (value === undefined || value.length === 0) {
                    throw new Errors.HarmonicFunctionsParserError("\"system\", if specified, cannot be empty");
                }
                subcontents[i] += "\""+value+"\"";
                break;
            case "isRelatedBackwards":
                if(Utils.isDefined(value))
                    throw new Errors.HarmonicFunctionsParserError("Property \"isRelatedBackwards\" should not have any value.", "Found: " + value);
                subcontents[i] += "true";
                break;
            case "down":
                if(Utils.isDefined(value))
                    throw new Errors.HarmonicFunctionsParserError("Property \"down\" should not have any value.", "Found: " + value);
                subcontents[i] += "true";
                break;
            case "degree":
                if (value === undefined || value.length === 0) {
                    throw new Errors.HarmonicFunctionsParserError("\"degree\", if specified, cannot be empty");
                }
                if (!isIntegerString(value)) {
                    throw new Errors.HarmonicFunctionsParserError("\"degree\" value should be integer.", "Found: " + value);
                }
                subcontents[i] += value;
                break;
            case "extra":
                if (value === undefined || value.length === 0) {
                    throw new Errors.HarmonicFunctionsParserError("\"extra\", if specified, cannot be empty");
                }
                var values = value.split(",");
                for(var j = 0; j < values.length; j++){
                    if (values[j] === undefined || values[j].length === 0) {
                        throw new Errors.HarmonicFunctionsParserError("One \"extra\" value is empty.", value);
                    }
                    if (!validateSymbol(values[j])) {
                        throw new Errors.HarmonicFunctionsParserError("\"extra\" value is invalid.", values[j]);
                    }
                    values[j] = "\""+values[j]+"\"";
                }
                subcontents[i] += "["+values.join(",")+"]";
                break;
            case "omit":
                if (value === undefined || value.length === 0) {
                    throw new Errors.HarmonicFunctionsParserError("\"omit\", if specified, cannot be empty");
                }
                var values = value.split(",");
                for(var j = 0; j < values.length; j++){
                    if (values[j] === undefined || values[j].length === 0) {
                        throw new Errors.HarmonicFunctionsParserError("One \"omit\" value is empty.", value);
                    }
                    if (!validateSymbol(values[j])) {
                        throw new Errors.HarmonicFunctionsParserError("\"omit\" value is invalid.", values[j]);
                    }
                    values[j] = "\""+values[j]+"\"";
                }
                subcontents[i] += "["+values.join(",")+"]";
                break;
            case "delay":
                if (value === undefined || value.length === 0) {
                    throw new Errors.HarmonicFunctionsParserError("\"delay\", if specified, cannot be empty");
                }
                var values = value.split(",");
                var delay;
                for(var j = 0; j < values.length; j++){
                    if (values[j] === undefined || values[j].length === 0) {
                        throw new Errors.HarmonicFunctionsParserError("Empty delay.", values);
                    }
                    delay = values[j].split("-");
                    if(delay.length !== 2)
                        throw new Errors.HarmonicFunctionsParserError("Delay should match pattern \"X-Y\".", "Found: "+values[j]);
                    if (delay[0] === undefined || delay[0].length === 0) {
                        throw new Errors.HarmonicFunctionsParserError("Empty left side of delay.", "Invalid delay: " + values[j]);
                    }
                    if (delay[1] === undefined || delay[1].length === 0) {
                        throw new Errors.HarmonicFunctionsParserError("Empty right side of delay.", "Invalid delay: " + values[j]);
                    }
                    if (!validateSymbol(delay[0])) {
                        throw new Errors.HarmonicFunctionsParserError("Left \"delay\" value is invalid.", values[j]);
                    }
                    if (!validateSymbol(delay[1])) {
                        throw new Errors.HarmonicFunctionsParserError("Right \"delay\" value is invalid.", values[j]);
                    }

                    delay[0] = "\""+delay[0]+"\"";
                    delay[1] = "\""+delay[1]+"\"";
                    values[j] = "["+delay.join(",")+"]"
                }
                subcontents[i] += "["+values.join(",")+"]";
                break;
            default:
                throw new Errors.HarmonicFunctionsParserError("Invalid property name. Allowed: " +
                    "\"position\", \"revolution\", \"system\", \"degree\", " +
                    "\"extra\", \"omit\", \"delay\",\"down\", \"isRelatedBackwards\".", "Found \"" + key + "\"");
        }
    }
    return subcontents.join(",");
}

function translateHarmonicFunction(harmonicFunctionString){
    if(!(/[\(\[]?([TSD])o?\{.*\}[\)\]]?/ig).test(harmonicFunctionString))
        throw new Errors.HarmonicFunctionsParserError("Wrong harmonic structure. Check name, curly parenthesis and deflection parenthesis.", harmonicFunctionString);
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
                throw new Errors.HarmonicFunctionsParserError(e.message + " " + e.details,
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
        throw new Errors.HarmonicFunctionsParserError("Exercise is empty")
    }

    var lines = input.split("\n")

    if (lines === undefined || lines[0] === undefined || lines[0] === ""
        || lines[1] === undefined  || lines[1] === ""
        || lines[2] === undefined || lines[2] === "") {
        throw new Errors.HarmonicFunctionsParserError("Exercise is empty")
    }

    var isInNewNotation = false;
    if(lines[0] === "dev") {
        lines = lines.splice(1, lines.length);
    } else {
        isInNewNotation = true;
    }
    var key = lines[0]

    var mode = null

    if (Utils.contains(Consts.possible_keys_major, key)) {
        mode = Consts.MODE.MAJOR
    } else if (Utils.contains(Consts.possible_keys_minor, key)) {
        mode = Consts.MODE.MINOR
    } else {
        throw new Errors.HarmonicFunctionsParserError("Unrecognized key", key)
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
            || metre[1] === undefined || isNaN(metre[1]) || !Utils.contains([1, 2, 4, 8, 16 ,32 ,64], metre[1])) {
            throw new Errors.HarmonicFunctionsParserError("Invalid metre", lines[1])
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
            if (DEBUG) Utils.log("Current chord: ", JSON.stringify(chords[j]))

            if(chords[j][0] === '['){
                if(insideDeflection){
                    throw new Errors.HarmonicFunctionsParserError("Elipse cannot be inside deflection.", chords[j])
                } else if(j === 0){
                    if(!chords[j].endsWith(']')){
                        throw new Errors.HarmonicFunctionsParserError("There could be only one chord in elipse.", chords[j]);
                    }
                    var parsedElipse = parseChord(chords[j], true, true);
                    chords_parsed.push(parsedElipse);
                    deflectionType = Consts.DEFLECTION_TYPE.ELIPSE;
                    if(deflections[deflections.length - 1][1] !== chordNumber - 1){
                        throw new Errors.HarmonicFunctionsParserError("Elipse must be preceded by deflection", chords[j])
                    }
                    deflections[deflections.length - 1][1] = chordNumber
                    deflections[deflections.length - 1][2] = deflectionType
                    chordNumber ++
                    continue;
                } else {
                    throw new Errors.HarmonicFunctionsParserError("Elipse must be preceded by deflection", chords[j])
                }
            }

            if (chords[j][0] === '(') {
                if(chords[j][1] === '['){
                    throw new Errors.HarmonicFunctionsParserError("Elipse cannot be inside deflection.", chords[j])
                }
                if (insideDeflection) {
                    throw new Errors.HarmonicFunctionsParserError("Deflection cannot be inside another deflection.", chords[j])
                }
                if (DEBUG) Utils.log("Inside deflection")
                deflectionBeginning = chordNumber
                insideDeflection = true
                dropFirstChar = true
            }

            if (chords[j][chords[j].length - 1] === ')') {
                if (!insideDeflection) {
                    throw new Errors.HarmonicFunctionsParserError("Unexpected end of deflection:", chords[j])
                }
                if (DEBUG) Utils.log("Exiting deflection")
                insideDeflection = false
                dropLastChar = true
            }

            var parsedChord = parseChord(chords[j], dropFirstChar, dropLastChar)
            chords_parsed.push(parsedChord)
            if(chords[j][0] === '('){
                if(parsedChord === undefined) {
                    throw new Errors.HarmonicFunctionsParserError("Deflection cannot be empty.", chords[j])
                }
                deflectionType = parsedChord.isRelatedBackwards ? Consts.DEFLECTION_TYPE.BACKWARDS :  Consts.DEFLECTION_TYPE.CLASSIC
            }
            if(chords[j][chords[j].length - 1] === ')'){
                if(j < chords.length-1 && chords[j+1].startsWith("[")){
                    j++;
                    if(!chords[j].endsWith(']')){
                        throw new Errors.HarmonicFunctionsParserError("There could be only one chord in elipse.", chords[j]);
                    }
                    var parsedElipse = parseChord(chords[j], true, true);
                    chords_parsed.push(parsedElipse);
                    deflectionType = Consts.DEFLECTION_TYPE.ELIPSE;
                    chordNumber++;
                }
                deflections.push([deflectionBeginning, chordNumber, deflectionType])
            }
            chordNumber++
        }
        measures.push(chords_parsed)
    }

    if (insideDeflection) {
        throw new Errors.HarmonicFunctionsParserError("There is unclosed deflection")
    }

    if (DEBUG) Utils.log("Parsed measures", JSON.stringify(measures))

    if (deflections.length !== 0){
        handleDeflections(measures, key, deflections)
        if (DEBUG) Utils.log("Parsed measures after handling deflections", JSON.stringify(measures))
    }

    return new Exercise.Exercise(key, metre, mode, measures)

}
