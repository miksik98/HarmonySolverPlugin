.import "../algorithms/NeighbourNode.js" as NeighbourNode
.import "../algorithms/Node.js" as NodeI
.import "../commons/RulesCheckerUtils.js" as RulesCheckerUtils
.import "../utils/Utils.js" as Utils

function Layer(generatorInput, generator) {

    this.nodeList =  generator === undefined ? undefined : generator.generate(generatorInput).map(function (x) {
        return new NodeI.Node(x);
    })

    this.removeNode = function (node) {
        Utils.removeFrom(this.nodeList, node);

        node.removeConnections();
    }

    this.getPrevConnectionsCount = function () {
        var count = 0;
        for (var i=0; i<this.nodeList.length; i++){
            count += this.nodeList[i].prevNodes.length;
        }
        return count;
    }

    this.getNextConnnetionsCount = function () {
        var count = 0;
        for(var i =0; i<this.nodeList.length; i++){
            count += this.nodeList[i].nextNeighbours.length;
        }
        return count;
    }

    this.connectWith = function(other, evaluator, isFirstLayer, removeUnreachable){
        var nextNodes = other.nodeList;
        for (var i = 0; i < this.nodeList.length; i++) {
            var currentNode = this.nodeList[i];
            if(currentNode.havePrev() || isFirstLayer) {
                for (var k = 0; k < other.nodeList.length; k++) {
                    if (evaluator.evaluateHardRules(new RulesCheckerUtils.Connection(nextNodes[k].content, currentNode.content))) {
                        currentNode.addNextNeighbour(new NeighbourNode.NeighbourNode(nextNodes[k]));
                    }
                }
            }
        }
        if(removeUnreachable) other.removeUnreachableNodes();
    }

    this.leaveOnlyNodesTo = function(other){
        for(var i=0; i < this.nodeList.length; i++) {
            var currentNode = this.nodeList[i];
            for(var j=0; j < currentNode.nextNeighbours.length; j++){
                var currentNeighbour = currentNode.nextNeighbours[j];
                if( ! Utils.contains(currentNeighbour.node, other.nodeList) ){
                    currentNode.removeNextNeighbour(currentNeighbour.node);
                    j--;
                }
            }
        }
    }

    this.removeUselessNodes = function () {
        for (var j = 0; j < this.nodeList.length; j++) {
            var currentNode = this.nodeList[j];
            if(!currentNode.haveNext()){
                this.removeNode(currentNode);
                j--;
            }
        }
    }

    this.removeUnreachableNodes = function () {
        for (var j = 0; j < this.nodeList.length; j++) {
            var currentNode = this.nodeList[j];
            if(!currentNode.havePrev()){
                this.removeNode(currentNode);
                j--;
            }
        }
    }

    this.map = function (func) {
        this.nodeList = this.nodeList.map(func);
    }

    this.isEmpty = function () {
        return this.nodeList.length === 0;
    }
}