
class Order{
	
	constructor(){
		this.actions=new Array();
		this.estado="";
		this.flowType="";
		this.features={};
	}
	
	getActions(){
		return this.actions;
	}
	
	addAction(action){
		this.actions.push(action);
	}
	
	updateAction(id, action){
		this.actions[id]=action;
	}
	
	getFlowType(){
		return this.flowType;
	}
	
	setFlowType(type){
		this.flowType=type;
	}
	
	getTransactionID(){
		return this.transactionID;
	}
	
	setTransactionID(trID){
		this.transactionID=trID;
	}
	
	setStatus(st){
		this.estado=st;
	}
	
	getStatus(){
		return this.estado;
	}
	
	getFeatures(){
		return this.features;
	}
	
	setFeatures(json){
		return this.features=json;
	}
	
}


class SRCSDK_MCTESTER_Class{
	
	displayStats=false;
	
	constructor(){
		
		this.log={};
		
		this.orders=new Map();
			
	}
	resolveInitPromise(payload){
		window.SRCSDK_MASTERCARD.logging("init", false);
		console.log("Init() " + JSON.stringify(payload, undefined, 4));
		return;
	}
	
	rejectInitPromise(payload){
		window.SRCSDK_MASTERCARD.logging("init", false, payload, true);
		console.log("Init() ERROR" + JSON.stringify(payload, undefined, 4));
		return;
	}
	
	resolveIsRecognizedPromise(payload){
		window.SRCSDK_MASTERCARD.logging("isRecognized", false, payload);
		console.log("ISRECOGNIZED() " + JSON.stringify(payload, undefined, 4));
		return;
	}
	
	rejectIsRecognizedPromise(payload){
		window.SRCSDK_MASTERCARD.logging("isRecognized", false, payload, true);
		console.log("ISRECOGNIZED() ERROR" + JSON.stringify(payload, undefined, 4));
		return;
	}
	
	resolveIdentityLookupPromise(payload){
		window.SRCSDK_MASTERCARD.logging("identityLookup", false, payload);
		console.log("IdentityLookup() " + JSON.stringify(payload, undefined, 4));
		return;
	}
	
	rejectIdentityLookupPromise(payload){
		window.SRCSDK_MASTERCARD.logging("identityLookup", false, payload, true);
		console.log("IdentityLookup() ERROR" + JSON.stringify(payload, undefined, 4));
		return;
	}
	
	resolveGetSrcProfilePromise(payload){
		window.SRCSDK_MASTERCARD.logging("getSrcProfile", false, payload);
		console.log("GetSrcProfile() " + JSON.stringify(payload, undefined, 4));
		return;
	}
	
	rejectGetSrcProfilePromise(payload){
		window.SRCSDK_MASTERCARD.logging("getSrcProfile", false, payload, true);
		console.log("GetSrcProfile() ERROR" + JSON.stringify(payload, undefined, 4));
		return;
	}
	
	resolveUnbindAppInstancePromise(payload){
		window.SRCSDK_MASTERCARD.logging("unbindAppInstance", false, payload);
		console.log("UnbindAppInstance() " + JSON.stringify(payload, undefined, 4));
		return;
	}
	
	rejectUnbindAppInstancePromise(payload){
		window.SRCSDK_MASTERCARD.logging("unbindAppInstance", false, payload, true);
		console.log("UnbindAppInstance() ERROR" + JSON.stringify(payload, undefined, 4));
		return;
	}
	
	resolveInitiateIdentityValidationPromise(payload){
		window.SRCSDK_MASTERCARD.logging("initiateIdentityValidation", false, payload);
		console.log("InitiateIdentityValidation() " + JSON.stringify(payload, undefined, 4));
		return;
	}
	
	rejectInitiateIdentityValidationPromise(payload){
		window.SRCSDK_MASTERCARD.logging("initiateIdentityValidation", false, payload, true);
		console.log("InitiateIdentityValidation() ERROR" + JSON.stringify(payload, undefined, 4));
		return;
	}
	
	resolveEnrollCardPromise(payload){
		window.SRCSDK_MASTERCARD.logging("enrollCard", false, payload);
		console.log("EnrollCard() " + JSON.stringify(payload, undefined, 4));
		return;
	}
	
	rejectEnrollCardPromise(payload){
		window.SRCSDK_MASTERCARD.logging("enrollCard", false, payload, true);
		console.log("EnrollCard() ERROR" + JSON.stringify(payload, undefined, 4));
		return;
	}
	
