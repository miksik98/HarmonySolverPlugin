.import "../model/Scale.js" as Scale
.import "../model/ChordComponentManager.js" as ChordComponentManager
.import "../utils/Utils.js" as Utils
.import "../model/HarmonicFunctionValidator.js" as HarmonicFunctionValidator
.import "../commons/Consts.js" as Consts
.import "../commons/Errors.js" as Errors

var DEBUG = false;

function HarmonicFunction2(params, notValidate){
    // Properties:
    // functionName          "T", "S", "D"
    // degree               int
    // position             should be string f.e. "<7" or "7>" or just "7"
    // revolution           should be string f.e. "<6" or "6>" or just "6"
    // delay                delayed components list
    // extra                extra components list [] | ["9", "7>"]
    // omit                 omitted components list [] | ["1", "5"]
    // down                 true or false
    // system               "open" | "close" | undefined
    // mode                 "major" | "minor"
    // key                  string, f.e. "C#", "g#", "Ab"

    //preprocessing zadania wymagał użycia tego samego chord component managera dla danej HF, co w momencie jej inicjalizacji
    this.cm = new ChordComponentManager.ChordComponentManager();
    var cm = this.cm;

    // *****CONSTUCTOR PART 1*****

    this.functionName = params["functionName"];
    this.degree = params["degree"] === undefined ? getDegreeFromFunctionName(this.functionName) : params["degree"];
    this.position = params["position"];
    this.revolution = params["revolution"] === undefined ? "1" : params["revolution"];
    this.delay = params["delay"] === undefined ? [] : params["delay"];
    this.extra = params["extra"] === undefined ? [] : params["extra"];
    this.omit = params["omit"] === undefined ? [] : params["omit"];
    this.down = params["down"] === undefined ? false : params["down"];
    this.system = params["system"];
    this.mode = params["mode"] === undefined ? Consts.MODE.MAJOR : params["mode"];
    this.key = params["key"];
    this.isRelatedBackwards = params["isRelatedBackwards"];

    // *****CONSTUCTOR PART 1 END*****

    function getDegreeFromFunctionName(functionName){
        return {"T":1, "S":4, "D":5}[functionName];
    }

    this.getPrime = function(){
        return cm.chordComponentFromString("1", this.down);
    }

    this.getThird = function(){
        if(this.down === true)
            return cm.chordComponentFromString("3", true);

        var scale = this.mode === Consts.MODE.MAJOR ? new Scale.MajorScale("X") : new Scale.MinorScale("X");
        var thirdPitch = Utils.mod(scale.pitches[Utils.mod(this.degree + 1, 7)] - scale.pitches[Utils.mod(this.degree - 1, 7)], 12);
        return cm.basicChordComponentFromPitch(thirdPitch, false);
    }

    this.getFifth = function (){
        if(this.down === true)
            return cm.chordComponentFromString("5", true);

        var scale = this.mode === Consts.MODE.MAJOR ? new Scale.MajorScale("X") : new Scale.MinorScale("X");
        var fifthPitch = Utils.mod(scale.pitches[Utils.mod(this.degree + 3, 7)] - scale.pitches[Utils.mod(this.degree - 1, 7)], 12);

        return cm.basicChordComponentFromPitch(fifthPitch, false);
    }

    this.getBasicChordComponents = function () {
        return [this.getPrime(), this.getThird(), this.getFifth()];
    };

    this.getBasicChordComponentStrings = function () {
        return [this.getPrime().chordComponentString, this.getThird().chordComponentString, this.getFifth().chordComponentString];
    }

    this.getChordComponentFromStringInThisHfContext = function(chordComponentString) {
        // console.log(chordComponentString);
        // console.log(this.getBasicChordComponents());
        if(Utils.contains(this.getBasicChordComponentStrings(), chordComponentString)){
            if(chordComponentString[0] === '1') return this.getPrime();
            if(chordComponentString[0] === '3') return this.getThird();
            if(chordComponentString[0] === '5') return this.getFifth();
        }
        return cm.chordComponentFromString(chordComponentString, this.down);
    }

    this.countChordComponents = function () {
        var chordComponentsCount = 3;
        chordComponentsCount += this.extra.length;
        chordComponentsCount -= this.omit.length;
        for(var i=0; i<this.delay.length; i++) {
            if (!Utils.contains(this.extra, this.delay[i][0])
                && (Utils.contains(this.omit, this.delay[i][1])
                || this.delay[i][1].baseComponent === "8")) chordComponentsCount += 1;
            if (Utils.contains(this.extra, this.delay[i][0])
                && !Utils.contains(this.omit, this.delay[i][1])
                && this.delay[i][1].baseComponent !== "8") chordComponentsCount -= 1;
        }
        return chordComponentsCount;
    };

    this.getPossibleToDouble = function () {
        var res = this.getBasicChordComponents();
        for (var i = 0; i < this.omit.length; i++)
            res.splice(res.indexOf(this.omit[i]), 1);
        return res;
    };

    this.isNeapolitan = function () {
        return this.degree === 2 && this.down
            && this.functionName === Consts.FUNCTION_NAMES.SUBDOMINANT && this.mode === Consts.MODE.MINOR
            && this.revolution.baseComponent === "3" && this.extra.length === 0
    };

    this.isChopin = function () {
        return this.functionName === Consts.FUNCTION_NAMES.DOMINANT
            && Utils.containsChordComponent(this.omit, "5")
            && Utils.contains(this.extra, cm.chordComponentFromString("7", this.down))
            && Utils.containsBaseChordComponent(this.extra, "6")
    };

    this.isTVIMinorDown = function () {
        return this.functionName === Consts.FUNCTION_NAMES.TONIC
            && this.degree === 6
            && this.down
            && this.mode === Consts.MODE.MINOR
    };

    this.isTIIIMinorDown = function () {
        return this.functionName === Consts.FUNCTION_NAMES.TONIC
            && this.degree === 3
            && this.down
            && this.mode === Consts.MODE.MINOR
    };


    this.containsDelayedChordComponent = function (cc) {
        for(var i = 0; i < this.delay.length; i++){
            if(this.delay[i][1] === cc)
                return true;
        }
        return false;
    };

    this.containsDelayedBaseChordComponent = function (cc) {
        for(var i = 0; i < this.delay.length; i++){
            if(this.delay[i][1].baseComponent === cc)
                return true;
        }
        return false;
    };

    this.isInSubdominantRelation = function (nextFunction) {
        if(this.key !== nextFunction.key && Utils.isDefined(this.key)){
            return Utils.contains([-4, 3], this.degree - 1);
        }
        if(this.key === nextFunction.key)
            return Utils.contains([-4,3], this.degree - nextFunction.degree);
        return false;
    };

    this.isInDominantRelation = function (nextFunction) {
        if(this.down !== nextFunction.down && this.key === nextFunction.key && !(this.functionName === Consts.FUNCTION_NAMES.TONIC
            && this.degree === 6
            && this.mode === Consts.MODE.MINOR && nextFunction.down)) {
            return false;
        }
        if(this.key !== nextFunction.key && Utils.isDefined(this.key)){
            return Utils.contains([4,-3], this.degree - 1);
        }
        if(this.key === nextFunction.key)
            return Utils.contains([4,-3], this.degree - nextFunction.degree);
        return false;
    };

    this.isInSecondRelation = function (nextFunction) {
        return nextFunction.degree - this.degree === 1;
    };

    this.hasMajorMode = function (){
        return this.mode === Consts.MODE.MAJOR;
    };

    this.hasMinorMode = function (){
        return this.mode === Consts.MODE.MINOR;
    };

    this.getArgsMap = function() {
        return {
            "functionName" : this.functionName,
            "degree" : this.degree,
            "position" : (this.position === undefined ? undefined : this.position.chordComponentString),
            "revolution" : this.revolution.chordComponentString,
            "down" : this.down,
            "system" : this.system,
            "mode" : this.mode,
            "omit" : this.omit.map(function (cc) { return cc.chordComponentString; }),
            "extra" : this.extra.map(function (cc) { return cc.chordComponentString; }),
            "key" : this.key,
            "isRelatedBackwards" : this.isRelatedBackwards
        }
    }

    this.getDelaysCopy = function() {
        var ret = []
        for (var a = 0; a < this.delay.length; a++) {
            ret.push([this.delay[a][0].chordComponentString, this.delay[a][1].chordComponentString])
        }
        return ret
    }

    this.getExtraString = function() {
        var ret = ""
        var delays = this.getDelaysCopy()
        var leftSideOfDelays = []

        for (var a = 0; a < delays.length; a++) {
            leftSideOfDelays.push(delays[a][0])
        }

        for (var a = 0; a < this.extra.length; a++) {
            if (!Utils.contains(leftSideOfDelays, this.extra[a].chordComponentString)) {
                if (a!== 0 && ret !== ""){
                    ret += ", "
                }
                ret += this.extra[a].chordComponentString
            }
        }
        return ret
    }

    this.getDelaysString = function() {
        var ret = ""
        for (var a = 0; a < this.delay.length; a++) {
            ret = ret + this.delay[a][0].chordComponentString + "-" + this.delay[a][1].chordComponentString
            if (a !== this.delay.length - 1) {
                ret += ", "
            }
        }
        return ret
    }

    this.getOmitString = function() {
        var ret = ""
        var delays = this.getDelaysCopy()
        var rightSideOfDelays = []

        for (var a = 0; a < delays.length; a++) {
            rightSideOfDelays.push(delays[a][1])
        }
        for (var a = 0; a < this.omit.length; a++) {
            if (!Utils.contains(rightSideOfDelays, this.omit[a].chordComponentString)) {
                if (a!== 0 && ret !== ""){
                    ret += ", "
                }
                ret += this.omit[a].chordComponentString
            }
        }
        return ret
    }

    this.getArgsMapWithDelays = function() {
        return {
            "functionName" : this.functionName,
            "degree" : this.degree,
            "position" : (this.position === undefined ? undefined : this.position.chordComponentString),
            "revolution" : this.revolution.chordComponentString,
            "down" : this.down,
            "system" : this.system,
            "mode" : this.mode,
            "omit" : this.omit.map(function (cc) { return cc.chordComponentString; }),
            "extra" : this.extra.map(function (cc) { return cc.chordComponentString; }),
            "key" : this.key,
            "delay" : this.getDelaysCopy(),
            "isRelatedBackwards" : this.isRelatedBackwards
        }
    }

    this.copy = function copy(){
        var args = this.getArgsMap();
        return new HarmonicFunction2(args, true);
    }

    this.equals = function (other) {
        return this.functionName === other.functionName
            && this.degree === other.degree
            && this.down === other.down
            && this.key === other.key
    };

    this.withPosition = function (position) {
        var functionWithPosition = this.copy();
        functionWithPosition.position = position;
        return functionWithPosition;
    };

    this.toString = function () {
        return "FunctionName: " + this.functionName + "\n" +
            "Degree: " + this.degree + " \n" +
            (this.position !== undefined ? "Position: " + this.position.chordComponentString + "\n" : "") +
            (this.revolution !== undefined ? "Revolution: " + this.revolution.chordComponentString + "\n" : "" ) +
            (this.delay.length !== 0 ? "Delay: " + this.getDelaysString()+ "\n" : "") +
            (this.extra.length !== 0 ? "Extra: " + this.getExtraString() + "\n" : "") +
            (this.omit.length !== 0 ? "Omit: " + this.getOmitString() + "\n" : "") +
            (this.down === true ? "Down: " + this.down + "\n" : "") +
            (this.system !== undefined ? "System: " + this.system + "\n"  : "") +
            (this.mode !== undefined ? "Mode: " + this.mode  + "\n" : "") +
            (this.key !== undefined ? "Key: " + this.key  + "\n" : "") +
            (this.isRelatedBackwards === true ? "Is related backwards" : "" )
    };

    this.getSimpleChordName = function() {
    //    functionName [moll] [delay] [deg] [down]
        var functionNameAdapter = { "T" : "A", "S" : "B", "D":"D", "same_as_prev" : "C"};
        var res = functionNameAdapter[this.functionName];

        if(this.mode === "minor") res += "moll";

        if(this.delay.length === 1){
            res += "delay" + this.delay[0][0].chordComponentString + "-" + this.delay[0][1].chordComponentString;
        }

        if(this.delay.length === 2){
            res += "delay" + this.delay[0][0].chordComponentString + this.delay[1][0].chordComponentString
                     + "-" + this.delay[0][1].chordComponentString + this.delay[1][1].chordComponentString;
        }

        var degreeAdapter = {1: "I", 2:"II", 3:"III", 4:"IV", 5:"V", 6:"VI", 7:"VII"};

        if(this.down) {
            res += "down";
            if(this.degree === 1 || this.degree === 4 || this.degree === 5)
            res += "deg" + degreeAdapter[this.degree]
        }

        if(this.degree !== undefined && this.degree !== 1 && this.degree !== 4 && this.degree !== 5)
            res += "deg" + degreeAdapter[this.degree];

        return res;
    }

    this.isDelayRoot = function() {
        return this.delay.length > 0;
    }

    // *****CONSTUCTOR PART 2*****

    // mapping to ChordComponent
    if(this.position !== undefined) this.position = this.getChordComponentFromStringInThisHfContext(this.position);
    this.revolution = this.getChordComponentFromStringInThisHfContext(this.revolution);
    for(var i=0; i<this.delay.length; i++){
        this.delay[i][0] = this.getChordComponentFromStringInThisHfContext(this.delay[i][0]);
        this.delay[i][1] = this.getChordComponentFromStringInThisHfContext(this.delay[i][1]);
        //todo czy zostawiamy to walidatorowi?
        if(this.delay[i][1].baseComponent === "5"){
            this.delay[i][1] = this.getFifth();
        }
        if(this.delay[i][1].baseComponent === "3" && this.getThird() !== this.delay[i][0]){
            this.delay[i][1] = this.getThird();
        }
    }
    for(i=0; i<this.extra.length; i++) this.extra[i] = this.getChordComponentFromStringInThisHfContext(this.extra[i]);
    for(i=0; i<this.omit.length; i++) this.omit[i] = this.getChordComponentFromStringInThisHfContext(this.omit[i]);


    //additional rules
    if((Utils.contains(this.extra, cm.chordComponentFromString("9", this.down)) || Utils.contains(this.extra, cm.chordComponentFromString("9>", this.down)) || Utils.contains(this.extra, cm.chordComponentFromString("9<", this.down)))
        && !Utils.contains(this.extra, cm.chordComponentFromString("7", this.down)) && !Utils.contains(this.extra, cm.chordComponentFromString("7<", this.down))) {
        this.extra.push(cm.chordComponentFromString("7", this.down));
    }
    if(this.position !== undefined && !Utils.contains(this.getBasicChordComponents(), this.position) && !Utils.contains(this.extra, this.position)) this.extra.push(this.position);
    if(!Utils.contains(this.getBasicChordComponents(), this.revolution) && !Utils.contains(this.extra, this.revolution)) this.extra.push(this.revolution);
    if(Utils.contains(this.extra, cm.chordComponentFromString("5<", this.down)) || Utils.contains(this.extra, cm.chordComponentFromString("5>", this.down))) {
        if (!Utils.contains(this.omit, cm.chordComponentFromString("5", this.down))){
            this.omit.push(cm.chordComponentFromString("5", this.down));
        }
    }

    if(Utils.contains(this.omit, this.cm.chordComponentFromString("1", this.down)) && this.revolution === this.cm.chordComponentFromString("1", this.down)){
        this.revolution = this.getBasicChordComponents()[1];
    }

    if(Utils.contains(this.omit, this.cm.chordComponentFromString("5", this.down))){
        var five = this.cm.chordComponentFromString("5", this.down);
        if(five !== this.getBasicChordComponents()[2]){
            this.omit = this.omit.filter(function(x){return x !== five});
            this.omit.push(this.getBasicChordComponents()[2]);
        }
    }

    if(Utils.contains(this.omit, this.cm.chordComponentFromString("3", this.down))){
        var third = this.cm.chordComponentFromString("3", this.down);
        if(third !== this.getBasicChordComponents()[1]){
            this.omit = this.omit.filter(function(x){return x !== third});
            this.omit.push(this.getBasicChordComponents()[1]);
        }
    }

    if(this.revolution === this.cm.chordComponentFromString("5", this.down)){
        this.revolution = this.getBasicChordComponents()[2];
    }

    if(this.position === this.cm.chordComponentFromString("5", this.down)){
        this.position = this.getBasicChordComponents()[2];
    }

    //handle ninth chords
    // todo obnizenia -> czy nie powinno sie sprawdzac po baseComponentach 1 i 5?
    var has9ComponentInDelay = false;
    for(var i = 0; i < this.delay.length; i++){
        if(this.delay[i][0].baseComponent === "9"){
            has9ComponentInDelay = true;
            break;
        }
    }
    if(Utils.containsBaseChordComponent(this.extra, "9") || has9ComponentInDelay){
        if(this.countChordComponents() > 4){
            var prime = this.getPrime()
            var fifth = this.getFifth()
            if(this.position === this.revolution){
                throw new Errors.HarmonicFunctionsParserError("HarmonicFunction validation error: " +
                    "ninth chord could not have same position as revolution")
            }
            if (Utils.contains([prime, fifth], this.position) && Utils.contains([prime, fifth], this.revolution)) {
                throw new Errors.HarmonicFunctionsParserError("HarmonicFunction validation error: " +
                    "ninth chord could not have both prime or fifth in position and revolution")
            }
            if(!Utils.contains(this.omit, fifth) && this.position !== fifth && this.revolution !== fifth) {
                this.omit.push(fifth);
            }
            else if(!Utils.contains(this.omit, prime)) {
                this.omit.push(prime);
                if(this.revolution === prime)
                    this.revolution = this.getBasicChordComponents()[1];
            }
        }
    }
// *****CONSTUCTOR PART 2 END*****

    if(!Utils.isDefined(notValidate)) {
        var validator = new HarmonicFunctionValidator.HarmonicFunctionValidator();
        validator.validate(this);
    }

}

