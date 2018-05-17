class YSAP {

    // constructor
    constructor(yamlFile){
	
	// require library and load ysap
	this.yaml = require("node-yaml")
	this.td = this.yaml.readSync(yamlFile)	
    }

    // get namespace
    getNamespace(nsName){
	return this.td["namespaces"][nsName]
    }

    // getters for URIs
    getQueryURI(){
	return `http://${this.td["parameters"]["host"]}:${this.td["parameters"]["ports"]["http"]}${this.td["parameters"]["paths"]["query"]}`
    }

    getUpdateURI(){
	return `http://${this.td["parameters"]["host"]}:${this.td["parameters"]["ports"]["http"]}${this.td["parameters"]["paths"]["update"]}`
    }

    getSubscribeURI(){
	return `ws://${this.td["parameters"]["host"]}:${this.td["parameters"]["ports"]["ws"]}${this.td["parameters"]["paths"]["subscribe"]}`
    }

    // get SPARQL
    getSPARQL(name, isQuery, forcedBindings = null){

	// set the key
	var k = "updates";
	if (isQuery){
	    k = "queries";
	};
	
	// get the sparql template
	var spqText = this.td[k][name]["sparql"];
	
	// replace bindings
	if (forcedBindings){
	    Object.keys(forcedBindings).forEach(k => {
		var r1 = new RegExp('\\?' + k + '\\s+', 'g');
		spqText = spqText.replace(r1, forcedBindings[k] + " ");
		var r2 = new RegExp('\\?' + k + '\\.', 'g');
		spqText = spqText.replace(r2, forcedBindings[k] + ". ");		
	    })
	}
	
	// return
	return spqText
    }

    
    // get update
    getUpdate(updName, forcedBindings = null){
	return this.getSPARQL(updName, false, forcedBindings);
    }

    // get update
    getQuery(qName, forcedBindings = null){
	return this.getSPARQL(qName, true, forcedBindings);
    }

    
}

// export the class
module.exports.YSAP = YSAP;