	resolveCompleteIdentityValidationPromise(payload){
		window.SRCSDK_MASTERCARD.logging("completeIdentityValidation", false, payload);
		console.log("CompleteIdentityValidation() " + JSON.stringify(payload, undefined, 4));
		return;
	}
	
	rejectCompleteIdentityValidationPromise(payload){
		window.SRCSDK_MASTERCARD.logging("completeIdentityValidation", false, payload, true);
		console.log("CompleteIdentityValidation() ERROR" + JSON.stringify(payload, undefined, 4));
		return;
	}
	
	resolveCheckoutPromise(payload){
		window.SRCSDK_MASTERCARD.logging("checkout", false, payload);
		console.log("Checkout() " + JSON.stringify(payload, undefined, 4));
		return;
	}
	
	rejectCheckoutPromise(payload){
		window.SRCSDK_MASTERCARD.logging("checkout", false, payload, true);
		console.log("Checkout() ERROR" + JSON.stringify(payload, undefined, 4));
		return;
	}
	
	async logging(method, request, params, error){
		try{
			var date=new Date();
			
			if(!error){
				error=false;
			}
			
			if(window.SRCSDK_MASTERCARD.displayStats && (!this.srcWindow || !window.SRCSDK_MASTERCARD.srcWindow.window || (window.SRCSDK_MASTERCARD.srcWindow.window && window.SRCSDK_MASTERCARD.srcWindow.window.closed) && request)){
				await this.createWindow();
			}
			
			if(request){
				this.order.addAction({name:method, request:params, requestTime:date});
			}else{
				this.order.getActions()[this.order.getActions().length-1].response=params;
				this.order.getActions()[this.order.getActions().length-1].responseTime=date;
			}
			
			if(!this.log[method+"_"+this.order.getActions().length]){
				this.log[method+"_"+this.order.getActions().length]={};
			}
			if(params){
				this.log[method+"_"+this.order.getActions().length][(request?"request":"response")]=params;
			}
			this.log[method+"_"+this.order.getActions().length][(request?"requestTime":"responseTime")]=date;
			
			
			if(method=="init" && request){
				
				this.orders.set(params.srciTransactionId,this.order);
				if(window.SRCSDK_MASTERCARD.displayStats){
					window.SRCSDK_MASTERCARD.srcWindow.document.write("<br><table class='blueTable' width='100%'><thead><tr><th>Transaction ID</th><th>Amount</th><th>Currency</th><th>Locale</th><th>Use case</th><th>Status</th></tr><tbody>");
				}
			}
			
			if(method=="isRecognized" && !request){
				if(params.recognized){
					this.order.setFlowType("Recognized User (cookies)");
				}
			}
			if(method=="identityLookup" && !request){
				if(params.consumerPresent){
					this.order.setFlowType("Recognized User (SMS/eMail)");
				}else{
					this.order.setFlowType("New User");
				}
			}
			if(window.SRCSDK_MASTERCARD.displayStats && this.order.getFlowType()){
				window.SRCSDK_MASTERCARD.srcWindow.document.getElementById(this.order.getTransactionID()).cells[4].innerText=" " +this.order.getFlowType();
			}
			
			if(method=="checkout" && !request){
				this.order.setStatus(params.dcfActionCode);
				if(window.SRCSDK_MASTERCARD.displayStats){
					window.SRCSDK_MASTERCARD.srcWindow.document.getElementById(this.order.getTransactionID()).cells[5].innerText=this.order.getStatus();
				}
			}
				
			//console.log(this.log);
			if(window.SRCSDK_MASTERCARD.displayStats && window.SRCSDK_MASTERCARD.srcWindow){
				if(method=="init" && request){
					window.SRCSDK_MASTERCARD.srcWindow.document.write("<tr id='"+this.order.getTransactionID()+"'><td>" + this.order.getTransactionID()+"</td><td>"+params.dpaTransactionOptions.transactionAmount.transactionAmount+"</td><td>"+params.dpaTransactionOptions.transactionAmount.transactionCurrencyCode+"</td><td>"+params.dpaTransactionOptions.dpaLocale+"</td><td></td><td></td></tr></table><table class='blueTable'><thead><tr><th style='width:200px;font-size:9pt'>Method</th><th style='font-size:9pt;width:200px;'>Request Time</th><th style='font-size:9pt'>Response Time</th><th style='width:50px;font-size:9pt'>E. Time</th></thead></table>");
				}
				
				if(request){
					this.writeAction(this.order.getTransactionID(), this.order.getActions().length, method, params);	
				}else{
					this.updateAction(this.order.getTransactionID(), this.order.getActions().length, method, params, error);
				}
				
			}
		}catch(e){
			
			console.log(e);
		}
	}
	