function HarmonicFunction(functionName, degree, position, revolution, delay, extra, omit, down, system, mode, key, isRelatedBackwards) {
    var args = {
        "functionName" : functionName,
        "degree" : degree,
        "position" : position,
        "revolution" : revolution,
        "delay" : delay,
        "extra" : extra,
        "omit" : omit,
        "down" : down,
        "system" : system,
        "mode" : mode,
        "key" : key,
        "isRelatedBackwards" : isRelatedBackwards
    };
    HarmonicFunction2.call(this, args);
}

function HarmonicFunctionWithoutValidation(functionName, degree, position, revolution, delay, extra, omit, down, system, mode, key, isRelatedBackwards){
    var args = {
        "functionName" : functionName,
        "degree" : degree,
        "position" : position,
        "revolution" : revolution,
        "delay" : delay,
        "extra" : extra,
        "omit" : omit,
        "down" : down,
        "system" : system,
        "mode" : mode,
        "key" : key,
        "isRelatedBackwards" : isRelatedBackwards
    };
    HarmonicFunction2.call(this, args, true);
}

function harmonicFunctionReconstruct(hf){
    var delay = []
    for(var i=0;i<hf.delay.length; i++){
        delay.push([hf.delay[i][0].chordComponentString, hf.delay[i][1].chordComponentString]);
    }
    delay = delay.length > 0 ? delay : undefined;

    return new HarmonicFunctionWithoutValidation(
        hf.functionName,
        hf.degree,
        hf.position === undefined ? undefined : hf.position.chordComponentString,
        hf.revolution === undefined ? undefined : hf.revolution.chordComponentString,
        delay,
        hf.extra === undefined ? undefined : hf.extra.map(function (cc) { return cc.chordComponentString; }),
        hf.omit === undefined ? undefined : hf.omit.map(function (cc) { return cc.chordComponentString; }),
        hf.down,
        hf.system,
        hf.mode,
        hf.key,
        hf.isRelatedBackwards
    )
}