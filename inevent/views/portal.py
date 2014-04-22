from django.shortcuts import render_to_response
from django.template import RequestContext
from inevent.forms import IneventSearchForm
from django.shortcuts import render_to_response
import datetime
import json
from inevent.views.utils import get_most_recent_events, get_event


from django.conf import settings
from inevent.views.extract_slides import extract_slides, extract_title


def portal(request,num_of_events=10):
	choices=[(0, 'All'),(1, 'Klewel'), (2, 'Radvision'), (3, 'TED')]
	response= get_most_recent_events(num_of_events, False, False)
	form = IneventSearchForm(choices=choices)
	if response.has_key('hyperevents'):
		most_recent_events = response['hyperevents']
		most_recent_events =  sorted(most_recent_events, key=lambda event: event['date'], reverse=True)	
	else:
		most_recent_events = []	
	data = {'search_form':form, 'hyperevents':most_recent_events}
	template = 'inevent/portal.html'
	return render_to_response(template, data, context_instance=RequestContext(request))

def get_hyperevent(request,id):
	response = get_event(id,False)
	choices=[(0, 'All'),(1, 'Klewel'), (2, 'Radvision'), (3, 'TED')]
	form = IneventSearchForm(choices=choices)
	if response.has_key('id'):
		  data = {'hyperevent':response, 'search_form':form}
	else:
		  data = {'error':"Something went wrong"}	
	
	data['search_form'] = form
	template = 'inevent/hyperevent_content.html'
	return render_to_response(template, data, context_instance=RequestContext(request)) 
   
def add_video_segments(video, video_node_id, segment_group, segment_size, segments, nodes, segment_id_converter, cloud_size, image_ratio,segment_start_time):

	first_segment = True
	for segment in segments:
#		nodes.append(new_node)
#		links.append({"source":new_node['id'],"target":unique_id,"value":1,"group":"3"})
#		links.append({"source":new_node['id'],"target":current_video_id,"value":1,"group":"3"})
#		unique_id = unique_id + 1
		segment_id = segment['segment_id']
#		print "segment " + str(segment_id) + "for parent node " + str(video['video_id']) 
		test = float (segment_size * image_ratio[1])

		segment_id_converter.update({""+str(segment_id):len(nodes)})
		new_node = {"group":segment_group, "size": segment_size, "image_width": segment_size * image_ratio[0], "image_height":  segment_size * image_ratio[1], "parent": video_node_id, "id":len(nodes), "cloud_width": cloud_size[0], "cloud_height": cloud_size[1], "word_cloud":"inevent/images/"+str(segment['word_cloud']), "snapshot":"inevent/images/"+str(segment['thumbnail']), "name":"segment"+str(segment_id)}
		new_node.update({'start_time': segment_start_time[segment_id]})
		new_node.update({'duration': segment['segment_duration_size']})
#		first segment to be added
		#in case first segment in the array is not the one with the smallest ids
		if first_segment == True:
#			if int(segment['segment_id']) == int(video['video_seg_id_range'][0]): 
			nodes[video_node_id].update({'children':[new_node]})
			first_segment = False
		else:
			nodes[video_node_id]['children'].append(new_node)
		nodes.append(new_node)	
	return [nodes, segment_id_converter]