	getJSONformat(method, params, request){
		var json="";
		if(params){
			var a = Object.assign({}, params, {}) 
			// to avoid errors displaying that info
			if(method=="checkout" && request && params.windowRef)
				a.windowRef="WindowREF"
			
			var json=JSON.stringify(a, undefined, 4)
			if(json && json.length>0){
				json=json.replaceAll("\n","<br>");
				json=json.replaceAll("    ","&nbsp;&nbsp;&nbsp;&nbsp;");
			}
		}
		return json;
	}
	
	writeAction(trID, num, method, params){
		
		var json=this.getJSONformat(method, params, true);
		
		window.SRCSDK_MASTERCARD.srcWindow.document.write('<div ><table class="blueTable"><tr><td style="width:200px"><button type="button" class="collapsible" id="'+trID+"_"+num+'" onclick="(document.getElementById(\''+trID+"_"+num+'Content\').style.display==\'block\'?document.getElementById(\''+trID+"_"+num+'Content\').style.display=\'none\':document.getElementById(\''+trID+"_"+num+'Content\').style.display=\'block\')">'+method+'</button></td><td style="width:200px">'+window.SRCSDK_MASTERCARD.orders.get(trID).actions[num-1].requestTime.toISOString()+'</td><td id="'+trID+"_"+num+'Date"></td><td id="time'+trID+"_"+num+'" style="width:50px"></td></tr></table>');
		window.SRCSDK_MASTERCARD.srcWindow.document.write('<div class="content" id="'+trID+"_"+num+'Content" style="width:100%;height:250px;overflow:hidden"><br>'+
		'<label style="position:relative;left:0px">Request</label><br><div id="'+"_"+num+'Request" style="position:relative;left:0px;width:50%;font-family: monospace;font-size: 8pt;top:0px;overflow:auto;height:200px">'+json+'</div><label style="position:relative;left:50%;top:-215px">Response</label><br><div id="'+trID+"_"+num+'Response" style="position:relative;left:50%;width:50%;font-family: monospace;font-size: 8pt;top:-213px;overflow:auto;height:200px"></div></div></div>');

	}
	
	updateAction(trID, num, method, params, error){
		
		var json=this.getJSONformat(method, params, false);
		
		if(window.SRCSDK_MASTERCARD.orders.get(trID).actions[num-1].responseTime){
			window.SRCSDK_MASTERCARD.srcWindow.document.getElementById(trID+"_"+num+"Date").innerHTML=window.SRCSDK_MASTERCARD.orders.get(trID).actions[num-1].responseTime.toISOString();
			window.SRCSDK_MASTERCARD.srcWindow.document.getElementById("time"+trID+"_"+num).innerHTML=window.SRCSDK_MASTERCARD.orders.get(trID).actions[num-1].responseTime-window.SRCSDK_MASTERCARD.orders.get(trID).actions[num-1].requestTime;
		}
		window.SRCSDK_MASTERCARD.srcWindow.document.getElementById(trID+"_"+num).style.color=(error?"red":"green");
		window.SRCSDK_MASTERCARD.srcWindow.document.getElementById(trID+"_"+num+"Response").innerHTML=json;
	}
	
