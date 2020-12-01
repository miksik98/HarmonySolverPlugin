.import "../model/ChordComponent.js" as ChordComponent

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

        var chordComponent = new ChordComponent.ChordComponent(chordComponentString, sequence, isDown);
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