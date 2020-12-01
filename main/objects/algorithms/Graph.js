.import "../utils/Utils.js" as Utils
.import "../commons/Errors.js" as Errors
.import "../commons/RulesCheckerUtils.js" as RulesCheckerUtils

function Graph(layers, first, last) {
    this.first = first;
    this.last = last;
    this.layers = layers;
    //just for printing
    this.current_id = 0;

    this.getFirst = function (){
        return this.first;
    }

    this.getLast = function (){
        return this.last;
    }

    this.getNodes = function (){
        var allNodes = [];
        for(var i=0; i<this.layers.length; i++){
            for(var j=0; j<this.layers[i].nodeList.length; j++) {
                allNodes.push(this.layers[i].nodeList[j])
            }
        }
        allNodes.push(this.first);
        allNodes.push(this.last);
        return allNodes;
    }

    this.enumerateNodes = function () {

        this.first["id"] = -1;
        this.last["id"] = -2;
        for(var i=0; i<this.layers.length; i++){
            for(var j=0; j<this.layers[i].nodeList.length; j++){
                var currentNode = this.layers[i].nodeList[j];
                if(currentNode.id === undefined) {
                    currentNode.id = this.current_id;
                    this.current_id++;
                }
            }
        }
    }

    this.printEdges = function () {
        var printNodeInfo = function(currentNode, layerNumber){
            for(var k=0; k< currentNode.nextNeighbours.length; k++){
                // version for first exercise
                // console.log(currentNode.id + "+" + currentNode.content.shortString() + ","  + currentNode.nextNeighbours[k].node.id + "+" + currentNode.nextNeighbours[k].node.content.shortString() + "," + i)

                // version for soprano
                if(currentNode.content !== "first" && currentNode.nextNeighbours[k].node.content !== "last")
                // console.log(currentNode.id + currentNode.content.harmonicFunction.functionName + "," + currentNode.nextNeighbours[k].node.id + currentNode.nextNeighbours[k].node.content.harmonicFunction.functionName+ "," + layerNumber + "," + currentNode.nextNeighbours[k].weight)
                console.log(currentNode.id + currentNode.content.harmonicFunction.functionName + "_" +currentNode.content.harmonicFunction.degree +  "," + currentNode.nextNeighbours[k].node.id + currentNode.nextNeighbours[k].node.content.harmonicFunction.functionName+  "_"+ currentNode.nextNeighbours[k].node.content.harmonicFunction.degree +"," + layerNumber + "," + currentNode.nextNeighbours[k].weight)

                // default version
                // console.log(currentNode.id + "," + currentNode.nextNeighbours[k].node.id + "," + layerNumber + "," + currentNode.nextNeighbours[k].weight)
            }
        }

        printNodeInfo(this.first, 0);
        for(var i=0; i<this.layers.length; i++){
            for(var j=0; j<this.layers[i].nodeList.length; j++) {
                printNodeInfo(this.layers[i].nodeList[j], i+1)
            }
        }
    }

    this.getPossiblePathCount = function(){
        var n = 0;
        this.first.pp2 = 1
        for(var i=0; i<this.layers.length;i++){
            for(var j=0; j<this.layers[i].nodeList.length; j++) {
                var curr = this.layers[i].nodeList[j];
                curr.pp2 = 0
                for (var k = 0; k < curr.prevNodes.length; k++) {
                    curr.pp2 += curr.prevNodes[k].pp2;
                }
                if (i === this.layers.length -1) {
                    console.log(curr.pp2)
                    n += curr.pp2
                }
            }
        }
        return n;
    }
}