.import "../algorithms/NeighbourNode.js" as NeighbourNode
.import "../commons/Errors.js" as Errors
.import "../utils/Utils.js" as Utils

function Node(content, nextNeighbours, prevNodes) {

    this.content = content;
    this.nextNeighbours = nextNeighbours === undefined ? [] : nextNeighbours;
    this.prevNodes = prevNodes === undefined ? [] : prevNodes;
    // this.pp2 = 0

    this.getPrevContentIfSingle = function () {
        var uniquePrevContents =  this.getUniquePrevContents();
        if(uniquePrevContents.length !== 1)
            throw new Errors.UnexpectedInternalError("Method not allowed in current state of node - there are "
                + this.getUniquePrevContents().length + " unique prev nodes contents instead of expected 1");

        return uniquePrevContents[0];
    }

    this.getUniquePrevContents = function () {
        var uniquePrevContents = []
        for (var i = 0; i < this.prevNodes.length; i++) {
            if (!Utils.contains(uniquePrevContents, this.prevNodes[i].content))
                uniquePrevContents.push(this.prevNodes[i].content)
        }
        return uniquePrevContents;
    }

    this.getUniquePrevContentsCount = function () {
        return this.getUniquePrevContents().length;
    }

    this.haveNext = function (){
        return this.nextNeighbours.length > 0;
    }

    this.havePrev = function () {
        return this.prevNodes.length > 0;
    }

    this.addNextNeighbour = function (neighbourNode) {
        this.nextNeighbours.push(neighbourNode);
        neighbourNode.node.prevNodes.push(this);
    }

    this.removeLeftConnections = function () {
        var prevNodes = this.prevNodes.slice();
        for(var i=0; i<prevNodes.length; i++){
            prevNodes[i].removeNextNeighbour(this)
        }
    }

    this.removeRightConnections = function () {
        while(this.nextNeighbours.length > 0){
            this.removeNextNeighbour(this.nextNeighbours[0].node)
        }
    }

    this.removeConnections = function () {
        this.removeLeftConnections();
        this.removeRightConnections();
    }

    //removes given node from neighbourList in this and this from prevNodes in given node
    this.removeNextNeighbour = function (node) {
        this.nextNeighbours = this.nextNeighbours.filter(function (neighbour) {
            return neighbour.node !== node;
        })
        Utils.removeFrom(node.prevNodes, this);
    }

    this.overridePrevNodes = function(newPrevNodes) {
        this.prevNodes = newPrevNodes;
    }

    this.overrideNextNeighbours = function(newNextNeighbours){
        this.nextNeighbours = newNextNeighbours;
    }

    this.duplicate = function(){
        var newNode = new Node(this.content);
        for(var i=0; i<this.nextNeighbours.length; i++){
            newNode.addNextNeighbour(new NeighbourNode.NeighbourNode(this.nextNeighbours[i].node, this.nextNeighbours[i].weight))
        }
        return newNode;
    }

}