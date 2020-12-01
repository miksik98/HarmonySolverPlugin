.import "../commons/Consts.js" as Consts

function Scale(baseNote) {
    this.baseNote = baseNote
}

function MajorScale(baseNote, tonicPitch) {
    Scale.call(this.baseNote)
    this.tonicPitch = tonicPitch
    this.pitches = [0, 2, 4, 5, 7, 9, 11]
}

function MajorScale(key){
    Scale.call(this, Consts.keyStrBase[key])
    this.tonicPitch = Consts.keyStrPitch[key]
    this.pitches = [0, 2, 4, 5, 7, 9, 11]
}

function MinorScale(baseNote, tonicPitch) {
    Scale.call(this.baseNote)
    this.tonicPitch = tonicPitch
    this.pitches = [0, 2, 3, 5, 7, 8, 10]
}

function MinorScale(key){
    Scale.call(this, Consts.keyStrBase[key])
    this.tonicPitch = Consts.keyStrPitch[key]
    this.pitches = [0, 2, 3, 5, 7, 8, 10]
}