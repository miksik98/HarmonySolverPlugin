.import "../utils/Utils.js" as Utils
.import "../model/ChordComponentManager.js" as ChordComponentManager
.import "../commons/Consts.js" as Consts
.import "../commons/Errors.js" as Errors

function HarmonicFunctionValidator(){

    this.result = true;

    var validFunctionNames = ["T", "S", "D"];

    this.validate = function(harmonicFunction){
        this.harmonicFunction = harmonicFunction;
        this.result = true;
        // functionName          "T", "S", "D"
        validateFunctionName(this);
        // degree               int
        validateDegree(this);
        // position             should be string f.e. "<7" or "7>" or just "7"
        validatePosition(this);
        // revolution           should be string f.e. "<6" or "6>" or just "6"
        validateRevolution(this);
        // delay                delayed components list
        validateDelay(this);
        // extra                extra components list [] | ["9", "7>"]
        validateExtra(this);
        // omit                 omitted components list [] | ["1", "5"]
        validateOmit(this);
        // down                 true or false
        validateDown(this);
        // system               "open" | "close" | undefined
        validateSystem(this);
        // mode                 "major" | "minor"
        validateMode(this);

        //other checks
        checkAllChordComponentNumber(this);
        checkIfExtraContainsPosition(this);
        checkIfExtraContainsRevolution(this);

        return this.result;
    };
    
    function handleValidationFailure(_this, msg){
        _this.result = false;
        throw new Errors.HarmonicFunctionsParserError("HarmonicFunction validation error: " + msg)
    }

    function validateFunctionName(_this){
        var functionName = _this.harmonicFunction.functionName;
        if(functionName === undefined) handleValidationFailure(_this, "FunctionName cannot be undefined");
        if(!Utils.contains( validFunctionNames, functionName)) handleValidationFailure(_this, "Invalid function name: " + functionName);
    }

    function validateDegree(_this) {
        var degree = _this.harmonicFunction.degree;
        if(!Utils.isIntegerNumber(degree)){
            handleValidationFailure(_this, "Degree is not a number");
            return
        }
        if( degree < 1 || degree > 7 ) handleValidationFailure(_this, "Invalid degree value");
    }

    function validatePosition(_this) {
        var position = _this.harmonicFunction.position;
        if(position !== undefined && !isValidChordComponent(position))  handleValidationFailure(_this, "Invalid chordComponentString of position");
    }

    function validateRevolution(_this) {
        var revolution = _this.harmonicFunction.revolution;
        if(revolution === undefined) handleValidationFailure(_this, "Revolution cannot be undefined");
        if(!isValidChordComponent(revolution)) handleValidationFailure(_this, "Invalid chordComponentString of revolution");
    }

    function validateDelay(_this){
        var delay = _this.harmonicFunction.delay;
        if(delay === undefined) handleValidationFailure(_this, "Delay cannot be undefined");
        if(delay.length > 4) handleValidationFailure(_this, "Too large delay list - there are only four voices");
        for(var i=0; i<delay.length; i++){
            
            if(delay[i].length !== 2) handleValidationFailure(_this, "Wrong size of delay");
            
            var first = delay[i][0];
            var second = delay[i][1];

            if(!isValidChordComponent(first)) handleValidationFailure(_this, "Delay first component has not contain valid chordComponentString");
            if(!isValidChordComponent(second)) handleValidationFailure(_this, "Delay second component has not contain valid chordComponentString");

            //too large difference in delay
            var chordComponentManager = new ChordComponentManager.ChordComponentManager();

            if(Utils.abs(parseInt(first.baseComponent) - parseInt(second.baseComponent)) > 1 )  handleValidationFailure(_this, "Too large difference in delay");
            // todo to many chord components!
            //todo cannot omit component used in delay, position, resolution, extra

        }
    }

    function validateExtra(_this){
        var extra = _this.harmonicFunction.extra;
        if(extra === undefined) handleValidationFailure(_this, "Extra cannot be undefined");

        for(var i=0; i<extra.length; i++){
            if(!isValidChordComponent(extra[i])) handleValidationFailure(_this, "Invalid chordComponentString of extra[" + i  + "]");
            if(Utils.contains(_this.harmonicFunction.getBasicChordComponents(), extra[i])) handleValidationFailure(_this, "Extra contains basic chord component which is not allowed here");

            var other_extra = extra.slice();
            other_extra.splice(i, 1);
            if(Utils.contains(other_extra, extra[i])) handleValidationFailure(_this, "Extra contains duplicates");
        }

        if(extra.length > 4) handleValidationFailure(_this, "Extra is too large");
    }

    function validateOmit(_this){
        var omit = _this.harmonicFunction.omit;
        if(omit === undefined) handleValidationFailure(_this, "Omit cannot be undefined");

        for(var i=0; i<omit.length; i++){
            if(!isValidChordComponent(omit[i])) handleValidationFailure(_this, "Invalid chordComponentString of omit [" + i + "]");
            if(!Utils.contains(_this.harmonicFunction.getBasicChordComponents(), omit[i]) && omit[i].chordComponentString !== "8") {
                handleValidationFailure(_this, "Omit contains not basic chord component which is not allowed here");
            }

            if(omit.length === 2 && omit[0] === omit[1]) handleValidationFailure(_this, "Omit contains duplicates");
        }
        if(omit.length > 2) handleValidationFailure(_this, "Omit is too large");
    }

    function validateDown(_this){
        var down = _this.harmonicFunction.down;
        if(down !== true && down !== false) handleValidationFailure(_this, "Invalid value of down: " + down);
    }

    function validateSystem(_this){
        var system = _this.harmonicFunction.system;
        if(system !== 'open' && system !== 'close' && system !== undefined) handleValidationFailure(_this, "Illegal value of system: " + system)
    }

    function validateMode(_this) {
        var mode = _this.harmonicFunction.mode;
        if(!Utils.contains([Consts.MODE.MAJOR, Consts.MODE.MINOR], mode)) handleValidationFailure(_this, "Invalid value of mode: " + mode);
    }

    function checkAllChordComponentNumber(_this){
        if(_this.harmonicFunction.countChordComponents() > 4) handleValidationFailure(_this, "Count of chord components is to large - there are only 4 voices");
    }

    function checkIfExtraContainsPosition(_this) {
        var position = _this.harmonicFunction.position;
        var extra = _this.harmonicFunction.extra;
        if(position !== undefined && !Utils.contains(_this.harmonicFunction.getBasicChordComponents(), position) && !Utils.contains(extra, position))
            handleValidationFailure(_this, "Extra not contains position which is not standard chord component");
    }

    function checkIfExtraContainsRevolution(_this) {
        var revolution = _this.harmonicFunction.revolution;
        var extra = _this.harmonicFunction.extra;
        if(!Utils.contains(_this.harmonicFunction.getBasicChordComponents(), revolution) && !Utils.contains(extra, revolution))
            handleValidationFailure(_this, "Extra not contains position which is not standard chord component");
    }

    function isValidChordComponent(chordComponent) {
        return (/^(([1-9](>|<|>>|<<)?)|((>|<|>>|<<)[1-9])?)$/gi).test(chordComponent.chordComponentString);
    }
}