	async createWindow(){
		if(window.SRCSDK_MASTERCARD.displayStats){
			if(this.iframe){
				this.srcWindow = this.iframe;
			}else{
				this.srcWindow = await window.open('', '_blank', 'popup');
			}
			if(this.srcWindow){
				this.srcWindow.moveTo(500, 100);
				this.srcWindow.resizeTo(850, 650);
				var mystyle="table.blueTable {  border: 1px solid #FF7E00;  background-color: #FFFFFF;  width: 100%;  text-align: left;  border-collapse: collapse;}table.blueTable td, table.blueTable th {  border: 1px solid #AAAAAA;  padding: 3px 2px;}table.blueTable tbody td {  font-size: 13px;}table.blueTable tr:nth-child(even) {  background: #FFFFFF;}table.blueTable thead {  background: #FF7E00;  background: -moz-linear-gradient(top, #ff9e40 0%, #ff8b19 66%, #FF7E00 100%);  background: -webkit-linear-gradient(top, #ff9e40 0%, #ff8b19 66%, #FF7E00 100%);  background: linear-gradient(to bottom, #ff9e40 0%, #ff8b19 66%, #FF7E00 100%);  border-bottom: 2px solid #444444;}table.blueTable thead th {  font-size: 15px;  font-weight: bold;  color: #FFFFFF;  border-left: 2px solid #F5F5F5;}table.blueTable thead th:first-child {  border-left: none;}table.blueTable tfoot td {  font-size: 14px;}table.blueTable tfoot .links {  text-align: right;}table.blueTable tfoot .links a{  display: inline-block;  background: #1C6EA4;  color: #FFFFFF;  padding: 2px 8px;  border-radius: 5px;}";
				mystyle+="body{font-family: monospace;font-size: 9pt;}label{font-family: monospace;font-size: 8pt;font-weight:bold} .collapsible {  font-weight:bold;  cursor: pointer;  width: 90%;  border: none;  background-color:white;  text-align: left;  outline: none;} .collapsible:hover {  background-color: #555;  color:white;} .content {  padding: 0 5px;  display: none;  overflow: hidden;}";
				this.srcWindow.document.write('<meta name="viewport" content="width=device-width, initial-scale=1.0">');
				this.srcWindow.document.write("<style>"+mystyle+"</style>");
				
				if(this.orders.size>0 || this.order.getActions().length>0){
					this.recreateWindow();
				}
			}
		}
		
	}
	
	recreateWindow(){
		
		this.orders.forEach(function(order, key, map){
			
			window.SRCSDK_MASTERCARD.srcWindow.document.write("<br><table class='blueTable' width='100%'><thead><tr><th>Transaction ID</th><th>Amount</th><th>Currency</th><th>Locale</th><th>Use case</th><th>Status</th></tr><tbody>");
			window.SRCSDK_MASTERCARD.srcWindow.document.write("<tr id='"+order.getTransactionID()+"'><td>" + order.getTransactionID()+"</td><td>"+order.getActions()[0].request.dpaTransactionOptions.transactionAmount.transactionAmount+"</td><td>"+order.getActions()[0].request.dpaTransactionOptions.transactionAmount.transactionCurrencyCode+"</td><td>"+order.getActions()[0].request.dpaTransactionOptions.dpaLocale+"</td><td>"+order.getFlowType()+"</td><td>"+order.getStatus()+"</td></tr></table><table class='blueTable'><thead><tr><th style='width:200px;font-size:9pt'>Method</th><th style='font-size:9pt;width:200px;'>Request Time</th><th style='font-size:9pt;'>Response Time</th><th style='width:50px;font-size:9pt'>E. Time</th></thead></table>");		 
			
			for(i=0;i<order.getActions().length;i++){
				 
				window.SRCSDK_MASTERCARD.writeAction(order.getTransactionID(), i+1, order.getActions()[i].name, order.getActions()[i].request);
				window.SRCSDK_MASTERCARD.updateAction(order.getTransactionID(), i+1, order.getActions()[i].name, order.getActions()[i].response);
				 
			}
		});
		
	}

	async init(params){
		
		this.log={}; // Create a new log for this order
		this.order=new Order();
		this.order.setTransactionID(params.srciTransactionId);
		
		this.logging("init", true, params);
		
		console.log("init " + JSON.stringify(params, undefined, 4));
		
		const initPromise = window.SRCSDK_MC.init(params);
		initPromise
		  .then(this.resolveInitPromise) // No other SDK methods should be invoked until `init` resolves
		  .catch(this.rejectInitPromise);
		
		return await initPromise;
	}
	
	
	async isRecognized(payload){
		this.logging("isRecognized", true, payload);
		console.log("Recognized");
		
		const isRecognizedPromise = window.SRCSDK_MC.isRecognized(payload) //  returns a promise
		isRecognizedPromise
		  .then(this.resolveIsRecognizedPromise
			) 
		  .catch(this.rejectIsRecognizedPromise
		);
		
		return await isRecognizedPromise;
	}
	
	async identityLookup(params){
		this.logging("identityLookup", true, params);
		console.log("identityLookup " + JSON.stringify(params, undefined, 4));
		
		const identityLookupPromise = window.SRCSDK_MC.identityLookup(params) //  returns a promise
		identityLookupPromise
		  .then(this.resolveIdentityLookupPromise
			) 
		  .catch(this.rejectIdentityLookupPromise
		);
		
		return await identityLookupPromise;
	}
	
