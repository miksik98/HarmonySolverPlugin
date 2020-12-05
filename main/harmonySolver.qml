import QtQuick 2.2
import MuseScore 3.0
import FileIO 3.0
import QtQuick.Dialogs 1.2
import QtQuick.Controls 1.4

import "./objects/harmonic/Parser.js" as Parser
import "./objects/bass/FiguredBass.js" as FiguredBass
import "./objects/model/Note.js" as Note
import "./objects/commons/Consts.js" as Consts
import "./objects/bass/BassTranslator.js" as Translator
import "./objects/soprano/SopranoExercise.js" as SopranoExercise
import "./objects/model/HarmonicFunction.js" as HarmonicFunction
import "./objects/conf/PluginConfiguration.js" as PluginConfiguration
import "./objects/conf/PluginConfigurationUtils.js" as PluginConfigurationUtils
import "./objects/commons/Errors.js" as Errors
import "./objects/utils/Utils.js" as Utils
import "./objects/dto/SolverRequestDto.js" as SolverRequestDto
import "./objects/dto/SopranoSolverRequestDto.js" as SopranoSolverRequestDto
import "./objects/commons/ExerciseSolution.js" as ExerciseSolution

MuseScore {
    menuPath: "Plugins.HarmonySolver"
    description: "This plugin solves harmonics exercises"
    version: "1.0"
    requiresScore: false
    pluginType: "dock"
    dockArea: "right"

    property var exercise: ({})
    property var exerciseLoaded: false
    property var configuration: ({})

    id: window
    width: 550
    height: 550
    onRun: {
      configuration = PluginConfigurationUtils.readConfiguration(outConfFile, filePath)
    }

    function savePluginConfiguration(){
        PluginConfigurationUtils.saveConfiguration(outConfFile, filePath, configuration)
    }

    FileIO{
      id: outConfFile
      onError: Utils.warn(msg + "  Filename = " + outConfFile.source)
    }

    function getBaseNote(museScoreBaseNote) {
        var result
        switch (museScoreBaseNote) {
        case 0:
            result = Consts.BASE_NOTES.F
            break
        case 1:
            result = Consts.BASE_NOTES.C
            break
        case 2:
            result = Consts.BASE_NOTES.G
            break
        case 3:
            result = Consts.BASE_NOTES.D
            break
        case 4:
            result = Consts.BASE_NOTES.A
            break
        case 5:
            result = Consts.BASE_NOTES.E
            break
        case 6:
            result = Consts.BASE_NOTES.B
            break
        }
        return result
    }

    function isAlterationSymbol(character) {
        return (character === '#' || character === 'b' || character ==='h')
    }


    function read_figured_bass() {
        var cursor = curScore.newCursor()
        cursor.rewind(0)
        var elements = []
        var bassNote, key, mode
        var durations = []
        var has3component = false
        var lastBaseNote, lastPitch
        var meter = [cursor.measure.timesigActual.numerator, cursor.measure.timesigActual.denominator]
        var delays = []
        do {
            var symbols = []
            durations.push(
                        [cursor.element.duration.numerator, cursor.element.duration.denominator])
            if (typeof cursor.element.parent.annotations[0] !== "undefined") {
                var readSymbols = cursor.element.parent.annotations[0].text
                //Utils.log("readSymbols:", readSymbols)
                for (var i = 0; i < readSymbols.length; i++) {
                    var component = "", alteration = undefined
                    while (i < readSymbols.length && readSymbols[i] !== "\n") {
                        if (readSymbols[i] !== " " && readSymbols[i] !== "\t") {
                            component += readSymbols[i]
                        }
                        i++
                    }
                    //Utils.log("component: " + component)

                    if ((component.length === 1 && isAlterationSymbol(component[0])) ||
                        (component.length === 2 && isAlterationSymbol(component[0]) && component[0] === component[1])) {
                        if (has3component) {
                            throw new Errors.FiguredBassInputError("Cannot twice define 3", symbols)
                        } else {
                            symbols.push(new FiguredBass.BassSymbol(3, component[0]))
                            has3component = true
                        }
                    } else {
                        //delays
                        if (component.includes('-')) {
                            var splittedSymbols = component.split('-')
                            var firstSymbol = splittedSymbols[0]
                            var secondSymbol = splittedSymbols[1]
//todo do osobnej funkcji

                            if (isAlterationSymbol(secondSymbol[0])) {
                                if (secondSymbol[0] === secondSymbol[1]){
                                    if (parseInt(secondSymbol[2]) !== 8) {
                                        symbols.push(new FiguredBass.BassSymbol(parseInt(secondSymbol[2]), secondSymbol[0]))
                                    }
                                } else {
                                    if (parseInt(secondSymbol[1]) !== 8) {
                                        symbols.push(new FiguredBass.BassSymbol(parseInt(secondSymbol[1]), secondSymbol[0]))
                                    }
                                }
                            } else if (isAlterationSymbol(secondSymbol[secondSymbol.length - 1])) {
                                if (parseInt(secondSymbol[0]) !== 8) {
                                    symbols.push(new FiguredBass.BassSymbol(parseInt(secondSymbol[0]),
                                                                            secondSymbol[secondSymbol.length - 1]))
                                }
                            } else {
                                if (parseInt(secondSymbol) !== 8) {
                                    symbols.push(new FiguredBass.BassSymbol(parseInt(secondSymbol), undefined))
                                }
                            }
                            delays.push([firstSymbol, secondSymbol])

                        } else {
                            if (isAlterationSymbol(component[0])) {
                                if (component[0] === component[1]){
                                    if (parseInt(component[2]) !== 8) {
                                        symbols.push(new FiguredBass.BassSymbol(parseInt(component[2]), component[0]))
                                    }
                                } else {
                                    if (parseInt(component[1]) !== 8) {
                                        symbols.push(new FiguredBass.BassSymbol(parseInt(component[1]), component[0]))
                                    }
                                }
                            } else if (isAlterationSymbol(component[component.length - 1])) {
                                if (parseInt(component[0]) !== 8) {
                                    symbols.push(new FiguredBass.BassSymbol(parseInt(component[0]),
                                                                            component[component.length - 1]))
                                }
                            } else {
                                if (parseInt(component) !== 8) {
                                    symbols.push(new FiguredBass.BassSymbol(parseInt(component), undefined))
                                }
                            }
                        }
                    }

                        //Utils.log("symbols:", symbols)
                }
            }
            lastBaseNote = getBaseNote(Utils.mod((cursor.element.notes[0].tpc + 1), 7))
            lastPitch = cursor.element.notes[0].pitch
            bassNote = new Note.Note(lastPitch, lastBaseNote, 0)
            elements.push(new FiguredBass.FiguredBassElement(bassNote, symbols, delays))
            has3component = false

            if (delays.length !== 0) {
                if (durations[durations.length - 1][0] % 2 === 0 || durations[durations.length - 1][0] === 1) {
                    durations[durations.length - 1][1]*=2
                    durations.push(durations[durations.length - 1])
                } else{
                    var numerator = durations[durations.length - 1][0]
                    durations[durations.length - 1][0] = parseInt(Math.ceil(numerator * 1.0 / 2))
                    durations.push([parseInt(Math.floor(numerator * 1.0 / 2)), durations[durations.length - 1][1]])
                    durations[durations.length - 1][0] = parseInt(Math.floor(numerator * 1.0 / 2))
                }
            }

            delays = []
        } while (cursor.next())
        lastPitch = Utils.mod(lastPitch, 12)
        var majorKey = Consts.majorKeyBySignature(curScore.keysig)
        var minorKey = Consts.minorKeyBySignature(curScore.keysig)
        if (Utils.mod(Consts.keyStrPitch[majorKey], 12) === lastPitch
                && Consts.keyStrBase[majorKey] === lastBaseNote) {
            key = majorKey
            mode = "major"
        } else {
            if (Utils.mod(Consts.keyStrPitch[minorKey], 12) === lastPitch
                    && Consts.keyStrBase[minorKey] === lastBaseNote) {
                key = minorKey
                mode = "minor"
            } else {
                throw new Errors.FiguredBassInputError("Wrong last note. Bass line should end on Tonic.")
            }
        }
        return new FiguredBass.FiguredBassExercise(mode, key, meter, elements,
                                                   durations)
    }

    function get_solution_date() {
        var date = new Date()
        var ret = "_"
        ret += date.getFullYear(
                    ) + "_" + (date.getMonth() + 1) + "_" + date.getDate() + "_"
        ret += date.getHours() + "_" + date.getMinutes(
                    ) + "_" + date.getSeconds()
        //Utils.log("Solution date - " + ret)
        return ret
    }

    function prepare_score_for_solution(filePath, solution, solution_date, setDurations, taskType) {
        var resources_path = "";

        if(configuration.enableChordSymbolsPrinting){
            resources_path = "/resources/template scores/";
        }
        else{
            resources_path = "/resources/lightweight_template_scores/";
        }
        
        var solutionPath = configuration.solutionPath
        
        if(solutionPath === "") solutionPath = filePath+"/solutions"

        readScore(filePath + resources_path + solution.exercise.key + "_"
                  + solution.exercise.mode + ".mscz")
        writeScore(curScore,
                   solutionPath + "/solution" + taskType + solution_date,
                   "mscz")
        closeScore(curScore)
        readScore(solutionPath + "/solution" + taskType
                  + solution_date + ".mscz")
        if (setDurations) {
            solution.setDurations()
        }
    }

    function fill_score_with_solution(solution, durations) {
        var cursor = curScore.newCursor()
        cursor.rewind(0)
        var ts = newElement(Element.TIMESIG)
        ts.timesig = fraction(solution.exercise.meter[0],
                              solution.exercise.meter[1])
        cursor.add(ts)

        if(durations !== undefined){
            var countMeasures = function(durations){
                var sum = 0;
                for(var i=0; i<durations.length;i++){
                    //Utils.log(durations[i][0]/durations[i][1])
                    sum += durations[i][0]/durations[i][1];
                }
                return Math.round(sum/(solution.exercise.meter[0]/solution.exercise.meter[1]));
            }

            var sum = countMeasures(durations);
            curScore.appendMeasures(sum - curScore.nmeasures)
        }
        else{
            curScore.appendMeasures(solution.exercise.measures.length - curScore.nmeasures)
        }

        cursor.rewind(0)
        var lastSegment = false
        for (var i = 0; i < solution.chords.length; i++) {
            var curChord = solution.chords[i]
            var prevChord = i === 0 ? undefined : solution.chords[i-1];
            var nextChord = i === solution.chords.length - 1 ? undefined : solution.chords[i+1];
            //Utils.log("curChord:",curChord)
            if (durations !== undefined) {
                var dur = durations[i]
            }
            if (i === solution.chords.length - 1)
                lastSegment = true

            function selectSoprano(cursor) {
                cursor.track = 0
            }
            function selectAlto(cursor) {
                cursor.track = 1
            }
            function selectTenor(cursor) {
                cursor.track = 4
            }
            function selectBass(cursor) {
                cursor.track = 5
            }
            if (durations !== undefined) {
                cursor.setDuration(dur[0], dur[1])
            } else {
                cursor.setDuration(curChord.duration[0], curChord.duration[1])
            }
            selectSoprano(cursor)
            cursor.addNote(curChord.sopranoNote.pitch, false)
            if (!lastSegment)
                cursor.prev()

            if (durations !== undefined) {
                cursor.setDuration(dur[0], dur[1])
            } else {
                cursor.setDuration(curChord.duration[0], curChord.duration[1])
            }
            addComponentToScore(cursor, curChord.sopranoNote.chordComponent.toXmlString())
            selectAlto(cursor)
            cursor.addNote(curChord.altoNote.pitch, false)
            if (!lastSegment)
                cursor.prev()

            if (durations !== undefined) {
                cursor.setDuration(dur[0], dur[1])
            } else {
                cursor.setDuration(curChord.duration[0], curChord.duration[1])
            }
            addComponentToScore(cursor, curChord.altoNote.chordComponent.toXmlString())
            selectTenor(cursor)
            cursor.addNote(curChord.tenorNote.pitch, false)
            if (!lastSegment)
                cursor.prev()

            if (durations !== undefined) {
                cursor.setDuration(dur[0], dur[1])
            } else {
                cursor.setDuration(curChord.duration[0], curChord.duration[1])
            }
            addComponentToScore(cursor, curChord.tenorNote.chordComponent.toXmlString())
            selectBass(cursor)

            if(configuration.enableChordSymbolsPrinting){
                var text = newElement(Element.HARMONY)
                text.text = curChord.harmonicFunction.getSimpleChordName();


                if(prevChord !== undefined && nextChord !== undefined){
                    if(curChord.harmonicFunction.key !== undefined){
                        if(prevChord.harmonicFunction.key !== curChord.harmonicFunction.key){
                            text.text = text.text[0] + "lb" + text.text.slice(1);
                        }
                        if(nextChord.harmonicFunction.key !== curChord.harmonicFunction.key){
                            text.text = text.text + "rb";
                        }
                    }
                }

                if(prevChord !== undefined)
                    if(prevChord.harmonicFunction.isDelayRoot()) text.text = "";
                text.offsetY = 7;
                text.placement = Placement.BELOW;
            }
            cursor.add(text);
            cursor.addNote(curChord.bassNote.pitch, false)
        }

        //sth was not working when I added this in upper "for loop"
        cursor.rewind(0)
        for (var i = 0; i < solution.chords.length; i++) {
            addComponentToScore(cursor,
                                solution.chords[i].bassNote.chordComponent.toXmlString())
            selectSoprano(cursor)
//            console.log(cursor.element)
            cursor.element.notes[0].tpc = Utils.convertToTpc(solution.chords[i].sopranoNote)
            selectAlto(cursor)
            cursor.element.notes[0].tpc = Utils.convertToTpc(solution.chords[i].altoNote)
            selectTenor(cursor)
            cursor.element.notes[0].tpc = Utils.convertToTpc(solution.chords[i].tenorNote)
            selectBass(cursor)
            cursor.element.notes[0].tpc = Utils.convertToTpc(solution.chords[i].bassNote)
            cursor.next()
        }
    }

    function prepareSopranoHarmonizationExercise(functionsList, punishmentRatios) {

        var mode = tab3.item.getSelectedMode()
        //should be read from input
        var cursor = curScore.newCursor()
        cursor.rewind(0)
        var sopranoNote, key
        var durations = []
        var lastBaseNote, lastPitch
        var notes = []
        var measure_notes = []
        var meter = [cursor.measure.timesigActual.numerator, cursor.measure.timesigActual.denominator]
        var measureDurationTick = (division * (4 / meter[1])) * meter[0]
        var measures = []
        do {
            if(cursor.tick % measureDurationTick === 0 && cursor.tick !== 0){
                measures.push(new Note.Measure(measure_notes))
                measure_notes = []
            }

            durations.push(
                        [cursor.element.duration.numerator, cursor.element.duration.denominator])
            lastBaseNote = getBaseNote(Utils.mod(cursor.element.notes[0].tpc + 1, 7))
            lastPitch = cursor.element.notes[0].pitch
            sopranoNote = new Note.Note(lastPitch, lastBaseNote, 0, [cursor.element.duration.numerator, cursor.element.duration.denominator])
            //console.log("new Note.Note(" + lastPitch + ", " + lastBaseNote +", 0,
            //[" + cursor.element.duration.numerator + ", " + cursor.element.duration.denominator + "])"   )
            notes.push(sopranoNote)
            measure_notes.push(sopranoNote)
        } while (cursor.next())
        measures.push(new Note.Measure(measure_notes))
        var key
        if (mode === "major")
            key = Consts.majorKeyBySignature(curScore.keysig)
        else
            key = Consts.minorKeyBySignature(curScore.keysig)
        var sopranoExercise = new SopranoExercise.SopranoExercise(mode, key,
                                                                  meter, notes,
                                                                  durations, measures,
                                                                  functionsList)

        return sopranoExercise;

    }

    function addComponentToScore(cursor, componentValue) {
        if(!configuration.enableChordComponentsPrinting)
            return
        var component = newElement(Element.FINGERING)
        component.text = componentValue
        curScore.startCmd()
        cursor.add(component)
        curScore.endCmd()
    }

    function figuredBassSolve() {

        try {
            var ex = read_figured_bass()
            var translator = new Translator.BassTranslator()
            //Utils.log("ex",JSON.stringify(ex))

            var exerciseAndBassline = translator.createExerciseFromFiguredBass(ex)
            //Utils.log("Translated exercise",JSON.stringify(exerciseAndBassline[0]))
            var solver = new Solver.Solver(exerciseAndBassline[0], exerciseAndBassline[1], undefined,
                !configuration.enableCorrector, !configuration.enablePrechecker)

            var solution = solver.solve()
            var solution_date = get_solution_date()
            //Utils.log("Solution:", JSON.stringify(solution))

            prepare_score_for_solution(filePath, solution, solution_date, false, "_bass")

            fill_score_with_solution(solution, ex.durations)
        } catch (error) {
            showError(error)
        }
    }

    function isFiguredBassScore() {
        if (curScore === null) {
            throw new Errors.FiguredBassInputError(
                  "No score is opened!"
                  )
        }

        var cursor = curScore.newCursor()
        cursor.rewind(0)
        var metre = [cursor.measure.timesigActual.numerator, cursor.measure.timesigActual.denominator]
        var measureDurationTick = (division * (4 / metre[1])) * metre[0]
        var vb = new Consts.VoicesBoundary()
        var elementCounter = 0
        var tracks = [1,4,5]
        for(var i = 0; i < tracks.length; i++){
            cursor.track = tracks[i]
            if(cursor.element !== null){
                  throw new Errors.FiguredBassInputError(
                        "Score should contain only one voice: bass!"
                        )
            }
        }
        cursor.track = 0
        var measureCounter = 0
        do{
            if(cursor.tick >= measureCounter*measureDurationTick){
                measureCounter++
                elementCounter = 0
            }
            elementCounter++
            if(!Utils.isDefined(cursor.element.noteType)){
                  throw new Errors.FiguredBassInputError(
                        "Forbidden element in "+measureCounter+" measure at "+elementCounter+" position from its beginning",
                        "Score should contain only notes (no rests etc.)"
                        )
            }
            var currentPitch = cursor.element.notes[0].pitch
            if(currentPitch > vb.bassMax || currentPitch < vb.bassMin){
                  throw new Errors.FiguredBassInputError(
                        "Bass note not in voice scale in "+measureCounter+" measure at "+elementCounter+" position from its beginning"
                        )
            }
            if(cursor.element.notes.length > 1){
                  throw new Errors.FiguredBassInputError(
                        "Forbidden element in "+measureCounter+" measure at "+elementCounter+" position from its beginning",
                        "Score should contain only one voice"
                        )
            }
            if (typeof cursor.element.parent.annotations[0] !== "undefined") {
                var readSymbols = cursor.element.parent.annotations[0].text
                if (!Parser.check_figured_bass_symbols(readSymbols))
                    throw new Errors.FiguredBassInputError("Wrong symbols "+readSymbols,"In "+measureCounter+" measure at "+elementCounter+" position from its beginning")
            }
            var currentMetre = [cursor.measure.timesigActual.numerator, cursor.measure.timesigActual.denominator]
            if(currentMetre[0] !== metre[0] || currentMetre[1] !== metre[1]){
                  throw new Errors.FiguredBassInputError(
                        "Metre changes are not supported",
                        "Forbidden metre change for "+currentMetre[0]+"/"+currentMetre[1]+" in "+measureCounter+" measure at "+elementCounter+" position from its beginning"
                        )
            }
            if(cursor.element.notes[0].tieForward !== null){
                  throw new Errors.FiguredBassInputError(
                        "Ties are not supported",
                        "Not supported tie in "+measureCounter+" measure at "+elementCounter+" position from its beginning"
                        )
            }
        } while(cursor.next())
    }

    function isSopranoScore() {
                if (curScore === null) {
                    throw new Errors.SopranoInputError(
                          "No score is opened!"
                          )
                }

                var cursor = curScore.newCursor()
                cursor.rewind(0)
                var metre = [cursor.measure.timesigActual.numerator, cursor.measure.timesigActual.denominator]
                var measureDurationTick = (division * (4 / metre[1])) * metre[0]
                var vb = new Consts.VoicesBoundary()
                var elementCounter = 0
                var tracks = [1,4,5]
                for(var i = 0; i < tracks.length; i++){
                cursor.track = tracks[i]
                    if(cursor.element !== null){
                        throw new Errors.SopranoInputError(
                              "Score should contain only one voice: soprano!"
                        )
                    }
                }
                cursor.track = 0
                var measureCounter = 0
                do{
                    if(cursor.tick >= measureCounter*measureDurationTick){
                        measureCounter++
                        elementCounter = 0
                    }    
                    elementCounter++
                    if(!Utils.isDefined(cursor.element.noteType)){
                          throw new Errors.SopranoInputError(
                                "Forbidden element in "+measureCounter+" measure at "+elementCounter+" position from its beginning",
                                "Score should contain only notes (no rests etc.)"
                                )
                    }
                    if(cursor.element.notes.length > 1){
                          throw new Errors.SopranoInputError(
                                "Forbidden element in "+measureCounter+" measure at "+elementCounter+" position from its beginning",
                                "Score should contain only one voice"
                                )
                    }
                    var currentPitch = cursor.element.notes[0].pitch
                    if(currentPitch > vb.sopranoMax || currentPitch < vb.sopranoMin){
                          throw new Errors.SopranoInputError(
                                "Soprano note not in voice scale in "+measureCounter+" measure at "+elementCounter+" position from its beginning"
                                )
                    }
                    var currentMetre = [cursor.measure.timesigActual.numerator, cursor.measure.timesigActual.denominator]
                    if(currentMetre[0] !== metre[0] || currentMetre[1] !== metre[1]){
                          throw new Errors.SopranoInputError(
                                "Metre changes are not supported",
                                "Forbidden metre change for "+currentMetre[0]+"/"+currentMetre[1]+" in "+measureCounter+" measure at "+elementCounter+" position from its beginning"
                                )
                    }
                    if(cursor.element.notes[0].tieForward !== null){
                          throw new Errors.SopranoInputError(
                                "Ties are not supported",
                                "Not supported tie in "+measureCounter+" measure at "+elementCounter+" position from its beginning"
                                )
                    }
                } while(cursor.next())
    }

    function getPossibleChordsList() {
        var mode = tab3.item.getSelectedMode()
        var x = undefined    
        var T = new HarmonicFunction.HarmonicFunction("T",x,x,x,x,x,x,x,x,mode)
        var S = new HarmonicFunction.HarmonicFunction("S",x,x,x,x,x,x,x,x,mode)

        var D = new HarmonicFunction.HarmonicFunction("D")
   
        var D7 = new HarmonicFunction.HarmonicFunction("D",x,x,x,x,["7"])
        var S6 = new HarmonicFunction.HarmonicFunction("S",x,x,x,x,["6"],x,x,x,mode)

        var neapolitan = new HarmonicFunction.HarmonicFunction("S",2,undefined,"3",[],[],[],true,undefined,Consts.MODE.MINOR)
            
        //side chords
        var Sii = new HarmonicFunction.HarmonicFunction("S",2,x,x,x,x,x,x,x,mode)
        var Diii = new HarmonicFunction.HarmonicFunction("D",3,x,x,x,x,x,x,x,mode)
        var Tiii = new HarmonicFunction.HarmonicFunction("T",3,x,x,x,x,x,x,x,mode)
        var Tvi = new HarmonicFunction.HarmonicFunction("T",6,x,x,x,x,x,x,x,mode)
        var Svi = new HarmonicFunction.HarmonicFunction("S",6,x,x,x,x,x,x,x,mode)
        var Dvii = new HarmonicFunction.HarmonicFunction("D",7,x,x,x,x,x,x,x,mode)    

        //secondary dominants
        var key
        if (mode === Consts.MODE.MAJOR)
            key = Consts.majorKeyBySignature(curScore.keysig)
        else
            key = Consts.minorKeyBySignature(curScore.keysig)
        var Dtoii = D7.copy()
        Dtoii.key = Parser.calculateKey(key, Sii)
        var Dtoiii = D7.copy()
        Dtoiii.key = Parser.calculateKey(key, Diii)
        var Dtoiv = D7.copy()
        Dtoiv.key = Parser.calculateKey(key, S)
        var Dtov = D7.copy()
        Dtov.key = Parser.calculateKey(key, D)
        var Dtovi = D7.copy()
        Dtovi.key = Parser.calculateKey(key, Tvi)
        var Dtovii = D7.copy()
        Dtovii.key = Parser.calculateKey(key, Dvii)

        var chordsList = []
        chordsList.push(T)
        chordsList.push(S)
        chordsList.push(D)

        if (tab3.item.getCheckboxState("D7")) {
            chordsList.push(D7)
        }
        if (tab3.item.getCheckboxState("S6")) {
            chordsList.push(S6)
        }

        if (tab3.item.getCheckboxState("degree2")) {
            chordsList.push(Sii)
            if (tab3.item.getCheckboxState("secondaryD")){
                  chordsList.push(Dtoii)
            }
        }
        if (tab3.item.getCheckboxState("degree3")) {
            chordsList.push(Diii)
            chordsList.push(Tiii)
            if (tab3.item.getCheckboxState("secondaryD")){
                  chordsList.push(Dtoiii)
            }
        }
        if (tab3.item.getCheckboxState("degree6")) {
            chordsList.push(Tvi)
            chordsList.push(Svi)
            if (tab3.item.getCheckboxState("secondaryD")){
                  chordsList.push(Dtovi)
            }
        }
        if (tab3.item.getCheckboxState("degree7")) {
            chordsList.push(Dvii)
            if (tab3.item.getCheckboxState("secondaryD")){
                  chordsList.push(Dtovii)
            }
        }
        if (tab3.item.getCheckboxState("secondaryD")){
            chordsList.push(Dtoiv)
            chordsList.push(Dtov)
        }
        var revolutionChords = []
        if (tab3.item.getCheckboxState("revolution3")){
            for (var i = 0; i < chordsList.length; i++){  
                var tmpHarmonicFunction = chordsList[i].copy()
                tmpHarmonicFunction.revolution = tmpHarmonicFunction.getThird()
                revolutionChords.push(tmpHarmonicFunction)
            }
        }
        if (tab3.item.getCheckboxState("revolution5")){
            for (var i = 0; i < chordsList.length; i++){
                var tmpHarmonicFunction = chordsList[i].copy()
                tmpHarmonicFunction.revolution = tmpHarmonicFunction.getFifth()
                revolutionChords.push(tmpHarmonicFunction)
            }
        }
        
        if (tab3.item.getCheckboxState("neapolitan")) {
            chordsList.push(neapolitan)
        }

        return chordsList.concat(revolutionChords)
    }

    FileIO {
        id: myFileAbc
        onError: Utils.warn(msg + "  Filename = " + myFileAbc.source)
    }


    FileDialog {
        id: fileDialog
        title: qsTr("Please choose a file")
        onAccepted: {
            var filename = fileDialog.fileUrl
            if (filename) {
                myFileAbc.source = filename
                var input_text = String(myFileAbc.read())
                tab1.item.setText(input_text)
            }
        }
    }
    
    function showError(error) {
      while (error.message.length < 120) {
            error.message += " "
      }
      errorDialog.text = error.source !== undefined ? error.source + "\n" : ""
      errorDialog.text +=  error.message + "\n"
      if (error.details !== undefined) {
        if (error.details.length >= 1500) {
            errorDialog.text += error.details.substring(0,1500) + "..."
        } else {
            errorDialog.text += error.details
        }
      }

      if (error.stack !== undefined) {
        if (error.stack.length >= 1500) {
            errorDialog.text += "\n Stack: \n" + error.stack.substring(0,1500) + "..."
        } else {
            errorDialog.text += "\n Stack: \n" + error.stack
        }
      }

      errorDialog.open()
    }


    MessageDialog {
        id: helpHarmonicsDialog
        width: 300
        height: 400
        title: "Help - Harmonic Functions"
        text: "Here you can solve Harmonic Functions exercises.\n" +
        "You can type in exercise or load it with 'Import file' button.\nAfter importing, exercise is editable in the text area.\n"+
        "With button 'Check notation' you can check if input is correct."
        //detailedText: "Detailed text test"
        icon: StandardIcon.Question
        standardButtons: StandardButton.Ok
    }


    MessageDialog {
        id: helpBassDialog
        width: 800
        height: 600
        title: "Help - Figured Bass"
        text: "Here you can solve figured bass exercises.\n" +
        "At first, open a score with only bass voice and figured bass symbols.\n" +
        "Remember to use '#' and 'b' instead of '<' and '>' in symbols and delays.\n" +
        "For more information like supported symbols, please refer to the manual."
        icon: StandardIcon.Information
        standardButtons: StandardButton.Ok
    }


    MessageDialog {
        id: helpSopranoDialog
        width: 800
        height: 600
        title: "Help - Soprano Harmonization"
        text: "Here you can solve soprano harmonization exercises.\n" +
        "At first, open a score with only soprano voice.\n" +
        "You can choose which chords are being used for harmonization, possible revolutions and scale.\n" +
        "With sliders you can choose tolerance of different harmonic rules.\n" +
        "The more percent value, the less rule is taken into account.\n" +
        "0% means that specific rule can not be broken.\n\n" +
        "Important notice:\n" +
        "The more options you choose, the more time it will take to solve an exercise.\n\n" +
        "For more information, please refer to the manual."
        icon: StandardIcon.Information
        standardButtons: StandardButton.Ok
    }

    MessageDialog {
        id: helpSettingsDialog
        width: 800
        height: 600
        title: "Help - Plugin Settings"
        text: "If you want to get more information about specific option, place mouse cursor\n" +
        "over the checkbox - small tip will appear.\n" +
        "For more details please refer to the manual."
        icon: StandardIcon.Information
        standardButtons: StandardButton.Ok
    }


    MessageDialog {
        id: errorDialog
        width: 800
        height: 600
        title: "HarmonySolver - Error"
        text: ""
        icon: StandardIcon.Critical
    }

    MessageDialog {
        id: parseSuccessDialog
        width: 300
        height: 400
        title: "Parse status"
        text: "Parsing exercise was successful. Input is correct."
        icon: StandardIcon.Information
        standardButtons: StandardButton.Ok
    }

    MessageDialog {
        id: emptyExerciseDialog
        width: 300
        height: 400
        title: "Exercise is empty"
        text: "Empty exercise box. \nPlease type in or import one before solving."
        icon: StandardIcon.Warning
        standardButtons: StandardButton.Ok
    }

    Rectangle {

        TabView {
            id: tabView
            width: 550
            height: 550

            Tab {
                title: "Harmonics"
                id: tab1
                active: true

                Rectangle {
                    id: tabRectangle1

                    WorkerScript {
                        id: braveWorker
                        source: "SolverWorker.js"

                        onMessage:  {
                            if(messageObject.type === "progress_notification"){
                                harmonicFunctionsProgressBar.value = messageObject.progress;
                            }
                            else if(messageObject.type === "solution"){
                                var solution = ExerciseSolution.exerciseSolutionReconstruct(messageObject.solution);
                                var solution_date = get_solution_date()
                                prepare_score_for_solution(filePath, solution, solution_date, true, "_hfunc")
                                fill_score_with_solution(solution)
                                buttonRun.enabled = true
                                harmonicFunctionsProgressBar.value = 0
                            }
                            else if(messageObject.type === "error"){
                                buttonRun.enabled = true
                                harmonicFunctionsProgressBar.value = 0
                                showError(messageObject.error)
                            }
                        }
                      }

                    function setText(text) {
                        abcText.text = text
                    }

                    Button {
                        id: buttonHarmonicsHelp
                        text: qsTr("?")
                        anchors.top: tabRectangle1.top
                        anchors.right: tabRectangle1.right
                        anchors.topMargin: 10
                        anchors.rightMargin: 10
                        width: 18
                        height: 20
                        onClicked: {
                            helpHarmonicsDialog.open()
                        }
                        tooltip: "Help"
                    }

                    Label {
                        id: textLabel
                        wrapMode: Text.WordWrap
                        text: qsTr("Provide task below:")
                        font.pointSize: 12
                        anchors.left: tabRectangle1.left
                        anchors.top: tabRectangle1.top
                        anchors.leftMargin: 10
                        anchors.topMargin: 10
                        color: "#000000"
                    }

                    TextArea {
                        id: abcText
                        font.pointSize: 9
                        anchors.top: textLabel.bottom
                        anchors.left: tabRectangle1.left
                        anchors.right: tabRectangle1.right
//                        anchors.bottom: harmonicFunctionsProgressBar.top
                        anchors.topMargin: 10
                        anchors.bottomMargin: 10
                        anchors.leftMargin: 10
                        anchors.rightMargin: 10
                        width: parent.width
                        height: 390
                        wrapMode: TextEdit.WrapAnywhere
                        textFormat: TextEdit.PlainText
                    }

                    ProgressBar {
                        id: harmonicFunctionsProgressBar
                        value: 0
                        anchors.left: tabRectangle1.left
                        anchors.right: tabRectangle1.right
                        anchors.bottom: buttonOpenFile.top
                        anchors.bottomMargin: 10
                        anchors.leftMargin: 20
                        anchors.rightMargin: 20
                        height: 15
                        width: parent.width - 40
                    }

                    Button {
                        id: buttonOpenFile
                        text: qsTr("Import file")
                        anchors.bottom: tabRectangle1.bottom
                        anchors.left: tabRectangle1.left
                        anchors.topMargin: 10
                        anchors.bottomMargin: 10
                        anchors.leftMargin: 10
                        onClicked: {
                            fileDialog.open()
                        }
                        tooltip: "Import file with harmonic functions exercise."
                    }

                    Button {
                        id: buttonParse
                        text: qsTr("Check notation")
                        anchors.bottom: tabRectangle1.bottom
                        anchors.left: buttonOpenFile.right
                        anchors.topMargin: 10
                        anchors.bottomMargin: 10
                        anchors.leftMargin: 10
                        onClicked: {
                            var input_text = abcText.text
                            if (input_text === undefined || input_text === "") {
                              emptyExerciseDialog.open()
                            } else {
                                try{
                                    exercise = Parser.parse(input_text)
                                    parseSuccessDialog.open()
                                } catch (error) {
                                    showError(error)
                                }
                            }
                        }
                        tooltip: "Check if input is correct"
                    }

                    Button {
                        id: buttonRun
                        text: qsTr("Solve")
                        //enabled: exerciseLoaded
                        anchors.bottom: tabRectangle1.bottom
                        anchors.right: tabRectangle1.right
                        anchors.topMargin: 10
                        anchors.bottomMargin: 10
                        anchors.rightMargin: 10
                        anchors.leftMargin: 10
                        onClicked: {
                            //parsing
                            exerciseLoaded = false
                            var input_text = abcText.text
                            if (input_text === undefined || input_text === "") {
                              emptyExerciseDialog.open()
                            } else {
                                try{
                                    exercise = Parser.parse(input_text)
                                    exerciseLoaded = true
                                } catch (error) {
                                    showError(error)
                                }
                            }

                            //solving
                            if (exerciseLoaded) {
                                try {
                                    exercise = Parser.parse(input_text)
                                    braveWorker.sendMessage(new SolverRequestDto.SolverRequestDto(
                                        exercise,
                                        undefined,
                                        undefined,
                                        !configuration.enableCorrector,
                                        !configuration.enablePrechecker,
                                        undefined
                                    ))
                                    buttonRun.enabled = false;
                                } catch (error) {
                                    buttonRun.enabled = true
                                    harmonicFunctionsProgressBar.value = 0
                                    showError(error)
                                }
                            }
                        }
                    }
                }
            }
            Tab {
                title: "Bass"

                Rectangle {
                    id: tabRectangle2

                    WorkerScript {
                        id: busyWorker
                        source: "SolverWorker.js"

                        onMessage:  {
                            if(messageObject.type === "progress_notification"){
                                figuredBassProgressBar.value = messageObject.progress;
                            }
                            else if(messageObject.type === "solution"){
                                var solution = ExerciseSolution.exerciseSolutionReconstruct(messageObject.solution);
                                var solution_date = get_solution_date()
//                                Utils.log("Solution:", JSON.stringify(solution))
                                prepare_score_for_solution(filePath, solution, solution_date, false, "_bass")
                                fill_score_with_solution(solution, messageObject.durations)
                                buttonRunFiguredBass.enabled = true
                                figuredBassProgressBar.value = 0
                            }
                            else if(messageObject.type === "error"){
                                buttonRunFiguredBass.enabled = true
                                figuredBassProgressBar.value = 0
                                showError(messageObject.error)
                            }
                        }
                     }

                    Button {
                        id: buttonBassHelp
                        text: qsTr("?")
                        anchors.top: tabRectangle2.top
                        anchors.right: tabRectangle2.right
                        anchors.topMargin: 10
                        anchors.rightMargin: 10
                        width: 18
                        height: 20
                        onClicked: {
                            helpBassDialog.open()
                        }
                        tooltip: "Help"
                    }
                 
                        Label {
                            id: bassInfoLabel
                            wrapMode: Text.WordWrap
                            text: qsTr("Remember:\nClick on a note and use shortcut ctrl+G to add figured bass symbol to the bass note.")
                            font.pointSize: 12
                            anchors.left: tabRectangle2.left
                            anchors.top: tabRectangle2.top
                            anchors.leftMargin: 10
                            anchors.topMargin: 10
                            color: "#000000"
                        }
                    
                    ProgressBar {
                        id: figuredBassProgressBar
                        value: 0
                        anchors.left: tabRectangle2.left
                        anchors.right: tabRectangle2.right
                        anchors.bottom: buttonRunFiguredBass.top
                        anchors.bottomMargin: 10
                        anchors.leftMargin: 20
                        anchors.rightMargin: 20
                        height: 15
                        width: parent.width - 40
                    }

                    Button {
                        id: buttonRunFiguredBass
                        text: qsTr("Solve")
                        anchors.bottomMargin: 10
                        anchors.rightMargin: 10
                        anchors.right: tabRectangle2.right
                        anchors.bottom: tabRectangle2.bottom
                        onClicked: {
                            try {
                                isFiguredBassScore()
                                var ex = read_figured_bass()
                                var translator = new Translator.BassTranslator()
                                //Utils.log("ex",JSON.stringify(ex))

                                var exerciseAndBassline = translator.createExerciseFromFiguredBass(ex)
                                //Utils.log("Translated exercise",JSON.stringify(exerciseAndBassline[0]))

                                busyWorker.sendMessage(new SolverRequestDto.SolverRequestDto(
                                    exerciseAndBassline[0],
                                    exerciseAndBassline[1],
                                    undefined,
                                    !configuration.enableCorrector,
                                    !configuration.enablePrechecker,
                                    ex.durations
                                ))
                                buttonRunFiguredBass.enabled = false
                            } catch (error) {
                                buttonRunFiguredBass.enabled = true
                                figuredBassProgressBar.value = 0
                                showError(error)
                            }
                        }
                    }

                }
            }
            Tab {

                title: "Soprano"
                id: tab3

                Rectangle {
                    id: tabRectangle3

                    Button {
                        id: buttonSopranoHelp
                        text: qsTr("?")
                        anchors.top: tabRectangle3.top
                        anchors.right: tabRectangle3.right
                        anchors.topMargin: 10
                        anchors.rightMargin: 10
                        width: 18
                        height: 20
                        onClicked: {
                            helpSopranoDialog.open()
                        }
                        tooltip: "Help"
                    }

                    function getCheckboxState(function_name) {
                        if (function_name === "D7") {
                            return d7Checkbox.checkedState === Qt.Checked
                        }
                        if (function_name === "S6") {
                            return s6Checkbox.checkedState === Qt.Checked
                        }
                        if (function_name === "neapolitan") {
                            return neapolitanCheckbox.checkedState === Qt.Checked
                        }
                        if (function_name === "degree2") {
                            return degree2Checkbox.checkedState === Qt.Checked
                        }
                        if (function_name === "degree3") {
                            return degree3Checkbox.checkedState === Qt.Checked
                        }
                        if (function_name === "degree6") {
                            return degree6Checkbox.checkedState === Qt.Checked
                        }
                        if (function_name === "degree7") {
                            return degree7Checkbox.checkedState === Qt.Checked
                        }
                        if (function_name === "secondaryD") {
                            return secondaryDCheckbox.checkedState === Qt.Checked
                        }
                        if (function_name === "revolution3") {
                            return revolution3Checkbox.checkedState === Qt.Checked
                        }
                        if (function_name === "revolution5") {
                            return revolution5Checkbox.checkedState === Qt.Checked
                        }
                    }

                    function getSelectedMode(){
                        if (useMinorCheckbox.checked) {
                            return Consts.MODE.MINOR;
                        } else {
                            return Consts.MODE.MAJOR;
                        }
                    }

                    /*Label {
                        id: textLabelSoprano
                        wrapMode: Text.WordWrap
                        text: qsTr("Select all harmonic functions you want to use:")
                        anchors.left: tabRectangle3.left
                        anchors.top: tabRectangle3.top
                        anchors.leftMargin: 20
                        anchors.topMargin: 20
                        font.pointSize: 12
                    }*/
                    Row{
                        id: harmonicFunctionRow
                        anchors.left: tabRectangle3.left
                        anchors.leftMargin: 10
                        anchors.top: tabRectangle3.top
                        anchors.topMargin: 10
                        anchors.right: tabRectangle3.right
                        spacing: 16
                   

                        Column {
                            id: triadColumn
                             Text {
                                  id: triadTextLabel
                                  text: qsTr("Triad")
                            }
                            CheckBox {
                                checked: true
                                enabled: false
                                text: "<font color='#000000'>T</font>"
                            }
                            CheckBox {
                                checked: true
                                enabled: false
                                text: "<font color='#000000'>S</font>"
                            }
                            CheckBox {
                                checked: true
                                enabled: false
                                text: "<font color='#000000'>D</font>"
                            }
                        }

                        Column {
                            id: extraChordsColumn
                            Text {
                                  id: extraChordsTextLabel
                                  text: qsTr("Extra Chords")
                            }
                            CheckBox {
                                id: s6Checkbox
                                checked: false
                                text: "<font color='#000000'>S6</font>"
                            }
                            CheckBox {
                                id: d7Checkbox
                                checked: false
                                text: "<font color='#000000'>D7</font>"
                            }
                            CheckBox {
                                id: neapolitanCheckbox
                                checked: false
                                text: "<font color='#000000'>neapolitan chord</font>"
                            }
                            CheckBox {
                                id: secondaryDCheckbox
                                checked: false
                                text: "<font color='#000000'>secondary dominants</font>"
                            }
                        }

                        Column {
                            id: sideChordsColumn
                            Text {
                                id: sideChordsTextLabelt
                                text: qsTr("Side Chords")
                            }
                            CheckBox {
                                id: degree2Checkbox
                                checked: false
                                text: "<font color='#000000'>II</font>"

                            }
                            CheckBox {
                                id: degree3Checkbox
                                checked: false
                                text: "<font color='#000000'>III</font>"
                            }
                            CheckBox {
                                id: degree6Checkbox
                                checked: false
                                text: "<font color='#000000'>VI</font>"
                            }
                            CheckBox {
                                id: degree7Checkbox
                                checked: false
                                text: "<font color='#000000'>VII</font>"
                            }
                        }

                        Column {
                            id: revolutionColumn
                            Text {
                                id: revolutionTextLabelt
                                text: qsTr("Revolutions")
                            }
                            CheckBox {
                                id: revolution3Checkbox
                                checked: false
                                text: "<font color='#000000'>3</font>"
                            }
                            CheckBox {
                                id: revolution5Checkbox
                                checked: false
                                text: "<font color='#000000'>5</font>"
                            }
                        }

                        Column {
                            id: scaleColumn
                            ExclusiveGroup { id: scaleGroup }
                            Text {
                                id: scaleTextLabelt
                                text: qsTr("Scale")
                            }
                            RadioButton {
                                id: useMajorCheckbox
                                checked: true
                                text: "<font color='#000000'>major</font>"
                                exclusiveGroup: scaleGroup
                            }
                            RadioButton {
                                id: useMinorCheckbox
                                text: "<font color='#000000'>minor</font>"
                                exclusiveGroup: scaleGroup
                            }
                        }
                    }
                    Row{
                        id: ruleRaw
                        anchors.left: tabRectangle3.left
                        anchors.leftMargin: 10
                        anchors.top: harmonicFunctionRow.bottom
                        anchors.topMargin: 5
                        anchors.right: tabRectangle3.right
                        spacing: 30
                        
                        Column {
                              spacing: 0
                              Column {

                                    Text {
                                          text: qsTr("Parallel Octaves")
                                    }
                                    Slider {
                                          id: consecutiveOctavesSlider
                                          maximumValue: 100
                                          minimumValue: 0
                                          stepSize: 1.0

                                    }
                                    Text {
                                          text: qsTr(consecutiveOctavesSlider.value+" %")
                                    }
                              }
                              Column {      
                                    Text {
                                          text: qsTr("Parallel Fifths")
                                    }
                                    Slider {
                                          id: consecutiveFifthsSlider
                                          maximumValue: 100
                                          minimumValue: 0
                                          stepSize: 1.0
                                    }
                                    Text {
                                          text: qsTr(consecutiveFifthsSlider.value+" %")
                                    }
                              }
                              Column {      
                                    Text {
                                          text: qsTr("Crossing Voices")
                                    }
                                    Slider {
                                          id: crossingVoicesSlider
                                          maximumValue: 100
                                          minimumValue: 0
                                          stepSize: 1.0
                                    }
                                    Text {
                                          text: qsTr(crossingVoicesSlider.value+" %")
                                    }
                              }
                              Column {      
                                    Text {
                                          text: qsTr("One Direction")
                                    }
                                    Slider {
                                          id: oneDirectionSlider
                                          maximumValue: 100
                                          minimumValue: 0
                                          stepSize: 1.0
                                          }
                                    Text {
                                          text: qsTr(oneDirectionSlider.value+" %")
                                    }
                              }    
                              Column {  
                                    Text {
                                          text: qsTr("Forbidden jump")
                                    }
                                    Slider {
                                          id: forbiddenJumpSlider
                                          maximumValue: 100
                                          minimumValue: 0
                                          stepSize: 1.0
                                    }
                                    Text {
                                          text: qsTr(forbiddenJumpSlider.value+" %")
                                    }
                              }      
                        }
                        Column {
                              spacing: 20.6
                              Column {
                                    Text {
                                          text: qsTr("Hidden Octaves")
                                    }
                                    Slider {
                                          id: hiddenOctavesSlider
                                          maximumValue: 100
                                          minimumValue: 0
                                          stepSize: 1.0
                                    }
                                    Text {
                                          text: qsTr(hiddenOctavesSlider.value+" %")
                                    }
                              }
                              Column {
                                    Text {
                                          text: qsTr("False Relation")
                                    }
                                    Slider {
                                          id: falseRelationSlider
                                          maximumValue: 100
                                          minimumValue: 0
                                          stepSize: 1.0
                                    }
                                    Text {
                                          text: qsTr(falseRelationSlider.value+" %")
                                    }
                              }
                              Column {
                                    Text {
                                          text: qsTr("Repeated function")
                                    }
                                    Slider {
                                          id: sameFunctionCheckConnectionSlider
                                          maximumValue: 100
                                          minimumValue: 0
                                          stepSize: 1.0
                                    }      
                                    Text {
                                          text: qsTr(sameFunctionCheckConnectionSlider.value+" %")
                                    }
                              }
                              Column {      
                                    Text {
                                          text: qsTr("Illegal Doubled Third")
                                    }
                                    Slider {
                                          id: illegalDoubledThirdSlider
                                          maximumValue: 100
                                          minimumValue: 0
                                          stepSize: 1.0
                                    }
                                    Text {
                                          text: qsTr(illegalDoubledThirdSlider.value+" %")
                                    }
                              }
                        }
                        
                    }
                    
                    function getRatioFromSlider(x){
                        return (100 - x.value) / 100
                    }
                    
                    function getPunishmentRatios(){
                        var punishmentRatios = {};
                        punishmentRatios[Consts.CHORD_RULES.ConcurrentOctaves] = getRatioFromSlider(consecutiveOctavesSlider)
                        punishmentRatios[Consts.CHORD_RULES.ConcurrentFifths] = getRatioFromSlider(consecutiveFifthsSlider)
                        punishmentRatios[Consts.CHORD_RULES.CrossingVoices] = getRatioFromSlider(crossingVoicesSlider)
                        punishmentRatios[Consts.CHORD_RULES.OneDirection] = getRatioFromSlider(oneDirectionSlider)
                        punishmentRatios[Consts.CHORD_RULES.ForbiddenJump] = getRatioFromSlider(forbiddenJumpSlider)
                        punishmentRatios[Consts.CHORD_RULES.HiddenOctaves] = getRatioFromSlider(hiddenOctavesSlider)
                        punishmentRatios[Consts.CHORD_RULES.FalseRelation] = getRatioFromSlider(falseRelationSlider)
                        punishmentRatios[Consts.CHORD_RULES.SameFunctionCheckConnection] = getRatioFromSlider(sameFunctionCheckConnectionSlider)
                        punishmentRatios[Consts.CHORD_RULES.IllegalDoubledThird] = getRatioFromSlider(illegalDoubledThirdSlider)

                        return punishmentRatios
                    }

                    WorkerScript {
                        id: amazingWorker
                        source: "SopranoSolverWorker.js"

                        onMessage:  {
                            if(messageObject.type === "progress_notification"){
                                sopranoProgressBar.value = messageObject.progress;
                            }
                            else if(messageObject.type === "solution"){
                                var solution = ExerciseSolution.exerciseSolutionReconstruct(messageObject.solution);
                                if(solution.success) {
                                    var solution_date = get_solution_date()
                                    prepare_score_for_solution(filePath, solution, solution_date, false, "_soprano")
                                    fill_score_with_solution(solution, messageObject.durations)
                                }
                                buttorSoprano.enabled = true
                                sopranoProgressBar.value = 0
                            }
                            else if(messageObject.type === "error"){
                                buttorSoprano.enabled = true
                                sopranoProgressBar.value = 0
                                showError(messageObject.error)
                            }
                        }
                    }

                    ProgressBar {
                        id: sopranoProgressBar
                        value: 0
                        anchors.left: tabRectangle3.left
                        anchors.right: tabRectangle3.right
                        anchors.bottom: buttorSoprano.top
                        anchors.topMargin: 10
                        anchors.bottomMargin: 10
                        anchors.leftMargin: 20
                        anchors.rightMargin: 20
                        height: 15
                        width: parent.width - 40
                    }

                    Button {

                        id: buttorSoprano
                        text: qsTr("Solve")
                        anchors.bottom: tabRectangle3.bottom
                        anchors.right: tabRectangle3.right
                        anchors.topMargin: 10
                        anchors.bottomMargin: 10
                        anchors.rightMargin: 10
                        onClicked: {
                            try{
                                isSopranoScore()
                                var func_list = getPossibleChordsList()
                                var punishments = getPunishmentRatios()
                                var exercise = prepareSopranoHarmonizationExercise(func_list);
                                amazingWorker.sendMessage(
                                    new SopranoSolverRequestDto.SopranoSolverRequestDto(
                                        exercise,
                                        punishments
                                    )
                                )
                                buttorSoprano.enabled = false
                            } catch (error) {
                                buttorSoprano.enabled = true
                                sopranoProgressBar.value = 0
                                showError(error)
                           }
                        }
                    }
                }
            }
            Tab {

                title: "Settings"
                id: tab4

                function showConfiguration(){
                    savePathTextArea.text = configuration.solutionPath
                }

                Rectangle{
                    id: tabRectangle4

                    Button {
                        id: buttonSettingsHelp
                        text: qsTr("?")
                        anchors.top: tabRectangle4.top
                        anchors.right: tabRectangle4.right
                        anchors.topMargin: 10
                        anchors.rightMargin: 10
                        width: 18
                        height: 20
                        onClicked: {
                            helpSettingsDialog.open()
                        }
                        tooltip: "Help"
                    }

                    Label {
                        id: savedPathLabel
                        anchors.top: tabRectangle4.top
                        anchors.left: tabRectangle4.left
                        anchors.topMargin: 10
                        anchors.leftMargin: 15
                        text: qsTr("Solutions save path")
                        color: "#000000"
                    }

                    TextField {
                        id: savedPathTextField
                        anchors.top: savedPathLabel.bottom
                        anchors.left: tabRectangle4.left
                        anchors.leftMargin: 10
                        width: 200
                        height: 25
                        readOnly: true
                        text: configuration.solutionPath
                    }

                    FileDialog {
                        id: selectSolutionPathDirDialog
                        title: "Please choose a directory"
                        folder: filePath
                        selectFolder: true
                        onAccepted: {
                            var path = selectSolutionPathDirDialog.fileUrl.toString().slice(8)
                            savedPathTextField.text = path
                            configuration.solutionPath = path
                            savePluginConfiguration()
                        }
                    }

                    Button{
                        id: selectSolutionPath
                        anchors.left: savedPathTextField.right
                        anchors.top: savedPathTextField.top
                        anchors.leftMargin: 10
                        text: qsTr("Select")
                        onClicked: {
                            selectSolutionPathDirDialog.open()
                        }
                    }


                    Column {
                        id: exerciseOptionsColumn
                        anchors.top: savedPathTextField.bottom
                        anchors.left: tabRectangle4.left
                        anchors.leftMargin: 10
                        anchors.topMargin: 20
                        spacing: 10
                        CheckBox {
                            id: printCheckbox
                            checked: configuration.enableChordSymbolsPrinting
                            text: "<font color='#000000'>print chord symbols</font>"
                            tooltip: "Enable printing chord symbols under the chords in score"
                            onCheckedChanged: function() {
                                    if (this.checkedState === Qt.Checked){
                                          configuration.enableChordSymbolsPrinting = true
                                          savePluginConfiguration()
                                          return Qt.Unchecked
                                    }else{
                                          configuration.enableChordSymbolsPrinting = false
                                          savePluginConfiguration()
                                          return Qt.Checked
                                    }
                            }
                        }
                        CheckBox {
                             id: printComponentsCheckbox
                             checked: configuration.enableChordComponentsPrinting
                             text: "<font color='#000000'>print chord components</font>"
                             tooltip: "Enable printing chord components next to every note"
                             onCheckedChanged: function() {
                                    if (this.checkedState === Qt.Checked){
                                          configuration.enableChordComponentsPrinting = true
                                          savePluginConfiguration()
                                          return Qt.Unchecked
                                    }else{
                                          configuration.enableChordComponentsPrinting = false
                                          savePluginConfiguration()
                                          return Qt.Checked
                                    }
                            }
                        }
                        CheckBox {
                            id: precheckCheckbox
                            checked: configuration.enablePrechecker
                            text: "<font color='#000000'>precheck for unavoidable errors</font>"
                            tooltip: "Enables additional step of solving - preckeck.\n" + 
                            "During precheck plugin checks connections between all chords.\n" + 
                            "If there is some problem, plugin will wand you about that giving chords position,\n" + 
                            "their parameters and rules, that were broken during checking that connection.\n" +
                            "This option may increase solving time by around 5 seconds."
                            onCheckedChanged: function() {
                                    if (this.checkedState === Qt.Checked){
                                          configuration.enablePrechecker = true
                                          savePluginConfiguration()
                                          return Qt.Unchecked
                                    }else{
                                          configuration.enablePrechecker = false
                                          savePluginConfiguration()
                                          return Qt.Checked
                                    }
                            }
                        }
                        CheckBox {
                             id: correctCheckbox
                             checked: configuration.enableCorrector
                             text: "<font color='#000000'>correct given exercise</font>"
                             tooltip: "Enable exercise correction by tweaking chords revolution and omit parameters\n"
                              + "to avoid breaking harmonic rules." +
                              "\nFor example " +
                             "adds 3 to revolution after chord with 7 in bass."
                             onCheckedChanged: function() {
                                    if (this.checkedState === Qt.Checked){
                                          configuration.enableCorrector = true
                                          savePluginConfiguration()
                                          return Qt.Unchecked
                                    }else{
                                          configuration.enableCorrector = false
                                          savePluginConfiguration()
                                          return Qt.Checked
                                    }
                            }
                        }
                    }

                    //istnieje ale nie musi
                    Button {
                        id: saveConfigurationButton
                        text: qsTr("Save Configuration")
                        anchors.bottom: tabRectangle4.bottom
                        anchors.left: tabRectangle4.left
                        anchors.bottomMargin: 10
                        anchors.leftMargin: 10
                        onClicked: {
                            savePluginConfiguration()
                        }
                    }

                }
            }
        }
    }
}
