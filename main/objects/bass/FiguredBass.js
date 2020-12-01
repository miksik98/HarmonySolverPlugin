var ALTERATION_TYPE = {
  SHARP : "#",
  FLAT : 'b',
  NATURAL : 'h'
};

function BassSymbol(component, alteration){
    this.component = component;
    this.alteration = alteration;

    this.toString = function() {
        return "Component: " + this.component + " Alteration: " + this.alteration
    }

    this.equals = function (other) {
        return this.component === other.component && this.alteration === other.alteration
    }
}

function FiguredBassElement(bassNote, symbols, delays) {

    this.bassNote = bassNote;
    this.symbols = symbols; //list of BassSymbols
    this.delays = delays;


    this.toString = function () {
        return "Bass note: "+ this.bassNote + " Symbols: " + this.symbols + " Delays: " + this.delays
    }

}

function FiguredBassExercise(mode, key, meter, elements, durations) {
    this.mode = mode;
    this.key = key;
    this.meter = meter;
    this.elements = elements;
    this.durations = durations;

    this.toString = function () {
        return "Mode: " + this.mode + " Key: " + this.key + " Meter: " + this.meter + " Elements: " + this.elements + " Durations: " + this.durations
    }
}

