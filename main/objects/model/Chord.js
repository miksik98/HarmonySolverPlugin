.import "../model/Note.js" as Note
.import "../model/HarmonicFunction.js" as HarmonicFunction

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
        Note.noteReconstruct(chord.sopranoNote),
        Note.noteReconstruct(chord.altoNote),
        Note.noteReconstruct(chord.tenorNote),
        Note.noteReconstruct(chord.bassNote),
        HarmonicFunction.harmonicFunctionReconstruct(chord.harmonicFunction)
    )
}

