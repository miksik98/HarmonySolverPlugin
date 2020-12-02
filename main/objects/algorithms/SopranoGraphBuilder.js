.import "../algorithms/GraphBuilder.js" as GraphBuilder
.import "../algorithms/SopranoGraph.js" as SopranoGraph
.import "../algorithms/Layer.js" as Layer
.import "../algorithms/NeighbourNode.js" as NeighbourNode
.import "../algorithms/Node.js" as Node
.import "../harmonic/ChordGenerator.js" as ChordGenerator
.import "../commons/RulesCheckerUtils.js" as RulesCheckerUtils
.import "../commons/Errors.js" as Errors


function SopranoGraphBuilder() {
    this.outerEvaluator = undefined;
    this.outerGenerator = undefined;
    this.outerGeneratorInput = undefined;
    this.innerEvaluator = undefined;
    this.innerGenerator = undefined;

    this.withOuterEvaluator = function (outerEvaluator) {
        this.outerEvaluator = outerEvaluator;
    }

    this.withOuterGenerator = function (outerGenerator) {
        this.outerGenerator = outerGenerator;
    }

    this.withOuterGeneratorInput = function (outerGeneratorInput) {
        this.outerGeneratorInput = outerGeneratorInput;
    }

    this.withInnerEvaluator = function (innerEvaluator) {
        this.innerEvaluator = innerEvaluator;
    }

    this.withInnerGenerator = function (innerGenerator) {
        this.innerGenerator = innerGenerator;
    }

    this.getGraphTemplate = function () {
        var graphBuilder = new GraphBuilder.GraphBuilder();
        graphBuilder.withEvaluator(this.outerEvaluator);
        graphBuilder.withGenerator(this.outerGenerator);
        graphBuilder.withInput(this.outerGeneratorInput)
        return graphBuilder.buildWithoutWeights();
    }

    var generateNestedLayers = function(graph, innerGenerator, outerGeneratorInput) {
        for(var i=0; i<graph.layers.length; i++){
            var sopranoNote = outerGeneratorInput[i].sopranoNote;
            for(var j=0; j<graph.layers[i].nodeList.length; j++){
                var currentNode = graph.layers[i].nodeList[j];
                var nestedLayer = new Layer.Layer(
                    new ChordGenerator.ChordGeneratorInput(currentNode.content.harmonicFunction, i!==0, sopranoNote),
                    innerGenerator
                );
                currentNode.nestedLayer = nestedLayer;
            }
        }
    }

    var connectNestedLayers = function(graph, innerEvaluator) {
        for(var i=0; i<graph.layers.length -1; i++) {
            for (var j=0; j<graph.layers[i].nodeList.length; j++) {
                var currentNode = graph.layers[i].nodeList[j];
                for(var k=0; k<currentNode.nextNeighbours.length; k++){
                    var nextNeighbour = currentNode.nextNeighbours[k].node;
                    currentNode.nestedLayer.connectWith(nextNeighbour.nestedLayer, innerEvaluator, i===0, false);
                }
            }
        }
    }

    var removeUselessNodesInNestedLayers = function(graph) {
        //without last layer cause the first node is not present yet
        for(var i=graph.layers.length-2; i>=0; i--) {
            for (var j = 0; j < graph.layers[i].nodeList.length; j++) {
                var currentNode = graph.layers[i].nodeList[j];
                currentNode.nestedLayer.removeUselessNodes()
            }
        }
    }

    var removeUnreachableNodesInNestedLayers = function(graph) {
        //without last layer cause the first node is not present yet
        for(var i=1; i<graph.layers.length; i++) {
            for (var j = 0; j < graph.layers[i].nodeList.length; j++) {
                var currentNode = graph.layers[i].nodeList[j];
                currentNode.nestedLayer.removeUnreachableNodes()
            }
        }
    }

    var removeNodesWithEmptyNestedLayers = function(graph) {
        for(var i=graph.layers.length-1; i>=0; i--) {
            for (var j = 0; j < graph.layers[i].nodeList.length; j++) {
                var currentNode = graph.layers[i].nodeList[j];
                if(currentNode.nestedLayer.isEmpty()){
                    graph.layers[i].removeNode(currentNode);
                    j--;
                }
            }
        }
    }

    var removeUnreachableNodes = function (graph) {
        for (var i = 0; i < graph.layers.length; i++) {
            graph.layers[i].removeUnreachableNodes()
        }
    }

    var removeUselessNodes = function (graph) {
        for (var i = graph.layers.length - 1; i >= 0; i--) {
            graph.layers[i].removeUselessNodes();
        }
    }

    var propagateEdgeWeightIntoNestedLayer = function (currentNode, w, hf_right){
        for(var l=0; l<currentNode.nestedLayer.nodeList.length; l++){
            var nested_node = currentNode.nestedLayer.nodeList[l];
            for(var m=0; m<nested_node.nextNeighbours.length; m++){
                var nested_neighbour = nested_node.nextNeighbours[m];
                if(nested_neighbour.node.content.harmonicFunction === hf_right){
                    nested_neighbour.setWeight(w);
                }
            }
        }
    }

    var setEdgeWeightsAndPropagate = function(graph, evaluator){
        for(var i=0; i<graph.layers.length - 1; i++){
            for(var j=0; j<graph.layers[i].nodeList.length; j++){
                var currentNode = graph.layers[i].nodeList[j];

                for(var k=0; k<currentNode.nextNeighbours.length; k++){
                    var neighbour = currentNode.nextNeighbours[k];
                    var connection = new RulesCheckerUtils.Connection(neighbour.node.content, currentNode.content)

                    var w = evaluator.evaluateSoftRules(connection);
                    neighbour.setWeight(w);

                    propagateEdgeWeightIntoNestedLayer(currentNode, w, neighbour.node.content.harmonicFunction)
                }
            }
        }
    }

    var attachNestedFirstAndLast = function(graph){
        graph.nestedFirst = new Node.Node("first");
        graph.nestedLast = new Node.Node("last");
        ///first
        for(var i=0; i<graph.layers[0].nodeList.length; i++){
            var currentNode = graph.layers[0].nodeList[i];
            for(var j=0; j<currentNode.nestedLayer.nodeList.length; j++){
                var currentNestedNode = currentNode.nestedLayer.nodeList[j];
                if(currentNestedNode.haveNext())
                    graph.nestedFirst.addNextNeighbour(new NeighbourNode.NeighbourNode(currentNestedNode, 0));
            }
        }

        //last
        for(var i=0; i<graph.layers[graph.layers.length -1].nodeList.length; i++) {
            var currentNode = graph.layers[graph.layers.length -1].nodeList[i];
            for (var j=0; j<currentNode.nestedLayer.nodeList.length; j++) {
                var currentNestedNode = currentNode.nestedLayer.nodeList[j];
                if(currentNestedNode.havePrev())
                    currentNestedNode.addNextNeighbour(new NeighbourNode.NeighbourNode(graph.nestedLast, 0));
            }
        }

    }


    this.build = function () {
        var graphTemplate = this.getGraphTemplate();
        generateNestedLayers(graphTemplate, this.innerGenerator, this.outerGeneratorInput); //${counter}
        connectNestedLayers(graphTemplate, this.innerEvaluator);                            //${counter}
        removeUselessNodesInNestedLayers(graphTemplate);
        removeUnreachableNodesInNestedLayers(graphTemplate);
        setEdgeWeightsAndPropagate(graphTemplate, this.outerEvaluator);                     //${counter}

        removeNodesWithEmptyNestedLayers(graphTemplate)


        var sopranoGraph = new SopranoGraph.SopranoGraph(
            graphTemplate.layers,
            graphTemplate.first,
            graphTemplate.last
        )

        if(sopranoGraph.getNodes().length === 2)
            throw new Errors.InvalidGraphConstruction("Cannot find any harmonic function sequence which could be harmonised");

        attachNestedFirstAndLast(sopranoGraph);                                             //${counter}

        return sopranoGraph;
    }

}