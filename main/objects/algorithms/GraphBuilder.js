.import "../algorithms/NeighbourNode.js" as NeighbourNode
.import "../algorithms/Node.js" as NodeI
.import "../algorithms/Graph.js" as Graph
.import "../algorithms/Layer.js" as Layer
.import "../commons/RulesCheckerUtils.js" as RulesCheckerUtils
.import "../utils/Utils.js" as Utils
.import "../commons/Errors.js" as Errors

function GraphBuilder() {
    this.evaluator = undefined;
    this.generator = undefined;
    this.generatorInput = undefined;
    this.connectedLayers = undefined;

    this.withEvaluator = function (evaluator) {
        this.evaluator = evaluator;
    }

    this.withGenerator = function (generator) {
        this.generator = generator;
    }

    this.withInput = function (generatorInput) {
        this.generatorInput = generatorInput;
    }

    this.withConnectedLayers = function(layers){
        this.connectedLayers = layers;
    }

    this.withGraphTemplate = function (graphTemplate){
        this.graphTemplate = graphTemplate;
    }

    var removeUnexpectedNeighboursIfExist = function(graph) {
        for(var i = 0; i < graph.layers.length-1; i++){
            graph.layers[i].leaveOnlyNodesTo(graph.layers[i+1]);
        }

    }

    var generateLayers = function (graph, generator, inputs) {
        for (var i = 0; i < inputs.length; i++) {
            graph.layers.push(
                new Layer.Layer(inputs[i], generator)
            )
        }
    }

    var addEdges = function (graph, evaluator) {
        for (var i = 0; i < graph.layers.length - 1; i++) {
            graph.layers[i].connectWith(graph.layers[i+1], evaluator, i===0, true)
        }
    }

    var addFirstAndLast = function(graph) {
        graph.first = new NodeI.Node("first");
        for(var i=0; i<graph.layers[0].nodeList.length; i++){
            graph.first.addNextNeighbour(new NeighbourNode.NeighbourNode(graph.layers[0].nodeList[i], 0))
        }

        graph.last = new NodeI.Node("last");
        var lastLayerIdx = graph.layers.length - 1;
        for(var i=0; i<graph.layers[lastLayerIdx].nodeList.length; i++){
            graph.layers[lastLayerIdx].nodeList[i].addNextNeighbour(new NeighbourNode.NeighbourNode(graph.last, 0))
        }
    }

    var removeUnreachableNodes = function (graph) {
        // for (var i = 0; i < graph.layers.length; i++) {
        //     graph.layers[i].removeUnreachableNodes()
        // }
        graph.layers[graph.layers.length-1].removeUnreachableNodes()
    }

    var removeUselessNodes = function (graph) {
        for (var i = graph.layers.length - 1; i >= 0; i--) {
            graph.layers[i].removeUselessNodes();
        }
    }

    var makeAllNodesHavingSinglePrevContent = function (graph){
        for (var i = graph.layers.length - 1; i >= 0; i--) {

            for(var j=0; j<graph.layers[i].nodeList.length; j++){
                var currentNode = graph.layers[i].nodeList[j];
                if (currentNode.prevNodes.length > 1) {
                    var duplicates = [];
                    for (var k = 0; k < currentNode.prevNodes.length - 1; k++) {
                        duplicates.push(currentNode.duplicate());
                    }
                    var prevNodes = currentNode.prevNodes.slice();
                    currentNode.removeLeftConnections();

                    prevNodes[0].addNextNeighbour(new NeighbourNode.NeighbourNode(currentNode))
                    for (k = 1; k < duplicates.length + 1; k++) {
                        if(i === 0) prevNodes[k].addNextNeighbour(new NeighbourNode.NeighbourNode(duplicates[k - 1], 0));
                        else prevNodes[k].addNextNeighbour(new NeighbourNode.NeighbourNode(duplicates[k - 1]));
                        graph.layers[i].nodeList.push(duplicates[k - 1]);
                    }
                }
            }
        }
    }

    var setEdgeWeights = function(graph, evaluator){
        for(var i=0; i<graph.layers.length - 1; i++){
            for(var j=0; j<graph.layers[i].nodeList.length; j++){
                var currentNode = graph.layers[i].nodeList[j];

                var prevNodeContent = i === 0 ? undefined : ( evaluator.connectionSize !== 3 ? undefined : currentNode.getPrevContentIfSingle());

                for(var k=0; k<currentNode.nextNeighbours.length; k++){
                    var neighbour = currentNode.nextNeighbours[k];
                    var connection = new RulesCheckerUtils.Connection(neighbour.node.content, currentNode.content, prevNodeContent)
                    //todo Optymalizacja wydzielić zestaw ruli obliczanych dla connection size2 i size3, te pierwsze liczyć przed transformacją grafu
                    var w = evaluator.evaluateSoftRules(connection);
                    neighbour.setWeight(w);
                }
            }
        }

    }

    this.buildWithoutWeights = function() {
        var resultGraph = new Graph.Graph([]);                              //${counter}
        generateLayers(resultGraph, this.generator, this.generatorInput);   //${counter}
        addEdges(resultGraph, this.evaluator);                              //${counter}
        addFirstAndLast(resultGraph);

        removeUselessNodes(resultGraph);                                    //${counter}
        return resultGraph;
    }

    this.build = function () {
        if(Utils.isDefined(this.connectedLayers)){
            var resultGraph = new Graph.Graph(this.connectedLayers);
            addFirstAndLast(resultGraph);
            removeUnexpectedNeighboursIfExist(resultGraph);
            removeUnreachableNodes(resultGraph);
            removeUselessNodes(resultGraph);
        }
        else if(Utils.isDefined(this.graphTemplate)){
            var resultGraph = this.graphTemplate;
        }
        else{
            var resultGraph = this.buildWithoutWeights();
        }

        if (this.evaluator.connectionSize === 3){
            makeAllNodesHavingSinglePrevContent(resultGraph);
        }
        setEdgeWeights(resultGraph, this.evaluator);

        return resultGraph;
    }
}