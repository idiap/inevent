function display_title(node_title, title_id) {
	//this method has been done because without using foreign objects (not supported by all browsers)
	//vg provides no way of wrapping a text within a object so I use tspan to go to a new line..
	if (node_title == undefined)
		node_title = ("Unknown Title")
	var node = d3.select("#" + title_id)
	node.text("");

	var words = node_title.split(" ") ;
	var length = node_title.length ;
	var line_count = 1 ;
	var temp_text = "" ;
	var line_space = 15 ;
	var offset = (30 - (line_space * (line_count - 1))) / 2 ;

	node.append("tspan").text("") ;

	for (var i = 0; i < length; i++) {
		if (words[i] != undefined) {
			old_text = temp_text ;
			temp_text = temp_text + ' ' + words[i] ;
			element = d3.selectAll("#" + title_id + " tspan") ;
			last = element.size() - 1 ;

			//SD/ Write the text in the last tspan
			d3.select(element[0][last]).text(temp_text.trim()).attr("x", $("#" + title_id).attr("x")).attr("dy", line_space) ;
			d3.select(element[0][0]).attr("dy", offset) ;

			//SD/ If necessary, write a new line
			//SD/ The last substraction (value 95) is the thumbnail image
			if (document.getElementById(title_id).getBBox().width > $("#" + title_id).attr("width") - 95) {
				//SD/ Update data before new line
				line_count++ ;
				offset = (30 - (line_space * (line_count - 1))) / 2 ;
				d3.select(element[0][last]).text(old_text.trim()) ;

				//SD/ Write the new line with last word
				temp_text = words[i] ;
				node.append("tspan").text(temp_text).attr("x", $("#" + title_id).attr("x"));

				//SD/ Redistribute line position depending on line quantity
				$("#" + title_id + " tspan").each(function( index ) {
					$( this ).attr("dy", line_space) ;
				});
				d3.select(element[0][0]).attr("dy", offset) ;
			}
		}

	}
	
	//if (temp_text.length > 1) {
	//	node.append("tspan").text(temp_text.trim()).attr("x", $("#" + title_id).attr("x")).attr("dy", "15");
	//}
}

function zoom_in(d,ref_id, rect_id, min_x, max_x, min_y, max_y,display_class) {
	shift_rect(ref_id, rect_id, min_x, max_x, min_y, max_y, display_class);
	$("." + display_class).each(function() {
		$("#" + this.id).show();
	});
	
	$("#image" + d.id).hide() ;
	d3.selectAll("." + display_class).moveToFront(true);
}

function mouseout(d, display_class) {
	$("." + display_class).each(function() {
		$("#" + this.id).hide();
		$("#image" + d.id).show() ;
});

}

d3.selection.prototype.moveToFront = function(redraw_parent) {
	if (redraw_parent == true)
		return this.each(function() {
			this.parentNode.parentNode.appendChild(this.parentNode);
		});
	else
		return this.each(function() {
			this.parentNode.appendChild(this);
		});

};

d3.selection.prototype.moveToBack = function() {
	return this.each(function() {
		// Unfortunately, prependChild() doesn't exist:
		// http://blogs.adobe.com/cantrell/archives/2011/11/adding-prependchild-to-element.html
		this.parentNode.insertBefore(this, this.parentNode.firstChild);
	});
};
function shift_rect(ref_id, rect_id, min_x, max_x, min_y, max_y, class_name) {
	// min_y document.getElementById("rec_graph").style.marginTop  and deduct px
	// max_y : height of rect + height of video
	

  	ref_node = $("#"+ref_id);
  	rect_node = $("#"+rect_id);
  	
	var node_position = ref_node.position()
	var rect_position = rect_node.position()

	var left = parseFloat(node_position['left'])

	var top = parseFloat(node_position['top'])

	var rect_x = parseFloat(rect_node.attr("x"))

	var rect_y = parseFloat(rect_node.attr("y"))

	var rect_width = parseFloat(rect_node.attr("width"))

	var rect_height = parseFloat(rect_node.attr("height"))

	var shift_x = 0;

	var shift_y = 0;

	if (node_position != undefined) {
		// assumes that the rect inside the node, have the same center position
		//this means that the rectangle relative position to the center node is: -half/rectangle width

		absolute_position_x = left + rect_x
		absolute_position_y = top + rect_y
		if (absolute_position_x < min_x) {
			//make it start at the edge of the node instead of it's center,
			//like this it is shifted inside the svg but the parent node hidden on popup
			shift_x = Math.abs(absolute_position_x)

		} else if (absolute_position_x + rect_width > max_x) {

			shift_x = max_x - (absolute_position_x + rect_width) - 10

		}

		if (absolute_position_y + rect_height > max_y) {

			shift_y = max_y - (absolute_position_y + rect_height)

		} 
		else if (absolute_position_y < min_y) {

			shift_y = Math.abs(min_y - absolute_position_y)

		}
	
	}
	
	
	shift_elements([shift_x, shift_y],class_name)
} 


 function shift_elements(shift, class_name){
  	$("." + class_name).each(function() {
  		new_x = parseFloat($("#" + this.id).attr('x')) + shift[0]
  		new_y = parseFloat($("#" + this.id).attr('y')) + shift[1]
  		
  		$("#" + this.id).attr({"x": new_x , "y": new_y});
  	});
 }
