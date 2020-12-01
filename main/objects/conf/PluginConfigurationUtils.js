.import "../conf/PluginConfiguration.js" as Configuration

var configuration_save_path = "resources/harmony_solver_plugin_configuration.json"

function readConfiguration(fileIO, absolutePath){
    fileIO.source = absolutePath + "/" + configuration_save_path;
    var conf_text = fileIO.read();
    var conf_json = JSON.parse(conf_text);

    var confBuilder = new Configuration.PluginConfigurationBuilder();
    confBuilder.solutionPath(conf_json["solutionPath"]);
    confBuilder.enableChordSymbolsPrinting(conf_json["enableChordSymbolsPrinting"]);
    confBuilder.enableChordComponentsPrinting(conf_json["enableChordComponentsPrinting"]);
    confBuilder.enableCorrector(conf_json["enableCorrector"]);
    confBuilder.enablePrechecker(conf_json["enablePrechecker"]);

    return confBuilder.build();
}

function saveConfiguration(fileIO, absolutePath, configuration){
    var conf_json = JSON.stringify(configuration);
    fileIO.source = absolutePath + "/" + configuration_save_path;
    fileIO.write(conf_json);
}