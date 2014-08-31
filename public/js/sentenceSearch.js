(function () {
    angular.module('hebFN.sentenceSearch', [
	'hebFN.models',
	'hebFN.constants'
    ]).
	controller('sentenceSearch', search).
	filter('highlightTerms', highlight);

    search.$injector = ['$routeParams', 'serverConstants', 'sentenceDataService', 'luDataService'];

    function search ($routeParams, serverConstants, sentenceDataService, luDataService) {
	var self = this;
	this.lu = $routeParams.lu;

	this.frame = $routeParams.frame;

	this.results = [];
	this.page = 1;
	this.diversify = 'low';
	this.luName = this.lu.substring(0, this.lu.lastIndexOf('.'));

	this.POSs = serverConstants.constants.hebPosType;

	reset();

	this.isConnectedToLU = function () {
	    return angular.isDefined($routeParams.lu);
	};

	this.toggleTermInclude = function () {
	    self.includeTerm = !self.includeTerm;
	};

	this.addTerm = function () {
	    if (!self.term) {
		return;
	    }

	    var term = {
		word: self.term,
		pos: self.termPOS.toLowerCase(),
		type: self.termType,
		include: self.includeTerm
	    };

	    self.searchTerms.push(term);

	    resetTerm();
	};

	this.removeTerm = function (idx) {
	    self.searchTerms.splice(idx, 1);
	}

	this.updateAdditional = function () {
	    var word = self.additionalWord;
	    
	    if (!word) return;

	    self.additionalWord = '';

	    self.additionalWords.push(word);
	};

	this.removeAdditional = function (idx) {
	    self.additionalWords.splice(idx, 1);
	};

	this.reset = reset;

	this.handleEnter = function (e) {
	    if (e.keyCode === 13) {		
		self.updateAdditional();
	    }
	};

	this.doSearch = function () {
	    self.searching = true;
	    
	    if (self.term) {
		self.addTerm();
	    }
	    
	    var p = self.searchTerms[0];

	    var params = {
	/*	framename: self.frame,
		luname: self.luName,*/
		'terms[]': self.searchTerms,
		page: self.page || 1, 
		diversify : self.diversify,
		'optionals[]': self.additionalWords
	    };

	    self.results = sentenceDataService.search(params, function (results) {
		self.searching = false;
		results.map(function (x) {
		   self.luInfo.
			getSentenceLUCorrelation(x.id).
			then(function (response) {
			    x.status = response.data.status;
			});;
		});
	    });
	};

	this.getPage = function (page) {
	    self.page = page;
	    self.doSearch();
	}

	this.correlate = function (result) {
	    if (result.status !== 'good') {
		self.luInfo.sentenceCount++;
	    }

	    result.correlate(self.frame, self.lu);
	};

	this.reject = function (result) {
	    if (result.status === 'good') {
		self.luInfo.sentenceCount--;
	    }

	    result.reject(self.frame, self.lu);
	};

	this.flag = function (result) {
	    if (result.status === 'good') {
		self.luInfo.sentenceCount--;
	    }

	    result.flag(self.frame, self.lu);
	};

	function addSingleTerm (t) {
	    t = t || self.term;
	    
	    var term = {
		word: t,
		pos: self.termPOS.toLowerCase(),
		type: self.termType,
		include: self.includeTerm
	    };

	    self.searchTerms.push(term);

	    resetTerm();
	};

	function addCompoundTerm (sep) {
	    var terms = self.term.split(sep);

	    terms.forEach(function (t) {
		if (t.indexOf('@') >= 0) {
		    t = t.replace('@', '');
		    addSingleTerm(t);
		} else {
		    self.additionalWords.push(t);
		}
	    });
	}

	function reset () {
	    resetTerm();

	    self.additionalWord = '';
	    self.searchTerms = [];
	    self.additionalWords = [];

	    if (self.lu) {
		var parts = self.lu.split('.');
		self.termPOS = parts.pop().toUpperCase();
		self.term = parts.join('.');
	    }
	};

	function resetTerm () {
	    self.term = '';
	    self.termPOS = '';
	    self.termType = 'lemma';
	    self.includeTerm = true;

	    $('#term').focus();
	};

	if (angular.isDefined(this.lu)) {
	    this.doSearch();
	    this.luInfo =  luDataService.getLU(self.frame, self.lu);
	}
    };

    function highlight () {	
	var nonLetter = "[^\w\u05D0-\u05EA]";
	return function (text, words, target) {
	    var resultText = text;
	    var whatToHighlight = words.filter(function (x) {
		return x.lemma ===target;
	    });
	    
	    whatToHighlight.forEach(function (x) {
		var pattern = new RegExp(x.word+"("+nonLetter+")", 'g');
		text = text.replace(pattern, '<span class="highlightLU">'+x.word+'</span>$1');
	    });
	    
	    return text;
	}
    };
})();
