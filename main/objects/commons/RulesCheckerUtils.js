.import "../utils/Utils.js" as Utils
.import "../commons/Consts.js" as Consts
.import "../commons/Errors.js" as Errors
.import "../commons/BrokenRulesCounter.js" as BrokenRulesCounter
.import "../utils/Utils.js" as Utils

function Connection(current, prev, prevPrev){
    var undefinedNodeContents = ["first", "last"];

    this.current = Utils.contains(undefinedNodeContents, current) ? undefined : current;
    this.prev = Utils.contains(undefinedNodeContents, prev) ? undefined : prev;
    this.prevPrev = Utils.contains(undefinedNodeContents, prevPrev) ? undefined : prevPrev;

    this.equals = function(other){
        return (!this.current && !other.current || (this.current ? this.current.equals(other.current) : false)) &&
            (!this.prev && !other.prev || (this.prev ? this.prev.equals(other.prev) : false))  &&
            (!this.prevPrev && !other.prevPrev || (this.prevPrev ? this.prevPrev.equals(other.prevPrev) : false))
    }
}

function Evaluator(connectionSize){
    this.connectionSize = connectionSize;
    this.softRules = [];
    this.hardRules = [];
    this.evaluateHardRules = function(connection){
        for(var i = 0; i < this.hardRules.length; i++){
            if(this.hardRules[i].isBroken(connection))
                return false;
        }
        return true;
    }
    this.evaluateSoftRules = function(connection){
        var result = 0;
        for(var i = 0; i < this.softRules.length; i++){
            result += this.softRules[i].evaluate(connection);
        }
        return result;
    }
    this.initializeBrokenRulesCounter = function(){
        var rulesList = [];
        var rulesDetails = [];
        for(var i = 0; i < this.hardRules.length; i++){
            rulesList.push(this.hardRules[i].name)
            rulesDetails.push(this.hardRules[i].details)
        }
        this.brokenRulesCounter = new BrokenRulesCounter.BrokenRulesCounter(rulesList, rulesDetails)
    }
    this.evaluateAllRulesWithCounter = function(connection){
        if(this.brokenRulesCounter === undefined)
            return
        var result = 0;
        var oneRuleBroken = false;
        for(var i = 0; i < this.hardRules.length; i++){
            if(this.hardRules[i].isBroken(connection)) {
                this.brokenRulesCounter.increaseCounter(this.hardRules[i].name)
                oneRuleBroken = true;
            }
        }
        return oneRuleBroken ? -1 : result
    }
    this.getBrokenRulesCounter = function(){
        return this.brokenRulesCounter;
    }
}

function IRule(details, evaluationRatio){
    this.evaluate = function(connection){
        throw new Errors.UnexpectedInternalError("IRule default evaluate method was called");
    };

    if(Utils.isDefined(evaluationRatio) && (evaluationRatio > 1 || evaluationRatio < 0)){
        throw new Errors.UnexpectedInternalError("Incorrect evaluation ratio in Rule. Should be in [0,1].")
    };

    this.name = this.constructor.name;
    this.details = details;
    this.evaluationRatio = Utils.isDefined(evaluationRatio)? evaluationRatio : 1;

    this.isBroken = function(connection){
        var evaluationResult = this.evaluate(connection);
        return evaluationResult !== 0 && evaluationResult !== true;
    };

    this.isNotBroken = function(connection){
        return !this.isBroken(connection);
    }
}