	async getSrcProfile(request){
		this.logging("getSrcProfile", true, request);
		console.log("getSrcProfile " + JSON.stringify(request, undefined, 4));
		
		const getSrcProfilePromise = window.SRCSDK_MC.getSrcProfile(request) //  returns a promise
		getSrcProfilePromise
		  .then(
			this.resolveGetSrcProfilePromise
			) 
		  .catch(
			  this.rejectGetSrcProfilePromise
			);
		
		return await getSrcProfilePromise;
	}
	
	async unbindAppInstance(){
		this.logging("unbindAppInstance", true);
		console.log("unbindAppInstance");
		
		const unbindAppInstancePromise = window.SRCSDK_MC.unbindAppInstance() //  returns a promise
		unbindAppInstancePromise
		  .then(
			this.resolveUnbindAppInstancePromise
			) 
		  .catch(
			  this.rejectUnbindAppInstancePromise
			);
		
		return await unbindAppInstancePromise;
	}

	async enrollCard(payload){
		this.logging("enrollCard", true, payload);
		console.log("enrollCard");
		
		const enrollCardPromise = window.SRCSDK_MC.enrollCard(payload) //  returns a promise
		enrollCardPromise
		  .then(
			this.resolveEnrollCardPromise
			) 
		  .catch(
			  this.rejectEnrollCardPromise
			);
		
		return await enrollCardPromise;
	}

	async initiateIdentityValidation(payload){
		this.logging("initiateIdentityValidation", true, payload);
		console.log("initiateIdentityValidation");
		
		const initiateIdentityValidationPromise = window.SRCSDK_MC.initiateIdentityValidation(payload) //  returns a promise
		initiateIdentityValidationPromise
		  .then(
			this.resolveInitiateIdentityValidationPromise
			) 
		  .catch(
			  this.rejectInitiateIdentityValidationPromise
			);
		
		return await initiateIdentityValidationPromise;
	}
	
	async completeIdentityValidation(request){
		this.logging("completeIdentityValidation", true, request);
		console.log("completeIdentityValidation " + JSON.stringify(request, undefined, 4));
		
		const completeIdentityValidationPromise = window.SRCSDK_MC.completeIdentityValidation(request) //  returns a promise
		completeIdentityValidationPromise
		  .then(
			this.resolveCompleteIdentityValidationPromise
			) 
		  .catch(
			  this.rejectCompleteIdentityValidationPromise
			);
		
		return await completeIdentityValidationPromise;
	}
	
	extractFeatures(request){
		var DCFLoader=false;
		var addCard=false;
		var authentication=false;
		
		if(request.dpaTransactionOptions.customInputData["com.mastercard.dcfExperience"]=="WITHIN_CHECKOUT" ||
			request.dpaTransactionOptions.customInputData["com.mastercard.dcfExperience"]=="PAYMENT_SETTINGS"){
			DCFLoader=true;
		}
		
		if(request.encryptedCard){
			addCard=true;
		}
		
		if(request.dpaTransactionOptions.authenticationPreferences && request.dpaTransactionOptions.authenticationPreferences.payloadRequested=="AUTHENTICATED"){
			authentication=true;
		}
		
		this.order.setFeatures({
			DCFLoader:DCFLoader,
			addCard:addCard,
			authentication:authentication
		});
		
	}
	
	async checkout(request){
		this.logging("checkout", true, request);
		
		var a=new String(request);
		
		// to avoid errors displaying that info
		if(request.windowRef)
			a.windowRef="WindowREF"
		
		console.log("checkout " + JSON.stringify(a, undefined, 4));
		
		this.extractFeatures(request);
		
		const checkoutPromise = window.SRCSDK_MC.checkout(request) //  returns a promise
		checkoutPromise
		  .then(
			this.resolveCheckoutPromise
			) 
		  .catch(
			  this.rejectCheckoutPromise
			);
		
		return await checkoutPromise;
	}
	
	setEmbeddedWindow(w){
		
		window.SRCSDK_MASTERCARD.iframe=w;
		
	}
	
}

/*
* Here I introduce this module in the middle to manage all the traffic between customer side and MC SRC SDK
*/
window.addEventListener('load',function (){
	replaceMCSDK();
});

function replaceMCSDK(){
	if (!window["SRCSDK_MC"] && window["SRCSDK_MASTERCARD"] ) {
			
			window["SRCSDK_MC"]=window.SRCSDK_MASTERCARD;
			
			window["SRCSDK_MASTERCARD"]=new SRCSDK_MCTESTER_Class();
				
	}
	
}
