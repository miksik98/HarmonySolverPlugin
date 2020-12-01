.import "../model/Scale.js" as Scale
.import "../model/Chord.js" as Chord
.import "../model/Note.js" as Note
.import "../model/ChordComponentManager.js" as ChordComponentManager
.import "../commons/Consts.js" as Consts
.import "../utils/Utils.js" as Utils
.import "../utils/IntervalUtils.js" as IntervalUtils
.import "../commons/Generator.js" as Generator
.import "../harmonic/ChordRulesChecker.js" as ChordRulesChecker

function ChordGeneratorInput(harmonicFunction, allowDoubleThird, sopranoNote, bassNote) {
    this.harmonicFunction = harmonicFunction;
    this.allowDoubleThird = allowDoubleThird;
    this.sopranoNote = sopranoNote;
    this.bassNote = bassNote;
}

function ChordGenerator(key, mode) {
    Generator.Generator.call(this);

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
            if(Utils.contains(needToAdd, harmonicFunction.omit[i]))
                needToAdd.splice(needToAdd.indexOf(harmonicFunction.omit[i]), 1);
        }

        //Position is given
        if (harmonicFunction.position !== undefined) {
            soprano = harmonicFunction.position;
            if(Utils.contains(needToAdd, harmonicFunction.position))
                needToAdd.splice(needToAdd.indexOf(harmonicFunction.position), 1);
        }

        //Revolution handling
        bass = harmonicFunction.revolution;
        if(Utils.contains(needToAdd, harmonicFunction.revolution))
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

        var scale = harmonicFunction.mode === Consts.MODE.MAJOR ? new Scale.MajorScale(infered_key) : new Scale.MinorScale(infered_key);

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
        var scale = harmonicFunction.mode === Consts.MODE.MAJOR ? new Scale.MajorScale(infered_key) : new Scale.MinorScale(infered_key);

        var resultNotes = [];

        for (var i = 0; i < schemas_mapped.length; i++) {
            var schema_mapped = schemas_mapped[i];
            var vb = new Consts.VoicesBoundary()
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
                                        var bassNote = new Note.Note(bass[n], IntervalUtils.toBaseNote(scale.baseNote, harmonicFunction, schemas[i][3]), schemas[i][3]);
                                        var tenorNote = new Note.Note(tenor[j], IntervalUtils.toBaseNote(scale.baseNote, harmonicFunction, schemas[i][2]), schemas[i][2]);
                                        var altoNote = new Note.Note(alto[k], IntervalUtils.toBaseNote(scale.baseNote, harmonicFunction, schemas[i][1]), schemas[i][1]);
                                        var sopranoNote = new Note.Note(soprano[m], IntervalUtils.toBaseNote(scale.baseNote, harmonicFunction, schemas[i][0]), schemas[i][0]);
                                        if(checkChordCorrectness(new Chord.Chord(sopranoNote,altoNote,tenorNote,bassNote,harmonicFunction))) {
                                            sopranoNote.pitch = Utils.convertPitchToOneOctave(soprano[m]);
                                            if (!Utils.contains(resultNotes, sopranoNote)) {
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
            harmonicFunction.mode = Consts.MODE.MAJOR;
        }
        var chords = [];
        var temp = this.getChordTemplate(harmonicFunction);
        var schemas = this.getSchemas(harmonicFunction, temp);
        var schemas_mapped = this.mapSchemas(harmonicFunction, schemas);

        var infered_key = harmonicFunction.key !== undefined ? harmonicFunction.key : this.key;
        var scale = harmonicFunction.mode === Consts.MODE.MAJOR ? new Scale.MajorScale(infered_key) : new Scale.MinorScale(infered_key);

        for (var i = 0; i < schemas_mapped.length; i++) {
            var schema_mapped = schemas_mapped[i];
            var vb = new Consts.VoicesBoundary()
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

                                        var bassNote = new Note.Note(bass[n], IntervalUtils.toBaseNote(scale.baseNote, harmonicFunction, schemas[i][3]), schemas[i][3]);
                                        var tenorNote = new Note.Note(tenor[j], IntervalUtils.toBaseNote(scale.baseNote, harmonicFunction, schemas[i][2]), schemas[i][2]);
                                        var altoNote = new Note.Note(alto[k], IntervalUtils.toBaseNote(scale.baseNote, harmonicFunction, schemas[i][1]), schemas[i][1]);
                                        var sopranoNote = new Note.Note(soprano[m], IntervalUtils.toBaseNote(scale.baseNote, harmonicFunction, schemas[i][0]), schemas[i][0]);
                                        chords.push(new Chord.Chord(sopranoNote, altoNote, tenorNote, bassNote, chordGeneratorInput.harmonicFunction));

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
                        if( Utils.mod(i, 12) === Utils.mod(pitch, 12) ) return true;
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
                Utils.log("ILLEGAL system in harmonicFunction: " + chord.harmonicFunction.system)
                return true;
            });


        }

        // console.log("CHORDS:");
        // chords.forEach(function(x){ console.log(x.toString())});
        // console.log("CHORDS END:");

        // filtering chords with given pitches
        if (Utils.isDefined(chordGeneratorInput.bassNote)) {
            chords = chords.filter(function (chord) {
                function eq(x, y) {
                    return y === undefined
                        || y.pitch === undefined
                        || x.pitch === y.pitch
                }

                return eq(chord.bassNote, chordGeneratorInput.bassNote)
            })
        }
        if (Utils.isDefined(chordGeneratorInput.sopranoNote)) {
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
            var illegalDoubledThirdRule = new ChordRulesChecker.IllegalDoubledThirdRule();
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
        IntervalUtils.pitchOffsetBetween(chord.tenorNote, chord.bassNote) >= 12;

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
    if(!Utils.containsBaseChordComponent(chord.harmonicFunction.extra,9))
        return true;
    if(Utils.containsBaseChordComponent(["3","7"], chord.harmonicFunction.revolution)) {
        if(!chord.sopranoNote.baseChordComponentEquals("9") || !chord.tenorNote.baseChordComponentEquals("1"))
            return false;
    }
    return true;
}

function checkChordCorrectness(chord){
    return correctDistanceBassTenor(chord) && correctChopinChord(chord) && correctNinthChord(chord)
}