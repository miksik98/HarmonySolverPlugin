function PluginConfiguration(solutionPath){
    this.solutionPath;
    this.enableChordSymbolsPrinting;
    this.enableChordComponentsPrinting;
    this.enableCorrector;
    this.enablePrechecker;
    //todo other settings
}

function PluginConfigurationBuilder(){
    this.conf = new PluginConfiguration();

    this.solutionPath = function (_solutionPath){
        this.conf.solutionPath = _solutionPath;
        return this;
    }

    this.enableChordSymbolsPrinting = function(_enableChordSymbolsPrinting){
        this.conf.enableChordSymbolsPrinting = _enableChordSymbolsPrinting;
        return this;
    }

    this.enableChordComponentsPrinting = function (_enableChordComponentsPrinting){
        this.conf.enableChordComponentsPrinting = _enableChordComponentsPrinting;
        return this;
    }

    this.enableCorrector = function (_enableCorrector){
        this.conf.enableCorrector = _enableCorrector;
        return this;
    }

    this.enablePrechecker = function (_enablePrechecker){
        this.conf.enablePrechecker = _enablePrechecker;
        return this;
    }

    this.build = function (){

        this.conf.solutionPath = this.conf.solutionPath === undefined ? "" : this.conf.solutionPath;
        this.conf.enableChordSymbolsPrinting = this.conf.enableChordSymbolsPrinting === undefined ? true : this.conf.enableChordSymbolsPrinting;
        this.conf.enableChordComponentsPrinting = this.conf.enableChordComponentsPrinting === undefined ? true : this.conf.enableChordComponentsPrinting;
        this.conf.enableCorrector = this.conf.enableCorrector === undefined ? true : this.conf.enableCorrector;
        this.conf.enablePrechecker = this.conf.enablePrechecker === undefined ? true : this.conf.enablePrechecker;

        return this.conf;
    }

}