.import "../utils/Utils.js" as Utils

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
        Utils.error("Invalid chord component string - cannot contains both < and >");
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