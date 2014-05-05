from dajaxice.decorators import dajaxice_register
from inevent.forms import IneventSearchForm
from inevent.pagination import Pagination
import requests
import json
import datetime
from inevent.views.utils import parse_hyperevent, get_most_recent_events, get_event, get_inEvent_data, get_similar_events, parse_hyperevents, check_user_login, do_user_register
from django.shortcuts import render_to_response
from django.template import RequestContext
from time import clock, time
import re
import datetime
from django.conf import settings


#################################IMPORTANT ################################################

# Do not forget to do a collectstatic to reflect changes

# An example of calling an ajax function registered with dajaxice from any view
# from dajaxice.core import dajaxice_functions
# dajaxice_functions.get('manage.call_inevent_search').call(request, post_data)

# To do the same from a console, add first these two lines:
# from dajaxice.core import dajaxice_autodiscover
# dajaxice_autodiscover()


# An example of calling an ajax function registered with dajaxice from a template
# Dajaxice.manage.call_inevent_search(post_data)

###########################################################################################

@dajaxice_register
def get_transcript(request,transcript_url):
    print transcript_url
#    sample: http://srv-inevent.haifa.il.ibm.com/rest/retrieval/getTrackFile/transcript.srt?trackId=1733
    data = {}
    try:
        response = requests.get(transcript_url)
        transcripts = srt_to_dict(response.content)
        data = {"transcripts": transcripts}      
    except:
        data = {'error':'could not get data'}     
    template = 'inevent/transcripts.html'

    return render_to_response(template, data, context_instance=RequestContext(request)).content

@dajaxice_register
def graph_related_talks(request,event_id):
    print event_id
    event = get_event(event_id,False,True)
    event = data_convert([event])[0]
    event['similar_events'] = data_convert(event['similar_events'])
    events = [event]
    if event.has_key('similar_events'):
        related_events = event['similar_events']
        for related_event in related_events:
            if related_event['event'] not in events:
                if related_event['event'].has_key('date'):
                    related_event['event']['date'] = related_event['event']['date_ms']
                events.append(related_event['event'])                 
    return json.dumps(events)


@dajaxice_register
def get_recommendations(request,event_id):
    data = {}
    returned_data = get_similar_events(event_id, 10)
    if returned_data.has_key('links'):
        hyperevents = parse_hyperevents(returned_data['links'], True, False)
        data = {"hyperevents": hyperevents}      
    template = 'inevent/recommended_events.html'
    return render_to_response(template, data, context_instance=RequestContext(request)).content

#SD/Get last events (by default 10 last)
@dajaxice_register
def get_graph_head(request,num_of_events=5):
	response = get_most_recent_events(num_of_events, True, False)
	all_events = []
	if response.has_key('hyperevents'):
		all_events = date_convert(response['hyperevents'])
	return json.dumps(all_events)

#SD/ Get one specific event
@dajaxice_register
def get_event_head(request, id):
    response = get_event(id, only_basic_info=True, graph_mode=False, raw_data=False)
    response = date_convert([response])
    return json.dumps(response)

#SD/ Get event neighbours
@dajaxice_register
def get_graph_neighbours(request, event_id, count, depth, num_of_similar=4):
    returned_data = get_similar_events(event_id, num_of_similar)
    new_links = []
    all_events = []
    if returned_data.has_key('links'):
        hyperevents = parse_hyperevents(returned_data['links'], True, False)
        for event in hyperevents:
            new_links.append({"target": str(event['id']), "source": str(event_id), "weight": str(event['relevance']), "depth": str(depth)})
    
        all_events = date_convert(hyperevents)

        #add depth
        for i in range(0, len(all_events)):
            all_events[i]['depth'] = depth
    
    output = {'caller_id':event_id, 'count':count, 'depth':depth, 'nodes':all_events,'links':new_links}
    
    return json.dumps(output)

#SD/ Convert dates for json export
def date_convert(all_events):
    if len(all_events) == 0:
        return []
    elif all_events[0].has_key("linkedEvent"):
        for i in range(0, len(all_events)):
            if all_events[i].has_key("date") and type(all_events[i]['linkedEvent']['date']) == datetime.datetime:
                all_events[i]['linkedEvent']['date'] = all_events[i]['linkedEvent']['date_ms']
    else:
        for i in range(0, len(all_events)):
            if  all_events[i].has_key("date") and type(all_events[i]['date']) == datetime.datetime:
                all_events[i]['date'] = all_events[i]['date_ms']
    
    return all_events

