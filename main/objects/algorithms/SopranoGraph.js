.import "../algorithms/Graph.js" as Graph
.import "../algorithms/Layer.js" as Layer
.import "../algorithms/NeighbourNode.js" as NeighbourNode
.import "../utils/Utils.js" as Utils

function SopranoGraph(layers, first, last, nestedFirst, nestedLast){
    Graph.Graph.call(this, layers, first, last);
    this.nestedFirst = nestedFirst;
    this.nestedLast = nestedLast;

    this.getFirst = function (){
        return this.nestedFirst;
    }

    this.getLast = function (){
        return this.nestedLast;
    }

    this.getNodes = function (){
        var allNodes = [];
        for(var i=0; i<this.layers.length; i++){
            for(var j=0; j<this.layers[i].nodeList.length; j++) {
                var currentNode = this.layers[i].nodeList[j];
                allNodes = allNodes.concat(currentNode.nestedLayer.nodeList);
            }
        }
        allNodes.push(this.nestedFirst);
        allNodes.push(this.nestedLast);
        return allNodes;
    }


    this.reduceToChordGraph = function (){
        if(this.getLast().distanceFromBegining === "infinity"){
            console.log("Shortest paths are not calculated properly " + this.getNodes().length);
        }

        var layers = [];
        var stack = [this.getLast()];
        while(stack.length !== 1 || stack[0] !== this.getFirst()){
            var edges = []
            var newStack = []
            for(var i=0; i<stack.length; i++){
                var currentNode = stack[i];
                for(var j=0; j<currentNode.prevsInShortestPath.length; j++){
                    edges.push([currentNode.prevsInShortestPath[j], currentNode]);
                    if(!Utils.contains(newStack, currentNode.prevsInShortestPath[j])) newStack.push(currentNode.prevsInShortestPath[j]);
                }
            }

            for(var i=0; i<stack.length; i++){
                stack[i].overridePrevNodes([]);
            }

            for(var i=0; i<newStack.length; i++){
                newStack[i].overrideNextNeighbours([]);
            }

            for(var i=0; i<edges.length; i++) {
                edges[i][0].addNextNeighbour(new NeighbourNode.NeighbourNode(edges[i][1]));
            }
            stack = newStack;
            var layer = new Layer.Layer();
            layer.nodeList = stack;
            layers.unshift(layer)
        }
        layers.splice(0,1)
        ;
        for(var i=0; i<this.getFirst().nextNeighbours.length; i++){
            this.getFirst().nextNeighbours[i].weight = 0
        }

        for(var i=0; i<this.getLast().prevNodes.length; i++){
            var currentNode = this.getLast().prevNodes[i];
            for(var j=0; j<currentNode.nextNeighbours.length; j++){
                if(currentNode.nextNeighbours[j].node === this.getLast()){
                    currentNode.nextNeighbours[j].weight = 0;
                }
            }
        }
        return new Graph.Graph(layers, this.getFirst(), this.getLast());
    }

    this.enumerateNodes = function() {
        this.nestedFirst.id = -1;
        this.nestedLast.id = -2;
        for(var i=0; i<this.layers.length; i++){
            for(var j=0; j<this.layers[i].nodeList.length; j++) {
                var currentLayer = this.layers[i].nodeList[j].nestedLayer;
                for(var k=0; k<currentLayer.nodeList.length; k++){
                    var currentNode = currentLayer.nodeList[k];
                    currentNode.id = this.current_id;
                    this.current_id++;
                }
            }
        }
    }

    this.printEdges = function() {
        for(var i=0; i<this.layers.length; i++){
            for(var j=0; j<this.layers[i].nodeList.length; j++) {
                var currentLayer = this.layers[i].nodeList[j].nestedLayer;
                for(var k=0; k<currentLayer.nodeList.length; k++){
                    var currentNode = currentLayer.nodeList[k];
                    for(var l=0; l<currentNode.nextNeighbours.length;l++){
                        console.log(currentNode.id + "," + currentNode.nextNeighbours[l].node.id + "," + (i + 1) + "," + currentNode.nextNeighbours[l].weight)
                        if(currentNode.nextNeighbours[l].node.id === undefined){
                            console.log(currentNode.nextNeighbours[l])
                        }
                    }
                }
            }
        }
        var currentNode = this.nestedFirst;
        for(var l=0; l<currentNode.nextNeighbours.length;l++){
            console.log(currentNode.id + "," + currentNode.nextNeighbours[l].node.id + "," + 0 + "," + currentNode.nextNeighbours[l].weight )
        }
    }
}
