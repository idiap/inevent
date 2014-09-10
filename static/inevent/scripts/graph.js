var INCREMENT_ID = Array() ; //SD/ Unique ID for each graph object call needed to stop callbak from old objects

// CLASS WIDGET MANAGER
function Graph(div_id, display_type) {
	//SD/ Persistant variable ==================================================
	
	this.div_id = div_id ;
	this.from = null ;
	this.graph_height = 700 ;
	this.display_type = typeof display_type !== 'undefined' ? display_type : "graph" ;
	this.firstShow = true ;
	this.graphDrawn = false ;

	this.listTabTitle = { "icon": "icon-th-list", "text":"View as List", "size":12 } ;
	this.graphTabTitle = { "icon": "icon-th-large", "text":"View as Graph", "size":12 } ;

	//SD/ Set node sizes
	this.big_rect = [375.0, 300] ;

	//SD/ Define some graph level depending on max nodes
	this.graphLevel = [{},{
			'max_size':199,
			'distance':50,
			'rect_size':[7.5, 7.5]
		},{
			'max_size':99,
			'distance':100,
			'rect_size':[15.0, 15.0]
		},{
			'max_size':49,
			'distance':150,
			'rect_size':[37.5, 28.0]
		},{
			'max_size':19,
			'distance':200,
			'rect_size':[75.0, 56.0]
		}
	] ;
	
	//SD/ END OF Persistant variable ===========================================
}

	Graph.prototype.setTabsTitle = function(listTabTitle, graphTabTitle) {
		if(typeof listTabTitle !== 'undefined') {
			if(typeof listTabTitle.icon !== 'undefined')
				this.listTabTitle.icon = listTabTitle.icon ;
			if(typeof listTabTitle.text !== 'undefined')
				this.listTabTitle.text = listTabTitle.text ;
			if(typeof listTabTitle.size !== 'undefined') {
				this.listTabTitle.size = listTabTitle.size ;
			}
		}
		
		if(typeof graphTabTitle !== 'undefined') {
			if(typeof graphTabTitle.icon !== 'undefined')
				this.graphTabTitle.icon = graphTabTitle.icon ;
			if(typeof graphTabTitle.text !== 'undefined')
				this.graphTabTitle.text = graphTabTitle.text ;
			if(typeof graphTabTitle.size !== 'undefined')
				this.graphTabTitle.size = graphTabTitle.size ;
		}
	}

	Graph.prototype.getLevel = function() {
		if(this.max_size > this.graphLevel[1].max_size)
			return 1 ;
		if(this.max_size > this.graphLevel[2].max_size)
			return 2 ;
		if(this.max_size > this.graphLevel[3].max_size)
			return 3 ;

		return 4 ;
	}

	//SD/ Define graph Level from slider in graph
	Graph.prototype.setLevel = function(level) {
		if(level > 0 && level < this.graphLevel.length)
		{
			$("#" + this.div_id + "_form .user_size").val(this.graphLevel[level].max_size - 1) ;
			//FIXME: not really the correct way to reload with data like search result
			this.start_graph(this.from) ;
		}
	}

	//SD/ Get node Width depending on graphLevel
	Graph.prototype.nodeWidth = function () {
		return this.graphLevel[this.getLevel()].rect_size[0] ;
	}

	//SD/ Get node Height depending on graphLevel
	Graph.prototype.nodeHeight = function () {
		return this.graphLevel[this.getLevel()].rect_size[1] ;
	}

	//SD/ Initiate variables for a new graph load
	Graph.prototype.initVars = function() {
		//SD/ Set pcitures sizes
		this.image_rect = [this.big_rect[0] - 40, this.big_rect[1] - 120] ;
		this.snap_rect = [300 / 4, 250 / 4] ;

		this.graph_top = this.top;
		this.graph_left = this.left;

		this.queue = new Queue() ;
		this.excluded = [] ; //SD/ to store node who already displays neighbours
		this.input_links = [] ;

		this.svg = d3.select("#" + this.div_id).append("svg")
			.attr("width", this.graph_width)
			.attr("height", this.graph_height);

		this.color = {	black:"black",
						blue:"#0088cc",
						grey:"grey"} ;

		this.endOfGraph = false ;

		//SD/ Initialize the graph
		this.force = d3.layout.force()
			.linkDistance(this.graphLevel[this.getLevel()].distance)
			.charge(-50)
			.gravity(0.01)
			.nodes(this.input_nodes)
			.links(this.input_links)
			.size([this.graph_width, this.graph_height])
			.on("tick", this.boundedTick.bind(this))
			.start();
	}

	//SD/ Depending on graph size, say if we have to display picture in node
	Graph.prototype.isSnapNodeDisplay = function() {
		if(this.max_size < this.graphLevel[2].max_size)
			return true ;
		else
			return false ;
	}

	//SD/ Print HTML code for tab and link to internal function
	Graph.prototype.printTab = function() {
		var _this = this ;

		//SD/ Display tabs
		$('#' + this.div_id + '_tabs').html(
			'<div class="col-fluid span' + this.listTabTitle.size + '">' +
				'<ul class="pull-right nav nav-tabs" style="margin-bottom:0;">' +
					'<li id="' + this.div_id + '_list_tab" class="active"><a><i class="' + this.listTabTitle.icon + '"></i> ' + this.listTabTitle.text + '</a></li>' +
					'<li id="' + this.div_id + '_graph_tab"><a><i class="' + this.graphTabTitle.icon + '"></i> ' + this.graphTabTitle.text + '</a></li>' +
				'</ul>' +
			'</div>'
		) ;

		//SD/ Assign functions to tabs
		$('#' + this.div_id + '_graph_tab').bind('click', function(){_this.set_graph_tab()} );
		$('#' + this.div_id + '_list_tab').bind('click', function(){_this.set_list_tab()} );
	}

	Graph.prototype.loadGraph = function(data, width) {
		INCREMENT_ID[this.div_id]++ ;
		
		var _this = this ;
		$(document).mouseup(function (e)
		{
			var container = $("#" + _this.div_id + "_params") ;
			if (!container.is(e.target) // if the target of the click isn't the container...
				&& container.has(e.target).length === 0) // ... nor a descendant of the container
			{
				if(container.is(':visible'))
					container.parent().toggle() ;
			}
		});
		
		//console.log("graph #" + this.div_id + " increment :" + INCREMENT_ID[this.div_id]) ;
		this.increment_id = INCREMENT_ID[this.div_id] ;
		
		//SD/ Set parameters in local vars
		this.input_nodes = data.slice(0) ;

		this.initVars() ;

		this.displayLinks() ;
		this.displayNodes() ;

		this.graphDrawn = true ;
		if(!this.firstShow) {
			this.drawEmotions() ;
		}
	}
	
	Graph.prototype.updateGraph = function(new_data) {
		var _this = this ;
		
		$("#" + this.div_id + "_progress").css("width", this.input_nodes.length * 100 / this.max_size + "%") ;
		
		//SD/ Merge graphed nodes with new nodes removing duplicates
		if(typeof new_data['nodes'] !== undefined && new_data['nodes'] != null) {
			if(new_data['nodes'].length > 0) {
				//SD/ Unique isn't working here
				//this.input_nodes = $.unique($.merge(this.input_nodes, new_data['nodes'])) ;

				for(var i = 0 ; i < new_data['nodes'].length ; i++)
					this.addNodeIfUnique(new_data['nodes'][i]) ;
			}
		}

		//SD/ Prepare link and push them to input_links
		var links = new_data['links'] ;
		if(typeof new_data['links'] !== undefined && new_data['links'] != null) {
			for (var s = 0; s < links.length; s++) {
				//links[s]['target'] contains hyperevent Id and target_index 
				//returns its corresponding graph id 
				source_id = links[s]['source']
				target_id = links[s]['target']
				var target = this.find_node_index(target_id);
				var source = this.find_node_index(source_id);
				if (target!=-1 && source!=-1) {
					link = {
						"target":target,
						"source":source,
						"type":links[s]['type'],
						"depth":links[s]['depth'],
						"weight":links[s]['weight'],
						"source_id":source_id,
						"target_id":target_id,
					 }
				this.addLinkIfUnique(link)
				/*	index = this.input_links.length - 1 
					if (this.input_nodes[target].links == undefined ) {
					   this.input_nodes[target]['links']=[link]
					}
					else {
						this.input_nodes[target].links.push(link)
					}*/
						
				}
				else{
					if (target == -1){
						console.log("Missing target node: "+links[s]['target'] + " for source node: " + links[s]['source'])
					}
					if (source == -1){
						console.log("Missing source node : "+links[s]['source'] + " for target node: " + links[s]['target'])
					}
				}
			}
		}

		this.displayLinks();
		this.displayNodes();
		
		this.force.start();

		
	}

	Graph.prototype.play_event = function(d) {
		if(d.id == this.input_nodes[0]['id'] && this.video_switch == true)
			this.set_list_tab() ;
		else
			document.location.href = "/hyperevent/" + d.id;
	}

	Graph.prototype.set_center = function(d) {
		//SD/ TODO Find a way to load new page with graph by default
		document.location.href = "/hyperevent/" + d.id + "/graph" ;
		//document.location.href = "/hyperevent/" + d.id;
	}

	Graph.prototype.find_node_index = function(node_id) {
		for(var i=0; i < this.input_nodes.length; i++){
			if(parseInt(this.input_nodes[i].id) == parseInt(node_id)) {
				return i;
			}
		}
		return -1;
	}

	Graph.prototype.addNodeIfUnique = function(candidate_node) {
		for(var i=0; i < this.input_nodes.length; i++){
			if(parseInt(this.input_nodes[i].id) == parseInt(candidate_node.id)) {
				return ;
			}
		}

		this.input_nodes.push(candidate_node);

	}
	
	Graph.prototype.addLinkIfUnique = function(candidate_link) {
		for(var i=0; i < this.input_links.length; i++){
			if(parseInt(this.input_links[i].source.id) == parseInt(candidate_link.source_id) && parseInt(this.input_links[i].target.id) == parseInt(candidate_link.target_id))
			{
				return ;
			}
		}

		this.input_links.push(candidate_link);

	}
	
	
	Graph.prototype.displayNodes = function() {
		var _this = this ;

		this.node = this.svg.selectAll(".node").data(this.input_nodes);
		var drag = this.force.drag().on("dragend", this.dragend) ;

		this.nodeEnter = this.node.enter().append("svg:g");
		
		this.nodeEnter
			.attr("id", function(d) { return _this.div_id + "_node_" + d.id;})
			.attr("class", "node")
			.on("click", function(d) {
				_this.mouseover(d, _this.div_id + "_word_cloud_" + d.id, _this.div_id + "_video_title_" + d.id);
			})
			//SD/ TODO Reactive double click to release node with some good idea
			//.on("dblclick", this.dblclick)
			.call(drag); //SD/ Enable Drag&Drop 

			/*SD/ Afficher le titre de la vidéo à côté du noeud
			.append("svg:text")
				.attr("x", "5px")
				.attr("y", "0px")
				.attr("dx", 12)
				.attr("dy", ".35em")
				.text(function(d){return d.title;}) ;
			*/

		this.defs = this.nodeEnter.append("defs") ;

		//SD/ Define node picture STARTS =======================================
		this.defs.append("rect")
			.attr("id", function(d) { return _this.div_id + "_rect_node_" + d.id})
			.style("stroke-width", 4)
			.attr("class", function(d) {
				//SD/ Color in blue first node only
				if(d.depth < 1) { return "primary" } else { return "secondary" }
			})
			.style("fill", function(d) {
				if(_this.isSnapNodeDisplay()) { return "black"; }
			})
			.attr("height", function(d) {
				return _this.nodeHeight() ;
			})
			.attr("width", function(d) {
				return _this.nodeWidth() ;
			})
			.style("stroke", function(d) {
				//SD/ Color in blue first node only
				if(d.depth < 1) { return _this.color.blue }
				return _this.color.grey ;
			})
			.attr("rx", "5")
			.attr('x', function(d) {
				return -_this.nodeWidth() / 2 ;
			})
			.attr('y', function(d) {
				return -_this.nodeHeight() / 2 ;
			}) ;

		this.nodeEnter.append("use")
			.attr("xlink:href", function(d) { return "#" + _this.div_id + "_rect_node_" + d.id});

		//SD/ If node display event Snapshot
		if(this.isSnapNodeDisplay()) {
			//SD/ Define clip for a rounded picture
			this.defs.append("svg:clipPath")
				.attr("id", function(d) { return "clip" + d.id})
				.append("use")
				.attr("xlink:href", function(d) { return "#" + _this.div_id + "_rect_node_" + d.id});

			//SD/ Insert the picture and link to clip
			this.nodeEnter.append("image")
				.attr("id", function(d) { return _this.div_id + "_image_" + d.id})
				.attr("xlink:href", function(d) { return d.snapshot_url })
				.attr("height", function(d) {
					return _this.nodeHeight() - 4 ;
				})
				.attr("width", function(d) {
					return _this.nodeWidth() - 4 ;
				})
				.attr("class", "graph_images")
				.attr('x', function(d) {
					return -_this.nodeWidth() / 2 + 2 ;
				})
				.attr('y', function(d) {
					return -_this.nodeHeight() / 2 + 2 ;
				})
				.attr("clip-path", function(d) { return "url(#"+"clip" + d.id +")"}) ;
		}
		
		//SD/ Define node picture ENDS =========================================

		//SD/ Define window STARTS =============================================
		
		//SD/ Container of windows displayed on click
		var rect = this.nodeEnter.append("rect")
			.attr("id", function(d) { return _this.div_id + "_rect_" + d.id})
			.attr("class",  function(d) { return "word_cloud"+ " " + _this.div_id + "_word_cloud_" + d.id})
			.attr("height", this.big_rect[1])
			.attr("width", this.big_rect[0])
			.style("stroke", function(d) {
				//SD/ Color in blue first node only
				if(d.depth < 1) { return _this.color.blue } else { return _this.color.grey }
			})
			.style("fill","white") // Make the nodes hollow looking
			.style("stroke-width", 2) // Give the node strokes some thickness
			.attr('x', -this.big_rect[0]/2)
			.attr('y', -this.big_rect[1]/2)
			.attr('rx', 5)
			.attr('ry', 5);

		//SD/ Video snapshot
		this.nodeEnter.append("image")
			.attr("id", function(d) { return _this.div_id + "_cloud_" + d.id})
			.attr("class",  function(d) { return "word_cloud"+ " " + _this.div_id + "_word_cloud_" + d.id})
			.attr("xlink:href", function(d) { return d.snapshot_url })
			.attr('x', function(d) { return -_this.image_rect[0] / 2})
			.attr('y', function(d) { return -_this.big_rect[1] / 2 + 10})
			.attr("height", this.snap_rect[1])
			.attr("width", this.snap_rect[0]) ;
		  //.attr("clip-path", function(d) { return "url(#"+"clip_zoom"+d.id +")"});

		//SD/ SVG Container for word cloud generation (replace video snapshot)
		this.nodeEnter.append("svg")
			.attr("id", function(d) { return _this.div_id + "_topwords_" + d.id})
			.attr("class",  function(d) { return "word_cloud"+ " " + _this.div_id + "_word_cloud_" + d.id})
			.attr('x', -this.image_rect[0] / 2)
			.attr('y', -this.image_rect[1] / 2 + this.snap_rect[1] / 2 - 20)
			.attr("height", this.image_rect[1])
			.attr("width", this.image_rect[0])
			.attr("viewport-fill", "#ff0000") ;

		// Adapt node display depending on Web Browser
		var browser = window.navigator.userAgent.toLowerCase();
		var version = window.navigator.appVersion;

		if ( (browser.indexOf("firefox")>-1) || ( (browser.indexOf("safari")>-1) && version>6)) {
			//HTML incrustation if browser support foreignObject
			this.nodeEnter.append('svg:foreignObject')
				.attr("id", function(d) { return _this.div_id + "_centralize_" + d.id})
				.attr("class",  function(d) { return "word_cloud"+ " " + _this.div_id + "_word_cloud_" + d.id})
				.attr("height", 30)
				.attr("width", 80)
				.attr("color","#707070")
				//.attr("requiredExtensions","http://www.w3.org/1999/xhtml")
				.attr('x', -this.image_rect[0]/2)
				.attr('y', 110)
				.on("click", function(d) { d3.event.stopPropagation(); _this.play_event(d);})
				.append("xhtml:body")
				.attr("xmlns","http://www.w3.org/1999/xhtml")
				.html('<button class="btn btn-small" value="btn" type="button"> <i class="icon-play"></i> Go</button> ');

			this.nodeEnter.append('svg:foreignObject')
				.attr("id", function(d) { return _this.div_id + "_center_" + d.id})
				.attr("class",  function(d) { return "word_cloud"+ " " + _this.div_id + "_word_cloud_" + d.id})
				.attr("height", 30)
				.attr("width", 80)
				//.attr("requiredExtensions","http://www.w3.org/1999/xhtml")
				.attr('x', -this.image_rect[0]/2 + 130)
				.attr('y', 110)
				.on("click", function(d) { d3.event.stopPropagation(); _this.set_center(d);})
				.append("xhtml:body")
				.attr("xmlns","http://www.w3.org/1999/xhtml")
				.html('<button class="btn btn-small" value="btn" type="button" >Center</button>');

			this.nodeEnter.append('svg:foreignObject')
				.attr("id", function(d) { return _this.div_id + "_close_" + d.id})
				.attr("class",  function(d) { return "word_cloud"+ " " + _this.div_id + "_word_cloud_" + d.id})
				.attr("height", 30)
				.attr("width", 80)
				//.attr("requiredExtensions","http://www.w3.org/1999/xhtml")
				.attr('x', -this.image_rect[0]/2 + 260)
				.attr('y', 110)
				.on("click", function(d) {d3.event.stopPropagation(); mouseout(d,_this.div_id + "_word_cloud_" + d.id); return false})
				.append("xhtml:body")
				.attr("xmlns","http://www.w3.org/1999/xhtml")
				.html('<button class="btn btn-small" value="btn" type="button" ><b>[x]</b> Close</button>');
		}
		else {
			//Explorers who does not support the use of foreignObjects in SVG
			this.nodeEnter.append('image')
				.attr("id", function(d) { return _this.div_id + "_centralize_" + d.id})
				.attr("class",  function(d) { return "word_cloud"+ " " + _this.div_id + "_word_cloud_" + d.id})
				.attr("height", 33)
				.attr("width",69)
				.attr('x', -this.image_rect[0]/2)
				.attr('y', 110)
				.on("click", function(d) { d3.event.stopPropagation(); _this.play_event(d);})
				.attr("xlink:href", static_url + "inevent/images/play_button.png");

			this.nodeEnter.append('image')
				.attr("id", function(d) { return _this.div_id + "_center_" + d.id})
				.attr("class",  function(d) { return "word_cloud"+ " " + _this.div_id + "_word_cloud_" + d.id})
				.attr("height", 33)
				.attr("width", 80)
				.attr('x', -this.image_rect[0]/2 + 130)
				.attr('y', 110)
				.on("click", function(d) { d3.event.stopPropagation(); _this.set_center(d);})
				.attr("xlink:href", static_url + "inevent/images/center_button.png");

			this.nodeEnter.append('image')
				.attr("id", function(d) { return _this.div_id + "_close_" + d.id})
				.attr("class",  function(d) { return "word_cloud"+ " " + _this.div_id + "_word_cloud_" + d.id})
				.attr("height", 33)
				.attr("width", 79)
				.attr('x', -this.image_rect[0]/2 + 260)
				.attr('y', 110)
				.on("click", function(d) {d3.event.stopPropagation(); mouseout(d,_this.div_id + "_word_cloud_" + d.id); return false})
				.attr("xlink:href", static_url + "inevent/images/close_button.png");
		}
		//SD/ Define window ENDS ===============================================

		//SD/ Define title
		var node_text = this.nodeEnter.append('text')
			.attr("id", function(d) { return _this.div_id + "_video_title_" + d.id})
			.attr("height", 60)
			.attr("class",  function(d) { return "word_cloud"+ " " + _this.div_id + "_word_cloud_" + d.id})
			.attr("fill","#707070")
			.attr("width", this.image_rect[0])
			.attr('x', function(d) { return  -_this.image_rect[0] / 2 + _this.snap_rect[0] + 20})
			.attr('y', function(d) { return -_this.big_rect[1] / 2 + 30})

		//SD/TODO : What is the purpose of this code ?
		this.nodeEnter.append("title")
			.text(function(d) { return d.title; });
		
		this.node.exit().remove();
	}

	Graph.prototype.displayLinks = function() {
		var _this = this ;
		
		this.link = this.svg.selectAll(".link").data(this.input_links);
			this.linkEnter=this.link.enter().append("line")
				.attr("class", function(d) {
					if (d.type == "emotion")
						{ return "link emotion-type" }
					else
						{ return "link content-type" }
				})
				.style("stroke-width",function(d) {
					if(_this.getLevel() < 4)
						return d.weight * 2 ;
					else
						return d.weight ;
				})
				.style("stroke", function(d) { 
					//SD/ Color in red links the emotional link
					if (d.type == "emotion")
						{ return "#ff0000" }

					//SD/ Color in blue links of first node only
					if(d.depth < 2)
						{ return _this.color.blue }
					else
						{ return _this.color.grey }
				})
				.attr("x1", function(d) { return d.source.x})
				.attr("y1", function(d) { return d.source.y})
				.attr("x2", function(d) { return d.target.x})
				.attr("y2", function(d) { return d.target.y})
				.attr("id",function(d) { return _this.div_id + "_link_"+ d.source_id + "_" + d.target_id});
		
		this.link.exit().remove();
		//SD/ Push lines to background
		//this.svg.selectAll(".link").moveToBack();
	}

	Graph.prototype.boundedTick = function() {
		var node = this.svg.selectAll(".node");
		var link = this.svg.selectAll(".link");
		var _this = this ;

		node.attr("cx", function(d) { return d.x; })
		node.attr("cy", function(d) { return d.y; })

		//SD/ Comment this to remove boxe limitation to draw
		node.attr("cx", function(d) { return d.x = Math.max(_this.nodeWidth() / 2 + 2, Math.min(_this.graph_width - _this.nodeWidth() / 2 - 2, d.x)); }) ;
		node.attr("cy", function(d) { return d.y = Math.max(_this.nodeHeight() / 2 + 2, Math.min(_this.graph_height - _this.nodeHeight() / 2 - 2, d.y)); }) ;

		link.attr("x1", function(d) { return d.source.x; })
			.attr("y1", function(d) { return d.source.y; })
			.attr("x2", function(d) { return d.target.x; })
			.attr("y2", function(d) { return d.target.y; });

		node.attr("transform", function(d) {
			return "translate(" + d.x + "," + d.y + ")";
		});
	}
	
	Graph.prototype.getExcludedEvent = function() {
		return this.excluded ;
	}

	Graph.prototype.addExclusion = function(event_id) {
		if(typeof event_id != undefined)
			this.excluded.push(event_id) ;
	}

	Graph.prototype.isExcluded = function(id) {
		for(var i = 0 ; i < this.excluded.length ; i++) {
			if(id == this.excluded[i])
				return true ;
		}
		return false ;
	}

	Graph.prototype.setWidth = function(new_width) {
		this.width = new_width ;
		if (this.margin!=undefined) {
			this.graph_width = this.width - (19 * 2) ;
		
			this.svg.attr("width", this.graph_width) ;
			this.force.start();
		}
	}
	
	Graph.prototype.pickElement = function() {
		node = this.queue.firstQueue() ;
		this.queue.deQueue() ;
		
		return node[0] ;
	}
	
	Graph.prototype.addElement = function(nodes) {
		if(typeof nodes !== undefined && nodes != null) {
			//SD/ Remove some neighbours if nodes limit reached
			var rest = this.max_size - this.input_nodes.length ;
			if(nodes.length > rest)
				nodes.splice(rest , nodes.length - rest) ;
			
			//SD/ Enqueue neighbours
			for(var i = 0 ; i < nodes.length ; i++) {
				if(!this.isExcluded(nodes[i]['id']) && (nodes[i]['depth'] <= this.max_depth || this.max_depth == 6))
					this.queue.enQueue(nodes[i]) ;
			}
		}
	}
	
	Graph.prototype.stillElement = function() {
		if(this.queue.sizeQueue() > 0)
			return true ;
		else
			return false ;
	}
	
	Graph.prototype.dragend = function(d) {
		var _this = this ;
		d3.select("#" + _this.div_id + "_rect_node_" + d.id).classed("fixed", d.fixed = true);
	}
	
	Graph.prototype.dblclick = function(d) {
		d.fixed = false ;
	}
	
	Graph.prototype.mouseover = function(d, display_class, title_id){
		if (d3.event.defaultPrevented) return;
		
		d3.event.stopPropagation();
		
		//SD/ Get word cloud
		if($("#" + this.div_id + "_topwords_" + d.id).html() == "")
			this.draw_cloud(d.id) ;
		
		if(this.endOfGraph && d != undefined) {
			zoom_in(d, this.div_id + "_node_" + d.id, this.div_id + "_rect_" + d.id, this.graph_left, this.graph_width, this.graph_top, this.graph_height, display_class);

			//SD/ Reduce title length to suite with container
			if(d.title.length > 40)
				d.title = d.title.substring(0, 35) + "..." ;

			display_title(d.title, this.div_id + "_video_title_" + d.id);
			return true ;
		}
		else
			return false ;
	}

	//SD/ Draw an SVG word cloud
	Graph.prototype.draw_cloud = function(hyperEventId) {
		var _this = this ;
	
		for(var i in this.input_nodes)
			if(this.input_nodes[i].id == hyperEventId)
				transcriptUrl = this.input_nodes[i].transcript_url ;
		
		//SD/ Retrive transcript file
		Dajaxice.inevent.get_transcript
		(
			function(data)
			{
				var allWords = [] ;
				var countWords = [] ;
				var topWords = [] ;
			
				//SD/ Common word to https://github.com/jdf/cue.language/tree/master/src/cue/lang/stop
				var englishCommons = ["i", "me", "my", "myself", "we", "us", "our", "ours", "ourselves", "you", "your", "yours", "yourself", "yourselves", "he", "him", "his", "himself", "she", "her", "hers", "herself", "it", "its", "itself", "they", "them", "their", "theirs", "themselves", "what", "which", "who", "whom", "whose", "this", "that", "these", "those", "am", "is", "are", "was", "were", "be", "been", "being", "have", "has", "had", "having", "do", "does", "did", "doing", "will", "would", "should", "can", "could", "ought", "i'm", "you're", "he's", "she's", "it's", "we're", "they're", "i've", "you've", "we've", "they've", "i'd", "you'd", "he'd", "she'd", "we'd", "they'd", "i'll", "you'll", "he'll", "she'll", "we'll", "they'll", "isn't", "aren't", "wasn't", "weren't", "hasn't", "haven't", "hadn't", "doesn't", "don't", "didn't", "won't", "wouldn't", "shan't", "shouldn't", "can't", "cannot", "couldn't", "mustn't", "let's", "that's", "who's", "what's", "here's", "there's", "when's", "where's", "why's", "how's", "a", "an", "the", "and", "but", "if", "or", "because", "as", "until", "while", "of", "at", "by", "for", "with", "about", "against", "between", "into", "through", "during", "before", "after", "above", "below", "to", "from", "up", "upon", "down", "in", "out", "on", "off", "over", "under", "again", "further", "then", "once", "here", "there", "when", "where", "why", "how", "all", "any", "both", "each", "few", "more", "most", "other", "some", "such", "no", "nor", "not", "only", "own", "same", "so", "than", "too", "very", "say", "says", "said", "shall"] ;
				//SD/ List provided by Catherine Lai
				var dict = $.merge(englishCommons, ["uh-huh", "um-hum", "oh", "right", "okay", "no", "yes", "so", "huh", "that's right", "and", "really", "but", "um", "uh", "you know", "that's true", "sure", "oh yeah", "i know", "exactly", "hm", "or", "hum", "wow", "well", "yep", "i see", "but uh", "all right", "and uh", "oh really", "noise", "it is", "uh yeah", "i", "um yeah", "that's", "that's great", "absolutely", "i agree", "do you", "bye-bye", "huh-uh", "well yeah", "i mean", "it's", "uh no", "gosh", "oh okay", "i do", "that's good", "good", "but um", "that", "definitely", "ooh", "boy", "i don't", "that's interesting", "you too", "it", "oh no", "so uh", "is it", "my", "i'm sorry", "and um", "my goodness", "oh yes", "are you", "thank you", "great", "what", "um um-hum", "isn't it", "bye", "ah", "me too", "i haven't", "oh my", "they", "well no", "hello", "ye[ah]", "hi", "hum-um", "oh wow", "um no", "and so", "did you", "i think", "that's nice", "not really", "that's it", "go ahead", "they do", "oh boy", "my gosh"]) ;
				//SD/ Usually found in our translations
				var dict = $.merge(englishCommons, ["yeah", "laughter", "applause"]) ;
				var dict = $.merge(englishCommons, ["", "--"]) ;

				//SD/ Extract all words in lowercase from transcript sentences
				for(var i in data['transcripts']) {
					var line = data['transcripts'][i].value.toLowerCase() ;
					line = line.split(",").join(" ") ;
					line = line.split(".").join(" ") ;
					line = line.split("\"").join(" ") ;
					line = line.split("(").join(" ") ;
					line = line.split(")").join(" ") ;
					words = line.split(" ") ;
					
					//SD/ TODO Here remove the words
					//SD/ Remove common words
					//SD/ TODO choose dict depending on language ?
					for(var i in words) {
						for(var j in dict) {
							if(words[i] != null) {
								if(dict[j].search(" ") < 0){
									//SD for one single word to compare
									if(dict[j] == words[i] || words[i].length <= 1) {
										delete words[i] ;
									}
								}
								else {
									//SD/ for a sentence to compare
									var elements = dict[j].split(" ") ;
									var element_matches = true ;
								
									for(var k in elements) {
										var word_position = parseInt(i) + parseInt(k) ;
										
										if(elements[k] != words[word_position]) {
											element_matches = false ;
										}
									}
								
									if(element_matches) {
										for(var k=0 ; k<elements.length ; k++) {
											var word_position = parseInt(i) + parseInt(k) ;
											delete words[word_position] ;
										}
									}
								}
							}
						}
					}
					
					if(words.length > 0)
						allWords = $.merge(allWords, words) ;
				}

				//SD/ Count words found
				for(var i in allWords) {
					var found = false ;
					for(var j in countWords) {
						if(allWords[i] == countWords[j].text) {
							countWords[j].size++ ;
							found = true ;
						}
					}
					if(!found && allWords[i] != null)
						countWords.push({ text: allWords[i], size: 1 }) ;
				}

				// sort array by descending frequency | http://stackoverflow.com/a/8837505
				countWords = countWords.sort(function(a,b){
					return (a.size > b.size) ? -1 : ((a.size < b.size) ? 1 : 0) ;
				});

				var maxCount = countWords[0].size ;
				var percentCount = 100 / maxCount ;
				
				//SD/ Display only the top20 of words with 5 as minimal size
				for(var i=0 ; i<20 ; i++) {
					topWords[i] = countWords[i] ;
					topWords[i].size = (percentCount * topWords[i].size / 3) + 5 ;
				}

				console.log(topWords) ;

				//SD/ Draw the cloud
				var fill = d3.scale.category20();
				d3.layout.cloud().size([_this.image_rect[0], _this.image_rect[1]])
					.words(topWords)
					.padding(5)
					.rotate(0)
					.font("Impact")
					.fontSize(function(d) { return d.size; })
					.on("end", draw)
					.start();

				function draw(words) {
					d3.select("#" + _this.div_id + "_topwords_" + data["event_id"])
						.append("rect")
							.style("fill", "#dbdbdb")
							.attr('x', -_this.image_rect[0] / 2)
							.attr('y', -_this.image_rect[1] / 2 + _this.snap_rect[1] / 2 - 20)
							.attr("height", _this.image_rect[1]*2)
							.attr("width", _this.image_rect[0]*2)
					
					d3.select("#" + _this.div_id + "_topwords_" + data["event_id"])
						.append("g")
							.attr("transform", "translate(" + (_this.image_rect[0] / 2) + ", " + (_this.image_rect[1] / 2) + ")")
							.selectAll("text")
							.data(words)
							.enter().append("text")
							.style("font-size", function(d) {
								return d.size + "px";
							})
							.style("font-family", "Impact")
							.style("fill", function(d, i) {
								return fill(i);
							})
							.attr("text-anchor", "middle")
							.attr("transform", function(d) {
								return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
							})
							.text(function(d) {
								return d.text;
							});
				}
			},
			{'transcript_url': transcriptUrl, 'event_id': hyperEventId, 'error_callback': this.display_graph_error}
		);
	}

	Graph.prototype.finalizeGraph = function() {
		//SD/ Draw word clouds
		/*
		for(var i in this.input_nodes){
			this.draw_cloud(this.input_nodes[i].id) ;
		}
		*/

		$("#" + this.div_id + "_progress").css("width", "100%") ;
		$("#" + this.div_id + "_progress").parent().animate({height : 0}) ;

		console.log("End of queue after exclusion with " + this.input_nodes.length + " nodes and " + this.input_links.length + " links") ;

		//SD/ Changing node position to back or front have to be done at end of graph
		this.svg.selectAll(".node").sort(function (a, b) {
			if (a.depth > b.depth) return -1;
			else return 1;
		});

		this.svg.selectAll(".link").moveToBack();

		this.endOfGraph = true ;
	}
	
	//SD/ Initiate the first graph and call dynamically next data
	Graph.prototype.display_graph_head = function(data, video_switch, max_neighbours, max_depth, max_size) {
		try
		{
			var _this = this ;

			this.video_switch = typeof video_switch !== 'undefined' ? video_switch : false;
			this.max_neighbours = typeof max_neighbours !== 'undefined' ? max_neighbours : 3;
			this.max_depth = typeof max_depth !== 'undefined' ? max_depth : 2;
			this.max_size = typeof max_size !== 'undefined' ? max_size : 10;

			if(data.length > 0)
			{
				position = $('#' + this.div_id).position();
				this.top = position['top'] ;
				this.left = position['top'] ;

				this.graph_width = $("#" + this.div_id + "_container").width() - (19 * 2) ;

				//SD/ Prepare queue for nodes
				for(var i=0 ; i < data.length ; i++) {
					data[i]['depth'] = 0 ;
				}

				//SD/ If only one head node, put it fixed in center of graph
				if(data.length == 1) {
					data[0]['fixed'] = true ;
					data[0]['x'] = (this.graph_width - this.nodeWidth()) / 2 ;
					data[0]['y'] = (this.graph_height - this.nodeHeight()) / 2 ;
				}

				//SD/ If max_size is zero, init a data table
				if(max_size == 0)
					data = [] ;

				//SD/ Erease graph container and draw graph
				$('#' + this.div_id).html(
					'<div>' +
						'<div class="zoom pull-right">' +
							'<span title="Zoom out" onclick="graphs[\'' + this.div_id + '\'].setLevel(' + (this.getLevel() - 1) + ');"><i class="icon-zoom-out"></i></span>' +
							'<span><input onchange="graphs[\'' + this.div_id + '\'].setLevel(this.value);" class="input-medium" type="range" min="1" max="4" step="1" value="' + this.getLevel() + '"></input></span>' +
							'<span title="Zoom in" onclick="graphs[\'' + this.div_id + '\'].setLevel(' + (this.getLevel() + 1) + ');"><i class="icon-zoom-in"></i></span>' + 
							'<span title="Advanced settings" onclick="$(\'#' + this.div_id + '_params\').parent().toggle() ;"><i class="icon-cog"></i></span>' +
						'</div>' +
					'</div>' +
					'<div class="progress progress-striped active"><div id="' + this.div_id + '_progress" class="bar" style="width:0%"></div></div>'
				) ;

				this.loadGraph(data, $("#" + this.div_id + "_container").width());

				if(max_size > 0) {
					this.addElement(data)
					var first = this.pickElement() ;
		
					params = {'event_id': first['id'], 'count': 1, 'depth': 1, 'num_of_similar': this.max_neighbours, 'error_callback': this.display_graph_error} ;
					Dajaxice.inevent.get_graph_neighbours(function(data){
						_this.display_graph(data, _this.display_graph);}, params) ;
				}
			}
			else
			{
				this.display_graph_error('No data returned from server.') ;
			}
		}
		catch(e){
			this.display_graph_error(e) ;
		}
	}

	//SD/ update graph with children data
	Graph.prototype.display_graph = function(data, callback) {
		try {
			var _this = this ;

			if(data['nodes'] != undefined && (typeof data != "XMLHttpRequest"))
			{
				this.addExclusion(data['caller_id']) ;
				this.addElement(data['nodes']) ;

				if(data['nodes'].length > 0) {
					//SD/ Graph node and prepare its links for next neighbours
					if(data['nodes'][0]['depth'] <= this.max_depth || this.max_depth == 6)
						this.updateGraph({'nodes': data['nodes'], 'caller_id': data['caller_id'], 'links': data['links']}) ;
				}

				//SD/ Check exclusion for next node
				if(this.stillElement()) {
					var first = this.pickElement() ;
		
					if(callback != undefined && this.increment_id == INCREMENT_ID[div_id]) {
						params = {'event_id': first['id'], 'count': data['count'] + 1, 'depth': first['depth'] + 1, 'num_of_similar': this.max_neighbours, 'error_callback': this.display_graph_error} ;
						callback(
							Dajaxice.inevent.get_graph_neighbours(function(data){
								_this.display_graph(data, _this.display_graph.bind(this)); }, params)
						) ;
					}
				}
				else {
					this.finalizeGraph() ;
				}
			}
		}
		catch(e){
			this.display_graph_error(e) ;
		}
	}

	Graph.prototype.start_graph = function(from, firstRun) {
		if(this.from == null && from != null) {
			this.from = from ;
		}

		var _this = this ;
		var from = typeof from !== 'undefined' ? from : null;
		var firstRun = typeof firstRun !== 'undefined' ? firstRun : false;

		//SD/ Get default settings
		var max_neighbours = $("#" + this.div_id + "_form .user_neighbours").val() ;
		var max_depth = $("#" + this.div_id + "_form .user_depth").val() ;
		var max_size = $("#" + this.div_id + "_form .user_size").val() ;

		//SD/ Update settings
		window["update_" + this.div_id + "_value"](firstRun) ;

		if(firstRun === true) {
			//SD/ Print tabs
			this.printTab() ;
			
			//SI/ choosing between a list and a graph view
			if(this.display_type == "list")
				this.set_list_tab() ;
			else
				this.set_graph_tab() ;
		}
		
		//SD/ Display 5 firsts video as origin
		if(this.from == null) {
			Dajaxice.inevent.get_graph_head(
				function(data){_this.display_graph_head(data, video_switch=false, max_neighbours, max_depth, max_size);},
				{'num_of_events': 5, 'error_callback': this.display_graph_error}
			);
		}
		//SD/ Or display the specific choosen from ID video as origin
		else if(this.from === parseInt(this.from)) {
			Dajaxice.inevent.get_event_head(
				function(data) {_this.display_graph_head(data, video_switch=true, max_neighbours, max_depth, max_size);},
				{'id': _this.from, 'error_callback': this.display_graph_error});
		}
		//SD/ Or display the specific choosen video from data as origin
		else {
			this.display_graph_head(this.from, video_switch=false, max_neighbours, max_depth, max_size) ;
		}
	}

	Graph.prototype.set_graph_tab = function() {
		_this = this ;
		
		//SD/ Switch active button
		if($('#' + this.div_id + '_list_tab').hasClass('active')==true)
			$('#' + this.div_id + '_list_tab').removeClass('active') ;
		$('#' + this.div_id + '_graph_tab').addClass('active') ;

		//SD/ Change tab size if they are different
		if(this.listTabTitle.size != this.graphTabTitle.size) {
			for(var i=1 ; i<=12 ; i++)
				$('#' + this.div_id + '_tabs div').removeClass('span' + i) ;
			$('#' + this.div_id + '_tabs div').addClass('span' + this.graphTabTitle.size) ;
		}

		$('#' + this.div_id).show(0, function() {
			if(_this.firstShow && _this.graphDrawn) {
				_this.drawEmotions() ;
			}
		
			_this.firstShow = false ;
		}) ;

		//SI/ hide player iframe or list
		$('#' + this.div_id + '_list').css({"display":"block","visibility":"hidden","height":"0px","width":"0px"});
		//SD/ Add a display none rule only if no iframe (incompatible)
		if ($('#' + this.div_id + '_list iframe').length <= 0)
			$('#' + this.div_id + '_list').css("display", "none") ;
		$('#' + this.div_id + '_container .graph_sidepane').show() ;

		$('#' + this.div_id + '_params').show() ;
	}

	Graph.prototype.set_list_tab = function() {
		//SD/ Switch active button
		if($('#' + this.div_id + '_graph_tab').hasClass('active')==true)
			$('#' + this.div_id + '_graph_tab').removeClass('active') ;
		$('#' + this.div_id + '_list_tab').addClass('active') ;

		//SD/ Change tab size if they are different
		if(this.listTabTitle.size != this.graphTabTitle.size) {
			for(var i=1 ; i<=12 ; i++)
				$('#' + this.div_id + '_tabs div').removeClass('span' + i) ;
			$('#' + this.div_id + '_tabs div').addClass('span' + this.listTabTitle.size) ;
		}

		//SD/ Switch element
		$('#' + this.div_id).hide() ;
		//SI/ show player iframe
		$('#' + this.div_id + '_list').css({"display":"block","visibility":"visible","height":this.graph_height,"width":"100%"});
		$('#' + this.div_id + '_container .graph_sidepane').hide() ;

		$('#' + this.div_id + '_params').hide() ;
	}

	Graph.prototype.setEmotion = function(emotion) {
		if($("#" + this.div_id + "_container .emotions-buttons ." + emotion).html() != emotion) {
			$("#" + this.div_id + "_container .user_emotions input").val(0) ;
			$("#" + this.div_id + "_container .user_" + emotion).val(60) ;
		}
		else {
			$("#" + this.div_id + "_container .user_emotions input").val(100) ;
		}
	}

	Graph.prototype.applyFilter = function() {
		var toHide = new Array() ;
		var nodeDate = null ;
		var sliderDates = $("#" + this.div_id + "_dateFilter").dateRangeSlider("values");

		for(var i in this.input_nodes) {
			nodeDate = new Date(this.input_nodes[i].date_ms) ;
			if(nodeDate.getTime() < sliderDates.min || nodeDate.getTime() > sliderDates.max)
				toHide.push(this.input_nodes[i].id) ;
		}

		//SD/ Display all nodes and hide out of date range
		this.showAll() ;
		this.hideNodesAndTheirLinks(toHide) ;

		//SD/ Hide Discusssions if necessary
		if($("#" + this.div_id + "_discussionFilter")[0].checked !== true) {
			var toHide = new Array() ;
			for(var i in this.input_nodes)
				if(this.input_nodes[i].providerName == "Radvision")
					toHide.push(this.input_nodes[i].id) ;

			console.log(toHide) ;
			this.hideNodesAndTheirLinks(toHide) ;
		}

		//SD/ Hide Lecturers if necessary
		if($("#" + this.div_id + "_lectureFilter")[0].checked !== true) {
			var toHide = new Array() ;
			for(var i in this.input_nodes)
				if(this.input_nodes[i].providerName == "TED" || this.input_nodes[i].providerName == "Klewel")
					toHide.push(this.input_nodes[i].id) ;

			console.log(toHide) ;
			this.hideNodesAndTheirLinks(toHide) ;
		}
	}

	Graph.prototype.drawEmotions = function() {
		var _this = this ;
		var htmlContent = "" ;
		
		htmlContent += '<h5>Style</h5>' ;
		htmlContent += '<table><tr><td>' ;
		var emotions = Array("ingenious", "fascinating", "funny", "inspiring", "persuasive", "courageous") ;
		for(var i=0 ; i < emotions.length / 2 ; i++) {
			htmlContent += '<p>' ;
				htmlContent += '<input type="checkbox" checked="checked" onchange="graphs[\'' + this.div_id + '\'].setEmotion(\'' + emotions[i] + '\');"> <span class="' + emotions[i] + '"></span> ' + emotions[i] ;
			htmlContent += '</p>' ;
		}
		htmlContent += '</td><td>' ;
		for(var i=emotions.length / 2 ; i < emotions.length ; i++) {
			htmlContent += '<p>' ;
				htmlContent += '<input type="checkbox" checked="checked" onchange="graphs[\'' + this.div_id + '\'].setEmotion(\'' + emotions[i] + '\');"> <span class="' + emotions[i] + '"></span> ' + emotions[i] ;
			htmlContent += '</p>' ;
		}
		htmlContent += '</td></tr></table>' ;
		
		htmlContent += '<hr>' ;

		htmlContent += '<h5>Type</h5>' ;
		htmlContent += '<p><input id="' + this.div_id + '_discussionFilter" type="checkbox" checked="checked" onchange="graphs[\'' + this.div_id + '\'].applyFilter()"> Discussion</p>' ;
		htmlContent += '<p><input id="' + this.div_id + '_lectureFilter" type="checkbox" checked="checked" onchange="graphs[\'' + this.div_id + '\'].applyFilter()"> Lecture</p>' ;

		htmlContent += '<hr>' ;

		htmlContent += '<h5>Date</h5><br>' ;
		htmlContent += '<p><div id="' + this.div_id + '_dateFilter"></div></p>' ;

		$("#" + this.div_id + "_container .filter-container").html(htmlContent) ;
		$("#" + this.div_id + "_dateFilter").dateRangeSlider({
			arrows: false,
			symmetricPositionning: true,
			range: {min: 0},
			bounds: {min: new Date(2000, 0, 1), max: Date.now()},
			defaultValues: {min: new Date(2000, 0, 1), max: Date.now()},
		}) ;
		$("#" + this.div_id + "_dateFilter").bind("valuesChanged", function(e, data){ _this.applyFilter() }) ;
	}

	Graph.prototype.display_graph_error = function(error) {
		$('#' + this.div_id).html('<div class="alert alert-error" style ="margin-top:100px;position:relative;margin-bottom:100px">Unable to load graph. Please try again later.<br/>' + error + '</div>');
	}
	
	
	Graph.prototype.ToggleNodesAndTheirLinks = function (nodes, links, visibility_type) {	
		var _this = this;
		nodes.forEach(function(node){
			$('#'+_this.div_id + "_node_" + node.id).attr("opacity",visibility_type);
			
		})		
		links.forEach(function(link){
			$('#'+_this.div_id + "_link_" + link.source.id+"_"+link.target.id).attr("opacity",visibility_type);
			
		})

	}
	
	Graph.prototype.showNodesAndTheirLinks = function (ids) {
		items = this.selectGraphsItemsFromHypereventIds(ids);
		this.ToggleNodesAndTheirLinks(items[0], items[1],'1')
	}
	
	Graph.prototype.hideNodesAndTheirLinks = function (ids) {
		items = this.selectGraphsItemsFromHypereventIds(ids);
		this.ToggleNodesAndTheirLinks(items[0], items[1],'0.2')
	}
	
	Graph.prototype.showAll = function (ids) {
		this.ToggleNodesAndTheirLinks(this.input_nodes,this.input_links,'1')
	}
	
	Graph.prototype.selectGraphsItemsFromHypereventIds = function (ids) {
		var selected_nodes = this.input_nodes.filter(function (l) {
			return ids.indexOf(l.id)!=-1;
		});
		var selected_links = this.input_links.filter(function (l) {
			return (ids.indexOf(parseInt(l.source_id))!=-1 || ids.indexOf(parseInt(l.target_id))!=-1);
		});
		return [selected_nodes, selected_links];
	}
	
function Queue() {
	this.queue = [] ;
}

	//SD/ Enqueue if not excluded
	Queue.prototype.enQueue = function(node) {
		if(typeof node !== undefined && node != null)
			this.queue.push(node) ;
	}
	
	Queue.prototype.deQueue = function() {
		this.queue.splice(0, 1) ;
	}
	
	Queue.prototype.firstQueue = function() {
		return [this.queue[0]] ;
	}

	Queue.prototype.sizeQueue = function() {
		return this.queue.length ;
	}

/*SD/ ==========================================================================
Function called to display graph and get data
==============================================================================*/

//SD/ If windows is resized
$( window ).resize(function() {
	//SD/ adapt graph size with container width
	for(i in graphs) {
		graphs[i].setWidth($("#" + this.div_id + "_container").width()) ;
		window["update_" + graphs[i].div_id + "_value"](false) ;
	}
});