def _get_events(events,events_to_add,ids):
    new_events = []
    for event in events:
        if event['id'] not in ids:
            events_to_add.append(event)
            ids.append(event['id'])  
        if event.has_key('similar_events'):
            breadth = 0
            for ev in event['similar_events']:
                breadth = breadth + 1
                t = ev['event']  
                if t is not None and t.has_key('id'):
                    if breadth < 4 and t['id'] not in ids:
                        e = get_event(t['id'], False, True)
                        new_events.append(e)
                        events_to_add.append(e)
                        ids.append(t['id'])             
    return [new_events,events_to_add, ids]
    

#code to parse srt script slightly from: http://stackoverflow.com/questions/2616766/parsing-srt-subtitles
def srt_time_to_seconds(time):

#   Sample: 00:00:03,000
    split_time=time.split(',')
    major, minor = (split_time[0].split(':'), split_time[1])
#    1440 minutes: 60*24
    return int(major[0])*1440 + int(major[1])*60 + int(major[2]) + float(minor)/1000

def srt_to_dict(srtText):
#    before_capital = '.?'
    transcripts=[]
    first_line = True
    for s in re.sub('\r\n', '\n', srtText).split('\n\n'):
        st = s.split('\n')
#        st look like : ['1', '00:00:00,000 --> 00:00:03,000', 'I coined my own definition of success']
        if len(st)>=3:
            #  work around for klewel srt transcript files that are sent with an extra line
            if (st[0]==''):
                print 'additional line in parsed string'
                split = st[2].split(' --> ')
                index = 3
            else:
                split = st[1].split(' --> ')
                index = 2
            value = ''.join(j for j in st[index:len(st)])    
           
#            work around for klewel transcripts that are sent with all letters in uppercase..
                
#            way to know it is klewel so we don't change TED talks wich are done well with punctuation
                
            if (value.isupper()):
                if first_line:
                    value = value.capitalize()
                else:
                    value = value.lower()
#            if value[0] in before_capital: don't use that as there are some cases in klewel like: ca. b.
#                capitalize = True    
#            else:
#                capitalize = False    
            first_line = False
            transcripts.append({'startTime': srt_time_to_seconds(split[0].strip()),
            'end': srt_time_to_seconds(split[1].strip()),
            'value': value
            })
    return transcripts

@dajaxice_register
def call_inevent_search(request,form,page_num = 1):
    data = {}
    limit = 10
    choices=[(0, 'Everywhere'),(1, 'Klewel'), (2, 'Radvision'), (3, 'TED')]
  
    search_form = IneventSearchForm(form, choices=choices)

    if search_form.is_valid():
#        print "valid"
        input = search_form.cleaned_data
        keywords = input['q']
        chosen = input['searchable']
        speaker = input['speaker']
        title = input['title']
        start_date = input['start_date']
        end_date = input['end_date']

        post_data = {} # parameters should be passed in json format, this is why the braces have been added
        if (chosen!='0' and len(chosen)!=0):
            providerName = choices[int(chosen)][1]
            post_data['providerName'] = providerName
        if (speaker!=None and len(speaker)!=0):    
            post_data['speaker'] = speaker
        if (title!=None and len(title)!=0):    
            post_data['title'] = title
        if (start_date!=None): 
            post_data['start_date'] = start_date.strftime('%s.%f')
        if (end_date!=None):
            post_data['end_date'] = end_date.strftime('%s.%f')   

 
        if keywords!=None:
            if int(page_num) == 1:
                first = 0
            else:
                first = (limit * int(page_num)) - 1 
            post_data.update({"firstResult":first, "maxResults": limit, "orderBy":"DATE", "asc":"false"})

            url = "searchHyperEvents?" + "searchQuery="+keywords  
            returned_data = get_inEvent_data(url, json.dumps(post_data))
            if returned_data.has_key('hyperEvents'):
                hyperevents = parse_hyperevents(returned_data['hyperEvents'], False, False)
                count = returned_data['count']
                pagination = Pagination(count, limit)
                pagination.page(int(page_num))
                data = {'hyperevents':hyperevents, 'keywords':keywords, 'count':count, 'pagination':pagination, 'searchable':chosen}
            else:
                data = {'error_callback':"Search request can't be performed. Please try again later"}
    else:
        data = {'error_callback':dict(search_form.errors)}
    template = 'inevent/search_results.html'
    return render_to_response(template, data, context_instance=RequestContext(request)).content

@dajaxice_register(method='GET')
def user_login(request, login, password):
    result = check_user_login(login, password)
    if not result.has_key('error'):
        request.session['login'] = result['login']
        request.session['firstname'] = result['firstName']
        request.session['lastname'] = result['lastName']
    return json.dumps(result)

@dajaxice_register(method='GET')
def user_logout(request):
    try:
        del request.session['login']
        del request.session['firstname']
        del request.session['lastname']
    except KeyError:
        pass
    return json.dumps({})

@dajaxice_register(method='POST')
def user_register(request, *args, **kwargs):
    result = do_user_register(kwargs)
    return json.dumps(result)
