function VAB(className,isDebug,cssURL){

	isDebug = isDebug ||  (isDebug&&isDebug.toLowerCase&&isDebug.toLowerCase()=='true');

	var _viewDurationComplete = 5;
	var _activeRate = 0.5;
	var vabClassName = className||'vab';
	
	var _this = this;

	var _registeredElements = [];
	var _activeElements = [];
	var _countIntval = 0;
	var inspector = null;

	function _debug(... param){
		if(isDebug) console.log.apply(console,param);
	}

	function _init(){

		inspector = new _VAB_Inspector();
		
		if(isDebug){
			document.body.appendChild(inspector.elm);
		}

		document.addEventListener("DOMNodeInserted", function (ev) {
			if(ev.target && ev.target.classList && ev.target.classList.contains(vabClassName)){
				_registerElement(ev.target);
			}
			_findVAB(ev.target);

		}, false);

		_findVAB(document.body);

		///

		document.addEventListener('scroll',function(ev){
			_updateActiveElements();
		});

		_countIntval = setInterval(_count,1000);
		_updateActiveElements();
	}

	function _findVAB(fromElm){
		if(fromElm instanceof HTMLElement) {
			var vabElms = Array.prototype.slice.call(
				fromElm.getElementsByClassName(vabClassName)
			);
			
			vabElms.forEach(function(elm,index,elms){
				_registerElement(elm);
			});
		}
	}

	function _registerElement(elm){
		var index = _registeredElements.indexOf(elm);
		if(!~index) {

			elm.isActive = false;
			elm.activeTime = 0;
			elm.viewableRate = 0;

			_registeredElements.push(elm);	

			if(inspector){
				var indicator = elm.indicator || new _VAB_Indicator(elm);
				inspector.addIndicator(indicator);
			}

		}

		if(inspector){
			inspector.render();
		}

		//_debug(_registeredElements);
	}

	function _unregisterElementAt(index){
		return _registeredElements.splice(index,1);
	}

	function _unregisterElement(elm){
		var index = _registeredElements.indexOf(elm);
		if(~index) {
			_unregisterElementAt(index);

			if(inspector && elm.indicator){
				inspector.removeIndicator(elm.indicator);
			}
		}
		//_debug(_registeredElements);
	}

	function _getOverlap(a,b){
		return Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
	}

	function _updateActiveElements(){
		var now = new Date();
		//console.log('Update : [ ',now,' ]');

		_activeElements = [];
		var wRect = {top:0,left:0,right:window.innerWidth,bottom:window.innerHeight,width:window.innerWidth,height:window.innerHeight};
		_registeredElements.forEach(function(elm,i,all){

			var rect = elm.getBoundingClientRect();
			var viewableRate = _getOverlap(rect,wRect)/(rect.width*rect.height);
			//console.log(elm.id+' : '+viewableRate);

			elm.viewableRate = viewableRate;

			if(viewableRate > _activeRate){
				_activeElements.push(elm);

				if(!elm.isActive){
					elm.isActive = true;

					var completeEvent = new Event('vab.active',{bubbles:true,cancelable:true});
					elm.dispatchEvent(completeEvent);
					elm.indicator && elm.indicator.elm.classList.add('view-active');
				}
			}
			else {

				if(elm.isActive){
					elm.isActive = false;

					var completeEvent = new Event('vab.deactive',{bubbles:true,cancelable:true});
					elm.dispatchEvent(completeEvent);
					elm.indicator && elm.indicator.elm.classList.remove('view-active');
				}
			}
		});

		//console.log('active elements : '+_activeElements.length+'/'+_registeredElements.length);

		if(inspector){
			inspector.render();
		}
	}

	function _count(){
		_activeElements.forEach(function(elm,i,all){
			if(++elm.activeTime>=_viewDurationComplete){

				elm.indicator && elm.indicator.elm.classList.add('view-complete');

				if(!elm.viewCompleted){
					elm.viewCompleted = true;

					var completeEvent = new Event('vab.complete',{bubbles:true,cancelable:true});
					elm.dispatchEvent(completeEvent);
				}
			}
			elm.indicator && elm.indicator.render();
		});
	}

	function _toggleDebug(){
		isDebug = !isDebug;
		if(isDebug){
			document.body.appendChild(inspector.elm);
		}
		else {
			inspector.elm.remove();
		}
	}

	/////

	function _VAB_Inspector(){

		//_debug('CREATE INSPECTOR');

		var _self = this;
		var indicators = [];

		div = document.createElement('div');
		div.id = vabClassName+'-inspector';
		div.className = vabClassName+'-inspector';

		_self.elm = div;

		function _addIndicator(indicator){
			var index = indicators.indexOf(indicator);
			if(!~index) {
				indicators.push(indicator);
				div.appendChild(indicator.elm);
			}
		}

		function _removeIndicator(indicator){
			var index = indicators.indexOf(indicator);
			indicators.splice(index,1);
			indicator.elm.remove();
		}

		function _render(){
			//_debug('INSPECTOR RENDER');
			indicators.forEach(function(indicator,i,a){
				indicator.render();
			});
		}

		///

		function _loadCSS(url){
			var _url = url;
			var link = document.createElement('link');
			link.href = _url;
			link.type = 'text/css';
			link.rel = 'stylesheet';
			link.media = 'all';
			document.head.appendChild(link);
		}

		_loadCSS(cssURL);

		///

		_self.addIndicator = _addIndicator;
		_self.removeIndicator = _removeIndicator;
		_self.render = _render;
	}

	//////

	function _VAB_Indicator(elm){

		//_debug('Indicator.create : ',elm);
		
		var _self = this;

		var div = document.createElement('div');
		div.className = vabClassName+'-indicator';

		function _render(){
			//_debug('Indicator.render : ',_self.vabElm);

			var rect = _self.vabElm.getBoundingClientRect();
			//_debug(rect);
			_self.elm.style.top = rect.top+'px';
			_self.elm.style.left = rect.left+'px';
			_self.elm.style.width = rect.width+'px';
			_self.elm.style.height = rect.height+'px';

			_self.elm.innerHTML ='viewable : '+Math.round(_self.vabElm.viewableRate*100)+'%<br>time : '+_self.vabElm.activeTime+'s';
		}

		///

		_self.render = _render;
		
		_self.elm = div;
		_self.vabElm = elm;
		elm.indicator = _self;
	}

	/////
	
	_this.getRegisteredElements = function(){ return _registeredElements; }
	
	_this.registerElement = _registerElement;
	_this.unregisterElement = _unregisterElement;

	_this.toggleDebug = _toggleDebug;

	_init();
}

var vab = new VAB(
	document.currentScript.getAttribute('vab-class'),
	document.currentScript.getAttribute('debug'),
	document.currentScript.getAttribute('css') || 
	document.currentScript.getAttribute('src').replace('.js','.css')
);