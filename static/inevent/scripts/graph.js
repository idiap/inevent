// CLASS WIDGET MANAGER
function Graph() {
	this.initVars = function() {
		this.small_rect = [75.0, 56.0] ;
		this.big_rect = [300.0, 250.0] ;
		this.image_rect = [this.big_rect[0] - 40, this.big_rect[1] - 70] ;

		this.margin = {top: 0, right: 0, bottom: 0, left: 0} ;
		this.graph_width = this.width - this.margin.left - this.margin.right ;
		this.graph_height = this.height - this.margin.top - this.margin.bottom ;

		this.graph_top = this.top;
		this.graph_left = this.left;
		
		
		this.queue = new Queue() ;
		this.excluded = [] ; //SD/ to store node who already displays neighbours
		this.input_links = [] ;
		
		this.svg = d3.select("#" + this.graph_id).append("svg")
			.attr("width", this.graph_width)
			.attr("height", this.graph_height);
		
		this.color = {	black:"black",
						blue:"#0088cc",
						grey:"grey"} ;
						
		this.endOfGraph = false ;
	}

	this.loadGraph = function(data, graph_id, max_size, max_depth, max_neighbours, width, height, top, left, video_switch) {
		//SD/ Set parameters in local vars
		this.input_nodes = data ;

		this.graph_id = graph_id ;
		this.height = height ;
		this.width = width ;
		this.top = top ;
		this.left = left ;
		
		this.max_size = max_size ;
		this.max_depth = max_depth ;
		this.max_neighbours = max_neighbours ;

		//SD/ Set optional parameters with default values in local vars
		this.video_switch = typeof video_switch !== 'undefined' ? video_switch : false;

		this.initVars();
		
		this.force = d3.layout.force()
			.linkDistance(150)
			.charge(-50)
			.gravity(0.01)
			.nodes(this.input_nodes)
			.links(this.input_links)
			.size([this.graph_width, this.graph_height])
			.on("tick", this.boundedTick.bind(this))
			.start();

		this.displayLinks();
		this.displayNodes();
	}
	
	this.updateGraph = function(new_data) {
		_this = this ;
		
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
		links = new_data['links'] ;
		if(typeof new_data['links'] !== undefined && new_data['links'] != null) {
			for (var s = 0; s < links.length; s++) {
				var target = this.find_node_index(links[s]['target']);
				var source = this.find_node_index(links[s]['source']);
				if (target!=-1 && source!=-1) {
					this.input_links.push({
						"target":target,
						"source":source,
						"depth":links[s]['depth'],
						"weight":links[s]['weight']
					 })
				}
				else{
					if (target == -1){
						console.log("Missing target node: "+links[s]['target'])
					}
					if (source == -1){
						console.log("Missing source node : "+links[s]['source'])
					}
				}
			}
		}

		this.displayLinks();
		this.displayNodes();
	
		this.force.start();
	}

	this.setCenter = function(d) {
		if(d.id == this.input_nodes[0]['id'] && this.video_switch == true) {
			get_graph() ;
			
		}
			
		else
			document.location.href = document.location.href.split("inevent_portal")[0] + "inevent_portal/hyperevent/" + d.id;
	}

	this.find_node_index = function(node_id) {
		for(var i=0; i < this.input_nodes.length; i++){
			if(parseInt(this.input_nodes[i].id) == parseInt(node_id)) {
				return i;
			}
		}
		return -1;
	}

	this.addNodeIfUnique = function(candidate_node) {
		for(var i=0; i < this.input_nodes.length; i++){
			if(parseInt(this.input_nodes[i].id) == parseInt(candidate_node.id)) {
				return ;
			}
		}
	
		this.input_nodes.push(candidate_node) ;
	}
	
	this.displayNodes = function() {

		var _this = this ;

		this.node = this.svg.selectAll(".node").data(this.input_nodes);
	
		this.nodeEnter = this.node.enter().append("svg:g");
		this.nodeEnter.attr("id", function(d) { return "node" + d.id;})
			.attr("class", "node")
			.on("click", function(d) {d3.event.stopPropagation(); _this.mouseover(d,"word_cloud_" + d.id,"video_title" + d.id); })
			.call(this.force.drag); //SD/ Enable Drag&Drop 

		this.defs = this.nodeEnter.append("defs") ;

		this.defs.append("rect")
			.attr("id", function(d) { return "rect_node" + d.id})
			.style("stroke-width", 4)
			.style("fill", "white") // Make the nodes hollow looking
			.attr("height", this.small_rect[1] - 10)
			.attr("width", this.small_rect[0])
			.style("stroke", function(d) {
				//SD/ Color in blue first node only
				color = _this.color.grey ;
				if(d.depth < 1) { color = _this.color.blue }
				return color ;
			})
			.attr("rx", "5")
			.attr('x', -this.small_rect[0] / 2)
			.attr('y', -this.small_rect[1] / 2 + 5);

		this.defs.append("svg:clipPath")
			.attr("id", function(d) { return "clip" + d.id})
			.append("use")
			.attr("xlink:href", function(d) { return "#rect_node" + d.id});

		this.nodeEnter.append("use")
			.attr("xlink:href", function(d) { return "#rect_node" + d.id});

		this.nodeEnter.append("image")
			.attr("id", function(d) { return "image" + d.id})
			.attr("xlink:href", function(d) { return d.snapshot_url })
			.attr("height", _this.small_rect[1])
			.attr("width", _this.small_rect[0])
			.attr("class", "graph_images")
			.attr('x', -this.small_rect[0] / 2)
			.attr('y', -this.small_rect[1] / 2)
			.attr("clip-path", function(d) { return "url(#"+"clip" + d.id +")"}) ;
		


		//SD/ Define window
		var rect = this.nodeEnter.append("rect")
			.attr("id", function(d) { return "rect"+d.id})
			.attr("class",  function(d) { return "word_cloud"+ " " + "word_cloud_"+d.id})
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

		this.nodeEnter.append("image")
			.attr("id", function(d) { return "cloud"+d.id})
			.attr("class",  function(d) { return "word_cloud"+ " " + "word_cloud_"+d.id})
			.attr("xlink:href", function(d) { return d.snapshot_url })
			.attr('x', -this.image_rect[0]/2)
			.attr('y', -this.image_rect[1]/2)
			.attr("height", this.image_rect[1])
			.attr("width", this.image_rect[0]);
		  //.attr("clip-path", function(d) { return "url(#"+"clip_zoom"+d.id +")"});

		/* Adapt node display depending on Web Browser */
		var browser = window.navigator.userAgent.toLowerCase();
		var version = window.navigator.appVersion;
		
		_this = this ;

		if ( (browser.indexOf("firefox")>-1) || ( (browser.indexOf("safari")>-1) && version>6)) {
			//Explorers who does not support the use of foreign objects in SVG

			this.nodeEnter.append('svg:foreignObject')
				.attr("id", function(d) { return "centralize"+d.id})
				.attr("class",  function(d) { return "word_cloud"+ " " + "word_cloud_"+d.id})
				.attr("height", 30)
				.attr("width", 80)
				.attr("color","#707070")
				//.attr("requiredExtensions","http://www.w3.org/1999/xhtml")
				.attr('x', -this.image_rect[0]/2)
				.attr('y', 90)
				.on("click", function(d) { d3.event.stopPropagation(); _this.setCenter(d);})
				.append("xhtml:body")
				.attr("xmlns","http://www.w3.org/1999/xhtml")
				.html('<button class="btn btn-small" value="btn" type="button"> <i class="icon-play"></i> Play</button> ');

			this.nodeEnter.append('svg:foreignObject')
				.attr("id", function(d) { return "close"+d.id})
				.attr("class",  function(d) { return "word_cloud"+ " " + "word_cloud_"+d.id})
				.attr("height", 30)
				.attr("width", 80)
				//.attr("requiredExtensions","http://www.w3.org/1999/xhtml")
				.attr('x', -this.image_rect[0]/2 + 180)
				.attr('y', 90)
				.on("click", function(d) {d3.event.stopPropagation(); mouseout(d,"word_cloud_"+d.id); return false})
				.append("xhtml:body")
				.attr("xmlns","http://www.w3.org/1999/xhtml")
				.html('<button class="btn btn-small" value="btn" type="button" ><b>[x]</b> Close</button>');
		}
		else {
			this.nodeEnter.append('image')
				.attr("id", function(d) { return "centralize"+d.id})
				.attr("class",  function(d) { return "word_cloud"+ " " + "word_cloud_"+d.id})
				.attr("height", 33)
				.attr("width",69)
				.attr('x', -this.image_rect[0]/2)
				.attr('y', 90)
				.on("click", function(d) { d3.event.stopPropagation(); _this.setCenter(d);})
				.attr("xlink:href", static_url + "inevent/images/play_button.png");

			this.nodeEnter.append('image')
				.attr("id", function(d) { return "close"+d.id})
				.attr("class",  function(d) { return "word_cloud"+ " " + "word_cloud_"+d.id})
				.attr("height", 33)
				.attr("width", 79)
				.attr('x', -this.image_rect[0]/2 + 180)
				.attr('y', 90)
				.on("click", function(d) {d3.event.stopPropagation(); mouseout(d,"word_cloud_"+d.id); return false})
				.attr("xlink:href", static_url + "inevent/images/close_button.png");
			}


		//SD/ Define title
		node_text = this.nodeEnter.append('text')
			.attr("id", function(d) { return "video_title"+d.id})
			.attr("height", 60)
			.attr("class",  function(d) { return "word_cloud"+ " " + "word_cloud_"+d.id})
			.attr("fill","#707070")
			.attr("width", this.image_rect[0])
			.attr('x', function(d) { return  -_this.image_rect[0]/2+10})
			.attr('y', function(d) { return -_this.big_rect[1]/2 + 10})
			.text("")

		//SD/TDOD : What is the purpose of this code ?
		this.nodeEnter.append("title")
			.text(function(d) { return d.title; });
			
		this.node.exit().remove();
	}

	this.displayLinks = function() {
		_this = this ;
		
		this.link = this.svg.selectAll(".link").data(this.input_links);
			this.linkEnter=this.link.enter().append("line")
			.attr("class", "link")
			.style("stroke-width",function(d) {return  d.weight})
			.style("stroke", function(d) { 
				//SD/ Color in blue links of first node only
				if(d.depth < 2) { return _this.color.blue } else { return _this.color.grey }
			})
			.attr("x1", function(d) { return d.source.x})
			.attr("y1", function(d) { return d.source.y})
			.attr("x2", function(d) { return d.target.x})
			.attr("y2", function(d) { return d.target.y});
		
		this.link.exit().remove();
		//SD/ Push lines to background
		//this.svg.selectAll(".link").moveToBack();
	}

	this.boundedTick = function() {
		node = this.svg.selectAll(".node");
		link = this.svg.selectAll(".link");
		var g = this;

		node.attr("cx", function(d) { return d.x; })
		node.attr("cy", function(d) { return d.y; })
		//	node.attr("cx", function(d) { return d.x = Math.max(g.small_rect[0], Math.min(g.graph_width - g.small_rect[0], d.x)); })
		//	node.attr("cy", function(d) { return d.y = Math.max(g.small_rect[1] - 10, Math.min(g.graph_height - g.small_rect[1] + 10, d.y)); })
		
		link.attr("x1", function(d) { return d.source.x; })
			.attr("y1", function(d) { return d.source.y; })
			.attr("x2", function(d) { return d.target.x; })
			.attr("y2", function(d) { return d.target.y; });

		node.attr("transform", function(d) {
			return "translate(" + d.x + "," + d.y + ")";
		});
	}
	
	this.getExcludedEvent = function() {
		return this.excluded ;
	}

	this.addExclusion = function(event_id) {
		if(typeof event_id != undefined)
			this.excluded.push(event_id) ;
	}

	this.isExcluded = function(id) {
		for(var i = 0 ; i < this.excluded.length ; i++) {
			if(id == this.excluded[i])
				return true ;
		}
		return false ;
	}

	this.setWidth = function(new_width) {
		this.width = new_width ;
		if (this.margin!=undefined) {
			this.graph_width = this.width - this.margin.left - this.margin.right ;
		
			this.svg.attr("width", this.graph_width) ;
			this.force.start();
		}
	}
	
	this.pickElement = function() {
		node = this.queue.firstQueue() ;
		this.queue.deQueue() ;
		
		return node[0] ;
	}
	
	this.addElement = function(nodes) {
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
	
	this.stillElement = function() {
		if(this.queue.sizeQueue() > 0)
			return true ;
		else
			return false ;
	}
	
	this.mouseover = function(d, display_class, title_id){
		if(this.endOfGraph && d != undefined) {
			zoom_in(d, "node" + d.id, "rect" + d.id, this.graph_left, this.graph_width, this.graph_top, this.graph_height, display_class);
			//display_title(d.title, "video_title" + d.id);
			return true ;
		}
		else
			return false ;
	}
	
	this.finalizeGraph = function() {
		console.log("End of queue after exclusion with " + this.input_nodes.length + " nodes") ;
		this.svg.selectAll(".link").moveToBack();
		this.endOfGraph = true ;
	}
}

function Queue() {
	this.queue = [] ;

	//SD/ Enqueue if not excluded
	this.enQueue = function(node) {
		if(typeof node !== undefined && node != null)
			this.queue.push(node) ;
	}
	
	this.deQueue = function() {
		this.queue.splice(0, 1) ;
	}
	
	this.firstQueue = function() {
		return [this.queue[0]] ;
	}

	this.sizeQueue = function() {
		return this.queue.length ;
	}
}

graph = new Graph();

/*SD/ ==========================================================================
Function called to display graph and get data
==============================================================================*/

function display_graph_error(error) {
	graph_data_fetched = false;
	$('#graph_button').html("Show as List")
	$('#graph').html('<div class="alert alert-error" style ="margin-top:100px;position:relative;margin-bottom:100px"> Unable to load graph. Please try again later.');
	$('#graph_button').prop('disabled', false);
}

//SD/ Initiate the first graph and call dynamically next data
function display_graph_head(data, video_switch, max_neighbours, max_depth, max_size) {
	if(data.length > 0)
	{
		graph_data_fetched = true;

		video_switch = typeof video_switch !== 'undefined' ? video_switch : false;
		max_neighbours = typeof max_neighbours !== 'undefined' ? max_neighbours : 5;
		max_depth = typeof max_depth !== 'undefined' ? max_depth : 2;
		max_size = typeof max_size !== 'undefined' ? max_size : 100;
	
		//SD/ Create first graph without any data
		$('#graph').html("");
		position = $('#graph').position();

		//SD/ Prepare queue for nodes
		for(var i=0 ; i < data.length ; i++)
			data[i]['depth'] = 0 ;

		graph.loadGraph(data, "graph", max_size, max_depth, max_neighbours, $("#graph_container").width(), 700, position['top'], position['left'], video_switch);

		graph.addElement(data)
		var first = graph.pickElement() ;
		
		params = {'event_id': first['id'], 'count': 1, 'depth': 1, 'num_of_similar': graph.max_neighbours, 'error_callback': display_graph_error} ;
		Dajaxice.inevent.get_graph_neighbours(function(data){display_graph(data, display_graph);}, params) ;

		//$('#graph_button').prop('disabled', false);
	}
	else
	{
		graph_data_fetched = true;
		$('#graph').html('<div class="alert alert-danger" style ="margin-top:100px;position:relative;margin-bottom:100px">Server error.<br>No data returned from server.</div>');
	}
}

//SD/ update graph with children data
function display_graph(data, callback) {

	if(data['nodes'] != undefined)
	{
		graph.addExclusion(data['caller_id']) ;
		graph.addElement(data['nodes']) ;
		
		//SD/ Graph node and prepare its links for next neighbours
		if(data['nodes'][0]['depth'] <= graph.max_depth || graph.max_depth == 6)
			graph.updateGraph({'nodes': data['nodes'], 'caller_id': data['caller_id'], 'links': data['links']}) ;

		//SD/ Check exclusion for next node
		if(graph.stillElement()) {
			var first = graph.pickElement() ;
			
			if(callback != undefined) {
				params = {'event_id': first['id'], 'count': data['count'] + 1, 'depth': first['depth'] + 1, 'num_of_similar': graph.max_neighbours, 'error_callback': display_graph_error} ;
				callback(
					Dajaxice.inevent.get_graph_neighbours(function(data){display_graph(data, display_graph); }, params)
				) ;
			}
		}
		else {
			graph.finalizeGraph() ;
		}
	}
}

//SD/ If windows is resized
$( window ).resize(function() {
	//SD/ adapt graph size with container width
	graph.setWidth($("#graph_container").width()) ;
});
