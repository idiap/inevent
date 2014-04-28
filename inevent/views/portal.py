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
   

