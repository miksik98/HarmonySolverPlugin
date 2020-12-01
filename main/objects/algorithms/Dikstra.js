.import "../algorithms/PriorityQueue.js" as PriorityQueue
.import "../commons/Errors.js" as Errors

function Dikstra(graph){

    this.graph = graph;
    this.queue = new PriorityQueue.PriorityQueue("distanceFromBegining");

    this.init = function() {
        var allNodes = this.graph.getNodes();
        for(var i=0; i<allNodes.length; i++){
            allNodes[i].distanceFromBegining = "infinity";
            allNodes[i].prevsInShortestPath = undefined;
            this.queue.insert(allNodes[i]);
        }
        this.graph.getFirst().distanceFromBegining = 0;
    }

    //Cormen p.662
    this.relax = function(u, v, w){
        if(u.distanceFromBegining === "infinity"){
            throw new Errors.UnexpectedInternalError("u cannot have inifinity distance from begining")
        }

        if(u.distanceFromBegining + w < v.distanceFromBegining || v.distanceFromBegining === "infinity") {
            this.queue.decreaseKey(v, u.distanceFromBegining + w);
            v.prevsInShortestPath = [u];
        } else if (u.distanceFromBegining + w === v.distanceFromBegining){
            v.prevsInShortestPath.push(u);
        }
    }

    this.findShortestPaths = function() {
        this.init();
        var u, v, w;
        while(this.queue.isNotEmpty()){
            u = this.queue.extractMin();
            for(var i=u.nextNeighbours.length; i--;){
                v = u.nextNeighbours[i].node;
                w = u.nextNeighbours[i].weight;
                this.relax(u,v,w);
            }
        }
    }

    this.getShortestPathToLastNode = function() {
        this.findShortestPaths();
        var currentNode = this.graph.getLast();
        var result = []
        while(currentNode.prevsInShortestPath !== undefined){
            result.unshift(currentNode);
            currentNode = currentNode.prevsInShortestPath[0];
        }
        result.splice(result.length-1, 1);
        return result;
    }

}