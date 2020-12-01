.import "../commons/Errors.js" as Errors

function Generator(){
    this.generate = function(input){
        throw new Errors.UnexpectedInternalError("Default generate function was called");
    }
}