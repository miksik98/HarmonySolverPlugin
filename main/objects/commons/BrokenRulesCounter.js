function BrokenRulesCounter(rulesList, rulesDetails) {
    this.rulesList = rulesList
    this.rulesDetails = rulesDetails
    this.allConnections = 0

    for (var i = 0; i < this.rulesList.length; i++) {
        this[this.rulesList[i]] = 0
    }

    this.increaseCounter = function(ruleName) {
        this[ruleName] += 1
    }

    this.setAllConnections = function(value) {
        this.allConnections = value
    }

    this.compareBrokenRuleStatuses = function(r1, r2) {
        return r2.counter - r1.counter
    }

    this.getBrokenRulesStringInfo = function() {
        var ret = ""

        var brokenRuleStatuses = []
        for (var i = 0; i < this.rulesList.length; i++){
            brokenRuleStatuses.push(new BrokenRuleStatus(this.rulesDetails[i], this[this.rulesList[i]]))
        }

        brokenRuleStatuses.sort(this.compareBrokenRuleStatuses)

        for (var i = 0; i < brokenRuleStatuses.length; i++) {
            if (brokenRuleStatuses[i].counter !== 0) {
                ret += brokenRuleStatuses[i].details + ": " + brokenRuleStatuses[i].counter + "/" + this.allConnections + "\n"
            }
        }
        return ret
    }
}

function BrokenRuleStatus(details, counter){
    this.details = details
    this.counter = counter
}